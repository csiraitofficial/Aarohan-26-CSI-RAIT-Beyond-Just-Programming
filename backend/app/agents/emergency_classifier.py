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