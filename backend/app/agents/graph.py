"""
DistilBERT-based Emergency Classifier.
Uses HuggingFace zero-shot classification to instantly detect
whether a patient's message indicates an emergency (~50ms locally).
"""

import logging
from functools import lru_cache

from transformers import pipeline

logger = logging.getLogger(__name__)

# ─── Labels for zero-shot classification ──────────────────
EMERGENCY_LABELS = [
    "life threatening emergency like heart attack stroke severe bleeding or not breathing",
    "concerning symptoms that need medical attention soon like high fever or severe pain",
    "common minor health issue like cold headache or mild discomfort",
]

# Map labels back to severity codes
LABEL_TO_SEVERITY = {
    "life threatening emergency like heart attack stroke severe bleeding or not breathing": "emergency",
    "concerning symptoms that need medical attention soon like high fever or severe pain": "moderate",
    "common minor health issue like cold headache or mild discomfort": "mild",
}

# Minimum confidence to trust the classification
EMERGENCY_CONFIDENCE_THRESHOLD = 0.65


@lru_cache(maxsize=1)
def _get_classifier():
    """
    Lazy-load the DistilBERT classifier on first use.
    Cached so the model is only loaded once per process.
    """
    logger.info("Loading DistilBERT zero-shot classifier...")
    try:
        classifier = pipeline(
            "zero-shot-classification",
            model="typeform/distilbert-base-uncased-mnli",
            device=-1,  # CPU only — no GPU required
        )
        logger.info("DistilBERT classifier loaded successfully.")
        return classifier
    except Exception as e:
        logger.error(f"Failed to load DistilBERT classifier: {e}")
        return None


def classify_emergency(text: str) -> dict:
    """
    Classify a patient message for emergency severity using DistilBERT.

    Args:
        text: The patient's symptom description.

    Returns:
        dict with keys:
            - severity: "emergency" | "moderate" | "mild"
            - confidence: float (0.0 to 1.0)
            - is_emergency: bool
            - all_scores: dict of label -> score
    """
    classifier = _get_classifier()

    # Fallback if model failed to load
    if classifier is None:
        return _keyword_fallback(text)

    try:
        result = classifier(
            text,
            candidate_labels=EMERGENCY_LABELS,
            hypothesis_template="This patient description indicates {}.",
        )

        # Parse results
        scores = dict(zip(result["labels"], result["scores"]))
        top_label = result["labels"][0]
        top_score = result["scores"][0]

        severity = LABEL_TO_SEVERITY.get(top_label, "moderate")

        # Only trust emergency classification if confidence is high enough
        is_emergency = (
            severity == "emergency"
            and top_score >= EMERGENCY_CONFIDENCE_THRESHOLD
        )

        return {
            "severity": severity,
            "confidence": round(top_score, 4),
            "is_emergency": is_emergency,
            "all_scores": {
                LABEL_TO_SEVERITY[label]: round(score, 4)
                for label, score in scores.items()
            },
        }

    except Exception as e:
        logger.error(f"DistilBERT classification failed: {e}")
        return _keyword_fallback(text)


def run_initial_assessment(initial_message: str) -> dict:
    """
    Run the initial agent assessment on the patient's first message.
    Uses DistilBERT to classify severity and builds the initial agent state.

    Returns:
        dict with keys: agent_response, is_emergency, category, identified_symptoms,
                        questions_asked, current_question_index, extracted_data,
                        red_flags, total_questions, severity, distilbert_score, next_step
    """
    classification = classify_emergency(initial_message)
    severity = classification["severity"]
    is_emergency = classification["is_emergency"]
    confidence = classification["confidence"]

    # Simple category detection from keywords
    text_lower = initial_message.lower()
    if any(w in text_lower for w in ["chest", "heart", "breathing", "breath"]):
        category = "respiratory_cardiac"
    elif any(w in text_lower for w in ["stomach", "abdomen", "nausea", "vomit", "diarrhea"]):
        category = "gastrointestinal"
    elif any(w in text_lower for w in ["head", "headache", "dizzy", "migraine"]):
        category = "neurological"
    elif any(w in text_lower for w in ["fever", "temperature", "chill", "cold", "flu"]):
        category = "fever_infection"
    elif any(w in text_lower for w in ["skin", "rash", "itch", "redness"]):
        category = "dermatological"
    else:
        category = "general"

    if is_emergency:
        agent_response = (
            "This sounds like it could be a medical emergency. "
            "Please seek immediate medical attention or call emergency services. "
            "Can you describe your symptoms in more detail?"
        )
    elif severity == "moderate":
        agent_response = (
            "I understand you're not feeling well. "
            "Your symptoms may need medical attention. "
            "Can you tell me more about what you're experiencing?"
        )
    else:
        agent_response = (
            "I'm here to help you understand your symptoms. "
            "Can you describe what you're feeling in more detail?"
        )

    return {
        "agent_response": agent_response,
        "is_emergency": is_emergency,
        "severity": severity,
        "distilbert_score": confidence,
        "category": category,
        "identified_symptoms": [initial_message],
        "questions_asked": [],
        "current_question_index": 0,
        "extracted_data": {"initial_description": initial_message},
        "red_flags": [] if not is_emergency else [initial_message],
        "total_questions": 0,
        "next_step": "emergency" if is_emergency else "collect",
    }


def run_follow_up(patient_message: str, agent_state: dict) -> dict:
    """
    Run a follow-up assessment turn using the patient's response and current state.

    Returns:
        dict with keys: agent_response, is_emergency, next_step, questions_asked,
                        current_question_index, extracted_data, red_flags
    """
    classification = classify_emergency(patient_message)
    is_emergency = classification["is_emergency"]
    severity = classification["severity"]

    # Check existing red flags
    existing_red_flags = agent_state.get("red_flags", [])
    red_flags = list(existing_red_flags)
    if is_emergency:
        red_flags.append(patient_message)

    questions_asked = agent_state.get("questions_asked", [])
    current_question_index = agent_state.get("current_question_index", 0)
    extracted_data = dict(agent_state.get("extracted_data", {}))

    # Store patient's answer
    extracted_data[f"answer_{len(questions_asked)}"] = patient_message

    # Decide next step
    if is_emergency:
        next_step = "emergency"
        agent_response = (
            "Based on what you've described, this may be a medical emergency. "
            "Please call emergency services or go to the nearest emergency room immediately."
        )
    elif current_question_index >= 5:
        next_step = "done"
        agent_response = "Thank you for answering my questions. I now have enough information to assess your condition."
    else:
        next_step = "collect"
        agent_response = (
            "Thank you for sharing that. "
            "Can you tell me how long you have been experiencing these symptoms?"
            if current_question_index == 0
            else "I understand. Are you experiencing any other symptoms along with this?"
        )

    return {
        "agent_response": agent_response,
        "is_emergency": is_emergency,
        "severity": severity,
        "next_step": next_step,
        "questions_asked": questions_asked + [patient_message],
        "current_question_index": current_question_index + 1,
        "extracted_data": extracted_data,
        "red_flags": red_flags,
    }


def run_complete_assessment(agent_state: dict) -> dict:
    """
    Run the final assessment to produce a triage summary.

    Returns:
        dict with triage_level, primary_concern, recommendations, urgency_score
    """
    red_flags = agent_state.get("red_flags", [])
    extracted_data = agent_state.get("extracted_data", {})
    severity = agent_state.get("severity", "mild")

    if red_flags or severity == "emergency":
        triage_level = "emergency"
        urgency_score = 9
        recommendations = ["Call emergency services immediately", "Go to the nearest emergency room"]
    elif severity == "moderate":
        triage_level = "moderate"
        urgency_score = 6
        recommendations = ["See a doctor within 24 hours", "Monitor your symptoms closely"]
    else:
        triage_level = "mild"
        urgency_score = 3
        recommendations = ["Rest and stay hydrated", "See a doctor if symptoms worsen"]

    return {
        "triage_level": triage_level,
        "primary_concern": extracted_data.get("initial_description", "Unspecified symptoms"),
        "recommendations": recommendations,
        "urgency_score": urgency_score,
    }


def _keyword_fallback(text: str) -> dict:
    """
    Rule-based fallback when DistilBERT is unavailable.
    Matches known emergency keywords.
    """
    text_lower = text.lower()

    emergency_phrases = [
        "chest pain", "can't breathe", "cannot breathe",
        "difficulty breathing", "heart attack", "stroke",
        "unconscious", "unresponsive", "seizure", "severe bleeding",
        "choking", "paralysis", "blue lips", "not breathing",
        "seene me dard", "saans nahi aa rahi",  # Hindi
    ]

    urgent_phrases = [
        "high fever", "severe pain", "blood in stool",
        "blood in urine", "severe headache", "persistent vomiting",
        "tez bukhar", "bahut dard",  # Hindi
    ]

    for phrase in emergency_phrases:
        if phrase in text_lower:
            return {
                "severity": "emergency",
                "confidence": 0.85,
                "is_emergency": True,
                "all_scores": {"emergency": 0.85, "moderate": 0.10, "mild": 0.05},
            }

    for phrase in urgent_phrases:
        if phrase in text_lower:
            return {
                "severity": "moderate",
                "confidence": 0.75,
                "is_emergency": False,
                "all_scores": {"emergency": 0.15, "moderate": 0.75, "mild": 0.10},
            }

    return {
        "severity": "mild",
        "confidence": 0.70,
        "is_emergency": False,
        "all_scores": {"emergency": 0.05, "moderate": 0.25, "mild": 0.70},
    }