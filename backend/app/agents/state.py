"""
Agent State definition for LangGraph.
This TypedDict flows through every node in the graph,
carrying the full conversation context from step to step.
"""

from typing import TypedDict, Optional


class AgentState(TypedDict, total=False):
    """
    Shared state that flows through the LangGraph pipeline.

    Fields are populated progressively as each node executes:
      1. collect_symptoms  → patient_message, conversation_history, category, ...
      2. classify_severity → severity, is_emergency, emergency_reason
      3. analyze_symptoms  → triage_result
      4. suggest_remedies  → remedies, recommendations
      5. connect_doctor / emergency_response → agent_response
    """

    # ── Input ────────────────────────────────────────────────
    patient_message: str                     # Current user message
    conversation_history: list[dict]         # [{role, content}, ...]
    initial_message: str                     # Very first symptom description

    # ── Symptom Collection ───────────────────────────────────
    category: Optional[str]                  # e.g. "headache", "chest_pain"
    identified_symptoms: list[str]           # ["headache", "dizziness"]
    questions_asked: list[str]               # Keys of questions already asked
    current_question_index: int              # Index in the question tree
    extracted_data: dict                     # Structured data from answers
    total_questions: int                     # Total questions for this category

    # ── Classification ───────────────────────────────────────
    severity: Optional[str]                  # "mild", "moderate", "emergency"
    is_emergency: bool                       # Emergency flag
    emergency_reason: Optional[str]          # Why it's an emergency
    red_flags: list[str]                     # Detected red flag conditions
    distilbert_score: float                  # DistilBERT confidence score

    # ── Analysis & Triage ────────────────────────────────────
    triage_result: Optional[dict]            # Full Gemini triage output
    urgency_score: int                       # 1-10 urgency rating

    # ── Remedies & Recommendations ───────────────────────────
    remedies: list[str]                      # Home remedy suggestions
    recommendations: list[str]              # Doctor/action recommendations
    warning_signs: list[str]                 # Signs to watch for

    # ── Output ───────────────────────────────────────────────
    agent_response: str                      # Final message to show the user
    next_step: str                           # "collect", "classify", "analyze", etc.
    current_node: str                        # Current node name for routing