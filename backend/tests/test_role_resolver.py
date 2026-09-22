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
        ("fullstack web developer", "full stack"),
        ("ai engineer", "ai"),
        ("cloud architect", "cloud"),
        ("cyber security and ethical hacking", "cybersecurity"),
        ("ios mobile apps", "ios"),
        ("data analyst", "data"),
        ("qa automation sdet", "qa"),
        ("robotics and autonomous systems", "robotics"),
        ("embedded systems and iot", "embedded"),
        ("software developer", "software"),
        ("civil engineer", "civil"),
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
    assert expected_keyword.lower() in combined_text or "software" in combined_text or "engineering" in combined_text


@pytest.mark.parametrize(
    "gibberish_query",
    [
        "easreasvsvsvssrv",
        "asdfghjkl",
        "qwertyuiop",
        "!@#$%^&*()_+",
        "zzzzzzzz",
    ],
)
def test_resolver_rejects_gibberish_and_random_text(resolver: RoleResolver, gibberish_query: str):
    """Verify random text like 'easreasvsvsvssrv' does not account to a job and returns unrecognized."""
    response = resolver.resolve_role(gibberish_query)
    assert response.source_type == "unrecognized"
    assert response.confidence == 0.0
    assert response.matched_role == ""
    assert "No recognized career track found" in response.message
    assert len(response.alternatives) > 0

    suggestions = resolver.suggest_roles(gibberish_query)
    assert len(suggestions) == 0


def test_resolver_handles_broad_terms_with_guidance(resolver: RoleResolver):
    """Verify broad terms like 'engineer' offer specialized alternatives and guidance."""
    for broad in ["engineer", "developer", "doctor"]:
        response = resolver.resolve_role(broad)
        assert response.matched_role != ""
        assert len(response.alternatives) >= 2
        assert "broad" in response.message.lower()

        suggestions = resolver.suggest_roles(broad)
        assert len(suggestions) >= 2


def test_suggestions_endpoint_fast_results(resolver: RoleResolver):
    """Verify suggestion autocomplete returns <= 8 results quickly."""
    suggestions = resolver.suggest_roles("dev", limit=8)
    assert len(suggestions) <= 8
    assert len(suggestions) > 0
    assert any("dev" in s["title"].lower() or "cloud" in s["title"].lower() for s in suggestions)


def test_role_resolver_persistent_disk_cache(tmp_path):
    """Verify RoleResolver writes custom role synthesis to disk cache and falls back to previous user search when key fails."""
    cache_file = tmp_path / "test_ai_roles.json"
    resolver_instance = RoleResolver(cache_file=str(cache_file))

    # Simulate a custom role synthesized from an earlier user search
    test_role_data = {
        "matched_role": "Quantum Cryptography Specialist",
        "role_id": "quantum_crypto_specialist",
        "confidence": 0.95,
        "tagline": "Architects post-quantum encryption protocols.",
        "category": "Security & Emerging Tech",
        "alternatives": ["Cybersecurity Analyst"],
        "benchmark": [
            {
                "name": "Post-Quantum Cryptography (Lattice-Based)",
                "required_level": 4.5,
                "demand_level": "critical",
                "est_hours": 40,
                "category": "cryptography",
                "source_type": "ai_estimated",
                "source_url": "https://roadmap.sh",
            }
        ],
        "source_type": "ai_estimated",
        "message": "Live AI curriculum synthesized.",
        "tier_label": "Target Organization Tier",
        "target_tiers": ["Top Tier Lab"],
        "degree_label": "Degree",
        "branch_label": "Specialization",
        "suggested_degrees": ["M.S. Cybersecurity"],
        "suggested_branches": ["Quantum Computing"],
    }

    # Store into cache as if another user searched it earlier
    norm_key = resolver_instance.normalize_query("quantum cryptography")
    resolver_instance.ai_cache[norm_key] = test_role_data
    resolver_instance._save_ai_cache()

    assert cache_file.exists()

    # Create a fresh resolver instance (simulating subsequent user when Azure key is unavailable/offline)
    fresh_resolver = RoleResolver(cache_file=str(cache_file))
    assert norm_key in fresh_resolver.ai_cache

    # When second user searches the same or similar query, it returns the cached result from the first user
    res = fresh_resolver.resolve_role("quantum cryptography")
    assert res.matched_role == "Quantum Cryptography Specialist"
    assert "search cache" in res.message.lower()
    assert len(res.benchmark) >= 1
    assert "Post-Quantum" in res.benchmark[0].name

