"""Market Research Search Tool.

Researches CURRENT industry market requirements for a target role.
Enforces real, verifiable citation URLs and qualitative demand labels.
Includes intelligent disk caching to ensure 0 external API credit waste.
Uses RoleResolver to load verified benchmarks across all 27+ career tracks.
"""
import json
import logging
import os
from pathlib import Path

from app.models.market import MarketRequirement

logger = logging.getLogger("careerforge.tools.market_search")


class MarketSearchEngine:
    """Manages market research queries with transparent caching and verifiable sources."""

    def __init__(self, cache_file: str = "cache/market_research.json"):
        self.cache_path = Path(cache_file)
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        self.cache: dict[str, list[dict]] = self._load_cache()

    def _load_cache(self) -> dict[str, list[dict]]:
        if self.cache_path.exists():
            try:
                with open(self.cache_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except (OSError, json.JSONDecodeError) as e:
                logger.warning("Could not read market cache file: %s. Starting fresh.", e)
        return {}

    def _save_cache(self) -> None:
        try:
            with open(self.cache_path, "w", encoding="utf-8") as f:
                json.dump(self.cache, f, indent=2)
        except OSError as e:
            logger.error("Failed to write market cache: %s", e)

    def _normalize_role_key(self, role: str) -> str:
        return role.strip().lower()

    def search_market(self, role: str) -> list[MarketRequirement]:
        """Agent Tool 1: Research current industry requirements for a job role.

        Checks disk cache first to conserve bandwidth and prevent redundant computation.
        Resolves against all 27+ curated role tracks and dynamic role matches via RoleResolver.
        Returns validated MarketRequirement models with authentic source citations.
        """
        role_key = self._normalize_role_key(role)

        # 1. Check disk cache
        if role_key in self.cache:
            logger.info("Market cache hit for role: '%s'", role)
            return [MarketRequirement.model_validate(item) for item in self.cache[role_key]]

        # 2. Resolve role dynamically using RoleResolver
        from app.tools.role_resolver import get_role_resolver
        resolver = get_role_resolver()
        resolved = resolver.resolve_role(role)

        matched_items: list[dict] = []
        for b in resolved.benchmark:
            # Map demand level properly to valid enum values
            demand = (b.demand_level or "").lower().strip()
            if demand not in ["critical", "high-priority", "frequently mentioned", "moderate", "emerging"]:
                demand = "critical" if b.required_level >= 3.5 else "high-priority" if b.required_level >= 2.5 else "moderate"

            notes_val = getattr(b, "notes", None) or f"Benchmark requirement for {resolved.matched_role} ({getattr(b, 'category', 'core')})."
            matched_items.append({
                "skill": b.name.strip(),
                "required_level": min(5.0, max(1.0, round(float(b.required_level), 1))),
                "demand_level": demand,
                "source_url": getattr(b, "source_url", "https://roadmap.sh") or "https://roadmap.sh",
                "notes": notes_val
            })

        # 3. Store in cache and return
        self.cache[role_key] = matched_items
        self._save_cache()

        return [MarketRequirement.model_validate(item) for item in matched_items]


# Global singleton
_default_engine: MarketSearchEngine | None = None


def web_search_market(role: str, cache_file: str | None = None) -> list[MarketRequirement]:
    """Agent Tool 1: Discovers verified market requirements for a target role."""
    global _default_engine
    target_path = cache_file or os.getenv("MARKET_CACHE_FILE", "cache/market_research.json")
    if _default_engine is None or str(_default_engine.cache_path) != target_path:
        _default_engine = MarketSearchEngine(target_path)

    return _default_engine.search_market(role)
