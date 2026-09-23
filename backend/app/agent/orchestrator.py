"""Agent Orchestrator for CareerForge AI.

Coordinates the 7-Step Preparation Loop:
Research -> Analyze -> Compare -> Recommend -> Plan -> Assess -> Adapt

ARCHITECTURAL CONSTRAINTS:
1. Pure deterministic math for gap calculations and assessment scoring.
2. Market requirements backed by verified citation links.
3. RAG retrieval of curated markdown guides with section anchors.
4. Seamless dual-mode execution (local mock vs Azure OpenAI gpt-4o-mini).
5. Dynamic roadmap phase rebalancing upon assessment completion.
6. DOMAIN-AWARE phase generation: tech, medicine, finance, law, core_engineering, general.
"""
import math
import re
import uuid

from app.agent.azure_client import AzureOpenAIClient
from app.core.gap_calculator import calculate_skill_gaps
from app.core.progress_engine import evaluate_assessment
from app.db.storage import DatabaseManager, get_db
from app.models.assessment import AssessmentInput, AssessmentResult
from app.models.market import MarketRequirement
from app.models.profile import StudentProfile
from app.models.roadmap import PhaseStatus, ResourceItem, Roadmap, RoadmapPhase
from app.models.skill_gap import PriorityLevel, SkillGap
from app.tools.knowledge_rag import retrieve_knowledge_base
from app.tools.market_search import web_search_market

# Base study hours assigned per 1.0 gap deficiency
HOURS_PER_GAP_UNIT = 15

# ──────────────────────────────────────────────────────────────────────────────
# Domain detection helpers
# ──────────────────────────────────────────────────────────────────────────────

_MEDICINE_KW = frozenset({
    "doctor", "physician", "surgeon", "surgery", "cardio", "cardiologist",
    "nurse", "nursing", "dentist", "dental", "pharmacist", "pharmacy",
    "radiologist", "radiology", "pediatrician", "pediatric", "oncologist",
    "neurologist", "orthopedic", "psychiatrist", "dermatologist",
    "anesthesiologist", "medical", "medicine", "mbbs", "clinical", "clinic",
    "hospital", "healthcare", "biotech", "veterinarian", "pathologist",
    "obstetrician", "gynecologist", "ophthalmologist", "urologist",
})

_FINANCE_KW = frozenset({
    "invest", "investment", "bank", "banking", "equity", "hedge", "quant",
    "chartered", "audit", "auditor", "accountant", "accounting", "trader",
    "trading", "wealth", "actuary", "cfa", "valuation", "fintech",
    "taxation", "financial", "finance", "economist", "treasury",
    "portfolio", "asset", "fund", "insurance", "underwriter",
    "stockbroker", "brokerage",
})

_LAW_KW = frozenset({
    "law", "lawyer", "legal", "attorney", "litigation", "litigator",
    "advocate", "judge", "judicial", "prosecutor", "arbitration",
    "arbitrator", "counsel", "barrister", "solicitor", "paralegal",
    "compliance", "regulatory", "intellectual property", "ip law",
})

_CORE_ENG_KW = frozenset({
    "mechanical", "civil", "aerospace", "aeronautical", "electrical",
    "chemical", "structural", "automobile", "automotive", "metallurgy",
    "mechatronics", "biomedical engineer", "environmental engineer",
    "industrial engineer", "petroleum", "material", "nuclear",
    "manufacturing", "process engineer",
})

_CULINARY_KW = frozenset({
    "cook", "cooking", "chef", "baker", "bakery", "pastry", "culinary",
    "barista", "sommelier", "restaurant", "kitchen", "gastronomy", "catering",
    "sous chef", "garde manger", "line cook", "food beverage", "hospitality"
})

_TECH_KW = frozenset({
    "software", "developer", "devops", "cloud", "security", "data",
    "machine learning", "frontend", "backend", "full stack", "mobile",
    "ios", "android", "game", "blockchain", "qa", "sre", "sdet",
    "ai", "ml", "nlp", "computer vision", "robotics", "embedded", "iot",
    "cybersecurity", "sde", "engineer",  # 'engineer' last — lowest priority
})


def _detect_role_domain(target_role: str, benchmark_categories: list[str]) -> str:
    """Detect the career domain from role title and benchmark skill categories.

    Returns one of: 'culinary', 'medicine', 'finance', 'law', 'core_engineering', 'tech', 'general'

    Uses token (whole-word) matching to avoid false positives like 'ca' matching 'mechanical'.
    Short keywords (len <= 3) are only matched as whole tokens; longer keywords also use substring.
    """
    text = target_role.lower()
    tokens = set(re.sub(r"[^\w\s]", " ", text).split())
    all_cats = " ".join(c.lower() for c in benchmark_categories)

    def _kw_match(kw_set: frozenset) -> bool:
        for kw in kw_set:
            if len(kw) <= 3:
                # Short keywords (e.g. 'ca', 'law') must be whole tokens only
                if kw in tokens:
                    return True
            else:
                # Longer keywords can substring-match in the full text
                if kw in tokens or kw in text:
                    return True
        return False

    # Culinary & Hospitality
    if _kw_match(_CULINARY_KW) or "culinary" in all_cats or "food" in all_cats or "cooking" in all_cats:
        return "culinary"

    # Medicine wins over everything else
    if _kw_match(_MEDICINE_KW) or "clinical" in all_cats or "medicine" in all_cats or "healthcare" in all_cats:
        return "medicine"

    if _kw_match(_LAW_KW) or "legal" in all_cats or "law" in all_cats:
        return "law"

    if _kw_match(_FINANCE_KW) or "finance" in all_cats or "accounting" in all_cats:
        return "finance"

    if _kw_match(_CORE_ENG_KW) or "mechanical" in all_cats or "civil" in all_cats:
        return "core_engineering"

    # Tech: match explicit software, computing, and data/AI disciplines
    tech_markers = (
        "software", "developer", "devops", "frontend", "backend", "cloud",
        "machine learning", "data science", "data scientist", "data engineer",
        "machine learning engineer", "ai engineer", "sde", "swe",
        "full stack", "fullstack", "qa automation", "sdet", "cybersecurity",
        "web developer", "blockchain", "mobile app", "ios developer",
        "android developer", "systems architect", "network engineer",
        "site reliability", "database administrator", "database",
    )
    if any(kw in text for kw in tech_markers):
        return "tech"

    # Only treat 'engineer' as tech if accompanied by software/computing qualifiers
    software_qualifiers = (
        "software", "systems", "cloud", "platform", "infrastructure",
        "firmware", "embedded", "network", "devops", "sre", "security",
        "data", "ai", "ml", "web", "app", "code", "frontend", "backend"
    )
    if "engineer" in tokens and any(q in text for q in software_qualifiers):
        return "tech"
    if any(t in tokens for t in ("developer", "programmer", "coder")):
        return "tech"

    if any(c in all_cats for c in ("software", "programming", "devops", "cloud_computing", "machine_learning")):
        return "tech"

    return "general"


# ──────────────────────────────────────────────────────────────────────────────
# Domain-aware phase naming
# ──────────────────────────────────────────────────────────────────────────────

_PHASE_TITLES: dict[str, list[str]] = {
    "culinary": [
        "Culinary Foundations, Knife Skills & Food Safety",
        "Station Mastery, Menu Execution & Cooking Techniques",
        "Kitchen Leadership, Recipe Costing & Operations",
        "Executive Audition, Signature Tasting & Placement",
    ],
    "tech": [
        "Foundations & Core Bedrock",
        "Core Domain Architecture & Systems",
        "Production Scale, Infrastructure & DevOps",
        "Placement Readiness, Mock Interviews & Capstone Defense",
    ],
    "medicine": [
        "Clinical Foundations & Core Medical Sciences",
        "Diagnostic Specialization & Clinical Procedures",
        "Hospital Systems, Rotations & Advanced Practice",
        "Board Exams, Residency Applications & Placement Readiness",
    ],
    "finance": [
        "Quantitative Foundations & Financial Accounting",
        "Financial Modeling, Valuation & Capital Markets",
        "Advanced Products, Deal Execution & Portfolio Management",
        "Placement Readiness, Technical Interviews & Case Drills",
    ],
    "law": [
        "Legal Theory, Jurisprudence & Constitutional Foundations",
        "Contract Practice, Research & Statutory Drafting",
        "Litigation, Advocacy & Specialized Practice Areas",
        "Bar Exam Preparation, Moot Court & Career Placement",
    ],
    "core_engineering": [
        "Engineering Fundamentals & Core Sciences",
        "Design Principles, CAD/CAE & Simulation",
        "Manufacturing, Systems Integration & Quality Standards",
        "Industry Certification, Portfolio & Placement Readiness",
    ],
    "general": [
        "Domain Fundamentals & Core Knowledge",
        "Applied Practice & Skill Development",
        "Advanced Systems, Tools & Professional Standards",
        "Placement Readiness, Portfolio & Career Positioning",
    ],
}


def _get_phase_title(domain: str, phase_idx: int, skills_short: str) -> str:
    """Build a phase title for the given domain and phase index (0-based, last = final)."""
    titles = _PHASE_TITLES.get(domain, _PHASE_TITLES["general"])
    raw = titles[min(phase_idx, len(titles) - 1)]
    clean_raw = re.sub(r"^Phase\s*\d+\s*:\s*", "", raw, flags=re.IGNORECASE).strip()
    num = phase_idx + 1
    if skills_short:
        return f"Phase {num}: {clean_raw} ({skills_short})"
    return f"Phase {num}: {clean_raw}"


def _get_final_phase_title(domain: str, phase_num: int) -> str:
    titles = _PHASE_TITLES.get(domain, _PHASE_TITLES["general"])
    raw = titles[-1]
    clean_raw = re.sub(r"^Phase\s*\d+\s*:\s*", "", raw, flags=re.IGNORECASE).strip()
    return f"Phase {phase_num}: {clean_raw}"


# ──────────────────────────────────────────────────────────────────────────────
# Domain-aware skill tier classification
# ──────────────────────────────────────────────────────────────────────────────

_TIER_KEYWORDS: dict[str, tuple[tuple[str, ...], tuple[str, ...], tuple[str, ...]]] = {
    # (tier1_kw, tier2_kw, tier3_kw)
    "culinary": (
        # tier1 = knife skills, food safety & sanitation, mise en place, fundamentals
        (
            "knife", "mise en place", "safety", "hygiene", "haccp", "sanitation",
            "sauce", "sauces", "stocks", "broth", "palate", "seasoning",
            "cutting", "prep", "flavor", "cleanliness",
        ),
        # tier2 = station cooking, butchery, pastry, line execution
        (
            "station", "line cooking", "sauté", "saute", "grill", "fry", "roast",
            "butchery", "fabrication", "meat", "poultry", "seafood", "fish",
            "pastry", "baking", "bread", "plating", "presentation", "recipe",
        ),
        # tier3 = brigade leadership, menu engineering, kitchen operations & costing
        (
            "brigade", "leadership", "sous chef", "head chef", "menu engineering",
            "costing", "yield", "inventory", "purchasing", "sourcing",
            "management", "expediting", "banquet", "catering", "operations",
        ),
    ),
    "tech": (
        (
            "python", "java", "c++", "cpp", "c#", "golang", "go", "rust",
            "javascript", "typescript", "ruby", "php", "swift", "kotlin",
            "sql", "git", "linux", "bash", "dsa", "data structures",
            "algorithms", "html", "css", "math", "statistics", "http",
        ),
        (
            "react", "next", "fastapi", "django", "flask", "express",
            "node", "spring", "vue", "angular", "postgresql", "postgres",
            "mysql", "mongodb", "rest", "graphql", "api", "orm", "prisma",
            "sqlalchemy", "pandas", "numpy", "scikit",
        ),
        (
            "docker", "kubernetes", "k8s", "redis", "kafka", "rabbitmq",
            "system design", "microservices", "aws", "azure", "gcp",
            "cloud", "ci/cd", "devops", "terraform", "security",
            "caching", "distributed",
        ),
    ),
    "medicine": (
        # tier1 = basic sciences & clinical foundations
        (
            "anatomy", "physiology", "biochemistry", "pathology", "microbiology",
            "pharmacology", "genetics", "embryology", "histology",
            "clinical medicine", "patient", "diagnosis", "examination",
            "medical history", "vital signs", "physical examination",
        ),
        # tier2 = diagnostic procedures & specialization
        (
            "echocardiography", "ecg", "electrocardiogram", "diagnostic imaging",
            "radiology", "endoscopy", "biopsy", "laboratory", "blood work",
            "clinical procedures", "surgical skills", "interventional",
            "therapeutics", "clinical pharmacology",
        ),
        # tier3 = advanced hospital systems & specialty practice
        (
            "icu", "critical care", "emergency medicine", "surgery",
            "surgical", "hospital management", "clinical governance",
            "evidence-based medicine", "research methodology", "clinical trials",
            "medical ethics", "healthcare systems", "public health",
        ),
    ),
    "finance": (
        # tier1 = accounting & quant foundations
        (
            "accounting", "financial statements", "balance sheet", "income statement",
            "cash flow", "excel", "statistics", "probability", "economics",
            "financial accounting", "us gaap", "ifrs", "bookkeeping",
        ),
        # tier2 = modeling & markets
        (
            "financial modeling", "dcf", "lbo", "valuation", "bloomberg",
            "equity research", "corporate finance", "capital markets",
            "fixed income", "derivatives", "risk management",
        ),
        # tier3 = advanced products & deal execution
        (
            "m&a", "mergers", "acquisitions", "private equity", "hedge fund",
            "portfolio management", "quantitative", "algorithmic", "trading",
            "structured products", "investment banking", "deal structuring",
        ),
    ),
    "law": (
        # tier1 = jurisprudence & theory
        (
            "jurisprudence", "constitutional law", "criminal law", "tort law",
            "contract law", "legal theory", "legal research", "case analysis",
            "statutory interpretation", "legal writing",
        ),
        # tier2 = practice areas & drafting
        (
            "contract drafting", "corporate law", "commercial law", "litigation",
            "court procedure", "evidence law", "civil procedure", "due diligence",
            "legal drafting", "negotiation",
        ),
        # tier3 = advanced advocacy & specialized areas
        (
            "appellate", "arbitration", "intellectual property", "tax law",
            "securities law", "antitrust", "employment law", "international law",
            "mergers acquisitions law", "regulatory compliance",
        ),
    ),
    "core_engineering": (
        # tier1 = engineering sciences
        (
            "mathematics", "calculus", "thermodynamics", "mechanics", "statics",
            "dynamics", "fluid mechanics", "materials science", "chemistry",
            "physics", "engineering drawing", "technical drawing",
        ),
        # tier2 = design & simulation
        (
            "cad", "autocad", "solidworks", "catia", "ansys", "fea", "fem",
            "simulation", "stress analysis", "design principles", "prototyping",
            "circuit design", "pcb", "plc", "control systems",
        ),
        # tier3 = manufacturing & systems
        (
            "manufacturing", "quality control", "six sigma", "lean manufacturing",
            "project management", "supply chain", "systems integration",
            "maintenance", "operations", "commissioning", "safety standards",
            "iso", "gdt", "tolerance analysis",
        ),
    ),
    "general": (
        ("foundation", "fundamental", "core", "basic", "introduction", "principles"),
        ("applied", "practice", "intermediate", "technique", "methodology", "framework"),
        ("advanced", "strategic", "leadership", "management", "systems", "professional"),
    ),
}


def _get_domain_skill_tier(skill_name: str, domain: str, benchmark_map: dict) -> int:
    """Classify a skill into tier 1/2/3 using domain-specific keyword sets and benchmark metadata."""
    s_clean = skill_name.strip().lower()

    # Check benchmark category first (highest confidence)
    b = benchmark_map.get(s_clean)
    if b:
        cat = (b.category or "").lower()
        # Universal category mappings
        if cat in ("fundamentals", "core", "foundation", "language", "sciences", "theory",
                   "clinical", "accounting", "jurisprudence", "mechanics"):
            return 1
        if cat in ("database", "framework", "applied", "domain", "api", "diagnostics",
                   "modeling", "drafting", "design", "simulation", "pharmacology"):
            return 2
        if cat in ("architecture", "infrastructure", "cloud", "advanced", "devops",
                   "security", "systems", "advocacy", "manufacturing", "critical_care",
                   "procedures", "deal", "arbitration"):
            return 3
        if b.prerequisites:
            return 2 if len(b.prerequisites) == 1 else 3

    # Domain-specific keyword matching
    tier_kws = _TIER_KEYWORDS.get(domain, _TIER_KEYWORDS["general"])
    t1_kw, t2_kw, t3_kw = tier_kws

    for kw in t1_kw:
        if kw in s_clean:
            return 1
    for kw in t3_kw:
        if kw in s_clean:
            return 3
    for kw in t2_kw:
        if kw in s_clean:
            return 2

    return 2  # safe default: intermediate


class CareerForgeAgent:
    """Orchestrates market research, gap calculation, RAG retrieval, and adaptive planning."""

    def __init__(self, db: DatabaseManager | None = None, llm_client: AzureOpenAIClient | None = None):
        self.db = db or get_db()
        self.llm = llm_client or AzureOpenAIClient()

    def generate_initial_roadmap(
        self,
        profile: StudentProfile
    ) -> tuple[list[MarketRequirement], list[SkillGap], Roadmap]:
        """Execute Steps 1 to 5 of the 7-Step Loop.

        1. Research: Gather market requirements with source citations.
        2. Analyze & Compare: Calculate deterministic skill gaps.
        3. Recommend & Retrieve: Local RAG search for curated study guides.
        4. Plan: Allocate hours, partition into progressive phases, and enrich milestones.
        5. Persist: Store profile and initial roadmap in SQLite.
        """
        # Ensure profile has unique ID
        if not profile.id:
            profile.id = f"std_{uuid.uuid4().hex[:8]}"

        # Step 1: Research live market benchmarks
        market_reqs = web_search_market(profile.target_role)

        # Merge user-calibrated skills if any were specified in the profile form
        existing_req_names = {r.skill.strip().lower() for r in market_reqs}
        for s in profile.skills:
            if s.name.strip().lower() not in existing_req_names:
                market_reqs.append(
                    MarketRequirement(
                        skill=s.name.strip(),
                        required_level=min(5.0, max(3.0, round(s.proficiency + 0.5, 1))),
                        demand_level="high-priority",
                        source_url="https://roadmap.sh",
                        notes=f"User-calibrated target competency for {profile.target_role}."
                    )
                )

        # Step 2: Deterministic skill gap calculation
        gaps = calculate_skill_gaps(profile.skills, market_reqs)

        # Step 3 & 4: Plan multi-phase roadmap
        phases = self._build_roadmap_phases(profile, gaps)

        total_hours = sum(p.estimated_hours for p in phases)
        estimated_weeks = max(1, math.ceil(total_hours / max(1, profile.available_hours_per_week)))

        roadmap = Roadmap(
            profile_id=profile.id,
            target_role=profile.target_role,
            total_estimated_hours=total_hours,
            available_hours_per_week=profile.available_hours_per_week,
            estimated_weeks=estimated_weeks,
            phases=phases,
            version=1
        )

        # Step 5: Save in database
        self.db.save_profile(profile)
        self.db.save_roadmap(roadmap)

        return market_reqs, gaps, roadmap

    def adapt_roadmap_on_assessment(
        self,
        assessment_input: AssessmentInput
    ) -> tuple[AssessmentResult, list[SkillGap], Roadmap, str]:
        """Execute Steps 6 and 7 of the 7-Step Loop (The Hero Adaptation Feature).

        6. Assess: Deterministically score the student's progress and update skill level.
        7. Adapt: Recalculate skill gaps, deprioritize mastered skills, rebalance phase hours,
                  and increment roadmap revision version.
        """
        profile = self.db.get_profile(assessment_input.profile_id)
        if not profile:
            if assessment_input.profile_id.startswith("demo") or assessment_input.profile_id in ("current", "default"):
                from app.models.profile import Skill
                profile = StudentProfile(
                    id=assessment_input.profile_id,
                    name="Aarav Sharma",
                    degree="B.Tech",
                    branch="Computer Science & Engineering",
                    year=3,
                    target_role="Backend Engineer",
                    available_hours_per_week=15,
                    skills=[
                        Skill(name="Python", proficiency=3.0),
                        Skill(name="SQL", proficiency=2.0),
                        Skill(name="Docker", proficiency=1.5),
                        Skill(name="System Design", proficiency=1.0),
                        Skill(name="Git", proficiency=3.0),
                    ],
                )
                self.db.save_profile(profile)
            else:
                raise ValueError(f"Student profile '{assessment_input.profile_id}' not found.")

        # Narrow profile_id to non-optional str for strict type-checking
        profile_id: str = profile.id if profile.id is not None else assessment_input.profile_id

        current_roadmap = self.db.get_roadmap(assessment_input.profile_id)
        if not current_roadmap:
            # If no roadmap exists, generate one first
            _, _, current_roadmap = self.generate_initial_roadmap(profile)

        # Find current skill proficiency
        current_level = 0.0
        norm_target_skill = assessment_input.skill.strip().lower()
        for s in profile.skills:
            s_name = s.name.strip().lower()
            if (
                s_name == norm_target_skill
                or (len(norm_target_skill) > 4 and norm_target_skill in s_name)
                or (len(s_name) > 4 and s_name in norm_target_skill)
            ):
                current_level = s.proficiency
                break

        # Step 6: Deterministic assessment evaluation
        result = evaluate_assessment(
            profile_id=profile_id,
            skill=assessment_input.skill.strip(),
            current_level=current_level,
            score_percentage=assessment_input.score_percentage
        )

        # Persist updated skill in profile and log assessment event
        self.db.update_skill_in_profile(profile_id, result.skill, result.updated_level)
        self.db.save_assessment(result)

        # Refresh profile & recompute gaps
        updated_profile = self.db.get_profile(profile_id) or profile
        market_reqs = web_search_market(profile.target_role)
        new_gaps = calculate_skill_gaps(updated_profile.skills, market_reqs)

        # Step 7: Adapt Roadmap dynamically
        assessed_gap = next(
            (
                g for g in new_gaps
                if g.skill.strip().lower() == norm_target_skill
                or (len(norm_target_skill) > 4 and norm_target_skill in g.skill.strip().lower())
                or (len(g.skill.strip()) > 4 and g.skill.strip().lower() in norm_target_skill)
            ),
            None
        )
        is_mastered = (assessed_gap is not None and assessed_gap.priority == PriorityLevel.MASTERED) or (assessed_gap is None)

        hours_adjusted = 0
        updated_phases: list[RoadmapPhase] = []

        for phase in current_roadmap.phases:
            matching_skills = [
                s for s in phase.skills_covered
                if s.strip().lower() == norm_target_skill
                or (len(norm_target_skill) > 3 and norm_target_skill in s.strip().lower())
                or (len(s.strip()) > 3 and s.strip().lower() in norm_target_skill)
            ]

            if matching_skills:
                if is_mastered:
                    # Deprioritize: if all skills in phase are mastered, mark phase completed
                    rem_skills = [s for s in phase.skills_covered if s not in matching_skills]
                    if not rem_skills:
                        hours_adjusted += phase.estimated_hours
                        phase.status = PhaseStatus.COMPLETED
                        phase.estimated_hours = max(2, int(phase.estimated_hours * 0.1))  # Retain minor review buffer
                    else:
                        freed = max(5, int(phase.estimated_hours * 0.4))
                        hours_adjusted += freed
                        phase.estimated_hours = max(5, phase.estimated_hours - freed)
                        phase.skills_covered = rem_skills
                else:
                    # Skill improved but not fully mastered: reduce hours proportional to delta
                    reduction = max(2, int(result.level_delta * 6))
                    hours_adjusted += reduction
                    phase.estimated_hours = max(5, phase.estimated_hours - reduction)

            updated_phases.append(phase)

        # Recompute totals and weeks
        active_hours = sum(p.estimated_hours for p in updated_phases if p.status != PhaseStatus.COMPLETED)
        new_total_hours = max(1, active_hours)
        new_weeks = max(1, math.ceil(new_total_hours / max(1, updated_profile.available_hours_per_week)))

        adapted_roadmap = Roadmap(
            profile_id=profile_id,
            target_role=profile.target_role,
            total_estimated_hours=new_total_hours,
            available_hours_per_week=updated_profile.available_hours_per_week,
            estimated_weeks=new_weeks,
            phases=updated_phases,
            version=current_roadmap.version + 1
        )

        self.db.save_roadmap(adapted_roadmap)

        # Generate explainable coaching summary
        summary = self.llm.generate_adaptation_summary(
            skill=result.skill,
            previous_level=result.previous_level,
            updated_level=result.updated_level,
            score_percentage=result.score_percentage,
            hours_saved_or_shifted=hours_adjusted,
            deprioritized=is_mastered
        )

        return result, new_gaps, adapted_roadmap, summary

    def _build_roadmap_phases(
        self,
        profile: StudentProfile,
        gaps: list[SkillGap]
    ) -> list[RoadmapPhase]:
        """Deterministically partitions skills into balanced progressive phases.

        Fully domain-aware: tech, medicine, finance, law, core_engineering, general.
        Phase titles, skill tiers, resource queries, and milestone guidance are all
        tailored to the detected career domain.
        """
        unmastered = [g for g in gaps if g.priority != PriorityLevel.MASTERED]
        mastered = [g for g in gaps if g.priority == PriorityLevel.MASTERED]

        phases: list[RoadmapPhase] = []

        # ── Resolve role & detect domain ─────────────────────────────────────
        from app.tools.role_resolver import get_role_resolver
        resolver = get_role_resolver()
        resolved = resolver.resolve_role(profile.target_role)
        benchmark_map = {b.name.lower().strip(): b for b in resolved.benchmark}
        benchmark_cats = [b.category or "" for b in resolved.benchmark]
        domain = _detect_role_domain(profile.target_role, benchmark_cats)

        # ── Edge case: all skills already mastered ───────────────────────────
        if not unmastered:
            resources = retrieve_knowledge_base(
                f"{profile.target_role} advanced assessment preparation", top_k=3
            )
            phases.append(
                RoadmapPhase(
                    phase_number=1,
                    title=_get_final_phase_title(domain, 1),
                    skills_covered=[m.skill for m in mastered[:3]] or ["Comprehensive Domain Competency"],
                    estimated_hours=max(10, profile.available_hours_per_week * 2),
                    learning_objectives=[
                        f"Review high-frequency advanced assessment questions and edge-case patterns for {profile.target_role}.",
                        "Participate in timed mock evaluation rounds and domain-specific problem solving under pressure.",
                        "Finalize case studies, portfolio artifacts, and credentials for top-tier placement."
                    ],
                    resources=resources,
                    status=PhaseStatus.IN_PROGRESS
                )
            )
            return phases

        # ── Sort gaps by domain-aware tier then gap magnitude ────────────────
        sorted_gaps = sorted(
            unmastered,
            key=lambda g: (_get_domain_skill_tier(g.skill, domain, benchmark_map), -g.gap, g.skill.lower())
        )
        total_unmastered = len(sorted_gaps)

        tier1_gaps = [g for g in sorted_gaps if _get_domain_skill_tier(g.skill, domain, benchmark_map) == 1]
        tier2_gaps = [g for g in sorted_gaps if _get_domain_skill_tier(g.skill, domain, benchmark_map) == 2]
        tier3_gaps = [g for g in sorted_gaps if _get_domain_skill_tier(g.skill, domain, benchmark_map) == 3]

        p1_gaps: list[SkillGap] = []
        p2_gaps: list[SkillGap] = []
        p3_gaps: list[SkillGap] = []

        if total_unmastered == 1:
            p1_gaps = [sorted_gaps[0]]
        elif total_unmastered == 2:
            if tier1_gaps and (tier2_gaps or tier3_gaps):
                p1_gaps = tier1_gaps
                p2_gaps = tier2_gaps or tier3_gaps
            else:
                p1_gaps = [sorted_gaps[0]]
                p2_gaps = [sorted_gaps[1]]
        else:
            # 3 or more unmastered competencies
            if tier1_gaps and tier2_gaps and tier3_gaps:
                p1_gaps = tier1_gaps
                p2_gaps = tier2_gaps
                p3_gaps = tier3_gaps
            elif tier1_gaps and tier2_gaps and not tier3_gaps:
                if len(tier1_gaps) >= 2:
                    mid = len(tier1_gaps) // 2
                    p1_gaps = tier1_gaps[:mid]
                    p2_gaps = tier1_gaps[mid:]
                    p3_gaps = tier2_gaps
                else:
                    p1_gaps = tier1_gaps
                    mid = len(tier2_gaps) // 2
                    p2_gaps = tier2_gaps[:mid]
                    p3_gaps = tier2_gaps[mid:]
            elif not tier1_gaps and tier2_gaps and tier3_gaps:
                p1_gaps = tier2_gaps
                p2_gaps = tier3_gaps
            elif tier1_gaps and not tier2_gaps and tier3_gaps:
                p1_gaps = tier1_gaps
                p2_gaps = tier3_gaps
            else:
                # All in a single tier: slice into 3 balanced sub-phases
                s1 = math.ceil(total_unmastered / 3)
                s2 = math.ceil(2 * total_unmastered / 3)
                p1_gaps = sorted_gaps[:s1]
                p2_gaps = sorted_gaps[s1:s2]
                p3_gaps = sorted_gaps[s2:]

        # ── Student context for LLM ───────────────────────────────────────────
        student_context = {
            "name": profile.name,
            "degree": profile.degree,
            "branch": profile.branch,
            "year": profile.year,
            "target_role": profile.target_role,
            "prep_level": profile.current_prep_level,
            "available_hours_per_week": profile.available_hours_per_week,
            "domain": domain,
        }

        def make_skill_details(g_list: list[SkillGap]) -> list[dict]:
            return [
                {
                    "skill": g.skill,
                    "current": g.current_level,
                    "required": g.required_level,
                    "gap": g.gap,
                    "demand": g.demand_level,
                }
                for g in g_list
            ]

        # Calculate planned phases count
        active_learning_phase_count = 1 + (1 if p2_gaps else 0) + (1 if p3_gaps else 0)
        total_planned_phases = active_learning_phase_count + 1  # +1 for final placement phase

        # ── Phase 1 ───────────────────────────────────────────────────────────
        p1_skills = [g.skill for g in p1_gaps]
        p1_hours = max(10, round(sum(g.gap for g in p1_gaps) * HOURS_PER_GAP_UNIT))
        p1_resources = self._gather_resources_for_skills(p1_skills, profile.target_role, domain)
        p1_objectives = self.llm.enrich_phase_objectives(
            phase_title=_get_phase_title(domain, 0, ", ".join(p1_skills[:2])),
            skills=p1_skills,
            allocated_hours=p1_hours,
            target_role=profile.target_role,
            student_level=profile.current_prep_level,
            phase_number=1,
            total_phases=total_planned_phases,
            is_final_phase=False,
            skill_details=make_skill_details(p1_gaps),
            student_context=student_context,
            domain=domain,
        )
        phases.append(
            RoadmapPhase(
                phase_number=1,
                title=_get_phase_title(domain, 0, ", ".join(p1_skills[:2])),
                skills_covered=p1_skills,
                estimated_hours=p1_hours,
                learning_objectives=p1_objectives,
                resources=p1_resources,
                status=PhaseStatus.IN_PROGRESS
            )
        )

        # ── Phase 2 ───────────────────────────────────────────────────────────
        if p2_gaps:
            p2_skills = [g.skill for g in p2_gaps]
            p2_hours = max(8, round(sum(g.gap for g in p2_gaps) * HOURS_PER_GAP_UNIT))
            p2_resources = self._gather_resources_for_skills(p2_skills, profile.target_role, domain)
            p2_objectives = self.llm.enrich_phase_objectives(
                phase_title=_get_phase_title(domain, 1, ", ".join(p2_skills[:2])),
                skills=p2_skills,
                allocated_hours=p2_hours,
                target_role=profile.target_role,
                student_level=profile.current_prep_level,
                phase_number=2,
                total_phases=total_planned_phases,
                is_final_phase=False,
                skill_details=make_skill_details(p2_gaps),
                student_context=student_context,
                domain=domain,
            )
            phases.append(
                RoadmapPhase(
                    phase_number=2,
                    title=_get_phase_title(domain, 1, ", ".join(p2_skills[:2])),
                    skills_covered=p2_skills,
                    estimated_hours=p2_hours,
                    learning_objectives=p2_objectives,
                    resources=p2_resources,
                    status=PhaseStatus.NOT_STARTED
                )
            )

        # ── Phase 3 ───────────────────────────────────────────────────────────
        if p3_gaps:
            p3_skills = [g.skill for g in p3_gaps]
            p3_num = len(phases) + 1
            p3_hours = max(8, round(sum(g.gap for g in p3_gaps) * HOURS_PER_GAP_UNIT))
            p3_resources = self._gather_resources_for_skills(p3_skills, profile.target_role, domain)
            p3_objectives = self.llm.enrich_phase_objectives(
                phase_title=_get_phase_title(domain, 2, ", ".join(p3_skills[:2])),
                skills=p3_skills,
                allocated_hours=p3_hours,
                target_role=profile.target_role,
                student_level=profile.current_prep_level,
                phase_number=p3_num,
                total_phases=total_planned_phases,
                is_final_phase=False,
                skill_details=make_skill_details(p3_gaps),
                student_context=student_context,
                domain=domain,
            )
            phases.append(
                RoadmapPhase(
                    phase_number=p3_num,
                    title=_get_phase_title(domain, 2, ", ".join(p3_skills[:2])),
                    skills_covered=p3_skills,
                    estimated_hours=p3_hours,
                    learning_objectives=p3_objectives,
                    resources=p3_resources,
                    status=PhaseStatus.NOT_STARTED
                )
            )

        # ── Final Phase: Placement Readiness ──────────────────────────────────
        final_num = len(phases) + 1
        final_hours = max(8, profile.available_hours_per_week)
        final_resources = retrieve_knowledge_base(
            f"{profile.target_role} placement assessment preparation", top_k=3
        )
        final_skills = [g.skill for g in sorted_gaps[:3]] or ["Placement Strategy & Portfolio"]
        final_objectives = self.llm.enrich_phase_objectives(
            phase_title=_get_final_phase_title(domain, final_num),
            skills=final_skills,
            allocated_hours=final_hours,
            target_role=profile.target_role,
            student_level=profile.current_prep_level,
            phase_number=final_num,
            total_phases=total_planned_phases,
            is_final_phase=True,
            skill_details=make_skill_details(sorted_gaps[:3]),
            student_context=student_context,
            domain=domain,
        )
        phases.append(
            RoadmapPhase(
                phase_number=final_num,
                title=_get_final_phase_title(domain, final_num),
                skills_covered=final_skills,
                estimated_hours=final_hours,
                learning_objectives=final_objectives,
                resources=final_resources,
                status=PhaseStatus.NOT_STARTED
            )
        )

        return phases

    def _gather_resources_for_skills(
        self, skills: list[str], role: str, domain: str = "tech"
    ) -> list[ResourceItem]:
        """Aggregate curated study resources from local RAG or authentic role benchmark docs."""
        all_resources: list[ResourceItem] = []
        seen_refs: set[str] = set()

        # Build skill-to-url map from role benchmarks
        from app.tools.role_resolver import get_role_resolver
        resolver = get_role_resolver()
        resolved = resolver.resolve_role(role)
        skill_doc_map = {b.name.lower().strip(): (b.source_url or "https://roadmap.sh") for b in resolved.benchmark}

        # Domain-appropriate fallback URL
        domain_fallback_url = {
            "medicine": "https://www.amboss.com",
            "finance": "https://www.cfainstitute.org",
            "law": "https://www.law.cornell.edu",
            "core_engineering": "https://www.engineeringtoolbox.com",
            "general": "https://roadmap.sh",
            "tech": "https://roadmap.sh",
        }.get(domain, "https://roadmap.sh")

        for skill in skills:
            skill_clean = skill.strip()
            norm_skill = skill_clean.lower()
            results = retrieve_knowledge_base(skill_clean, top_k=2)

            matched_curated = False
            for r in results:
                if r.url_or_ref not in seen_refs:
                    seen_refs.add(r.url_or_ref)
                    all_resources.append(r)
                    matched_curated = True

            # If no curated markdown guide matches, provide benchmark doc link
            if not matched_curated:
                doc_url = skill_doc_map.get(norm_skill) or domain_fallback_url
                if doc_url not in seen_refs:
                    seen_refs.add(doc_url)
                    all_resources.append(
                        ResourceItem(
                            title=f"{skill_clean} — Official Reference & Study Guide",
                            url_or_ref=doc_url,
                            resource_type="official_doc"
                        )
                    )

        return all_resources[:4]
