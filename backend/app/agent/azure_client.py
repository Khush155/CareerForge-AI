"""Azure OpenAI Client for CareerForge AI.

Manages interactions with Azure OpenAI (gpt-4o-mini) deployed in Azure AI Foundry.
Adheres strictly to the architectural constraint:
- LLM is used ONLY for qualitative explanations, customized learning milestones, and study tips.
- All numbers, gaps, and hours are calculated deterministically beforehand.
- Includes automatic fallback to mock/deterministic mode if Azure is unreachable or credentials are unset.
- DOMAIN-AWARE: milestone language and guidance are tailored per career domain.
"""
import json
import logging
import os
import re

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("careerforge.agent.azure_client")


# ──────────────────────────────────────────────────────────────────────────────
# Domain-specific deterministic milestone fallbacks
# ──────────────────────────────────────────────────────────────────────────────

def _fallback_milestones_phase1(skills: list[str], target_role: str, domain: str, skill_details: list[dict] | None) -> list[str]:
    """Return domain-appropriate Phase 1 (Foundations) milestones."""
    s = ", ".join(skills) if skills else target_role

    if domain == "culinary":
        return [
            f"Master essential kitchen safety, personal hygiene, and HACCP commercial sanitation standards for {target_role}.",
            f"Build foundational precision knife skills (julienne, brunoise, chiffonade) and station mise en place for {s}.",
            "Practice core heat transfer and foundational cooking techniques: sautéing, braising, roasting, and mother sauce preparation.",
            "Establish systematic recipe measurement, ingredient prep lists, and palate calibration (salt/acid/fat balancing)."
        ]
    if domain == "medicine":
        return [
            f"Build a strong foundation in core medical sciences (Anatomy, Physiology, Biochemistry) essential for {target_role}.",
            f"Study systematic clinical examination techniques and patient history-taking methodology for {s}.",
            "Complete structured pre-clinical laboratory sessions covering histology, pathology slides, and diagnostic basics.",
            "Pass formative MCQ-based self-assessments to validate core science understanding before clinical rotations."
        ]
    if domain == "finance":
        return [
            f"Master financial accounting fundamentals (Income Statement, Balance Sheet, Cash Flow) required for {target_role}.",
            f"Build quantitative foundations: statistics, time-value of money, Excel financial functions, and {s}.",
            "Complete structured exercises in financial ratio analysis and industry benchmarking.",
            "Solve 30+ quantitative aptitude problems per week to develop the numerical fluency required in finance roles."
        ]
    if domain == "law":
        return [
            f"Establish a rigorous foundation in constitutional law, tort law, and contract law principles for {target_role}.",
            f"Build strong legal research skills: case precedent analysis, statutory interpretation, and {s}.",
            "Draft 5 structured legal case briefs demonstrating IRAC (Issue, Rule, Application, Conclusion) methodology.",
            "Complete foundational reading across assigned case books and simulate a basic moot court argument."
        ]
    if domain == "core_engineering":
        return [
            f"Solidify engineering mathematics: calculus, linear algebra, differential equations critical for {target_role}.",
            f"Study core engineering mechanics: statics, dynamics, strength of materials, and thermodynamics for {s}.",
            "Complete lab practicals in material testing, measurement instruments, and technical drawing standards.",
            "Solve 20+ applied engineering problem sets per week with documented methodology and assumptions."
        ]

    if domain == "tech":
        milestones: list[str] = []
        if skill_details and len(skill_details) > 0:
            first = skill_details[0]
            curr = first.get("current", 0.0)
            req = first.get("required", 3.5)
            s_name = first.get("skill", skills[0] if skills else target_role)
            if curr > 0:
                milestones.append(
                    f"Advance {s_name} from current baseline ({curr}/5.0) to {req}/5.0 through core syntax, data structures, and idiomatic patterns."
                )
            else:
                milestones.append(
                    f"Build strong fundamentals in {s_name} from scratch: core syntax, execution models, and data types."
                )
        else:
            milestones.append(f"Establish core fundamentals, syntax patterns, and execution models for {s}.")

        milestones.extend([
            f"Configure modern local development workspace, linting, debugging tools, and Git workflow for {s}.",
            "Implement hands-on foundational lab exercises and algorithmic problem solving with unit test coverage.",
            "Build a standalone working micro-module demonstrating robust input validation, error handling, and clean code conventions."
        ])
        return milestones

    # General / Unclassified Professional Careers (NEVER tech assumptions)
    return [
        f"Build a rigorous foundation in core industry theory, operating principles, and terminology for {target_role}.",
        f"Master foundational workplace tools, standard operating procedures, and basic workflows for {s}.",
        "Study safety guidelines, industry compliance standards, and ethical professional conduct.",
        "Complete hands-on foundational exercises and case-based problem scenarios validating core competency."
    ]


def _fallback_milestones_phase2(skills: list[str], target_role: str, domain: str) -> list[str]:
    """Return domain-appropriate Phase 2 (Intermediate / Applied) milestones."""
    s = ", ".join(skills) if skills else target_role

    if domain == "culinary":
        return [
            f"Master commercial station line cooking (sauté, grill, fry, and garde manger) under simulated ticket rush timing for {target_role}.",
            f"Execute protein butchery and fabrication: primal cuts, poultry deboning, and seafood filleting for {s}.",
            "Prepare foundational artisan breads, laminated doughs, and plated pastry desserts under standard commercial recipes.",
            "Standardize portion control, yield testing, and high-aesthetic plating presentations meeting professional kitchen standards."
        ]
    if domain == "medicine":
        return [
            f"Complete clinical posting rotations in key specialties relevant to {target_role}: {s}.",
            "Interpret 50+ diagnostic investigations: X-rays, CT scans, ECGs, blood panels, and clinical pathology reports.",
            f"Practice 20+ clinical case presentations applying systematic diagnostic reasoning for {target_role}.",
            "Achieve competency in core clinical procedures: cannulation, catheterization, suturing, and basic surgical assist."
        ]
    if domain == "finance":
        return [
            f"Build a complete 3-statement financial model from scratch with scenario analysis for {target_role}.",
            f"Execute DCF, comparable company, and precedent transaction valuations in {s}.",
            "Complete 10+ valuation case studies across industries and present findings with buy/sell recommendations.",
            "Develop proficiency in Bloomberg Terminal, FactSet, or equivalent financial data platforms used in {target_role} roles."
        ]
    if domain == "law":
        return [
            f"Draft comprehensive legal contracts, MOUs, and agreements for corporate and commercial transactions ({s}).",
            f"Conduct in-depth legal research using Westlaw/SCC Online and produce a 10-page client advisory memo for {target_role}.",
            "Argue a structured moot court problem — developing courtroom advocacy, counter-argument, and precedent citation skills.",
            "Complete a supervised due diligence exercise for a simulated M&A or financing transaction."
        ]
    if domain == "core_engineering":
        return [
            f"Design a complete mechanical/structural component using CAD tools (SolidWorks/AutoCAD) for {target_role}.",
            f"Run FEA/FEM simulation on a structural design and interpret stress, strain, and deformation results for {s}.",
            "Complete a hands-on workshop project covering precision machining, welding, or PCB assembly per discipline.",
            "Document a technical design report meeting industry standards (ISO/GD&T) with tolerances, materials, and manufacturing notes."
        ]
    if domain == "tech":
        return [
            f"Architect clean service layers and RESTful/RPC API endpoints for {target_role} leveraging {s}.",
            "Design normalized database schemas, write optimized queries with indexing, and configure connection pooling.",
            "Implement business logic, secure authentication (JWT/OAuth), and structured middleware error handling.",
            "Develop an end-to-end multi-tier application feature and execute comprehensive integration tests."
        ]

    # General / Unclassified Professional Careers
    return [
        f"Execute hands-on intermediate projects and real-world applied workflows for {target_role} leveraging {s}.",
        "Analyze complex workplace case scenarios, identify bottlenecks, and implement structured solutions.",
        "Collaborate on deliverable documentation, industry reporting, and standard operating compliance.",
        f"Develop proficiency in standard specialized software, instrumentation, or analytical frameworks used in {target_role}."
    ]


def _fallback_milestones_phase3(skills: list[str], target_role: str, domain: str) -> list[str]:
    """Return domain-appropriate Phase 3 (Advanced / Systems) milestones."""
    s = ", ".join(skills) if skills else target_role

    if domain == "culinary":
        return [
            f"Lead kitchen brigade operations as Sous Chef / Expeditor: pass communication, ticket management, and timing coordination for {target_role}.",
            f"Implement inventory management, food cost accounting, supplier sourcing, and waste reduction protocols for {s}.",
            "Engineer seasonal tasting menus and develop recipe costing cards with target profit margin benchmarks.",
            "Conduct comprehensive kitchen health inspection audits, equipment preventive maintenance, and team safety drills."
        ]
    if domain == "medicine":
        return [
            f"Complete advanced specialty rotations: ICU critical care, emergency medicine, and {s} for {target_role}.",
            "Present 5 case-based seminars demonstrating evidence-based clinical decision-making and multidisciplinary team communication.",
            "Study healthcare governance, medical ethics, patient safety frameworks, and medicolegal responsibilities.",
            f"Prepare comprehensive case portfolio and clinical logbook demonstrating procedural competency for {target_role} specialty."
        ]
    if domain == "finance":
        return [
            f"Execute deal structuring, term sheet negotiation, and portfolio management simulations for {target_role}.",
            f"Study advanced derivative products, structured finance, and risk management frameworks ({s}).",
            "Model a leveraged buyout (LBO) or M&A transaction end-to-end including synergies, returns, and sensitivity analysis.",
            "Complete CFA-level or domain certification mock exams to validate advanced financial competency."
        ]
    if domain == "law":
        return [
            f"Handle a full-cycle litigation simulation: pleadings, discovery, trial motions, and appellate brief for {target_role}.",
            f"Develop expertise in specialized practice areas: {s} with annotated case portfolios.",
            "Complete a supervised client advisory engagement under senior counsel — including research, strategy, and client communication.",
            "Study advanced IP, cross-border regulatory compliance, or sector-specific legislation relevant to target practice area."
        ]
    if domain == "core_engineering":
        return [
            f"Manage a complete product lifecycle project: design, prototype, test, and manufacturability review for {target_role}.",
            f"Implement quality assurance protocols, Six Sigma / Lean methodology, and root-cause analysis tools for {s}.",
            "Complete a cross-functional systems integration project demonstrating subsystem interface control and commissioning.",
            "Obtain or simulate certification in core industry standards: ISO 9001, ASME, OSHA, or domain equivalent."
        ]
    if domain == "tech":
        return [
            f"Implement in-memory caching (e.g. Redis) and asynchronous background tasks to optimize latency for {s}.",
            "Containerize application services using Docker and configure automated CI/CD validation pipelines.",
            "Conduct concurrency benchmarking, stress testing, and rate limiting under simulated peak traffic.",
            "Harden system architecture with structured logging, health probes, and cloud deployment configuration."
        ]

    # General / Unclassified Professional Careers
    return [
        f"Manage advanced project lifecycles: scope definition, resource allocation, and milestone delivery for {target_role}.",
        f"Implement quality assurance frameworks, performance indicators, and risk mitigation strategies in {s}.",
        "Conduct executive presentations, stakeholder briefings, and cross-functional project reviews.",
        "Simulate industry audits, regulatory inspections, and operational stress scenarios."
    ]


def _fallback_milestones_final(target_role: str, domain: str) -> list[str]:
    """Return domain-appropriate Final Phase (Placement / Certification) milestones."""
    if domain == "culinary":
        return [
            f"Execute a timed multi-course signature tasting menu audition defending culinary technique and flavor composition for {target_role}.",
            "Compile a professional culinary portfolio: standardized recipe catalog, high-resolution plating photography, and verified stage logbook.",
            "Complete ServSafe Manager / Food Safety Manager certification mock drills and health code regulatory compliance review.",
            "Prepare for Executive Chef and brigade trial interviews: kitchen P&L management, labor scheduling, and culinary vision presentation."
        ]
    if domain == "medicine":
        return [
            f"Complete 3 full-length USMLE/NEET PG or specialty board exam mock papers with detailed performance analytics for {target_role}.",
            "Prepare a clinical residency application portfolio: personal statement, letters of recommendation, and ERAS/NEET-SS documentation.",
            "Conduct 5 structured specialty mock interviews with faculty mentors covering clinical case vignettes and ethical scenarios.",
            "Finalize elective rotations, publications, and clinical research abstracts for residency match and fellowship placement."
        ]
    if domain == "finance":
        return [
            f"Drill 200+ investment banking and finance technical interview questions: LBO, DCF, accounting, and brainteasers for {target_role}.",
            "Complete 10 Goldman Sachs / Morgan Stanley-style case study and deal structuring mock interviews.",
            "Formulate 5 structured STAR behavioral narratives demonstrating analytical excellence and client interaction experience.",
            "Finalize resume, LinkedIn, and cover letter with ATS optimization — targeting bulge bracket or top-tier firm pipelines."
        ]
    if domain == "law":
        return [
            f"Complete Bar Council / AIBE exam preparation with topic-wise mock tests and past-paper analysis for {target_role}.",
            "Conduct 3 structured moot court finals and client counseling competition rounds with senior advocate evaluation.",
            "Prepare a professional legal portfolio: drafted contracts, case briefs, research memos, and internship letters.",
            "Finalize law firm / clerkship applications: cover letter, writing sample, and campus interview preparation."
        ]
    if domain == "core_engineering":
        return [
            f"Complete GATE / domain certification mock tests with topic-wise performance benchmarking for {target_role}.",
            "Prepare a technical project portfolio: CAD drawings, FEA reports, prototypes, and documented engineering analysis.",
            "Conduct 5 core engineering technical interview rounds: design problems, case-based troubleshooting, and stress questions.",
            "Finalize PSU / core firm application materials: GATE score strategy, HR profile, and technical presentation readiness."
        ]
    if domain == "tech":
        return [
            f"Master top 50 high-frequency placement interview questions and technical problem patterns for {target_role}.",
            f"Conduct timed system design and architecture whiteboarding rounds defending trade-offs for {target_role}.",
            "Formulate 5 structured STAR-format behavioral narratives demonstrating engineering decision-making and challenges.",
            "Complete end-to-end portfolio capstone code review and timed peer mock technical interview defense."
        ]

    # General / Unclassified Professional Careers
    return [
        f"Prepare a comprehensive professional portfolio highlighting completed projects, case analyses, and credentials for {target_role}.",
        "Drill domain-specific behavioral and technical interview case scenarios with structured STAR communication.",
        "Complete industry-recognized credentialing, licensing, or certification mock assessments.",
        "Finalize targeted resume, LinkedIn positioning, and professional pitch for top-tier hiring pipelines."
    ]


def _build_phase_guidance(
    domain: str,
    phase_number: int,
    total_phases: int,
    is_final_phase: bool,
    skills: list[str],
    target_role: str,
) -> str:
    """Build a detailed phase-specific guidance string for the LLM prompt."""
    s = ", ".join(skills) if skills else target_role

    if is_final_phase:
        domain_final_guidance = {
            "culinary": (
                f"This is Phase {phase_number} of {total_phases}: EXECUTIVE TASTING AUDITION & CAREER PLACEMENT.\n"
                "Focus strictly on:\n"
                f"1. Timed signature multi-course tasting menu audition defending culinary technique and flavor composition for {target_role}.\n"
                "2. Professional culinary portfolio: recipe book, high-resolution plating documentation, stage logbook.\n"
                "3. Food Safety Manager / ServSafe Manager compliance and health code examination readiness.\n"
                "4. Executive chef interview readiness: brigade management, kitchen P&L, food cost & labor scheduling."
            ),
            "medicine": (
                f"This is Phase {phase_number} of {total_phases}: BOARD EXAM, RESIDENCY APPLICATIONS & PLACEMENT READINESS.\n"
                "Focus strictly on:\n"
                f"1. Comprehensive board exam preparation (USMLE/NEET PG/specialty boards) for {target_role}.\n"
                "2. Residency/fellowship application strategy: personal statement, ERAS, letters of recommendation.\n"
                "3. Specialty mock clinical interviews with case vignettes and ethical scenarios.\n"
                "4. Clinical research abstracts, publications, and elective rotation finalization."
            ),
            "finance": (
                f"This is Phase {phase_number} of {total_phases}: PLACEMENT READINESS & FINANCE INTERVIEW DRILLS.\n"
                "Focus strictly on:\n"
                f"1. 200+ technical finance interview questions: LBO, DCF, accounting brain-teasers for {target_role}.\n"
                "2. Bulge bracket case study and deal structuring mock interview simulations.\n"
                "3. STAR behavioral narratives emphasizing deal exposure, analytical decisions, and client interactions.\n"
                "4. Resume, LinkedIn, and cover letter optimization for investment banking / finance pipelines."
            ),
            "law": (
                f"This is Phase {phase_number} of {total_phases}: BAR EXAM, MOOT COURT FINALS & CAREER PLACEMENT.\n"
                "Focus strictly on:\n"
                f"1. Bar Council / AIBE / jurisdiction bar exam mock tests and topic-wise remediation for {target_role}.\n"
                "2. Advanced moot court, client counseling, and negotiation competition rounds.\n"
                "3. Professional portfolio: drafted contracts, case briefs, research memos, and internship documentation.\n"
                "4. Law firm / clerkship application strategy: cover letter, writing sample, and campus interview prep."
            ),
            "core_engineering": (
                f"This is Phase {phase_number} of {total_phases}: CERTIFICATION, PORTFOLIO & PLACEMENT READINESS.\n"
                "Focus strictly on:\n"
                f"1. GATE / domain certification exam mock tests with performance benchmarking for {target_role}.\n"
                "2. Technical project portfolio: CAD drawings, FEA analysis reports, and documented engineering projects.\n"
                "3. Core engineering technical interview: design problems, case-based troubleshooting, stress testing.\n"
                "4. PSU / core engineering firm application: GATE strategy, HR screening, and technical presentation."
            ),
            "tech": (
                f"This is Phase {phase_number} of {total_phases}: THE FINAL PLACEMENT READINESS & INTERVIEW DRILL PHASE.\n"
                "Focus strictly on:\n"
                f"1. High-frequency technical interview question banks and algorithmic/system edge cases for {target_role}.\n"
                "2. Timed whiteboard system design and architectural trade-off defense rounds.\n"
                "3. STAR behavioral interview narratives and project technical defense.\n"
                "4. Final portfolio capstone code review and timed peer mock interview evaluation."
            ),
        }
        return domain_final_guidance.get(domain, (
            f"This is Phase {phase_number} of {total_phases}: CAREER PLACEMENT, PORTFOLIO & CREDENTIALING.\n"
            "Focus strictly on:\n"
            f"1. Comprehensive professional portfolio and case study presentation for {target_role}.\n"
            "2. Domain-specific technical and behavioral interview simulations with STAR methodology.\n"
            "3. Professional credentialing, licensing, or industry examination preparation.\n"
            "4. Resume, professional positioning, and recruitment pipeline optimization."
        ))

    # Non-final phase guidance per domain
    domain_phase_guidance = {
        "culinary": {
            1: (
                f"This is Phase 1 of {total_phases}: CULINARY FOUNDATIONS, KNIFE SKILLS & FOOD SAFETY.\n"
                "CRITICAL MANDATE: DO NOT mention executive auditions or job interviews. The cook is building foundational mechanics.\n"
                "DO NOT mention software, coding, APIs, or computers!\n"
                "Focus strictly on:\n"
                f"1. Essential kitchen sanitation, personal hygiene, and HACCP commercial standards for {s}.\n"
                "2. Precision knife cuts (julienne, brunoise, chiffonade, batonnet) and station mise en place.\n"
                "3. Core heat transfer methods (sautéing, braising, roasting, poaching) and classical mother sauces.\n"
                "4. Systematic recipe measurement, ingredient preparation, and palate calibration (salt/acid/fat balancing)."
            ),
            2: (
                f"This is Phase 2 of {total_phases}: STATION LINE COOKING & INTERMEDIATE DISCIPLINES.\n"
                "CRITICAL MANDATE: DO NOT mention executive auditions or placement yet. DO NOT mention software or tech!\n"
                "Focus strictly on:\n"
                f"1. Commercial station line cooking (sauté, grill, fry, garde manger) under simulated ticket rush timing for {s}.\n"
                "2. Protein fabrication and butchery: primal cuts, poultry deboning, and seafood filleting.\n"
                "3. Artisan baking, laminated doughs, and plated pastry dessert execution.\n"
                "4. Standardizing portion control, yield testing, and aesthetic plating presentations."
            ),
            3: (
                f"This is Phase 3 of {total_phases}: KITCHEN BRIGADE LEADERSHIP, MENU ENGINEERING & COST OPERATIONS.\n"
                "CRITICAL MANDATE: DO NOT mention placement interviews yet. DO NOT mention software or tech!\n"
                "Focus strictly on:\n"
                f"1. Kitchen brigade coordination as Sous Chef / Expeditor: pass communication and timing for {s}.\n"
                "2. Food cost accounting, inventory management, supplier sourcing, and waste minimization protocols.\n"
                "3. Seasonal tasting menu engineering and recipe costing with targeted margin calculations.\n"
                "4. Commercial kitchen health inspections, equipment maintenance, and kitchen safety management."
            ),
        },
        "medicine": {
            1: (
                f"This is Phase 1 of {total_phases}: CLINICAL FOUNDATIONS & CORE MEDICAL SCIENCES.\n"
                "CRITICAL MANDATE: DO NOT mention board exams, residency interviews, or placement. The student is building foundations.\n"
                "Focus strictly on:\n"
                f"1. Anatomy, Physiology, Biochemistry, Pathology, and Pharmacology foundations for {s}.\n"
                "2. Systematic clinical examination techniques and patient history-taking.\n"
                "3. Pre-clinical laboratory sessions: histology slides, basic diagnostic interpretation.\n"
                "4. Formative MCQ self-assessments to validate core science understanding."
            ),
            2: (
                f"This is Phase 2 of {total_phases}: DIAGNOSTIC SPECIALIZATION & CLINICAL PROCEDURES.\n"
                "CRITICAL MANDATE: DO NOT mention residency interviews or placement yet.\n"
                "Focus strictly on:\n"
                f"1. Clinical posting rotations and specialty exposure in {s}.\n"
                "2. Diagnostic investigation interpretation: ECG, imaging, blood panels, pathology.\n"
                "3. Core clinical procedures: cannulation, catheterization, suturing, basic surgical assist.\n"
                "4. Case-based clinical reasoning and structured case presentations."
            ),
            3: (
                f"This is Phase 3 of {total_phases}: HOSPITAL SYSTEMS, ADVANCED ROTATIONS & CLINICAL GOVERNANCE.\n"
                "CRITICAL MANDATE: DO NOT mention placement interviews.\n"
                "Focus strictly on:\n"
                f"1. Advanced ICU, emergency medicine, and senior rotations in {s}.\n"
                "2. Evidence-based medicine, clinical trials, and research methodology.\n"
                "3. Medical ethics, patient safety, and medicolegal responsibilities.\n"
                "4. Comprehensive clinical logbook and case portfolio development."
            ),
        },
        "finance": {
            1: (
                f"This is Phase 1 of {total_phases}: QUANTITATIVE FOUNDATIONS & FINANCIAL ACCOUNTING.\n"
                "CRITICAL MANDATE: DO NOT mention investment banking interviews or deal simulations yet.\n"
                "Focus strictly on:\n"
                f"1. Financial accounting: income statement, balance sheet, cash flow, and {s}.\n"
                "2. Quantitative methods: statistics, time-value of money, Excel financial functions.\n"
                "3. Financial ratio analysis and industry benchmarking exercises.\n"
                "4. Numerical aptitude building: 30+ quantitative problems per week."
            ),
            2: (
                f"This is Phase 2 of {total_phases}: FINANCIAL MODELING, VALUATION & CAPITAL MARKETS.\n"
                "CRITICAL MANDATE: DO NOT mention placement interviews yet.\n"
                "Focus strictly on:\n"
                f"1. 3-statement financial modeling, DCF, and comparable company analysis for {s}.\n"
                "2. Equity research report writing and sector analysis.\n"
                "3. Bloomberg Terminal or FactSet proficiency for real-time financial data.\n"
                "4. 10+ industry-specific valuation case studies with buy/sell recommendations."
            ),
            3: (
                f"This is Phase 3 of {total_phases}: ADVANCED PRODUCTS, DEAL EXECUTION & PORTFOLIO MANAGEMENT.\n"
                "CRITICAL MANDATE: DO NOT mention placement interviews.\n"
                "Focus strictly on:\n"
                f"1. LBO modeling, M&A deal structuring, and transaction analysis for {s}.\n"
                "2. Advanced derivatives, structured products, and risk management frameworks.\n"
                "3. CFA-level or domain certification mock exam completion.\n"
                "4. Cross-asset portfolio construction, rebalancing, and attribution analysis."
            ),
        },
        "law": {
            1: (
                f"This is Phase 1 of {total_phases}: LEGAL THEORY, JURISPRUDENCE & CONSTITUTIONAL FOUNDATIONS.\n"
                "CRITICAL MANDATE: DO NOT mention bar exams or moot court finals yet.\n"
                "Focus strictly on:\n"
                f"1. Constitutional law, tort law, contract law, and jurisprudence foundations for {s}.\n"
                "2. Legal research methodology: case analysis, statutory interpretation, IRAC framework.\n"
                "3. Drafting 5 structured case briefs with concise legal arguments.\n"
                "4. Introductory moot court exposure: basic oral argument structure and courtroom decorum."
            ),
            2: (
                f"This is Phase 2 of {total_phases}: CONTRACT PRACTICE, RESEARCH & STATUTORY DRAFTING.\n"
                "CRITICAL MANDATE: DO NOT mention bar exams or placement yet.\n"
                "Focus strictly on:\n"
                f"1. Contract drafting, negotiation, and commercial agreement structures for {s}.\n"
                "2. In-depth legal research using Westlaw/SCC Online resulting in a 10-page client memo.\n"
                "3. Due diligence simulation for a corporate transaction with risk identification.\n"
                "4. Structured moot court problem: pleadings, discovery, and pre-trial motions."
            ),
            3: (
                f"This is Phase 3 of {total_phases}: LITIGATION, ADVOCACY & SPECIALIZED PRACTICE AREAS.\n"
                "CRITICAL MANDATE: DO NOT mention bar exam or final placement interviews yet.\n"
                "Focus strictly on:\n"
                f"1. Full-cycle litigation simulation: trial advocacy, cross-examination, and appellate brief for {s}.\n"
                "2. Specialized legal practice areas: IP, corporate governance, competition law.\n"
                "3. Supervised client advisory engagement under senior counsel.\n"
                "4. Advanced research into jurisdiction-specific or sector-specific regulatory frameworks."
            ),
        },
        "core_engineering": {
            1: (
                f"This is Phase 1 of {total_phases}: ENGINEERING FUNDAMENTALS & CORE SCIENCES.\n"
                "CRITICAL MANDATE: DO NOT mention certification exams or placement yet.\n"
                "Focus strictly on:\n"
                f"1. Engineering mathematics: calculus, linear algebra, differential equations for {s}.\n"
                "2. Core mechanics: statics, dynamics, strength of materials, thermodynamics.\n"
                "3. Lab practicals: material testing, technical drawing standards, measurement instruments.\n"
                "4. 20+ applied engineering problem sets per week with documented methodology."
            ),
            2: (
                f"This is Phase 2 of {total_phases}: DESIGN PRINCIPLES, CAD/CAE & SIMULATION.\n"
                "CRITICAL MANDATE: DO NOT mention certification exams or placement yet.\n"
                "Focus strictly on:\n"
                f"1. Complete component design using CAD tools (SolidWorks/AutoCAD/CATIA) for {s}.\n"
                "2. FEA/FEM simulation: stress, strain, deformation, and thermal analysis.\n"
                "3. Hands-on workshop project: machining, welding, or PCB assembly per discipline.\n"
                "4. Technical design report meeting ISO/GD&T standards."
            ),
            3: (
                f"This is Phase 3 of {total_phases}: MANUFACTURING, SYSTEMS INTEGRATION & QUALITY STANDARDS.\n"
                "CRITICAL MANDATE: DO NOT mention certification exams or placement yet.\n"
                "Focus strictly on:\n"
                f"1. Product lifecycle management: design, prototype, testing, manufacturability review for {s}.\n"
                "2. Quality assurance: Six Sigma, Lean, FMEA, and root-cause analysis.\n"
                "3. Cross-functional systems integration and commissioning project.\n"
                "4. Certification simulation: ISO 9001, ASME, OSHA, or domain-equivalent standards."
            ),
        },
        "general": {
            1: (
                f"This is Phase 1 of {total_phases}: CORE DOMAIN PRINCIPLES & FOUNDATIONAL WORKFLOWS.\n"
                "CRITICAL MANDATE: DO NOT mention placement interviews. DO NOT mention software coding, Git, or APIs unless the profession is Tech!\n"
                "Focus strictly on:\n"
                f"1. Core industry principles, operating terminology, and theoretical foundations for {s}.\n"
                "2. Standard workplace tools, documentation practices, and standard operating procedures (SOPs).\n"
                "3. Safety standards, regulatory compliance, and professional ethics.\n"
                "4. Hands-on foundational exercises and case-based problem scenarios."
            ),
            2: (
                f"This is Phase 2 of {total_phases}: APPLIED PRACTICE & WORKFLOW EXECUTION.\n"
                "CRITICAL MANDATE: DO NOT mention placement interviews yet.\n"
                "Focus strictly on:\n"
                f"1. Real-world applied projects and workplace workflow simulations for {s}.\n"
                "2. Operational troubleshooting, bottleneck identification, and practical problem-solving.\n"
                "3. Cross-functional communication, deliverable drafting, and industry documentation.\n"
                "4. Professional instrumentation, specialized industry platforms, and data interpretation."
            ),
            3: (
                f"This is Phase 3 of {total_phases}: ADVANCED SYSTEMS & QUALITY MANAGEMENT.\n"
                "CRITICAL MANDATE: DO NOT mention placement interviews yet.\n"
                "Focus strictly on:\n"
                f"1. Complex project lifecycle management: scope, resource allocation, and milestone tracking for {s}.\n"
                "2. Quality control, key performance indicators (KPIs), and risk mitigation frameworks.\n"
                "3. Executive reporting, stakeholder communication, and presentation delivery.\n"
                "4. Domain-specific compliance auditing, inspection readiness, and process optimization."
            ),
        },
    }

    # Get domain-specific guidance for this phase number
    if domain in domain_phase_guidance and phase_number in domain_phase_guidance[domain]:
        return domain_phase_guidance[domain][phase_number]

    # If general or unclassified non-tech domain
    if domain != "tech" and phase_number in domain_phase_guidance.get("general", {}):
        return domain_phase_guidance["general"][phase_number]

    # Tech-only fallbacks
    if phase_number == 1:
        return (
            f"This is Phase 1 of {total_phases}: FOUNDATIONS, BEDROCK & ENVIRONMENT SETUP.\n"
            "CRITICAL MANDATE: DO NOT mention placement interviews, mock interview rounds, or interview questions! "
            "The student is just beginning their journey.\n"
            "Focus strictly on:\n"
            "1. Development workspace setup, toolchain, and fundamental mental models.\n"
            f"2. Core syntax, basic data structures, and idiomatic conventions for {s}.\n"
            "3. Hands-on coding exercises and building an initial modular script or prototype.\n"
            "4. Automated unit testing and clean code principles."
        )
    if phase_number == 2:
        return (
            f"This is Phase 2 of {total_phases}: CORE APPLICATION ARCHITECTURE & SERVICES.\n"
            "CRITICAL MANDATE: DO NOT mention placement interviews or mock interviews.\n"
            "Focus strictly on:\n"
            f"1. Application architecture, frameworks, and service design for {s}.\n"
            "2. Database schema design, relational/document queries, and data persistence.\n"
            "3. API development, input validation, authentication, and error middleware.\n"
            "4. Building and testing an end-to-end multi-layer feature."
        )
    return (
        f"This is Phase {phase_number} of {total_phases}: PRODUCTION ENGINEERING, SCALE & DEVOPS.\n"
        "CRITICAL MANDATE: DO NOT mention placement interviews.\n"
        "Focus strictly on:\n"
        f"1. Caching, asynchronous processing, and latency optimization using {s}.\n"
        "2. Containerization (Docker), environment configuration, and CI/CD pipelines.\n"
        "3. Concurrency, rate limiting, and system resilience under load.\n"
        "4. Observability, structured logging, and production deployment hardening."
    )


class AzureOpenAIClient:
    """Client for Azure OpenAI gpt-4o-mini deployment with offline mock fallback."""

    def __init__(
        self,
        endpoint: str | None = None,
        api_key: str | None = None,
        deployment: str | None = None,
        api_version: str | None = None,
        mode: str | None = None,
        timeout: float = 12.0
    ):
        self.mode = (mode or os.getenv("MODE", "mock")).strip().lower()
        self.endpoint = (endpoint or os.getenv("AZURE_OPENAI_ENDPOINT", "")).rstrip("/")
        self.api_key = api_key or os.getenv("AZURE_OPENAI_API_KEY", "")
        self.deployment = deployment or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini")
        self.api_version = api_version or os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        """Check if live Azure credentials are provided."""
        return (
            self.mode == "azure"
            and bool(self.endpoint)
            and bool(self.api_key)
            and not self.endpoint.startswith("https://your-resource")
            and not self.api_key.startswith("your-")
        )

    def _call_azure_openai(self, messages: list[dict[str, str]], temperature: float = 0.3) -> str | None:
        """Execute a chat completion request to Azure OpenAI."""
        if not self.is_configured:
            return None

        url = f"{self.endpoint}/openai/deployments/{self.deployment}/chat/completions?api-version={self.api_version}"
        headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key
        }
        payload = {
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1000
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
                logger.warning("Azure OpenAI returned status %s: %s", response.status_code, response.text)
        except (httpx.HTTPError, httpx.RequestError, OSError, json.JSONDecodeError, KeyError) as exc:
            logger.warning("Azure OpenAI call failed (%s). Using deterministic fallback.", exc)

        return None

    def enrich_phase_objectives(
        self,
        phase_title: str,
        skills: list[str],
        allocated_hours: int,
        target_role: str,
        student_level: str = "intermediate",
        phase_number: int = 1,
        total_phases: int = 4,
        is_final_phase: bool = False,
        skill_details: list[dict] | None = None,
        student_context: dict | None = None,
        domain: str = "tech",
    ) -> list[str]:
        """Generate domain-aware, pedagogically correct learning milestones for a roadmap phase.

        Phase 1: Domain-specific foundations (NO interview questions).
        Phase 2: Diagnostic/applied/intermediate specialization (NO interviews).
        Phase 3: Advanced systems, clinical practice, or deal execution (NO interviews).
        Final Phase: Placement readiness ONLY — board exams, bar exams, finance interviews, or tech interviews.
        """
        phase_guidance = _build_phase_guidance(
            domain=domain,
            phase_number=phase_number,
            total_phases=total_phases,
            is_final_phase=is_final_phase,
            skills=skills,
            target_role=target_role,
        )

        if self.is_configured:
            domain_context = f"Career Domain: {domain.replace('_', ' ').title()}\n"
            system_prompt = (
                "You are an expert career coach and workforce mentor across ALL domains including "
                "Culinary Arts, Medicine, Law, Finance, Core Engineering, Software Engineering, and diverse professional careers. "
                "Generate exactly 4 concise, practical, action-oriented learning milestones for a student's roadmap phase. "
                "CRITICAL DOMAIN PURITY: Follow the exact career domain and phase guidance provided. "
                "DO NOT mention software development, APIs, coding, Git, or databases unless the target role is strictly in Tech! "
                "For culinary roles (Cook, Chef, Baker), focus strictly on cooking techniques, kitchen safety, recipe costing, station management, and tasting defense. "
                "NEVER put interview questions or placement prep in early foundational phases! "
                "Output ONLY a JSON array of 4 strings (e.g. [\"Milestone 1\", \"Milestone 2\", \"Milestone 3\", \"Milestone 4\"])."
            )
            student_bg = ""
            if student_context:
                student_bg = (
                    f"Student: {student_context.get('name', 'Learner')} "
                    f"({student_context.get('degree', '')} {student_context.get('branch', '')}, "
                    f"Year {student_context.get('year', '')})\n"
                )

            skills_str = ", ".join(skills) if skills else target_role
            user_prompt = (
                f"{student_bg}"
                f"{domain_context}"
                f"Target Role: {target_role}\n"
                f"Student Level: {student_level}\n"
                f"Phase Title: {phase_title}\n"
                f"Skills: {skills_str}\n"
                f"Allocated Hours: {allocated_hours}h\n"
                f"{phase_guidance}\n"
                "Return 4 specific, actionable milestone strings matching the domain and phase."
            )
            response = self._call_azure_openai([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            if response:
                try:
                    clean = response.strip()
                    match = re.search(r"```(?:json)?\s*(\[[\s\S]*?\])\s*```", clean)
                    if match:
                        clean = match.group(1).strip()
                    else:
                        bracket_match = re.search(r"(\[[\s\S]*\])", clean)
                        if bracket_match:
                            clean = bracket_match.group(1).strip()

                    parsed = json.loads(clean)
                    if isinstance(parsed, list) and all(isinstance(item, str) for item in parsed) and len(parsed) >= 1:
                        return parsed[:4]
                except (json.JSONDecodeError, AttributeError):
                    pass

        # ── Domain-specific deterministic fallbacks ───────────────────────────
        if is_final_phase:
            return _fallback_milestones_final(target_role, domain)

        if phase_number == 1:
            return _fallback_milestones_phase1(skills, target_role, domain, skill_details)

        if phase_number == 2:
            return _fallback_milestones_phase2(skills, target_role, domain)

        return _fallback_milestones_phase3(skills, target_role, domain)

    def generate_adaptation_summary(
        self,
        skill: str,
        previous_level: float,
        updated_level: float,
        score_percentage: float,
        hours_saved_or_shifted: int,
        deprioritized: bool
    ) -> str:
        """Produce an explainable coaching message when a student completes an assessment."""
        if self.is_configured:
            system_prompt = (
                "You are CareerForge AI, an encouraging and clear career preparation assistant. "
                "Explain how the student's recent assessment updated their roadmap in 2 concise sentences."
            )
            user_prompt = (
                f"Skill: {skill}\n"
                f"Assessment Score: {score_percentage}%\n"
                f"Previous Level: {previous_level} / 5.0 -> New Level: {updated_level} / 5.0\n"
                f"Deprioritized/Mastered: {deprioritized}\n"
                f"Hours Reallocated: {hours_saved_or_shifted} hours.\n"
                "Summarize what changed in their roadmap dynamically."
            )
            response = self._call_azure_openai([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            if response:
                return response

        # Deterministic explainable fallback
        if deprioritized:
            return (
                f"Outstanding performance on {skill} ({score_percentage}%)! Your proficiency increased from "
                f"{previous_level} to {updated_level}. This skill has now been marked Mastered, freeing up "
                f"{hours_saved_or_shifted} hours to accelerate your remaining high-priority gaps."
            )
        return (
            f"Assessment recorded for {skill} with score {score_percentage}%. Your proficiency updated from "
            f"{previous_level} to {updated_level} (+{round(updated_level - previous_level, 1)}). "
            f"Your remaining phases have been adjusted to optimize your remaining preparation timeline."
        )

    def synthesize_role_benchmark(self, query: str) -> dict | None:
        """Dynamically generate a comprehensive career benchmark for any profession using live Azure OpenAI."""
        if not self.is_configured:
            return None

        system_prompt = (
            "You are an expert global career, placement, and workforce intelligence system. "
            "Given any career or dream job (e.g. Cardiologist, Investment Banker, Civil Engineer, Aerospace Engineer, etc.), "
            "return a complete, professional, and authentic curriculum benchmark in JSON. "
            "Output ONLY valid JSON matching this schema with NO extra commentary:\n"
            "{\n"
            '  "matched_role": "Canonical Job Title",\n'
            '  "category": "Domain Category (e.g. Medicine & Healthcare, Finance & Banking, Core Engineering, Law & Legal)",\n'
            '  "tagline": "Concise 1-sentence description of the career path.",\n'
            '  "tier_label": "Label for target organizations (e.g. Target Hospital Tier, Target Financial Firm Tier, Target Engineering Firm Tier)",\n'
            '  "target_tiers": ["Top Tier 1 (e.g. AIIMS / Mayo Clinic)", "Tier 2", "Tier 3", "Tier 4", "Tier 5"],\n'
            '  "degree_label": "Degree label (e.g. Medical Qualification, Engineering Degree, Finance Degree)",\n'
            '  "branch_label": "Specialization label (e.g. Medical Specialty, Department, Concentration)",\n'
            '  "suggested_degrees": ["Degree 1", "Degree 2", "Degree 3"],\n'
            '  "suggested_branches": ["Spec 1", "Spec 2", "Spec 3"],\n'
            '  "skills": [\n'
            '    {"name": "Skill Name", "required_level": 4.5, "demand_level": "critical", "est_hours": 40, "category": "core"}\n'
            "  ]\n"
            "}\n"
            "Rules:\n"
            "- If the profession is NOT in Tech, do NOT mention FAANG or software engineering terms in target_tiers.\n"
            "- Include 4 to 6 critical competencies relevant specifically to this profession.\n"
            "- 'est_hours' should be reasonable preparation hours between 15 and 50 hours per competency.\n"
            "- 'demand_level' must be one of: 'critical', 'high-priority', 'frequently mentioned', 'moderate'.\n"
            "- Skill categories must be domain-appropriate (e.g. 'clinical', 'diagnostics', 'modeling', 'contracts')."
        )

        user_prompt = f"Analyze the career and return the benchmark standard: '{query}'."

        response = self._call_azure_openai([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ], temperature=0.2)

        if response:
            try:
                clean = response.strip()
                match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", clean)
                if match:
                    clean = match.group(1).strip()
                else:
                    brace_match = re.search(r"(\{[\s\S]*\})", clean)
                    if brace_match:
                        clean = brace_match.group(1).strip()

                data = json.loads(clean)
                if isinstance(data, dict) and "matched_role" in data and "skills" in data:
                    # Sanitize skills
                    sanitized_skills = []
                    for s in data.get("skills", []):
                        if isinstance(s, dict) and s.get("name"):
                            req_lvl = float(s.get("required_level", 4.0))
                            req_lvl = min(5.0, max(1.0, round(req_lvl, 1)))

                            # Cap est_hours to reasonable learning units (10 - 60)
                            raw_hours = s.get("est_hours", 30)
                            try:
                                h = int(raw_hours)
                                if h > 80:  # If model returned career lifetime hours (e.g. 3000)
                                    h = min(50, max(20, round(h / 100)))
                            except (ValueError, TypeError):
                                h = 30

                            demand = str(s.get("demand_level", "critical")).lower()
                            if demand not in ["critical", "high-priority", "frequently mentioned", "moderate"]:
                                demand = "critical" if req_lvl >= 4.0 else "high-priority"

                            sanitized_skills.append({
                                "name": str(s["name"]).strip(),
                                "required_level": req_lvl,
                                "demand_level": demand,
                                "est_hours": h,
                                "category": str(s.get("category", "core"))
                            })

                    if sanitized_skills:
                        data["skills"] = sanitized_skills
                        return data
            except Exception as exc:
                logger.warning("Failed to parse custom role synthesized by Azure OpenAI: %s", exc)

        return None
