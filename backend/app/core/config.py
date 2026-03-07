"""
Core configuration module for Swasthya Saathi backend.
Loads environment variables and provides app-wide settings.
"""

from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Resolve the .env path relative to this file (backend/.env)
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "sqlite:///./swasthya_saathi.db"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # Google Gemini
    GEMINI_API_KEY: str = "your_gemini_api_key_here"

    # AssemblyAI Speech-to-Text
    ASSEMBLYAI_API_KEY: str = "your_assemblyai_api_key_here"

    # Daily.co Video
    DAILY_API_KEY: str = ""

    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # App
    APP_NAME: str = "SwasthyaSaathi"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    model_config = {
        "env_file": str(_ENV_FILE),
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()

# Startup safety checks
import logging as _logging
_logger = _logging.getLogger(__name__)

if settings.SECRET_KEY == "dev-secret-key-change-in-production" and not settings.DEBUG:
    raise RuntimeError(
        "SECURITY ERROR: Default JWT SECRET_KEY detected in production mode. "
        "Set a strong SECRET_KEY in your .env file."
    )
elif settings.SECRET_KEY == "dev-secret-key-change-in-production":
    _logger.warning(
        "⚠️  Using default SECRET_KEY — acceptable for development only. "
        "Set a strong SECRET_KEY in .env before deploying."
    )

if settings.GEMINI_API_KEY == "your_gemini_api_key_here":
    _logger.warning(
        "⚠️  GEMINI_API_KEY not configured — AI triage will fall back to "
        "rule-based analysis. Set GEMINI_API_KEY in .env for full AI features."
    )
