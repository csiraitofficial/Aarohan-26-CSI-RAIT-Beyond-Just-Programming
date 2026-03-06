"""
Conversational AI Symptom Agent.
Manages multi-turn symptom interviews using LangGraph AI Agent pipeline
with DistilBERT emergency classification, Gemini AI analysis,
structured question trees, and real-time red flag detection.
"""

import json
import logging
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
from app.agents.graph import (
    run_initial_assessment,
    run_follow_up,
    run_complete_assessment,
)

logger = logging.getLogger(__name__)
genai.configure(api_key=settings.GEMINI_API_KEY)


# ─── Conversation States ─────────────────────────────────

STATE_NOT_STARTED = "not_started"
STATE_GREETING = "greeting"
STATE_IDENTIFYING = "identifying"   # Identifying main symptoms
STATE_COLLECTING = "collecting"     # Asking symptom-specific questions
STATE_CLARIFYING = "clarifying"     # Follow-up on unclear answers
STATE_VITALS = "vitals"             # Asking about vitals
STATE_COMPLETE = "complete"


# ─── Language Configuration ──────────────────────────────

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "ta": "Tamil (தமிழ்)",
}

LANGUAGE_INSTRUCTIONS = {
    "en": "Respond ONLY in English. Use simple, clear English.",
    "hi": "Respond ONLY in Hindi (हिन्दी). Use Devanagari script. Keep language simple and conversational. You may use common English medical terms if needed.",
    "ta": "Respond ONLY in Tamil (தமிழ்). Use Tamil script. Keep language simple and conversational. You may use common English medical terms if needed.",
}


def _get_language_from_session(session: ConsultationSession) -> str:
    """Get language code from session, default to 'en'."""
    return getattr(session, 'language_used', 'en') or 'en'


# ─── System Prompts ──────────────────────────────────────

SYSTEM_PROMPT_TEMPLATE = """You are Swasthya Saathi, a compassionate and professional AI health assistant designed for patients in India, including rural areas.

YOUR ROLE:
- You are a medical interviewer, NOT a doctor. You NEVER diagnose.
- You collect symptoms thoroughly by asking one clear question at a time.
- You are warm, empathetic, and reassuring.
- You speak simply so any patient can understand.

LANGUAGE INSTRUCTION:
{language_instruction}

RULES:
1. Ask ONE question at a time. Never overwhelm the patient.
2. Acknowledge the patient's response before asking the next question.
3. If the patient gives a vague answer, ask for clarification politely.
4. If you detect emergency red flags, immediately alert and advise seeking emergency care.
5. NEVER say "I diagnose you with..." — say "Based on your symptoms, it would be good to..."
6. Keep responses SHORT (2-3 sentences max per message).
7. Be culturally sensitive to Indian context.
8. When the patient mentions pain, ALWAYS ask severity on 1-10 scale.
9. ALWAYS respond in the specified language. Never switch languages unless asked.
"""

# Backward-compatible default
SYSTEM_PROMPT = SYSTEM_PROMPT_TEMPLATE.format(
    language_instruction=LANGUAGE_INSTRUCTIONS["en"]
)

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


def _get_model(language: str = "en"):
    """Get Gemini model instance with language-specific system prompt."""
    lang_instruction = LANGUAGE_INSTRUCTIONS.get(language, LANGUAGE_INSTRUCTIONS["en"])
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(language_instruction=lang_instruction)
    return genai.GenerativeModel(
        "gemini-2.5-flash",
        system_instruction=system_prompt,
    )


def _clean_json_response(text: str) -> str:
    """Clean markdown code blocks from Gemini response."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _translate_message(message: str, language: str) -> str:
    """Translate an English agent message to the target language using Gemini."""
    if language == "en" or not message:
        return message
    lang_name = LANGUAGE_NAMES.get(language, language)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = (
            f"Translate the following medical assistant message to {lang_name}. "
            f"Keep medical terms in English if there is no common equivalent. "
            f"Return ONLY the translated text, nothing else.\n\n"
            f"{message}"
        )
        resp = model.generate_content(prompt)
        translated = resp.text.strip()
        return translated if translated else message
    except Exception as e:
        logger.warning(f"Translation failed for language={language}: {e}")
        return message


def _translate_options(options: list[str] | None, language: str) -> list[str] | None:
    """Translate option chip labels to the target language."""
    if not options or language == "en":
        return options
    lang_name = LANGUAGE_NAMES.get(language, language)
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = (
            f"Translate each of these medical option labels to {lang_name}. "
            f"Return ONLY a JSON array of translated strings, same order.\n\n"
            f"{json.dumps(options)}"
        )
        resp = model.generate_content(prompt)
        cleaned = _clean_json_response(resp.text)
        translated = json.loads(cleaned)
        if isinstance(translated, list) and len(translated) == len(options):
            return translated
        return options
    except Exception as e:
        logger.warning(f"Option translation failed for language={language}: {e}")
        return options


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
    Start a symptom interview using the LangGraph AI Agent pipeline.
    Runs the graph: collect_symptoms → (emergency check via DistilBERT)
    Responds in the patient's chosen language.
    """
    language = _get_language_from_session(session)
    logger.info(f"Starting LangGraph interview for session {session.id} (language={language})")

    # ── Run LangGraph agent pipeline ──────────────────────
    try:
        graph_result = run_initial_assessment(initial_message)
        logger.info(
            f"LangGraph result: severity={graph_result.get('severity')}, "
            f"emergency={graph_result.get('is_emergency')}, "
            f"distilbert={graph_result.get('distilbert_score', 0):.2f}"
        )
    except Exception as e:
        logger.error(f"LangGraph pipeline failed, falling back: {e}")
        # Fallback to basic analysis if graph fails
        graph_result = {
            "agent_response": "I understand you're not feeling well. Can you tell me more about your symptoms?",
            "is_emergency": False,
            "category": identify_symptom_category(initial_message),
            "identified_symptoms": [initial_message],
            "questions_asked": [],
            "current_question_index": 0,
            "extracted_data": {"initial_description": initial_message},
            "red_flags": [],
            "total_questions": 0,
        }

    # ── Extract results from graph ────────────────────────
    category = graph_result.get("category")
    greeting = graph_result.get("agent_response", "")
    is_emergency = graph_result.get("is_emergency", False)
    identified_symptoms = graph_result.get("identified_symptoms", [])

    # Get question info for the response
    questions = get_questions_for_category(category) if category else GENERIC_QUESTIONS
    first_question = questions[0] if questions else GENERIC_QUESTIONS[0]

    # ── Combine greeting with the FIRST structured question so
    #    the displayed message matches the answer-chip options.
    first_q_text = first_question.get("text", "")
    if is_emergency:
        agent_message = greeting
    elif greeting and first_q_text:
        agent_message = f"{greeting}\n\n{first_q_text}"
    else:
        agent_message = greeting or first_q_text

    # ── Build context (includes LangGraph agent state) ────
    context = {
        "primary_category": category,
        "identified_symptoms": identified_symptoms,
        "answered_questions": graph_result.get("questions_asked", []),
        "extracted_data": graph_result.get("extracted_data", {"initial_description": initial_message}),
        "red_flags": graph_result.get("red_flags", []),
        "current_question_index": graph_result.get("current_question_index", 0),
        "language": language,
        # LangGraph-specific state for follow-up calls
        "agent_state": {
            "initial_message": initial_message,
            "category": category,
            "identified_symptoms": identified_symptoms,
            "questions_asked": graph_result.get("questions_asked", []),
            "current_question_index": graph_result.get("current_question_index", 0),
            "extracted_data": graph_result.get("extracted_data", {}),
            "red_flags": graph_result.get("red_flags", []),
            "is_emergency": is_emergency,
            "severity": graph_result.get("severity"),
            "distilbert_score": graph_result.get("distilbert_score", 0.0),
            "total_questions": graph_result.get("total_questions", 0),
            "conversation_history": [],
            "language": language,
        },
    }

    # ── Save turn to DB ───────────────────────────────────
    turn = ConversationTurn(
        consultation_id=session.id,
        turn_number=1,
        agent_question=agent_message,
        patient_response=None,
        question_type=first_question.get("type", "initial"),
        symptom_category=category,
        extracted_data=json.dumps({
            "question_key": first_question["key"],
            "initial_analysis": identified_symptoms,
        }),
    )
    db.add(turn)

    # Update session state
    session.conversation_state = STATE_COLLECTING
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

    # ── Translate agent message and options if needed ─────
    options = _extract_question_options(first_question)
    if language != "en" and agent_message:
        agent_message = _translate_message(agent_message, language)
    if language != "en" and options:
        options = _translate_options(options, language)

    return {
        "session_id": session.id,
        "agent_message": agent_message,
        "conversation_state": session.conversation_state,
        "turn_number": 1,
        "question_type": first_question.get("type", "initial"),
        "options": options,
        "symptoms_identified": identified_symptoms,
        "is_emergency": is_emergency,
        "emergency_message": graph_result.get("emergency_reason"),
        "progress_pct": progress,
    }


def process_response(
    session: ConsultationSession,
    patient_message: str,
    db: Session,
) -> dict:
    """
    Process a patient's response using the LangGraph AI Agent pipeline.
    The graph handles: question flow, red flag detection (DistilBERT),
    and routing to analysis/emergency when all questions are done.
    Responds in the patient's chosen language.
    """
    context = _get_context(session)
    category = context.get("primary_category")
    language = context.get("language", _get_language_from_session(session))

    # Get current turn number
    current_turns = len(session.conversation_turns)
    new_turn_number = current_turns + 1

    # Update the last turn with patient's response
    last_turn = max(session.conversation_turns, key=lambda t: t.turn_number) if session.conversation_turns else None
    if last_turn and not last_turn.patient_response:
        last_turn.patient_response = patient_message
        db.commit()

    # ── Build conversation history for the graph ──────────
    conv_history = []
    turns = sorted(session.conversation_turns, key=lambda t: t.turn_number)
    for t in turns[-6:]:
        conv_history.append({"role": "assistant", "content": t.agent_question})
        if t.patient_response:
            conv_history.append({"role": "user", "content": t.patient_response})

    # ── Rebuild agent state from session context ──────────
    agent_state = context.get("agent_state", {})
    agent_state["conversation_history"] = conv_history

    # ── Run LangGraph agent pipeline ─────────────────────
    try:
        graph_result = run_follow_up(patient_message, agent_state)
        logger.info(
            f"LangGraph follow-up: next_step={graph_result.get('next_step')}, "
            f"emergency={graph_result.get('is_emergency')}"
        )
    except Exception as e:
        logger.error(f"LangGraph follow-up failed, falling back: {e}")
        # Fallback response
        graph_result = {
            "agent_response": "Thank you for sharing that. Can you tell me more about your symptoms?",
            "is_emergency": False,
            "next_step": "collect",
            "questions_asked": agent_state.get("questions_asked", []),
            "current_question_index": agent_state.get("current_question_index", 0),
            "extracted_data": agent_state.get("extracted_data", {}),
            "red_flags": agent_state.get("red_flags", []),
        }

    # ── Extract results ───────────────────────────────────
    graph_response = graph_result.get("agent_response", "")
    is_emergency = graph_result.get("is_emergency", False)
    next_step = graph_result.get("next_step", "collect")

    # Determine conversation state
    if next_step == "done" or next_step == "classify":
        conversation_state = STATE_COMPLETE
        session.conversation_state = STATE_COMPLETE
    else:
        conversation_state = STATE_COLLECTING

    # Get question info for options
    questions = get_questions_for_category(category) if category else GENERIC_QUESTIONS
    answered = graph_result.get("questions_asked", [])
    q_index = graph_result.get("current_question_index", 0)
    current_question = questions[q_index] if q_index < len(questions) else None

    question_type = current_question.get("type", "question") if current_question else "complete"
    question_key = current_question["key"] if current_question else "complete"
    next_options = _extract_question_options(current_question) if current_question and next_step == "collect" else None

    # ── Build agent_message from the STRUCTURED question so it
    #    always matches the answer-chip options shown to the user.
    if is_emergency or next_step in ("done", "classify") or current_question is None:
        agent_message = graph_response
    else:
        # Use a brief empathetic ack + the structured question text
        structured_q = current_question.get("text", "")
        agent_message = f"Thank you for sharing that. {structured_q}"

    # ── Update context with LangGraph state ───────────────
    context["answered_questions"] = answered
    context["current_question_index"] = q_index
    context["extracted_data"] = graph_result.get("extracted_data", context.get("extracted_data", {}))
    context["red_flags"] = graph_result.get("red_flags", [])
    context["agent_state"] = {
        "initial_message": agent_state.get("initial_message", ""),
        "category": category,
        "identified_symptoms": graph_result.get("identified_symptoms", []),
        "questions_asked": answered,
        "current_question_index": q_index,
        "extracted_data": graph_result.get("extracted_data", {}),
        "red_flags": graph_result.get("red_flags", []),
        "is_emergency": is_emergency,
        "severity": graph_result.get("severity"),
        "distilbert_score": graph_result.get("distilbert_score", 0.0),
        "total_questions": graph_result.get("total_questions", 0),
        "conversation_history": conv_history,
    }

    # ── Save turn to DB ───────────────────────────────────
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

    # ── Update symptom log with extracted data ────────────
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

    # ── Translate agent message and options if needed ─────
    if language != "en" and agent_message:
        agent_message = _translate_message(agent_message, language)
    if language != "en" and next_options:
        next_options = _translate_options(next_options, language)

    return {
        "session_id": session.id,
        "agent_message": agent_message,
        "conversation_state": conversation_state,
        "turn_number": new_turn_number,
        "question_type": question_type,
        "options": next_options,
        "symptoms_identified": graph_result.get("identified_symptoms", []),
        "is_emergency": is_emergency,
        "emergency_message": graph_result.get("emergency_reason"),
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