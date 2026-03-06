"""
Symptom Questionnaire Library.
Defines symptom-specific question trees with required and conditional follow-ups.
Each symptom category has a structured set of questions that guide the AI agent
to collect comprehensive clinical data for accurate triage.
"""

from typing import Optional

# ─── Symptom Categories ──────────────────────────────────────────────

SYMPTOM_CATEGORIES = {
    "headache": ["headache", "head pain", "migraine", "head hurts", "sir dard", "sir me dard"],
    "chest_pain": ["chest pain", "chest tightness", "chest pressure", "seene me dard"],
    "fever": ["fever", "high temperature", "bukhar", "temperature", "feeling hot", "chills"],
    "abdominal_pain": ["stomach pain", "belly pain", "abdominal pain", "pet dard", "stomach ache", "tummy pain"],
    "cough": ["cough", "coughing", "khansi", "dry cough", "wet cough"],
    "breathing": ["breathing difficulty", "shortness of breath", "breathless", "saans", "can't breathe", "dyspnea"],
    "diarrhea": ["diarrhea", "loose motion", "dast", "loose stool", "watery stool"],
    "vomiting": ["vomiting", "nausea", "ulti", "throwing up", "feeling sick"],
    "body_pain": ["body pain", "muscle pain", "joint pain", "body ache", "badan dard"],
    "skin": ["rash", "itching", "skin problem", "skin rash", "allergy", "swelling"],
    "urinary": ["burning urination", "frequent urination", "urine problem", "peshab"],
    "eye": ["eye pain", "blurred vision", "red eye", "eye problem", "aankh"],
    "ear": ["ear pain", "ear ache", "hearing problem", "kaan dard"],
    "throat": ["sore throat", "throat pain", "difficulty swallowing", "gala dard"],
    "back_pain": ["back pain", "lower back pain", "kamar dard", "spine pain"],
    "weakness": ["weakness", "fatigue", "tiredness", "kamzori", "no energy", "exhaustion"],
    "dizziness": ["dizziness", "vertigo", "feeling faint", "chakkar", "lightheaded"],
    "bleeding": ["bleeding", "blood", "khoon", "hemorrhage"],
    "injury": ["injury", "wound", "cut", "fall", "accident", "chot"],
    "pregnancy": ["pregnancy", "pregnant", "missed period", "morning sickness"],
}


def identify_symptom_category(text: str) -> Optional[str]:
    """Identify the primary symptom category from free-text description."""
    text_lower = text.lower()
    best_match = None
    best_count = 0
    for category, keywords in SYMPTOM_CATEGORIES.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        if count > best_count:
            best_count = count
            best_match = category
    return best_match


# ─── Question Trees ──────────────────────────────────────────────────
# Each question has: key, text, type, follow_up_condition (optional)

QUESTION_TREES: dict[str, list[dict]] = {

    "headache": [
        {"key": "location", "text": "Where exactly is the pain? (front of head, back of head, one side, both sides, behind eyes)?", "type": "location"},
        {"key": "quality", "text": "How would you describe the pain? (throbbing/pulsating, pressing/squeezing, sharp/stabbing, dull/aching)?", "type": "quality"},
        {"key": "onset", "text": "Did this headache come on suddenly (like a thunderclap) or gradually build up?", "type": "onset"},
        {"key": "severity", "text": "On a scale of 1-10, how severe is the pain right now?", "type": "severity"},
        {"key": "duration", "text": "How long have you had this headache? (hours, days, weeks)?", "type": "duration"},
        {"key": "visual", "text": "Are you experiencing any vision changes — blurred vision, seeing spots/flashes, or sensitivity to light?", "type": "associated"},
        {"key": "nausea", "text": "Do you have nausea, vomiting, or sensitivity to sound?", "type": "associated"},
        {"key": "neck_stiffness", "text": "Do you have neck stiffness or pain when you bend your head forward?", "type": "red_flag"},
        {"key": "fever_with", "text": "Do you also have a fever?", "type": "associated"},
        {"key": "triggers", "text": "Have you noticed any triggers? (stress, lack of sleep, certain foods, screen time, bright light)?", "type": "triggers"},
        {"key": "previous", "text": "Have you had headaches like this before? If yes, how often?", "type": "history"},
        {"key": "functional", "text": "Is this headache affecting your daily activities — can you work, eat, or sleep?", "type": "functional"},
    ],

    "chest_pain": [
        {"key": "location", "text": "Where exactly in your chest is the pain? (center, left side, right side, behind breastbone)?", "type": "location"},
        {"key": "quality", "text": "How would you describe the pain? (pressure/squeezing, sharp/stabbing, burning, aching)?", "type": "quality"},
        {"key": "radiation", "text": "Does the pain spread to any other area? (left arm, jaw, neck, back, shoulders)?", "type": "radiation", "red_flag": True},
        {"key": "onset", "text": "When did this start? Did it come on suddenly or gradually?", "type": "onset"},
        {"key": "exertion", "text": "Does the pain get worse with physical activity (walking, climbing stairs) or at rest?", "type": "aggravating", "red_flag": True},
        {"key": "breathing_pain", "text": "Does it hurt more when you take a deep breath or cough?", "type": "aggravating"},
        {"key": "duration", "text": "How long does each episode of pain last? (seconds, minutes, hours)?", "type": "duration"},
        {"key": "sweating", "text": "Are you experiencing sweating, nausea, or feeling like you might faint?", "type": "associated", "red_flag": True},
        {"key": "sob", "text": "Are you having difficulty breathing or shortness of breath?", "type": "associated", "red_flag": True},
        {"key": "relief", "text": "Does anything relieve the pain? (rest, antacids, changing position)?", "type": "relieving"},
        {"key": "cardiac_risk", "text": "Do you have a history of heart disease, diabetes, high BP, or does heart disease run in your family?", "type": "risk_factors"},
        {"key": "smoking", "text": "Do you smoke or use tobacco?", "type": "risk_factors"},
        {"key": "severity", "text": "On a scale of 1-10, how severe is the pain?", "type": "severity"},
    ],

    "fever": [
        {"key": "temperature", "text": "Do you know your temperature? If yes, what is it? (in °F or °C)", "type": "vitals"},
        {"key": "duration", "text": "How long have you had the fever? (hours, days, weeks)?", "type": "duration"},
        {"key": "pattern", "text": "Is the fever constant, or does it come and go? Does it spike at certain times (evening, night)?", "type": "timing"},
        {"key": "chills", "text": "Do you have chills, rigors (shaking), or night sweats?", "type": "associated"},
        {"key": "cough_cold", "text": "Do you have a cough, sore throat, runny nose, or body aches?", "type": "associated"},
        {"key": "urinary", "text": "Do you have any burning or pain during urination, or need to urinate frequently?", "type": "associated"},
        {"key": "gi_symptoms", "text": "Do you have diarrhea, vomiting, or stomach pain?", "type": "associated"},
        {"key": "rash", "text": "Have you noticed any rash, red spots, or skin changes?", "type": "associated"},
        {"key": "travel", "text": "Have you traveled recently to any other area, especially rural or forested regions?", "type": "exposure"},
        {"key": "contacts", "text": "Has anyone around you (family, neighbors) been sick recently?", "type": "exposure"},
        {"key": "water_food", "text": "Have you consumed any outside food or unclean water recently?", "type": "exposure"},
        {"key": "severity", "text": "On a scale of 1-10, how unwell do you feel overall?", "type": "severity"},
        {"key": "functional", "text": "Can you do your daily activities, or are you bedridden?", "type": "functional"},
    ],

    "abdominal_pain": [
        {"key": "location", "text": "Where exactly is the pain? (upper right, upper left, lower right, lower left, center, all over)?", "type": "location"},
        {"key": "quality", "text": "How would you describe the pain? (cramping, sharp/stabbing, dull/aching, burning, colicky)?", "type": "quality"},
        {"key": "onset", "text": "Did the pain start suddenly or has it been building up gradually?", "type": "onset"},
        {"key": "duration", "text": "How long have you had this pain?", "type": "duration"},
        {"key": "meal_relation", "text": "Is the pain related to eating? Does it get worse after meals, or when your stomach is empty?", "type": "aggravating"},
        {"key": "bowel_changes", "text": "Have you had any changes in bowel movements? (constipation, diarrhea, blood in stool)?", "type": "associated"},
        {"key": "vomiting", "text": "Do you have nausea or vomiting? If vomiting, what does it look like?", "type": "associated"},
        {"key": "bloating", "text": "Do you have bloating, gas, or inability to pass gas?", "type": "associated"},
        {"key": "fever_with", "text": "Do you have a fever along with the pain?", "type": "associated"},
        {"key": "urinary", "text": "Any changes in urination — pain, color changes, or blood in urine?", "type": "associated"},
        {"key": "severity", "text": "On a scale of 1-10, how severe is the pain?", "type": "severity"},
        {"key": "radiation", "text": "Does the pain spread to your back, shoulder, or groin?", "type": "radiation"},
        {"key": "functional", "text": "Can you walk, eat, and do your daily activities?", "type": "functional"},
    ],

    "cough": [
        {"key": "type", "text": "Is it a dry cough or are you coughing up phlegm/mucus (wet/productive cough)?", "type": "quality"},
        {"key": "phlegm_color", "text": "If producing phlegm, what color is it? (clear, white, yellow, green, brown, blood-streaked)?", "type": "quality", "condition": "wet"},
        {"key": "duration", "text": "How long have you had this cough? (days, weeks, months)?", "type": "duration"},
        {"key": "timing", "text": "Is the cough worse at any particular time? (morning, night, after eating, when lying down)?", "type": "timing"},
        {"key": "blood", "text": "Have you coughed up any blood, even small amounts?", "type": "red_flag", "red_flag": True},
        {"key": "fever_with", "text": "Do you have a fever along with the cough?", "type": "associated"},
        {"key": "breathing", "text": "Are you having any difficulty breathing or wheezing?", "type": "associated"},
        {"key": "weight_loss", "text": "Have you noticed any unexplained weight loss or night sweats in recent weeks?", "type": "red_flag", "red_flag": True},
        {"key": "smoking", "text": "Do you smoke or are you exposed to dust, fumes, or smoke regularly?", "type": "exposure"},
        {"key": "contacts", "text": "Has anyone around you had a similar cough or been diagnosed with TB?", "type": "exposure"},
        {"key": "severity", "text": "On a scale of 1-10, how much does this cough bother you?", "type": "severity"},
    ],

    "breathing": [
        {"key": "onset", "text": "Did the breathing difficulty start suddenly or has it been gradually getting worse?", "type": "onset"},
        {"key": "duration", "text": "How long have you been having this difficulty?", "type": "duration"},
        {"key": "exertion", "text": "Does it happen during physical activity, at rest, or both?", "type": "timing"},
        {"key": "position", "text": "Is it worse when lying flat? Do you need extra pillows to breathe comfortably at night?", "type": "aggravating"},
        {"key": "wheezing", "text": "Do you hear any wheezing or whistling sound when you breathe?", "type": "associated"},
        {"key": "chest_pain", "text": "Do you have any chest pain or tightness along with the breathing difficulty?", "type": "associated"},
        {"key": "cough", "text": "Do you have a cough? If yes, are you bringing up any phlegm or blood?", "type": "associated"},
        {"key": "swelling", "text": "Do you notice any swelling in your feet, ankles, or legs?", "type": "associated"},
        {"key": "anxiety", "text": "Do you feel anxious or panicky along with the breathing difficulty?", "type": "associated"},
        {"key": "severity", "text": "On a scale of 1-10, how difficult is it for you to breathe right now?", "type": "severity"},
        {"key": "functional", "text": "Can you speak full sentences, or do you need to stop and catch your breath?", "type": "functional"},
    ],

    "diarrhea": [
        {"key": "frequency", "text": "How many times have you had loose stools in the last 24 hours?", "type": "severity"},
        {"key": "consistency", "text": "What do the stools look like? (watery, mushy, with mucus, with blood)?", "type": "quality"},
        {"key": "duration", "text": "How long have you had diarrhea?", "type": "duration"},
        {"key": "blood_stool", "text": "Is there any blood or black color in your stools?", "type": "red_flag", "red_flag": True},
        {"key": "vomiting", "text": "Do you also have vomiting?", "type": "associated"},
        {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
        {"key": "cramps", "text": "Do you have stomach cramps or pain?", "type": "associated"},
        {"key": "dehydration", "text": "Are you feeling very thirsty, dry mouth, or reduced urination?", "type": "red_flag"},
        {"key": "food", "text": "Did you eat any outside food, stale food, or drink unclean water recently?", "type": "exposure"},
        {"key": "contacts", "text": "Is anyone else in your family or area having similar symptoms?", "type": "exposure"},
    ],

    "vomiting": [
        {"key": "frequency", "text": "How many times have you vomited in the last 24 hours?", "type": "severity"},
        {"key": "content", "text": "What does the vomit contain? (food, bile/yellow-green, blood/coffee-ground, clear fluid)?", "type": "quality"},
        {"key": "blood_vomit", "text": "Is there any blood in the vomit, or does it look like coffee grounds?", "type": "red_flag", "red_flag": True},
        {"key": "duration", "text": "How long have you been vomiting?", "type": "duration"},
        {"key": "pain", "text": "Do you have stomach pain? Where?", "type": "associated"},
        {"key": "diarrhea", "text": "Do you also have diarrhea?", "type": "associated"},
        {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
        {"key": "headache", "text": "Do you have a headache, especially a severe one?", "type": "associated"},
        {"key": "keeping_fluids", "text": "Can you keep water or other fluids down?", "type": "red_flag"},
        {"key": "food", "text": "Did you eat anything unusual or suspect food poisoning?", "type": "exposure"},
    ],

    "body_pain": [
        {"key": "location", "text": "Where is the pain? (all over, specific joints, muscles, bones)?", "type": "location"},
        {"key": "which_joints", "text": "Which joints or areas are affected? (knees, shoulders, wrists, hips)?", "type": "location"},
        {"key": "quality", "text": "How would you describe the pain? (aching, sharp, stiff, burning)?", "type": "quality"},
        {"key": "swelling", "text": "Is there any swelling, redness, or warmth in the affected area?", "type": "associated"},
        {"key": "duration", "text": "How long have you had this pain?", "type": "duration"},
        {"key": "morning_stiffness", "text": "Is the stiffness worse in the morning? How long does the stiffness last?", "type": "timing"},
        {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
        {"key": "injury", "text": "Did you have any injury, fall, or physical strain recently?", "type": "history"},
        {"key": "movement", "text": "Does movement make it better or worse?", "type": "aggravating"},
        {"key": "severity", "text": "On a scale of 1-10, how severe is the pain?", "type": "severity"},
    ],

    "skin": [
        {"key": "type", "text": "What does the skin problem look like? (red rash, blisters, dry patches, swelling, bumps)?", "type": "quality"},
        {"key": "location", "text": "Where on your body is it? Is it spreading?", "type": "location"},
        {"key": "itching", "text": "Is it itchy? On a scale of 1-10, how bad is the itching?", "type": "severity"},
        {"key": "duration", "text": "How long have you had this?", "type": "duration"},
        {"key": "onset", "text": "Did it start suddenly or gradually?", "type": "onset"},
        {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
        {"key": "new_products", "text": "Have you started using any new soap, detergent, cream, or eaten any new food?", "type": "triggers"},
        {"key": "contacts", "text": "Does anyone else around you have a similar skin problem?", "type": "exposure"},
        {"key": "previous", "text": "Have you had this before? Do you have any known allergies?", "type": "history"},
    ],

    "urinary": [
        {"key": "burning", "text": "Do you have a burning sensation when you urinate?", "type": "quality"},
        {"key": "frequency", "text": "How often are you urinating? More than usual?", "type": "severity"},
        {"key": "color", "text": "What color is your urine? (normal, dark, bloody/red, cloudy)?", "type": "quality"},
        {"key": "blood", "text": "Is there any blood in your urine?", "type": "red_flag", "red_flag": True},
        {"key": "pain", "text": "Do you have pain in your lower belly, sides, or back?", "type": "associated"},
        {"key": "fever_with", "text": "Do you have a fever or chills?", "type": "associated"},
        {"key": "discharge", "text": "Is there any unusual discharge?", "type": "associated"},
        {"key": "duration", "text": "How long have you had these symptoms?", "type": "duration"},
    ],

    "throat": [
        {"key": "quality", "text": "How would you describe the throat pain? (scratchy, burning, sharp, like swallowing glass)?", "type": "quality"},
        {"key": "swallowing", "text": "Is it difficult or painful to swallow food or even water?", "type": "severity"},
        {"key": "duration", "text": "How long have you had this?", "type": "duration"},
        {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
        {"key": "voice", "text": "Has your voice changed (hoarse, lost voice)?", "type": "associated"},
        {"key": "cough", "text": "Do you have a cough or cold along with it?", "type": "associated"},
        {"key": "swelling", "text": "Do you feel any swelling in your neck or under your jaw?", "type": "associated"},
        {"key": "severity", "text": "On a scale of 1-10, how painful is it?", "type": "severity"},
    ],

    "back_pain": [
        {"key": "location", "text": "Where exactly is the pain? (upper back, middle back, lower back, one side)?", "type": "location"},
        {"key": "quality", "text": "How would you describe the pain? (sharp, dull, aching, shooting)?", "type": "quality"},
        {"key": "radiation", "text": "Does the pain travel down your leg, to your buttocks, or anywhere else?", "type": "radiation"},
        {"key": "onset", "text": "Did it start suddenly (after lifting, bending) or gradually?", "type": "onset"},
        {"key": "duration", "text": "How long have you had this pain?", "type": "duration"},
        {"key": "numbness", "text": "Do you have any numbness, tingling, or weakness in your legs?", "type": "red_flag", "red_flag": True},
        {"key": "bladder_bowel", "text": "Have you had any difficulty controlling your bladder or bowels?", "type": "red_flag", "red_flag": True},
        {"key": "movement", "text": "Is the pain worse with movement, sitting, standing, or bending?", "type": "aggravating"},
        {"key": "severity", "text": "On a scale of 1-10, how severe is the pain?", "type": "severity"},
        {"key": "functional", "text": "Can you walk and do your daily activities?", "type": "functional"},
    ],

    "weakness": [
        {"key": "onset", "text": "Did the weakness come on suddenly or has it been gradually getting worse?", "type": "onset"},
        {"key": "duration", "text": "How long have you been feeling weak?", "type": "duration"},
        {"key": "location", "text": "Is the weakness all over your body or in specific parts (one arm, one leg, one side)?", "type": "location", "red_flag": True},
        {"key": "appetite", "text": "How is your appetite? Have you been eating and drinking enough?", "type": "associated"},
        {"key": "weight_loss", "text": "Have you lost weight recently without trying?", "type": "red_flag"},
        {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
        {"key": "sleep", "text": "How is your sleep? Do you feel rested after sleeping?", "type": "associated"},
        {"key": "mood", "text": "How is your mood? Are you feeling sad, stressed, or anxious?", "type": "associated"},
        {"key": "severity", "text": "On a scale of 1-10, how weak do you feel?", "type": "severity"},
    ],

    "dizziness": [
        {"key": "type", "text": "Is it a spinning sensation (room moving around you), or lightheadedness (feeling faint)?", "type": "quality"},
        {"key": "onset", "text": "Did it start suddenly? What were you doing when it began?", "type": "onset"},
        {"key": "duration", "text": "How long does each episode last? (seconds, minutes, hours)?", "type": "duration"},
        {"key": "position", "text": "Does it get worse when you change position (lying to standing, turning head)?", "type": "aggravating"},
        {"key": "hearing", "text": "Have you noticed any hearing loss, ringing in ears, or ear fullness?", "type": "associated"},
        {"key": "vision", "text": "Any vision changes, double vision, or difficulty focusing?", "type": "associated"},
        {"key": "nausea", "text": "Do you have nausea or vomiting with the dizziness?", "type": "associated"},
        {"key": "fainting", "text": "Have you actually fainted or lost consciousness?", "type": "red_flag", "red_flag": True},
        {"key": "headache", "text": "Do you have a headache along with the dizziness?", "type": "associated"},
        {"key": "severity", "text": "On a scale of 1-10, how bad is the dizziness?", "type": "severity"},
    ],

    "bleeding": [
        {"key": "source", "text": "Where is the bleeding from? (wound, nose, gums, coughing blood, vomiting blood, rectal, vaginal)?", "type": "location", "red_flag": True},
        {"key": "amount", "text": "How much bleeding is there? (small/spotting, moderate, heavy/soaking)?", "type": "severity", "red_flag": True},
        {"key": "duration", "text": "How long has the bleeding been going on?", "type": "duration"},
        {"key": "cause", "text": "Was there any injury, cut, or known cause?", "type": "history"},
        {"key": "stopping", "text": "Has the bleeding stopped, slowed, or is it still active?", "type": "severity"},
        {"key": "dizziness", "text": "Are you feeling dizzy, lightheaded, or like you might faint?", "type": "red_flag", "red_flag": True},
        {"key": "medications", "text": "Are you taking any blood-thinning medications?", "type": "history"},
    ],

    "injury": [
        {"key": "mechanism", "text": "How did the injury happen? (fall, accident, hit by object, sports)?", "type": "history"},
        {"key": "location", "text": "Which part of the body is injured?", "type": "location"},
        {"key": "head_injury", "text": "Did you hit your head? Did you lose consciousness, even briefly?", "type": "red_flag", "red_flag": True},
        {"key": "movement", "text": "Can you move the injured area? Is there any deformity?", "type": "severity"},
        {"key": "swelling", "text": "Is there swelling, bruising, or bleeding?", "type": "associated"},
        {"key": "numbness", "text": "Is there any numbness or tingling below the injury?", "type": "red_flag"},
        {"key": "tetanus", "text": "If it's a wound — is it a clean cut or dirty/deep? When was your last tetanus shot?", "type": "history"},
        {"key": "severity", "text": "On a scale of 1-10, how severe is the pain?", "type": "severity"},
    ],

    "eye": [
        {"key": "which_eye", "text": "Which eye is affected — left, right, or both?", "type": "location"},
        {"key": "quality", "text": "What are you experiencing? (pain, redness, watering, itching, discharge)?", "type": "quality"},
        {"key": "vision", "text": "Has your vision changed? (blurred, double, reduced, blind spots)?", "type": "severity", "red_flag": True},
        {"key": "onset", "text": "Did this start suddenly or gradually?", "type": "onset"},
        {"key": "duration", "text": "How long have you had this?", "type": "duration"},
        {"key": "injury", "text": "Was there any injury, chemical exposure, or foreign object in the eye?", "type": "history"},
        {"key": "light", "text": "Is there sensitivity to light?", "type": "associated"},
        {"key": "severity", "text": "On a scale of 1-10, how bad is it?", "type": "severity"},
    ],

    "ear": [
        {"key": "which_ear", "text": "Which ear is affected — left, right, or both?", "type": "location"},
        {"key": "quality", "text": "What are you experiencing? (pain, discharge, ringing, blocked feeling)?", "type": "quality"},
        {"key": "hearing", "text": "Has your hearing changed or reduced?", "type": "severity"},
        {"key": "discharge", "text": "Is there any discharge or fluid from the ear? What color?", "type": "associated"},
        {"key": "duration", "text": "How long have you had this?", "type": "duration"},
        {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
        {"key": "cold", "text": "Did you recently have a cold or upper respiratory infection?", "type": "history"},
        {"key": "severity", "text": "On a scale of 1-10, how bad is it?", "type": "severity"},
    ],

    "pregnancy": [
        {"key": "weeks", "text": "How many weeks or months pregnant are you?", "type": "duration"},
        {"key": "main_complaint", "text": "What is your main concern right now?", "type": "quality"},
        {"key": "bleeding", "text": "Do you have any vaginal bleeding or spotting?", "type": "red_flag", "red_flag": True},
        {"key": "pain", "text": "Do you have any abdominal pain or cramping?", "type": "associated"},
        {"key": "movement", "text": "If past 5 months — are you feeling the baby move?", "type": "red_flag"},
        {"key": "bp_symptoms", "text": "Do you have headache, blurred vision, or swelling of face/hands?", "type": "red_flag", "red_flag": True},
        {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
        {"key": "fluid", "text": "Has any fluid leaked from the vagina?", "type": "red_flag"},
    ],
}

# ─── Default/Generic (when no category matched) ──────────

GENERIC_QUESTIONS = [
    {"key": "main_symptom", "text": "Can you describe your main symptom in more detail?", "type": "quality"},
    {"key": "location", "text": "Where on your body is the problem?", "type": "location"},
    {"key": "duration", "text": "How long have you had this problem?", "type": "duration"},
    {"key": "severity", "text": "On a scale of 1-10, how bad is it?", "type": "severity"},
    {"key": "onset", "text": "Did it start suddenly or gradually?", "type": "onset"},
    {"key": "aggravating", "text": "What makes it worse?", "type": "aggravating"},
    {"key": "relieving", "text": "What makes it better?", "type": "relieving"},
    {"key": "fever_with", "text": "Do you have a fever?", "type": "associated"},
    {"key": "functional", "text": "Is it affecting your daily activities?", "type": "functional"},
]


# ─── Red Flag Definitions per Category ────────────────────

RED_FLAGS: dict[str, list[dict]] = {
    "headache": [
        {"condition": "sudden thunderclap onset", "action": "emergency", "keywords": ["sudden", "thunderclap", "worst ever", "worst headache"]},
        {"condition": "neck stiffness with fever", "action": "emergency", "keywords": ["neck stiff", "can't bend", "fever"]},
        {"condition": "vision loss", "action": "emergency", "keywords": ["can't see", "blind", "vision loss", "lost vision"]},
    ],
    "chest_pain": [
        {"condition": "radiating to arm/jaw with sweating", "action": "emergency", "keywords": ["left arm", "jaw", "sweating", "nausea"]},
        {"condition": "sudden severe with breathlessness", "action": "emergency", "keywords": ["sudden", "can't breathe", "severe", "breathless"]},
        {"condition": "exertional with cardiac risk factors", "action": "emergency", "keywords": ["walking", "stairs", "exertion", "heart disease"]},
    ],
    "fever": [
        {"condition": "very high fever > 104°F", "action": "emergency", "keywords": ["104", "105", "106", "very high", "40 degree"]},
        {"condition": "fever with rash and stiff neck", "action": "emergency", "keywords": ["rash", "stiff neck", "confused"]},
        {"condition": "fever in infant < 3 months", "action": "emergency", "keywords": ["baby", "infant", "newborn", "3 month"]},
    ],
    "breathing": [
        {"condition": "severe sudden breathlessness", "action": "emergency", "keywords": ["can't breathe", "suffocating", "gasping"]},
        {"condition": "blue lips or fingers", "action": "emergency", "keywords": ["blue", "purple", "cyanosis"]},
        {"condition": "can't speak full sentences", "action": "emergency", "keywords": ["can't talk", "can't speak", "few words"]},
    ],
    "bleeding": [
        {"condition": "heavy uncontrolled bleeding", "action": "emergency", "keywords": ["won't stop", "soaking", "heavy", "gushing"]},
        {"condition": "vomiting blood", "action": "emergency", "keywords": ["vomiting blood", "coffee ground", "blood vomit"]},
        {"condition": "coughing blood", "action": "emergency", "keywords": ["coughing blood", "blood cough"]},
    ],
    "injury": [
        {"condition": "head injury with loss of consciousness", "action": "emergency", "keywords": ["hit head", "unconscious", "blacked out", "passed out"]},
        {"condition": "suspected fracture with deformity", "action": "emergency", "keywords": ["deformed", "bent", "bone sticking", "fracture"]},
        {"condition": "spinal injury suspicion", "action": "emergency", "keywords": ["can't move", "paralyzed", "numbness", "spine", "neck injury"]},
    ],
    "pregnancy": [
        {"condition": "heavy vaginal bleeding", "action": "emergency", "keywords": ["heavy bleeding", "soaking", "clots"]},
        {"condition": "severe headache with vision changes", "action": "emergency", "keywords": ["severe headache", "blurred vision", "swelling face"]},
        {"condition": "no fetal movement", "action": "emergency", "keywords": ["baby not moving", "no movement", "stopped moving"]},
    ],
}


def get_questions_for_category(category: str) -> list[dict]:
    """Get the question tree for a symptom category."""
    return QUESTION_TREES.get(category, GENERIC_QUESTIONS)


def check_red_flags(category: str, text: str) -> list[dict]:
    """Check if any red flags are triggered from patient text."""
    text_lower = text.lower()
    triggered = []
    flags = RED_FLAGS.get(category, [])
    for flag in flags:
        if any(kw in text_lower for kw in flag["keywords"]):
            triggered.append(flag)
    return triggered


def get_progress_percentage(category: str, answered_keys: list[str]) -> int:
    """Calculate interview progress percentage."""
    questions = get_questions_for_category(category)
    if not questions:
        return 100
    total = len(questions)
    answered = sum(1 for q in questions if q["key"] in answered_keys)
    return min(100, int((answered / total) * 100))
