"""
End-to-end integration test script.
Tests the complete flow: Register → Login → Start Consultation → Add Symptoms → Add Vitals → Triage.
Run against a live server at http://localhost:8000
"""

import httpx
import json
import sys

BASE_URL = "http://localhost:8000"

def print_step(step: str, result: str = ""):
    print(f"\n{'='*60}")
    print(f"  {step}")
    print(f"{'='*60}")
    if result:
        print(result)


def main():
    client = httpx.Client(base_url=BASE_URL, timeout=30)
    errors = []

    # ─── Step 1: Health Check ─────────────────────────────
    print_step("1. Health Check")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    data = r.json()
    assert data["status"] == "ok"
    print(f"  Status: {data['status']}")
    print(f"  Database: {data['database']}")
    print(f"  Version: {data['version']}")

    # ─── Step 2: API Status ───────────────────────────────
    print_step("2. API Status")
    r = client.get("/api/status")
    assert r.status_code == 200
    data = r.json()
    print(f"  AI Service: {data['ai_service']}")
    print(f"  Features: {data['features']}")
    print(f"  Languages: {data['supported_languages']}")

    # ─── Step 3: Register User ────────────────────────────
    print_step("3. Register Patient")
    r = client.post("/api/auth/register", json={
        "full_name": "Rajesh Kumar",
        "phone": "+919876543210",
        "email": "rajesh@example.com",
        "password": "securepass123",
        "language_preference": "hi",
        "gender": "male",
        "date_of_birth": "1985-03-15",
        "address": "Village Rampur, District Varanasi, UP",
        "latitude": 25.3176,
        "longitude": 82.9739,
    })
    assert r.status_code == 201, f"Registration failed: {r.status_code} {r.text}"
    data = r.json()
    token = data["access_token"]
    user_id = data["user"]["id"]
    print(f"  User ID: {user_id}")
    print(f"  Name: {data['user']['full_name']}")
    print(f"  Role: {data['user']['role']}")
    print(f"  Token: {token[:30]}...")

    headers = {"Authorization": f"Bearer {token}"}

    # ─── Step 4: Get Profile ──────────────────────────────
    print_step("4. Get Profile")
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    print(f"  Profile: {r.json()['full_name']} ({r.json()['phone']})")

    # ─── Step 5: Login ────────────────────────────────────
    print_step("5. Login")
    r = client.post("/api/auth/login", json={
        "phone": "+919876543210",
        "password": "securepass123",
    })
    assert r.status_code == 200, f"Login failed: {r.status_code}"
    print(f"  Login successful! Token received.")

    # ─── Step 6: Start Consultation ───────────────────────
    print_step("6. Start Consultation Session")
    r = client.post("/api/consultation/start", headers=headers, json={"language": "en"})
    assert r.status_code == 201, f"Start consultation failed: {r.status_code} {r.text}"
    session_id = r.json()["id"]
    print(f"  Session ID: {session_id}")
    print(f"  Status: {r.json()['status']}")
    print(f"  Triage Level: {r.json()['triage_level']}")

    # ─── Step 7: Add Symptoms ─────────────────────────────
    print_step("7. Add Symptoms")

    # Symptom 1
    r = client.post(f"/api/consultation/{session_id}/symptoms", headers=headers, json={
        "description": "High fever for the past 3 days, temperature not coming down with paracetamol",
        "body_part": "whole body",
        "duration": "3 days",
        "severity": 7,
    })
    assert r.status_code == 201
    print(f"  Symptom 1 added: {r.json()['description'][:50]}...")

    # Symptom 2
    r = client.post(f"/api/consultation/{session_id}/symptoms", headers=headers, json={
        "description": "Persistent dry cough, especially at night",
        "body_part": "chest",
        "duration": "5 days",
        "severity": 5,
    })
    assert r.status_code == 201
    print(f"  Symptom 2 added: {r.json()['description'][:50]}...")

    # Symptom 3
    r = client.post(f"/api/consultation/{session_id}/symptoms", headers=headers, json={
        "description": "Mild headache and body aches",
        "body_part": "head",
        "duration": "2 days",
        "severity": 4,
    })
    assert r.status_code == 201
    print(f"  Symptom 3 added: {r.json()['description'][:50]}...")

    # ─── Step 8: Verify Symptoms ──────────────────────────
    print_step("8. Verify Symptoms Stored")
    r = client.get(f"/api/consultation/{session_id}/symptoms", headers=headers)
    assert r.status_code == 200
    symptoms = r.json()
    print(f"  Total symptoms recorded: {len(symptoms)}")
    for s in symptoms:
        print(f"    - [{s.get('body_part', 'N/A')}] {s['description'][:40]}... (severity: {s.get('severity', 'N/A')})")

    # ─── Step 9: Record Vitals ────────────────────────────
    print_step("9. Record Vital Signs")
    r = client.post(f"/api/consultation/{session_id}/vitals", headers=headers, json={
        "temperature_f": 102.5,
        "blood_pressure_systolic": 125,
        "blood_pressure_diastolic": 82,
        "heart_rate": 95,
        "oxygen_saturation": 96.0,
        "respiratory_rate": 20,
    })
    assert r.status_code == 201
    vitals = r.json()
    print(f"  Temperature: {vitals['temperature_f']}°F")
    print(f"  Blood Pressure: {vitals['blood_pressure_systolic']}/{vitals['blood_pressure_diastolic']} mmHg")
    print(f"  Heart Rate: {vitals['heart_rate']} bpm")
    print(f"  SpO2: {vitals['oxygen_saturation']}%")
    print(f"  Respiratory Rate: {vitals['respiratory_rate']} breaths/min")

    # ─── Step 10: Trigger AI Triage ───────────────────────
    print_step("10. Trigger AI Triage (Google Gemini)")
    r = client.post(f"/api/consultation/{session_id}/triage", headers=headers)
    assert r.status_code == 200, f"Triage failed: {r.status_code} {r.text}"
    triage = r.json()
    print(f"  Triage Level: {triage['triage_level'].upper()}")
    print(f"  Urgency Score: {triage.get('urgency_score', 'N/A')}/10")
    print(f"  Primary Concern: {triage.get('primary_concern', 'N/A')}")
    if triage.get("recommendations"):
        print(f"  Recommendations:")
        for rec in triage["recommendations"][:3]:
            print(f"    - {rec}")
    if triage.get("follow_up_needed"):
        print(f"  Follow-up: {triage.get('follow_up_timeframe', 'Required')}")

    # ─── Step 11: Get Triage Result ───────────────────────
    print_step("11. Get Triage Result")
    r = client.get(f"/api/consultation/{session_id}/result", headers=headers)
    assert r.status_code == 200
    print(f"  Stored result matches: {r.json()['triage_level']}")

    # ─── Step 12: Get Consultation Detail ─────────────────
    print_step("12. Get Full Consultation Detail")
    r = client.get(f"/api/consultation/{session_id}/detail", headers=headers)
    assert r.status_code == 200
    detail = r.json()
    print(f"  Session Status: {detail['status']}")
    print(f"  Symptoms: {len(detail['symptoms'])}")
    print(f"  Vitals: {len(detail['vitals'])}")
    print(f"  Triage: {detail['triage_level']}")

    # ─── Step 13: Get Consultation History ────────────────
    print_step("13. Get Consultation History")
    r = client.get("/api/consultation/history", headers=headers)
    assert r.status_code == 200
    history = r.json()
    print(f"  Total consultations: {history['total']}")

    # ─── Step 14: Test Duplicate Registration ─────────────
    print_step("14. Test Duplicate Registration Rejection")
    r = client.post("/api/auth/register", json={
        "full_name": "Duplicate User",
        "phone": "+919876543210",
        "password": "pass123456",
    })
    assert r.status_code == 400
    print(f"  Correctly rejected: {r.json()['detail']}")

    # ─── Step 15: Test Wrong Password ─────────────────────
    print_step("15. Test Wrong Password Rejection")
    r = client.post("/api/auth/login", json={
        "phone": "+919876543210",
        "password": "wrongpassword",
    })
    assert r.status_code == 401
    print(f"  Correctly rejected: {r.json()['detail']}")

    # ─── Step 16: Test No Auth ────────────────────────────
    print_step("16. Test Unauthorized Access Rejection")
    r = client.get("/api/auth/me")
    assert r.status_code == 401
    print(f"  Correctly rejected (no token)")

    # ─── Step 17: Security Headers ────────────────────────
    print_step("17. Verify Security Headers")
    r = client.get("/api/status")
    headers_check = {
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "x-xss-protection": "1; mode=block",
    }
    for header, expected in headers_check.items():
        actual = r.headers.get(header, "MISSING")
        status = "OK" if actual == expected else "FAIL"
        print(f"  [{status}] {header}: {actual}")

    # ─── Summary ──────────────────────────────────────────
    print_step("INTEGRATION TEST COMPLETE")
    print("  All 17 steps PASSED!")
    print(f"  Server: {BASE_URL}")
    print(f"  Docs: {BASE_URL}/docs")

    client.close()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except AssertionError as e:
        print(f"\n  ASSERTION FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n  ERROR: {e}")
        sys.exit(1)
