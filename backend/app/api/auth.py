"""
Authentication API endpoints: register, login, profile.
Supabase Auth is the primary credential store.
Local SQLite mirrors user data for app queries (relations, consultations, etc.).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from typing import Optional

from app.db.database import get_db
from app.models.models import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserUpdate
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from app.services import supabase_service

router = APIRouter()


def _resolve_role(raw: Optional[str]) -> UserRole:
    role_str = (raw or "PATIENT").upper()
    try:
        return UserRole(role_str.lower())
    except ValueError:
        return UserRole.PATIENT


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. Credentials stored in Supabase, profile mirrored locally."""

    # 1. Register in Supabase (primary)
    ok, result = supabase_service.register_user(
        phone=user_data.phone,
        password=user_data.password,
        full_name=user_data.full_name,
        role=user_data.role or "PATIENT",
    )
    if not ok:
        # If Supabase says "already registered" but user doesn't exist locally,
        # allow local creation (re-sync scenario after DB wipe).
        if "already" not in (result or "").lower():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result)
        if db.query(User).filter(User.phone == user_data.phone).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered",
            )

    # 2. Check local duplicate (safety net)
    existing = db.query(User).filter(User.phone == user_data.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )
    if user_data.email:
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # 3. Mirror to local SQLite
    user_role = _resolve_role(user_data.role)
    new_user = User(
        full_name=user_data.full_name,
        phone=user_data.phone,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=user_role,
        language_preference=user_data.language_preference or "en",
        date_of_birth=user_data.date_of_birth,
        gender=user_data.gender,
        address=user_data.address,
        latitude=user_data.latitude,
        longitude=user_data.longitude,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(data={"sub": new_user.id})
    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(new_user))


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login — verify against Supabase first, then local."""

    # 1. Verify via Supabase
    supa_ok, supa_err = supabase_service.verify_login(credentials.phone, credentials.password)
    if not supa_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=supa_err or "Invalid phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Fetch local user record (needed for app JWT + profile data)
    user = db.query(User).filter(User.phone == credentials.phone).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please register first.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Local password check as fallback (handles Supabase-unavailable case
    #    where verify_login returns (True, None) without actually checking)
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    access_token = create_access_token(data={"sub": user.id})
    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))


@router.post("/token")
def token_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2-compatible token endpoint for Swagger UI."""
    user = db.query(User).filter(User.phone == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    access_token = create_access_token(data={"sub": user.id})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    updates: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
