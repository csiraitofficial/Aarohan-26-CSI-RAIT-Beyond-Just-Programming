"""
Database models for Swasthya Saathi.
Defines all entities for patient management, consultations,
symptom tracking, vitals recording, and triage results.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
)
from sqlalchemy.orm import relationship
import enum

from app.db.database import Base


# ─── Enums ────────────────────────────────────────────────

class TriageLevel(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    EMERGENCY = "emergency"
    PENDING = "pending"


class ConsultationStatus(str, enum.Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    CHW = "chw"  # Community Health Worker
    ADMIN = "admin"


# ─── Helper ───────────────────────────────────────────────

def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ─── Models ───────────────────────────────────────────────

class User(Base):
    """Patient / Doctor / CHW / Admin user model."""

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.PATIENT, nullable=False)
    language_preference = Column(String(10), default="en")  # en, hi, bn, ta, etc.
    date_of_birth = Column(String(10), nullable=True)  # YYYY-MM-DD
    gender = Column(String(10), nullable=True)
    address = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    health_records = relationship("HealthRecord", back_populates="user", cascade="all, delete-orphan")
    consultations = relationship("ConsultationSession", back_populates="user", cascade="all, delete-orphan")


class HealthRecord(Base):
    """Persistent medical history for a patient."""

    __tablename__ = "health_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    blood_group = Column(String(5), nullable=True)
    known_allergies = Column(Text, nullable=True)  # JSON string list
    chronic_conditions = Column(Text, nullable=True)  # JSON string list
    current_medications = Column(Text, nullable=True)  # JSON string list
    past_surgeries = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    user = relationship("User", back_populates="health_records")


class ConsultationSession(Base):
    """A single consultation / triage session."""

    __tablename__ = "consultation_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(
        SAEnum(ConsultationStatus),
        default=ConsultationStatus.IN_PROGRESS,
        nullable=False,
    )
    triage_level = Column(SAEnum(TriageLevel), default=TriageLevel.PENDING, nullable=False)
    ai_assessment = Column(Text, nullable=True)  # Full AI response
    primary_concern = Column(String(500), nullable=True)
    recommendations = Column(Text, nullable=True)
    urgency_score = Column(Integer, nullable=True)  # 1-10
    follow_up_needed = Column(Boolean, default=False)
    follow_up_date = Column(String(10), nullable=True)
    language_used = Column(String(10), default="en")
    # Conversation agent state
    conversation_state = Column(String(30), default="not_started")  # not_started, collecting, clarifying, complete
    conversation_context = Column(Text, nullable=True)  # JSON: accumulated context for AI
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    user = relationship("User", back_populates="consultations")
    symptoms = relationship("SymptomLog", back_populates="consultation", cascade="all, delete-orphan")
    vitals = relationship("VitalsReading", back_populates="consultation", cascade="all, delete-orphan")
    conversation_turns = relationship("ConversationTurn", back_populates="consultation", cascade="all, delete-orphan")


class SymptomLog(Base):
    """Individual symptom reported during a consultation."""

    __tablename__ = "symptom_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    consultation_id = Column(String, ForeignKey("consultation_sessions.id"), nullable=False)
    body_part = Column(String(100), nullable=True)  # e.g., "head", "chest", "abdomen"
    description = Column(Text, nullable=False)  # Free-text symptom description
    duration = Column(String(100), nullable=True)  # e.g., "3 days", "1 week"
    severity = Column(Integer, nullable=True)  # 1-10 scale

    # ─── Enhanced symptom parameters (Phase 1) ────────────
    symptom_category = Column(String(50), nullable=True)  # respiratory, cardiac, gi, neurological, etc.
    quality = Column(String(100), nullable=True)  # sharp, dull, throbbing, burning, cramping
    onset_type = Column(String(50), nullable=True)  # sudden, gradual
    timing_pattern = Column(String(100), nullable=True)  # constant, intermittent, periodic, morning, night
    aggravating_factors = Column(Text, nullable=True)  # JSON list: movement, eating, coughing, etc.
    relieving_factors = Column(Text, nullable=True)  # JSON list: rest, medication, position change, etc.
    radiation = Column(String(200), nullable=True)  # e.g., "left arm", "jaw", "back"
    associated_symptoms = Column(Text, nullable=True)  # JSON list: nausea, sweating, etc.
    previous_occurrences = Column(String(200), nullable=True)  # first time, recurrent, chronic
    functional_impact = Column(String(200), nullable=True)  # can't work, can't sleep, etc.
    triggers = Column(Text, nullable=True)  # JSON list: stress, food, exertion, etc.

    created_at = Column(DateTime, default=utcnow)

    # Relationships
    consultation = relationship("ConsultationSession", back_populates="symptoms")


class VitalsReading(Base):
    """Vital signs recorded during a consultation."""

    __tablename__ = "vitals_readings"

    id = Column(String, primary_key=True, default=generate_uuid)
    consultation_id = Column(String, ForeignKey("consultation_sessions.id"), nullable=False)
    temperature_f = Column(Float, nullable=True)  # Fahrenheit
    blood_pressure_systolic = Column(Integer, nullable=True)  # mmHg
    blood_pressure_diastolic = Column(Integer, nullable=True)  # mmHg
    heart_rate = Column(Integer, nullable=True)  # bpm
    oxygen_saturation = Column(Float, nullable=True)  # SpO2 percentage
    respiratory_rate = Column(Integer, nullable=True)  # breaths per minute
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    consultation = relationship("ConsultationSession", back_populates="vitals")


class ConversationTurn(Base):
    """Tracks each turn in a multi-turn AI symptom interview."""

    __tablename__ = "conversation_turns"

    id = Column(String, primary_key=True, default=generate_uuid)
    consultation_id = Column(String, ForeignKey("consultation_sessions.id"), nullable=False)
    turn_number = Column(Integer, nullable=False)
    agent_question = Column(Text, nullable=False)  # What the AI asked
    patient_response = Column(Text, nullable=True)  # What the patient answered
    question_type = Column(String(50), nullable=True)  # greeting, symptom_id, quality, onset, etc.
    symptom_category = Column(String(50), nullable=True)  # Which symptom this question relates to
    extracted_data = Column(Text, nullable=True)  # JSON: structured data extracted from response
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    consultation = relationship("ConsultationSession", back_populates="conversation_turns")
