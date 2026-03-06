"""
Real-Time Connection Monitor
Shows you exactly what's happening on both Frontend and Backend
"""

import requests
import time
from datetime import datetime

BACKEND_URL = "http://192.168.31.66:8000"

def print_banner():
    print("\n" + "=" * 70)
    print("  🔄 REAL-TIME CONNECTION MONITOR")
    print("=" * 70)
    print(f"  Backend: {BACKEND_URL}")
    print(f"  Time: {datetime.now().strftime('%H:%M:%S')}")
    print("=" * 70 + "\n")

def simulate_frontend_actions():
    """
    Simulates what your phone's frontend does.
    Watch the backend server logs while this runs!
    """
    
    print("📱 SIMULATING FRONTEND ACTIONS (what your phone does):\n")
    
    # 1. Health Check (app startup)
    print("1️⃣  Frontend: Opening app → Checking backend health...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"   ✅ Backend Response: {response.status_code}")
        print(f"   📊 {response.json()}")
        print(f"   👀 CHECK BACKEND LOGS → You should see: GET /health")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return
    
    time.sleep(2)
    
    # 2. User Registration
    print("\n2️⃣  Frontend: User taps 'Register'...")
    test_user = {
        "full_name": f"Test User {int(time.time())}",
        "phone": f"99{int(time.time()) % 100000000:08d}",
        "password": "Test@1234",
        "gender": "male"
    }
    try:
        response = requests.post(f"{BACKEND_URL}/api/auth/register", json=test_user, timeout=10)
        print(f"   ✅ Backend Response: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            token = data.get("access_token")
            print(f"   🔑 Got Token: {token[:30]}...")
            print(f"   👀 CHECK BACKEND LOGS → You should see: POST /api/auth/register 201")
        else:
            print(f"   📄 {response.text[:100]}")
            return
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return
    
    time.sleep(2)
    
    # 3. Get Profile
    print("\n3️⃣  Frontend: Loading user profile...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/api/auth/me", headers=headers, timeout=5)
        print(f"   ✅ Backend Response: {response.status_code}")
        if response.status_code == 200:
            profile = response.json()
            print(f"   👤 User: {profile.get('full_name')}")
            print(f"   👀 CHECK BACKEND LOGS → You should see: GET /api/auth/me")
    except Exception as e:
        print(f"   ⚠️  Profile fetch issue: {e}")
    
    time.sleep(2)
    
    # 4. Start Consultation
    print("\n4️⃣  Frontend: User starts symptom check...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BACKEND_URL}/api/consultation/start", 
                                json={"language": "en"}, 
                                headers=headers, 
                                timeout=10)
        print(f"   ✅ Backend Response: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            session_id = data.get("id")
            print(f"   📝 Session Created: {session_id}")
            print(f"   👀 CHECK BACKEND LOGS → You should see: POST /api/consultation/start 201")
        else:
            print(f"   📄 {response.text[:100]}")
            return
    except Exception as e:
        print(f"   ❌ Failed: {e}")
        return
    
    time.sleep(2)
    
    # 5. Start AI Interview
    print("\n5️⃣  Frontend: User describes symptom to AI agent...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        data = {
            "initial_message": "I have a bad headache on the left side of my head",
            "language": "en"
        }
        response = requests.post(f"{BACKEND_URL}/api/symptom-agent/start", 
                                json=data, 
                                headers=headers, 
                                timeout=30)
        print(f"   ✅ Backend Response: {response.status_code}")
        if response.status_code == 201:
            result = response.json()
            print(f"   🤖 AI Agent Says: {result.get('agent_message', '')[:80]}...")
            print(f"   📊 Symptom Detected: {result.get('symptoms_identified', [])}")
            print(f"   👀 CHECK BACKEND LOGS → You should see: POST /api/symptom-agent/start 201")
        else:
            print(f"   📄 {response.text[:100]}")
    except Exception as e:
        print(f"   ❌ Failed: {e}")
    
    time.sleep(2)
    
    # Summary
    print("\n" + "=" * 70)
    print("  ✅ SIMULATION COMPLETE!")
    print("=" * 70)
    print("\n  📱 WHAT YOU SHOULD SEE ON EXPO GO APP:")
    print("     • App loads without errors")
    print("     • Registration/Login screen appears")
    print("     • Can create account and login")
    print("     • Can navigate to symptom checker")
    print("     • AI agent responds to symptoms")
    print()
    print("  🖥️  WHAT YOU SHOULD SEE IN BACKEND LOGS:")
    print("     • GET /health 200")
    print("     • POST /api/auth/register 201")
    print("     • GET /api/auth/me 200")
    print("     • POST /api/consultation/start 201")
    print("     • POST /api/symptom-agent/start 201")
    print()
    print("  🎯 If you see these in backend logs = CONNECTED ✅")
    print("  ❌ If backend logs are silent = NOT CONNECTED")
    print()


if __name__ == "__main__":
    print_banner()
    input("Press ENTER to start simulation (watch the backend logs window!) ")
    simulate_frontend_actions()
