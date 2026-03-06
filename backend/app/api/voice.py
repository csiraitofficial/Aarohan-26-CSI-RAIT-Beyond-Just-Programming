"""
Voice transcription API endpoint.
Accepts audio uploads and returns transcribed text using Google Gemini.
Supports multilingual input (English, Hindi, Tamil).
"""

import logging
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, status

from app.models.models import User
from app.core.auth import get_current_user
from app.services.voice_transcription import (
    transcribe_audio,
    get_supported_languages,
    SUPPORTED_LANGUAGES,
    MIME_TYPE_MAP,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/transcribe")
async def transcribe_voice(
    audio: UploadFile = File(..., description="Audio file (WAV, MP3, M4A, WebM)"),
    language: str = Form("en", description="Language code: en, hi, ta"),
    current_user: User = Depends(get_current_user),
):
    """
    Transcribe voice audio to text using Google Gemini 2.0 Flash.

    Accepts audio file upload and returns the transcribed text
    in the specified language. FREE — uses the same Gemini API as the symptom agent.

    Supported formats: WAV, MP3, M4A, WebM, OGG
    Supported languages: English (en), Hindi (hi), Tamil (ta)
    """
    # Validate language
    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language '{language}'. Supported: {list(SUPPORTED_LANGUAGES.keys())}",
        )

    # Validate file type
    allowed_types = [
        "audio/wav", "audio/wave", "audio/x-wav",
        "audio/mpeg", "audio/mp3",
        "audio/mp4", "audio/m4a", "audio/x-m4a",
        "audio/webm",
        "audio/ogg",
        "audio/aac",
        "application/octet-stream",  # Some mobile recorders use this
    ]

    content_type = audio.content_type or "application/octet-stream"
    if content_type not in allowed_types:
        logger.warning(f"Received audio with content type: {content_type}")
        # Be lenient — Gemini handles many audio formats

    # Determine MIME type for Gemini
    filename = audio.filename or "recording.wav"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "wav"
    mime_type = MIME_TYPE_MAP.get(ext, content_type if content_type in allowed_types else "audio/wav")

    # Read audio bytes
    audio_bytes = await audio.read()

    if len(audio_bytes) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is too small. Please record a longer message.",
        )

    if len(audio_bytes) > 25 * 1024 * 1024:  # 25 MB limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Audio file exceeds 25 MB limit.",
        )

    logger.info(
        f"Transcribing audio: {len(audio_bytes)} bytes, "
        f"language={language}, user={current_user.id}"
    )

    # Transcribe using Gemini
    result = await transcribe_audio(audio_bytes, language, mime_type)

    if result["status"] == "error":
        logger.error(f"Transcription failed: {result.get('error')}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Transcription failed"),
        )

    return {
        "text": result["text"],
        "language": result["language"],
        "confidence": result["confidence"],
        "status": "success",
    }


@router.get("/languages")
def list_supported_languages():
    """
    Return list of supported languages for voice input.
    """
    return {
        "languages": get_supported_languages(),
        "default": "en",
    }
