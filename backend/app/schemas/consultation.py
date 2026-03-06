"""
Pydantic schemas for consultation sessions and triage results.
"""

from typing import Optional, List
from pydantic import BaseModel, Field

from app.schemas.symptom import SymptomResponse, VitalsResponse


class ConsultationCreate(BaseModel):
    """Schema for starting a new consultation."""
    language: Optional[str] = Field("en", examples=["en", "hi", "bn"])


class ConsultationResponse(BaseModel):
    """Schema for consultation session in API responses."""
    id: str
    user_id: str
    status: str
    triage_level: str
    language_used: str
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class TriageResult(BaseModel):
    """Schema for triage result response."""
    session_id: str
    triage_level: str
    urgency_score: Optional[int] = None
    primary_concern: Optional[str] = None
    detailed_assessment: Optional[str] = None
    recommendations: Optional[List[str]] = None
    warning_signs: Optional[List[str]] = None
    home_remedies: Optional[List[str]] = None
    follow_up_needed: bool = False
    follow_up_timeframe: Optional[str] = None
    language: str = "en"


class ConsultationDetail(BaseModel):
    """Full consultation detail with symptoms, vitals, and triage."""
    id: str
    user_id: str
    status: str
    triage_level: str
    primary_concern: Optional[str] = None
    ai_assessment: Optional[str] = None
    recommendations: Optional[List[str]] = None
    urgency_score: Optional[int] = None
    follow_up_needed: bool = False
    follow_up_date: Optional[str] = None
    language_used: str
    symptoms: List[SymptomResponse] = []
    vitals: List[VitalsResponse] = []
    created_at: Optional[str] = None

    model_config = {"from_attributes": True}


class ConsultationHistory(BaseModel):
    """Schema for consultation history list."""
    total: int
    consultations: List[ConsultationDetail]
