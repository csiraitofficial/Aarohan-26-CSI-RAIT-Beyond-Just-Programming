"""
Pydantic schemas for the conversational AI symptom agent.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class ConversationStartRequest(BaseModel):
    """Request to start a new AI symptom interview."""
    initial_message: str = Field(
        ...,
        min_length=2,
        max_length=2000,
        examples=["I have a bad headache and feel dizzy"],
        description="Patient's initial symptom description in natural language",
    )
    language: Optional[str] = Field("en", examples=["en", "hi", "bn"])


class ConversationRespondRequest(BaseModel):
    """Patient's response to an AI question."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        examples=["It's a throbbing pain on the left side"],
    )


class ConversationTurnResponse(BaseModel):
    """A single conversation turn in the response."""
    turn_number: int
    agent_question: str
    patient_response: Optional[str] = None
    question_type: Optional[str] = None


class ConversationAgentResponse(BaseModel):
    """Response from the AI symptom agent after processing patient input."""
    session_id: str
    agent_message: str = Field(
        ..., description="The AI agent's next question or message"
    )
    conversation_state: str = Field(
        ..., description="Current state: collecting, clarifying, vitals, complete"
    )
    turn_number: int
    question_type: Optional[str] = None
    options: Optional[List[str]] = Field(
        None,
        description="Medically-contextual answer options derived from the question. "
                    "Frontend should render these as tappable chips.",
    )
    symptoms_identified: Optional[List[str]] = None
    is_emergency: bool = False
    emergency_message: Optional[str] = None
    progress_pct: Optional[int] = Field(
        None, ge=0, le=100, description="Rough progress percentage of the interview"
    )


class ConversationHistoryResponse(BaseModel):
    """Full conversation history for a session."""
    session_id: str
    conversation_state: str
    turns: List[ConversationTurnResponse] = []
    symptoms_collected: int = 0
    vitals_collected: bool = False


class ConversationCompleteResponse(BaseModel):
    """Response when symptom collection is complete and triage is triggered."""
    session_id: str
    message: str
    triage_level: str
    urgency_score: Optional[int] = None
    primary_concern: Optional[str] = None
    recommendations: Optional[List[str]] = None
    warning_signs: Optional[List[str]] = None
    home_remedies: Optional[List[str]] = None
    follow_up_needed: bool = False
    follow_up_timeframe: Optional[str] = None
