"""
Conversational AI Symptom Agent API endpoints.
Provides multi-turn interactive symptom collection with
intelligent follow-up questions and real-time red flag detection.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import (
    User,
    ConsultationSession,
    ConsultationStatus,
)
from app.schemas.conversation import (
    ConversationStartRequest,
    ConversationRespondRequest,
    ConversationAgentResponse,
    ConversationHistoryResponse,
    ConversationCompleteResponse,
)
from app.schemas.consultation import ConsultationResponse
from app.core.auth import get_current_user
from app.core.security import sanitize_input
from app.services.conversational_agent import (
    start_interview,
    process_response,
    get_conversation_history_data,
    STATE_COMPLETE,
)
from app.services.triage_service import perform_triage

router = APIRouter()


@router.post("/start", response_model=ConversationAgentResponse, status_code=status.HTTP_201_CREATED)
def start_symptom_agent(
    data: ConversationStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Start a new AI-guided symptom interview.
    
    The patient provides an initial description of their symptoms,
    and the AI agent begins a multi-turn interview, asking
    symptom-specific follow-up questions one at a time.
    """
    # Create a new consultation session
    session = ConsultationSession(
        user_id=current_user.id,
        language_used=data.language or "en",
        conversation_state="identifying",
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Sanitize input
    clean_message = sanitize_input(data.initial_message)

    # Start the interview
    result = start_interview(session, clean_message, db)

    return ConversationAgentResponse(**result)


@router.post("/{session_id}/respond", response_model=ConversationAgentResponse)
def respond_to_agent(
    session_id: str,
    data: ConversationRespondRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a patient's response to the AI agent and get the next question.
    
    The agent analyzes the response, extracts structured data,
    checks for red flags, and determines the next appropriate question.
    """
    # Get the consultation session
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

    if session.conversation_state == STATE_COMPLETE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This interview is already complete. Use /complete to get triage results.",
        )

    if session.status == ConsultationStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This consultation is already completed with triage results.",
        )

    # Process the response
    clean_message = sanitize_input(data.message)
    result = process_response(session, clean_message, db)

    return ConversationAgentResponse(**result)


@router.get("/{session_id}/conversation", response_model=ConversationHistoryResponse)
def get_conversation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the full conversation history for a symptom interview session.
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

    return ConversationHistoryResponse(**get_conversation_history_data(session))


@router.post("/{session_id}/complete", response_model=ConversationCompleteResponse)
def complete_interview(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Complete the symptom interview and trigger AI triage.
    
    Analyzes all collected symptom data (including detailed parameters
    gathered during the conversation) and returns a triage assessment
    with severity level, recommendations, and next steps.
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

    if session.status == ConsultationStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This consultation is already completed.",
        )

    if not session.symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No symptoms collected yet. Continue the interview first.",
        )

    # Perform triage using all collected data
    triage_result = perform_triage(session, db)

    return ConversationCompleteResponse(
        session_id=session.id,
        message="Symptom interview complete. Here is your assessment.",
        triage_level=triage_result.get("triage_level", "moderate"),
        urgency_score=triage_result.get("urgency_score"),
        primary_concern=triage_result.get("primary_concern"),
        recommendations=triage_result.get("recommendations"),
        warning_signs=triage_result.get("warning_signs"),
        home_remedies=triage_result.get("home_remedies"),
        follow_up_needed=triage_result.get("follow_up_needed", False),
        follow_up_timeframe=triage_result.get("follow_up_timeframe"),
    )
