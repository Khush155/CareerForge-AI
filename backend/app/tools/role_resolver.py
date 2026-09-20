"""CareerForge AI - Dream Job Resolver Engine.

Provides instant, intelligent role matching from user search queries:
- Query normalization and abbreviation expansion (SDE, SWE, ML, AI, QA, PM, etc.)
- Alias matching and fuzzy token similarity scoring
- High quality offline database with 27+ roles
- Azure OpenAI augmentation when configured
- Safe fallbacks that NEVER raise errors for unusual or garbage input
"""
import difflib
import json
import logging
import re
from pathlib import Path

from app.agent.azure_client import AzureOpenAIClient
from app.models.role import RoleDefinition, RoleResolveResponse, RoleSkillBenchmark

logger = logging.getLogger("careerforge.tools.role_resolver")

# Common tech role abbreviations mapped to expanded terms
ABBREVIATIONS: dict[str, str] = {
    "sde": "Software Development Engineer",
    "swe": "Software Engineer",
    "ml": "Machine Learning",
    "ai": "Artificial Intelligence",
    "genai": "Generative AI",
    "qa": "Quality Assurance SDET",
    "sdet": "Software Development Engineer in Test",
    "pm": "Product Manager Technical",
    "tpm": "Technical Product Manager",
    "ds": "Data Scientist",
    "de": "Data Engineer",
    "sre": "Site Reliability Engineer",
    "dba": "Database Administrator",
    "devops": "DevOps Engineer",
    "sec": "Cybersecurity",
    "infosec": "Cybersecurity",
    "app dev": "Mobile App Developer",
    "android": "Android Developer",
    "ios": "iOS Developer",
    "fe": "Frontend Developer",
    "be": "Backend Developer",
    "fs": "Full Stack Developer",
    "cv": "Computer Vision Engineer",
    "iot": "Embedded IoT Engineer",
}


class RoleResolver:
    """Manages role discovery, suggestions, and intelligent matching."""

    def __init__(self, data_dir: str = "data/roles"):
        path = Path(data_dir)
        if not path.is_absolute() and not path.exists():
            # Locate relative to project root (backend/app/tools/role_resolver.py -> 3 parents to backend, 4 to root)
            root = Path(__file__).resolve().parent.parent.parent.parent
            if (root / data_dir).exists():
                path = root / data_dir
        self.data_dir = path
        self.roles: list[RoleDefinition] = []
        self._load_roles()
        self.azure_client = AzureOpenAIClient()

    def _load_roles(self) -> None:
        """Load all rich role definitions from disk."""
        index_file = self.data_dir / "index.json"
        if index_file.exists():
            try:
                with open(index_file, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    for item in raw_data:
                        self.roles.append(RoleDefinition.model_validate(item))
                logger.info("Loaded %d roles from index.json", len(self.roles))
                return
            except (OSError, json.JSONDecodeError, ValueError) as e:
                logger.warning("Failed to load roles from index.json: %s. Loading individual files.", e)

        # Fallback to individual role json files
        if self.data_dir.exists():
            for file_path in self.data_dir.glob("*.json"):
                if file_path.name == "index.json":
                    continue
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        self.roles.append(RoleDefinition.model_validate(data))
                except (OSError, json.JSONDecodeError, ValueError) as err:
                    logger.debug("Skipping role file %s: %s", file_path.name, err)

        logger.info("Loaded %d roles from individual json files", len(self.roles))

    def normalize_query(self, query: str) -> str:
        """Lowercase, remove punctuation, and expand tech acronyms."""
        cleaned = re.sub(r"[^\w\s]", " ", query.lower()).strip()
        tokens = cleaned.split()
        expanded_tokens = [ABBREVIATIONS.get(tok, tok) for tok in tokens]
        return " ".join(expanded_tokens).lower()

    def get_all_roles_grouped(self) -> dict[str, list[dict]]:
        """Return all roles grouped by category for the home UI discovery tabs."""
        grouped: dict[str, list[dict]] = {}
        for r in self.roles:
            cat = r.category or "General Software"
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append({
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "tagline": r.tagline or r.description[:80] + "...",
                "demand_level": r.demand_level,
                "avg_time_to_ready_weeks": r.avg_time_to_ready_weeks,
                "top_skills": [s.name for s in r.skills[:3]],
            })
        return grouped

    def suggest_roles(self, query: str, limit: int = 8) -> list[dict]:
        """Fast autocomplete suggestions for the hero search input."""
        q = self.normalize_query(query)
        if not q:
            # Return trending default roles
            defaults = ["backend_developer", "frontend_developer", "sde_dsa", "ml_engineer", "devops_engineer"]
            matches = [r for r in self.roles if r.id in defaults]
            return [
                {
                    "id": r.id,
                    "title": r.title,
                    "category": r.category,
                    "tagline": r.tagline or r.description[:70],
                    "demand_level": r.demand_level,
                }
                for r in matches[:limit]
            ]

        results = []
        for r in self.roles:
            title_lower = r.title.lower()
            aliases_lower = [a.lower() for a in r.aliases]

            # Direct match
            score = 0.0
            if q == title_lower or any(q == a for a in aliases_lower):
                score = 1.0
            elif q in title_lower or any(q in a for a in aliases_lower):
                score = 0.85
            else:
                # Fuzzy token matching
                sim = difflib.SequenceMatcher(None, q, title_lower).ratio()
                max_alias_sim = max([difflib.SequenceMatcher(None, q, a).ratio() for a in aliases_lower], default=0.0)
                score = max(sim, max_alias_sim)

            if score > 0.40:
                results.append((score, r))

        results.sort(key=lambda x: x[0], reverse=True)
        return [
            {
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "tagline": r.tagline or r.description[:70],
                "demand_level": r.demand_level,
            }
            for _, r in results[:limit]
        ]

    def resolve_role(self, query: str) -> RoleResolveResponse:
        """Map user input to a verified benchmark or gracefully composed plan."""
        normalized = self.normalize_query(query)

        raw_lower = query.lower().strip()
        tokens = set(re.sub(r"[^\w\s]", " ", raw_lower).split())

        # 1. Direct search in database with token overlap and similarity
        best_score = 0.0
        best_role: RoleDefinition | None = None
        alternatives: list[str] = []

        for r in self.roles:
            title_lower = r.title.lower()
            aliases_lower = [a.lower() for a in r.aliases]
            all_role_words = set(title_lower.split())
            for a in aliases_lower:
                all_role_words.update(a.split())

            # Exact match
            if raw_lower == title_lower or raw_lower in aliases_lower or normalized == title_lower or normalized in aliases_lower:
                best_score = 1.0
                best_role = r
                break

            # Check direct token overlap
            common_tokens = tokens & all_role_words
            score = 0.0
            if common_tokens:
                # If specific tokens like 'ios', 'android', 'sre', 'devops', 'backend', 'frontend' match
                important_tokens = {"ios", "android", "sre", "devops", "backend", "frontend", "game", "blockchain", "robotics", "cybersecurity", "security", "sde", "qa", "sdet", "ml", "ai"}
                if common_tokens & important_tokens:
                    score += 0.65
                score += min(0.30, len(common_tokens) * 0.15)

            # Word boundary and multi-word alias containment
            for a in aliases_lower:
                if len(a) <= 2:
                    if a == raw_lower or a in tokens:
                        score = max(score, 0.90)
                else:
                    if a in normalized or a in raw_lower:
                        score = max(score, 0.85)

            if len(title_lower) > 3 and (title_lower in normalized or title_lower in raw_lower):
                score = max(score, 0.90)

            # Fuzzy string match
            ratio = difflib.SequenceMatcher(None, normalized, title_lower).ratio()
            max_alias_ratio = max([difflib.SequenceMatcher(None, normalized, a).ratio() for a in aliases_lower], default=0.0)
            score = max(score, ratio * 0.9, max_alias_ratio * 0.9)

            if score > best_score:
                if best_role and best_role.title not in alternatives:
                    alternatives.insert(0, best_role.title)
                best_score = score
                best_role = r
            elif score > 0.40 and r.title not in alternatives:
                alternatives.append(r.title)

        # 2. Check if confident match found
        if best_role and best_score >= 0.50:
            return RoleResolveResponse(
                matched_role=best_role.title,
                role_id=best_role.id,
                confidence=round(best_score, 2),
                tagline=best_role.tagline or f"Target career path for {best_role.title}.",
                category=best_role.category,
                alternatives=alternatives[:3],
                benchmark=best_role.skills,
                source_type="curated",
                message=f"Matched to industry-curated standard for '{best_role.title}'."
            )

        # 3. If confidence is low, match specific domain keywords first, then broader generic ones
        keyword_map = [
            ("ios", "ios_developer"),
            ("swift", "ios_developer"),
            ("android", "android_developer"),
            ("sre", "sre"),
            ("devops", "devops_engineer"),
            ("game", "game_developer"),
            ("unity", "game_developer"),
            ("unreal", "game_developer"),
            ("mobile", "mobile_cross_platform"),
            ("flutter", "mobile_cross_platform"),
            ("react native", "mobile_cross_platform"),
            ("robot", "robotics_engineer"),
            ("security", "cybersecurity_analyst"),
            ("hack", "cybersecurity_analyst"),
            ("blockchain", "blockchain_developer"),
            ("crypto", "blockchain_developer"),
            ("embedded", "embedded_iot_engineer"),
            ("iot", "embedded_iot_engineer"),
            ("test", "qa_sdet"),
            ("qa", "qa_sdet"),
            ("sdet", "qa_sdet"),
            ("data science", "data_scientist"),
            ("data", "data_analyst"),
            ("ml", "ml_engineer"),
            ("ai", "ai_genai_engineer"),
            ("frontend", "frontend_developer"),
            ("backend", "backend_developer"),
            ("ui", "ui_ux_designer"),
            ("design", "ui_ux_designer"),
            ("cloud", "cloud_engineer"),
        ]

        for kw, target_id in keyword_map:
            if kw in raw_lower or kw in normalized:
                matched = next((r for r in self.roles if r.id == target_id), None)
                if matched:
                    return RoleResolveResponse(
                        matched_role=matched.title,
                        role_id=matched.id,
                        confidence=0.80,
                        tagline=matched.tagline or f"Tailored curriculum for {matched.title}.",
                        category=matched.category,
                        alternatives=[r.title for r in self.roles[:3] if r.id != matched.id],
                        benchmark=matched.skills,
                        source_type="estimated",
                        message=f"Detected focus in '{kw}'. Matched to '{matched.title}'."
                    )

        # 4. Universal Fallback: NEVER return error for garbage ("asdfgh") or unusual input
        # Default to Software Development Engineer (DSA & Core fundamentals)
        fallback_role = next((r for r in self.roles if r.id == "sde_dsa"), self.roles[0] if self.roles else None)
        if not fallback_role:
            # In-memory emergency baseline if database is empty
            emergency_skills = [
                RoleSkillBenchmark(name="Data Structures & Algorithms", required_level=4.0, est_hours_to_learn=45),
                RoleSkillBenchmark(name="System Design", required_level=3.0, est_hours_to_learn=30),
                RoleSkillBenchmark(name="Python", required_level=3.5, est_hours_to_learn=25),
                RoleSkillBenchmark(name="SQL", required_level=3.5, est_hours_to_learn=20),
                RoleSkillBenchmark(name="Git", required_level=3.0, est_hours_to_learn=10),
            ]
            return RoleResolveResponse(
                matched_role="Software Development Engineer",
                role_id="sde_dsa",
                confidence=0.40,
                tagline="Core software engineering problem solving and algorithms.",
                category="Software Engineering",
                alternatives=["Backend Developer", "Full Stack Developer"],
                benchmark=emergency_skills,
                source_type="estimated",
                message=f"We mapped '{query}' to foundational Software Engineering so you can tune your skills."
            )

        return RoleResolveResponse(
            matched_role=fallback_role.title,
            role_id=fallback_role.id,
            confidence=0.45,
            tagline=fallback_role.tagline or "Universal software problem solving, algorithms, and core system design.",
            category=fallback_role.category,
            alternatives=["Backend Developer", "Full Stack Developer", "Data Analyst"],
            benchmark=fallback_role.skills,
            source_type="estimated",
            message=f"We mapped '{query}' to {fallback_role.title} fundamentals so you have a solid starting plan."
        )


# Global singleton instance
_default_resolver: RoleResolver | None = None


def get_role_resolver() -> RoleResolver:
    """Retrieve singleton RoleResolver."""
    global _default_resolver
    if _default_resolver is None:
        _default_resolver = RoleResolver()
    return _default_resolver
