"""
Core configuration module for Swasthya Saathi backend.
Loads environment variables and provides app-wide settings.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "sqlite:///./swasthya_saathi.db"

    # Google Gemini
    GEMINI_API_KEY: str = "your_gemini_api_key_here"

    # JWT
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # App
    APP_NAME: str = "SwasthyaSaathi"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
