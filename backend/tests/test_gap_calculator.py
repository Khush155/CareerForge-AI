"""Unit tests for deterministic skill gap calculation."""
from app.core.gap_calculator import calculate_skill_gaps
from app.models.market import MarketRequirement
from app.models.profile import Skill
from app.models.skill_gap import PriorityLevel


def test_gap_calculation_basic():
    """Verify gap = max(0, required - current)."""
    skills = [Skill(name="Python", proficiency=2.0)]
    requirements = [
        MarketRequirement(
            skill="Python",
            required_level=4.0,
            demand_level="high-priority",
            source_url="https://example.com/python"
        )
    ]
    gaps = calculate_skill_gaps(skills, requirements)

    assert len(gaps) == 1
    assert gaps[0].skill == "Python"
    assert gaps[0].current_level == 2.0
    assert gaps[0].required_level == 4.0
    assert gaps[0].gap == 2.0
    assert gaps[0].priority == PriorityLevel.HIGH


def test_missing_skill_in_profile_defaults_to_zero():
    """If student does not list a skill, current_level must default to 0.0."""
    skills = [Skill(name="Python", proficiency=3.0)]
    requirements = [
        MarketRequirement(
            skill="Docker",
            required_level=3.0,
            demand_level="frequently mentioned",
            source_url="https://example.com/docker"
        )
    ]
    gaps = calculate_skill_gaps(skills, requirements)

    assert len(gaps) == 1
    assert gaps[0].skill == "Docker"
    assert gaps[0].current_level == 0.0
    assert gaps[0].required_level == 3.0
    assert gaps[0].gap == 3.0
    assert gaps[0].priority == PriorityLevel.HIGH


def test_overqualified_skill_marked_as_mastered():
    """If student current level exceeds requirement, gap is 0.0 and status is MASTERED."""
    skills = [Skill(name="Git", proficiency=4.5)]
    requirements = [
        MarketRequirement(
            skill="Git",
            required_level=3.0,
            demand_level="high",
            source_url="https://example.com/git"
        )
    ]
    gaps = calculate_skill_gaps(skills, requirements)

    assert len(gaps) == 1
    assert gaps[0].gap == 0.0
    assert gaps[0].priority == PriorityLevel.MASTERED


def test_case_insensitive_skill_matching():
    """'python', 'Python', and ' PYTHON ' should match accurately."""
    skills = [Skill(name="  pYtHoN  ", proficiency=3.5)]
    requirements = [
        MarketRequirement(
            skill="Python",
            required_level=4.0,
            demand_level="critical",
            source_url="https://example.com/python"
        )
    ]
    gaps = calculate_skill_gaps(skills, requirements)

    assert len(gaps) == 1
    assert gaps[0].current_level == 3.5
    assert gaps[0].gap == 0.5


def test_priority_bucketing_and_sorting():
    """Verify sorting order: HIGH -> MEDIUM -> LOW -> MASTERED."""
    skills = [
        Skill(name="SQL", proficiency=1.0),
        Skill(name="Docker", proficiency=2.0),
        Skill(name="React", proficiency=4.0),
        Skill(name="Linux", proficiency=2.5),
    ]
    requirements = [
        MarketRequirement(skill="React", required_level=3.0, demand_level="moderate", source_url="https://ex.com/react"),   # Mastered (gap 0)
        MarketRequirement(skill="SQL", required_level=4.5, demand_level="critical", source_url="https://ex.com/sql"),       # HIGH (gap 3.5)
        MarketRequirement(skill="Docker", required_level=3.5, demand_level="high", source_url="https://ex.com/docker"),    # MEDIUM (gap 1.5)
        MarketRequirement(skill="Linux", required_level=3.0, demand_level="moderate", source_url="https://ex.com/linux"),  # LOW (gap 0.5)
    ]

    gaps = calculate_skill_gaps(skills, requirements)

    assert len(gaps) == 4
    # First must be HIGH priority (SQL)
    assert gaps[0].skill == "SQL"
    assert gaps[0].priority == PriorityLevel.HIGH
    # Second must be MEDIUM (Docker)
    assert gaps[1].skill == "Docker"
    assert gaps[1].priority == PriorityLevel.MEDIUM
    # Third must be LOW (Linux)
    assert gaps[2].skill == "Linux"
    assert gaps[2].priority == PriorityLevel.LOW
    # Last must be MASTERED (React)
    assert gaps[3].skill == "React"
    assert gaps[3].priority == PriorityLevel.MASTERED


def test_priority_branch_critical_with_moderate_gap():
    """Verify gap 1.0 with critical demand yields HIGH priority."""
    skills = [Skill(name="K8s", proficiency=2.0)]
    reqs = [
        MarketRequirement(
            skill="K8s",
            required_level=3.0,
            demand_level="critical demand",
            source_url="https://ex.com/k8s"
        )
    ]
    gaps = calculate_skill_gaps(skills, reqs)
    assert gaps[0].priority == PriorityLevel.HIGH


def test_priority_branch_moderate_demand_with_two_gap():
    """Verify gap 2.0 with low/moderate demand yields MEDIUM priority."""
    skills = [Skill(name="Bash", proficiency=1.0)]
    reqs = [
        MarketRequirement(
            skill="Bash",
            required_level=3.0,
            demand_level="low",
            source_url="https://ex.com/bash"
        )
    ]
    gaps = calculate_skill_gaps(skills, reqs)
    assert gaps[0].priority == PriorityLevel.MEDIUM
