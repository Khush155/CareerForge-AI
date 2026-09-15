"""Unit tests for progress engine and deterministic assessment scoring."""
from app.core.progress_engine import calculate_updated_skill_level, evaluate_assessment


def test_calculate_updated_skill_level_standard():
    """Verify formula: (1.0 * 0.4) + (5.0 * 0.6) = 3.4 for 100% score from level 1.0."""
    new_level = calculate_updated_skill_level(current_level=1.0, score_percentage=100.0, alpha=0.6)
    assert new_level == 3.4


def test_calculate_updated_skill_level_mid_score():
    """Verify mid-range score progression: current 2.0, score 60% (target 3.0)."""
    # (2.0 * 0.4) + (3.0 * 0.6) = 0.8 + 1.8 = 2.6
    new_level = calculate_updated_skill_level(current_level=2.0, score_percentage=60.0, alpha=0.6)
    assert new_level == 2.6


def test_calculate_updated_skill_level_clamping():
    """Verify level never exceeds 5.0 or drops below 0.0."""
    high = calculate_updated_skill_level(current_level=5.0, score_percentage=100.0)
    assert high <= 5.0

    low = calculate_updated_skill_level(current_level=0.0, score_percentage=0.0)
    assert low >= 0.0


def test_evaluate_assessment_record():
    """Verify evaluate_assessment produces correct delta and fields."""
    result = evaluate_assessment(
        profile_id="std_123",
        skill="SQL",
        current_level=2.0,
        score_percentage=80.0
    )
    # Target for 80% is 4.0. New level = 2.0*0.4 + 4.0*0.6 = 0.8 + 2.4 = 3.2
    assert result.profile_id == "std_123"
    assert result.skill == "SQL"
    assert result.previous_level == 2.0
    assert result.updated_level == 3.2
    assert result.level_delta == 1.2
    assert result.timestamp is not None
