"""API integration tests for all CareerForge AI endpoints."""
import pytest
from app.db.storage import get_db
from app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def test_client(tmp_path, monkeypatch):
    """Provides a TestClient connected to an isolated temporary SQLite database."""
    temp_db_file = str(tmp_path / "test_api_database.db")
    monkeypatch.setenv("DATABASE_PATH", temp_db_file)
    monkeypatch.setenv("MODE", "mock")

    # Reset singleton database manager to use temp path
    get_db(temp_db_file)

    with TestClient(app) as client:
        yield client


def test_health_check_endpoint(test_client):
    """Verify system health endpoint returns 200 and healthy status."""
    response = test_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "CareerForge AI"


def test_post_profile_generates_roadmap(test_client):
    """Verify POST /api/profile triggers the 7-step loop and stores profile & roadmap."""
    payload = {
        "id": "std_api_01",
        "name": "Maya Lin",
        "degree": "B.Tech",
        "branch": "Computer Science",
        "year": 3,
        "target_role": "Backend Engineer",
        "skills": [
            {"name": "Python", "proficiency": 3.0},
            {"name": "SQL", "proficiency": 1.5}
        ],
        "available_hours_per_week": 20,
        "current_prep_level": "intermediate"
    }

    response = test_client.post("/api/profile", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "profile" in data
    assert "market_requirements" in data
    assert "gaps" in data
    assert "roadmap" in data

    assert data["profile"]["id"] == "std_api_01"
    assert len(data["market_requirements"]) > 0
    assert len(data["gaps"]) > 0
    assert data["roadmap"]["version"] == 1
    assert len(data["roadmap"]["phases"]) >= 2


def test_get_profile_and_roadmap_endpoints(test_client):
    """Verify GET /api/profile/{id} and GET /api/roadmap/{id} retrieve saved models."""
    # First create profile
    payload = {
        "id": "std_api_02",
        "name": "Devin Fox",
        "degree": "MCA",
        "branch": "IT",
        "year": 2,
        "target_role": "Frontend Developer",
        "skills": [{"name": "JavaScript", "proficiency": 2.5}],
        "available_hours_per_week": 15
    }
    test_client.post("/api/profile", json=payload)

    # Fetch profile
    prof_resp = test_client.get("/api/profile/std_api_02")
    assert prof_resp.status_code == 200
    prof_data = prof_resp.json()
    assert prof_data["name"] == "Devin Fox"

    # Fetch roadmap
    rd_resp = test_client.get("/api/roadmap/std_api_02")
    assert rd_resp.status_code == 200
    rd_data = rd_resp.json()
    assert rd_data["target_role"] == "Frontend Developer"
    assert rd_data["version"] == 1


def test_get_non_existent_records_return_404(test_client):
    """Verify 404 responses for missing profiles and roadmaps."""
    resp1 = test_client.get("/api/profile/non_existent_id")
    assert resp1.status_code == 404
    assert "not found" in resp1.json()["detail"].lower()

    resp2 = test_client.get("/api/roadmap/non_existent_id")
    assert resp2.status_code == 404
    assert "not found" in resp2.json()["detail"].lower()


def test_post_assessment_adapts_roadmap(test_client):
    """Verify POST /api/assessment executes the hero adaptation loop."""
    # Setup initial profile
    profile_payload = {
        "id": "std_api_03",
        "name": "Sara Chen",
        "degree": "B.Tech",
        "branch": "CS",
        "year": 3,
        "target_role": "Backend Engineer",
        "skills": [{"name": "SQL", "proficiency": 1.5}],
        "available_hours_per_week": 15
    }
    test_client.post("/api/profile", json=profile_payload)

    # Submit assessment
    assessment_payload = {
        "profile_id": "std_api_03",
        "skill": "SQL",
        "score_percentage": 90.0,
        "notes": "Completed intermediate PostgreSQL challenge"
    }
    assess_resp = test_client.post("/api/assessment", json=assessment_payload)
    assert assess_resp.status_code == 200
    data = assess_resp.json()

    assert data["result"]["skill"] == "SQL"
    assert data["result"]["updated_level"] > 1.5
    assert data["roadmap"]["version"] == 2
    assert "summary" in data
    assert len(data["summary"]) > 0

    # Verify assessment history is retrievable
    hist_resp = test_client.get("/api/assessment/std_api_03")
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) == 1
    assert history[0]["skill"] == "SQL"


def test_post_assessment_unknown_profile_returns_404(test_client):
    """Verify submitting assessment for invalid profile returns 404."""
    assessment_payload = {
        "profile_id": "ghost_profile",
        "skill": "Docker",
        "score_percentage": 85.0
    }
    response = test_client.post("/api/assessment", json=assessment_payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_market_requirements_endpoint(test_client):
    """Verify GET /api/market/{role} returns cached benchmark requirements."""
    response = test_client.get("/api/market/Backend%20Engineer")
    assert response.status_code == 200
    reqs = response.json()
    assert len(reqs) > 0
    assert any(r["skill"] == "Python" for r in reqs)
    assert all(r["source_url"].startswith("http") for r in reqs)


def test_static_frontend_index_accessible(test_client):
    """Verify that GET / serves index.html with CareerForge branding."""
    response = test_client.get("/")
    assert response.status_code == 200
    assert "CareerForge" in response.text
    assert "text/html" in response.headers.get("content-type", "")
