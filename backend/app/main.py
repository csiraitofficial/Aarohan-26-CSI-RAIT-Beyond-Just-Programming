"""
Swasthya Saathi - AI-Powered Multilingual Health Platform
Main application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.security import setup_security
from app.db.database import engine, Base
from app.api import auth, symptom_collection, triage, health, symptom_agent, video


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title=settings.APP_NAME,
        description=(
            "Swasthya Saathi AI Agent Backend - "
            "A multilingual health platform powered by Agentic AI "
            "that collects symptoms & vitals, gives basic guidance, "
            "and triages cases into mild, moderate, or emergency."
        ),
        version=settings.APP_VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS middleware for Expo Go app
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Will be restricted in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Security headers middleware
    setup_security(app)

    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Include API routers
    app.include_router(health.router, tags=["Health"])
    app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(
        symptom_collection.router,
        prefix="/api/consultation",
        tags=["Symptom Collection"],
    )
    app.include_router(triage.router, prefix="/api/consultation", tags=["Triage"])
    app.include_router(
        symptom_agent.router,
        prefix="/api/symptom-agent",
        tags=["AI Symptom Agent"],
    )
    app.include_router(
        video.router,
        prefix="/api/video",
        tags=["Video Call"],
    )

    return app


app = create_app()
