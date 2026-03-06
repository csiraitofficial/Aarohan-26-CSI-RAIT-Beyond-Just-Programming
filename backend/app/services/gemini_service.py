"""
Google Gemini AI integration service.
Handles symptom analysis, medical triage, and multi-language translation.
"""

import json
import re
from typing import Optional

import google.generativeai as genai

from app.core.config import settings


# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


def _get_model():
    """Get the Gemini generative model instance."""
    # Using gemini-2.0-flash as the model name
    return genai.GenerativeModel("gemini-2.0-flash")


TRIAGE_PROMPT_TEMPLATE = """You are Swasthya Saathi, a medical triage AI assistant designed for rural healthcare in India.
Your role is to analyze patient symptoms and vitals to determine the severity of their condition.

PATIENT INFORMATION:
- Symptoms: {symptoms}
- Vitals: {vitals}
- Medical History: {medical_history}

INSTRUCTIONS:
1. Analyze ALL the symptoms and vitals carefully.
2. Classify the severity level as one of: "mild", "moderate", or "emergency"
3. Provide a primary concern (most likely condition).
4. Give practical recommendations suitable for rural areas.
5. Assign an urgency score from 1 (lowest) to 10 (highest).
6. Indicate if a follow-up is needed.

CRITICAL EMERGENCY RULES (override AI judgment):
- Oxygen saturation (SpO2) below 90% → EMERGENCY
- Blood pressure above 180/120 mmHg → EMERGENCY
- Temperature above 104°F (40°C) → EMERGENCY
- Heart rate above 150 bpm or below 40 bpm → EMERGENCY
- Chest pain with shortness of breath → EMERGENCY
- Signs of stroke (sudden numbness, confusion, severe headache) → EMERGENCY
- Severe bleeding or trauma → EMERGENCY

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{{
    "severity_level": "mild | moderate | emergency",
    "primary_concern": "Brief description of likely condition",
    "detailed_assessment": "Detailed analysis of symptoms and vitals",
    "recommendations": [
        "Recommendation 1",
        "Recommendation 2",
        "Recommendation 3"
    ],
    "urgency_score": 1-10,
    "follow_up_needed": true/false,
    "follow_up_timeframe": "e.g., 24 hours, 3 days, 1 week",
    "warning_signs": [
        "Warning sign to watch for 1",
        "Warning sign to watch for 2"
    ],
    "home_remedies": [
        "Home remedy 1 if applicable"
    ]
}}
"""


TRANSLATION_PROMPT_TEMPLATE = """Translate the following medical information to {target_language}.
Keep medical terms accurate and use simple, easy-to-understand language suitable for rural patients.
Preserve the JSON structure exactly. Only translate the text values, not the keys.

Text to translate:
{text}

Respond ONLY with the translated JSON (no markdown, no code blocks):
"""


def _local_symptom_analyzer(
    symptoms: list[dict],
    vitals: Optional[dict] = None,
    medical_history: Optional[str] = None,
) -> dict:
    """
    Local fallback analyzer when Gemini API is unavailable.
    Provides basic rule-based triage without AI.
    """
    # Emergency keywords
    emergency_keywords = [
        'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious',
        'stroke', 'seizure', 'severe head injury', 'poisoning', 'overdose',
        'suicidal', 'severe burn', 'choking', 'paralysis', 'confusion',
        'cannot breathe', 'heart attack', 'severe pain', 'unresponsive'
    ]
    
    # Moderate severity keywords
    moderate_keywords = [
        'fever', 'headache', 'vomiting', 'diarrhea', 'pain', 'nausea',
        'dizziness', 'weakness', 'cough', 'sore throat', 'fatigue'
    ]
    
    # Combine all symptoms into text
    symptom_text = " ".join([
        s.get('description', '').lower() for s in symptoms
    ]).lower()
    
    # Check vitals for emergency conditions
    is_emergency = False
    emergency_reason = None
    
    if vitals:
        if vitals.get('oxygen_saturation') and float(vitals['oxygen_saturation']) < 90:
            is_emergency = True
            emergency_reason = "Low oxygen saturation (SpO2 < 90%)"
        elif vitals.get('temperature_f') and float(vitals['temperature_f']) > 104:
            is_emergency = True
            emergency_reason = "Very high fever (>104°F)"
        elif vitals.get('blood_pressure_systolic') and float(vitals['blood_pressure_systolic']) > 180:
            is_emergency = True
            emergency_reason = "Critically high blood pressure"
        elif vitals.get('heart_rate'):
            hr = float(vitals['heart_rate'])
            if hr > 150 or hr < 40:
                is_emergency = True
                emergency_reason = f"Abnormal heart rate ({hr} bpm)"
    
    # Check symptom keywords
    if not is_emergency:
        for keyword in emergency_keywords:
            if keyword in symptom_text:
                is_emergency = True
                emergency_reason = f"Potentially serious symptoms detected ({keyword})"
                break
    
    # Determine severity level
    if is_emergency:
        severity_level = "emergency"
        urgency_score = 9
        primary_concern = emergency_reason or "Potentially serious condition requiring immediate attention"
        recommendations = [
            "🚨 Seek immediate medical attention",
            "Call emergency services or go to the nearest hospital",
            "Do not wait or try home remedies",
            "Have someone accompany you if possible"
        ]
        follow_up_timeframe = "Immediately"
        warning_signs = ["Any worsening of symptoms", "Loss of consciousness", "Severe pain"]
        home_remedies = []
    else:
        # Check for moderate symptoms
        has_moderate = any(keyword in symptom_text for keyword in moderate_keywords)
        
        if has_moderate:
            severity_level = "moderate"
            urgency_score = 5
            primary_concern = "Common symptoms that may require medical attention"
            recommendations = [
                "Schedule an appointment with a healthcare provider within 24-48 hours",
                "Monitor your symptoms and note any changes",
                "Stay hydrated and get adequate rest",
                "Take over-the-counter medication as appropriate"
            ]
            follow_up_timeframe = "24-48 hours"
            warning_signs = ["Symptoms worsen", "New symptoms appear", "Fever persists >3 days"]
            home_remedies = [
                "Rest and adequate sleep",
                "Drink plenty of fluids (water, herbal tea)",
                "Eat light, easily digestible foods",
                "Maintain good hygiene"
            ]
        else:
            severity_level = "mild"
            urgency_score = 3
            primary_concern = "Mild symptoms that can likely be managed at home"
            recommendations = [
                "Monitor symptoms for the next 24-48 hours",
                "Try home remedies and over-the-counter treatments",
                "Consult a doctor if symptoms persist or worsen",
                "Maintain good rest and nutrition"
            ]
            follow_up_timeframe = "2-3 days if symptoms persist"
            warning_signs = ["Symptoms worsen significantly", "High fever develops", "Unable to eat or drink"]
            home_remedies = [
                "Rest and relaxation",
                "Stay well-hydrated",
                "Use warm/cold compress as appropriate",
                "Maintain a comfortable room temperature"
            ]
    
    # Build detailed assessment
    symptom_descriptions = [s.get('description', 'Unknown symptom') for s in symptoms[:3]]
    detailed_assessment = f"Based on reported symptoms ({', '.join(symptom_descriptions)})"
    if vitals and any(vitals.values()):
        detailed_assessment += " and vital signs"
    detailed_assessment += f", this appears to be a {severity_level} condition."
    
    return {
        "severity_level": severity_level,
        "primary_concern": primary_concern,
        "detailed_assessment": detailed_assessment,
        "recommendations": recommendations,
        "urgency_score": urgency_score,
        "follow_up_needed": True,
        "follow_up_timeframe": follow_up_timeframe,
        "warning_signs": warning_signs,
        "home_remedies": home_remedies,
    }


def analyze_symptoms(
    symptoms: list[dict],
    vitals: Optional[dict] = None,
    medical_history: Optional[str] = None,
) -> dict:
    """
    Send patient symptoms and vitals to Gemini for analysis.

    Args:
        symptoms: List of symptom dicts with keys: description, body_part, duration, severity
        vitals: Dict with keys: temperature_f, blood_pressure_systolic, blood_pressure_diastolic,
                heart_rate, oxygen_saturation, respiratory_rate
        medical_history: Free-text medical history string

    Returns:
        Parsed dict with triage result
    """
    # Format symptoms for the prompt
    symptom_text = ""
    for i, s in enumerate(symptoms, 1):
        parts = [f"Symptom {i}: {s.get('description', 'N/A')}"]
        if s.get("body_part"):
            parts.append(f"  Body part: {s['body_part']}")
        if s.get("duration"):
            parts.append(f"  Duration: {s['duration']}")
        if s.get("severity"):
            parts.append(f"  Severity (1-10): {s['severity']}")
        # Enhanced symptom parameters
        if s.get("symptom_category"):
            parts.append(f"  Category: {s['symptom_category']}")
        if s.get("quality"):
            parts.append(f"  Quality/Character: {s['quality']}")
        if s.get("onset_type"):
            parts.append(f"  Onset: {s['onset_type']}")
        if s.get("timing_pattern"):
            parts.append(f"  Timing: {s['timing_pattern']}")
        if s.get("aggravating_factors"):
            parts.append(f"  Aggravating factors: {s['aggravating_factors']}")
        if s.get("relieving_factors"):
            parts.append(f"  Relieving factors: {s['relieving_factors']}")
        if s.get("radiation"):
            parts.append(f"  Radiation: {s['radiation']}")
        if s.get("associated_symptoms"):
            parts.append(f"  Associated symptoms: {s['associated_symptoms']}")
        if s.get("previous_occurrences"):
            parts.append(f"  Previous occurrences: {s['previous_occurrences']}")
        if s.get("functional_impact"):
            parts.append(f"  Functional impact: {s['functional_impact']}")
        if s.get("triggers"):
            parts.append(f"  Triggers: {s['triggers']}")
        symptom_text += "\n".join(parts) + "\n"

    # Format vitals
    vitals_text = "No vitals recorded"
    if vitals:
        vitals_parts = []
        if vitals.get("temperature_f"):
            vitals_parts.append(f"Temperature: {vitals['temperature_f']}°F")
        if vitals.get("blood_pressure_systolic") and vitals.get("blood_pressure_diastolic"):
            vitals_parts.append(
                f"Blood Pressure: {vitals['blood_pressure_systolic']}/{vitals['blood_pressure_diastolic']} mmHg"
            )
        if vitals.get("heart_rate"):
            vitals_parts.append(f"Heart Rate: {vitals['heart_rate']} bpm")
        if vitals.get("oxygen_saturation"):
            vitals_parts.append(f"Oxygen Saturation (SpO2): {vitals['oxygen_saturation']}%")
        if vitals.get("respiratory_rate"):
            vitals_parts.append(f"Respiratory Rate: {vitals['respiratory_rate']} breaths/min")
        vitals_text = ", ".join(vitals_parts) if vitals_parts else "No vitals recorded"

    history_text = medical_history or "No medical history provided"

    prompt = TRIAGE_PROMPT_TEMPLATE.format(
        symptoms=symptom_text,
        vitals=vitals_text,
        medical_history=history_text,
    )

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # Clean markdown code blocks if Gemini wraps the response
        if result_text.startswith("```"):
            result_text = re.sub(r"^```(?:json)?\s*", "", result_text)
            result_text = re.sub(r"\s*```$", "", result_text)

        result = json.loads(result_text)
        return result

    except json.JSONDecodeError:
        # If Gemini returns non-JSON, use local analyzer
        return _local_symptom_analyzer(symptoms, vitals, medical_history)
    except Exception as e:
        # Handle API errors gracefully with local analyzer
        return _local_symptom_analyzer(symptoms, vitals, medical_history)


def translate_medical_content(text: str, target_language: str) -> str:
    """
    Translate medical content to the target language using Gemini.

    Args:
        text: JSON string or text to translate
        target_language: Language code (hi=Hindi, bn=Bengali, ta=Tamil, te=Telugu, etc.)

    Returns:
        Translated text string
    """
    language_map = {
        "en": "English",
        "hi": "Hindi",
        "bn": "Bengali",
        "ta": "Tamil",
        "te": "Telugu",
        "mr": "Marathi",
        "gu": "Gujarati",
        "kn": "Kannada",
        "ml": "Malayalam",
        "pa": "Punjabi",
        "or": "Odia",
        "ur": "Urdu",
    }

    if target_language == "en":
        return text  # No translation needed

    lang_name = language_map.get(target_language, target_language)

    prompt = TRANSLATION_PROMPT_TEMPLATE.format(
        target_language=lang_name,
        text=text,
    )

    try:
        model = _get_model()
        response = model.generate_content(prompt)
        result_text = response.text.strip()

        # Clean markdown if needed
        if result_text.startswith("```"):
            result_text = re.sub(r"^```(?:json)?\s*", "", result_text)
            result_text = re.sub(r"\s*```$", "", result_text)

        return result_text
    except Exception:
        return text  # Return original if translation fails
