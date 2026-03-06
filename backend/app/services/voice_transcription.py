"""
Voice Transcription Service using Google Gemini 2.0 Flash.
Free, multilingual speech-to-text using the same Gemini API
already configured for the symptom agent.
Supports: English, Hindi, Tamil (and many more via Gemini).
"""

import base64
import logging
from typing import Optional

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Supported languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
}

# MIME type mapping for common audio formats
MIME_TYPE_MAP = {
    "wav": "audio/wav",
    "mp3": "audio/mp3",
    "m4a": "audio/mp4",
    "mp4": "audio/mp4",
    "webm": "audio/webm",
    "ogg": "audio/ogg",
    "aac": "audio/aac",
    "flac": "audio/flac",
}


async def transcribe_audio(
    audio_bytes: bytes,
    language_code: str = "en",
    mime_type: str = "audio/wav",
) -> dict:
    """
    Transcribe audio using Google Gemini 2.0 Flash multimodal API.

    Args:
        audio_bytes: Raw audio file bytes.
        language_code: Language code ('en', 'hi', 'ta').
        mime_type: MIME type of the audio file.

    Returns:
        Dict with 'text', 'language', 'confidence', 'status'.
    """
    if not settings.GEMINI_API_KEY:
        logger.error("Gemini API key not configured.")
        return {
            "text": "",
            "language": language_code,
            "confidence": 0.0,
            "status": "error",
            "error": "Gemini API key not configured. Set GEMINI_API_KEY in .env",
        }

    lang_name = SUPPORTED_LANGUAGES.get(language_code, "English")

    try:
        # Try multiple models — each has its own quota on the free tier
        models_to_try = [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash",
        ]
        last_error = None

        for model_name in models_to_try:
            try:
                model = genai.GenerativeModel(model_name)

                # Encode audio as base64 for inline_data
                audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

                # Build the multimodal prompt
                prompt = (
                    f"Transcribe the following audio recording accurately. "
                    f"The speaker is speaking in {lang_name}. "
                    f"Return ONLY the transcribed text, nothing else. "
                    f"Do not add any explanations, prefixes, or formatting. "
                    f"If the audio is unclear or silent, respond with exactly: [UNCLEAR]"
                )

                # Send audio + prompt to Gemini
                response = model.generate_content([
                    prompt,
                    {
                        "mime_type": mime_type,
                        "data": audio_b64,
                    },
                ])

                transcribed_text = response.text.strip() if response.text else ""

                # Check for unclear/empty transcription
                if not transcribed_text or transcribed_text == "[UNCLEAR]":
                    return {
                        "text": "",
                        "language": language_code,
                        "confidence": 0.0,
                        "status": "completed",
                    }

                logger.info(
                    f"Gemini ({model_name}) transcription completed: "
                    f"'{transcribed_text[:60]}...' (language: {lang_name})"
                )

                return {
                    "text": transcribed_text,
                    "language": language_code,
                    "confidence": 0.95,
                    "status": "completed",
                }

            except Exception as model_err:
                err_str = str(model_err)
                if "429" in err_str or "quota" in err_str.lower() or "404" in err_str:
                    logger.warning(f"Gemini {model_name} unavailable ({err_str[:80]}), trying next model...")
                    last_error = model_err
                    continue
                else:
                    raise model_err

        # All models exhausted
        error_msg = str(last_error) if last_error else "All Gemini models quota exceeded"
        logger.error(f"All Gemini models failed: {error_msg}")
        return {
            "text": "",
            "language": language_code,
            "confidence": 0.0,
            "status": "error",
            "error": "Voice service temporarily unavailable (quota limit). Please try again in a minute.",
        }

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Gemini transcription error: {error_msg}")
        return {
            "text": "",
            "language": language_code,
            "confidence": 0.0,
            "status": "error",
            "error": f"Transcription failed: {error_msg}",
        }


def get_supported_languages() -> list[dict]:
    """Return list of supported languages for voice input."""
    return [
        {"code": code, "name": name, "native_name": _native_name(code)}
        for code, name in SUPPORTED_LANGUAGES.items()
    ]


def _native_name(code: str) -> str:
    """Return the native script name for a language code."""
    names = {
        "en": "English",
        "hi": "हिन्दी",
        "ta": "தமிழ்",
    }
    return names.get(code, code)
