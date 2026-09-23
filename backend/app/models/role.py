"""CareerForge AI - Role Definition and Resolution Models."""
from pydantic import BaseModel, ConfigDict, Field


class RoleSkillBenchmark(BaseModel):
    """Specific skill requirement within a career role benchmark."""
    model_config = ConfigDict(populate_by_name=True)

    name: str
    required_level: float = Field(ge=0.0, le=5.0, default=3.5)
    demand_level: str = "critical"  # "critical" | "high-priority" | "frequently mentioned" | "moderate"
    weight: float = 1.0
    est_hours: int = Field(default=25, alias="est_hours_to_learn")
    prerequisites: list[str] = Field(default_factory=list)
    source_url: str = "https://roadmap.sh"
    source_type: str = "curated"  # "curated" | "ai_estimated" | "estimated"
    category: str = "core"


class RoleDefinition(BaseModel):
    """Full role profile with skills, industry targets, and aliases."""
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    category: str
    tagline: str = ""
    description: str = ""
    aliases: list[str] = Field(default_factory=list)
    typical_companies_types: list[str] = Field(default_factory=lambda: ["Product Tech", "FinTech", "High-Growth Scaleup"])
    demand_level: str = "critical"
    avg_time_to_ready_weeks: int = 8
    tier_label: str = "Target Organization Tier"
    target_tiers: list[str] = Field(default_factory=list)
    degree_label: str = "Degree / Qualification"
    branch_label: str = "Branch / Specialization"
    suggested_degrees: list[str] = Field(default_factory=list)
    suggested_branches: list[str] = Field(default_factory=list)
    skills: list[RoleSkillBenchmark] = Field(default_factory=list)


class RoleResolveRequest(BaseModel):
    """Incoming user search or role string to resolve."""
    query: str


class RoleResolveResponse(BaseModel):
    """Standardized response from the Dream Job Resolver Engine."""
    matched_role: str
    role_id: str
    confidence: float
    tagline: str
    category: str
    alternatives: list[str] = Field(default_factory=list)
    benchmark: list[RoleSkillBenchmark]
    source_type: str  # "curated" | "ai_estimated" | "estimated"
    message: str = ""
    tier_label: str = "Target Organization Tier"
    target_tiers: list[str] = Field(default_factory=list)
    degree_label: str = "Degree / Program"
    branch_label: str = "Specialization / Stream"
    suggested_degrees: list[str] = Field(default_factory=list)
    suggested_branches: list[str] = Field(default_factory=list)

