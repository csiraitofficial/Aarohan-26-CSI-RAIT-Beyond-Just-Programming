"""
Natural Remedy Database for SwasthyaSaathi.
Contains 21 culturally relevant Indian home remedies organized by symptom category,
as specified in the PRD.
"""

REMEDY_DATABASE: dict[str, list[dict]] = {
    "cold_flu": [
        {
            "name": "Ginger tea with honey",
            "description": "Boil fresh ginger slices in water for 5-10 minutes, add honey. Anti-inflammatory and soothes throat.",
            "ingredients": ["fresh ginger", "honey", "water"],
        },
        {
            "name": "Warm salt water gargle",
            "description": "Dissolve 1/2 teaspoon salt in warm water. Gargle 3-4 times daily. Reduces throat inflammation.",
            "ingredients": ["salt", "warm water"],
        },
        {
            "name": "Tulsi (Holy Basil) tea",
            "description": "Boil 8-10 tulsi leaves in water for 5 minutes. Traditional Ayurvedic immune booster.",
            "ingredients": ["tulsi leaves", "water"],
        },
        {
            "name": "Honey + lemon in warm water",
            "description": "Mix 1 tablespoon honey and juice of half a lemon in warm water. Rich in Vitamin C, antibacterial.",
            "ingredients": ["honey", "lemon", "warm water"],
        },
    ],
    "headache": [
        {
            "name": "Caffeine + rest",
            "description": "A small cup of tea or coffee can help with migraine relief. Rest in a quiet place after.",
            "ingredients": ["tea or coffee"],
        },
        {
            "name": "Cold compress on forehead",
            "description": "Apply a cold, damp cloth or ice pack wrapped in towel on forehead for 15 minutes. Reduces inflammation.",
            "ingredients": ["cold cloth or ice pack", "towel"],
        },
        {
            "name": "Gentle head massage",
            "description": "Gently massage temples and back of neck with light pressure for 5-10 minutes. Relieves tension.",
            "ingredients": ["coconut or sesame oil (optional)"],
        },
        {
            "name": "Rest in dark, quiet room",
            "description": "Lie down in a dark, quiet room with eyes closed. Sensory reduction helps headaches, especially migraines.",
            "ingredients": [],
        },
    ],
    "digestive": [
        {
            "name": "Ginger for nausea",
            "description": "Chew a small piece of fresh ginger or drink ginger water. Traditional remedy for nausea and upset stomach.",
            "ingredients": ["fresh ginger"],
        },
        {
            "name": "Peppermint tea",
            "description": "Steep peppermint leaves in hot water for 5-7 minutes. Helps with IBS, bloating, and indigestion.",
            "ingredients": ["peppermint leaves", "water"],
        },
        {
            "name": "Buttermilk (Chaas)",
            "description": "Mix yogurt with water, add cumin powder and salt. Natural probiotic, cooling for the digestive system.",
            "ingredients": ["yogurt", "water", "cumin powder", "salt"],
        },
        {
            "name": "BRAT diet",
            "description": "Eat Banana, Rice, Applesauce, Toast. These bland foods are easy to digest and help settle the stomach.",
            "ingredients": ["banana", "rice", "applesauce", "toast"],
        },
    ],
    "fever": [
        {
            "name": "Lukewarm bath/sponge",
            "description": "Sponge body with lukewarm (not cold) water. Helps bring down body temperature safely.",
            "ingredients": ["lukewarm water", "cloth"],
        },
        {
            "name": "Extra hydration",
            "description": "Drink 8-10 glasses of water, along with ORS, coconut water, or light dal. Prevents dehydration from fever.",
            "ingredients": ["water", "ORS", "coconut water"],
        },
        {
            "name": "Tulsi + ginger tea",
            "description": "Boil tulsi leaves and ginger together. Has natural antipyretic (fever-reducing) properties.",
            "ingredients": ["tulsi leaves", "ginger", "water"],
        },
        {
            "name": "Cold compress on forehead",
            "description": "Place a cool, damp cloth on the forehead. Change every few minutes. Helps reduce fever discomfort.",
            "ingredients": ["cool water", "cloth"],
        },
    ],
    "cough": [
        {
            "name": "Honey and warm water",
            "description": "Mix 1-2 tablespoons of honey in warm water. Natural cough suppressant, soothes irritated throat.",
            "ingredients": ["honey", "warm water"],
        },
    ],
    "body_pain": [
        {
            "name": "Warm compress",
            "description": "Apply a warm cloth or hot water bottle to the affected area for 15-20 minutes. Eases muscle tension.",
            "ingredients": ["warm cloth or hot water bottle"],
        },
    ],
    "skin": [
        {
            "name": "Aloe vera gel",
            "description": "Apply fresh aloe vera gel to the affected area. Soothes irritation, has anti-inflammatory properties.",
            "ingredients": ["aloe vera leaf or gel"],
        },
    ],
    "throat": [
        {
            "name": "Turmeric milk (Haldi Doodh)",
            "description": "Warm milk with 1/2 tsp turmeric powder. Traditional Indian remedy for sore throat and immunity boost.",
            "ingredients": ["milk", "turmeric powder"],
        },
    ],
}

# ─── Category Mapping ─────────────────────────────────────
# Maps symptom categories from symptom_questionnaires.py to remedy categories
CATEGORY_TO_REMEDY = {
    "headache": "headache",
    "fever": "fever",
    "cough": ["cold_flu", "cough"],
    "cold": "cold_flu",
    "flu": "cold_flu",
    "throat": ["cold_flu", "throat"],
    "abdominal_pain": "digestive",
    "diarrhea": "digestive",
    "vomiting": "digestive",
    "body_pain": "body_pain",
    "back_pain": "body_pain",
    "skin": "skin",
    "weakness": "fever",
    "dizziness": "headache",
}


def get_remedies_for_category(category: str) -> list[dict]:
    """
    Get relevant home remedies for a symptom category.

    Args:
        category: The symptom category (e.g. "headache", "fever")

    Returns:
        List of remedy dicts with name, description, and ingredients.
    """
    remedy_keys = CATEGORY_TO_REMEDY.get(category, "cold_flu")

    if isinstance(remedy_keys, str):
        remedy_keys = [remedy_keys]

    remedies = []
    for key in remedy_keys:
        remedies.extend(REMEDY_DATABASE.get(key, []))

    # Deduplicate by name
    seen = set()
    unique = []
    for r in remedies:
        if r["name"] not in seen:
            seen.add(r["name"])
            unique.append(r)

    return unique[:5]  # Return max 5 remedies