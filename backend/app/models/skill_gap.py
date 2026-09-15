"""Skill gap data models."""
from enum import Enum

from pydantic import BaseModel, Field


class PriorityLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    MASTERED = "Mastered"


class SkillGap(BaseModel):
    """Calculated gap between student proficiency and market requirements."""
    skill: str = Field(..., description="Name of the skill")
    current_level: float = Field(..., ge=0.0, le=5.0, description="Student's current proficiency")
    required_level: float = Field(..., ge=0.0, le=5.0, description="Market benchmark required level")
    gap: float = Field(..., description="Deterministic difference: max(0, required_level - current_level)")
    priority: PriorityLevel = Field(..., description="Priority bucket: High, Medium, Low, or Mastered")
    demand_level: str = Field("moderate", description="Demand level from market research")
    source_url: str | None = Field(None, description="Citation link from market research")
    reasoning: str | None = Field(None, description="Deterministic or qualitative justification for priority")
