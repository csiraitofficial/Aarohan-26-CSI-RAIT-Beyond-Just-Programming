"""
Conversational AI Symptom Agent.
Manages multi-turn symptom interviews using Gemini AI
with structured question trees and real-time red flag detection.
"""

import json
import re
from typing import Optional

import google.generativeai as genai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import (
    ConsultationSession,
    ConversationTurn,
    SymptomLog,
    ConsultationStatus,
)
from app.services.symptom_questionnaires import (
    identify_symptom_category,
    get_questions_for_category,
    check_red_flags,
    get_progress_percentage,
    GENERIC_QUESTIONS,
)

genai.configure(api_key=settings.GEMINI_API_KEY)


# ─── Conversation States ─────────────────────────────────

STATE_NOT_STARTED = "not_started"
STATE_GREETING = "greeting"
STATE_IDENTIFYING = "identifying"   # Identifying main symptoms
STATE_COLLECTING = "collecting"     # Asking symptom-specific questions
STATE_CLARIFYING = "clarifying"     # Follow-up on unclear answers
STATE_VITALS = "vitals"             # Asking about vitals
STATE_COMPLETE = "complete"


# ─── System Prompts ──────────────────────────────────────

SYSTEM_PROMPT = """You are Swasthya Saathi, a compassionate and professional AI health assistant designed for patients in India, including rural areas.

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

INITIAL_ANALYSIS_PROMPT = """The patient said: "{message}"

Analyze this message and respond with a JSON object:
{{
    "identified_symptoms": ["list of symptoms mentioned"],
    "primary_category": "main symptom category (headache/chest_pain/fever/abdominal_pain/cough/breathing/diarrhea/vomiting/body_pain/skin/urinary/throat/back_pain/weakness/dizziness/bleeding/injury/eye/ear/pregnancy or null)",
    "is_emergency": false,
    "emergency_reason": null,
    "empathetic_response": "A brief, warm acknowledgment of their symptoms (1-2 sentences)",
    "needs_clarification": false,
    "clarification_question": null
}}

Important: Detect if this is an emergency situation (severe chest pain with sweating, uncontrolled bleeding, very high fever in infant, signs of stroke, severe breathing difficulty, etc.)
"""

RESPONSE_ANALYSIS_PROMPT = """You are analyzing a patient's response during a medical interview.

CONTEXT:
- Symptom category: {category}
- Question asked: "{question}"
- Question type: {question_type}
- Patient's response: "{response}"

Previous conversation:
{conversation_history}

Analyze the response and return a JSON object:
{{
    "extracted_value": "The key information extracted from the response",
    "is_clear": true,
    "needs_clarification": false,
    "clarification_question": null,
    "red_flags_detected": [],
    "is_emergency": false,
    "emergency_reason": null,
    "additional_symptoms_mentioned": [],
    "empathetic_transition": "A brief empathetic acknowledgment + natural transition to next question (1-2 sentences)"
}}

If the response is vague or unclear, set is_clear to false and provide a gentle clarification question.
If you detect any emergency red flags, set is_emergency to true with the reason.
"""

NATURAL_QUESTION_PROMPT = """You are asking the next question in a medical interview.

Patient's symptom: {category}
The structured question to ask is: "{structured_question}"
Previous conversation context:
{conversation_history}

Rephrase this question naturally and empathetically, as if a caring doctor is asking.
Keep it SHORT (1-2 sentences). Make it conversational, not robotic.
If the previous answer naturally leads into this question, make the transition smooth.

Return ONLY the rephrased question text, nothing else.
"""


def _get_model():
    """Get Gemini model instance."""
    return genai.GenerativeModel(
        "gemini-2.0-flash",
        system_instruction=SYSTEM_PROMPT,
    )


def _clean_json_response(text: str) -> str:
    """Clean markdown code blocks from Gemini response."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _get_conversation_history(session: ConsultationSession) -> str:
    """Build conversation history string from turns."""
    turns = sorted(session.conversation_turns, key=lambda t: t.turn_number)
    if not turns:
        return "No previous conversation."
    
    history = []
    for turn in turns[-6:]:  # Last 6 turns for context
        history.append(f"Agent: {turn.agent_question}")
        if turn.patient_response:
            history.append(f"Patient: {turn.patient_response}")
    return "\n".join(history)


def _get_answered_keys(session: ConsultationSession) -> list[str]:
    """Get list of question keys already answered."""
    answered = []
    for turn in session.conversation_turns:
        if turn.question_type and turn.patient_response:
            answered.append(turn.question_type)
        if turn.extracted_data:
            try:
                data = json.loads(turn.extracted_data)
                if data.get("question_key"):
                    answered.append(data["question_key"])
            except (json.JSONDecodeError, TypeError):
                pass
    return answered


def _get_context(session: ConsultationSession) -> dict:
    """Get accumulated conversation context."""
    if session.conversation_context:
        try:
            return json.loads(session.conversation_context)
        except (json.JSONDecodeError, TypeError):
            pass
    return {
        "primary_category": None,
        "identified_symptoms": [],
        "answered_questions": [],
        "extracted_data": {},
        "red_flags": [],
        "current_question_index": 0,
    }


def _save_context(session: ConsultationSession, context: dict, db: Session):
    """Save conversation context to session."""
    session.conversation_context = json.dumps(context)
    db.commit()


# ─── Question types where the answer is always Yes / No ──────
_YES_NO_TYPES = frozenset([
    'associated', 'red_flag', 'functional', 'exposure', 'risk_factors',
])

# ─── Question types where parenthetical text in the question
#     contains the real answer choices (location, quality, etc.) ──
_PAREN_OPTION_TYPES = frozenset([
    'location', 'quality', 'radiation', 'timing', 'triggers',
])


def _extract_question_options(question: dict) -> list[str] | None:
    """
    Derive answer-chip options from a structured question definition.

    Sources (in priority order):
    1. Type-based defaults for yes/no, severity, onset, duration.
    2. Parenthetical option lists embedded in the question text
       — e.g. "(front of head, back of head, one side, both sides, behind eyes)".
    3. Text pattern detection for yes/no phrasing.

    Returns None when the question requires free-text input.
    """
    text = question.get('text', '')
    qtype = question.get('type', '')

    # ── 1. Boolean question types → always Yes / No ─────────────────
    if qtype in _YES_NO_TYPES:
        return ['Yes', 'No']

    # ── 2. Severity scale ────────────────────────────────────────────
    if qtype == 'severity':
        return ['1-3 (Mild)', '4-6 (Moderate)', '7-9 (Severe)', '10 (Extreme)']

    # ── 3. Onset ─────────────────────────────────────────────────────
    if qtype == 'onset':
        return ['Suddenly', 'Gradually']

    # ── 4. Duration ──────────────────────────────────────────────────
    if qtype == 'duration':
        return ['A few hours', '1-2 days', '3-7 days', '1-2 weeks', 'More than a month']

    # ── 5. Extract options from parentheses for specific types ──────
    if qtype in _PAREN_OPTION_TYPES:
        paren_matches = re.findall(r'\(([^)]+)\)', text)
        for content in reversed(paren_matches):          # last paren is usually the options
            if ',' in content:
                raw = [o.strip() for o in content.split(',') if o.strip()]
                if len(raw) >= 2:
                    return [o[0].upper() + o[1:] if o else o for o in raw]

    # ── 6. Text-pattern fallback: detect yes/no phrasing ────────────
    lower = text.lower().strip()
    if lower.startswith((
        'do you', 'are you', 'is there', 'have you', 'did you',
        'has the', 'does the', 'can you', 'is it', 'was there',
    )):
        return ['Yes', 'No']

    return None


# ─── Main Agent Functions ─────────────────────────────────

def start_interview(
    session: ConsultationSession,
    initial_message: str,
    db: Session,
) -> dict:
    """
    Start a symptom interview. Analyzes the initial message,
    identifies symptoms, and asks the first targeted question.
    """
    model = _get_model()

    # Step 1: Analyze initial message with Gemini
    prompt = INITIAL_ANALYSIS_PROMPT.format(message=initial_message)
    try:
        response = model.generate_content(prompt)
        analysis = json.loads(_clean_json_response(response.text))
    except (json.JSONDecodeError, Exception):
        analysis = {
            "identified_symptoms": [initial_message],
            "primary_category": identify_symptom_category(initial_message),
            "is_emergency": False,
            "empathetic_response": "I understand you're not feeling well. Let me ask you some questions to better understand your symptoms.",
            "needs_clarification": False,
        }

    # Step 2: Also do local keyword matching for category
    local_category = identify_symptom_category(initial_message)
    ai_category = analysis.get("primary_category")
    category = ai_category if ai_category and ai_category != "null" else local_category

    # Step 3: Check for immediate red flags
    red_flags = check_red_flags(category, initial_message) if category else []
    is_emergency = analysis.get("is_emergency", False) or len(red_flags) > 0

    # Step 4: Build context
    context = {
        "primary_category": category,
        "identified_symptoms": analysis.get("identified_symptoms", []),
        "answered_questions": [],
        "extracted_data": {"initial_description": initial_message},
        "red_flags": [f["condition"] for f in red_flags],
        "current_question_index": 0,
    }

    # Step 5: Get the first question
    questions = get_questions_for_category(category) if category else GENERIC_QUESTIONS
    first_question = questions[0] if questions else GENERIC_QUESTIONS[0]

    # Step 6: Generate natural response
    empathetic = analysis.get("empathetic_response", "I understand you're not feeling well.")
    
    if is_emergency:
        agent_message = (
            f"⚠️ {empathetic} Based on what you've described, this could be serious. "
            f"Please seek immediate medical attention or call emergency services. "
            f"While you do that, let me ask a few quick questions. {first_question['text']}"
        )
    else:
        # Make the first question natural using Gemini
        try:
            q_prompt = NATURAL_QUESTION_PROMPT.format(
                category=category or "general",
                structured_question=first_question["text"],
                conversation_history=f"Patient: {initial_message}",
            )
            q_response = model.generate_content(q_prompt)
            natural_question = q_response.text.strip()
        except Exception:
            natural_question = first_question["text"]

        agent_message = f"{empathetic} {natural_question}"

    # Step 7: Save turn
    turn = ConversationTurn(
        consultation_id=session.id,
        turn_number=1,
        agent_question=agent_message,
        patient_response=None,
        question_type=first_question.get("type", "initial"),
        symptom_category=category,
        extracted_data=json.dumps({
            "question_key": first_question["key"],
            "initial_analysis": analysis.get("identified_symptoms", []),
        }),
    )
    db.add(turn)

    # Step 8: Update session state
    session.conversation_state = STATE_COLLECTING
    context["current_question_index"] = 0
    _save_context(session, context, db)
    
    # Save initial symptom log
    symptom_log = SymptomLog(
        consultation_id=session.id,
        description=initial_message,
        symptom_category=category,
    )
    db.add(symptom_log)
    db.commit()
    db.refresh(turn)

    progress = get_progress_percentage(category, []) if category else 0

    return {
        "session_id": session.id,
        "agent_message": agent_message,
        "conversation_state": session.conversation_state,
        "turn_number": 1,
        "question_type": first_question.get("type", "initial"),
        "options": _extract_question_options(first_question),
        "symptoms_identified": analysis.get("identified_symptoms", []),
        "is_emergency": is_emergency,
        "emergency_message": red_flags[0]["condition"] if red_flags else None,
        "progress_pct": progress,
    }


def process_response(
    session: ConsultationSession,
    patient_message: str,
    db: Session,
) -> dict:
    """
    Process a patient's response, extract data, check for red flags,
    and determine the next question to ask.
    """
    model = _get_model()
    context = _get_context(session)
    category = context.get("primary_category")
    
    # Get current turn number
    current_turns = len(session.conversation_turns)
    new_turn_number = current_turns + 1

    # Get the last turn to know what question was asked
    last_turn = max(session.conversation_turns, key=lambda t: t.turn_number) if session.conversation_turns else None
    
    # Update the last turn with patient's response
    if last_turn and not last_turn.patient_response:
        last_turn.patient_response = patient_message
        db.commit()

    # Step 1: Check red flags in response
    red_flags = check_red_flags(category, patient_message) if category else []
    is_emergency = len(red_flags) > 0

    # Step 2: Analyze response with Gemini
    conversation_history = _get_conversation_history(session)
    
    last_question = last_turn.agent_question if last_turn else ""
    last_question_type = last_turn.question_type if last_turn else ""
    
    # Extract the question key from last turn's extracted_data
    last_question_key = None
    if last_turn and last_turn.extracted_data:
        try:
            ld = json.loads(last_turn.extracted_data)
            last_question_key = ld.get("question_key")
        except (json.JSONDecodeError, TypeError):
            pass

    analysis_prompt = RESPONSE_ANALYSIS_PROMPT.format(
        category=category or "general",
        question=last_question,
        question_type=last_question_type,
        response=patient_message,
        conversation_history=conversation_history,
    )

    try:
        response = model.generate_content(analysis_prompt)
        analysis = json.loads(_clean_json_response(response.text))
    except (json.JSONDecodeError, Exception):
        analysis = {
            "extracted_value": patient_message,
            "is_clear": True,
            "needs_clarification": False,
            "red_flags_detected": [],
            "is_emergency": is_emergency,
            "additional_symptoms_mentioned": [],
            "empathetic_transition": "Thank you for sharing that.",
        }

    # Check if AI detected emergency
    if analysis.get("is_emergency"):
        is_emergency = True

    # Step 3: Update context with extracted data
    if last_question_key:
        context["extracted_data"][last_question_key] = analysis.get("extracted_value", patient_message)
        if last_question_key not in context["answered_questions"]:
            context["answered_questions"].append(last_question_key)

    # Update red flags
    for rf in analysis.get("red_flags_detected", []):
        if rf not in context["red_flags"]:
            context["red_flags"].append(rf)
    for rf in red_flags:
        if rf["condition"] not in context["red_flags"]:
            context["red_flags"].append(rf["condition"])

    # Step 4: Determine next question
    questions = get_questions_for_category(category) if category else GENERIC_QUESTIONS
    answered = context.get("answered_questions", [])
    
    # Find next unanswered question
    next_question = None
    next_index = context.get("current_question_index", 0) + 1
    
    for i in range(next_index, len(questions)):
        q = questions[i]
        if q["key"] not in answered:
            next_question = q
            context["current_question_index"] = i
            break

    # Step 5: Check if we need clarification
    next_options = None                           # populated per branch below
    if analysis.get("needs_clarification") and not analysis.get("is_clear", True):
        clarification = analysis.get("clarification_question", "Could you explain that a bit more?")
        agent_message = f"{analysis.get('empathetic_transition', '')} {clarification}"
        question_type = "clarification"
        question_key = last_question_key  # Re-ask same key
        conversation_state = STATE_CLARIFYING
        next_options = None                       # free-text for clarifications
    elif next_question is None:
        # All questions asked — interview complete
        agent_message = (
            f"{analysis.get('empathetic_transition', 'Thank you.')} "
            f"I have collected all the necessary information about your symptoms. "
            f"Let me now analyze everything and provide you with guidance."
        )
        question_type = "complete"
        question_key = "complete"
        conversation_state = STATE_COMPLETE
        session.conversation_state = STATE_COMPLETE
        next_options = None                       # no options on completion
    elif is_emergency:
        agent_message = (
            f"⚠️ Based on your response, this sounds like it could be serious. "
            f"Please seek immediate medical attention. "
            f"Can you quickly tell me: {next_question['text']}"
        )
        question_type = next_question.get("type", "question")
        question_key = next_question["key"]
        conversation_state = STATE_COLLECTING
        next_options = _extract_question_options(next_question)
    else:
        # Generate natural next question
        try:
            q_prompt = NATURAL_QUESTION_PROMPT.format(
                category=category or "general",
                structured_question=next_question["text"],
                conversation_history=conversation_history,
            )
            q_response = model.generate_content(q_prompt)
            natural_q = q_response.text.strip()
        except Exception:
            natural_q = next_question["text"]

        transition = analysis.get("empathetic_transition", "Thank you.")
        agent_message = f"{transition} {natural_q}"
        question_type = next_question.get("type", "question")
        question_key = next_question["key"]
        conversation_state = STATE_COLLECTING
        next_options = _extract_question_options(next_question)

    # Step 6: Save turn
    turn = ConversationTurn(
        consultation_id=session.id,
        turn_number=new_turn_number,
        agent_question=agent_message,
        patient_response=None,
        question_type=question_type,
        symptom_category=category,
        extracted_data=json.dumps({"question_key": question_key}),
    )
    db.add(turn)
    session.conversation_state = conversation_state
    _save_context(session, context, db)
    db.commit()
    db.refresh(turn)

    # Update symptom log with extracted data
    symptom_logs = session.symptoms
    if symptom_logs:
        main_log = symptom_logs[0]
        extracted = context.get("extracted_data", {})
        if "severity" in extracted:
            try:
                main_log.severity = int(re.search(r'\d+', str(extracted["severity"])).group())
            except (AttributeError, ValueError):
                pass
        if "location" in extracted:
            main_log.body_part = str(extracted["location"])[:100]
        if "quality" in extracted:
            main_log.quality = str(extracted["quality"])[:100]
        if "onset" in extracted:
            main_log.onset_type = str(extracted["onset"])[:50]
        if "duration" in extracted:
            main_log.duration = str(extracted["duration"])[:100]
        if "timing" in extracted or "timing_pattern" in extracted:
            main_log.timing_pattern = str(extracted.get("timing", extracted.get("timing_pattern", "")))[:100]
        if "radiation" in extracted:
            main_log.radiation = str(extracted["radiation"])[:200]
        if "functional" in extracted:
            main_log.functional_impact = str(extracted["functional"])[:200]
        if "previous" in extracted:
            main_log.previous_occurrences = str(extracted["previous"])[:200]
        
        # Save list fields as JSON
        aggravating = [v for k, v in extracted.items() if "aggravat" in k.lower() or k == "exertion"]
        if aggravating:
            main_log.aggravating_factors = json.dumps(aggravating)
        relieving = [v for k, v in extracted.items() if "reliev" in k.lower() or k == "relief"]
        if relieving:
            main_log.relieving_factors = json.dumps(relieving)
        associated = [v for k, v in extracted.items() if k in ("nausea", "sweating", "visual", "cough", "vomiting")]
        if associated:
            main_log.associated_symptoms = json.dumps(associated)
        triggers_list = [v for k, v in extracted.items() if k == "triggers"]
        if triggers_list:
            main_log.triggers = json.dumps(triggers_list)

        db.commit()

    progress = get_progress_percentage(category, answered) if category else 50

    return {
        "session_id": session.id,
        "agent_message": agent_message,
        "conversation_state": conversation_state,
        "turn_number": new_turn_number,
        "question_type": question_type,
        "options": next_options,
        "symptoms_identified": context.get("identified_symptoms", []),
        "is_emergency": is_emergency,
        "emergency_message": red_flags[0]["condition"] if red_flags else (
            analysis.get("emergency_reason") if analysis.get("is_emergency") else None
        ),
        "progress_pct": progress,
    }


def get_conversation_history_data(session: ConsultationSession) -> dict:
    """Get full conversation history for a session."""
    turns = sorted(session.conversation_turns, key=lambda t: t.turn_number)
    return {
        "session_id": session.id,
        "conversation_state": session.conversation_state or STATE_NOT_STARTED,
        "turns": [
            {
                "turn_number": t.turn_number,
                "agent_question": t.agent_question,
                "patient_response": t.patient_response,
                "question_type": t.question_type,
            }
            for t in turns
        ],
        "symptoms_collected": len(session.symptoms),
        "vitals_collected": len(session.vitals) > 0,
    }
