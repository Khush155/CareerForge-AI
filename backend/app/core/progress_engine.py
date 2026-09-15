"""Deterministic progress and skill update engine.

HARD ARCHITECTURAL CONSTRAINT:
This module contains pure, deterministic math and logic.
Skill level updates must follow an explainable formula, not LLM guesses.
"""
from datetime import datetime, timezone

from app.models.assessment import AssessmentResult


def calculate_updated_skill_level(
    current_level: float,
    score_percentage: float,
    alpha: float = 0.6
) -> float:
    """Calculate the updated proficiency level after an assessment.

    Formula:
        target_score_level = (score_percentage / 100.0) * 5.0
        new_level = current_level * (1 - alpha) + target_score_level * alpha
        result = clamp(round(new_level, 1), 0.0, 5.0)

    Args:
        current_level: Existing proficiency (0.0 to 5.0)
        score_percentage: Assessment score (0.0 to 100.0)
        alpha: Weight given to new assessment (default 0.6 = 60% assessment, 40% prior baseline)

    Returns:
        Updated skill proficiency clamped between 0.0 and 5.0, rounded to 1 decimal place.
    """
    # Guard inputs
    clamped_current = max(0.0, min(5.0, current_level))
    clamped_score = max(0.0, min(100.0, score_percentage))

    # Compute target proficiency from score
    target_score_level = (clamped_score / 100.0) * 5.0

    # Weighted progression
    raw_new_level = (clamped_current * (1.0 - alpha)) + (target_score_level * alpha)
    updated_level = round(raw_new_level, 1)

    # Hard clamp guarantee
    return max(0.0, min(5.0, updated_level))


def evaluate_assessment(
    profile_id: str,
    skill: str,
    current_level: float,
    score_percentage: float
) -> AssessmentResult:
    """Creates a deterministic assessment result with level delta and timestamp."""
    updated_level = calculate_updated_skill_level(current_level, score_percentage)
    delta = round(updated_level - current_level, 1)

    return AssessmentResult(
        profile_id=profile_id,
        skill=skill,
        score_percentage=score_percentage,
        previous_level=current_level,
        updated_level=updated_level,
        level_delta=delta,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
