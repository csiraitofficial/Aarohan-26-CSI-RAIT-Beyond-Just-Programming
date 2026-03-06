const BASE_URL = 'http://192.168.137.174:8000';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
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
  role?: string;
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

/* ─── Video Call API ─── */

export interface VideoRoomResponse {
  room_url: string;
  room_name: string;
  consultation_id: string | null;
}

export async function createVideoRoom(token: string, consultationId?: string): Promise<VideoRoomResponse> {
  return apiRequest<VideoRoomResponse>('/api/video/create-room', {
    method: 'POST',
    body: { consultation_id: consultationId ?? null },
    token,
  });
}

export async function joinVideoRoom(consultationId: string, token: string): Promise<VideoRoomResponse> {
  return apiRequest<VideoRoomResponse>(`/api/video/join/${encodeURIComponent(consultationId)}`, {
    token,
  });
}

export async function endVideoRoom(consultationId: string, token: string): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>(`/api/video/end-room/${encodeURIComponent(consultationId)}`, {
    method: 'DELETE',
    token,
  });
}