"""
Comprehensive Backend Test Script for Swasthya Saathi AI Agent.
Tests all endpoints including the new conversational AI symptom agent.

Usage:
    python test_backend.py [--base-url http://localhost:8000]
"""

import sys
import json
import time
import requests
from datetime import datetime

# ─── Configuration ────────────────────────────────────────

BASE_URL = "http://localhost:8000"
if len(sys.argv) > 2 and sys.argv[1] == "--base-url":
    BASE_URL = sys.argv[2]

TEST_USER = {
    "full_name": f"Test User {int(time.time())}",
    "phone": f"99{int(time.time()) % 100000000:08d}",
    "email": f"test_{int(time.time())}@example.com",
    "password": "Test@1234",
    "date_of_birth": "1990-01-01",
    "gender": "male",
}

PASS = "\033[92m✅ PASS\033[0m"
FAIL = "\033[91m❌ FAIL\033[0m"
WARN = "\033[93m⚠️  WARN\033[0m"

results = {"passed": 0, "failed": 0, "warnings": 0}


def log_result(test_name, passed, detail="", warn=False):
    if warn:
        results["warnings"] += 1
        print(f"  {WARN} {test_name}: {detail}")
    elif passed:
        results["passed"] += 1
        print(f"  {PASS} {test_name}")
    else:
        results["failed"] += 1
        print(f"  {FAIL} {test_name}: {detail}")


def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# ═══════════════════════════════════════════════════════════
#  TEST 1: Health Check
# ═══════════════════════════════════════════════════════════

def test_health():
    section("1. HEALTH CHECK")
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=5)
        log_result("GET /health returns 200", r.status_code == 200, f"Got {r.status_code}")
        data = r.json()
        log_result("Response has status field", "status" in data, json.dumps(data))
        return True
    except requests.ConnectionError:
        log_result("Backend is reachable", False, f"Cannot connect to {BASE_URL}")
        return False


# ═══════════════════════════════════════════════════════════
#  TEST 2: Authentication
# ═══════════════════════════════════════════════════════════

def test_auth():
    section("2. AUTHENTICATION")
    
    # Register
    r = requests.post(f"{BASE_URL}/api/auth/register", json=TEST_USER, timeout=10)
    log_result("POST /api/auth/register returns 201", r.status_code == 201, f"Got {r.status_code}: {r.text[:200]}")
    
    if r.status_code != 201:
        return None
    
    data = r.json()
    token = data.get("access_token")
    log_result("Register returns access_token", token is not None, str(data.keys()))
    
    # Login
    login_data = {"phone": TEST_USER["phone"], "password": TEST_USER["password"]}
    r = requests.post(f"{BASE_URL}/api/auth/login", json=login_data, timeout=10)
    log_result("POST /api/auth/login returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
    
    if r.status_code == 200:
        token = r.json().get("access_token")
        log_result("Login returns access_token", token is not None)
    
    # Profile
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=10)
    log_result("GET /api/auth/me returns 200", r.status_code == 200, f"Got {r.status_code}")
    
    if r.status_code == 200:
        profile = r.json()
        log_result("Profile has correct name", profile.get("full_name") == TEST_USER["full_name"])
    
    return token


# ═══════════════════════════════════════════════════════════
#  TEST 3: Old Symptom Collection Flow (backward compat)
# ═══════════════════════════════════════════════════════════

def test_old_symptom_flow(token):
    section("3. LEGACY SYMPTOM COLLECTION (Backward Compatibility)")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Start consultation
    r = requests.post(f"{BASE_URL}/api/consultation/start", json={"language": "en"}, headers=headers, timeout=10)
    log_result("POST /start consultation returns 201", r.status_code == 201, f"Got {r.status_code}: {r.text[:200]}")
    
    if r.status_code != 201:
        return None
    
    session_id = r.json().get("id")
    log_result("Consultation ID received", session_id is not None)
    
    # Add symptom
    symptom = {
        "description": "Severe headache on the left side with throbbing pain",
        "body_part": "head",
        "duration": "3 days",
        "severity": 7,
    }
    r = requests.post(f"{BASE_URL}/api/consultation/{session_id}/symptoms", json=symptom, headers=headers, timeout=10)
    log_result("POST /symptoms returns 201", r.status_code == 201, f"Got {r.status_code}: {r.text[:200]}")
    
    # Record vitals
    vitals = {
        "temperature_f": 100.4,
        "blood_pressure_systolic": 130,
        "blood_pressure_diastolic": 85,
        "heart_rate": 88,
        "oxygen_saturation": 97.5,
        "respiratory_rate": 18,
    }
    r = requests.post(f"{BASE_URL}/api/consultation/{session_id}/vitals", json=vitals, headers=headers, timeout=10)
    log_result("POST /vitals returns 201", r.status_code == 201, f"Got {r.status_code}: {r.text[:200]}")
    
    return session_id


# ═══════════════════════════════════════════════════════════
#  TEST 4: Triage
# ═══════════════════════════════════════════════════════════

def test_triage(token, session_id):
    section("4. AI TRIAGE")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("  ⏳ Triggering AI triage (this calls Gemini, may take a few seconds)...")
    r = requests.post(f"{BASE_URL}/api/consultation/{session_id}/triage", headers=headers, timeout=60)
    log_result("POST /triage returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}")
    
    if r.status_code == 200:
        result = r.json()
        log_result("Triage has triage_level", result.get("triage_level") in ["mild", "moderate", "emergency"])
        log_result("Triage has primary_concern", result.get("primary_concern") is not None)
        log_result("Triage has recommendations", isinstance(result.get("recommendations"), list))
        log_result("Triage has urgency_score", isinstance(result.get("urgency_score"), int))
        print(f"\n  📋 Triage Result:")
        print(f"     Level: {result.get('triage_level')}")
        print(f"     Concern: {result.get('primary_concern', '')[:100]}")
        print(f"     Urgency: {result.get('urgency_score')}/10")
        return result
    
    return None


# ═══════════════════════════════════════════════════════════
#  TEST 5: AI Symptom Agent (NEW - Conversational)
# ═══════════════════════════════════════════════════════════

def test_symptom_agent(token):
    section("5. AI SYMPTOM AGENT (Conversational)")
    headers = {"Authorization": f"Bearer {token}"}
    
    # ─── Test 5a: Start interview with headache ──────
    print("\n  --- Test 5a: Start Interview (Headache) ---")
    start_data = {
        "initial_message": "I have a bad headache on the left side of my head since morning",
        "language": "en",
    }
    r = requests.post(f"{BASE_URL}/api/symptom-agent/start", json=start_data, headers=headers, timeout=30)
    log_result("POST /symptom-agent/start returns 201", r.status_code == 201, f"Got {r.status_code}: {r.text[:300]}")
    
    if r.status_code != 201:
        print(f"  Response: {r.text[:500]}")
        return None
    
    agent_response = r.json()
    session_id = agent_response.get("session_id")
    log_result("Agent returns session_id", session_id is not None)
    log_result("Agent returns agent_message", agent_response.get("agent_message") is not None)
    log_result("Conversation state is 'collecting'", agent_response.get("conversation_state") == "collecting")
    log_result("Turn number is 1", agent_response.get("turn_number") == 1)
    log_result("Symptoms identified", isinstance(agent_response.get("symptoms_identified"), list))
    
    print(f"\n  🤖 Agent: {agent_response.get('agent_message', '')[:150]}...")
    print(f"  📊 State: {agent_response.get('conversation_state')}, Progress: {agent_response.get('progress_pct')}%")
    
    # ─── Test 5b: Respond to first question ──────
    print("\n  --- Test 5b: Patient Response 1 ---")
    respond_data = {"message": "It's a throbbing pain on the left side, feels like pulsating"}
    r = requests.post(f"{BASE_URL}/api/symptom-agent/{session_id}/respond", json=respond_data, headers=headers, timeout=30)
    log_result("POST /respond returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}")
    
    if r.status_code == 200:
        resp = r.json()
        log_result("Agent asks next question", resp.get("agent_message") is not None)
        log_result("Turn number incremented", resp.get("turn_number", 0) > 1)
        print(f"\n  🤖 Agent: {resp.get('agent_message', '')[:150]}...")
        print(f"  📊 Progress: {resp.get('progress_pct')}%")
    
    # ─── Test 5c: Respond to second question ──────
    print("\n  --- Test 5c: Patient Response 2 ---")
    respond_data = {"message": "It started gradually this morning, not sudden"}
    r = requests.post(f"{BASE_URL}/api/symptom-agent/{session_id}/respond", json=respond_data, headers=headers, timeout=30)
    log_result("POST /respond (2) returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}")
    
    if r.status_code == 200:
        resp = r.json()
        print(f"\n  🤖 Agent: {resp.get('agent_message', '')[:150]}...")
        print(f"  📊 Progress: {resp.get('progress_pct')}%")
    
    # ─── Test 5d: Respond to third question ──────
    print("\n  --- Test 5d: Patient Response 3 ---")
    respond_data = {"message": "About 7 out of 10, its quite painful"}
    r = requests.post(f"{BASE_URL}/api/symptom-agent/{session_id}/respond", json=respond_data, headers=headers, timeout=30)
    log_result("POST /respond (3) returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}")
    
    if r.status_code == 200:
        resp = r.json()
        print(f"\n  🤖 Agent: {resp.get('agent_message', '')[:150]}...")
    
    # ─── Test 5e: Get conversation history ──────
    print("\n  --- Test 5e: Conversation History ---")
    r = requests.get(f"{BASE_URL}/api/symptom-agent/{session_id}/conversation", headers=headers, timeout=10)
    log_result("GET /conversation returns 200", r.status_code == 200, f"Got {r.status_code}")
    
    if r.status_code == 200:
        history = r.json()
        log_result("History has turns", len(history.get("turns", [])) > 0)
        log_result("Symptoms collected > 0", history.get("symptoms_collected", 0) > 0)
        print(f"  📜 Total turns: {len(history.get('turns', []))}")
    
    return session_id


# ═══════════════════════════════════════════════════════════
#  TEST 6: Complete Interview & Triage
# ═══════════════════════════════════════════════════════════

def test_complete_interview(token, session_id):
    section("6. COMPLETE INTERVIEW & TRIAGE")
    headers = {"Authorization": f"Bearer {token}"}
    
    print("  ⏳ Completing interview and triggering triage...")
    r = requests.post(f"{BASE_URL}/api/symptom-agent/{session_id}/complete", headers=headers, timeout=60)
    log_result("POST /complete returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:300]}")
    
    if r.status_code == 200:
        result = r.json()
        log_result("Has triage_level", result.get("triage_level") in ["mild", "moderate", "emergency"])
        log_result("Has recommendations", isinstance(result.get("recommendations"), list))
        log_result("Has primary_concern", result.get("primary_concern") is not None)
        print(f"\n  📋 Triage Result from Conversational Agent:")
        print(f"     Level: {result.get('triage_level')}")
        print(f"     Concern: {result.get('primary_concern', '')[:100]}")
        print(f"     Urgency: {result.get('urgency_score')}/10")
        if result.get("recommendations"):
            print(f"     Recommendations:")
            for rec in result["recommendations"][:3]:
                print(f"       - {rec[:80]}")


# ═══════════════════════════════════════════════════════════
#  TEST 7: Emergency Detection
# ═══════════════════════════════════════════════════════════

def test_emergency_detection(token):
    section("7. EMERGENCY RED FLAG DETECTION")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Start with emergency symptoms
    start_data = {
        "initial_message": "I have severe chest pain radiating to my left arm, I'm sweating a lot and feeling breathless",
        "language": "en",
    }
    r = requests.post(f"{BASE_URL}/api/symptom-agent/start", json=start_data, headers=headers, timeout=30)
    log_result("Emergency start returns 201", r.status_code == 201, f"Got {r.status_code}: {r.text[:300]}")
    
    if r.status_code == 201:
        resp = r.json()
        log_result("Emergency detected (is_emergency)", resp.get("is_emergency") == True, 
                   f"is_emergency={resp.get('is_emergency')}")
        log_result("Agent message contains warning", "⚠️" in resp.get("agent_message", "") or 
                   "emergency" in resp.get("agent_message", "").lower() or
                   "serious" in resp.get("agent_message", "").lower(),
                   f"Message: {resp.get('agent_message', '')[:100]}")
        print(f"\n  🚨 Agent: {resp.get('agent_message', '')[:200]}")


# ═══════════════════════════════════════════════════════════
#  TEST 8: Different Symptom Types
# ═══════════════════════════════════════════════════════════

def test_different_symptoms(token):
    section("8. DIFFERENT SYMPTOM CATEGORIES")
    headers = {"Authorization": f"Bearer {token}"}
    
    test_cases = [
        ("Fever", "I have had high fever since 2 days with chills and body ache"),
        ("Cough", "I have a persistent dry cough for the past week, worse at night"),
        ("Abdominal Pain", "My stomach hurts on the lower right side, sharp pain"),
        ("Breathing", "I am having difficulty breathing, especially when climbing stairs"),
    ]
    
    for symptom_name, message in test_cases:
        print(f"\n  --- {symptom_name} ---")
        start_data = {"initial_message": message, "language": "en"}
        r = requests.post(f"{BASE_URL}/api/symptom-agent/start", json=start_data, headers=headers, timeout=30)
        
        if r.status_code == 201:
            resp = r.json()
            log_result(f"{symptom_name}: Agent responds", resp.get("agent_message") is not None)
            log_result(f"{symptom_name}: Symptoms identified", len(resp.get("symptoms_identified", [])) > 0,
                       f"Identified: {resp.get('symptoms_identified', [])}")
            print(f"  🤖 {resp.get('agent_message', '')[:120]}...")
        else:
            log_result(f"{symptom_name}: Start returns 201", False, f"Got {r.status_code}")


# ═══════════════════════════════════════════════════════════
#  RUN ALL TESTS
# ═══════════════════════════════════════════════════════════

def main():
    print(f"\n{'#'*60}")
    print(f"  SWASTHYA SAATHI - BACKEND TEST SUITE")
    print(f"  Target: {BASE_URL}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'#'*60}")
    
    # Test 1: Health check
    if not test_health():
        print(f"\n{FAIL} Backend is not reachable at {BASE_URL}")
        print(f"  Make sure the server is running:")
        print(f"  cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return
    
    # Test 2: Authentication
    token = test_auth()
    if not token:
        print(f"\n{FAIL} Authentication failed — cannot proceed with remaining tests.")
        return
    
    # Test 3: Legacy symptom flow
    old_session_id = test_old_symptom_flow(token)
    
    # Test 4: Triage on legacy flow
    if old_session_id:
        test_triage(token, old_session_id)
    
    # Test 5: AI Symptom Agent (Conversational)
    agent_session_id = test_symptom_agent(token)
    
    # Test 6: Complete interview
    if agent_session_id:
        test_complete_interview(token, agent_session_id)
    
    # Test 7: Emergency detection
    test_emergency_detection(token)
    
    # Test 8: Different symptoms
    test_different_symptoms(token)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"  TEST SUMMARY")
    print(f"{'='*60}")
    total = results["passed"] + results["failed"]
    print(f"  ✅ Passed:   {results['passed']}/{total}")
    print(f"  ❌ Failed:   {results['failed']}/{total}")
    print(f"  ⚠️  Warnings: {results['warnings']}")
    
    if results["failed"] == 0:
        print(f"\n  🎉 ALL TESTS PASSED! Your AI agent backend is working correctly.")
    else:
        print(f"\n  ⚠️  Some tests failed. Check the output above for details.")
    print()


if __name__ == "__main__":
    main()
