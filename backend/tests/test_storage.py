"""Unit tests for SQLite database repository."""
import pytest
from app.db.storage import DatabaseManager
from app.models.assessment import AssessmentResult
from app.models.profile import Skill, StudentProfile
from app.models.roadmap import PhaseStatus, Roadmap, RoadmapPhase


@pytest.fixture
def temp_db(tmp_path):
    """Provides a temporary SQLite database for testing."""
    db_file = tmp_path / "test_careerforge.db"
    return DatabaseManager(str(db_file))


def test_save_and_get_profile(temp_db):
    """Verify profile persistence and retrieval."""
    profile = StudentProfile(
        name="Alex Mercer",
        degree="B.Tech",
        branch="CS",
        year=3,
        target_role="Backend Developer",
        available_hours_per_week=20,
        skills=[Skill(name="Python", proficiency=3.0), Skill(name="SQL", proficiency=2.0)]
    )
    saved = temp_db.save_profile(profile)
    assert saved.id is not None

    retrieved = temp_db.get_profile(saved.id)
    assert retrieved is not None
    assert retrieved.name == "Alex Mercer"
    assert len(retrieved.skills) == 2
    assert retrieved.skills[0].name == "Python"
    assert retrieved.skills[0].proficiency == 3.0


def test_update_skill_in_profile(temp_db):
    """Verify updating existing skill and adding new skill."""
    profile = StudentProfile(
        id="std_999",
        name="Sam",
        degree="B.S.",
        branch="IT",
        year=4,
        target_role="Data Engineer",
        available_hours_per_week=15,
        skills=[Skill(name="Python", proficiency=2.0)]
    )
    temp_db.save_profile(profile)

    # Update existing skill
    updated = temp_db.update_skill_in_profile("std_999", "Python", 4.0)
    assert updated is not None
    assert next(s for s in updated.skills if s.name == "Python").proficiency == 4.0

    # Add new skill
    updated = temp_db.update_skill_in_profile("std_999", "Docker", 2.5)
    assert len(updated.skills) == 2
    assert next(s for s in updated.skills if s.name == "Docker").proficiency == 2.5


def test_save_and_get_roadmap(temp_db):
    """Verify roadmap persistence and phase retrieval."""
    phase1 = RoadmapPhase(
        phase_number=1,
        title="Foundations",
        skills_covered=["Python", "DSA"],
        estimated_hours=30,
        status=PhaseStatus.IN_PROGRESS
    )
    roadmap = Roadmap(
        profile_id="std_999",
        target_role="Backend Developer",
        total_estimated_hours=60,
        available_hours_per_week=15,
        estimated_weeks=4,
        phases=[phase1]
    )
    temp_db.save_roadmap(roadmap)

    fetched = temp_db.get_roadmap("std_999")
    assert fetched is not None
    assert fetched.total_estimated_hours == 60
    assert len(fetched.phases) == 1
    assert fetched.phases[0].title == "Foundations"
    assert fetched.phases[0].status == PhaseStatus.IN_PROGRESS


def test_save_and_get_assessments(temp_db):
    """Verify logging and retrieval of assessment history."""
    rec = AssessmentResult(
        profile_id="std_999",
        skill="SQL",
        score_percentage=90.0,
        previous_level=2.0,
        updated_level=3.8,
        level_delta=1.8
    )
    temp_db.save_assessment(rec)

    history = temp_db.get_assessments("std_999")
    assert len(history) == 1
    assert history[0].skill == "SQL"
    assert history[0].updated_level == 3.8


def test_non_existent_records_return_none(temp_db):
    """Verify querying non-existent profiles or roadmaps safely returns None."""
    assert temp_db.get_profile("non_existent_id") is None
    assert temp_db.get_roadmap("non_existent_id") is None
    assert temp_db.update_skill_in_profile("non_existent_id", "Python", 3.0) is None


def test_get_db_singleton(tmp_path):
    """Verify get_db returns a valid singleton database manager."""
    from app.db.storage import get_db
    custom_path = str(tmp_path / "singleton_test.db")
    db1 = get_db(custom_path)
    db2 = get_db(custom_path)
    assert db1 is db2

