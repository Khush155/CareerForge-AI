"""API integration tests."""
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_health_check_endpoint():
    """Verify system health endpoint returns 200 and healthy status."""
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "CareerForge AI"

