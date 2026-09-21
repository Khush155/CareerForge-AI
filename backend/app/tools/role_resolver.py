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

    def classify_query_domain(self, raw_q: str, canonical_title: str) -> tuple[str, str, str]:
        """Classify domain, contextual tagline, and demand tier for search queries."""
        text = raw_q.lower()
        tokens = set(re.sub(r"[^\w\s]", " ", text).split())

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
            "accountant", "accounting", "trader", "trading", "wealth", "actuary", "cfa", "ca",
            "valuation", "fintech", "taxation", "financial"
        }
        if any(k in text or k in tokens for k in finance_kw):
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
        Always includes the user's searched role even if it is not in the static database.
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

        q = self.normalize_query(raw_q)
        q_tokens = set(q.split())
        canonical_title = raw_q.title()

        results = []
        has_exact_title_match = False

        for r in self.roles:
            title_lower = r.title.lower()
            aliases_lower = [a.lower() for a in r.aliases]
            role_tokens = set(title_lower.split())
            for a in aliases_lower:
                role_tokens.update(a.split())

            # Direct match
            score = 0.0
            if q == title_lower or any(q == a for a in aliases_lower) or raw_q.lower() == title_lower:
                score = 1.0
                has_exact_title_match = True
            elif q in title_lower or any((len(q) > 2 and q in a) or q == a for a in aliases_lower) or raw_q.lower() in title_lower:
                score = 0.85
            elif (len(title_lower) > 3 and title_lower in q) or any((len(a) > 3 and a in q) or a in q_tokens for a in aliases_lower):
                score = 0.80
            else:
                # Token overlap
                common = q_tokens & role_tokens
                meaningful = common - {"engineer", "developer", "specialist", "analyst", "manager", "associate", "intern", "lead", "senior", "junior"}
                if meaningful:
                    score = 0.50 + min(0.35, len(meaningful) * 0.15)
                elif common:
                    score = 0.40
                else:
                    sim = difflib.SequenceMatcher(None, q, title_lower).ratio()
                    alias_sims = []
                    for a in aliases_lower:
                        if len(a) <= 3:
                            if a == q or a in q_tokens:
                                alias_sims.append(0.90)
                        else:
                            alias_sims.append(difflib.SequenceMatcher(None, q, a).ratio())
                    max_alias_sim = max(alias_sims, default=0.0)
                    top_sim = max(sim, max_alias_sim)
                    if top_sim >= 0.70:
                        score = top_sim * 0.85

            if score >= 0.45:
                results.append((score, r))

        results.sort(key=lambda x: x[0], reverse=True)

        suggestions: list[dict] = []

        # If user typed a query that is not an exact match to a catalog title,
        # ALWAYS present the queried job as the primary suggestion!
        if not has_exact_title_match and len(raw_q) >= 2:
            cat, tagline, demand = self.classify_query_domain(raw_q, canonical_title)
            slug = re.sub(r"[^\w]+", "_", raw_q.lower()).strip("_")
            suggestions.append({
                "id": f"custom_{slug}",
                "title": canonical_title,
                "category": cat,
                "tagline": tagline,
                "demand_level": demand,
            })

        for _, r in results:
            if len(suggestions) >= limit:
                break
            if any(s["title"].lower() == r.title.lower() for s in suggestions):
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


            # Domain keyword guard: if user specified a domain (e.g. 'civil', 'mechanical', 'cardio')
            # that is completely absent from this role's domain vocabulary, cap the score.
            generic_stopwords = {"engineer", "developer", "specialist", "analyst", "manager", "associate", "intern", "lead", "senior", "junior", "consultant", "architect"}
            q_domain = tokens - generic_stopwords
            role_domain = all_role_words - generic_stopwords
            if q_domain and not (q_domain & role_domain) and not any(a in raw_lower for a in aliases_lower):
                score = min(score, 0.25)

            if score > best_score:
                if best_role and best_role.title not in alternatives:
                    alternatives.insert(0, best_role.title)
                best_score = score
                best_role = r
            elif score > 0.40 and r.title not in alternatives:
                alternatives.append(r.title)


        # 2. Check if confident match found in curated catalog
        if best_role and best_score >= 0.60:
            is_design = "design" in best_role.category.lower() or "ui" in best_role.id
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
                suggested_degrees=["B.Des / M.Des", "BFA", "B.Tech"] if is_design else ["B.Tech", "B.E.", "BCA / MCA", "B.S. / M.S. Computer Science"],
                suggested_branches=["Interaction Design", "Visual Communication", "UI/UX"] if is_design else ["Computer Science & Engineering", "Information Technology", "AI & Data Science", "Electronics & Comm"],
            )

        # 3. Check specific tech domain keywords
        tech_keyword_map = [
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
            if kw in raw_lower or kw in normalized:
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

        # 4. Check for pure symbols, keyboard mashing, or vowel-less gibberish (e.g. '!@#$%^&*()_+', 'asdfgh')
        letters_only = re.sub(r"[^a-zA-Z]", "", raw_lower)
        is_gibberish = (
            len(letters_only) < 3
            or not any(v in letters_only for v in "aeiouy")
            or letters_only in {"asdf", "asdfg", "asdfgh", "asdfghjkl", "qwerty", "zxcvbnm", "xyz"}
        )
        if is_gibberish:
            sde_role = next((r for r in self.roles if r.id == "sde_dsa"), self.roles[0] if self.roles else None)
            return RoleResolveResponse(
                matched_role="Software Development Engineer",
                role_id="sde_dsa",
                confidence=0.40,
                tagline="Universal software problem solving, algorithms, and core engineering fundamentals.",
                category="Software Engineering",
                alternatives=["Backend Developer", "Full Stack Developer"],
                benchmark=sde_role.skills if sde_role else [
                    RoleSkillBenchmark(name="Data Structures & Algorithms", required_level=4.0, est_hours=45),
                    RoleSkillBenchmark(name="System Design", required_level=3.0, est_hours=30),
                    RoleSkillBenchmark(name="Python", required_level=3.5, est_hours=25),
                ],
                source_type="estimated",
                message=f"We mapped '{query}' to foundational Software Engineering so you have a solid starting plan.",
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
                suggested_degrees=["B.Tech", "B.E.", "BCA / MCA"],
                suggested_branches=["Computer Science & Engineering", "Information Technology"],
            )

        # 5. Live AI Synthesis: If query is outside the catalog and Azure OpenAI / Foundry is active
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
                return RoleResolveResponse(
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

        # 5. Offline Multi-Domain Taxonomy Fallback (when offline or AI fails)
        canonical_title = query.strip().title() if query.strip() else "Professional"
        clean_slug = re.sub(r"[^\w]+", "_", canonical_title.lower()).strip("_")

        # 5A. Medicine & Healthcare
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

        # 5E. Universal Professional Catch-All (NEVER map non-tech to SDE)
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
