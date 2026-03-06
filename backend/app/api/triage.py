"""
Triage API endpoints.
Handles triggering AI triage, retrieving results, and consultation history.
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import (
    User,
    ConsultationSession,
    ConsultationStatus,
    TriageLevel,
)
from app.schemas.consultation import (
    TriageResult,
    ConsultationDetail,
    ConsultationHistory,
)
from app.schemas.symptom import SymptomResponse, VitalsResponse
from app.core.auth import get_current_user
from app.services.triage_service import perform_triage
from app.services.gemini_service import translate_medical_content

router = APIRouter()


@router.post("/{session_id}/triage", response_model=TriageResult)
def trigger_triage(
    session_id: str,
    lang: Optional[str] = Query(None, description="Language code for response (en, hi, bn, ta, etc.)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trigger AI triage for a consultation session.
    Analyzes all collected symptoms and vitals, returns severity assessment.
    """
    session = (
        db.query(ConsultationSession)
        .filter(
            ConsultationSession.id == session_id,
            ConsultationSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation session not found",
        )

    if session.status == ConsultationStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot triage a cancelled session",
        )

    # If already triaged, return the existing result
    if session.status == ConsultationStatus.COMPLETED and session.triage_level != TriageLevel.PENDING:
        result = _build_triage_result(session)
        # Translate if requested
        if lang and lang != "en":
            result = _translate_result(result, lang)
        return result

    # Perform triage
    triage_result = perform_triage(session, db)

    # Translate if requested
    target_lang = lang or session.language_used
    if target_lang and target_lang != "en":
        triage_result = _translate_result(triage_result, target_lang)
        triage_result["language"] = target_lang

    return TriageResult(**triage_result)


@router.get("/{session_id}/result", response_model=TriageResult)
def get_triage_result(
    session_id: str,
    lang: Optional[str] = Query(None, description="Language code for response"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the triage result for a completed consultation session.
    """
    session = (
        db.query(ConsultationSession)
        .filter(
            ConsultationSession.id == session_id,
            ConsultationSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation session not found",
        )

    if session.triage_level == TriageLevel.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Triage has not been performed yet. Call POST /triage first.",
        )

    result = _build_triage_result(session)

    target_lang = lang or session.language_used
    if target_lang and target_lang != "en":
        result = _translate_result(result, target_lang)

    return TriageResult(**result)


@router.get("/{session_id}/detail", response_model=ConsultationDetail)
def get_consultation_detail(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get full consultation details including symptoms, vitals, and triage.
    """
    session = (
        db.query(ConsultationSession)
        .filter(
            ConsultationSession.id == session_id,
            ConsultationSession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation session not found",
        )

    return _build_consultation_detail(session)


@router.get("/history", response_model=ConsultationHistory)
def get_consultation_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the user's consultation history (paginated).
    """
    query = (
        db.query(ConsultationSession)
        .filter(ConsultationSession.user_id == current_user.id)
        .order_by(ConsultationSession.created_at.desc())
    )

    total = query.count()
    consultations = query.offset(skip).limit(limit).all()

    details = [_build_consultation_detail(c) for c in consultations]

    return ConsultationHistory(total=total, consultations=details)


# ─── Helpers ──────────────────────────────────────────────


def _build_triage_result(session: ConsultationSession) -> dict:
    """Build a TriageResult dict from a consultation session."""
    recommendations = []
    if session.recommendations:
        try:
            recommendations = json.loads(session.recommendations)
        except (json.JSONDecodeError, TypeError):
            recommendations = [session.recommendations]

    assessment = ""
    if session.ai_assessment:
        try:
            assessment = json.loads(session.ai_assessment)
        except (json.JSONDecodeError, TypeError):
            assessment = session.ai_assessment

    return {
        "session_id": session.id,
        "triage_level": session.triage_level.value,
        "urgency_score": session.urgency_score,
        "primary_concern": session.primary_concern,
        "detailed_assessment": assessment if isinstance(assessment, str) else json.dumps(assessment),
        "recommendations": recommendations,
        "warning_signs": [],
        "home_remedies": [],
        "follow_up_needed": session.follow_up_needed,
        "follow_up_timeframe": session.follow_up_date,
        "language": session.language_used,
    }


def _build_consultation_detail(session: ConsultationSession) -> ConsultationDetail:
    """Build a ConsultationDetail from a session ORM object."""
    return ConsultationDetail(
        id=session.id,
        user_id=session.user_id,
        status=session.status.value,
        triage_level=session.triage_level.value,
        primary_concern=session.primary_concern,
        ai_assessment=session.ai_assessment,
        recommendations=json.loads(session.recommendations) if session.recommendations else None,
        urgency_score=session.urgency_score,
        follow_up_needed=session.follow_up_needed,
        follow_up_date=session.follow_up_date,
        language_used=session.language_used,
        symptoms=[SymptomResponse.model_validate(s) for s in session.symptoms],
        vitals=[VitalsResponse.model_validate(v) for v in session.vitals],
        created_at=str(session.created_at) if session.created_at else None,
    )


def _translate_result(result: dict, target_lang: str) -> dict:
    """Translate triage result fields to target language."""
    try:
        translatable = {
            "primary_concern": result.get("primary_concern", ""),
            "detailed_assessment": result.get("detailed_assessment", ""),
            "recommendations": result.get("recommendations", []),
            "warning_signs": result.get("warning_signs", []),
            "home_remedies": result.get("home_remedies", []),
        }

        translated_text = translate_medical_content(
            json.dumps(translatable, ensure_ascii=False),
            target_lang,
        )

        translated_data = json.loads(translated_text)
        result.update(translated_data)
        result["language"] = target_lang
    except Exception:
        pass  # Return original if translation fails

    return result
