/**
 * Natural Remedies Library
 *
 * Keyword-matched natural remedy suggestions for mild health conditions.
 * These are general wellness tips and NOT medical prescriptions.
 */

export interface NaturalRemedy {
  name: string;
  emoji: string;
  description: string;
  howTo?: string;
  keywords: string[];
}

export const NATURAL_REMEDIES: NaturalRemedy[] = [
  // ── Cold / Flu / Congestion ──
  {
    name: 'Warm Salt Water Gargle',
    emoji: '🧂',
    description: 'Soothes sore throat and reduces inflammation. Mix ½ tsp salt in warm water.',
    howTo: 'Gargle for 30 seconds, 3-4 times daily.',
    keywords: ['sore throat', 'throat pain', 'cold', 'cough', 'congestion'],
  },
  {
    name: 'Honey & Lemon Tea',
    emoji: '🍯',
    description: 'Natural cough suppressant. Honey coats the throat while lemon provides vitamin C.',
    howTo: 'Mix 1 tbsp honey + juice of half a lemon in warm water. Drink 2-3 times daily.',
    keywords: ['cough', 'cold', 'sore throat', 'throat', 'flu', 'runny nose'],
  },
  {
    name: 'Steam Inhalation',
    emoji: '♨️',
    description: 'Clears nasal congestion and loosens mucus. Safe and effective for cold symptoms.',
    howTo: 'Inhale steam from a bowl of hot water with a towel over your head for 10 minutes.',
    keywords: ['congestion', 'stuffy nose', 'runny nose', 'cold', 'sinus', 'blocked nose'],
  },
  {
    name: 'Ginger Tea',
    emoji: '🫚',
    description: 'Anti-inflammatory and helps reduce nausea, sore throat, and cold symptoms.',
    howTo: 'Boil fresh ginger slices in water for 10 min. Add honey to taste.',
    keywords: ['nausea', 'vomiting', 'cold', 'sore throat', 'indigestion', 'flu'],
  },
  {
    name: 'Turmeric Milk (Golden Milk)',
    emoji: '🥛',
    description: 'Curcumin in turmeric has anti-inflammatory and immune-boosting properties.',
    howTo: 'Warm 1 cup milk with ½ tsp turmeric and a pinch of black pepper. Drink before bed.',
    keywords: ['cold', 'flu', 'cough', 'body pain', 'inflammation', 'immunity', 'joint'],
  },

  // ── Headache / Pain ──
  {
    name: 'Peppermint Oil Temple Massage',
    emoji: '🌿',
    description: 'Menthol in peppermint oil increases blood flow and provides a cooling sensation.',
    howTo: 'Dilute with coconut oil, apply to temples & forehead. Massage gently for 2-3 min.',
    keywords: ['headache', 'migraine', 'head pain', 'tension'],
  },
  {
    name: 'Cold Compress',
    emoji: '🧊',
    description: 'Reduces inflammation and numbs the area, decreasing pain signals.',
    howTo: 'Wrap ice in a towel and apply to the affected area for 15-20 min.',
    keywords: ['headache', 'swelling', 'sprain', 'injury', 'pain', 'bruise', 'inflammation'],
  },
  {
    name: 'Stay Hydrated',
    emoji: '💧',
    description: 'Dehydration is a major trigger for headaches and fatigue. Aim for 8 glasses daily.',
    howTo: 'Drink water regularly throughout the day. Add electrolytes if sweating heavily.',
    keywords: ['headache', 'fatigue', 'tired', 'dizzy', 'dehydration', 'weakness', 'dry mouth'],
  },

  // ── Digestive Issues ──
  {
    name: 'Peppermint Tea',
    emoji: '🍵',
    description: 'Relaxes digestive muscles. Helps relieve bloating, gas, and stomach cramps.',
    howTo: 'Steep peppermint leaves in hot water for 5 min. Drink after meals.',
    keywords: ['stomach', 'bloating', 'gas', 'indigestion', 'cramp', 'abdominal', 'digestive'],
  },
  {
    name: 'BRAT Diet',
    emoji: '🍌',
    description: 'Bananas, Rice, Applesauce, Toast — gentle foods that are easy on the stomach.',
    howTo: 'Follow for 24-48 hours during stomach upset. Gradually reintroduce normal foods.',
    keywords: ['diarrhea', 'vomiting', 'nausea', 'stomach upset', 'gastro', 'loose motion'],
  },
  {
    name: 'Fennel Seeds',
    emoji: '🫘',
    description: 'Reduces bloating and gas. Rich in anethole which relaxes stomach muscles.',
    howTo: 'Chew ½ tsp fennel seeds after meals or boil in water to make tea.',
    keywords: ['bloating', 'gas', 'indigestion', 'acidity', 'stomach'],
  },
  {
    name: 'Oral Rehydration Solution',
    emoji: '🥤',
    description: 'Essential for preventing dehydration from diarrhea or vomiting.',
    howTo: 'Mix 6 tsp sugar + ½ tsp salt in 1 liter of clean water. Sip frequently.',
    keywords: ['diarrhea', 'vomiting', 'dehydration', 'loose motion', 'stomach flu'],
  },

  // ── Fever ──
  {
    name: 'Lukewarm Sponge Bath',
    emoji: '🛁',
    description: 'Helps bring down fever naturally through evaporative cooling.',
    howTo: 'Use lukewarm (NOT cold) water. Sponge armpits, forehead, and neck area.',
    keywords: ['fever', 'high temperature', 'hot', 'chills'],
  },
  {
    name: 'Rest & Light Diet',
    emoji: '😴',
    description: 'Your body needs energy to fight infection. Rest is the best medicine for fever.',
    howTo: 'Sleep 8-10 hours. Eat light foods like soup, khichdi, or porridge.',
    keywords: ['fever', 'cold', 'flu', 'fatigue', 'tired', 'weakness', 'body ache'],
  },

  // ── Skin / Allergy ──
  {
    name: 'Aloe Vera Gel',
    emoji: '🌱',
    description: 'Soothes skin irritation, minor burns, and rashes with its cooling properties.',
    howTo: 'Apply fresh aloe vera gel directly to the affected area. Repeat 2-3 times daily.',
    keywords: ['rash', 'skin', 'burn', 'sunburn', 'irritation', 'itch', 'allergy'],
  },
  {
    name: 'Oatmeal Bath',
    emoji: '🫧',
    description: 'Colloidal oatmeal reduces itching and inflammation of the skin.',
    howTo: 'Add 1 cup finely ground oatmeal to lukewarm bath water. Soak for 15-20 min.',
    keywords: ['rash', 'itch', 'hives', 'skin', 'eczema', 'dry skin', 'allergy'],
  },

  // ── Muscle / Joint ──
  {
    name: 'Warm Compress',
    emoji: '🔥',
    description: 'Improves blood flow and relaxes tense muscles. Great for chronic pain and stiffness.',
    howTo: 'Soak towel in warm water, wring out, apply to the area for 15-20 min.',
    keywords: ['muscle pain', 'back pain', 'stiff', 'joint', 'arthritis', 'cramp', 'body ache'],
  },
  {
    name: 'Gentle Stretching',
    emoji: '🧘',
    description: 'Light stretching improves flexibility and reduces muscle tension.',
    howTo: 'Hold each stretch for 15-30 sec. Never bounce. Stop if pain increases.',
    keywords: ['muscle pain', 'back pain', 'stiff', 'neck', 'shoulder', 'tension'],
  },

  // ── Sleep / Anxiety ──
  {
    name: 'Chamomile Tea',
    emoji: '🌼',
    description: 'Natural calming agent. Promotes relaxation and helps with mild sleep issues.',
    howTo: 'Steep chamomile tea bag in hot water for 5 min. Drink 30 min before bed.',
    keywords: ['sleep', 'insomnia', 'anxiety', 'stress', 'restless', 'nervous', 'tension'],
  },
  {
    name: 'Deep Breathing Exercise',
    emoji: '🧘‍♂️',
    description: 'Activates the parasympathetic nervous system, reducing stress and anxiety.',
    howTo: 'Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times.',
    keywords: ['anxiety', 'stress', 'panic', 'breathing', 'nervous', 'sleep', 'restless'],
  },

  // ── Eye Strain ──
  {
    name: '20-20-20 Rule',
    emoji: '👀',
    description: 'Reduces digital eye strain. Every 20 min, look 20 feet away for 20 seconds.',
    howTo: 'Set a timer. Look at a distant object regularly when using screens.',
    keywords: ['eye strain', 'eye pain', 'headache', 'screen', 'vision', 'blurry'],
  },
];
