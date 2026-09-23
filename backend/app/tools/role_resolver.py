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
    "cv": "Computer Vision Engineer",
    "iot": "Embedded IoT Engineer",
    "eng": "Engineer",
    "dev": "Developer",
    "machin": "Machine",
    "learnng": "Learning",
    "mle": "Machine Learning Engineer",
}

# Common occupational markers indicating a genuine career inquiry
COMMON_OCCUPATIONAL_MARKERS: set[str] = {
    "engineer", "engineering", "developer", "development", "dev", "eng",
    "designer", "design", "architect", "architecture", "consultant", "consulting",
    "specialist", "expert", "lead", "manager", "management", "director",
    "officer", "administrator", "admin", "analyst", "analytics", "scientist",
    "researcher", "intern", "associate", "technician", "doctor", "physician",
    "surgeon", "nurse", "nursing", "dentist", "pharmacist", "radiologist",
    "lawyer", "advocate", "attorney", "accountant", "auditor", "trader",
    "banker", "writer", "editor", "pilot", "mechanic", "electrician",
    "chef", "cook", "cooking", "baker", "barista", "sommelier", "culinary",
    "plumber", "carpenter", "welder", "machinist", "technologist",
    "artist", "teacher", "professor", "instructor", "therapist",
    "operator", "coordinator", "agent", "executive", "representative", "specialized"
}

# Broad umbrella terms that warrant guiding the student toward specialized disciplines
BROAD_ROLE_GUIDANCE: dict[str, dict] = {
    "engineer": {
        "title": "Engineering Umbrella",
        "category": "Engineering & Technology",
        "guidance": " 'Engineer' is a broad domain spanning diverse engineering disciplines. We've matched you to foundational Software Engineering, and recommend selecting a specialized branch below.",
        "suggested_roles": [
            "Software Development Engineer",
            "DevOps Engineer",
            "Machine Learning Engineer",
            "Data Engineer",
            "Cloud Infrastructure Engineer",
            "Frontend Developer",
            "Backend Developer",
        ],
    },
    "developer": {
        "title": "Software Development Track",
        "category": "Software Engineering",
        "guidance": " 'Developer' covers multiple tech stacks. We've loaded the Full Stack Developer curriculum as a standard foundation; select your preferred specialization below.",
        "suggested_roles": [
            "Full Stack Developer",
            "Backend Developer",
            "Frontend Developer",
            "Mobile App Developer",
            "Game Developer",
        ],
    },
    "doctor": {
        "title": "Medical Practice Track",
        "category": "Medicine & Healthcare",
        "guidance": " 'Doctor' encompasses diverse medical branches. We've prepared a clinical physician track; choose your targeted specialty below.",
        "suggested_roles": [
            "Cardiologist",
            "Medical Physician",
            "Orthopedic Surgeon",
            "Pediatrician",
            "Radiologist",
        ],
    },
    "analyst": {
        "title": "Analytics & Intelligence Track",
        "category": "Data & Analytics",
        "guidance": " 'Analyst' spans multiple domains. Which analytical focus are you aiming for?",
        "suggested_roles": [
            "Data Analyst",
            "Business Analyst",
            "Financial Analyst",
            "Cybersecurity Analyst",
            "Quantitative Analyst",
        ],
    },
    "manager": {
        "title": "Management & Leadership Track",
        "category": "Management & Strategy",
        "guidance": " 'Manager' covers product, technical, and operational functions. Which leadership domain are you targeting?",
        "suggested_roles": [
            "Product Manager",
            "Engineering Manager",
            "Project Manager",
            "Operations Manager",
        ],
    },
    "scientist": {
        "title": "Data Science & Research Track",
        "category": "Data Science & Research",
        "guidance": " 'Scientist' covers empirical research and data science disciplines. Which scientific branch are you pursuing?",
        "suggested_roles": [
            "Data Scientist",
            "Machine Learning Engineer",
            "Research Scientist",
            "Bioinformatics Scientist",
        ],
    },
    "designer": {
        "title": "Design & User Experience Track",
        "category": "Design & Creative",
        "guidance": " 'Designer' covers interface, visual, and architectural design. Which creative specialization are you targeting?",
        "suggested_roles": [
            "UI/UX Designer",
            "Product Designer",
            "Graphic Designer",
            "Motion Designer",
        ],
    },
}


def is_gibberish_query(text: str) -> bool:
    """Detect keyboard mashing, impossible consonant clusters, or random non-words."""
    cleaned = re.sub(r"[^\w\s]", " ", text.lower()).strip()
    if not cleaned:
        return True

    tokens = cleaned.split()
    if not tokens:
        return True

    # Known single, double, or triple letter tech acronyms
    valid_acronyms = {
        "sde", "swe", "qa", "sre", "devops", "ml", "ai", "nlp", "cv", "db", "pm",
        "tpm", "ds", "de", "dba", "ui", "ux", "hr", "ceo", "cto", "cfo", "cio",
        "cpo", "vp", "dsa", "seo", "sem", "pr", "it", "bi", "cad", "cam"
    }

    mash_patterns = [
        "asdf", "sdfg", "dfgh", "fghj", "ghjk", "hjkl",
        "qwerty", "werty", "ertyu", "rtyui", "tyuio", "yuio",
        "zxcv", "xcvb", "cvbn", "vbnm", "qazwsx", "edcrfv", "123456"
    ]

    for word in tokens:
        if word in valid_acronyms:
            continue

        # Word too short and not a known preposition/acronym
        if len(word) <= 2 and word not in {"in", "to", "of", "and", "or", "on"}:
            if len(tokens) == 1:
                return True

        # Keyboard walk / mash sequences
        if any(p in word for p in mash_patterns):
            return True

        # Repeated characters (e.g. 'zzzzz', 'aaaa') or repeated syllables ('svsvsv', 'ababab')
        if re.search(r"([a-z])\1{2,}", word):
            return True
        if re.search(r"([a-z]{2,3})\1{2,}", word):
            return True

        # 5+ consecutive consonants (almost non-existent in authentic career titles)
        consonant_exceptions = {"lengths", "strengths", "twelfths"}
        if word not in consonant_exceptions and re.search(r"[bcdfghjklmnpqrstvwxz]{5,}", word):
            return True

        # Vowel frequency checks
        vowels = sum(1 for c in word if c in "aeiouy")
        if len(word) >= 4 and vowels == 0:
            return True
        if len(word) >= 6 and (vowels / len(word) < 0.15 or vowels / len(word) > 0.85):
            return True

    return False


def is_plausible_job_title(text: str) -> bool:
    """Check if query contains recognizable occupational markers or career keywords."""
    clean = re.sub(r"[^\w\s]", " ", text.lower()).strip()
    words = set(clean.split())
    if not words:
        return False
    if words & COMMON_OCCUPATIONAL_MARKERS:
        return True

    all_domains = (
        {"python", "java", "c++", "rust", "go", "golang", "javascript", "typescript", "react", "node", "sql", "linux", "cloud", "aws", "azure", "docker", "kubernetes", "cyber", "security", "data", "ai", "ml", "ios", "android", "frontend", "backend", "fullstack", "devops", "sre", "qa", "dsa", "sdet", "mobile", "web", "game", "robotics", "iot", "embedded"}
        | {"cardio", "doctor", "physician", "surgeon", "medical", "nurse", "nursing", "clinic", "hospital", "pharma", "biotech", "dental", "dentist"}
        | {"finance", "invest", "bank", "equity", "hedge", "quant", "audit", "accountant", "accounting", "trader", "wealth", "actuary", "cfa", "ca"}
        | {"law", "legal", "lawyer", "advocate", "attorney", "counsel", "litigation", "corporate"}
        | {"cook", "cooking", "chef", "baker", "bakery", "pastry", "culinary", "barista", "sommelier", "restaurant", "kitchen", "gastronomy", "catering"}
        | {"mechanical", "civil", "aerospace", "electrical", "chemical", "structural", "automobile", "automotive", "metallurgy", "cad", "cam"}
        | {"graphic", "design", "ui", "ux", "fashion", "interior", "animation", "animator", "artist", "illustrator"}
    )
    if bool(words & all_domains):
        return True

    # Check if query is a reasonable multi-word job title (not gibberish)
    if not is_gibberish_query(text) and len(clean) >= 4:
        return True

    return False


class RoleResolver:
    """Manages role discovery, suggestions, and intelligent matching."""

    def __init__(self, data_dir: str = "data/roles", cache_file: str = "cache/ai_synthesized_roles.json"):
        path = Path(data_dir)
        if not path.is_absolute() and not path.exists():
            # Locate relative to project root (backend/app/tools/role_resolver.py -> 3 parents to backend, 4 to root)
            root = Path(__file__).resolve().parent.parent.parent.parent
            if (root / data_dir).exists():
                path = root / data_dir
        self.data_dir = path
        self.roles: list[RoleDefinition] = []
        self._load_roles()

        cache_path = Path(cache_file)
        if not cache_path.is_absolute() and not cache_path.exists():
            root = Path(__file__).resolve().parent.parent.parent.parent
            cache_path = root / cache_file
        self.cache_path = cache_path
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.ai_cache: dict[str, dict] = self._load_ai_cache()
        self.azure_client = AzureOpenAIClient()

    def _load_ai_cache(self) -> dict[str, dict]:
        """Load previously synthesized custom roles from disk cache."""
        if self.cache_path.exists():
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        logger.info("Loaded %d synthesized roles from disk cache", len(data))
                        return data
            except (OSError, json.JSONDecodeError) as e:
                logger.warning("Could not read AI role cache: %s. Starting fresh.", e)
        return {}

    def _save_ai_cache(self) -> None:
        """Persist synthesized custom roles to disk cache."""
        try:
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump(self.ai_cache, f, indent=2)
        except OSError as e:
            logger.error("Failed to save AI role cache: %s", e)

    def _load_roles(self) -> None:
        """Load all rich role definitions from disk."""
        loaded_ids: set[str] = set()
        index_file = self.data_dir / "index.json"
        if index_file.exists():
            try:
                with open(index_file, "r", encoding="utf-8") as f:
                    raw_data = json.load(f)
                    for item in raw_data:
                        r = RoleDefinition.model_validate(item)
                        self.roles.append(r)
                        loaded_ids.add(r.id)
                logger.info("Loaded %d roles from index.json", len(self.roles))
            except (OSError, json.JSONDecodeError, ValueError) as e:
                logger.warning("Failed to load roles from index.json: %s. Loading individual files.", e)

        # Supplement with any standalone role files not yet loaded
        if self.data_dir.exists():
            for file_path in self.data_dir.glob("*.json"):
                if file_path.name == "index.json":
                    continue
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data, dict) and data.get("id") and data["id"] not in loaded_ids:
                            self.roles.append(RoleDefinition.model_validate(data))
                            loaded_ids.add(data["id"])
                except (OSError, json.JSONDecodeError, ValueError) as err:
                    logger.debug("Skipping role file %s: %s", file_path.name, err)

        logger.info("Total loaded roles in catalog: %d", len(self.roles))

    def normalize_query(self, query: str) -> str:
        """Lowercase, remove punctuation, and expand tech acronyms."""
        cleaned = re.sub(r"[^\w\s]", " ", query.lower()).strip()
        cleaned = re.sub(r"\bcyber\s+security\b", "cybersecurity", cleaned)
        cleaned = re.sub(r"\bmachin\s+learnng\b", "machine learning", cleaned)
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

    def classify_query_domain(self, raw_q: str, canonical_title: str) -> tuple[str, str, str]:
        """Classify domain, contextual tagline, and demand tier for search queries."""
        text = raw_q.lower()
        tokens = set(re.sub(r"[^\w\s]", " ", text).split())

        # Check security keywords first
        security_kw = {
            "cyber", "security", "cybersecurity", "infosec", "hacker", "hacking", "soc",
            "pentest", "penetration testing", "cryptography", "malware", "firewall", "ethical hacking"
        }
        if any(k in text or k in tokens for k in security_kw):
            return (
                "Security & Networks",
                f"Cyber defense, security operations & vulnerability mitigation for {canonical_title}",
                "Critical Need"
            )

        ai_ml_kw = {
            "machine learning", "deep learning", "ai", "artificial intelligence", "ml", "nlp",
            "computer vision", "data scientist", "data science", "neural", "llm", "machin", "learnng"
        }
        if any((k in tokens if len(k) <= 2 else (k in text or k in tokens)) for k in ai_ml_kw):
            return (
                "AI & Data Science",
                f"Intelligent systems, deep learning architectures & data science for {canonical_title}",
                "Critical Need"
            )

        culinary_kw = {
            "cook", "cooking", "chef", "baker", "bakery", "pastry", "culinary", "barista",
            "sommelier", "restaurant", "kitchen", "gastronomy", "catering", "garde manger"
        }
        if any(k in text or k in tokens for k in culinary_kw):
            return (
                "Culinary Arts & Hospitality",
                f"Professional culinary techniques & kitchen brigade operations for {canonical_title}",
                "High Demand"
            )

        medical_kw = {
            "cardio", "cardiology", "cardiologist", "doctor", "physician", "surgeon", "surgery",
            "medical", "medicine", "mbbs", "nurse", "nursing", "dentist", "dental", "orthopedic",
            "pediatric", "pediatrician", "oncology", "oncologist", "neurology", "neurologist",
            "radiology", "pathology", "pharmacist", "pharmacy", "clinic", "hospital", "biotech",
            "veterinarian", "psychiatrist", "dermatologist", "anesthesiologist", "healthcare"
        }
        if any(k in text or k in tokens for k in medical_kw):
            return (
                "Medicine & Healthcare",
                f"Specialized clinical & healthcare curriculum for {canonical_title}",
                "Critical Need"
            )

        core_eng_kw = {
            "civil", "mechanical", "electrical", "aerospace", "aeronautical", "chemical",
            "structural", "automobile", "automotive", "metallurgy", "mechatronics",
            "biomedical", "environmental engineer", "industrial engineer", "petroleum"
        }
        if any(k in text or k in tokens for k in core_eng_kw):
            return (
                "Core Engineering",
                f"Core engineering, design standards & operations track for {canonical_title}",
                "High Demand"
            )

        aviation_kw = {
            "pilot", "aviation", "avionics", "flight", "defense", "military", "navy", "maritime", "air force"
        }
        if any(k in text or k in tokens for k in aviation_kw):
            return (
                "Aviation & Defense",
                f"Aviation systems, flight operations & defense readiness track for {canonical_title}",
                "High Demand"
            )

        finance_kw = {
            "invest", "bank", "banking", "equity", "hedge", "quant", "chartered", "audit",
            "accountant", "accounting", "trader", "trading", "wealth", "actuary", "cfa",
            "valuation", "fintech", "taxation", "financial"
        }
        if any((k in tokens if len(k) <= 3 else (k in text or k in tokens)) for k in finance_kw) or "ca" in tokens:
            return (
                "Finance & Banking",
                f"Institutional capital markets, valuation & financial analysis for {canonical_title}",
                "High Demand"
            )

        legal_kw = {
            "lawyer", "attorney", "legal", "counsel", "advocate", "compliance", "judge", "paralegal", "litigation"
        }
        if any(k in text or k in tokens for k in legal_kw):
            return (
                "Legal & Compliance",
                f"Legal jurisprudence, corporate compliance & advocacy roadmap for {canonical_title}",
                "High Demand"
            )

        design_kw = {
            "graphic", "animator", "animation", "artist", "illustrator", "interior", "fashion",
            "film", "cinematography", "visual", "vfx", "creative director", "product designer"
        }
        if any(k in text or k in tokens for k in design_kw):
            return (
                "Design & Creative",
                f"Creative direction, portfolio production & visual craft for {canonical_title}",
                "High Demand"
            )

        business_kw = {
            "marketing", "sales", "brand", "growth", "hr", "recruiter", "operations manager",
            "consultant", "business analyst", "supply chain", "logistics"
        }
        if any(k in text or k in tokens for k in business_kw):
            return (
                "Business & Management",
                f"Market strategy, executive leadership & operational systems for {canonical_title}",
                "High Demand"
            )

        tech_kw = {
            "software", "developer", "engineer", "devops", "cloud", "security", "data", "ai",
            "ml", "web", "frontend", "backend", "full stack", "mobile", "ios", "android",
            "game", "blockchain", "qa", "tester", "sre"
        }
        if any(k in text or k in tokens for k in tech_kw):
            return (
                "Software & Technology",
                f"Technical engineering & modern systems curriculum for {canonical_title}",
                "High Demand"
            )

        return (
            "Adaptive Career Track",
            f"Adaptive market standards & personalized preparation for {canonical_title}",
            "AI Adaptive"
        )

    def suggest_roles(self, query: str, limit: int = 8) -> list[dict]:
        """Fast autocomplete suggestions for the hero search input.
        Returns accurate matching suggestions, handles broad terms, and rejects gibberish.
        """
        raw_q = query.strip()
        if not raw_q:
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

        # 1. Immediately reject gibberish (random keyboard mash, non-words)
        if is_gibberish_query(raw_q):
            return []

        q = self.normalize_query(raw_q)
        q_tokens = set(q.split())
        canonical_title = raw_q.title()

        # 2. Check if user typed a broad umbrella term (e.g. 'engineer', 'developer', 'doctor')
        for b_key, b_info in BROAD_ROLE_GUIDANCE.items():
            if raw_q.lower() == b_key or q == b_key or q_tokens == {b_key}:
                broad_results = []
                for s_title in b_info["suggested_roles"]:
                    matched = next((r for r in self.roles if r.title.lower() == s_title.lower()), None)
                    broad_results.append({
                        "id": matched.id if matched else f"broad_{re.sub(r'[^\w]+', '_', s_title.lower()).strip('_')}",
                        "title": s_title,
                        "category": b_info["category"],
                        "tagline": matched.tagline if (matched and matched.tagline) else f"Specialized curriculum for {s_title}",
                        "demand_level": getattr(matched, "demand_level", "High Demand"),
                    })
                return broad_results[:limit]

        results = []
        has_exact_title_match = False

        for r in self.roles:
            title_lower = r.title.lower()
            aliases_lower = [a.lower() for a in r.aliases]
            role_tokens = set(title_lower.split())
            for a in aliases_lower:
                role_tokens.update(a.split())

            # 1. Exact match
            score = 0.0
            if q == title_lower or any(q == a for a in aliases_lower) or raw_q.lower() == title_lower:
                score = 1.0
                has_exact_title_match = True
            # 2. Title prefix or title word prefix match (e.g. 'cardio' -> 'Cardiologist', 'cook' -> 'Professional Cook & Chef')
            elif title_lower.startswith(q) or any(w.startswith(q) for w in title_lower.split()):
                score = 0.95
            # 3. Alias prefix or alias word prefix match (e.g. 'cook' -> 'chef_cook' with alias 'cook')
            elif any(a.startswith(q) or any(w.startswith(q) for w in a.split()) for a in aliases_lower):
                score = 0.90
            # 4. Substring containment in title or aliases
            elif (len(q) >= 3 and q in title_lower) or any(len(q) >= 3 and q in a for a in aliases_lower):
                score = 0.85
            elif (len(title_lower) > 3 and title_lower in q) or any(len(a) > 2 and a in q for a in aliases_lower):
                score = 0.80
            else:
                # 5. Meaningful token overlap
                common = q_tokens & role_tokens
                meaningful = common - {"engineer", "developer", "specialist", "analyst", "manager", "associate", "intern", "lead", "senior", "junior"}
                if meaningful:
                    score = 0.55 + min(0.35, len(meaningful) * 0.15)
                elif common:
                    score = 0.45
                else:
                    # 6. Sequence similarity
                    sim = difflib.SequenceMatcher(None, q, title_lower).ratio()
                    alias_sims = [difflib.SequenceMatcher(None, q, a).ratio() for a in aliases_lower]
                    max_alias_sim = max(alias_sims, default=0.0)
                    top_sim = max(sim, max_alias_sim)
                    if top_sim >= 0.65:
                        score = top_sim * 0.85

            if score >= 0.45:
                results.append((score, r))

        results.sort(key=lambda x: x[0], reverse=True)

        suggestions: list[dict] = []

        # 1. First add high-confidence catalog matches
        for score, r in results:
            if score >= 0.80 and len(suggestions) < limit:
                if not any(s["id"] == r.id or s["title"].lower() == r.title.lower() for s in suggestions):
                    suggestions.append({
                        "id": r.id,
                        "title": r.title,
                        "category": r.category,
                        "tagline": r.tagline or r.description[:70],
                        "demand_level": r.demand_level,
                    })

        # 2. Present custom job suggestion if plausible and not already an exact catalog match
        has_high_exact = any(s["title"].lower() == canonical_title.lower() for s in suggestions)
        if not has_high_exact and len(raw_q) >= 3 and is_plausible_job_title(raw_q) and len(suggestions) < limit:
            cat, tagline, demand = self.classify_query_domain(raw_q, canonical_title)
            slug = re.sub(r"[^\w]+", "_", raw_q.lower()).strip("_")
            suggestions.append({
                "id": f"custom_{slug}",
                "title": canonical_title,
                "category": cat,
                "tagline": tagline,
                "demand_level": demand,
            })

        # 3. Add remaining catalog matches
        for score, r in results:
            if len(suggestions) >= limit:
                break
            if any(s["id"] == r.id or s["title"].lower() == r.title.lower() for s in suggestions):
                continue
            suggestions.append({
                "id": r.id,
                "title": r.title,
                "category": r.category,
                "tagline": r.tagline or r.description[:70],
                "demand_level": r.demand_level,
            })

        return suggestions[:limit]

    def resolve_role(self, query: str) -> RoleResolveResponse:
        """Map user input to a verified benchmark or gracefully composed plan."""
        normalized = self.normalize_query(query)
        raw_lower = query.lower().strip()
        tokens = set(re.sub(r"[^\w\s]", " ", raw_lower).split())

        # 0A. Detect random keyboard mash / gibberish non-words
        if is_gibberish_query(query):
            return RoleResolveResponse(
                matched_role="",
                role_id="",
                confidence=0.0,
                tagline="No matching career track found.",
                category="Unrecognized",
                alternatives=["Software Development Engineer", "Data Analyst", "Product Manager", "Machine Learning Engineer"],
                benchmark=[],
                source_type="unrecognized",
                message=f"No recognized career track found for '{query}'. It appears to be an invalid or unrecognized search. Please search for a recognized role like 'Software Engineer', 'Data Analyst', or 'Product Manager'.",
                tier_label="Target Organization Tier",
                target_tiers=[],
                degree_label="Degree / Qualification",
                branch_label="Branch / Specialization",
                suggested_degrees=[],
                suggested_branches=[],
            )

        # 0B. Check if user typed a broad umbrella term (e.g. 'engineer', 'developer', 'doctor')
        broad_match = None
        for b_key, b_info in BROAD_ROLE_GUIDANCE.items():
            if raw_lower == b_key or normalized == b_key or tokens == {b_key}:
                broad_match = (b_key, b_info)
                break

        if broad_match:
            b_key, b_info = broad_match
            primary_title = b_info["suggested_roles"][0]
            matched = next((r for r in self.roles if r.title.lower() == primary_title.lower()), self.roles[0] if self.roles else None)
            alternatives = [s for s in b_info["suggested_roles"] if s.lower() != primary_title.lower()]
            return RoleResolveResponse(
                matched_role=primary_title,
                role_id=matched.id if matched else "engineering_track",
                confidence=0.70,
                tagline=b_info["guidance"],
                category=b_info["category"],
                alternatives=alternatives,
                benchmark=matched.skills if matched else [],
                source_type="curated",
                message=f"'{query.strip().title()}' is a broad category. We have set up a foundational '{primary_title}' roadmap as a starting point. Select any specialized discipline below to tailor your roadmap.",
                tier_label=getattr(matched, "tier_label", "Target Company Tier"),
                target_tiers=[
                    "Product Tier 1 (FAANG / Big Tech)",
                    "High-Growth Tech Scaleup",
                    "Enterprise & Cloud SaaS",
                ],
                degree_label="Degree / Qualification",
                branch_label="Branch / Specialization",
                suggested_degrees=["B.Tech", "B.E.", "BCA / MCA", "B.S. / M.S."],
                suggested_branches=["Computer Science & Engineering", "Information Technology", "Core Engineering"],
            )

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

            score = 0.0

            # Title prefix or title word prefix match (e.g. 'cardio' -> 'cardiologist', 'cook' -> 'professional cook & chef')
            if title_lower.startswith(normalized) or any(w.startswith(normalized) for w in title_lower.split()):
                score = max(score, 0.95)
            elif any(a.startswith(normalized) or any(w.startswith(normalized) for w in a.split()) for a in aliases_lower):
                score = max(score, 0.92)
            elif (len(normalized) >= 3 and normalized in title_lower) or any(len(normalized) >= 3 and normalized in a for a in aliases_lower):
                score = max(score, 0.88)

            # Check direct token overlap
            common_tokens = tokens & all_role_words
            if common_tokens:
                # If specific tokens like 'ios', 'android', 'sre', 'devops', 'backend', 'frontend', 'cook', 'chef', 'doctor', 'lawyer' match
                important_tokens = {"ios", "android", "sre", "devops", "backend", "frontend", "game", "blockchain", "robotics", "cybersecurity", "security", "sde", "qa", "sdet", "ml", "ai", "cook", "chef", "doctor", "cardio", "lawyer", "civil", "mechanical", "aerospace", "banker", "finance"}
                if common_tokens & important_tokens:
                    score = max(score, 0.85)
                score += min(0.30, len(common_tokens) * 0.15)

            # Word boundary and multi-word alias containment
            for a in aliases_lower:
                if len(a) <= 2:
                    if a == raw_lower or a in tokens:
                        score = max(score, 0.90)
                else:
                    if a in tokens or a in raw_lower or a in normalized or re.search(rf"\b{re.escape(a)}\b", raw_lower) or re.search(rf"\b{re.escape(a)}\b", normalized):
                        score = max(score, 0.85)

            if len(title_lower) > 3 and (title_lower in normalized or title_lower in raw_lower):
                score = max(score, 0.90)

            # Fuzzy string match with safe acronym filtering (e.g. 'cv' must not match 'civil')
            ratio = difflib.SequenceMatcher(None, normalized, title_lower).ratio()
            alias_ratios = []
            for a in aliases_lower:
                a_words = set(a.split())
                short_words = {w for w in a_words if len(w) <= 3}
                if short_words and not (short_words & tokens):
                    continue
                alias_ratios.append(difflib.SequenceMatcher(None, normalized, a).ratio())
            max_alias_ratio = max(alias_ratios, default=0.0)
            score = max(score, ratio * 0.9, max_alias_ratio * 0.9)

            # Domain keyword guard: if user specified a domain (e.g. 'pilot', 'fashion', 'civil', 'sound')
            # that has ZERO conceptual overlap with this candidate role, cap the score so Live AI can synthesize it.
            generic_stopwords = {
                "engineer", "developer", "specialist", "analyst", "manager", "associate",
                "intern", "lead", "senior", "junior", "consultant", "architect", "eng", "dev",
                "designer", "officer", "practitioner", "commercial", "corporate", "professional",
                "and", "or", "in", "to", "for", "with", "of", "a", "an", "the", "i", "want", "be",
                "systems", "track", "role"
            }
            q_domain = tokens - generic_stopwords
            role_domain = all_role_words - generic_stopwords
            if q_domain and role_domain:
                has_domain_overlap = any(
                    qd in role_domain or any(
                        difflib.SequenceMatcher(None, qd, rd).ratio() >= 0.75
                        or (len(qd) >= 4 and len(rd) >= 4 and (qd in rd or rd in qd))
                        for rd in role_domain
                    )
                    for qd in q_domain
                )
                if not has_domain_overlap:
                    score = min(score, 0.25)

            if score > best_score:
                if best_role and best_role.title not in alternatives:
                    alternatives.insert(0, best_role.title)
                best_score = score
                best_role = r
            elif score > 0.40 and r.title not in alternatives:
                alternatives.append(r.title)

        # 2. Check if confident match found in curated catalog (exact, prefix, or strong alias)
        if best_role and best_score >= 0.85:
            is_design = "design" in best_role.category.lower() or "ui" in best_role.id
            default_tech_tiers = [
                "Product Tier 1 (FAANG / Big Tech)",
                "High-Growth Tech Scaleup",
                "FinTech & Quantitative Systems",
                "Enterprise & Cloud SaaS",
                "Early Stage Tech Startup",
            ]
            default_degrees = ["B.Des / M.Des", "BFA", "B.Tech"] if is_design else ["B.Tech", "B.E.", "BCA / MCA", "B.S. / M.S. Computer Science"]
            default_branches = ["Interaction Design", "Visual Communication", "UI/UX"] if is_design else ["Computer Science & Engineering", "Information Technology", "AI & Data Science", "Electronics & Comm"]

            return RoleResolveResponse(
                matched_role=best_role.title,
                role_id=best_role.id,
                confidence=round(best_score, 2),
                tagline=best_role.tagline or f"Target career path for {best_role.title}.",
                category=best_role.category,
                alternatives=alternatives[:3],
                benchmark=best_role.skills,
                source_type="curated",
                message=f"Matched to industry-curated standard for '{best_role.title}'.",
                tier_label=getattr(best_role, "tier_label", "") or "Target Organization Tier",
                target_tiers=getattr(best_role, "target_tiers", []) or default_tech_tiers,
                degree_label=getattr(best_role, "degree_label", "") or "Degree / Qualification",
                branch_label=getattr(best_role, "branch_label", "") or "Branch / Specialization",
                suggested_degrees=getattr(best_role, "suggested_degrees", []) or default_degrees,
                suggested_branches=getattr(best_role, "suggested_branches", []) or default_branches,
            )

        # 2B. Check persistent AI role cache (stores custom roles synthesized from previous user searches)
        cache_key = normalized
        if cache_key in self.ai_cache:
            logger.info("Serving previously synthesized role from persistent disk cache: '%s'", query)
            try:
                cached_resp = RoleResolveResponse.model_validate(self.ai_cache[cache_key])
                cached_resp.message = f"Retrieved verified benchmark for '{cached_resp.matched_role}' from search cache."
                return cached_resp
            except Exception as e:
                logger.warning("Failed to parse cached role: %s", e)

        # 3. Check specific tech domain keywords
        tech_keyword_map = [
            ("ios", "ios_developer"),
            ("swift", "ios_developer"),
            ("android", "android_developer"),
            ("devops", "devops_engineer"),
            ("sre", "sre"),
            ("game", "game_developer"),
            ("unity", "game_developer"),
            ("unreal", "game_developer"),
            ("mobile", "mobile_cross_platform"),
            ("flutter", "mobile_cross_platform"),
            ("react native", "mobile_cross_platform"),
            ("robotics", "robotics_engineer"),
            ("cybersecurity", "cybersecurity_analyst"),
            ("hack", "cybersecurity_analyst"),
            ("blockchain", "blockchain_developer"),
            ("crypto", "blockchain_developer"),
            ("embedded", "embedded_iot_engineer"),
            ("iot", "embedded_iot_engineer"),
            ("sdet", "qa_sdet"),
            ("qa", "qa_sdet"),
            ("data science", "data_scientist"),
            ("data analyst", "data_analyst"),
            ("machine learning", "ml_engineer"),
            ("genai", "ai_genai_engineer"),
            ("frontend", "frontend_developer"),
            ("backend", "backend_developer"),
            ("ui/ux", "ui_ux_designer"),
            ("cloud", "cloud_engineer"),
            ("full stack", "full_stack_developer"),
        ]

        for kw, target_id in tech_keyword_map:
            kw_pattern = rf"\b{re.escape(kw)}\b"
            if re.search(kw_pattern, raw_lower) or re.search(kw_pattern, normalized):
                matched = next((r for r in self.roles if r.id == target_id), None)
                if matched:
                    return RoleResolveResponse(
                        matched_role=matched.title,
                        role_id=matched.id,
                        confidence=0.85,
                        tagline=matched.tagline or f"Tailored curriculum for {matched.title}.",
                        category=matched.category,
                        alternatives=[r.title for r in self.roles[:3] if r.id != matched.id],
                        benchmark=matched.skills,
                        source_type="curated",
                        message=f"Detected focus in '{kw}'. Matched to '{matched.title}'.",
                        tier_label="Target Company Tier",
                        target_tiers=[
                            "Product Tier 1 (FAANG / Big Tech)",
                            "High-Growth Tech Scaleup",
                            "FinTech & Quantitative Systems",
                            "Enterprise & Cloud SaaS",
                            "Early Stage Tech Startup",
                        ],
                        degree_label="Degree / Qualification",
                        branch_label="Branch / Specialization",
                        suggested_degrees=["B.Tech", "B.E.", "BCA / MCA", "B.S. / M.S. Computer Science"],
                        suggested_branches=["Computer Science & Engineering", "Information Technology", "AI & Data Science", "Electronics & Comm"],
                    )

        # 4. Check for pure symbols or residual vowel-less non-words
        letters_only = re.sub(r"[^a-zA-Z]", "", raw_lower)
        is_residual_gibberish = (
            len(letters_only) < 3
            or not any(v in letters_only for v in "aeiouy")
            or letters_only in {"asdf", "asdfg", "asdfgh", "asdfghjkl", "qwerty", "zxcvbnm", "xyz"}
        )
        if is_residual_gibberish:
            return RoleResolveResponse(
                matched_role="",
                role_id="",
                confidence=0.0,
                tagline="No matching career track found.",
                category="Unrecognized",
                alternatives=["Software Development Engineer", "Data Analyst", "Product Manager", "Machine Learning Engineer"],
                benchmark=[],
                source_type="unrecognized",
                message=f"No recognized career track found for '{query}'. Please check the spelling or search for a recognized role like 'Software Engineer', 'Data Analyst', or 'Product Manager'.",
                tier_label="Target Organization Tier",
                target_tiers=[],
                degree_label="Degree / Qualification",
                branch_label="Branch / Specialization",
                suggested_degrees=[],
                suggested_branches=[],
            )

        # 5. Check persistent AI role cache (stores custom roles synthesized from previous user searches)
        cache_key = normalized
        if cache_key in self.ai_cache:
            logger.info("Serving previously synthesized role from persistent disk cache: '%s'", query)
            try:
                cached_resp = RoleResolveResponse.model_validate(self.ai_cache[cache_key])
                cached_resp.message = f"Retrieved verified benchmark for '{cached_resp.matched_role}' from search cache."
                return cached_resp
            except Exception as e:
                logger.warning("Failed to parse cached role: %s", e)

        # 6. Live AI Synthesis: If query is outside the catalog and Azure OpenAI / Foundry is active
        if self.azure_client.is_configured:
            ai_data = self.azure_client.synthesize_role_benchmark(query)
            if ai_data and ai_data.get("matched_role") and ai_data.get("skills"):

                slug_id = re.sub(r"[^\w]+", "_", ai_data["matched_role"].lower()).strip("_")
                benchmarks = [
                    RoleSkillBenchmark(
                        name=s["name"],
                        required_level=s["required_level"],
                        demand_level=s.get("demand_level", "critical"),
                        est_hours=s.get("est_hours", 30),
                        category=s.get("category", "core"),
                        source_type="ai_estimated",
                        source_url="https://roadmap.sh"
                    )
                    for s in ai_data["skills"]
                ]
                resp = RoleResolveResponse(
                    matched_role=ai_data["matched_role"],
                    role_id=slug_id or "custom_role",
                    confidence=0.95,
                    tagline=ai_data.get("tagline", f"Specialized curriculum for {ai_data['matched_role']}."),
                    category=ai_data.get("category", "Specialized Professional"),
                    alternatives=[r.title for r in self.roles[:3]],
                    benchmark=benchmarks,
                    source_type="ai_estimated",
                    message=f"Live AI curriculum synthesized specifically for '{ai_data['matched_role']}'.",
                    tier_label=ai_data.get("tier_label", "Target Organization Tier"),
                    target_tiers=ai_data.get("target_tiers", [
                        "Tier 1 Global Leader / Premier Institution",
                        "Leading Regional Organization",
                        "Specialized Practice / Center",
                        "Public & Government Service",
                        "High-Growth Enterprise"
                    ]),
                    degree_label=ai_data.get("degree_label", "Degree / Qualification"),
                    branch_label=ai_data.get("branch_label", "Specialization / Stream"),
                    suggested_degrees=ai_data.get("suggested_degrees", ["Bachelor's Degree", "Master's Degree", "Professional Certification"]),
                    suggested_branches=ai_data.get("suggested_branches", ["Core Discipline", "Specialized Practice"]),
                )
                # Persist to disk cache so future users or offline requests get this exact curriculum!
                self.ai_cache[cache_key] = resp.model_dump()
                self.ai_cache[self.normalize_query(ai_data["matched_role"])] = resp.model_dump()
                self._save_ai_cache()
                return resp

        # 7. Fallback to community search cache: If live AI key fails or is unconfigured,
        # check if ANY previous user's search in the persistent cache matches or shares keywords
        for c_key, c_data in self.ai_cache.items():
            c_tokens = set(c_key.split())
            if c_key in normalized or normalized in c_key or (tokens & c_tokens and len(tokens & c_tokens) >= 1):
                try:
                    logger.info("Serving match from community search cache for '%s'", c_key)
                    cached_resp = RoleResolveResponse.model_validate(c_data)
                    cached_resp.message = f"Retrieved community benchmark for '{cached_resp.matched_role}' from search cache."
                    return cached_resp
                except Exception:
                    pass

        # 8. Offline Multi-Domain Taxonomy Fallback (when offline or AI fails)
        canonical_title = query.strip().title() if query.strip() else "Professional"
        clean_slug = re.sub(r"[^\w]+", "_", canonical_title.lower()).strip("_")

        # 5A-1. Culinary Arts & Hospitality
        culinary_keywords = {
            "cook", "cooking", "chef", "baker", "bakery", "pastry", "culinary", "barista",
            "sommelier", "restaurant", "kitchen", "gastronomy", "catering", "garde manger"
        }
        if any(ck in raw_lower or ck in normalized for ck in culinary_keywords):
            matched_title = canonical_title if len(canonical_title) > 2 else "Professional Cook & Chef"
            culinary_skills = [
                RoleSkillBenchmark(name="Knife Skills & Mise en Place", required_level=4.5, est_hours=35, demand_level="critical", category="core_techniques"),
                RoleSkillBenchmark(name="Kitchen Safety & Food Hygiene (HACCP)", required_level=4.5, est_hours=25, demand_level="critical", category="safety_compliance"),
                RoleSkillBenchmark(name="Foundational Cooking Techniques & Mother Sauces", required_level=4.5, est_hours=40, demand_level="critical", category="core_techniques"),
                RoleSkillBenchmark(name="Station Management & Line Cooking", required_level=4.0, est_hours=35, demand_level="critical", category="kitchen_operations"),
                RoleSkillBenchmark(name="Meat, Poultry & Seafood Fabrication", required_level=4.0, est_hours=30, demand_level="high-priority", category="butchery"),
                RoleSkillBenchmark(name="Recipe Costing & Yield Management", required_level=3.5, est_hours=25, demand_level="high-priority", category="cost_control"),
            ]
            return RoleResolveResponse(
                matched_role=matched_title,
                role_id=clean_slug or "chef_cook",
                confidence=0.90,
                tagline=f"Professional kitchen operations, culinary techniques and brigade execution for {matched_title}.",
                category="Culinary Arts & Hospitality",
                alternatives=["Head Chef", "Sous Chef", "Pastry Chef"],
                benchmark=culinary_skills,
                source_type="estimated",
                message=f"Mapped to professional culinary curriculum for '{matched_title}'.",
                tier_label="Target Kitchen & Hospitality Tier",
                target_tiers=[
                    "Michelin Star & Premier Fine Dining Restaurant",
                    "Luxury 5-Star Hotel & Resort Kitchen Brigade",
                    "High-Volume Contemporary Bistro & Gastropub",
                    "Bespoke Catering & Private Dining Service",
                    "Artisan Bakery & Patisserie Studio"
                ],
                degree_label="Culinary Qualification",
                branch_label="Culinary Specialization",
                suggested_degrees=["Diploma in Culinary Arts", "Associate Degree in Culinary Arts (AAS)", "B.Sc. Hospitality & Culinary Management", "ServSafe Manager Certification"],
                suggested_branches=["Classical French & Contemporary Cuisine", "Pastry & Artisan Baking", "Garde Manger & Cold Kitchen", "Sauces & Sauté Station"],
            )

        # 5A-2. Medicine & Healthcare
        medical_keywords = {
            "cardio", "cardiologist", "doctor", "physician", "surgeon", "medical", "nurse",
            "nursing", "dentist", "dental", "pharma", "pharmacist", "radiologist", "radiology",
            "pediatrician", "pediatric", "oncologist", "neurologist", "orthopedic", "psychiatrist",
            "clinic", "hospital", "biotech"
        }
        if any(mk in raw_lower or mk in normalized for mk in medical_keywords):
            is_cardio = "cardio" in raw_lower
            matched_title = "Cardiologist" if is_cardio else (canonical_title if "doctor" not in raw_lower else "Medical Physician")
            skills = [
                RoleSkillBenchmark(name="Clinical Cardiology & Diagnostics" if is_cardio else "Clinical Medicine & Patient Diagnosis", required_level=4.5, est_hours=45, demand_level="critical", category="clinical"),
                RoleSkillBenchmark(name="Echocardiography & ECG Interpretation" if is_cardio else "Diagnostic Pathology & Medical Imaging", required_level=4.5, est_hours=40, demand_level="critical", category="diagnostics"),
                RoleSkillBenchmark(name="Cardiovascular Pharmacology" if is_cardio else "Clinical Pharmacology & Therapeutics", required_level=4.0, est_hours=35, demand_level="high-priority", category="pharmacology"),
                RoleSkillBenchmark(name="Cardiac Catheterization & Interventions" if is_cardio else "Emergency Medical Procedures & Life Support", required_level=3.5, est_hours=30, demand_level="high-priority", category="procedures"),
                RoleSkillBenchmark(name="ACLS & Critical Cardiac Care" if is_cardio else "Medical Ethics & Evidence-Based Healthcare", required_level=4.5, est_hours=25, demand_level="critical", category="critical_care"),
            ]
            return RoleResolveResponse(
                matched_role=matched_title,
                role_id=clean_slug or "healthcare_specialist",
                confidence=0.88,
                tagline=f"Specialist medical physician diagnosing and treating patients in {matched_title}." if is_cardio else f"Healthcare and clinical preparation track for {matched_title}.",
                category="Medicine & Healthcare",
                alternatives=["Internal Medicine Physician", "Cardiac Surgeon", "Medical Officer"],
                benchmark=skills,
                source_type="estimated",
                message=f"Recognized medical career track for '{matched_title}'.",
                tier_label="Target Hospital / Healthcare Tier",
                target_tiers=[
                    "Top Tier Super-Specialty Hospital (AIIMS / Apollo / Mayo Clinic)",
                    "Premier Academic Teaching Hospital & Medical Center",
                    "Private Specialized Clinic & Diagnostic Center",
                    "Government Public Health Services & Civil Hospital",
                    "HealthTech & Medical Devices Enterprise"
                ],
                degree_label="Medical Qualification",
                branch_label="Medical Specialty / Residency",
                suggested_degrees=["MBBS", "MD Internal Medicine", "DM Cardiology", "DNB Cardiology", "MS Surgery"],
                suggested_branches=["Cardiology", "Internal Medicine", "Critical Care", "General Surgery"],
            )

        # 5B. Finance, Investment & Accounting
        finance_keywords = {"invest", "bank", "equity", "hedge", "quant", "chartered", "audit", "accountant", "accounting", "trader", "wealth", "actuary", "cfa", "ca"}
        if any(fk in raw_lower or fk in normalized for fk in finance_keywords):
            matched_title = canonical_title if len(canonical_title) > 2 else "Financial Analyst"
            skills = [
                RoleSkillBenchmark(name="Financial Modeling & Valuation (DCF / LBO)", required_level=4.5, est_hours=40, demand_level="critical", category="modeling"),
                RoleSkillBenchmark(name="Financial Statement Analysis & US GAAP/IFRS", required_level=4.0, est_hours=35, demand_level="critical", category="accounting"),
                RoleSkillBenchmark(name="Corporate Finance & Capital Markets", required_level=4.0, est_hours=30, demand_level="high-priority", category="finance"),
                RoleSkillBenchmark(name="Investment Due Diligence & M&A Analysis", required_level=3.5, est_hours=30, demand_level="high-priority", category="analytics"),
                RoleSkillBenchmark(name="Quantitative Analytics & Excel/Python", required_level=3.5, est_hours=25, demand_level="moderate", category="quantitative"),
            ]
            return RoleResolveResponse(
                matched_role=matched_title,
                role_id=clean_slug or "finance_analyst",
                confidence=0.85,
                tagline=f"Institutional financial analysis and capital markets preparation for {matched_title}.",
                category="Finance & Banking",
                alternatives=["Investment Banker", "Equity Research Analyst", "Corporate Finance Manager"],
                benchmark=skills,
                source_type="estimated",
                message=f"Mapped to institutional finance curriculum for '{matched_title}'.",
                tier_label="Target Financial Institution Tier",
                target_tiers=[
                    "Bulge Bracket Investment Bank (Goldman Sachs, Morgan Stanley, J.P. Morgan)",
                    "Tier-1 Quantitative Hedge Fund & Private Equity (Citadel, Blackstone)",
                    "Big 4 Accounting & Advisory (Deloitte, PwC, EY, KPMG)",
                    "Corporate Treasury & Commercial Banking",
                    "FinTech & Digital Banking Scaleup"
                ],
                degree_label="Finance / Commerce Degree",
                branch_label="Financial Concentration",
                suggested_degrees=["B.Com / BBA", "MBA Finance", "CFA", "Chartered Accountant (CA)"],
                suggested_branches=["Corporate Finance", "Investment Banking", "Quantitative Finance", "Accounting & Audit"],
            )

        # 5C. Core Engineering (Mechanical, Civil, Aerospace, Electrical, Chemical)
        core_eng_keywords = {"mechanical", "civil", "aerospace", "aeronautical", "electrical", "chemical", "structural", "automobile", "automotive", "metallurgy"}
        if any(ek in raw_lower or ek in normalized for ek in core_eng_keywords):
            matched_title = canonical_title if len(canonical_title) > 2 else "Mechanical Engineer"
            skills = [
                RoleSkillBenchmark(name=f"Advanced {matched_title} Design & CAD/CAE", required_level=4.5, est_hours=40, demand_level="critical", category="design"),
                RoleSkillBenchmark(name="Thermodynamics, Fluid & Structural Mechanics", required_level=4.0, est_hours=35, demand_level="critical", category="mechanics"),
                RoleSkillBenchmark(name="Materials Science & Finite Element Analysis (FEA)", required_level=3.5, est_hours=30, demand_level="high-priority", category="analysis"),
                RoleSkillBenchmark(name="Manufacturing Processes & Quality Standards", required_level=3.5, est_hours=30, demand_level="high-priority", category="manufacturing"),
                RoleSkillBenchmark(name="Engineering Prototyping & GD&T Standards", required_level=3.5, est_hours=25, demand_level="moderate", category="prototyping"),
            ]
            return RoleResolveResponse(
                matched_role=matched_title,
                role_id=clean_slug or "core_engineer",
                confidence=0.85,
                tagline=f"Core industrial engineering and design preparation for {matched_title}.",
                category="Core Engineering",
                alternatives=["Mechanical Engineer", "Aerospace Engineer", "Civil Engineer"],
                benchmark=skills,
                source_type="estimated",
                message=f"Mapped to core engineering curriculum for '{matched_title}'.",
                tier_label="Target Industry & Engineering Tier",
                target_tiers=[
                    "Tier-1 Aerospace, Defense & Automotive (Boeing, Airbus, Tesla, ISRO)",
                    "Global Energy, Oil & Industrial Conglomerate (L&T, GE, Shell, Siemens)",
                    "Top EPC Infrastructure & Heavy Engineering",
                    "Advanced Precision Engineering R&D Center",
                    "Hardware & DeepTech Robotics Scaleup"
                ],
                degree_label="Engineering Degree",
                branch_label="Engineering Discipline",
                suggested_degrees=["B.Tech / B.E.", "M.Tech / M.E.", "M.S. Engineering"],
                suggested_branches=["Mechanical Engineering", "Aerospace Engineering", "Civil Engineering", "Electrical Engineering"],
            )

        # 5D. Law & Legal Services
        law_keywords = {"law", "lawyer", "legal", "attorney", "litigation", "litigator", "advocate", "judge", "judicial", "prosecutor", "arbitration"}
        if any(lk in raw_lower or lk in normalized for lk in law_keywords):
            matched_title = canonical_title if len(canonical_title) > 2 else "Corporate Lawyer"
            skills = [
                RoleSkillBenchmark(name="Contract Law, Drafting & Commercial Negotiation", required_level=4.5, est_hours=40, demand_level="critical", category="contracts"),
                RoleSkillBenchmark(name="Corporate Governance & Regulatory Compliance", required_level=4.0, est_hours=35, demand_level="critical", category="compliance"),
                RoleSkillBenchmark(name="Legal Research & Case Precedent Analysis", required_level=4.0, est_hours=30, demand_level="high-priority", category="research"),
                RoleSkillBenchmark(name="Dispute Resolution & Commercial Arbitration", required_level=3.5, est_hours=30, demand_level="high-priority", category="dispute"),
                RoleSkillBenchmark(name="Intellectual Property & Licensing Law", required_level=3.5, est_hours=25, demand_level="moderate", category="ip"),
            ]
            return RoleResolveResponse(
                matched_role=matched_title,
                role_id=clean_slug or "legal_counsel",
                confidence=0.85,
                tagline=f"Professional legal counsel and litigation curriculum for {matched_title}.",
                category="Law & Legal Services",
                alternatives=["Corporate Legal Counsel", "Litigation Associate", "Arbitration Counsel"],
                benchmark=skills,
                source_type="estimated",
                message=f"Mapped to legal practice curriculum for '{matched_title}'.",
                tier_label="Target Legal Organization Tier",
                target_tiers=[
                    "Top Tier Law Firm (Magic Circle / Chambers Band 1)",
                    "Fortune 500 Corporate In-House Legal Counsel",
                    "High Court & Supreme Court Appellate Practice",
                    "Boutique Arbitration & IP Practice",
                    "Judicial Services & Public Prosecution"
                ],
                degree_label="Law Degree",
                branch_label="Legal Specialization",
                suggested_degrees=["B.A. LL.B (Hons)", "LL.B", "LL.M"],
                suggested_branches=["Corporate & Commercial Law", "Dispute Resolution & Litigation", "Intellectual Property Rights"],
            )

        # 5E. Universal Professional Catch-All (only for plausible occupational titles)
        if not is_plausible_job_title(raw_lower) and best_score < 0.35:
            return RoleResolveResponse(
                matched_role="",
                role_id="",
                confidence=0.0,
                tagline="No matching career track found.",
                category="Unrecognized",
                alternatives=["Software Development Engineer", "Data Analyst", "Product Manager", "Machine Learning Engineer"],
                benchmark=[],
                source_type="unrecognized",
                message=f"No recognized career track found for '{query}'. Please check the spelling or search for a recognized role like 'Software Engineer', 'Data Analyst', or 'Product Manager'.",
                tier_label="Target Organization Tier",
                target_tiers=[],
                degree_label="Degree / Qualification",
                branch_label="Branch / Specialization",
                suggested_degrees=[],
                suggested_branches=[],
            )

        # If user explicitly wrote code/software words, map to SDE. Otherwise keep their canonical title!
        is_software_query = any(w in raw_lower for w in ["software", "code", "coder", "programmer", "developer", "dsa", "leetcode"])
        final_title = "Software Development Engineer" if is_software_query else (canonical_title if len(canonical_title) > 2 else "Specialized Professional")
        final_id = "sde_dsa" if is_software_query else (clean_slug or "custom_specialist")
        final_category = "Software Engineering" if is_software_query else "Professional & Industry Careers"

        universal_skills = [
            RoleSkillBenchmark(name=f"{final_title} Core Domain Principles", required_level=4.0, est_hours=35, demand_level="critical", category="fundamentals"),
            RoleSkillBenchmark(name="Analytical Problem Solving & Quantitative Methods", required_level=3.5, est_hours=30, demand_level="critical", category="analytics"),
            RoleSkillBenchmark(name="Industry Tools, Applied Systems & Best Practices", required_level=3.5, est_hours=30, demand_level="high-priority", category="applied"),
            RoleSkillBenchmark(name="Professional Communication & Stakeholder Management", required_level=3.5, est_hours=20, demand_level="high-priority", category="communication"),
            RoleSkillBenchmark(name="Case Studies & Capstone Project Execution", required_level=3.5, est_hours=25, demand_level="moderate", category="projects"),
        ] if not is_software_query else [
            RoleSkillBenchmark(name="Data Structures & Algorithms", required_level=4.0, est_hours=45, demand_level="critical", category="core"),
            RoleSkillBenchmark(name="System Design & Scalability", required_level=3.0, est_hours=30, demand_level="high-priority", category="architecture"),
            RoleSkillBenchmark(name="Python", required_level=3.5, est_hours=25, demand_level="critical", category="language"),
            RoleSkillBenchmark(name="SQL & Relational Databases", required_level=3.5, est_hours=20, demand_level="high-priority", category="database"),
            RoleSkillBenchmark(name="Git Version Control", required_level=3.0, est_hours=10, demand_level="moderate", category="tooling"),
        ]

        return RoleResolveResponse(
            matched_role=final_title,
            role_id=final_id,
            confidence=0.75 if not is_software_query else 0.50,
            tagline=f"Specialized preparation curriculum for {final_title}.",
            category=final_category,
            alternatives=["Backend Developer", "Data Analyst", "Full Stack Developer"] if is_software_query else ["Senior Specialist", "Domain Consultant"],
            benchmark=universal_skills,
            source_type="estimated",
            message=f"Customized benchmark created for '{final_title}'.",
            tier_label="Target Company Tier" if is_software_query else "Target Organization Tier",
            target_tiers=[
                "Product Tier 1 (FAANG / Big Tech)",
                "High-Growth Tech Scaleup",
                "FinTech & Quantitative Systems",
                "Enterprise & Cloud SaaS",
                "Early Stage Tech Startup",
            ] if is_software_query else [
                "Global Industry Leader / Tier-1 Enterprise",
                "Premier Specialized Institute & Research Center",
                "High-Growth Scaleup Organization",
                "Government & Public Sector Authority",
                "Boutique Practice & Independent Consultancy",
            ],
            degree_label="Degree / Qualification",
            branch_label="Branch / Specialization",
            suggested_degrees=["Bachelor's Degree", "Master's Degree", "Professional Certification"],
            suggested_branches=["Core Discipline", "Applied Practice", "Analytics & Strategy"],
        )



# Global singleton instance
_default_resolver: RoleResolver | None = None


def get_role_resolver() -> RoleResolver:
    """Retrieve singleton RoleResolver."""
    global _default_resolver
    if _default_resolver is None:
        _default_resolver = RoleResolver()
    return _default_resolver
