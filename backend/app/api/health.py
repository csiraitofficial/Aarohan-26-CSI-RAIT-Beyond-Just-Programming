"""
Health check and status API endpoints.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.database import get_db
from app.core.config import settings
from app.services import supabase_service

router = APIRouter()


@router.get("/")
def root():
    """Redirect root path to API documentation."""
    return RedirectResponse(url="/docs")


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint.
    Returns database connectivity status and uptime info.
    """
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": db_status,
        "supabase": "configured" if supabase_service.is_configured() else "not_configured",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/api/status")
def api_status():
    """
    API status endpoint.
    Returns version info and service availability.
    """
    gemini_status = "configured" if settings.GEMINI_API_KEY != "your_gemini_api_key_here" else "not_configured"

    return {
        "api": "SwasthyaSaathi AI Agent",
        "version": settings.APP_VERSION,
        "ai_service": "Google Gemini",
        "ai_status": gemini_status,
        "features": [
            "symptom_collection",
            "ai_triage",
            "multi_language_support",
            "health_records",
            "consultation_history",
        ],
        "supported_languages": ["en", "hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "ur"],
    }
