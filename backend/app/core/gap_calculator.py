"""Deterministic skill gap calculation engine.

HARD ARCHITECTURAL CONSTRAINT:
This module contains pure, deterministic math and logic.
It MUST NOT call any LLMs or external network services.
All calculations must be 100% reproducible and unit-testable.
"""

from app.models.market import MarketRequirement
from app.models.profile import Skill
from app.models.skill_gap import PriorityLevel, SkillGap


def _normalize_skill_name(name: str) -> str:
    """Normalize skill name for case-insensitive matching."""
    return name.strip().lower()


def determine_priority(gap: float, demand_level: str) -> PriorityLevel:
    """Deterministically maps a calculated gap and market demand to a priority bucket.

    Rules:
    1. If gap <= 0: Mastered (student meets or exceeds target).
    2. High Priority:
       - gap >= 3.0 (large absolute deficiency), OR
       - gap >= 2.0 AND demand is critical/high, OR
       - gap >= 1.0 AND demand is critical.
    3. Medium Priority:
       - gap >= 2.0 (with moderate demand), OR
       - gap >= 1.0 AND demand is high/frequently mentioned.
    4. Low Priority:
       - gap > 0.0 (minor gap on lower demand skills).
    """
    if gap <= 0.0:
        return PriorityLevel.MASTERED

    norm_demand = demand_level.strip().lower()
    is_critical = "critical" in norm_demand
    is_high = "high" in norm_demand or "frequently" in norm_demand

    if gap >= 3.0:
        return PriorityLevel.HIGH
    if gap >= 2.0 and (is_critical or is_high):
        return PriorityLevel.HIGH
    if gap >= 1.0 and is_critical:
        return PriorityLevel.HIGH

    if gap >= 2.0:
        return PriorityLevel.MEDIUM
    if gap >= 1.0 and is_high:
        return PriorityLevel.MEDIUM

    return PriorityLevel.LOW


def calculate_skill_gaps(
    current_skills: list[Skill],
    market_requirements: list[MarketRequirement]
) -> list[SkillGap]:
    """Calculate deterministic skill gaps across all market requirements.

    Formula:
        raw_gap = required_level - current_level
        gap = max(0.0, round(raw_gap, 2))

    Returns:
        List of SkillGap objects sorted by priority (HIGH -> MEDIUM -> LOW -> MASTERED)
        and descending gap magnitude within each priority bucket.
    """
    # Create lookup map for existing student skills: normalized_name -> proficiency
    student_skill_map: dict[str, float] = {
        _normalize_skill_name(s.name): s.proficiency for s in current_skills
    }

    gaps: list[SkillGap] = []

    for req in market_requirements:
        norm_req_name = _normalize_skill_name(req.skill)
        current_level = student_skill_map.get(norm_req_name, 0.0)

        raw_gap = req.required_level - current_level
        gap_value = max(0.0, round(raw_gap, 2))
        priority = determine_priority(gap_value, req.demand_level)

        if priority == PriorityLevel.MASTERED:
            reasoning = f"Proficiency ({current_level}) meets or exceeds required benchmark ({req.required_level})."
        else:
            reasoning = (
                f"Current level {current_level} vs required {req.required_level} "
                f"(Gap: {gap_value}). Market demand is '{req.demand_level}', resulting in {priority.value} priority."
            )

        gaps.append(
            SkillGap(
                skill=req.skill,
                current_level=current_level,
                required_level=req.required_level,
                gap=gap_value,
                priority=priority,
                demand_level=req.demand_level,
                source_url=req.source_url,
                reasoning=reasoning,
            )
        )

    # Sort deterministically:
    # Priority order: HIGH (0), MEDIUM (1), LOW (2), MASTERED (3)
    # Secondary order: Descending gap value
    priority_order = {
        PriorityLevel.HIGH: 0,
        PriorityLevel.MEDIUM: 1,
        PriorityLevel.LOW: 2,
        PriorityLevel.MASTERED: 3,
    }

    gaps.sort(key=lambda item: (priority_order[item.priority], -item.gap, item.skill.lower()))
    return gaps
