"""Authentication API endpoints: register, login, profile — backed by Firestore."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional, Dict, Any

from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services import firebase_auth_service as fb

router = APIRouter()

VALID_ROLES = {"patient", "doctor", "chw", "admin"}


def _resolve_role(raw: Optional[str]) -> str:
    role = (raw or "patient").lower()
    return role if role in VALID_ROLES else "patient"


def _user_to_response(user: Dict[str, Any]) -> UserResponse:
    """Convert a Firestore user dict to a UserResponse, attaching role profiles."""
    uid = user["id"]
    doctor_profile = None
    chw_profile = None
    if user.get("role") == "doctor":
        doctor_profile = fb.get_doctor_profile(uid)
    elif user.get("role") == "chw":
        chw_profile = fb.get_chw_profile(uid)
    return UserResponse(
        id=uid,
        full_name=user["full_name"],
        phone=user["phone"],
        email=user.get("email"),
        role=user.get("role", "patient"),
        language_preference=user.get("language_preference", "en"),
        date_of_birth=user.get("date_of_birth"),
        gender=user.get("gender"),
        address=user.get("address"),
        is_active=user.get("is_active", True),
        doctor_profile=doctor_profile,
        chw_profile=chw_profile,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate):
    """Register a new user — stored in Firestore."""

    user_role = _resolve_role(user_data.role)

    # Validate role-specific required fields
    if user_role == "doctor":
        if not user_data.license_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="License number is required for doctor registration",
            )
    elif user_role == "chw":
        if not user_data.worker_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Worker ID is required for CHW registration",
            )

    # Check duplicate phone
    if fb.get_user_by_phone(user_data.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    # Create user in Firestore
    new_user = fb.create_user({
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "email": user_data.email,
        "hashed_password": hash_password(user_data.password),
        "role": user_role,
        "language_preference": user_data.language_preference or "en",
        "date_of_birth": user_data.date_of_birth,
        "gender": user_data.gender,
        "address": user_data.address,
        "latitude": user_data.latitude,
        "longitude": user_data.longitude,
    })

    uid = new_user["id"]

    # Create role-specific profile
    if user_role == "doctor":
        fb.create_doctor_profile(uid, {
            "license_number": user_data.license_number,
            "specialization": user_data.specialization,
            "hospital_name": user_data.hospital_name,
            "years_of_experience": user_data.years_of_experience,
        })
    elif user_role == "chw":
        fb.create_chw_profile(uid, {
            "worker_id": user_data.worker_id,
            "assigned_district": user_data.assigned_district,
        })

    access_token = create_access_token(data={"sub": uid})
    return TokenResponse(access_token=access_token, user=_user_to_response(new_user))


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin):
    """Login with phone and password — verified against Firestore."""
    user = fb.get_user_by_phone(credentials.phone)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    access_token = create_access_token(data={"sub": user["id"]})
    return TokenResponse(access_token=access_token, user=_user_to_response(user))


@router.post("/token")
def token_login(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2-compatible token endpoint for Swagger UI."""
    user = fb.get_user_by_phone(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    access_token = create_access_token(data={"sub": user["id"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    return _user_to_response(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    updates: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    fields = updates.model_dump(exclude_unset=True)
    if not fields:
        return _user_to_response(current_user)
    updated = fb.update_user(current_user["id"], fields)
    return _user_to_response(updated)
