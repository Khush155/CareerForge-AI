"""Assessment input and result data models."""
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class AssessmentInput(BaseModel):
    """Input payload when a student logs progress or completes a skill quiz."""
    profile_id: str = Field(..., description="Student profile ID")
    skill: str = Field(..., description="Target skill evaluated, e.g. 'SQL'")
    score_percentage: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Assessment score achieved as a percentage (0.0 to 100.0)"
    )
    notes: str | None = Field(None, description="Optional notes on what was completed (e.g. 'Completed LeetCode medium SQL set')")


class AssessmentResult(BaseModel):
    """Deterministic result of applying an assessment score to a skill level."""
    profile_id: str = Field(..., description="Student profile ID")
    skill: str = Field(..., description="Name of the skill updated")
    score_percentage: float = Field(..., description="Assessment score submitted")
    previous_level: float = Field(..., ge=0.0, le=5.0, description="Proficiency level before assessment")
    updated_level: float = Field(..., ge=0.0, le=5.0, description="New proficiency level after formula calculation")
    level_delta: float = Field(..., description="Net change in proficiency (+/-)")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of the assessment"
    )
