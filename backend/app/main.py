"""CareerForge AI - FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router as api_router
from app.db.storage import get_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database is initialized on startup."""
    get_db()
    yield


app = FastAPI(
    title="CareerForge AI API",
    description="Adaptive Agentic Career & Placement Preparation System",
    version="0.1.0",
    lifespan=lifespan
)

# Enable CORS for local development and future frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount core API router
app.include_router(api_router)


@app.get("/health", tags=["System"])
def health_check():
    """System health and status check."""
    return {
        "status": "healthy",
        "service": "CareerForge AI",
        "version": "0.1.0",
        "database": "connected"
    }


# Mount static frontend directory (serves dist if built, otherwise frontend)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
frontend_dir = Path(__file__).resolve().parent.parent.parent / "frontend"
target_dir = frontend_dist if frontend_dist.exists() else frontend_dir
if target_dir.exists():
    app.mount("/", StaticFiles(directory=str(target_dir), html=True), name="frontend")
