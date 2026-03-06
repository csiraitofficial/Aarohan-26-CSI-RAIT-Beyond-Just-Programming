# Swasthya Saathi - AI Agent Backend

A multilingual health platform powered by **Google Gemini AI** that collects symptoms & vitals, provides basic guidance, and triages cases into **mild**, **moderate**, or **emergency** categories.

## Features

- **AI Symptom Analysis & Triage**: Collects symptoms iteratively and uses Google Gemini AI for intelligent health risk classification
- **Rule-Based Safety Overrides**: Critical vitals (SpO2<90%, BP>180/120, Temp>104°F, HR>150/<40) automatically trigger emergency alerts
- **Multi-Language Support**: Responds in 12+ Indian languages (Hindi, Bengali, Tamil, Telugu, Marathi, etc.)
- **Consultation History**: Complete digital health records with symptoms, vitals, and triage results
- **JWT Authentication**: Secure token-based auth for mobile app integration

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Python FastAPI |
| AI Service | Google Gemini 2.0 Flash |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose) + bcrypt |
| Testing | pytest + TestClient |

## Quick Start

### 1. Clone & Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 3. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new patient |
| POST | `/api/auth/login` | Login with phone + password |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update user profile |

### Consultation & Symptom Collection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/consultation/start` | Start a new consultation session |
| POST | `/api/consultation/{id}/symptoms` | Add a symptom |
| POST | `/api/consultation/{id}/symptoms/batch` | Add multiple symptoms |
| POST | `/api/consultation/{id}/vitals` | Record vital signs |
| GET | `/api/consultation/{id}/symptoms` | Get all symptoms for session |
| GET | `/api/consultation/{id}/vitals` | Get vitals for session |

### AI Triage
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/consultation/{id}/triage` | Trigger AI triage analysis |
| GET | `/api/consultation/{id}/result` | Get triage result |
| GET | `/api/consultation/{id}/detail` | Get full consultation detail |
| GET | `/api/consultation/history` | Get consultation history |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/status` | API status & features |

## Triage Flow

```
1. Register/Login → Get JWT Token
2. POST /consultation/start → Get session_id
3. POST /consultation/{id}/symptoms → Add symptoms (repeatable)
4. POST /consultation/{id}/vitals → Record vitals
5. POST /consultation/{id}/triage → Get AI analysis
   → Returns: severity, recommendations, warning signs, home remedies
```

## Running Tests

```bash
cd backend
python -m pytest tests/ -v
```

## Project Structure

```
backend/
├── app/
│   ├── api/               # API route handlers
│   │   ├── auth.py        # Registration & login
│   │   ├── health.py      # Health checks
│   │   ├── symptom_collection.py  # Symptom & vitals endpoints
│   │   └── triage.py      # Triage & history endpoints
│   ├── core/              # Core utilities
│   │   ├── auth.py        # JWT & password hashing
│   │   └── config.py      # Environment configuration
│   ├── db/                # Database layer
│   │   └── database.py    # SQLAlchemy setup
│   ├── models/            # ORM models
│   │   └── models.py      # User, Consultation, Symptom, Vitals
│   ├── schemas/           # Pydantic schemas
│   │   ├── consultation.py
│   │   ├── symptom.py
│   │   └── user.py
│   ├── services/          # Business logic
│   │   ├── gemini_service.py    # Google Gemini AI integration
│   │   └── triage_service.py    # Triage engine with safety overrides
│   └── main.py            # FastAPI app entry point
├── tests/                 # Test suite
├── requirements.txt
├── .env.example
└── README.md
```

## License

MIT
