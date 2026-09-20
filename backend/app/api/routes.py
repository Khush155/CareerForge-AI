"""FastAPI route definitions for CareerForge AI.

Endpoints:
- POST /api/profile        : Ingest student profile and trigger agent 7-step loop
- GET  /api/profile/{id}   : Retrieve saved student profile
- GET  /api/roadmap/{id}   : Retrieve current student roadmap
- POST /api/assessment     : Submit assessment score and dynamically adapt roadmap
- GET  /api/assessment/{id}: Retrieve past assessment history for student
- GET  /api/market/{role}  : Research market requirements with source citations
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agent.orchestrator import CareerForgeAgent
from app.db.storage import get_db
from app.models.assessment import AssessmentInput, AssessmentResult
from app.models.market import MarketRequirement
from app.models.profile import StudentProfile
from app.models.roadmap import Roadmap
from app.tools.market_search import web_search_market


class MilestoneUpdateInput(BaseModel):
    milestone_key: str
    completed: bool = True

router = APIRouter(prefix="/api", tags=["CareerForge Agent"])


def _get_agent() -> CareerForgeAgent:
    """Dependency helper to obtain the agent orchestrator."""
    return CareerForgeAgent(db=get_db())


@router.post("/profile", summary="Submit profile and generate multi-phase adaptive roadmap")
def create_or_update_profile(profile: StudentProfile):
    """Executes the full agent planning loop for a student profile."""
    agent = _get_agent()
    market_reqs, gaps, roadmap = agent.generate_initial_roadmap(profile)

    return {
        "profile": profile,
        "market_requirements": market_reqs,
        "gaps": gaps,
        "roadmap": roadmap
    }


@router.get("/profile/{profile_id}", response_model=StudentProfile, summary="Get student profile by ID")
def get_student_profile(profile_id: str):
    """Retrieve saved profile for a student."""
    db = get_db()
    profile = db.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Student profile '{profile_id}' not found.")
    return profile


@router.get("/roadmap/{profile_id}", response_model=Roadmap, summary="Get active roadmap for student")
def get_student_roadmap(profile_id: str):
    """Retrieve active roadmap with current revision version."""
    db = get_db()
    roadmap = db.get_roadmap(profile_id)
    if not roadmap:
        raise HTTPException(status_code=404, detail=f"Roadmap for profile '{profile_id}' not found.")
    return roadmap


@router.get("/roadmap/{profile_id}/milestones", summary="Get completed milestones map")
def get_roadmap_milestones(profile_id: str):
    """Retrieve the dictionary of completed milestone keys for a student's roadmap."""
    db = get_db()
    return db.get_completed_milestones(profile_id)


@router.patch("/roadmap/{profile_id}/milestones", summary="Toggle or set milestone completion")
def update_roadmap_milestone(profile_id: str, input_data: MilestoneUpdateInput):
    """Persist completed status for a roadmap milestone."""
    db = get_db()
    return db.set_milestone_completion(
        profile_id=profile_id,
        milestone_key=input_data.milestone_key,
        completed=input_data.completed
    )


@router.post("/assessment", summary="Submit assessment score and dynamically adapt roadmap")
def record_assessment(assessment_input: AssessmentInput):
    """The Hero Feature: Recalculates gaps, deprioritizes learned skills, and adapts remaining roadmap phases."""
    agent = _get_agent()
    try:
        result, new_gaps, adapted_roadmap, summary = agent.adapt_roadmap_on_assessment(assessment_input)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    db = get_db()
    updated_profile = db.get_profile(assessment_input.profile_id)

    return {
        "result": result,
        "updated_profile": updated_profile,
        "gaps": new_gaps,
        "roadmap": adapted_roadmap,
        "summary": summary
    }


@router.get("/assessment/{profile_id}", response_model=list[AssessmentResult], summary="Get assessment history")
def get_assessment_history(profile_id: str):
    """Retrieve chronologically ordered assessment log for a student."""
    db = get_db()
    return db.get_assessments(profile_id)


@router.get("/market/{role}", response_model=list[MarketRequirement], summary="Research market requirements")
def get_market_requirements(role: str):
    """Research industry requirements with authentic citation URLs (disk cached)."""
    return web_search_market(role)


@router.get("/roles", summary="Get all available career roles grouped by category")
def get_all_roles():
    """Returns all 27+ career roles organized by category for the discovery hub."""
    from app.tools.role_resolver import get_role_resolver
    resolver = get_role_resolver()
    return resolver.get_all_roles_grouped()


@router.get("/roles/suggest", summary="Autocomplete suggestions for role search")
def suggest_roles(q: str = ""):
    """Fast autocomplete suggestions matching title or aliases."""
    from app.tools.role_resolver import get_role_resolver
    resolver = get_role_resolver()
    return resolver.suggest_roles(query=q, limit=8)


@router.post("/role/resolve", summary="Resolve a dream job query to a structured benchmark")
def resolve_role(request: dict):
    """Intelligently maps user dream job input (including typos/abbreviations) to a benchmark."""
    from app.tools.role_resolver import get_role_resolver
    resolver = get_role_resolver()
    query = request.get("query", "").strip()
    return resolver.resolve_role(query)
