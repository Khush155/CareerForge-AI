"""Student profile and skill schemas."""

from pydantic import BaseModel, Field, field_validator


class Skill(BaseModel):
    """Represents a specific skill and student proficiency level."""
    name: str = Field(..., description="Canonical name of the skill, e.g. 'Python', 'SQL', 'Docker'")
    proficiency: float = Field(
        ...,
        ge=0.0,
        le=5.0,
        description="Proficiency level from 0.0 (beginner/none) to 5.0 (expert)"
    )

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        return v.strip()


class StudentProfile(BaseModel):
    """Represents the complete student background and career goals."""
    id: str | None = Field(None, description="Unique identifier for the student or session")
    name: str | None = Field("Student", description="Student's display name")
    degree: str = Field(..., description="Degree enrolled in, e.g. 'B.Tech', 'B.S.', 'MCA'")
    branch: str = Field(..., description="Field/Branch of study, e.g. 'Computer Science', 'IT'")
    year: int = Field(..., ge=1, le=5, description="Current academic year (1-5)")
    target_role: str = Field(..., description="Target job role, e.g. 'Backend Engineer', 'Data Analyst'")
    skills: list[Skill] = Field(default_factory=list, description="List of current skills with proficiency levels")
    available_hours_per_week: int = Field(
        ...,
        ge=1,
        le=80,
        description="Dedicated hours available for preparation per week"
    )
    current_prep_level: str = Field(
        "beginner",
        description="Self-assessed preparation baseline: 'beginner', 'intermediate', or 'advanced'"
    )
    avatar: str | None = Field("cyber-neon", description="Cartoon avatar identifier or seed")
