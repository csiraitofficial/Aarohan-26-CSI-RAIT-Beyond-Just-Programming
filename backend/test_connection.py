"""
Connection Test Script - Verify Frontend can reach Backend

This simulates what the Expo Go app does when connecting to the backend.
Run this from your PC to verify the connection works.
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "http://192.168.31.66:8000"

def test_connection():
    print("=" * 70)
    print("  🔗 FRONTEND-BACKEND CONNECTION TEST")
    print("=" * 70)
    print(f"\n📍 Testing connection to: {BACKEND_URL}")
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    tests = []
    
    # Test 1: Health Check
    print("1️⃣  Testing /health endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check passed")
            print(f"   📊 Service: {data.get('service')}, Version: {data.get('version')}")
            tests.append(("Health Check", True))
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            tests.append(("Health Check", False))
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        tests.append(("Health Check", False))
        return tests
    
    # Test 2: Register endpoint (what frontend uses first)
    print("\n2️⃣  Testing /api/auth/register endpoint...")
    try:
        test_user = {
            "full_name": "Connection Test User",
            "phone": f"9999{int(datetime.now().timestamp()) % 1000000:06d}",
            "password": "Test@1234",
            "gender": "male"
        }
        response = requests.post(f"{BACKEND_URL}/api/auth/register", json=test_user, timeout=10)
        if response.status_code == 201:
            data = response.json()
            print(f"   ✅ Registration works")
            print(f"   🔑 Got access token: {data.get('access_token', '')[:20]}...")
            tests.append(("Registration", True))
            token = data.get('access_token')
        else:
            print(f"   ❌ Registration failed: {response.status_code}")
            print(f"   📄 Response: {response.text[:200]}")
            tests.append(("Registration", False))
            return tests
    except Exception as e:
        print(f"   ❌ Registration failed: {e}")
        tests.append(("Registration", False))
        return tests
    
    # Test 3: Protected endpoint (requires authentication)
    print("\n3️⃣  Testing /api/auth/me endpoint (authenticated)...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BACKEND_URL}/api/auth/me", headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Authenticated request works")
            print(f"   👤 User: {data.get('full_name')}")
            tests.append(("Authentication", True))
        else:
            print(f"   ❌ Auth failed: {response.status_code}")
            tests.append(("Authentication", False))
    except Exception as e:
        print(f"   ❌ Auth request failed: {e}")
        tests.append(("Authentication", False))
    
    # Test 4: Start consultation (what frontend does)
    print("\n4️⃣  Testing /api/consultation/start endpoint...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BACKEND_URL}/api/consultation/start", 
                                json={"language": "en"}, 
                                headers=headers, 
                                timeout=10)
        if response.status_code == 201:
            data = response.json()
            print(f"   ✅ Consultation creation works")
            print(f"   📝 Session ID: {data.get('id', '')[:36]}")
            tests.append(("Consultation", True))
        else:
            print(f"   ❌ Consultation failed: {response.status_code}")
            tests.append(("Consultation", False))
    except Exception as e:
        print(f"   ❌ Consultation request failed: {e}")
        tests.append(("Consultation", False))
    
    return tests


def main():
    tests = test_connection()
    
    # Summary
    print("\n" + "=" * 70)
    print("  📊 SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in tests if result)
    total = len(tests)
    
    for test_name, result in tests:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}  {test_name}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n  🎉 All tests passed! Your Expo Go app should connect successfully.")
        print("\n  📱 On your phone:")
        print("     1. Open Expo Go app")
        print("     2. Scan the QR code from the 'Expo Dev Server' window")
        print("     3. The app should load and connect to the backend")
        print("\n  🔍 Monitor backend logs in the backend server window")
    else:
        print("\n  ⚠️  Some tests failed. Check the errors above.")
        if not tests or not tests[0][1]:
            print("\n  💡 Backend is not accessible. Make sure:")
            print("     1. Backend server is running (check the PowerShell window)")
            print("     2. Firewall allows connections on port 8000")
            print("     3. You're using the correct IP: 192.168.31.66")
    
    print()


if __name__ == "__main__":
    main()
