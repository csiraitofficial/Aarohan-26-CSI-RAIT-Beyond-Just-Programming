"""
Supabase Auth service — PRIMARY user credential store.

All user registrations and logins are routed through Supabase Auth.
If the service_role key is available, the admin API is used for guaranteed
email-confirmation bypass.  Otherwise the anon client sign_up flow is used.

Falls back gracefully if Supabase is unreachable so local dev still works.
"""
import logging
from typing import Optional, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

_admin_client = None
_anon_client = None


def _get_admin_client():
    global _admin_client
    if _admin_client is not None:
        return _admin_client
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return None
    try:
        from supabase import create_client
        _admin_client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        logger.info("Supabase admin client ready")
        return _admin_client
    except Exception as e:
        logger.warning("Supabase admin client init failed: %s", e)
        return None


def _get_anon_client():
    global _anon_client
    if _anon_client is not None:
        return _anon_client
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        return None
    try:
        from supabase import create_client
        _anon_client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY,
        )
        logger.info("Supabase anon client ready")
        return _anon_client
    except Exception as e:
        logger.warning("Supabase anon client init failed: %s", e)
        return None


def _phone_to_email(phone: str) -> str:
    digits = "".join(c for c in phone if c.isdigit())
    return f"{digits}@swasthyasaathi.app"


# ── Public API ───────────────────────────────────────────


def register_user(
    phone: str, password: str, full_name: str, role: str,
) -> Tuple[bool, Optional[str]]:
    """
    Create a user in Supabase Auth (primary credential store).

    Returns (success, supabase_uid | error_message).
    """
    email = _phone_to_email(phone)
    metadata = {"phone": phone, "full_name": full_name, "role": role.upper()}

    # Prefer admin API (skips email confirmation)
    admin = _get_admin_client()
    if admin is not None:
        try:
            resp = admin.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": metadata,
            })
            if resp.user:
                logger.info("Supabase user created (admin): %s", resp.user.id)
                return True, resp.user.id
        except Exception as e:
            err = str(e).lower()
            if "already" in err:
                return False, "Phone number already registered"
            if "rate limit" in err:
                logger.warning("Supabase admin rate-limited — trying anon")
            else:
                logger.warning("Supabase admin register failed: %s", str(e))
            # Fall through to anon / local-only

    # Fallback: anon sign_up
    anon = _get_anon_client()
    if anon is not None:
        try:
            resp = anon.auth.sign_up({
                "email": email,
                "password": password,
                "options": {"data": metadata},
            })
            if resp.user:
                logger.info("Supabase user created (anon): %s", resp.user.id)
                return True, resp.user.id
        except Exception as e:
            err = str(e).lower()
            if "already" in err:
                return False, "Phone number already registered"
            if "rate limit" in err:
                logger.warning("Supabase rate-limited — falling back to local-only")
            else:
                logger.warning("Supabase anon register failed: %s", str(e))
            # Transient / rate-limit errors fall through to local-only

    # Supabase not reachable — allow local-only registration
    logger.debug("Supabase not configured — local-only registration")
    return True, None


def verify_login(phone: str, password: str) -> Tuple[bool, Optional[str]]:
    """
    Verify credentials against Supabase Auth.

    Returns (success, error_message | None).

    Because users may have been registered locally (rate-limit fallback),
    this function never hard-fails on "invalid credentials". The local
    bcrypt check in auth.py is the authoritative gate.
    """
    anon = _get_anon_client()
    if anon is None:
        return True, None

    email = _phone_to_email(phone)
    try:
        resp = anon.auth.sign_in_with_password({"email": email, "password": password})
        if resp.session:
            return True, None
    except Exception as e:
        err = str(e).lower()
        # Network / transient / unknown errors → allow local fallback
        logger.debug("Supabase login check: %s — deferring to local", err[:100])
        return True, None

    return True, None


def is_configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY)
