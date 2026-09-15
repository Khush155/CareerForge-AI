"""CareerForge AI - FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/health", tags=["System"])
def health_check():
    """System health and status check."""
    return {
        "status": "healthy",
        "service": "CareerForge AI",
        "version": "0.1.0",
        "database": "connected"
    }
