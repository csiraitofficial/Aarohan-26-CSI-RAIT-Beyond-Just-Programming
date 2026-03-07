import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  AIClassification,
  CaseRecord,
  ChatMessage,
  PatientProfile,
  Reminder,
  SymptomEntry,
  VitalsData,
} from '../models';
import { useAuth } from './AuthContext';
import { fetchProfile } from '../services/api';

/* ─── state ─── */
interface PatientState {
  profile: PatientProfile;
  currentEntry: SymptomEntry;
  caseHistory: CaseRecord[];
  reminders: Reminder[];
  chatMessages: ChatMessage[];
  latestClassification: AIClassification | null;
  loading: boolean;
}

const emptyVitals: VitalsData = { temperature: '', bloodPressure: '', oxygenSaturation: '' };
const emptyEntry: SymptomEntry = {
  symptoms: [],
  rawText: '',
  duration: '',
  severity: 5,
  medicalHistory: '',
  allergies: [],
  vitals: emptyVitals,
  chronicIllness: false,
  pregnant: false,
  age: 34,
};

const defaultProfile: PatientProfile = {
  name: '',
  age: 0,
  gender: '',
  language: 'en',
  emergencyContact: '',
  medicalHistory: 'No known conditions',
  allergies: [],
};

const sampleClassification = (risk: 'mild' | 'moderate' | 'emergency'): AIClassification => ({
  riskLevel: risk,
  confidenceScore: 0.85,
  recommendedAction: risk === 'mild' ? 'Rest and monitor' : risk === 'moderate' ? 'Consult a doctor' : 'Call emergency',
  redFlagsDetected: risk === 'emergency',
  requiresDoctor: risk !== 'mild',
  guidance: risk === 'mild' ? 'Mild symptoms, rest recommended.' : risk === 'moderate' ? 'Doctor visit recommended.' : 'Seek emergency help.',
});

const sampleHistory: CaseRecord[] = [
  {
    id: '1',
    patientId: 'p1',
    date: '2026-02-28',
    symptomsText: 'fever, headache',
    symptoms: ['fever', 'headache'],
    severity: 4,
    duration: '2–3 days',
    vitals: { temperature: '100.4', bloodPressure: '120/80', oxygenSaturation: '97' },
    classification: {
      ...sampleClassification('mild'),
      homeRemedies: ['Rest well', 'Drink plenty of fluids', 'Take paracetamol if fever > 101°F'],
      warningSignsToWatch: ['Fever above 104°F', 'Severe headache', 'Rash appearing'],
    },
    result: { risk: 'mild', guidance: 'Rest and hydrate. Mild viral symptoms, should resolve in 3–4 days.', nextAction: 'Follow-up in 3 days if not improving.' },
    status: 'closed',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: '3',
    patientId: 'p1',
    date: '2026-02-15',
    symptomsText: 'high fever, body ache, nausea',
    symptoms: ['high fever', 'body ache', 'nausea'],
    severity: 6,
    duration: '3 days',
    vitals: { temperature: '102.8', bloodPressure: '130/85', oxygenSaturation: '95' },
    classification: {
      ...sampleClassification('moderate'),
      homeRemedies: ['Take antipyretics', 'Stay hydrated', 'Light meals only'],
      warningSignsToWatch: ['Difficulty breathing', 'Persistent vomiting', 'Confusion'],
    },
    result: { risk: 'moderate', guidance: 'Doctor consultation advised. Possible viral infection.', nextAction: 'Visit nearest clinic within 24 hours.' },
    status: 'doctor_assigned',
    doctorNotes: 'Prescribed Azithromycin 500mg for 5 days. Follow up in 1 week.',
    createdAt: Date.now() - 86400000 * 18,
  },
  {
    id: '2',
    patientId: 'p1',
    date: '2026-02-20',
    symptomsText: 'chest pain, breathlessness',
    symptoms: ['chest pain', 'breathlessness'],
    severity: 8,
    duration: '1 day',
    vitals: { temperature: '98.6', bloodPressure: '140/90', oxygenSaturation: '92' },
    classification: {
      ...sampleClassification('emergency'),
      warningSignsToWatch: ['SpO₂ below 94%', 'Severe chest tightness', 'Loss of consciousness'],
    },
    result: { risk: 'emergency', guidance: 'Visit ER immediately. Possible cardiac event.', nextAction: 'Call ambulance — do not drive.' },
    status: 'referred',
    doctorNotes: 'Referred to cardiologist. ECG done. No STEMI detected. Kept under observation.',
    createdAt: Date.now() - 86400000 * 11,
  },
];

const sampleReminders: Reminder[] = [
  { id: '1', title: 'Take Paracetamol', type: 'medication', time: '08:00 AM', enabled: true },
  { id: '2', title: 'Follow-up with Dr. Mehta', type: 'follow-up', time: '10:00 AM', enabled: true },
  { id: '3', title: 'AI Health Re-check', type: 'ai-check', time: '06:00 PM', enabled: false },
];

const initialState: PatientState = {
  profile: defaultProfile,
  currentEntry: emptyEntry,
  caseHistory: sampleHistory,
  reminders: sampleReminders,
  chatMessages: [],
  latestClassification: null,
  loading: false,
};

/* ─── actions ─── */
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_ENTRY'; payload: Partial<SymptomEntry> }
  | { type: 'RESET_ENTRY' }
  | { type: 'ADD_CASE'; payload: CaseRecord }
  | { type: 'UPDATE_PROFILE'; payload: Partial<PatientProfile> }
  | { type: 'TOGGLE_REMINDER'; payload: string }
  | { type: 'DELETE_REMINDER'; payload: string }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'ADD_CHAT'; payload: ChatMessage }
  | { type: 'CLEAR_CHAT' }
  | { type: 'SET_CLASSIFICATION'; payload: AIClassification | null };

function reducer(state: PatientState, action: Action): PatientState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_ENTRY':
      return { ...state, currentEntry: { ...state.currentEntry, ...action.payload } };
    case 'RESET_ENTRY':
      return { ...state, currentEntry: emptyEntry };
    case 'ADD_CASE':
      return { ...state, caseHistory: [action.payload, ...state.caseHistory] };
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'TOGGLE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.payload ? { ...r, enabled: !r.enabled } : r,
        ),
      };
    case 'DELETE_REMINDER':
      return { ...state, reminders: state.reminders.filter((r) => r.id !== action.payload) };
    case 'ADD_REMINDER':
      return { ...state, reminders: [...state.reminders, action.payload] };
    case 'ADD_CHAT':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };
    case 'CLEAR_CHAT':
      return { ...state, chatMessages: [] };
    case 'SET_CLASSIFICATION':
      return { ...state, latestClassification: action.payload };
    default:
      return state;
  }
}

/* ─── context ─── */
interface PatientContextValue extends PatientState {
  updateEntry: (data: Partial<SymptomEntry>) => void;
  resetEntry: () => void;
  addCase: (c: CaseRecord) => void;
  updateProfile: (p: Partial<PatientProfile>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  addReminder: (r: Reminder) => void;
  setLoading: (v: boolean) => void;
  addChat: (m: ChatMessage) => void;
  clearChat: () => void;
  setClassification: (c: AIClassification | null) => void;
}

const PatientContext = createContext<PatientContextValue | undefined>(undefined);

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export const PatientProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { token, fullName, role } = useAuth();

  // Sync profile from backend when token is available
  useEffect(() => {
    if (!token) return;
    fetchProfile(token)
      .then((user) => {
        dispatch({
          type: 'UPDATE_PROFILE',
          payload: {
            name: user.full_name || '',
            gender: user.gender || '',
            language: user.language_preference || 'en',
            age: user.date_of_birth ? calculateAge(user.date_of_birth) : 0,
          },
        });
      })
      .catch(() => {
        // Fallback: at least use the name from AuthContext
        if (fullName) {
          dispatch({ type: 'UPDATE_PROFILE', payload: { name: fullName } });
        }
      });
  }, [token, fullName]);

  const updateEntry = useCallback((d: Partial<SymptomEntry>) => dispatch({ type: 'UPDATE_ENTRY', payload: d }), []);
  const resetEntry = useCallback(() => dispatch({ type: 'RESET_ENTRY' }), []);
  const addCase = useCallback((c: CaseRecord) => dispatch({ type: 'ADD_CASE', payload: c }), []);
  const updateProfile = useCallback((p: Partial<PatientProfile>) => dispatch({ type: 'UPDATE_PROFILE', payload: p }), []);
  const toggleReminder = useCallback((id: string) => dispatch({ type: 'TOGGLE_REMINDER', payload: id }), []);
  const deleteReminder = useCallback((id: string) => dispatch({ type: 'DELETE_REMINDER', payload: id }), []);
  const addReminder = useCallback((r: Reminder) => dispatch({ type: 'ADD_REMINDER', payload: r }), []);
  const setLoading = useCallback((v: boolean) => dispatch({ type: 'SET_LOADING', payload: v }), []);
  const addChat = useCallback((m: ChatMessage) => dispatch({ type: 'ADD_CHAT', payload: m }), []);
  const clearChat = useCallback(() => dispatch({ type: 'CLEAR_CHAT' }), []);
  const setClassification = useCallback((c: AIClassification | null) => dispatch({ type: 'SET_CLASSIFICATION', payload: c }), []);

  const value = useMemo(
    () => ({ ...state, updateEntry, resetEntry, addCase, updateProfile, toggleReminder, deleteReminder, addReminder, setLoading, addChat, clearChat, setClassification }),
    [state, updateEntry, resetEntry, addCase, updateProfile, toggleReminder, deleteReminder, addReminder, setLoading, addChat, clearChat, setClassification],
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
};

export const usePatient = () => {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatient must be used within PatientProvider');
  return ctx;
};
