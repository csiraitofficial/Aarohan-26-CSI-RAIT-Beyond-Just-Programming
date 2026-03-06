"""
AssemblyAI Speech-to-Text Service.
Provides multilingual voice transcription supporting English, Hindi, and Tamil.
"""

import httpx
import logging
import tempfile
import os
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2"

# Language code mapping for AssemblyAI
# AssemblyAI uses BCP-47 language codes
LANGUAGE_MAP = {
    "en": "en",       # English
    "hi": "hi",       # Hindi
    "ta": "ta",       # Tamil
}

SUPPORTED_LANGUAGES = list(LANGUAGE_MAP.keys())


async def upload_audio_to_assemblyai(audio_bytes: bytes) -> str:
    """
    Upload audio file to AssemblyAI and return the upload URL.

    Args:
        audio_bytes: Raw audio file bytes.

    Returns:
        Upload URL string from AssemblyAI.
    """
    headers = {
        "authorization": settings.ASSEMBLYAI_API_KEY,
        "content-type": "application/octet-stream",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{ASSEMBLYAI_BASE_URL}/upload",
            headers=headers,
            content=audio_bytes,
        )
        response.raise_for_status()
        data = response.json()
        logger.info("Audio uploaded to AssemblyAI successfully.")
        return data["upload_url"]


async def transcribe_audio(
    audio_bytes: bytes,
    language_code: str = "en",
) -> dict:
    """
    Transcribe audio using AssemblyAI with multilingual support.

    Args:
        audio_bytes: Raw audio file bytes (WAV, MP3, M4A, etc.)
        language_code: Language code ('en', 'hi', 'ta')

    Returns:
        Dict with 'text' (transcribed text), 'language' (detected/used language),
        'confidence' (transcription confidence), and 'status'.
    """
    if not settings.ASSEMBLYAI_API_KEY or settings.ASSEMBLYAI_API_KEY == "your_assemblyai_api_key_here":
        logger.error("AssemblyAI API key not configured.")
        return {
            "text": "",
            "language": language_code,
            "confidence": 0.0,
            "status": "error",
            "error": "AssemblyAI API key not configured. Set ASSEMBLYAI_API_KEY in .env",
        }

    # Validate language code
    aai_language = LANGUAGE_MAP.get(language_code, "en")

    headers = {
        "authorization": settings.ASSEMBLYAI_API_KEY,
        "content-type": "application/json",
    }

    try:
        # Step 1: Upload audio
        upload_url = await upload_audio_to_assemblyai(audio_bytes)

        # Step 2: Request transcription
        # NOTE: speech_model "nano" only supports English.
        # For Hindi/Tamil we must use the "best" model (or omit it to use the default).
        transcript_request: dict = {
            "audio_url": upload_url,
            "language_code": aai_language,
        }
        if aai_language == "en":
            transcript_request["speech_model"] = "nano"  # Faster for English
        else:
            transcript_request["speech_model"] = "best"  # Required for non-English languages

        async with httpx.AsyncClient(timeout=120.0) as client:
            # Create transcription job
            response = await client.post(
                f"{ASSEMBLYAI_BASE_URL}/transcript",
                headers=headers,
                json=transcript_request,
            )
            response.raise_for_status()
            transcript_data = response.json()
            transcript_id = transcript_data["id"]

            logger.info(f"Transcription job created: {transcript_id}")

            # Step 3: Poll for completion
            polling_url = f"{ASSEMBLYAI_BASE_URL}/transcript/{transcript_id}"
            max_polls = 60  # Max 60 polls (roughly 2 minutes)
            poll_count = 0

            import asyncio

            while poll_count < max_polls:
                poll_response = await client.get(polling_url, headers=headers)
                poll_response.raise_for_status()
                result = poll_response.json()

                status = result.get("status")

                if status == "completed":
                    transcribed_text = result.get("text", "")
                    confidence = result.get("confidence", 0.0)

                    logger.info(
                        f"Transcription completed: '{transcribed_text[:50]}...' "
                        f"(confidence: {confidence}, language: {aai_language})"
                    )

                    return {
                        "text": transcribed_text or "",
                        "language": language_code,
                        "confidence": confidence or 0.0,
                        "status": "completed",
                    }

                elif status == "error":
                    error_msg = result.get("error", "Unknown transcription error")
                    logger.error(f"Transcription failed: {error_msg}")
                    return {
                        "text": "",
                        "language": language_code,
                        "confidence": 0.0,
                        "status": "error",
                        "error": error_msg,
                    }

                # Still processing — wait and retry
                poll_count += 1
                await asyncio.sleep(2)

            # Timed out
            logger.error("Transcription polling timed out.")
            return {
                "text": "",
                "language": language_code,
                "confidence": 0.0,
                "status": "error",
                "error": "Transcription timed out after 2 minutes",
            }

    except httpx.HTTPStatusError as e:
        # Extract the actual error message from AssemblyAI's response body
        try:
            err_detail = e.response.json().get("error", e.response.text)
        except Exception:
            err_detail = e.response.text or str(e.response.status_code)
        logger.error(f"AssemblyAI HTTP error: {e.response.status_code} - {err_detail}")
        return {
            "text": "",
            "language": language_code,
            "confidence": 0.0,
            "status": "error",
            "error": f"AssemblyAI error {e.response.status_code}: {err_detail}",
        }
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return {
            "text": "",
            "language": language_code,
            "confidence": 0.0,
            "status": "error",
            "error": str(e),
        }


def get_supported_languages() -> list[dict]:
    """Return list of supported languages for voice input."""
    return [
        {"code": "en", "name": "English", "native_name": "English"},
        {"code": "hi", "name": "Hindi", "native_name": "हिन्दी"},
        {"code": "ta", "name": "Tamil", "native_name": "தமிழ்"},
    ]
