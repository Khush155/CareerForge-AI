"""Market requirement data model for live research outputs."""

from pydantic import BaseModel, Field


class MarketRequirement(BaseModel):
    """Represents an industry market requirement for a target role."""
    skill: str = Field(..., description="Canonical name of the required skill")
    required_level: float = Field(
        ...,
        ge=1.0,
        le=5.0,
        description="Benchmark required proficiency level (1.0 to 5.0) in the current job market"
    )
    demand_level: str = Field(
        ...,
        description="Qualitative demand level: 'critical', 'high-priority', 'frequently mentioned', 'emerging', or 'moderate'"
    )
    source_url: str = Field(
        ...,
        description="Mandatory verifiable citation URL where this requirement was identified"
    )
    notes: str | None = Field(
        None,
        description="Contextual notes on how this skill is applied in the target role"
    )
