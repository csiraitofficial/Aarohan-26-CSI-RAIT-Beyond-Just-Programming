"""
Firestore-backed user CRUD for authentication.

Collections:
  - users/{uid}          — core user data + hashed_password
  - doctor_profiles/{uid} — doctor-specific fields (keyed by user_id)
  - chw_profiles/{uid}    — CHW-specific fields (keyed by user_id)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.services.firebase_service import get_firestore

USERS = "users"
DOCTOR_PROFILES = "doctor_profiles"
CHW_PROFILES = "chw_profiles"


def _firestore():
    db = get_firestore()
    if db is None:
        raise RuntimeError("Firebase is not configured")
    return db


# ── User CRUD ────────────────────────────────────────────


def create_user(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user document. Returns the full document dict (includes 'id')."""
    db = _firestore()
    uid = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": uid,
        "full_name": data["full_name"],
        "phone": data["phone"],
        "email": data.get("email"),
        "hashed_password": data["hashed_password"],
        "role": data.get("role", "patient"),
        "language_preference": data.get("language_preference", "en"),
        "date_of_birth": data.get("date_of_birth"),
        "gender": data.get("gender"),
        "address": data.get("address"),
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "is_active": True,
        "created_at": now,
    }
    db.collection(USERS).document(uid).set(doc)
    return doc


def get_user_by_phone(phone: str) -> Optional[Dict[str, Any]]:
    """Look up a user by phone number."""
    db = _firestore()
    docs = db.collection(USERS).where("phone", "==", phone).limit(1).stream()
    for doc in docs:
        return doc.to_dict()
    return None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a user by document ID."""
    db = _firestore()
    doc = db.collection(USERS).document(user_id).get()
    if doc.exists:
        return doc.to_dict()
    return None


def update_user(user_id: str, fields: Dict[str, Any]) -> Dict[str, Any]:
    """Update specific fields on a user document. Returns updated document."""
    db = _firestore()
    db.collection(USERS).document(user_id).update(fields)
    return get_user_by_id(user_id)


# ── Role Profiles ────────────────────────────────────────


def create_doctor_profile(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = _firestore()
    doc = {
        "user_id": user_id,
        "license_number": data["license_number"],
        "specialization": data.get("specialization"),
        "hospital_name": data.get("hospital_name"),
        "years_of_experience": data.get("years_of_experience"),
    }
    db.collection(DOCTOR_PROFILES).document(user_id).set(doc)
    return doc


def create_chw_profile(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    db = _firestore()
    doc = {
        "user_id": user_id,
        "worker_id": data["worker_id"],
        "assigned_district": data.get("assigned_district"),
    }
    db.collection(CHW_PROFILES).document(user_id).set(doc)
    return doc


def get_doctor_profile(user_id: str) -> Optional[Dict[str, Any]]:
    db = _firestore()
    doc = db.collection(DOCTOR_PROFILES).document(user_id).get()
    if doc.exists:
        return doc.to_dict()
    return None


def get_chw_profile(user_id: str) -> Optional[Dict[str, Any]]:
    db = _firestore()
    doc = db.collection(CHW_PROFILES).document(user_id).get()
    if doc.exists:
        return doc.to_dict()
    return None
