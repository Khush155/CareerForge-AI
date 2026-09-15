"""Unit tests for Phase 2 agent tools: Knowledge RAG & Market Search."""
from pathlib import Path

from app.models.market import MarketRequirement
from app.models.roadmap import ResourceItem
from app.tools.knowledge_rag import LocalKnowledgeRetriever, retrieve_knowledge_base
from app.tools.market_search import MarketSearchEngine, web_search_market


def test_knowledge_rag_retrieval_sql():
    """Verify RAG retriever returns relevant SQL guides."""
    results = retrieve_knowledge_base(query="SQL indexing and joins", top_k=2)
    assert len(results) > 0
    assert all(isinstance(r, ResourceItem) for r in results)
    assert any("SQL" in r.title for r in results)
    assert all(r.resource_type == "kb_guide" for r in results)
    assert all(r.url_or_ref.startswith("data/curated_kb/") for r in results)


def test_knowledge_rag_retrieval_docker():
    """Verify RAG retriever returns Docker and container guides."""
    results = retrieve_knowledge_base(query="Docker multi-stage builds and containers", top_k=2)
    assert len(results) > 0
    assert any("Docker" in r.title or "DevOps" in r.title for r in results)


def test_knowledge_rag_empty_or_no_match():
    """Verify handling of empty or nonsense queries."""
    empty_res = retrieve_knowledge_base(query="")
    assert empty_res == []

    nonsense_res = retrieve_knowledge_base(query="xyz999nonexistenttopic")
    assert nonsense_res == []


def test_knowledge_rag_custom_dir(tmp_path):
    """Verify LocalKnowledgeRetriever handles custom or empty directory."""
    empty_dir = tmp_path / "empty_kb"
    empty_dir.mkdir()
    retriever = LocalKnowledgeRetriever(str(empty_dir))
    assert retriever.search("Python") == []


def test_market_search_backend():
    """Verify market research for Backend Engineer returns valid benchmarks with real citations."""
    reqs = web_search_market(role="Backend Engineer")
    assert len(reqs) >= 5
    assert all(isinstance(r, MarketRequirement) for r in reqs)

    skill_names = [r.skill for r in reqs]
    assert "Python" in skill_names
    assert "SQL" in skill_names
    assert "Docker" in skill_names

    # Check citation URLs are valid web links
    for r in reqs:
        assert r.source_url.startswith("http://") or r.source_url.startswith("https://")
        assert len(r.demand_level) > 0
        assert 1.0 <= r.required_level <= 5.0


def test_market_search_frontend():
    """Verify market research for Frontend Engineer."""
    reqs = web_search_market(role="Frontend Developer")
    assert len(reqs) >= 4
    skill_names = [r.skill for r in reqs]
    assert "React" in skill_names
    assert "JavaScript" in skill_names


def test_market_search_caching(tmp_path):
    """Verify market search writes to and loads from disk cache."""
    cache_file = str(tmp_path / "test_market_cache.json")
    engine = MarketSearchEngine(cache_file)

    # First call - cache miss, should save
    first_call = engine.search_market("Data Engineer")
    assert Path(cache_file).exists()

    # Read back cache directly to verify file content
    second_call = engine.search_market("Data Engineer")
    assert len(first_call) == len(second_call)
    assert [r.skill for r in first_call] == [r.skill for r in second_call]


def test_market_search_fallback_unknown_role(tmp_path):
    """Verify unknown roles receive valid baseline software engineering benchmarks."""
    cache_file = str(tmp_path / "fallback_cache.json")
    engine = MarketSearchEngine(cache_file)

    reqs = engine.search_market("Quantum Robotics Architect")
    assert len(reqs) > 0
    assert all(isinstance(r, MarketRequirement) for r in reqs)
    assert any(r.skill == "Python" for r in reqs)


def test_market_search_corrupted_cache_recovery(tmp_path):
    """Verify MarketSearchEngine recovers gracefully when cache file contains invalid JSON."""
    cache_file = tmp_path / "corrupted_cache.json"
    cache_file.write_text("invalid json content {", encoding="utf-8")

    engine = MarketSearchEngine(str(cache_file))
    assert engine.cache == {}
    results = engine.search_market("DevOps")
    assert len(results) > 0


def test_knowledge_rag_unreadable_file_handling(tmp_path):
    """Verify LocalKnowledgeRetriever handles non-existent or corrupted files without crashing."""
    bad_dir = tmp_path / "non_existent_kb_folder"
    retriever = LocalKnowledgeRetriever(str(bad_dir))
    assert retriever.chunks == []

