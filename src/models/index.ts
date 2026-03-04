export type UserRole = 'patient' | 'doctor' | 'chw' | 'admin';

export type RiskLevel = 'mild' | 'moderate' | 'emergency';

/* ─── AI Classification ─── */
export interface AIClassification {
  riskLevel: RiskLevel;
  confidenceScore: number;
  recommendedAction: string;
  redFlagsDetected: boolean;
  requiresDoctor: boolean;
  guidance: string;
  homeRemedies?: string[];
  warningSignsToWatch?: string[];
  escalationReason?: string;
  followUpQuestions?: string[];
}

/** Legacy compat alias */
export interface AssessmentResult {
  risk: RiskLevel;
  guidance: string;
  nextAction: string;
  homeRemedies?: string[];
}

export interface PatientCase {
  id: string;
  name: string;
  risk: RiskLevel;
  time: string;
}

export interface VitalsData {
  temperature: string;
  bloodPressure: string;
  oxygenSaturation: string;
}

export interface SymptomEntry {
  symptoms: string[];
  rawText: string;
  duration: string;
  severity: number;
  medicalHistory: string;
  allergies: string[];
  vitals: VitalsData;
  chronicIllness: boolean;
  pregnant: boolean;
  age: number;
}

/* ─── Chat ─── */
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}

/* ─── Case Record (enhanced) ─── */
export interface CaseRecord {
  id: string;
  patientId: string;
  date: string;
  symptomsText: string;
  symptoms: string[];
  severity: number;
  duration: string;
  vitals: VitalsData;
  classification: AIClassification;
  /** Legacy field for compat */
  result: AssessmentResult;
  status: 'active' | 'doctor_assigned' | 'closed' | 'emergency_active' | 'referred' | 'pending';
  doctorNotes?: string;
  createdAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  type: 'medication' | 'follow-up' | 'ai-check';
  time: string;
  enabled: boolean;
}

export interface PatientProfile {
  name: string;
  age: number;
  gender: string;
  language: string;
  emergencyContact: string;
  medicalHistory: string;
  allergies: string[];
}