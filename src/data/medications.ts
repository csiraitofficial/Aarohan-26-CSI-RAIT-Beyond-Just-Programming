/**
 * OTC Medication Suggestions Library
 *
 * Keyword-matched over-the-counter medication suggestions.
 * These are informational only — NOT medical prescriptions.
 */

export interface MedicationSuggestion {
  name: string;
  type: string; // e.g. 'Analgesic', 'Antihistamine', etc.
  purpose: string;
  dosage?: string;
  warning?: string;
  keywords: string[];
}

export const MEDICATION_SUGGESTIONS: MedicationSuggestion[] = [
  // ── Pain / Fever ──
  {
    name: 'Paracetamol (Acetaminophen)',
    type: 'Analgesic / Antipyretic',
    purpose: 'Relieves mild to moderate pain and reduces fever.',
    dosage: 'Adults: 500-1000 mg every 4-6 hours (max 4g/day)',
    warning: 'Avoid if you have liver problems. Do not exceed recommended dose.',
    keywords: ['fever', 'headache', 'pain', 'body ache', 'toothache', 'cold', 'flu'],
  },
  {
    name: 'Ibuprofen',
    type: 'NSAID',
    purpose: 'Reduces pain, inflammation, and fever.',
    dosage: 'Adults: 200-400 mg every 4-6 hours with food',
    warning: 'Take with food. Avoid if you have stomach ulcers or kidney issues.',
    keywords: ['pain', 'inflammation', 'headache', 'muscle pain', 'joint', 'arthritis', 'back pain', 'toothache', 'fever'],
  },

  // ── Cold & Cough ──
  {
    name: 'Cetirizine',
    type: 'Antihistamine',
    purpose: 'Relieves allergic symptoms like sneezing, runny nose, and itchy eyes.',
    dosage: 'Adults: 10 mg once daily',
    warning: 'May cause drowsiness. Avoid driving.',
    keywords: ['allergy', 'runny nose', 'sneezing', 'itching', 'hives', 'cold', 'watery eyes', 'rash'],
  },
  {
    name: 'Dextromethorphan (Cough Syrup)',
    type: 'Antitussive',
    purpose: 'Suppresses dry, non-productive cough.',
    dosage: 'Adults: 10-20 mg every 4 hours or 30 mg every 6-8 hours',
    warning: 'Do not use for productive (wet) cough. Avoid with MAOIs.',
    keywords: ['cough', 'dry cough', 'throat', 'cold', 'flu'],
  },
  {
    name: 'Nasal Saline Spray',
    type: 'Decongestant',
    purpose: 'Moisturizes nasal passages and clears congestion safely.',
    dosage: '2-3 sprays per nostril as needed',
    warning: 'Safe for all ages. No drug interactions.',
    keywords: ['congestion', 'stuffy nose', 'blocked nose', 'sinus', 'cold', 'runny nose'],
  },

  // ── Digestive ──
  {
    name: 'Oral Rehydration Salts (ORS)',
    type: 'Electrolyte Replacement',
    purpose: 'Prevents dehydration from diarrhea or vomiting.',
    dosage: 'Dissolve one packet in 1L water, sip frequently',
    warning: 'Seek medical help if diarrhea persists beyond 48 hours.',
    keywords: ['diarrhea', 'vomiting', 'dehydration', 'loose motion', 'stomach flu'],
  },
  {
    name: 'Antacid (Aluminum/Magnesium Hydroxide)',
    type: 'Antacid',
    purpose: 'Neutralizes stomach acid. Relieves heartburn and indigestion.',
    dosage: 'Adults: 1-2 tablets or 10-20 ml after meals',
    warning: 'Do not use long-term without medical advice.',
    keywords: ['acidity', 'heartburn', 'indigestion', 'stomach burn', 'gastric', 'acid reflux'],
  },
  {
    name: 'Loperamide',
    type: 'Anti-diarrheal',
    purpose: 'Slows intestinal movement to reduce diarrhea.',
    dosage: 'Adults: 4 mg initially, then 2 mg after each loose stool (max 16 mg/day)',
    warning: 'Do not use if fever or bloody stools. Consult doctor if no improvement in 2 days.',
    keywords: ['diarrhea', 'loose motion', 'stomach', 'watery stool'],
  },

  // ── Skin ──
  {
    name: 'Hydrocortisone Cream (1%)',
    type: 'Topical Corticosteroid',
    purpose: 'Reduces itching, redness, and swelling from skin irritation.',
    dosage: 'Apply thin layer to affected area 1-2 times daily',
    warning: 'Do not use on face or broken skin for more than 7 days without doctor advice.',
    keywords: ['rash', 'itch', 'skin irritation', 'eczema', 'allergy', 'dermatitis', 'insect bite'],
  },
  {
    name: 'Calamine Lotion',
    type: 'Topical Anti-itch',
    purpose: 'Soothes minor skin irritation, sunburn, and insect bites.',
    dosage: 'Apply to affected area as needed',
    warning: 'For external use only. Avoid contact with eyes.',
    keywords: ['itch', 'rash', 'sunburn', 'insect bite', 'chicken pox', 'skin'],
  },

  // ── Throat ──
  {
    name: 'Throat Lozenges (Menthol)',
    type: 'Demulcent',
    purpose: 'Temporarily relieves sore throat pain and cough.',
    dosage: 'Dissolve 1 lozenge in mouth every 2 hours as needed',
    warning: 'Not suitable for children under 6.',
    keywords: ['sore throat', 'throat pain', 'cough', 'cold', 'hoarse voice'],
  },

  // ── Eye ──
  {
    name: 'Artificial Tears (Lubricating Eye Drops)',
    type: 'Ophthalmic Lubricant',
    purpose: 'Relieves dry, irritated eyes and eye strain.',
    dosage: '1-2 drops per eye as needed',
    warning: 'Do not use if eyes are red or painful — see a doctor.',
    keywords: ['eye strain', 'dry eyes', 'eye pain', 'screen', 'blurry vision'],
  },
];
