"""Roadmap and phase data models."""
from enum import Enum

from pydantic import BaseModel, Field


class PhaseStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class ResourceItem(BaseModel):
    """Reference guide or documentation item for preparation."""
    title: str = Field(..., description="Resource title or topic")
    url_or_ref: str = Field(..., description="Link or KB document reference identifier")
    resource_type: str = Field("guide", description="Type: 'kb_guide', 'documentation', 'practice', 'course'")


class RoadmapPhase(BaseModel):
    """A distinct, ordered stage in the personalized learning journey."""
    phase_number: int = Field(..., ge=1, description="Sequential phase number (1, 2, 3...)")
    title: str = Field(..., description="Concise phase title, e.g. 'Foundations: Python & Data Structures'")
    skills_covered: list[str] = Field(..., description="Skills focused on during this phase")
    estimated_hours: int = Field(..., ge=1, description="Total dedicated hours allocated to this phase")
    learning_objectives: list[str] = Field(default_factory=list, description="Specific milestones to complete")
    resources: list[ResourceItem] = Field(default_factory=list, description="Curated study materials from KB")
    status: PhaseStatus = Field(PhaseStatus.NOT_STARTED, description="Current progress status of the phase")


class Roadmap(BaseModel):
    """The complete multi-phase preparation roadmap."""
    profile_id: str | None = Field(None, description="Associated student profile ID")
    target_role: str = Field(..., description="Target job role")
    total_estimated_hours: int = Field(..., ge=1, description="Cumulative hours across all phases")
    available_hours_per_week: int = Field(..., ge=1, description="Weekly study bandwidth")
    estimated_weeks: int = Field(..., ge=1, description="Projected weeks to job readiness")
    phases: list[RoadmapPhase] = Field(..., description="Ordered list of roadmap phases")
    version: int = Field(1, description="Roadmap revision version (increments upon adaptation)")
