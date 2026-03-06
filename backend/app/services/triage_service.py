"""
Triage Engine service.
Orchestrates symptom analysis using Gemini AI with rule-based safety overrides.
"""

import json
from typing import Optional

from sqlalchemy.orm import Session

from app.models.models import ConsultationSession, TriageLevel, ConsultationStatus
from app.services.gemini_service import analyze_symptoms, translate_medical_content


def _check_critical_vitals(vitals: list) -> Optional[dict]:
    """
    Rule-based safety check for critical vital signs.
    Overrides AI judgment when vitals indicate life-threatening conditions.

    Returns override dict if critical, None otherwise.
    """
    for v in vitals:
        # SpO2 below 90% → EMERGENCY
        if v.oxygen_saturation is not None and v.oxygen_saturation < 90:
            return {
                "severity_level": "emergency",
                "primary_concern": "Critically low oxygen saturation (SpO2 < 90%)",
                "override_reason": "dangerously_low_spo2",
                "urgency_score": 10,
            }

        # BP above 180/120 → EMERGENCY (hypertensive crisis)
        if (
            v.blood_pressure_systolic is not None
            and v.blood_pressure_diastolic is not None
            and (v.blood_pressure_systolic > 180 or v.blood_pressure_diastolic > 120)
        ):
            return {
                "severity_level": "emergency",
                "primary_concern": "Hypertensive crisis — dangerously high blood pressure",
                "override_reason": "hypertensive_crisis",
                "urgency_score": 10,
            }

        # Temperature above 104°F → EMERGENCY
        if v.temperature_f is not None and v.temperature_f > 104:
            return {
                "severity_level": "emergency",
                "primary_concern": "Dangerously high fever (hyperthermia > 104°F)",
                "override_reason": "hyperthermia",
                "urgency_score": 10,
            }

        # Heart rate extremes → EMERGENCY
        if v.heart_rate is not None and (v.heart_rate > 150 or v.heart_rate < 40):
            direction = "Tachycardia (>150 bpm)" if v.heart_rate > 150 else "Bradycardia (<40 bpm)"
            return {
                "severity_level": "emergency",
                "primary_concern": f"Critical heart rate — {direction}",
                "override_reason": "critical_heart_rate",
                "urgency_score": 10,
            }

    return None


def perform_triage(session: ConsultationSession, db: Session) -> dict:
    """
    Perform AI-powered triage with rule-based safety overrides.

    1. Aggregates all symptoms and vitals from the session
    2. Checks critical vitals for immediate emergency overrides
    3. Sends data to Gemini AI for analysis
    4. Combines AI result with safety overrides
    5. Saves result to database

    Returns:
        Dict with complete triage result
    """
    symptoms = session.symptoms
    vitals = session.vitals

    if not symptoms:
        return {
            "session_id": session.id,
            "triage_level": "pending",
            "primary_concern": "No symptoms recorded yet",
            "recommendations": ["Please add symptoms before requesting triage"],
            "urgency_score": 0,
            "follow_up_needed": False,
            "language": session.language_used,
        }

    # Step 1: Check critical vitals (rule-based override)
    critical_override = _check_critical_vitals(vitals) if vitals else None

    # Step 2: Prepare data for Gemini AI
    symptom_data = []
    for s in symptoms:
        entry = {
            "description": s.description,
            "body_part": s.body_part,
            "duration": s.duration,
            "severity": s.severity,
        }
        # Include enhanced symptom parameters if available
        if s.symptom_category:
            entry["symptom_category"] = s.symptom_category
        if s.quality:
            entry["quality"] = s.quality
        if s.onset_type:
            entry["onset_type"] = s.onset_type
        if s.timing_pattern:
            entry["timing_pattern"] = s.timing_pattern
        if s.aggravating_factors:
            entry["aggravating_factors"] = s.aggravating_factors
        if s.relieving_factors:
            entry["relieving_factors"] = s.relieving_factors
        if s.radiation:
            entry["radiation"] = s.radiation
        if s.associated_symptoms:
            entry["associated_symptoms"] = s.associated_symptoms
        if s.previous_occurrences:
            entry["previous_occurrences"] = s.previous_occurrences
        if s.functional_impact:
            entry["functional_impact"] = s.functional_impact
        if s.triggers:
            entry["triggers"] = s.triggers
        symptom_data.append(entry)

    # Include conversation context if available
    conversation_context = None
    if session.conversation_context:
        try:
            ctx = json.loads(session.conversation_context)
            conversation_context = ctx.get("extracted_data", {})
        except (json.JSONDecodeError, TypeError):
            pass

    vitals_data = None
    if vitals:
        latest_vitals = vitals[-1]  # Use the most recent vitals reading
        vitals_data = {
            "temperature_f": latest_vitals.temperature_f,
            "blood_pressure_systolic": latest_vitals.blood_pressure_systolic,
            "blood_pressure_diastolic": latest_vitals.blood_pressure_diastolic,
            "heart_rate": latest_vitals.heart_rate,
            "oxygen_saturation": latest_vitals.oxygen_saturation,
            "respiratory_rate": latest_vitals.respiratory_rate,
        }

    # Get medical history if available
    medical_history = None
    if session.user and session.user.health_records:
        record = session.user.health_records[0]
        history_parts = []
        if record.known_allergies:
            history_parts.append(f"Allergies: {record.known_allergies}")
        if record.chronic_conditions:
            history_parts.append(f"Chronic conditions: {record.chronic_conditions}")
        if record.current_medications:
            history_parts.append(f"Medications: {record.current_medications}")
        medical_history = "; ".join(history_parts) if history_parts else None

    # Step 3: Call Gemini AI for analysis
    ai_result = analyze_symptoms(symptom_data, vitals_data, medical_history)

    # Step 4: Apply critical override if needed
    if critical_override:
        ai_result["severity_level"] = critical_override["severity_level"]
        ai_result["urgency_score"] = critical_override["urgency_score"]
        ai_result["primary_concern"] = (
            f"⚠️ CRITICAL: {critical_override['primary_concern']}. "
            f"AI Assessment: {ai_result.get('primary_concern', 'N/A')}"
        )
        ai_result["recommendations"] = [
            "🚨 SEEK IMMEDIATE MEDICAL ATTENTION",
            "Call emergency services or go to the nearest hospital immediately",
            "Do not delay — this is a life-threatening situation",
        ] + ai_result.get("recommendations", [])

    # Step 5: Map severity level to TriageLevel enum
    severity_map = {
        "mild": TriageLevel.MILD,
        "moderate": TriageLevel.MODERATE,
        "emergency": TriageLevel.EMERGENCY,
    }
    triage_level = severity_map.get(
        ai_result.get("severity_level", "moderate"), TriageLevel.MODERATE
    )

    # Step 6: Save results to database
    session.triage_level = triage_level
    session.status = ConsultationStatus.COMPLETED
    session.ai_assessment = json.dumps(ai_result.get("detailed_assessment", ""))
    session.primary_concern = ai_result.get("primary_concern", "")[:500]
    session.recommendations = json.dumps(ai_result.get("recommendations", []))
    session.urgency_score = ai_result.get("urgency_score", 5)
    session.follow_up_needed = ai_result.get("follow_up_needed", False)
    session.follow_up_date = ai_result.get("follow_up_timeframe", None)

    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "triage_level": triage_level.value,
        "urgency_score": ai_result.get("urgency_score", 5),
        "primary_concern": ai_result.get("primary_concern", ""),
        "detailed_assessment": ai_result.get("detailed_assessment", ""),
        "recommendations": ai_result.get("recommendations", []),
        "warning_signs": ai_result.get("warning_signs", []),
        "home_remedies": ai_result.get("home_remedies", []),
        "follow_up_needed": ai_result.get("follow_up_needed", False),
        "follow_up_timeframe": ai_result.get("follow_up_timeframe", ""),
        "language": session.language_used,
    }
