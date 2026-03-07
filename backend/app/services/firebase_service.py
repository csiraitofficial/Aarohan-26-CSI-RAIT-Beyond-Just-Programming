"""
Firebase Admin SDK service — connects to Firestore for cloud data storage.

Initializes Firebase Admin once and exposes a Firestore client.
Falls back gracefully if credentials are not configured (local dev).
"""
import logging
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore

from app.core.config import settings

logger = logging.getLogger(__name__)

_app: Optional[firebase_admin.App] = None
_db = None


def _init_firebase():
    global _app, _db
    if _app is not None:
        return

    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    if not cred_path:
        logger.warning("FIREBASE_CREDENTIALS_PATH not set — Firebase disabled")
        return

    try:
        cred = credentials.Certificate(cred_path)
        _app = firebase_admin.initialize_app(cred, {
            "projectId": settings.FIREBASE_PROJECT_ID or None,
        })
        _db = firestore.client()
        logger.info("Firebase initialized (project: %s)", _app.project_id)
    except Exception as e:
        logger.error("Firebase init failed: %s", e)


def get_firestore():
    """Return the Firestore client, initializing on first call."""
    if _db is None:
        _init_firebase()
    return _db


def is_configured() -> bool:
    """Check whether Firebase is properly configured."""
    return get_firestore() is not None
