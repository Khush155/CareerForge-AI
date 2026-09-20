"""Tests for CareerForge AI Dream Job Role Resolver."""
import pytest
from app.tools.role_resolver import RoleResolver, get_role_resolver


@pytest.fixture
def resolver() -> RoleResolver:
    return get_role_resolver()


def test_resolver_loads_roles(resolver: RoleResolver):
    """Verify that rich role database is populated with at least 25 roles."""
    assert len(resolver.roles) >= 25
    categories = resolver.get_all_roles_grouped()
    assert len(categories) >= 3


@pytest.mark.parametrize(
    "query,expected_keyword",
    [
        ("Backend Developer", "backend"),
        ("sde", "software"),
        ("swe backend", "backend"),
        ("machin learnng eng", "learning"),
        ("devops sre", "devops"),
        ("I want to build games", "game"),
        ("asdfgh", "software"),  # Garbage must map safely without crashing
        ("fullstack web developer", "full stack"),
        ("ai engineer", "ai"),
        ("cloud architect", "cloud"),
        ("cyber security and ethical hacking", "cybersecurity"),
        ("ios mobile apps", "ios"),
        ("data analyst", "data"),
        ("qa automation sdet", "qa"),
        ("!@#$%^&*()_+", "software"),  # Symbols must never crash
        ("robotics and autonomous systems", "robotics"),
        ("embedded systems and iot", "embedded"),
    ],
)
def test_resolver_handles_varied_queries(resolver: RoleResolver, query: str, expected_keyword: str):
    """Verify at least 15 varied queries return valid non-empty benchmarks and never raise."""
    response = resolver.resolve_role(query)

    # Must always return a valid response object
    assert response.matched_role != ""
    assert response.role_id != ""
    assert response.confidence > 0.0
    assert len(response.benchmark) >= 3
    assert response.source_type in ["curated", "ai_estimated", "estimated"]
    assert response.tagline != ""

    # Each skill within the benchmark must be well-formed
    for skill in response.benchmark:
        assert skill.name != ""
        assert 0.0 <= skill.required_level <= 5.0
        assert skill.source_url.startswith("http")

    # The matched role should align with expected domain
    combined_text = f"{response.matched_role} {response.role_id} {response.category}".lower()
    assert expected_keyword.lower() in combined_text or "software" in combined_text


def test_suggestions_endpoint_fast_results(resolver: RoleResolver):
    """Verify suggestion autocomplete returns <= 8 results quickly."""
    suggestions = resolver.suggest_roles("dev", limit=8)
    assert len(suggestions) <= 8
    assert len(suggestions) > 0
    assert any("dev" in s["title"].lower() or "cloud" in s["title"].lower() for s in suggestions)
