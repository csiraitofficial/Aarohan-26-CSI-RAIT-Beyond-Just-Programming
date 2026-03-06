"""
Interactive CLI to chat with the Swasthya Saathi AI Symptom Agent.

Usage:
    python chat_agent.py [--base-url http://localhost:8000]

This lets you have a real conversation with the AI agent,
simulating the patient experience.
"""

import sys
import json
import time
import requests
from getpass import getpass

# ─── Configuration ────────────────────────────────────────

BASE_URL = "http://localhost:8000"
if len(sys.argv) > 2 and sys.argv[1] == "--base-url":
    BASE_URL = sys.argv[2]

# ─── Colors ───────────────────────────────────────────────

CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"
DIM = "\033[2m"


def print_banner():
    print(f"""
{CYAN}{BOLD}╔══════════════════════════════════════════════════════════╗
║          🩺 Swasthya Saathi AI Symptom Agent 🩺          ║
║              Interactive Chat Console                    ║
╚══════════════════════════════════════════════════════════╝{RESET}
""")


def print_agent(message, is_emergency=False):
    color = RED if is_emergency else GREEN
    print(f"\n  {color}{BOLD}🤖 Agent:{RESET} {color}{message}{RESET}\n")


def print_info(label, value):
    print(f"  {DIM}{label}: {value}{RESET}")


def authenticate():
    """Login or register a test user."""
    print(f"{YELLOW}─── Authentication ───{RESET}")
    print(f"  1. Login with existing account")
    print(f"  2. Register a new test account")
    print(f"  3. Quick-register (auto-generate test account)")
    
    choice = input(f"\n  {BOLD}Choose [1/2/3]: {RESET}").strip()
    
    if choice == "1":
        phone = input(f"  Phone: ").strip()
        password = getpass(f"  Password: ")
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"phone": phone, "password": password}, timeout=10)
        if r.status_code == 200:
            print(f"  {GREEN}✅ Logged in successfully!{RESET}")
            return r.json()["access_token"]
        else:
            print(f"  {RED}❌ Login failed: {r.text[:200]}{RESET}")
            return None
    
    elif choice == "2":
        name = input(f"  Full name: ").strip()
        phone = input(f"  Phone: ").strip()
        password = getpass(f"  Password (min 6 chars): ")
        user = {"full_name": name, "phone": phone, "password": password}
        r = requests.post(f"{BASE_URL}/api/auth/register", json=user, timeout=10)
        if r.status_code == 201:
            print(f"  {GREEN}✅ Registered successfully!{RESET}")
            return r.json()["access_token"]
        else:
            print(f"  {RED}❌ Registration failed: {r.text[:200]}{RESET}")
            return None
    
    else:
        ts = int(time.time())
        user = {
            "full_name": f"Test Patient {ts}",
            "phone": f"99{ts % 100000000:08d}",
            "password": "Test@1234",
            "gender": "male",
            "date_of_birth": "1990-01-01",
        }
        r = requests.post(f"{BASE_URL}/api/auth/register", json=user, timeout=10)
        if r.status_code == 201:
            print(f"  {GREEN}✅ Quick-registered as: {user['full_name']} ({user['phone']}){RESET}")
            return r.json()["access_token"]
        else:
            print(f"  {RED}❌ Quick-register failed: {r.text[:200]}{RESET}")
            return None


def run_chat(token):
    """Main conversational loop."""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n{CYAN}{'─'*60}")
    print(f"  Describe your symptoms to start the AI interview.")
    print(f"  Commands:  /quit  /history  /complete  /new")
    print(f"{'─'*60}{RESET}\n")
    
    session_id = None
    
    while True:
        try:
            user_input = input(f"  {BOLD}You:{RESET} ").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n\n  {YELLOW}Goodbye! 👋{RESET}\n")
            break
        
        if not user_input:
            continue
        
        # ─── Commands ─────────────────────────
        if user_input.lower() == "/quit":
            print(f"\n  {YELLOW}Goodbye! 👋{RESET}\n")
            break
        
        if user_input.lower() == "/new":
            session_id = None
            print(f"\n  {YELLOW}🔄 Starting fresh — describe your new symptoms.{RESET}\n")
            continue
        
        if user_input.lower() == "/history" and session_id:
            r = requests.get(f"{BASE_URL}/api/symptom-agent/{session_id}/conversation", headers=headers, timeout=10)
            if r.status_code == 200:
                history = r.json()
                print(f"\n  {CYAN}{'─'*50}")
                print(f"  📜 Conversation History ({len(history['turns'])} turns)")
                print(f"  {'─'*50}{RESET}")
                for turn in history["turns"]:
                    print(f"  {GREEN}🤖 {turn['agent_question']}{RESET}")
                    if turn.get("patient_response"):
                        print(f"  {BOLD}👤 {turn['patient_response']}{RESET}")
                    print()
                print_info("Symptoms collected", history.get("symptoms_collected", 0))
                print_info("State", history.get("conversation_state", "unknown"))
                print()
            continue
        
        if user_input.lower() == "/complete" and session_id:
            print(f"\n  {YELLOW}⏳ Completing interview & running triage...{RESET}")
            r = requests.post(f"{BASE_URL}/api/symptom-agent/{session_id}/complete", headers=headers, timeout=60)
            if r.status_code == 200:
                result = r.json()
                level = result.get("triage_level", "unknown")
                colors = {"mild": GREEN, "moderate": YELLOW, "emergency": RED}
                lc = colors.get(level, RESET)
                
                print(f"\n  {CYAN}{'═'*50}")
                print(f"  📋 TRIAGE RESULT")
                print(f"  {'═'*50}{RESET}")
                print(f"  {lc}{BOLD}Level: {level.upper()}{RESET}")
                print(f"  Concern: {result.get('primary_concern', 'N/A')}")
                print(f"  Urgency: {result.get('urgency_score', 'N/A')}/10")
                if result.get("recommendations"):
                    print(f"\n  Recommendations:")
                    for rec in result["recommendations"]:
                        print(f"    • {rec}")
                print(f"\n  {DIM}Symptoms collected: {result.get('symptoms_collected', 0)}{RESET}")
                print(f"  {DIM}Turns: {result.get('conversation_turns', 0)}{RESET}")
                print()
                
                session_id = None
                print(f"  {YELLOW}Type a new symptom to start another interview, or /quit.{RESET}\n")
            else:
                print(f"  {RED}❌ Complete failed: {r.text[:200]}{RESET}\n")
            continue
        
        # ─── Start or Continue Conversation ──────
        if session_id is None:
            # Start new interview
            data = {"initial_message": user_input, "language": "en"}
            r = requests.post(f"{BASE_URL}/api/symptom-agent/start", json=data, headers=headers, timeout=30)
            
            if r.status_code == 201:
                resp = r.json()
                session_id = resp["session_id"]
                is_emergency = resp.get("is_emergency", False)
                
                print_agent(resp["agent_message"], is_emergency)
                print_info("Category", ", ".join(resp.get("symptoms_identified", [])))
                print_info("Progress", f"{resp.get('progress_pct', 0)}%")
                print_info("State", resp.get("conversation_state", ""))
                if is_emergency:
                    print(f"  {RED}{BOLD}🚨 EMERGENCY FLAGS DETECTED — Seek immediate help!{RESET}")
                print()
            else:
                print(f"  {RED}❌ Error: {r.text[:200]}{RESET}\n")
        else:
            # Continue existing interview
            data = {"message": user_input}
            r = requests.post(f"{BASE_URL}/api/symptom-agent/{session_id}/respond", json=data, headers=headers, timeout=30)
            
            if r.status_code == 200:
                resp = r.json()
                is_emergency = resp.get("is_emergency", False)
                is_complete = resp.get("conversation_state") == "complete"
                
                print_agent(resp["agent_message"], is_emergency)
                print_info("Progress", f"{resp.get('progress_pct', 0)}%")
                
                if is_emergency:
                    print(f"  {RED}{BOLD}🚨 EMERGENCY FLAGS DETECTED!{RESET}")
                
                if is_complete:
                    print(f"  {GREEN}{BOLD}✅ Interview complete! Type /complete to get your triage result.{RESET}")
                print()
            else:
                print(f"  {RED}❌ Error: {r.text[:200]}{RESET}\n")


def main():
    print_banner()
    
    # Check backend
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=3)
        if r.status_code != 200:
            print(f"  {RED}Backend returned {r.status_code}{RESET}")
            return
        print(f"  {GREEN}✅ Backend is running at {BASE_URL}{RESET}\n")
    except requests.ConnectionError:
        print(f"  {RED}❌ Cannot connect to {BASE_URL}")
        print(f"  Start the backend first:{RESET}")
        print(f"  cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000\n")
        return
    
    # Authenticate
    token = authenticate()
    if not token:
        return
    
    # Start chatting
    run_chat(token)


if __name__ == "__main__":
    main()
