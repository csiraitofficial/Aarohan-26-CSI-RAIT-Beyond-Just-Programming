# 🧠 SwasthyaSaathi — LangGraph AI Agent Architecture

## Overview

SwasthyaSaathi uses a **LangGraph sequential AI agent pipeline** with **DistilBERT emergency classification** to provide intelligent health assistance. One single agent follows this exact flow:

```
User Input → Collect Symptoms (3-6 Qs) → Classify Severity (DistilBERT)
→ AI Analysis (Gemini) → Suggest Remedies → Connect Doctor / Call Emergency
→ Guide Until Help Arrives
```

### Agent Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LangGraph StateGraph                     │
│                                                             │
│  START ──► [1. COLLECT SYMPTOMS] ◄─── (loop: 3-6 questions) │
│                     │                                       │
│                     ▼                                       │
│            [2. CLASSIFY SEVERITY]                           │
│             DistilBERT + Red Flags                          │
│                 │            │                              │
│          CRITICAL│            │ MILD/MODERATE               │
│                 ▼            ▼                              │
│     [5b. EMERGENCY]    [3. AI ANALYSIS]                    │
│     Call 108 + Aid      Gemini Triage                      │
│          │                   │                              │
│          ▼                   ▼                              │
│     [6. GUIDE]        [4. SUGGEST REMEDIES]                │
│     Until Help          21 Indian Remedies                 │
│     Arrives                  │                              │
│          │                   ▼                              │
│          │            [5a. CONNECT DOCTOR]                  │
│          ▼                   │                              │
│         END                 END                             │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| AI Agent Framework | **LangGraph** (State Graph) |
| Emergency Classifier | **DistilBERT** (zero-shot, ~50ms) |
| LLM for Conversations | **Google Gemini 2.0 Flash** |
| Backend Framework | **FastAPI** (Python) |
| Database | **SQLite** (SQLAlchemy ORM) |
| Auth | **JWT** (python-jose) |

---

## Files Changed / Created

### New Files (`backend/app/agents/`)

| File | Purpose |
|------|---------|
| `__init__.py` | Package init |
| `state.py` | `AgentState` TypedDict — shared state flowing through all nodes |
| `emergency_classifier.py` | DistilBERT zero-shot emergency classifier with keyword fallback |
| `remedies.py` | 21 culturally relevant Indian home remedies database |
| `nodes.py` | 6 sequential node functions (collect → classify → analyze → remedies → doctor/emergency) |
| `graph.py` | LangGraph `StateGraph` wiring + `run_initial_assessment()`, `run_follow_up()`, `run_complete_assessment()` |

### Modified Files

| File | Change |
|------|--------|
| `backend/app/services/conversational_agent.py` | `start_interview()` and `process_response()` now use the LangGraph pipeline |
| `backend/requirements.txt` | Added `langgraph`, `langchain-core`, `langchain-google-genai`, `transformers`, `torch` |

---

## Setup & Installation

### 1. Create Virtual Environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
# Core packages
pip install -r requirements.txt

# If requirements.txt install fails due to resolver, install in two phases:
pip install fastapi==0.115.0 "uvicorn[standard]==0.30.6" sqlalchemy==2.0.35 pydantic==2.9.2 pydantic-settings==2.5.2 "python-jose[cryptography]==3.3.0" "passlib[bcrypt]==1.7.4" google-generativeai==0.8.3 python-multipart==0.0.12 alembic==1.13.3 python-dotenv==1.0.1 httpx==0.27.2 pytest==8.3.3 pytest-asyncio==0.24.0 slowapi==0.1.9 bcrypt==4.0.1

pip install langgraph langchain-core langchain-google-genai transformers torch
```

### 3. Set Gemini API Key

```powershell
$env:GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"
```

Or create a `.env` file in the `backend/` directory:
```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 4. Start the Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Note:** First request takes ~10 seconds as DistilBERT model loads. Subsequent requests are fast.

### 5. Verify Health

```powershell
Invoke-RestMethod -Uri http://localhost:8000/health
```

Expected:
```
status    : ok
service   : SwasthyaSaathi
version   : 1.0.0
database  : healthy
```

---

## API Usage & Example Responses

### Step 1: Register a User

```powershell
$body = @{
    full_name = "Test User"
    email     = "test@test.com"
    phone     = "9999999999"
    password  = "Test1234"
    gender    = "male"
    age       = 25
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/api/auth/register -Method POST -Body $body -ContentType "application/json"
```

**Response:**
```json
{
    "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Step 2: Login

```powershell
$login = @{
    email    = "test@test.com"
    phone    = "9999999999"
    password = "Test1234"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:8000/api/auth/login -Method POST -Body $login -ContentType "application/json"
$token = $response.access_token
$headers = @{ Authorization = "Bearer $token" }
```

### Step 3: Start AI Symptom Interview (Normal Case)

```powershell
$start = @{ initial_message = "I have a bad headache and feel dizzy since morning" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/symptom-agent/start -Method POST -Body $start -ContentType "application/json" -Headers $headers
```

**Response:**
```json
{
    "session_id": "ff338bc4-a7cc-4b08-ab0a-3680c3f373c1",
    "agent_message": "I understand you're not feeling well. Where exactly is the pain? (front of head, back of head, one side, both sides, behind eyes)?",
    "conversation_state": "collecting",
    "turn_number": 1,
    "question_type": "location",
    "options": ["Front of head", "Back of head", "One side", "Both sides", "Behind eyes"],
    "symptoms_identified": ["I have a bad headache and feel dizzy since morning"],
    "is_emergency": false,
    "emergency_message": null,
    "progress_pct": 0
}
```

### Step 4: Respond to Agent Questions

```powershell
$sessionId = "ff338bc4-a7cc-4b08-ab0a-3680c3f373c1"  # Use YOUR session_id from Step 3
$respond = @{ message = "It's a throbbing pain on the left side, severity about 6" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/symptom-agent/$sessionId/respond -Method POST -Body $respond -ContentType "application/json" -Headers $headers
```

**Response:**
```json
{
    "session_id": "ff338bc4-...",
    "agent_message": "Thank you for sharing that. When did this headache start — was it sudden or gradual?",
    "conversation_state": "collecting",
    "turn_number": 2,
    "question_type": "onset",
    "options": ["Suddenly", "Gradually"],
    "is_emergency": false,
    "progress_pct": 15
}
```

Keep responding until `conversation_state` becomes `"complete"`.

### Step 5: Get Triage + Remedies

```powershell
Invoke-RestMethod -Uri http://localhost:8000/api/symptom-agent/$sessionId/complete -Method POST -ContentType "application/json" -Headers $headers
```

**Response:**
```json
{
    "session_id": "ff338bc4-...",
    "message": "Symptom interview complete. Here is your assessment.",
    "triage_level": "mild",
    "urgency_score": 3,
    "primary_concern": "Tension-type headache with dizziness",
    "recommendations": [
        "Monitor symptoms for the next 24-48 hours",
        "Take OTC pain relief (paracetamol) if needed",
        "Consult a doctor if symptoms persist or worsen"
    ],
    "warning_signs": ["Sudden severe headache", "Vision changes", "Neck stiffness"],
    "home_remedies": ["Cold compress on forehead", "Rest in dark quiet room", "Ginger tea"],
    "follow_up_needed": true,
    "follow_up_timeframe": "2-3 days if symptoms persist"
}
```

### Step 6: Test Emergency Detection 🚨

```powershell
$emergency = @{ initial_message = "I have severe chest pain spreading to my left arm and I'm sweating heavily" } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/api/symptom-agent/start -Method POST -Body $emergency -ContentType "application/json" -Headers $headers
```

**Response:**
```json
{
    "session_id": "1525b90f-...",
    "agent_message": "🚨 EMERGENCY ALERT: radiating to arm/jaw with sweating\n\n📞 CALL AMBULANCE NOW: 108 (India Emergency)\nAlternative: 112 (National Emergency)\n\n⚠️ WHILE WAITING FOR HELP:\n1. Sit upright — do NOT lie flat\n2. Loosen tight clothing\n3. Chew 1 aspirin (300mg) if not allergic\n4. Do NOT eat or drink anything else\n5. Stay calm and breathe slowly\n\n❌ DO NOT:\n- Do NOT drive yourself to the hospital\n- Do NOT eat or drink unless instructed\n- Do NOT leave the person alone\n\n✅ An alert has been sent to nearby emergency doctors.",
    "conversation_state": "collecting",
    "turn_number": 1,
    "is_emergency": true,
    "emergency_message": "radiating to arm/jaw with sweating"
}
```

---

## Interactive API Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc