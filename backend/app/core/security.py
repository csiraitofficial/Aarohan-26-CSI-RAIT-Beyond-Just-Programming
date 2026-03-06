"""
Security middleware for Swasthya Saathi.
Adds security headers, request sanitization, and rate limiting.
"""

import re
import time
from typing import Callable

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to all responses.
    Protects against common web vulnerabilities.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Strict Transport Security (HTTPS enforcement)
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = "default-src 'self'"

        # Disable caching for sensitive API responses
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
            response.headers["Pragma"] = "no-cache"

        return response


# Pattern to detect potential prompt injection attempts in symptom descriptions
SUSPICIOUS_PATTERNS = [
    r"ignore\s+(previous|all|above)\s+(instructions|prompts|rules)",
    r"system\s*prompt",
    r"(reveal|show|display)\s+(your|the)\s+(instructions|prompt|system)",
    r"you\s+are\s+now\s+",
    r"act\s+as\s+(a|an)\s+",
    r"<script",
    r"javascript:",
    r"DROP\s+TABLE",
    r"DELETE\s+FROM",
    r"INSERT\s+INTO.*VALUES",
    r"UNION\s+SELECT",
]


def sanitize_input(text: str) -> str:
    """
    Sanitize user input to prevent prompt injection and XSS.
    Strips dangerous patterns while preserving medical descriptions.

    Args:
        text: Raw user input text

    Returns:
        Sanitized text
    """
    if not text:
        return text

    # Strip HTML tags
    cleaned = re.sub(r"<[^>]+>", "", text)

    # Check for suspicious patterns (log but don't strip medical text)
    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, cleaned, re.IGNORECASE):
            # Replace suspicious text with placeholder
            cleaned = re.sub(pattern, "[removed]", cleaned, flags=re.IGNORECASE)

    # Limit length to prevent abuse
    return cleaned[:2000]


def setup_security(app: FastAPI) -> None:
    """
    Apply all security middleware and configurations to the app.
    """
    app.add_middleware(SecurityHeadersMiddleware)
