"""
Video call API endpoints using Daily.co.
Provides room creation (doctor) and room joining (patient).
"""

import uuid
import httpx
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import settings
from app.core.auth import get_current_user
from app.db.database import get_db
from app.models.models import User, ConsultationSession, UserRole

router = APIRouter()

DAILY_API_BASE = "https://api.daily.co/v1"


class CreateRoomRequest(BaseModel):
    consultation_id: Optional[str] = None


class RoomResponse(BaseModel):
    room_url: str
    room_name: str
    consultation_id: Optional[str] = None


@router.post("/create-room", response_model=RoomResponse)
async def create_video_room(
    req: CreateRoomRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Doctor creates a Daily.co video room for a consultation."""
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can create video rooms.",
        )

    if not settings.DAILY_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Video service not configured. Set DAILY_API_KEY in .env.",
        )

    room_name = f"ss-{uuid.uuid4().hex[:10]}"

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{DAILY_API_BASE}/rooms",
                headers={
                    "Authorization": f"Bearer {settings.DAILY_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "name": room_name,
                    "properties": {
                        "enable_chat": True,
                        "enable_screenshare": False,
                        "max_participants": 2,
                    },
                },
                timeout=15,
            )
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Video service unreachable. Please try again.",
        )

    if resp.status_code not in (200, 201):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Daily.co error: {resp.text}",
        )

    data = resp.json()
    room_url = data.get("url", f"https://{data.get('domain_id', 'your-domain')}.daily.co/{room_name}")

    # Store in consultation if provided
    if req.consultation_id:
        consultation = db.query(ConsultationSession).filter(
            ConsultationSession.id == req.consultation_id,
        ).first()
        if consultation:
            consultation.video_room_url = room_url
            consultation.video_room_name = room_name
            db.commit()

    return RoomResponse(
        room_url=room_url,
        room_name=room_name,
        consultation_id=req.consultation_id,
    )


@router.get("/join/{consultation_id}", response_model=RoomResponse)
async def join_video_room(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Patient (or doctor) gets the room URL for a consultation."""
    consultation = db.query(ConsultationSession).filter(
        ConsultationSession.id == consultation_id,
    ).first()

    if not consultation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation not found.",
        )

    # Access control: only the patient who owns the session or a doctor may join
    if consultation.user_id != current_user.id and current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to join this consultation.",
        )

    if not consultation.video_room_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No video call has been started for this consultation.",
        )

    return RoomResponse(
        room_url=consultation.video_room_url,
        room_name=consultation.video_room_name or "",
        consultation_id=consultation_id,
    )


@router.delete("/end-room/{consultation_id}")
async def end_video_room(
    consultation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End a video call and clean up the Daily.co room."""
    consultation = db.query(ConsultationSession).filter(
        ConsultationSession.id == consultation_id,
    ).first()

    if not consultation or not consultation.video_room_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active video room found.",
        )

    # Only the owning patient or a doctor may end the call
    if consultation.user_id != current_user.id and current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to end this video room.",
        )

    # Delete room from Daily.co
    if settings.DAILY_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                await client.delete(
                    f"{DAILY_API_BASE}/rooms/{consultation.video_room_name}",
                    headers={"Authorization": f"Bearer {settings.DAILY_API_KEY}"},
                    timeout=10,
                )
        except httpx.HTTPError:
            pass  # Room cleanup is best-effort; local state is cleared below

    consultation.video_room_url = None
    consultation.video_room_name = None
    db.commit()

    return {"detail": "Video room ended and cleaned up."}
