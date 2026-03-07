import { AIClassification, AssessmentResult, RiskLevel, SymptomEntry } from '../models';

/* ─── keyword maps ─── */
const RED_FLAGS = [
  'chest pain', 'difficulty breathing', 'shortness of breath', 'unconscious',
  'severe bleeding', 'seizure', 'stroke', 'paralysis', 'heart attack',
  'suicidal', 'unable to breathe', 'choking', 'anaphylaxis',
];

const EMERGENCY_KEYWORDS = [
  ...RED_FLAGS, 'breathing difficulty', 'fainting', 'loss of consciousness',
  'severe chest', 'blood vomit', 'coughing blood',
];

const MODERATE_KEYWORDS = [
  'fever', 'dizziness', 'vomit', 'persistent pain', 'infection',
  'swelling', 'rash', 'diarrhea', 'dehydration', 'high blood pressure',
  'blurred vision', 'numbness',
];

const MILD_REMEDIES: Record<string, string[]> = {
  fever: ['Rest and stay hydrated', 'Take paracetamol (as directed)', 'Use a cool compress on forehead'],
  headache: ['Rest in a dark quiet room', 'Stay hydrated', 'Apply peppermint oil on temples'],
  cough: ['Drink warm water with honey', 'Gargle with salt water', 'Use steam inhalation'],
  'sore throat': ['Gargle with warm salt water', 'Drink warm liquids', 'Suck on lozenges'],
  'body aches': ['Rest adequately', 'Apply warm compress', 'Stay hydrated'],
  fatigue: ['Get adequate sleep', 'Eat nutritious food', 'Stay hydrated'],
  nausea: ['Sip ginger tea', 'Eat small bland meals', 'Avoid strong smells'],
  default: ['Rest well', 'Stay hydrated', 'Monitor symptoms for 24 hours'],
};

const WARNING_SIGNS: Record<RiskLevel, string[]> = {
  mild: [
    'Symptoms persist beyond 3 days',
    'New symptoms develop',
    'Fever rises above 103°F',
    'You feel significantly worse',
  ],
  moderate: [
    'Symptoms worsen rapidly',
    'Difficulty breathing develops',
    'Persistent high fever',
    'Confusion or altered consciousness',
  ],
  emergency: [],
  pending: [],
};

const FOLLOW_UP_QUESTIONS: Record<RiskLevel, string[]> = {
  mild: [
    'Are you able to eat and drink normally?',
    'Is anyone at home to help you if needed?',
  ],
  moderate: [
    'Do you have access to a nearby clinic?',
    'Are you currently on any medications?',
    'Have you experienced these symptoms before?',
  ],
  emergency: [
    'Is someone with you right now?',
    'Can you tell me your exact location?',
  ],
  pending: [],
};

/* ─── classification engine ─── */
export async function classifySymptoms(entry: SymptomEntry): Promise<AIClassification> {
  const allText = [
    entry.rawText,
    ...entry.symptoms,
  ].join(' ').toLowerCase();

  /* red-flag scan */
  const redFlagsDetected = RED_FLAGS.some((k) => allText.includes(k));

  /* vitals-based escalation */
  const spo2 = Number(entry.vitals.oxygenSaturation);
  const temp = Number(entry.vitals.temperature);
  const criticalVitals = (spo2 > 0 && spo2 < 90) || temp > 104;
  const warnVitals = (spo2 > 0 && spo2 < 94) || temp > 103;

  /* severity escalation */
  const highSeverity = entry.severity >= 8;

  /* determine risk */
  let riskLevel: RiskLevel = 'mild';
  let confidenceScore = 0.85;

  if (redFlagsDetected || criticalVitals) {
    riskLevel = 'emergency';
    confidenceScore = 0.95;
  } else if (
    EMERGENCY_KEYWORDS.some((k) => allText.includes(k)) ||
    (highSeverity && warnVitals)
  ) {
    riskLevel = 'emergency';
    confidenceScore = 0.88;
  } else if (
    MODERATE_KEYWORDS.some((k) => allText.includes(k)) ||
    highSeverity ||
    warnVitals ||
    entry.chronicIllness ||
    entry.pregnant
  ) {
    riskLevel = 'moderate';
    confidenceScore = 0.82;
  }

  /* low confidence → auto-escalate */
  if (confidenceScore < 0.6 && riskLevel === 'mild') {
    riskLevel = 'moderate';
    confidenceScore = 0.6;
  }

  /* gather home remedies for mild */
  let homeRemedies: string[] = [];
  if (riskLevel === 'mild') {
    const matched = entry.symptoms.find((s) => MILD_REMEDIES[s.toLowerCase()]);
    homeRemedies = matched
      ? MILD_REMEDIES[matched.toLowerCase()]
      : MILD_REMEDIES.default;
  }

  /* build escalation reason */
  let escalationReason: string | undefined;
  if (riskLevel === 'emergency') {
    const reasons: string[] = [];
    if (redFlagsDetected) reasons.push('Red-flag symptoms detected');
    if (criticalVitals) reasons.push('Critical vital signs');
    if (highSeverity) reasons.push('High severity reported');
    escalationReason = reasons.join('. ') || 'Emergency-level symptoms detected';
  } else if (riskLevel === 'moderate') {
    const reasons: string[] = [];
    if (entry.chronicIllness) reasons.push('Chronic illness history');
    if (entry.pregnant) reasons.push('Pregnancy reported');
    if (warnVitals) reasons.push('Abnormal vital signs');
    if (highSeverity) reasons.push('High severity reported');
    escalationReason = reasons.join('. ') || 'Medical attention recommended';
  }

  /* guidance text */
  const guidanceMap: Record<RiskLevel, string> = {
    mild: 'Your symptoms appear to be mild. Rest, stay hydrated, and monitor your condition. Follow the self-care tips below.',
    moderate: 'Your symptoms require professional medical attention. We recommend consulting a doctor within the next few hours.',
    emergency: 'Critical symptoms detected. Immediate medical attention is required. Do not delay seeking help.',
    pending: 'Assessment in progress. Please wait.',
  };

  const actionMap: Record<RiskLevel, string> = {
    mild: 'Follow self-care guidance and set a reminder to re-check in 24 hours.',
    moderate: 'Connect with an available doctor for consultation.',
    emergency: 'Call emergency services (112) immediately.',
    pending: 'Awaiting assessment result.',
  };

  /* simulate network delay */
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    riskLevel,
    confidenceScore,
    recommendedAction: actionMap[riskLevel],
    redFlagsDetected,
    requiresDoctor: riskLevel !== 'mild',
    guidance: guidanceMap[riskLevel],
    homeRemedies,
    warningSignsToWatch: WARNING_SIGNS[riskLevel],
    escalationReason,
    followUpQuestions: FOLLOW_UP_QUESTIONS[riskLevel],
  };
}

/** Legacy compat wrapper — used by old code paths */
export async function assessSymptoms(symptoms: string[]): Promise<AssessmentResult> {
  const entry: SymptomEntry = {
    symptoms,
    rawText: symptoms.join(', '),
    duration: '',
    severity: 5,
    medicalHistory: '',
    allergies: [],
    vitals: { temperature: '', bloodPressure: '', oxygenSaturation: '' },
    chronicIllness: false,
    pregnant: false,
    age: 30,
  };
  const c = await classifySymptoms(entry);
  return {
    risk: c.riskLevel,
    guidance: c.guidance,
    nextAction: c.recommendedAction,
    homeRemedies: c.homeRemedies,
  };
}