"""
Test script to verify Gemini API key is working correctly.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

print("=" * 60)
print("  GEMINI API KEY TEST")
print("=" * 60)

if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
    print("\n❌ No valid GEMINI_API_KEY found in .env file")
    print("   Please add a valid key to backend/.env")
    sys.exit(1)

print(f"\n✅ Key found: {GEMINI_API_KEY[:10]}...{GEMINI_API_KEY[-5:]}")
print("\n⏳ Testing Gemini API connection...")

try:
    import google.generativeai as genai
    
    genai.configure(api_key=GEMINI_API_KEY)
    
    # Test with a simple prompt
    model = genai.GenerativeModel("gemini-2.0-flash")
    
    test_prompt = """
    Analyze this symptom:
    - Headache, left side, throbbing pain
    - Duration: 3 hours
    - Severity: 7/10
    
    Provide a triage level (mild/moderate/emergency) and brief reason.
    """
    
    response = model.generate_content(test_prompt)
    
    print("\n✅ Gemini API is working!")
    print("\n📄 Test Response:")
    print("-" * 60)
    print(response.text[:300])
    if len(response.text) > 300:
        print("...")
    print("-" * 60)
    
    print("\n✅ Success! Your Gemini API key is valid and working.")
    
except ImportError:
    print("\n⚠️  google-generativeai package not found")
    print("   Installing...")
    os.system(f"{sys.executable} -m pip install google-generativeai")
    print("\n   Please run this script again.")
    
except Exception as e:
    print(f"\n❌ Error testing Gemini API: {e}")
    print("\n   Possible issues:")
    print("   1. Invalid API key")
    print("   2. API quota exceeded")
    print("   3. Network connectivity issues")
    print("\n   Get a key at: https://aistudio.google.com/app/apikey")
    sys.exit(1)

print("\n" + "=" * 60)
