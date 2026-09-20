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
            if s.name.strip().lower() == norm_target_skill:
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
        assessed_gap = next((g for g in new_gaps if g.skill.lower() == norm_target_skill), None)
        is_mastered = (assessed_gap is not None and assessed_gap.priority == PriorityLevel.MASTERED) or (assessed_gap is None)

        hours_adjusted = 0
        updated_phases: list[RoadmapPhase] = []

        for phase in current_roadmap.phases:
            matching_skills = [s for s in phase.skills_covered if s.strip().lower() == norm_target_skill]

            if matching_skills:
                if is_mastered:
                    # Deprioritize: if all skills in phase are mastered, mark phase completed
                    rem_skills = [s for s in phase.skills_covered if s.strip().lower() != norm_target_skill]
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
        """Deterministically partitions skills into 3 progressive phases and retrieves curated RAG guides."""
        high_priority = [g for g in gaps if g.priority == PriorityLevel.HIGH]
        medium_priority = [g for g in gaps if g.priority == PriorityLevel.MEDIUM]
        low_priority = [g for g in gaps if g.priority == PriorityLevel.LOW]
        mastered = [g for g in gaps if g.priority == PriorityLevel.MASTERED]

        phases: list[RoadmapPhase] = []

        # If everything is mastered, provide an interview readiness & production polish phase
        if not high_priority and not medium_priority and not low_priority:
            resources = retrieve_knowledge_base(f"{profile.target_role} interview preparation", top_k=3)
            phases.append(
                RoadmapPhase(
                    phase_number=1,
                    title="Placement Mock Interviews & System Design Polish",
                    skills_covered=[m.skill for m in mastered[:3]] or ["Interview Readiness"],
                    estimated_hours=max(10, profile.available_hours_per_week * 2),
                    learning_objectives=[
                        "Review campus placement coding question banks and system design patterns.",
                        "Conduct peer mock technical interviews with timed constraints.",
                        "Finalize portfolio project documentation and resume alignment."
                    ],
                    resources=resources,
                    status=PhaseStatus.IN_PROGRESS
                )
            )
            return phases

        # Phase 1: High Priority Foundations (Critical Gaps)
        p1_skills = [g.skill for g in high_priority]
        if not p1_skills and medium_priority:
            p1_skills = [medium_priority.pop(0).skill]

        if p1_skills:
            p1_gap_sum = sum(g.gap for g in gaps if g.skill in p1_skills)
            p1_hours = max(10, round(p1_gap_sum * HOURS_PER_GAP_UNIT))
            p1_resources = self._gather_resources_for_skills(p1_skills, profile.target_role)
            p1_objectives = self.llm.enrich_phase_objectives(
                phase_title="Phase 1: High-Priority Foundations",
                skills=p1_skills,
                allocated_hours=p1_hours,
                target_role=profile.target_role,
                student_level=profile.current_prep_level
            )
            phases.append(
                RoadmapPhase(
                    phase_number=1,
                    title="Phase 1: Core Fundamentals & Critical Requirements",
                    skills_covered=p1_skills,
                    estimated_hours=p1_hours,
                    learning_objectives=p1_objectives,
                    resources=p1_resources,
                    status=PhaseStatus.IN_PROGRESS
                )
            )

        # Phase 2: Core Stack & Medium Priority
        p2_skills = [g.skill for g in medium_priority]
        if not p2_skills and low_priority:
            p2_skills = [low_priority.pop(0).skill]

        if p2_skills:
            p2_gap_sum = sum(g.gap for g in gaps if g.skill in p2_skills)
            p2_hours = max(8, round(p2_gap_sum * HOURS_PER_GAP_UNIT))
            p2_resources = self._gather_resources_for_skills(p2_skills, profile.target_role)
            p2_objectives = self.llm.enrich_phase_objectives(
                phase_title="Phase 2: Core Stack Mastery",
                skills=p2_skills,
                allocated_hours=p2_hours,
                target_role=profile.target_role,
                student_level=profile.current_prep_level
            )
            phases.append(
                RoadmapPhase(
                    phase_number=len(phases) + 1,
                    title="Phase 2: Core Stack Integration & Architecture",
                    skills_covered=p2_skills,
                    estimated_hours=p2_hours,
                    learning_objectives=p2_objectives,
                    resources=p2_resources,
                    status=PhaseStatus.NOT_STARTED
                )
            )

        # Phase 3: Applied Projects & Polish (Low Priority + Productionizing)
        p3_skills = [g.skill for g in low_priority]
        if not p3_skills:
            p3_skills = ["Project Deployment & Mock Interviews"]

        p3_gap_sum = sum(g.gap for g in gaps if g.skill in p3_skills)
        p3_hours = max(6, round((p3_gap_sum or 1.0) * HOURS_PER_GAP_UNIT))
        p3_resources = self._gather_resources_for_skills(p3_skills, profile.target_role)
        p3_objectives = self.llm.enrich_phase_objectives(
            phase_title="Phase 3: Production Practice & Interview Prep",
            skills=p3_skills,
            allocated_hours=p3_hours,
            target_role=profile.target_role,
            student_level=profile.current_prep_level
        )
        phases.append(
            RoadmapPhase(
                phase_number=len(phases) + 1,
                title="Phase 3: Applied Projects, Testing & Interview Polish",
                skills_covered=p3_skills,
                estimated_hours=p3_hours,
                learning_objectives=p3_objectives,
                resources=p3_resources,
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
