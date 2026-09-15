"""Core deterministic business logic package."""
from app.core.gap_calculator import calculate_skill_gaps
from app.core.progress_engine import calculate_updated_skill_level

__all__ = ["calculate_skill_gaps", "calculate_updated_skill_level"]
