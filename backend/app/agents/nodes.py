"""
LangGraph Node Functions for SwasthyaSaathi AI Agent.

Each function represents one step in the sequential pipeline:
  1. collect_symptoms  — Ask follow-up questions (3-6)
  2. classify_severity — DistilBERT + rule-based red flag detection
  3. analyze_symptoms  — Full Gemini AI triage analysis
  4. suggest_remedies  — Retrieve & generate remedy recommendations
  5. handle_emergency  — Emergency response with first-aid
  6. connect_doctor    — Doctor consultation advice
"""

import json
import re
import logging
from typing import Optional

import google.generativeai as genai

from app.core.config import settings
from app.agents.state import AgentState
from app.agents.emergency_classifier import classify_emergency
from app.agents.remedies import get_remedies_for_category
from app.services.symptom_questionnaires import (
    identify_symptom_category,
    get_questions_for_category,
    check_red_flags,
    get_progress_percentage,
    GENERIC_QUESTIONS,
)
from app.services.gemini_service import analyze_symptoms as gemini_analyze

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


# ─── Shared Prompts ──────────────────────────────────────

AGENT_SYSTEM_PROMPT = """You are Swasthya Saathi, a compassionate and professional AI health assistant designed for patients in India, including rural areas.

YOUR ROLE:
- You are a medical interviewer, NOT a doctor. You NEVER diagnose.
- You collect symptoms thoroughly by asking one clear question at a time.
- You are warm, empathetic, and reassuring.
- You speak simply so any patient can understand.
- You can understand and respond in Hindi and English mixed (Hinglish).

RULES:
1. Ask ONE question at a time. Never overwhelm the patient.
2. Acknowledge the patient's response before asking the next question.
3. If the patient gives a vague answer, ask for clarification politely.
4. If you detect emergency red flags, immediately alert and advise seeking emergency care.
5. NEVER say "I diagnose you with..." — say "Based on your symptoms, it would be good to..."
6. Keep responses SHORT (2-3 sentences max per message).
7. Be culturally sensitive to Indian context.
8. When the patient mentions pain, ALWAYS ask severity on 1-10 scale.
"""


def _get_model():
    """Get Gemini model instance with system prompt."""
    return genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=AGENT_SYSTEM_PROMPT,
    )


def _clean_json_response(text: str) -> str:
    """Clean markdown code blocks from Gemini response."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


# ═══════════════════════════════════════════════════════════
# NODE 1: COLLECT SYMPTOMS
# ═══════════════════════════════════════════════════════════

def collect_symptoms(state: AgentState) -> AgentState:
    """
    Node 1: Symptom Collection.
    Analyzes the patient's message, identifies the symptom category,
    and generates the first follow-up question.

    This node handles BOTH the initial message and subsequent responses
    during the question loop.
    """
    model = _get_model()
    patient_message = state.get("patient_message", "")
    conversation_history = state.get("conversation_history", [])
    questions_asked = state.get("questions_asked", [])
    current_index = state.get("current_question_index", 0)
    category = state.get("category")
    extracted_data = state.get("extracted_data", {})

    # ── First message: identify category ─────────────────
    if not category:
        # Analyze initial message with Gemini
        analysis_prompt = f"""The patient said: "{patient_message}"

Analyze this message and respond with a JSON object:
{{
    "identified_symptoms": ["list of symptoms mentioned"],
    "primary_category": "main symptom category (headache/chest_pain/fever/abdominal_pain/cough/breathing/diarrhea/vomiting/body_pain/skin/urinary/throat/back_pain/weakness/dizziness/bleeding/injury/pregnancy or null)",
    "is_emergency": false,
    "emergency_reason": null,
    "empathetic_response": "A brief, warm acknowledgment (1-2 sentences)"
}}

Important: Detect if this is an emergency situation."""

        try:
            response = model.generate_content(analysis_prompt)
            analysis = json.loads(_clean_json_response(response.text))
        except Exception:
            analysis = {
                "identified_symptoms": [patient_message],
                "primary_category": identify_symptom_category(patient_message),
                "is_emergency": False,
                "empathetic_response": "I understand you're not feeling well. Let me ask you some questions.",
            }

        # Also do local keyword matching
        local_category = identify_symptom_category(patient_message)
        ai_category = analysis.get("primary_category")
        category = ai_category if ai_category and ai_category != "null" else local_category

        identified_symptoms = analysis.get("identified_symptoms", [patient_message])
        empathetic = analysis.get("empathetic_response", "I understand you're not feeling well.")

        # Check immediate red flags
        red_flags = check_red_flags(category, patient_message) if category else []

        # Get question tree
        questions = get_questions_for_category(category) if category else GENERIC_QUESTIONS
        first_question = questions[0] if questions else GENERIC_QUESTIONS[0]

        # Generate natural first question
        try:
            q_prompt = f"""Patient's symptom: {category}
The structured question to ask is: "{first_question['text']}"
Previous: Patient said: "{patient_message}"

Rephrase this question naturally and empathetically, as if a caring doctor is asking.
Keep it SHORT (1-2 sentences). Return ONLY the rephrased question text."""

            q_response = model.generate_content(q_prompt)
            natural_question = q_response.text.strip()
        except Exception:
            natural_question = first_question["text"]

        agent_message = f"{empathetic} {natural_question}"

        # Update state
        state["category"] = category
        state["identified_symptoms"] = identified_symptoms
        state["extracted_data"] = {"initial_description": patient_message}
        state["red_flags"] = [f["condition"] for f in red_flags]
        state["current_question_index"] = 0
        state["questions_asked"] = []
        state["total_questions"] = len(questions)
        state["agent_response"] = agent_message
        state["is_emergency"] = analysis.get("is_emergency", False) or len(red_flags) > 0
        state["next_step"] = "collect"  # Keep collecting
        state["current_node"] = "collect_symptoms"

        return state

    # ── Subsequent messages: process response & ask next ──
    else:
        questions = get_questions_for_category(category) if category else GENERIC_QUESTIONS

        # Build conversation history string
        history_str = "\n".join([
            f"{'Agent' if h['role'] == 'assistant' else 'Patient'}: {h['content']}"
            for h in conversation_history[-6:]
        ]) if conversation_history else "No previous conversation."

        # Analyze the response
        last_question = questions[current_index] if current_index < len(questions) else None

        analysis_prompt = f"""You are analyzing a patient's response during a medical interview.

CONTEXT:
- Symptom category: {category}
- Question asked: "{last_question['text'] if last_question else 'general question'}"
- Patient's response: "{patient_message}"
Previous conversation:
{history_str}

Analyze and return a JSON object:
{{
    "extracted_value": "The key information extracted",
    "is_clear": true,
    "red_flags_detected": [],
    "is_emergency": false,
    "empathetic_transition": "Brief empathetic acknowledgment + transition (1-2 sentences)"
}}"""

        try:
            response = model.generate_content(analysis_prompt)
            analysis = json.loads(_clean_json_response(response.text))
        except Exception:
            analysis = {
                "extracted_value": patient_message,
                "is_clear": True,
                "red_flags_detected": [],
                "is_emergency": False,
                "empathetic_transition": "Thank you for sharing that.",
            }

        # Save extracted data
        if last_question:
            extracted_data[last_question["key"]] = analysis.get("extracted_value", patient_message)
            if last_question["key"] not in questions_asked:
                questions_asked.append(last_question["key"])

        # Check red flags
        red_flags = state.get("red_flags", [])
        for rf in analysis.get("red_flags_detected", []):
            if rf not in red_flags:
                red_flags.append(rf)
        new_red_flags = check_red_flags(category, patient_message) if category else []
        for rf in new_red_flags:
            if rf["condition"] not in red_flags:
                red_flags.append(rf["condition"])

        is_emergency = analysis.get("is_emergency", False) or state.get("is_emergency", False)

        # Find next unanswered question
        next_question = None
        next_index = current_index + 1
        for i in range(next_index, len(questions)):
            q = questions[i]
            if q["key"] not in questions_asked:
                next_question = q
                next_index = i
                break

        if next_question is None:
            # All questions asked — move to classification
            transition = analysis.get("empathetic_transition", "Thank you.")
            agent_message = (
                f"{transition} I have collected all the necessary information "
                f"about your symptoms. Let me now analyze everything and provide you with guidance."
            )
            state["next_step"] = "classify"
            state["current_node"] = "collect_symptoms"
        else:
            # Generate natural next question
            try:
                q_prompt = f"""Patient's symptom: {category}
The structured question to ask is: "{next_question['text']}"
Previous conversation:
{history_str}

Rephrase naturally and empathetically. Keep SHORT (1-2 sentences). Return ONLY the question text."""

                q_response = model.generate_content(q_prompt)
                natural_q = q_response.text.strip()
            except Exception:
                natural_q = next_question["text"]

            transition = analysis.get("empathetic_transition", "Thank you.")
            agent_message = f"{transition} {natural_q}"
            state["next_step"] = "collect"  # Keep collecting
            state["current_node"] = "collect_symptoms"

        # Update state
        state["questions_asked"] = questions_asked
        state["current_question_index"] = next_index if next_question else current_index
        state["extracted_data"] = extracted_data
        state["red_flags"] = red_flags
        state["is_emergency"] = is_emergency
        state["agent_response"] = agent_message

        return state


# ═══════════════════════════════════════════════════════════
# NODE 2: CLASSIFY SEVERITY
# ═══════════════════════════════════════════════════════════

def classify_severity(state: AgentState) -> AgentState:
    """
    Node 2: Severity Classification.
    Uses DistilBERT zero-shot classification + rule-based red flags
    to determine: MILD, MODERATE, or EMERGENCY.
    """
    # Combine all symptom text for classification
    initial = state.get("initial_message", "")
    extracted = state.get("extracted_data", {})
    symptoms_text = initial

    # Add all extracted answers for a richer classification
    for key, val in extracted.items():
        if key != "initial_description" and isinstance(val, str):
            symptoms_text += f" {val}"

    # Run DistilBERT classifier
    classification = classify_emergency(symptoms_text)
    state["distilbert_score"] = classification["confidence"]

    # Combine with existing red flag detection
    red_flags = state.get("red_flags", [])
    existing_emergency = state.get("is_emergency", False)

    # Determine final severity
    if classification["is_emergency"] or existing_emergency or len(red_flags) > 0:
        severity = "emergency"
        is_emergency = True
        emergency_reason = (
            classification.get("severity", "emergency")
            if classification["is_emergency"]
            else (red_flags[0] if red_flags else "Critical symptoms detected")
        )
    elif classification["severity"] == "moderate":
        severity = "moderate"
        is_emergency = False
        emergency_reason = None
    else:
        severity = "mild"
        is_emergency = False
        emergency_reason = None

    state["severity"] = severity
    state["is_emergency"] = is_emergency
    state["emergency_reason"] = emergency_reason

    # Route to next step
    if is_emergency:
        state["next_step"] = "emergency"
    else:
        state["next_step"] = "analyze"

    state["current_node"] = "classify_severity"

    logger.info(
        f"Severity classified: {severity} "
        f"(DistilBERT: {classification['severity']}/{classification['confidence']:.2f}, "
        f"red_flags: {len(red_flags)})"
    )

    return state


# ═══════════════════════════════════════════════════════════
# NODE 3: AI ANALYSIS
# ═══════════════════════════════════════════════════════════

def analyze_symptoms_node(state: AgentState) -> AgentState:
    """
    Node 3: Full AI Analysis using Gemini.
    Produces a detailed triage report with severity, recommendations,
    and warning signs.
    """
    extracted = state.get("extracted_data", {})
    category = state.get("category", "general")

    # Build symptom data for the existing Gemini analyzer
    symptom_data = [{
        "description": state.get("initial_message", ""),
        "symptom_category": category,
    }]

    # Add extracted details
    for key, val in extracted.items():
        if key != "initial_description":
            symptom_data[0][key] = val

    # Call existing Gemini analysis function (reuses gemini_service.py)
    triage_result = gemini_analyze(symptom_data, vitals=None, medical_history=None)

    state["triage_result"] = triage_result
    state["severity"] = triage_result.get("severity_level", state.get("severity", "moderate"))
    state["urgency_score"] = triage_result.get("urgency_score", 5)
    state["warning_signs"] = triage_result.get("warning_signs", [])
    state["recommendations"] = triage_result.get("recommendations", [])
    state["next_step"] = "remedies"
    state["current_node"] = "analyze_symptoms"

    return state


# ═══════════════════════════════════════════════════════════
# NODE 4: SUGGEST REMEDIES
# ═══════════════════════════════════════════════════════════

def suggest_remedies(state: AgentState) -> AgentState:
    """
    Node 4: Natural Remedy Suggestions.
    Retrieves culturally relevant Indian home remedies from the database
    and generates a personalized recommendation using Gemini.
    """
    category = state.get("category", "general")
    severity = state.get("severity", "moderate")
    triage_result = state.get("triage_result", {})

    # Get remedies from our database
    remedies = get_remedies_for_category(category)
    remedy_names = [r["name"] for r in remedies]

    # Also include any Gemini-suggested remedies
    ai_remedies = triage_result.get("home_remedies", [])
    all_remedy_names = list(set(remedy_names + ai_remedies))

    state["remedies"] = all_remedy_names
    state["next_step"] = "doctor"
    state["current_node"] = "suggest_remedies"

    return state


# ═══════════════════════════════════════════════════════════
# NODE 5a: CONNECT DOCTOR (for mild/moderate)
# ═══════════════════════════════════════════════════════════

def connect_doctor(state: AgentState) -> AgentState:
    """
    Node 5a: Doctor Connection Advice.
    For MILD/MODERATE cases — provides doctor consultation recommendations
    and generates the final summary response.
    """
    model = _get_model()
    severity = state.get("severity", "moderate")
    category = state.get("category", "general")
    remedies = state.get("remedies", [])
    recommendations = state.get("recommendations", [])
    warning_signs = state.get("warning_signs", [])
    triage_result = state.get("triage_result", {})

    # Generate a comprehensive final response
    remedy_text = ", ".join(remedies[:4]) if remedies else "rest and hydration"
    rec_text = "\n".join([f"- {r}" for r in recommendations[:3]]) if recommendations else ""
    warning_text = ", ".join(warning_signs[:3]) if warning_signs else ""

    summary_prompt = f"""Based on a complete symptom assessment, generate a concise summary for the patient.

Symptom Category: {category}
Severity: {severity}
Primary Concern: {triage_result.get('primary_concern', 'Health concern')}
Suggested Home Remedies: {remedy_text}
Recommendations: {rec_text}
Warning Signs: {warning_text}

Generate a warm, clear 3-4 sentence summary that:
1. Tells them the severity level in simple terms
2. Suggests 2-3 specific home remedies they can try
3. Advises when to see a doctor
4. Mentions any warning signs to watch for

Keep it simple and culturally appropriate for Indian patients. Do NOT diagnose."""

    try:
        response = model.generate_content(summary_prompt)
        final_message = response.text.strip()
    except Exception:
        if severity == "mild":
            final_message = (
                f"Based on your symptoms, this appears to be a mild condition. "
                f"You can try these home remedies: {remedy_text}. "
                f"If symptoms persist for more than 2-3 days, please consult a doctor."
            )
        else:
            final_message = (
                f"Based on your symptoms, I would recommend consulting a doctor within 24-48 hours. "
                f"In the meantime, try: {remedy_text}. "
                f"Watch for these warning signs: {warning_text}."
            )

    state["agent_response"] = final_message
    state["next_step"] = "done"
    state["current_node"] = "connect_doctor"

    return state


# ═══════════════════════════════════════════════════════════
# NODE 5b: EMERGENCY RESPONSE
# ═══════════════════════════════════════════════════════════

def handle_emergency(state: AgentState) -> AgentState:
    """
    Node 5b: Emergency Response.
    For CRITICAL cases — provides immediate first-aid instructions,
    ambulance number, and ongoing guidance.
    """
    category = state.get("category", "general")
    emergency_reason = state.get("emergency_reason", "Critical symptoms detected")

    # Category-specific first-aid instructions
    first_aid = {
        "chest_pain": [
            "Sit upright in a comfortable position — do NOT lie flat",
            "Loosen any tight clothing around your chest",
            "If you have aspirin and are not allergic, chew 1 tablet (300mg)",
            "Do NOT eat or drink anything else",
            "Stay calm and breathe slowly",
        ],
        "breathing": [
            "Sit upright — do NOT lie down",
            "Loosen all tight clothing",
            "Open windows for fresh air",
            "Breathe slowly: in through nose (4 sec), out through mouth (6 sec)",
            "Do NOT panic — slow breathing helps",
        ],
        "bleeding": [
            "Apply firm pressure with a clean cloth on the wound",
            "Do NOT remove the cloth — add more on top if needed",
            "Elevate the injured area above heart level if possible",
            "Keep the person warm with a blanket",
        ],
        "fever": [
            "Sponge the body with lukewarm (NOT cold) water",
            "Remove excess clothing",
            "Give small sips of water to stay hydrated",
            "Do NOT give aspirin to children",
        ],
    }

    instructions = first_aid.get(category, [
        "Keep the person in a comfortable position",
        "Loosen any tight clothing",
        "Ensure fresh air circulation",
        "Do NOT give any food or drink unless conscious and alert",
        "Stay with the person and keep them calm",
    ])

    emergency_message = (
        f"🚨 EMERGENCY ALERT: {emergency_reason}\n\n"
        f"📞 CALL AMBULANCE NOW: 108 (India Emergency)\n"
        f"Alternative: 112 (National Emergency)\n\n"
        f"⚠️ WHILE WAITING FOR HELP:\n"
    )
    for i, instruction in enumerate(instructions, 1):
        emergency_message += f"{i}. {instruction}\n"

    emergency_message += (
        f"\n❌ DO NOT:\n"
        f"- Do NOT drive yourself to the hospital\n"
        f"- Do NOT eat or drink unless instructed\n"
        f"- Do NOT leave the person alone\n"
        f"\n✅ An alert has been sent to nearby emergency doctors."
    )

    state["agent_response"] = emergency_message
    state["severity"] = "emergency"
    state["urgency_score"] = 10
    state["is_emergency"] = True
    state["next_step"] = "done"
    state["current_node"] = "handle_emergency"

    # Also run quick analysis in the background for the triage record
    try:
        symptom_data = [{"description": state.get("initial_message", ""), "symptom_category": category}]
        triage = gemini_analyze(symptom_data, vitals=None, medical_history=None)
        triage["severity_level"] = "emergency"
        triage["urgency_score"] = 10
        state["triage_result"] = triage
        state["recommendations"] = [
            "🚨 SEEK IMMEDIATE MEDICAL ATTENTION",
            "Call emergency services (108) or go to nearest hospital",
        ] + triage.get("recommendations", [])
        state["warning_signs"] = triage.get("warning_signs", [])
        state["remedies"] = []  # No home remedies for emergencies
    except Exception:
        state["triage_result"] = {
            "severity_level": "emergency",
            "urgency_score": 10,
            "primary_concern": emergency_reason,
            "recommendations": ["SEEK IMMEDIATE MEDICAL ATTENTION"],
        }
        state["recommendations"] = ["SEEK IMMEDIATE MEDICAL ATTENTION"]
        state["warning_signs"] = []
        state["remedies"] = []

    return state