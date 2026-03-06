"""
Pydantic schemas for symptom collection and vitals recording.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class SymptomInput(BaseModel):
    """Schema for adding a symptom to a consultation session."""
    description: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        examples=["I have a severe headache and dizziness for the past 3 days"],
    )
    body_part: Optional[str] = Field(
        None,
        max_length=100,
        examples=["head"],
    )
    duration: Optional[str] = Field(
        None,
        max_length=100,
        examples=["3 days"],
    )
    severity: Optional[int] = Field(
        None,
        ge=1,
        le=10,
        examples=[7],
    )


class SymptomResponse(BaseModel):
    """Schema for symptom in API responses."""
    id: str
    description: str
    body_part: Optional[str] = None
    duration: Optional[str] = None
    severity: Optional[int] = None
    symptom_category: Optional[str] = None
    quality: Optional[str] = None
    onset_type: Optional[str] = None
    timing_pattern: Optional[str] = None
    aggravating_factors: Optional[str] = None
    relieving_factors: Optional[str] = None
    radiation: Optional[str] = None
    associated_symptoms: Optional[str] = None
    previous_occurrences: Optional[str] = None
    functional_impact: Optional[str] = None
    triggers: Optional[str] = None

    model_config = {"from_attributes": True}


class VitalsInput(BaseModel):
    """Schema for recording vital signs."""
    temperature_f: Optional[float] = Field(
        None,
        ge=90.0,
        le=115.0,
        examples=[101.3],
        description="Body temperature in Fahrenheit",
    )
    blood_pressure_systolic: Optional[int] = Field(
        None,
        ge=50,
        le=300,
        examples=[130],
        description="Systolic blood pressure in mmHg",
    )
    blood_pressure_diastolic: Optional[int] = Field(
        None,
        ge=30,
        le=200,
        examples=[85],
        description="Diastolic blood pressure in mmHg",
    )
    heart_rate: Optional[int] = Field(
        None,
        ge=20,
        le=250,
        examples=[88],
        description="Heart rate in beats per minute",
    )
    oxygen_saturation: Optional[float] = Field(
        None,
        ge=50.0,
        le=100.0,
        examples=[97.5],
        description="SpO2 percentage",
    )
    respiratory_rate: Optional[int] = Field(
        None,
        ge=5,
        le=60,
        examples=[18],
        description="Respiratory rate in breaths per minute",
    )


class VitalsResponse(BaseModel):
    """Schema for vitals in API responses."""
    id: str
    temperature_f: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    oxygen_saturation: Optional[float] = None
    respiratory_rate: Optional[int] = None

    model_config = {"from_attributes": True}


class SymptomsListInput(BaseModel):
    """Schema for adding multiple symptoms at once."""
    symptoms: List[SymptomInput] = Field(..., min_length=1, max_length=20)
