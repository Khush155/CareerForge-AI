"""Agent Orchestrator for CareerForge AI.

Coordinates the 7-Step Preparation Loop:
Research -> Analyze -> Compare -> Recommend -> Plan -> Assess -> Adapt

ARCHITECTURAL CONSTRAINTS:
1. Pure deterministic math for gap calculations and assessment scoring.
2. Market requirements backed by verified citation links.
3. RAG retrieval of curated markdown guides with section anchors.
4. Seamless dual-mode execution (local mock vs Azure OpenAI gpt-4o-mini).
5. Dynamic roadmap phase rebalancing upon assessment completion.
"""
import math
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
        estimated_weeks = max(1, math.ceil(total_hours / profile.available_hours_per_week))

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
        new_weeks = max(1, math.ceil(new_total_hours / updated_profile.available_hours_per_week))

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
        """Deterministically partitions skills into balanced progressive phases with pedagogical reasoning."""
        unmastered = [g for g in gaps if g.priority != PriorityLevel.MASTERED]
        mastered = [g for g in gaps if g.priority == PriorityLevel.MASTERED]

        phases: list[RoadmapPhase] = []

        # If every single skill is already mastered, provide advanced mock evaluation phase
        if not unmastered:
            resources = retrieve_knowledge_base(f"{profile.target_role} interview preparation", top_k=3)
            phases.append(
                RoadmapPhase(
                    phase_number=1,
                    title="Phase 1: Advanced Mock Interviews & Placement Polish",
                    skills_covered=[m.skill for m in mastered[:3]] or ["Comprehensive Domain Competency"],
                    estimated_hours=max(10, profile.available_hours_per_week * 2),

                    learning_objectives=[
                        f"Review high-frequency interview question banks and scenario patterns for {profile.target_role}.",
                        "Participate in timed peer mock interviews and technical/clinical problem solving under pressure.",
                        "Finalize case studies, portfolio artifacts, and resume alignment for top-tier placement rounds."
                    ],
                    resources=resources,
                    status=PhaseStatus.IN_PROGRESS
                )
            )
            return phases

        # Progressive distribution: Sort gaps to ensure logical curriculum flow
        # Prioritize core foundations first, then intermediate execution, then advanced integration
        sorted_gaps = list(unmastered)
        total_unmastered = len(sorted_gaps)

        # Distribute unmastered competencies across up to 3 progressive domain phases:
        # Phase 1: Core Foundations & Bedrock
        # Phase 2: Core Domain Competency & Systems
        # Phase 3: Advanced Scenarios & Applied Integration
        # Phase 4 (Final): Placement Readiness, Mock Interviews & Capstone Defense
        p1_gaps: list[SkillGap] = []
        p2_gaps: list[SkillGap] = []
        p3_gaps: list[SkillGap] = []

        if total_unmastered >= 3:
            s1 = math.ceil(total_unmastered / 3)
            s2 = math.ceil(2 * total_unmastered / 3)
            p1_gaps = sorted_gaps[:s1]
            p2_gaps = sorted_gaps[s1:s2]
            p3_gaps = sorted_gaps[s2:]
        elif total_unmastered == 2:
            p1_gaps = [sorted_gaps[0]]
            p2_gaps = [sorted_gaps[1]]
            p3_gaps = []
        else:  # exactly 1 unmastered skill
            p1_gaps = [sorted_gaps[0]]
            p2_gaps = []
            p3_gaps = []

        # Phase 1: Core Foundations & Prerequisites
        p1_skills = [g.skill for g in p1_gaps]
        p1_hours = max(10, round(sum(g.gap for g in p1_gaps) * HOURS_PER_GAP_UNIT))
        p1_resources = self._gather_resources_for_skills(p1_skills, profile.target_role)
        p1_objectives = self.llm.enrich_phase_objectives(
            phase_title=f"Phase 1: Foundations & Prerequisites for {profile.target_role}",
            skills=p1_skills,
            allocated_hours=p1_hours,
            target_role=profile.target_role,
            student_level=profile.current_prep_level
        )
        p1_skill_names_short = ", ".join(p1_skills[:2])
        phases.append(
            RoadmapPhase(
                phase_number=1,
                title=f"Phase 1: Foundations & Core Bedrock ({p1_skill_names_short})",
                skills_covered=p1_skills,
                estimated_hours=p1_hours,
                learning_objectives=p1_objectives,
                resources=p1_resources,
                status=PhaseStatus.IN_PROGRESS
            )
        )

        # Phase 2: Core Domain Execution & Systems
        if p2_gaps:
            p2_skills = [g.skill for g in p2_gaps]
            p2_hours = max(8, round(sum(g.gap for g in p2_gaps) * HOURS_PER_GAP_UNIT))
            p2_resources = self._gather_resources_for_skills(p2_skills, profile.target_role)
            p2_objectives = self.llm.enrich_phase_objectives(
                phase_title=f"Phase 2: Core Domain Systems & Execution for {profile.target_role}",
                skills=p2_skills,
                allocated_hours=p2_hours,
                target_role=profile.target_role,
                student_level=profile.current_prep_level
            )
            p2_skill_names_short = ", ".join(p2_skills[:2])
            phases.append(
                RoadmapPhase(
                    phase_number=2,
                    title=f"Phase 2: Core Domain Execution & Systems ({p2_skill_names_short})",
                    skills_covered=p2_skills,
                    estimated_hours=p2_hours,
                    learning_objectives=p2_objectives,
                    resources=p2_resources,
                    status=PhaseStatus.NOT_STARTED
                )
            )

        # Phase 3: Advanced Scenarios & Applied Integration
        if p3_gaps:
            p3_skills = [g.skill for g in p3_gaps]
            p3_num = len(phases) + 1
            p3_hours = max(8, round(sum(g.gap for g in p3_gaps) * HOURS_PER_GAP_UNIT))
            p3_resources = self._gather_resources_for_skills(p3_skills, profile.target_role)
            p3_objectives = self.llm.enrich_phase_objectives(
                phase_title=f"Phase {p3_num}: Advanced Scenarios & Integration for {profile.target_role}",
                skills=p3_skills,
                allocated_hours=p3_hours,
                target_role=profile.target_role,
                student_level=profile.current_prep_level
            )
            p3_skill_names_short = ", ".join(p3_skills[:2])
            phases.append(
                RoadmapPhase(
                    phase_number=p3_num,
                    title=f"Phase {p3_num}: Advanced Scenarios & Applied Integration ({p3_skill_names_short})",
                    skills_covered=p3_skills,
                    estimated_hours=p3_hours,
                    learning_objectives=p3_objectives,
                    resources=p3_resources,
                    status=PhaseStatus.NOT_STARTED
                )
            )

        # Phase Final: Placement Readiness, Mock Interviews & Capstone Defense
        final_num = len(phases) + 1
        final_hours = max(8, profile.available_hours_per_week)
        final_resources = retrieve_knowledge_base(f"{profile.target_role} interview preparation", top_k=3)
        final_skills = [g.skill for g in sorted_gaps[:3]] or ["Interview Evaluation & Placement Strategy"]
        final_objectives = self.llm.enrich_phase_objectives(
            phase_title=f"Phase {final_num}: Placement Readiness & Mock Evaluations for {profile.target_role}",
            skills=final_skills,
            allocated_hours=final_hours,
            target_role=profile.target_role,
            student_level=profile.current_prep_level
        )
        phases.append(
            RoadmapPhase(
                phase_number=final_num,
                title=f"Phase {final_num}: Placement Readiness, Mock Interviews & Capstone Defense",
                skills_covered=final_skills,
                estimated_hours=final_hours,
                learning_objectives=final_objectives,
                resources=final_resources,
                status=PhaseStatus.NOT_STARTED
            )
        )

        return phases


    def _gather_resources_for_skills(self, skills: list[str], role: str) -> list[ResourceItem]:
        """Aggregate curated study resources from local RAG or authentic role benchmark docs."""
        all_resources: list[ResourceItem] = []
        seen_refs: set[str] = set()

        # Build skill-to-url map from role benchmarks
        from app.tools.role_resolver import get_role_resolver
        resolver = get_role_resolver()
        resolved = resolver.resolve_role(role)
        skill_doc_map = {b.name.lower().strip(): (b.source_url or "https://roadmap.sh") for b in resolved.benchmark}

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

            # If no curated markdown guide matches this specific skill, provide its verified benchmark doc link
            if not matched_curated:
                doc_url = skill_doc_map.get(norm_skill) or "https://roadmap.sh"
                if doc_url not in seen_refs:
                    seen_refs.add(doc_url)
                    all_resources.append(
                        ResourceItem(
                            title=f"{skill_clean} Official Architecture & Documentation Guide",
                            url_or_ref=doc_url,
                            resource_type="official_doc"
                        )
                    )

        return all_resources[:4]
