"""
Symptom Collection API endpoints.
Handles consultation creation, symptom addition, and vitals recording.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import (
    User,
    ConsultationSession,
    SymptomLog,
    VitalsReading,
    ConsultationStatus,
)
from app.schemas.symptom import (
    SymptomInput,
    SymptomResponse,
    VitalsInput,
    VitalsResponse,
    SymptomsListInput,
)
from app.schemas.consultation import ConsultationCreate, ConsultationResponse
from app.core.auth import get_current_user
from app.core.security import sanitize_input

router = APIRouter()


@router.post("/start", response_model=ConsultationResponse, status_code=status.HTTP_201_CREATED)
def start_consultation(
    data: ConsultationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start a new consultation session.
    Creates a new session that symptoms and vitals can be added to.
    """
    session = ConsultationSession(
        user_id=current_user.id,
        language_used=data.language or "en",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return ConsultationResponse(
        id=session.id,
        user_id=session.user_id,
        status=session.status.value,
        triage_level=session.triage_level.value,
        language_used=session.language_used,
        created_at=str(session.created_at) if session.created_at else None,
    )


@router.post(
    "/{session_id}/symptoms",
    response_model=SymptomResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_symptom(
    session_id: str,
    symptom: SymptomInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add a single symptom to a consultation session.
    Can be called multiple times to add symptoms iteratively.
    """
    # Verify session exists and belongs to the user
    session = _get_user_session(session_id, current_user.id, db)

    symptom_log = SymptomLog(
        consultation_id=session.id,
        body_part=symptom.body_part,
        description=sanitize_input(symptom.description),
        duration=symptom.duration,
        severity=symptom.severity,
    )
    db.add(symptom_log)
    db.commit()
    db.refresh(symptom_log)

    return SymptomResponse.model_validate(symptom_log)


@router.post(
    "/{session_id}/symptoms/batch",
    response_model=list[SymptomResponse],
    status_code=status.HTTP_201_CREATED,
)
def add_symptoms_batch(
    session_id: str,
    data: SymptomsListInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add multiple symptoms to a consultation session at once.
    """
    session = _get_user_session(session_id, current_user.id, db)

    created_symptoms = []
    for symptom in data.symptoms:
        symptom_log = SymptomLog(
            consultation_id=session.id,
            body_part=symptom.body_part,
            description=sanitize_input(symptom.description),
            duration=symptom.duration,
            severity=symptom.severity,
        )
        db.add(symptom_log)
        created_symptoms.append(symptom_log)

    db.commit()
    for s in created_symptoms:
        db.refresh(s)

    return [SymptomResponse.model_validate(s) for s in created_symptoms]


@router.post(
    "/{session_id}/vitals",
    response_model=VitalsResponse,
    status_code=status.HTTP_201_CREATED,
)
def record_vitals(
    session_id: str,
    vitals: VitalsInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Record vital signs for a consultation session.
    """
    session = _get_user_session(session_id, current_user.id, db)

    vitals_reading = VitalsReading(
        consultation_id=session.id,
        temperature_f=vitals.temperature_f,
        blood_pressure_systolic=vitals.blood_pressure_systolic,
        blood_pressure_diastolic=vitals.blood_pressure_diastolic,
        heart_rate=vitals.heart_rate,
        oxygen_saturation=vitals.oxygen_saturation,
        respiratory_rate=vitals.respiratory_rate,
    )
    db.add(vitals_reading)
    db.commit()
    db.refresh(vitals_reading)

    return VitalsResponse.model_validate(vitals_reading)


@router.get("/{session_id}/symptoms", response_model=list[SymptomResponse])
def get_symptoms(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all symptoms for a consultation session."""
    session = _get_user_session(session_id, current_user.id, db)
    return [SymptomResponse.model_validate(s) for s in session.symptoms]


@router.get("/{session_id}/vitals", response_model=list[VitalsResponse])
def get_vitals(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all vitals for a consultation session."""
    session = _get_user_session(session_id, current_user.id, db)
    return [VitalsResponse.model_validate(v) for v in session.vitals]


def _get_user_session(
    session_id: str, user_id: str, db: Session
) -> ConsultationSession:
    """Helper to get and validate a consultation session belongs to the user."""
    session = (
        db.query(ConsultationSession)
        .filter(
            ConsultationSession.id == session_id,
            ConsultationSession.user_id == user_id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation session not found",
        )

    if session.status == ConsultationStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This consultation session has already been completed",
        )

    if session.status == ConsultationStatus.CANCELLED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This consultation session has been cancelled",
        )

    return session
