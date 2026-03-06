import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { usePatient } from '../../../context/PatientContext';
import { useAuth } from '../../../context/AuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { ChatMessage } from '../../../models';
import {
  startSymptomSession,
  respondToAgent,
  completeSymptomSession,
  AgentResponse,
  TriageResult,
} from '../../../services/api';

type Props = NativeStackScreenProps<PatientStackParamList, 'SymptomAgentScreen'>;
type ConvoState = 'initial' | 'chatting' | 'analyzing' | 'complete';

const MAX_QUESTIONS = 6;

/* ─── Quick illness chips shown on welcome screen ─── */
const QUICK_SYMPTOMS = [
  { label: 'Headache',     emoji: '🤕' },
  { label: 'Fever',        emoji: '🌡️' },
  { label: 'Cough',        emoji: '😷' },
  { label: 'Cold / Runny Nose', emoji: '🤧' },
  { label: 'Stomach Ache', emoji: '🤢' },
  { label: 'Vomiting',     emoji: '🤮' },
  { label: 'Body Pain',    emoji: '💪' },
  { label: 'Chest Pain',   emoji: '❤️' },
  { label: 'Sore Throat',  emoji: '🗣️' },
  { label: 'Diarrhea',     emoji: '🚽' },
  { label: 'Dizziness',    emoji: '😵' },
  { label: 'Weakness',     emoji: '😴' },
];

/**
 * Return answer-chip options for an AI question.
 *
 * PRIMARY SOURCE: `backendOptions` — the backend extracts medically-accurate,
 * question-specific options from the curated symptom questionnaires
 * (e.g. headache locations = "front of head, back of head, one side, …"
 *  vs. chest pain locations = "center, left side, right side, …").
 *
 * FALLBACK: minimal text-based detection for safety (numbered lists,
 * parenthetical options in the AI message text).
 *
 * NO hardcoded option lists on the frontend — all medical knowledge
 * lives in the backend questionnaire data.
 *
 * Returns null  → render a free-text input
 * Returns array → render tappable answer chips
 */
function extractOptions(
  text: string,
  backendOptions?: string[] | null,
): string[] | null {
  // ── 1. Backend-provided options (source of truth) ──────────────────────
  if (backendOptions && backendOptions.length > 0) {
    return backendOptions;
  }

  // ── 2. Numbered list in the AI message text ────────────────────────────
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const numbered = lines.filter(l => /^\d+[\.\)]\s+.+/.test(l));
  if (numbered.length >= 2) {
    return numbered.map(l => l.replace(/^\d+[\.\)]\s+/, '').trim());
  }

  // ── 3. Parenthetical option list in the AI message text ────────────────
  //    e.g. "(option A, option B, option C)"
  const parenMatches = text.match(/\(([^)]{8,})\)/g);
  if (parenMatches) {
    for (let i = parenMatches.length - 1; i >= 0; i--) {
      const inner = parenMatches[i].slice(1, -1);   // strip ( )
      if (inner.includes(',')) {
        const opts = inner.split(',').map(o => o.trim()).filter(Boolean);
        if (opts.length >= 2) {
          return opts.map(o => o.charAt(0).toUpperCase() + o.slice(1));
        }
      }
    }
  }

  return null;   // default → free-text input
}

export const SymptomAgentScreen: React.FC<Props> = ({ navigation }) => {
  const {
    addChat, clearChat, chatMessages, setClassification, resetEntry,
    addCase,
  } = usePatient();
  const { token, userId } = useAuth();
  const { language } = useLanguage();

  const [convoState, setConvoState] = useState<ConvoState>('initial');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentOptions, setCurrentOptions] = useState<string[] | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  /* ─── Clear chat on mount ─── */
  useEffect(() => {
    clearChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Message helpers ─── */
  const pushUser = useCallback((text: string) => {
    const msg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text, timestamp: Date.now() };
    addChat(msg);
  }, [addChat]);

  const pushAI = useCallback((text: string, backendOptions?: string[] | null) => {
    const msg: ChatMessage = { id: `ai-${Date.now()}-${Math.random()}`, role: 'ai', text, timestamp: Date.now() };
    addChat(msg);
    // Use backend-provided options as primary source of truth
    const opts = extractOptions(text, backendOptions);
    setCurrentOptions(opts);
    setShowTextInput(opts === null);
  }, [addChat]);

  /* ─── Handle completion & routing ─── */
  const handleComplete = useCallback(async (sid: string) => {
    setConvoState('analyzing');
    setIsTyping(true);
    setCurrentOptions(null);
    setShowTextInput(false);

    try {
      const result: TriageResult = await completeSymptomSession(sid, token!);

      // Map to AIClassification for context compatibility
      const classification = {
        riskLevel: result.triage_level,
        confidenceScore: (result.urgency_score || 5) / 10,
        recommendedAction: result.recommendations?.[0] || 'Consult a doctor',
        redFlagsDetected: result.triage_level === 'emergency',
        requiresDoctor: result.triage_level !== 'mild',
        guidance: result.primary_concern || 'Analysis complete',
        homeRemedies: result.home_remedies || [],
        warningSignsToWatch: result.warning_signs || [],
        escalationReason: result.triage_level === 'emergency' ? result.primary_concern : undefined,
      };
      setClassification(classification);

      // Build case record
      const caseRecord = {
        id: sid,
        patientId: userId || 'unknown',
        date: new Date().toISOString().split('T')[0],
        symptomsText: result.primary_concern || '',
        symptoms: [] as string[],
        severity: result.urgency_score || 5,
        duration: '',
        vitals: { temperature: '', bloodPressure: '', oxygenSaturation: '' },
        classification,
        result: {
          risk: result.triage_level,
          guidance: result.primary_concern || '',
          nextAction: result.recommendations?.[0] || '',
          homeRemedies: classification.homeRemedies,
        },
        status: result.triage_level === 'emergency'
          ? 'emergency_active' as const
          : result.triage_level === 'moderate'
            ? 'doctor_assigned' as const
            : 'active' as const,
        createdAt: Date.now(),
      };
      addCase(caseRecord);

      setConvoState('complete');
      setIsTyping(false);

      setTimeout(() => {
        resetEntry();
        clearChat();
        if (result.triage_level === 'emergency') {
          navigation.replace('EmergencyDashboard', { classificationId: sid });
        } else if (result.triage_level === 'moderate') {
          navigation.replace('DoctorNeededDashboard');
        } else {
          navigation.replace('MildCaseDashboard');
        }
      }, 1800);
    } catch {
      setIsTyping(false);
      setError('Failed to complete analysis. Please try again.');
      setConvoState('chatting');
      pushAI('I had trouble completing the analysis. Please try again.');
    }
  }, [token, pushAI, setClassification, addCase, resetEntry, clearChat, navigation]);

  /* ─── Core send (accepts text param — used by chips + text input) ─── */
  const sendMessage = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || isTyping) return;
    if (!token) {
      setError('Please log in to continue.');
      return;
    }

    setTextDraft('');
    setError(null);
    setCurrentOptions(null);
    setShowTextInput(false);
    pushUser(clean);
    setIsTyping(true);

    try {
      if (!sessionId) {
        const response: AgentResponse = await startSymptomSession(clean, token, language);
        setSessionId(response.session_id);
        setConvoState('chatting');
        setQuestionCount(1);

        if (response.is_emergency) {
          pushAI('🚨 ' + response.agent_message);
          setIsTyping(false);
          await handleComplete(response.session_id);
          return;
        }
        pushAI(response.agent_message, response.options);
        if (response.conversation_state === 'complete') {
          setIsTyping(false);
          await handleComplete(response.session_id);
        }
      } else {
        const response: AgentResponse = await respondToAgent(sessionId, clean, token);
        const newCount = questionCount + 1;
        setQuestionCount(newCount);

        if (response.is_emergency) {
          pushAI('🚨 ' + response.agent_message);
          setIsTyping(false);
          await handleComplete(sessionId);
          return;
        }
        pushAI(response.agent_message, response.options);
        if (response.conversation_state === 'complete' || newCount >= MAX_QUESTIONS) {
          setIsTyping(false);
          await handleComplete(sessionId);
        }
      }
    } catch (err) {
      console.error('Symptom agent error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      pushAI('Sorry, something went wrong. Please try again.');
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, token, sessionId, questionCount, pushUser, pushAI, handleComplete]);

  /* ─── Quick illness chip tap (welcome screen) ─── */
  const onQuickSymptom = useCallback((label: string) => {
    sendMessage(`I have ${label}`);
  }, [sendMessage]);

  /* ─── Answer option chip tap ─── */
  const onOptionTap = useCallback((option: string) => {
    sendMessage(option);
  }, [sendMessage]);

  /* ─── "Other" chip tap → reveal text input ─── */
  const onOtherTap = useCallback(() => {
    setShowTextInput(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  /* ─── Render chat bubble ─── */
  const renderBubble = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleWrap, isUser ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>+</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  /* ══════════════════════════════════════
     WELCOME SCREEN
  ══════════════════════════════════════ */
  if (convoState === 'initial') {
    return (
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.welcomeScroll} keyboardShouldPersistTaps="handled">
          {/* Branding header */}
          <View style={styles.welcomeHeader}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>+</Text>
            </View>
            <Text style={styles.welcomeTitle}>SwasthyaSaathi</Text>
            <Text style={styles.welcomeSubtitle}>Your AI Health Assistant</Text>
          </View>

          {/* Greeting */}
          <View style={styles.greetingBox}>
            <Text style={styles.greetingHi}>Hello 👋</Text>
            <Text style={styles.greetingQ}>How are you feeling today?</Text>
            <Text style={styles.greetingHint}>Tap a symptom below, or describe in your own words</Text>
          </View>

          {/* Quick illness grid */}
          <View style={styles.chipGrid}>
            {QUICK_SYMPTOMS.map((s) => (
              <Pressable
                key={s.label}
                style={({ pressed }) => [styles.symptomChip, pressed && styles.chipPressed]}
                onPress={() => onQuickSymptom(s.label)}
                disabled={isTyping}
              >
                <Text style={styles.symptomEmoji}>{s.emoji}</Text>
                <Text style={styles.symptomLabel}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Separator */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or type below</Text>
            <View style={styles.orLine} />
          </View>
        </ScrollView>

        {/* Input bar */}
        <View style={styles.bottomBar}>
          {isTyping && (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={PRIMARY} />
              <Text style={styles.typingText}>Connecting to Health AI…</Text>
            </View>
          )}
          {error && (
            <Pressable onPress={() => setError(null)}>
              <Text style={styles.errorTextSmall}>⚠️ {error}  (tap to dismiss)</Text>
            </Pressable>
          )}
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={textDraft}
              onChangeText={setTextDraft}
              placeholder="e.g. I have a headache since morning…"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              editable={!isTyping}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(textDraft)}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendBtn, (!textDraft.trim() || isTyping) && styles.sendBtnOff]}
              onPress={() => sendMessage(textDraft)}
              disabled={!textDraft.trim() || isTyping}
            >
              <Text style={styles.sendBtnIcon}>↑</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  /* ══════════════════════════════════════
     ANALYZING / COMPLETE SCREEN
  ══════════════════════════════════════ */
  if (convoState === 'analyzing' || convoState === 'complete') {
    return (
      <View style={styles.analyzingRoot}>
        <View style={styles.analyzingCard}>
          <ActivityIndicator size="large" color={PRIMARY} style={{ marginBottom: 20 }} />
          <Text style={styles.analyzingTitle}>Analyzing your health</Text>
          <Text style={styles.analyzingSubtitle}>
            Our AI is reviewing your symptoms and preparing a personalized assessment…
          </Text>
          <View style={styles.analyzingDots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.analyzingDot} />
            ))}
          </View>
        </View>
      </View>
    );
  }

  /* ══════════════════════════════════════
     CHAT SCREEN
  ══════════════════════════════════════ */
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          <View style={styles.logoCircleSmall}>
            <Text style={styles.logoTextSmall}>+</Text>
          </View>
          <View>
            <Text style={styles.chatHeaderTitle}>Health AI</Text>
            <Text style={styles.chatHeaderSub}>
              {isTyping ? 'typing…' : `Step ${questionCount} of ${MAX_QUESTIONS}`}
            </Text>
          </View>
        </View>
        <View style={styles.progressDots}>
          {Array.from({ length: MAX_QUESTIONS }).map((_, i) => (
            <View key={i} style={[styles.dot, i < questionCount ? styles.dotFilled : styles.dotEmpty]} />
          ))}
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={chatMessages}
        renderItem={renderBubble}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Typing bubble */}
      {isTyping && (
        <View style={styles.typingBubble}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>+</Text>
          </View>
          <View style={styles.typingDotsBox}>
            <Text style={styles.typingDotsText}>● ● ●</Text>
          </View>
        </View>
      )}

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {error}</Text>
          <Pressable onPress={() => setError(null)}>
            <Text style={styles.errorBannerClose}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Answer option chips */}
      {!isTyping && currentOptions && currentOptions.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsHint}>Tap your answer 👇</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.optionsScroll}
          >
            {currentOptions.map((opt) => (
              <Pressable
                key={opt}
                style={({ pressed }) => [styles.optionChip, pressed && styles.optionChipPressed]}
                onPress={() => onOptionTap(opt)}
              >
                <Text style={styles.optionChipText}>{opt}</Text>
              </Pressable>
            ))}
            {!showTextInput && (
              <Pressable
                style={({ pressed }) => [styles.optionChipOther, pressed && styles.optionChipPressed]}
                onPress={onOtherTap}
              >
                <Text style={styles.optionChipOtherText}>✏️  Other…</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      )}

      {/* Text input – shown when no options OR "Other" was tapped */}
      {!isTyping && showTextInput && (
        <View style={styles.bottomBar}>
          <View style={styles.inputRow}>
            {currentOptions && (
              <Pressable style={styles.backBtn} onPress={() => setShowTextInput(false)}>
                <Text style={styles.backBtnText}>← Options</Text>
              </Pressable>
            )}
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={textDraft}
              onChangeText={setTextDraft}
              placeholder="Type your answer…"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              editable={!isTyping}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(textDraft)}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendBtn, (!textDraft.trim() || isTyping) && styles.sendBtnOff]}
              onPress={() => sendMessage(textDraft)}
              disabled={!textDraft.trim() || isTyping}
            >
              <Text style={styles.sendBtnIcon}>↑</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Fallback: no options detected → always show text input */}
      {!isTyping && !currentOptions && !showTextInput && (
        <View style={styles.bottomBar}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              value={textDraft}
              onChangeText={setTextDraft}
              placeholder="Type your answer…"
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              editable={!isTyping}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(textDraft)}
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendBtn, (!textDraft.trim() || isTyping) && styles.sendBtnOff]}
              onPress={() => sendMessage(textDraft)}
              disabled={!textDraft.trim() || isTyping}
            >
              <Text style={styles.sendBtnIcon}>↑</Text>
            </Pressable>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

/* ════════════════════════════════════════════
   STYLES
════════════════════════════════════════════ */
const PRIMARY = '#0A84FF';
const BG = '#F6F8FB';
const WHITE = '#FFFFFF';
const TEXT = '#111827';
const SUBTLE = '#6B7280';
const BORDER = '#E5E7EB';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* ── Welcome ── */
  welcomeScroll: { paddingBottom: 170 },
  welcomeHeader: { alignItems: 'center', paddingTop: 52, paddingBottom: 8 },
  logoCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  logoText: { color: WHITE, fontSize: 34, fontWeight: '900' },
  welcomeTitle: { fontSize: 26, fontWeight: '800', color: TEXT },
  welcomeSubtitle: { fontSize: 14, color: SUBTLE, marginTop: 4 },

  greetingBox: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
  greetingHi: { fontSize: 30, fontWeight: '700', color: TEXT },
  greetingQ: { fontSize: 18, color: TEXT, marginTop: 6, fontWeight: '500' },
  greetingHint: { fontSize: 13, color: SUBTLE, marginTop: 8, lineHeight: 20 },

  chipGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginTop: 12,
  },
  symptomChip: {
    width: '29%',
    backgroundColor: WHITE,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chipPressed: { backgroundColor: '#EBF4FF', borderColor: PRIMARY },
  symptomEmoji: { fontSize: 30 },
  symptomLabel: { fontSize: 11, color: TEXT, marginTop: 6, fontWeight: '600', textAlign: 'center' },

  orRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginTop: 24, gap: 10,
  },
  orLine: { flex: 1, height: 1, backgroundColor: BORDER },
  orText: { color: SUBTLE, fontSize: 13 },

  /* ── Bottom bar (welcome + chat text input) ── */
  bottomBar: {
    backgroundColor: WHITE,
    borderTopWidth: 1, borderTopColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typingText: { color: SUBTLE, fontSize: 13, fontStyle: 'italic' },
  errorTextSmall: { color: '#DC2626', fontSize: 13, marginBottom: 8 },

  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  textInput: {
    flex: 1,
    minHeight: 46, maxHeight: 110,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 24,
    paddingHorizontal: 18, paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 15, color: TEXT,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  sendBtnOff: { opacity: 0.35 },
  sendBtnIcon: { color: WHITE, fontSize: 22, fontWeight: '700' },

  /* ── Analyzing ── */
  analyzingRoot: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 32 },
  analyzingCard: {
    backgroundColor: WHITE, borderRadius: 24, padding: 36,
    alignItems: 'center', width: '100%',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  analyzingTitle: { fontSize: 22, fontWeight: '800', color: TEXT, textAlign: 'center' },
  analyzingSubtitle: { fontSize: 14, color: SUBTLE, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  analyzingDots: { flexDirection: 'row', gap: 8, marginTop: 24 },
  analyzingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY, opacity: 0.5 },

  /* ── Chat header ── */
  chatHeader: {
    backgroundColor: WHITE,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircleSmall: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  logoTextSmall: { color: WHITE, fontSize: 20, fontWeight: '900' },
  chatHeaderTitle: { fontSize: 16, fontWeight: '700', color: TEXT },
  chatHeaderSub: { fontSize: 12, color: SUBTLE, marginTop: 1 },
  progressDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotFilled: { backgroundColor: PRIMARY },
  dotEmpty: { backgroundColor: BORDER },

  /* ── Chat list ── */
  chatList: { paddingHorizontal: 12, paddingVertical: 16, flexGrow: 1 },

  /* ── Bubbles ── */
  bubbleWrap: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  bubbleWrapLeft: { justifyContent: 'flex-start' },
  bubbleWrapRight: { justifyContent: 'flex-end' },
  aiAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6, flexShrink: 0,
  },
  aiAvatarText: { color: WHITE, fontSize: 14, fontWeight: '900' },
  bubble: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  aiBubble: {
    backgroundColor: WHITE,
    borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  userBubble: { backgroundColor: PRIMARY, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: TEXT },
  userBubbleText: { color: WHITE },

  /* ── Typing bubble ── */
  typingBubble: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 6 },
  typingDotsBox: {
    backgroundColor: WHITE, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  typingDotsText: { fontSize: 10, color: SUBTLE, letterSpacing: 5 },

  /* ── Error banner ── */
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16, paddingVertical: 10,
    marginHorizontal: 12, borderRadius: 10, marginBottom: 4,
  },
  errorBannerText: { color: '#DC2626', fontSize: 13, flex: 1 },
  errorBannerClose: { color: '#DC2626', fontSize: 18, fontWeight: '700', paddingLeft: 12 },

  /* ── Q&A option chips ── */
  optionsContainer: {
    backgroundColor: BG,
    paddingTop: 10, paddingBottom: 6,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  optionsHint: { fontSize: 12, color: SUBTLE, paddingHorizontal: 16, marginBottom: 8, fontWeight: '600' },
  optionsScroll: { paddingHorizontal: 12, gap: 8, paddingBottom: 10 },
  optionChip: {
    backgroundColor: WHITE,
    borderRadius: 22, paddingVertical: 11, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: PRIMARY,
  },
  optionChipPressed: { backgroundColor: '#EBF4FF' },
  optionChipText: { color: PRIMARY, fontSize: 14, fontWeight: '700' },
  optionChipOther: {
    backgroundColor: '#F3F4F6',
    borderRadius: 22, paddingVertical: 11, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: BORDER,
  },
  optionChipOtherText: { color: SUBTLE, fontSize: 14, fontWeight: '600' },

  backBtn: { paddingRight: 4 },
  backBtnText: { color: PRIMARY, fontSize: 13, fontWeight: '600' },
});