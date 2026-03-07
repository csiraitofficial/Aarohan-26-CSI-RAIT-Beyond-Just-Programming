"""
Pydantic schemas for User registration, login, and responses.
"""

from typing import Optional
from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    """Schema for new user registration (role-based)."""
    full_name: str = Field(..., min_length=2, max_length=255, examples=["Rajesh Kumar"])
    phone: str = Field(..., min_length=10, max_length=20, examples=["+919876543210"])
    email: Optional[str] = Field(None, examples=["rajesh@example.com"])
    password: str = Field(..., min_length=6, max_length=128, examples=["securepassword123"])
    role: Optional[str] = Field("PATIENT", examples=["PATIENT", "DOCTOR", "CHW"])
    date_of_birth: Optional[str] = Field(None, examples=["1990-05-15"])
    gender: Optional[str] = Field(None, examples=["male"])
    language_preference: Optional[str] = Field("en", examples=["hi"])
    address: Optional[str] = Field(None, examples=["Village Rampur, District Varanasi, UP"])
    latitude: Optional[float] = Field(None, examples=[25.3176])
    longitude: Optional[float] = Field(None, examples=[82.9739])

    # Doctor-specific fields
    license_number: Optional[str] = Field(None, max_length=100, examples=["MH12345"])
    specialization: Optional[str] = Field(None, max_length=255, examples=["Cardiology"])
    hospital_name: Optional[str] = Field(None, max_length=255, examples=["City Hospital"])
    years_of_experience: Optional[int] = Field(None, ge=0, examples=[5])

    # CHW-specific fields
    worker_id: Optional[str] = Field(None, max_length=100, examples=["CHW-001"])
    assigned_district: Optional[str] = Field(None, max_length=255, examples=["Varanasi"])


class UserLogin(BaseModel):
    """Schema for user login (phone + password only)."""
    phone: str = Field(..., examples=["+919876543210"])
    password: str = Field(..., examples=["securepassword123"])


class DoctorProfileResponse(BaseModel):
    """Nested doctor profile in user response."""
    license_number: str
    specialization: Optional[str] = None
    hospital_name: Optional[str] = None
    years_of_experience: Optional[int] = None

    model_config = {"from_attributes": True}


class CHWProfileResponse(BaseModel):
    """Nested CHW profile in user response."""
    worker_id: str
    assigned_district: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    """Schema for user data in API responses."""
    id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    role: str
    language_preference: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    doctor_profile: Optional[DoctorProfileResponse] = None
    chw_profile: Optional[CHWProfileResponse] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """Schema for JWT token response after login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    email: Optional[str] = None
    language_preference: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
