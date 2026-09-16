"""Unit and integration tests for CareerForge AI Agent Orchestrator and Azure Client."""
import pytest
from app.agent.azure_client import AzureOpenAIClient
from app.agent.orchestrator import CareerForgeAgent
from app.db.storage import DatabaseManager
from app.models.assessment import AssessmentInput
from app.models.profile import Skill, StudentProfile
from app.models.roadmap import PhaseStatus
from app.models.skill_gap import PriorityLevel


@pytest.fixture
def agent_with_temp_db(tmp_path):
    """Provides an agent orchestrator instance backed by a temporary test database."""
    db_file = tmp_path / "test_agent_storage.db"
    db = DatabaseManager(str(db_file))
    llm = AzureOpenAIClient(mode="mock")
    return CareerForgeAgent(db=db, llm_client=llm)


def test_agent_generate_initial_roadmap(agent_with_temp_db):
    """Verify the 7-step planning loop produces a valid, multi-phase roadmap."""
    profile = StudentProfile(
        id="std_test_01",
        name="Jordan Lee",
        degree="B.Tech",
        branch="Computer Science",
        year=3,
        target_role="Backend Engineer",
        available_hours_per_week=20,
        skills=[
            Skill(name="Python", proficiency=2.5),
            Skill(name="SQL", proficiency=1.5),
        ]
    )

    market_reqs, gaps, roadmap = agent_with_temp_db.generate_initial_roadmap(profile)

    # 1. Market requirements check
    assert len(market_reqs) > 0
    assert all(r.source_url.startswith("http") for r in market_reqs)

    # 2. Deterministic gaps check
    assert len(gaps) > 0
    assert any(g.skill == "SQL" and g.priority == PriorityLevel.HIGH for g in gaps)

    # 3. Roadmap validation
    assert roadmap.profile_id == "std_test_01"
    assert roadmap.version == 1
    assert len(roadmap.phases) >= 2
    assert roadmap.total_estimated_hours > 0
    assert roadmap.estimated_weeks >= 1

    # 4. Phase 1 contents
    p1 = roadmap.phases[0]
    assert p1.phase_number == 1
    assert p1.status == PhaseStatus.IN_PROGRESS
    assert len(p1.skills_covered) > 0
    assert len(p1.learning_objectives) > 0

    # 5. SQLite Persistence check
    saved_profile = agent_with_temp_db.db.get_profile("std_test_01")
    assert saved_profile is not None
    saved_roadmap = agent_with_temp_db.db.get_roadmap("std_test_01")
    assert saved_roadmap is not None
    assert saved_roadmap.total_estimated_hours == roadmap.total_estimated_hours


def test_agent_all_skills_mastered(agent_with_temp_db):
    """Verify handling when a student already meets all target benchmarks."""
    profile = StudentProfile(
        id="std_expert",
        name="Senior Student",
        degree="B.Tech",
        branch="IT",
        year=4,
        target_role="DevOps",
        available_hours_per_week=15,
        skills=[
            Skill(name="Docker", proficiency=5.0),
            Skill(name="Linux", proficiency=5.0),
            Skill(name="CI/CD", proficiency=5.0),
            Skill(name="Cloud / Azure", proficiency=5.0),
            Skill(name="Git", proficiency=5.0),
        ]
    )

    _, gaps, roadmap = agent_with_temp_db.generate_initial_roadmap(profile)
    assert all(g.priority == PriorityLevel.MASTERED for g in gaps)
    assert len(roadmap.phases) == 1
    assert "Mock Interviews" in roadmap.phases[0].title


def test_agent_dynamic_roadmap_adaptation(agent_with_temp_db):
    """Verify The Hero Feature: scoring 85%+ adapts roadmap, deprioritizes skill, and increments version."""
    profile = StudentProfile(
        id="std_adaptive",
        name="Alex River",
        degree="B.Tech",
        branch="CS",
        year=3,
        target_role="Backend Engineer",
        available_hours_per_week=15,
        skills=[
            Skill(name="Python", proficiency=4.0),
            Skill(name="SQL", proficiency=2.0),
        ]
    )

    # Step 1: Generate initial plan
    _, _, initial_roadmap = agent_with_temp_db.generate_initial_roadmap(profile)
    initial_version = initial_roadmap.version
    initial_hours = initial_roadmap.total_estimated_hours

    # Step 2: Student completes SQL assessment with 95%
    assessment_input = AssessmentInput(
        profile_id="std_adaptive",
        skill="SQL",
        score_percentage=95.0,
        notes="Aced PostgreSQL advanced indexing and window functions quiz"
    )

    result, new_gaps, adapted_roadmap, summary = agent_with_temp_db.adapt_roadmap_on_assessment(assessment_input)

    # Verify score calculation: 2.0*0.4 + 4.75*0.6 = 0.8 + 2.85 = 3.65 -> 3.7 or higher
    assert result.updated_level > result.previous_level
    assert result.level_delta > 0
    assert len(new_gaps) > 0

    # Verify roadmap adapted
    assert adapted_roadmap.version == initial_version + 1
    assert adapted_roadmap.total_estimated_hours <= initial_hours
    assert "SQL" in summary
    assert len(summary) > 10

    # Verify assessment log persisted
    history = agent_with_temp_db.db.get_assessments("std_adaptive")
    assert len(history) == 1
    assert history[0].skill == "SQL"
    assert history[0].score_percentage == 95.0


def test_agent_adapt_non_existent_profile_raises(agent_with_temp_db):
    """Verify adapting assessment for non-existent profile raises clear ValueError."""
    assessment_input = AssessmentInput(
        profile_id="unknown_std_999",
        skill="Docker",
        score_percentage=80.0
    )
    with pytest.raises(ValueError, match="Student profile 'unknown_std_999' not found"):
        agent_with_temp_db.adapt_roadmap_on_assessment(assessment_input)


def test_azure_client_configuration_and_mock_fallback():
    """Verify AzureOpenAIClient behavior in mock and unconfigured modes."""
    client = AzureOpenAIClient(mode="mock")
    assert client.is_configured is False

    # Should safely return fallback milestones without crashing
    objectives = client.enrich_phase_objectives(
        phase_title="Phase 1",
        skills=["Python", "SQL"],
        allocated_hours=30,
        target_role="Backend Developer",
        student_level="intermediate"
    )
    assert len(objectives) >= 3
    assert any("Python" in obj or "SQL" in obj for obj in objectives)

    # Should safely return fallback adaptation summary
    summary = client.generate_adaptation_summary(
        skill="Docker",
        previous_level=1.0,
        updated_level=3.5,
        score_percentage=88.0,
        hours_saved_or_shifted=15,
        deprioritized=True
    )
    assert "Docker" in summary
    assert "Mastered" in summary

    # Should safely return fallback adaptation summary when not deprioritized
    summary_improving = client.generate_adaptation_summary(
        skill="SQL",
        previous_level=2.0,
        updated_level=2.8,
        score_percentage=70.0,
        hours_saved_or_shifted=4,
        deprioritized=False
    )
    assert "SQL" in summary_improving
    assert "updated from 2.0 to 2.8" in summary_improving


def test_azure_client_live_call_success(monkeypatch):
    """Verify Azure client parses clean responses from Azure OpenAI when configured."""
    client = AzureOpenAIClient(
        endpoint="https://valid-resource.openai.azure.com",
        api_key="valid-secret-key-123",
        deployment="gpt-4o-mini",
        mode="azure"
    )
    assert client.is_configured is True

    # Mock httpx response
    class MockResponse:
        status_code = 200

        def json(self):
            return {
                "choices": [
                    {"message": {"content": '```json\n["Live Milestone 1", "Live Milestone 2"]\n```'}}
                ]
            }

    monkeypatch.setattr("httpx.Client.post", lambda *args, **kwargs: MockResponse())

    objectives = client.enrich_phase_objectives(
        phase_title="Phase 1",
        skills=["Python"],
        allocated_hours=20,
        target_role="Backend Developer",
        student_level="beginner"
    )
    assert objectives == ["Live Milestone 1", "Live Milestone 2"]


def test_azure_client_live_summary_and_error_handling(monkeypatch):
    """Verify live summary generation and graceful fallback on API error."""
    client = AzureOpenAIClient(
        endpoint="https://valid-resource.openai.azure.com",
        api_key="valid-secret-key-123",
        deployment="gpt-4o-mini",
        mode="azure"
    )

    # 1. Summary success
    class MockSummaryResponse:
        status_code = 200

        def json(self):
            return {
                "choices": [
                    {"message": {"content": "Great work on SQL! Phase hours have shifted to Docker."}}
                ]
            }

    monkeypatch.setattr("httpx.Client.post", lambda *args, **kwargs: MockSummaryResponse())
    summary = client.generate_adaptation_summary(
        skill="SQL",
        previous_level=1.5,
        updated_level=3.5,
        score_percentage=90.0,
        hours_saved_or_shifted=10,
        deprioritized=True
    )
    assert summary == "Great work on SQL! Phase hours have shifted to Docker."

    # 2. HTTP 500 error fallback
    class MockErrorResponse:
        status_code = 500
        text = "Internal Server Error"

    monkeypatch.setattr("httpx.Client.post", lambda *args, **kwargs: MockErrorResponse())
    fallback_objs = client.enrich_phase_objectives("Phase 2", ["Docker"], 15, "DevOps", "intermediate")
    assert len(fallback_objs) > 0
    assert any("Docker" in o for o in fallback_objs)


def test_agent_generate_initial_roadmap_generates_id_if_missing(agent_with_temp_db):
    """Verify profile.id is automatically populated when None is passed."""
    profile = StudentProfile(
        id=None,
        name="No ID Student",
        degree="B.Tech",
        branch="CS",
        year=2,
        target_role="Frontend Developer",
        available_hours_per_week=10,
        skills=[]
    )
    _, _, roadmap = agent_with_temp_db.generate_initial_roadmap(profile)
    assert profile.id is not None
    assert profile.id.startswith("std_")
    assert roadmap.profile_id == profile.id


def test_agent_adapt_without_existing_roadmap_generates_it(agent_with_temp_db):
    """Verify adapt_roadmap_on_assessment generates initial roadmap if not present in DB."""
    profile = StudentProfile(
        id="std_no_prior_roadmap",
        name="Direct Assessor",
        degree="MCA",
        branch="IT",
        year=2,
        target_role="Backend Engineer",
        available_hours_per_week=20,
        skills=[Skill(name="Python", proficiency=3.0)]
    )
    # Save profile only, without saving a roadmap
    agent_with_temp_db.db.save_profile(profile)

    assess_in = AssessmentInput(
        profile_id="std_no_prior_roadmap",
        skill="Python",
        score_percentage=90.0
    )
    result, new_gaps, adapted_roadmap, _ = agent_with_temp_db.adapt_roadmap_on_assessment(assess_in)
    assert result.updated_level > 3.0
    assert adapted_roadmap.version >= 1
    assert len(new_gaps) > 0


def test_agent_adapt_multi_skill_phase_removal(agent_with_temp_db):
    """Verify when one skill in a multi-skill phase is mastered, it is removed from skills_covered."""
    profile = StudentProfile(
        id="std_multi_skill",
        name="Multi Skill Student",
        degree="B.Tech",
        branch="CS",
        year=3,
        target_role="Backend Engineer",
        available_hours_per_week=20,
        skills=[
            Skill(name="Python", proficiency=1.0),
            Skill(name="SQL", proficiency=1.0),
            Skill(name="REST APIs", proficiency=1.0),
            Skill(name="Git", proficiency=3.0)
        ]
    )
    _, _, roadmap = agent_with_temp_db.generate_initial_roadmap(profile)
    p1 = roadmap.phases[0]
    # Ensure phase has multiple skills
    assert len(p1.skills_covered) >= 2

    target_skill = "Git"
    # Student scores 100% on Git (3.0 * 0.4 + 5.0 * 0.6 = 4.2 >= 3.5) to master it
    assess_in = AssessmentInput(
        profile_id="std_multi_skill",
        skill=target_skill,
        score_percentage=100.0
    )
    _, _, adapted, _ = agent_with_temp_db.adapt_roadmap_on_assessment(assess_in)
    adapted_p1 = adapted.phases[0]
    # The mastered skill should be removed from skills_covered if other skills remain
    if len(p1.skills_covered) > 1:
        assert target_skill not in adapted_p1.skills_covered


def test_agent_phases_with_no_high_priority_gaps(agent_with_temp_db):
    """Verify phase building when high priority gaps are absent but medium/low exist."""
    profile = StudentProfile(
        id="std_medium_gaps_only",
        name="Intermediate Student",
        degree="B.Tech",
        branch="CS",
        year=3,
        target_role="Backend Engineer",
        available_hours_per_week=15,
        skills=[
            # Satisfies critical/high demand benchmarks (Python 4.0, SQL 4.0, REST APIs 4.0)
            Skill(name="Python", proficiency=4.0),
            Skill(name="SQL", proficiency=4.0),
            Skill(name="REST APIs", proficiency=4.0),
            # Has gaps on Docker (req 3.0), System Design (req 3.0), Redis (req 2.5)
            Skill(name="Docker", proficiency=1.5),
            Skill(name="System Design", proficiency=1.5),
            Skill(name="Redis", proficiency=1.0),
        ]
    )
    _, gaps, roadmap = agent_with_temp_db.generate_initial_roadmap(profile)
    assert len(gaps) > 0
    assert len(roadmap.phases) >= 2
    assert any(p.phase_number == 1 for p in roadmap.phases)
