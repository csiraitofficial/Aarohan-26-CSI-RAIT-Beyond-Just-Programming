import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

// ── Backend URL resolution ──
// Uses Expo Constants to reliably extract the dev server host IP,
// then replaces the Metro port with the backend port (8000).
const BACKEND_PORT = 8000;

function getBaseUrl(): string {
  // Strategy 1: expo-constants debuggerHost / expoConfig.hostUri (most reliable)
  try {
    const debuggerHost: string | undefined =
      Constants.expoGoConfig?.debuggerHost ??
      (Constants as any).manifest?.debuggerHost ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
      Constants.expoConfig?.hostUri ??
      (Constants as any).manifest?.hostUri;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:${BACKEND_PORT}`;
      }
    }
  } catch (_) {}

  // Strategy 2: NativeModules.SourceCode.scriptURL
  try {
    const scriptURL: string = NativeModules?.SourceCode?.scriptURL ?? '';
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:${BACKEND_PORT}`;
      }
    }
  } catch (_) {}

  // Strategy 3: Android emulator uses 10.0.2.2 to reach host localhost
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

// HTTPS check disabled for local development
// if (!BASE_URL.startsWith('https://')) {
//   throw new Error('HTTPS is required for all API traffic.');
// }

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;
  console.log(`[API] ${options.method ?? 'GET'} ${url}`);
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use the default message
    }
    
    // Special handling for common errors
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (response.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (response.status === 404) {
      throw new Error('Service not found. Please check your connection.');
    } else if (response.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
}

/* ─── Authentication API ─── */

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
    role: string;
  };
}

export interface RegisterData {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
  gender?: string;
  date_of_birth?: string;
}

export interface LoginData {
  phone: string;
  password: string;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: data,
  });
}

export async function login(data: LoginData): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: data,
  });
}

/* ─── Symptom Agent API ─── */

export interface AgentResponse {
  session_id: string;
  agent_message: string;
  conversation_state: string;
  turn_number: number;
  symptoms_identified: string[];
  is_emergency: boolean;
  emergency_message?: string | null;
  progress_pct: number;
  question_type?: string;
  /** Medically-contextual answer options derived from the question tree. */
  options?: string[] | null;
}

export interface TriageResult {
  session_id: string;
  message?: string;
  triage_level: 'mild' | 'moderate' | 'emergency';
  primary_concern: string | null;
  recommendations: string[] | null;
  warning_signs: string[] | null;
  home_remedies: string[] | null;
  urgency_score: number | null;
  follow_up_needed: boolean;
  follow_up_timeframe: string | null;
}

export interface ConversationTurn {
  turn_number: number;
  agent_question: string;
  patient_response: string | null;
  question_type: string | null;
}

export interface ConversationHistory {
  session_id: string;
  conversation_state: string;
  turns: ConversationTurn[];
  symptoms_collected: number;
}

export async function startSymptomSession(message: string, token: string, language: string = 'en'): Promise<AgentResponse> {
  return apiRequest<AgentResponse>('/api/symptom-agent/start', {
    method: 'POST',
    body: { initial_message: message, language },
    token,
  });
}

export async function respondToAgent(sessionId: string, message: string, token: string): Promise<AgentResponse> {
  return apiRequest<AgentResponse>(`/api/symptom-agent/${sessionId}/respond`, {
    method: 'POST',
    body: { message },
    token,
  });
}

export async function completeSymptomSession(sessionId: string, token: string): Promise<TriageResult> {
  return apiRequest<TriageResult>(`/api/symptom-agent/${sessionId}/complete`, {
    method: 'POST',
    token,
  });
}

export async function getConversationHistory(sessionId: string, token: string): Promise<ConversationHistory> {
  return apiRequest<ConversationHistory>(`/api/symptom-agent/${sessionId}/conversation`, {
    token,
  });
}

/* ─── Voice Transcription API ─── */

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number | null;
  status: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  bcp47_code: string;
}

/**
 * Transcribe an audio file via AssemblyAI backend.
 * Sends the file as multipart/form-data.
 */
export async function transcribeVoice(
  audioUri: string,
  language: string,
  token: string,
): Promise<TranscriptionResult> {
  const formData = new FormData();

  // Create file object for React Native FormData
  const uriParts = audioUri.split('.');
  const fileExtension = uriParts[uriParts.length - 1];
  const mimeType = fileExtension === 'wav' ? 'audio/wav'
    : fileExtension === 'webm' ? 'audio/webm'
    : fileExtension === 'm4a' ? 'audio/m4a'
    : 'audio/mpeg';

  formData.append('audio', {
    uri: audioUri,
    name: `recording.${fileExtension}`,
    type: mimeType,
  } as any);
  formData.append('language', language);

  const response = await fetch(`${getBaseUrl()}/api/voice/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type — fetch sets it automatically with boundary for FormData
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Transcription failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {}

    if (response.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as TranscriptionResult;
}

export async function getSupportedLanguages(token: string): Promise<SupportedLanguage[]> {
  return apiRequest<SupportedLanguage[]>('/api/voice/languages', { token });
}