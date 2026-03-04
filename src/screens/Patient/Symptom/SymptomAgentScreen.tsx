import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { VoiceRecorder } from '../../../components/ui/VoiceRecorder';
import { Loader } from '../../../components/ui/Loader';
import { usePatient } from '../../../context/PatientContext';
import { classifySymptoms } from '../../../services/aiService';
import { ChatMessage, SymptomEntry, VitalsData } from '../../../models';
import { theme } from '../../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'SymptomAgentScreen'>;

/* ─── Symptom chips ─── */
const CHIPS = [
  'Fever', 'Cough', 'Headache', 'Chest pain',
  'Shortness of breath', 'Vomiting', 'Diarrhea', 'Dizziness',
];
const DURATIONS = ['1 day', '2–3 days', '1 week', 'More than 1 week'];

/* ─── Conversation phases ─── */
type Phase = 'input' | 'details' | 'vitals' | 'analyzing' | 'done';

export const SymptomAgentScreen: React.FC<Props> = ({ navigation }) => {
  const {
    currentEntry, updateEntry, resetEntry,
    addCase, addChat, clearChat, chatMessages, setClassification,
    latestClassification, profile,
  } = usePatient();

  const [phase, setPhase] = useState<Phase>('input');
  const [mode, setMode] = useState<'voice' | 'manual' | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const flatRef = useRef<FlatList>(null);

  /* ─── Chat helpers ─── */
  const pushUser = useCallback((text: string) => {
    const msg: ChatMessage = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    addChat(msg);
  }, [addChat]);

  const pushAI = useCallback((text: string) => {
    const msg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'ai', text, timestamp: Date.now() };
    addChat(msg);
  }, [addChat]);

  /* ─── Phase: input complete → move to details ─── */
  const confirmSymptoms = useCallback(() => {
    const allSymptoms = [
      ...currentEntry.symptoms,
      ...currentEntry.rawText.split(',').map((s: string) => s.trim()).filter(Boolean),
    ];
    if (allSymptoms.length === 0 && currentEntry.rawText.trim().length === 0) return;

    const symptomText = allSymptoms.length > 0 ? allSymptoms.join(', ') : currentEntry.rawText;
    pushUser(symptomText);
    pushAI('Got it. I need a few more details for an accurate analysis.\n\nHow long have you had these symptoms?');
    setPhase('details');
  }, [currentEntry, pushUser, pushAI]);

  /* ─── Phase: details complete → move to vitals ─── */
  const confirmDetails = useCallback(() => {
    if (currentEntry.severity <= 0) {
      updateEntry({ severity: 5 });
    }
    pushUser(`Duration: ${currentEntry.duration || 'Not specified'} • Severity: ${currentEntry.severity}/10${currentEntry.chronicIllness ? ' • Chronic illness' : ''}${currentEntry.pregnant ? ' • Pregnant' : ''}`);
    pushAI('Thank you. If you have any vital measurements (temperature, BP, SpO₂), enter them now. Otherwise, skip to analyze.');
    setPhase('vitals');
  }, [currentEntry, pushUser, pushAI, updateEntry]);

  /* ─── Phase: submit → AI classify ─── */
  const handleAnalyze = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    setSubmitting(true);
    setPhase('analyzing');

    const vitals = currentEntry.vitals;
    const vitalsText = [
      vitals.temperature ? `Temp: ${vitals.temperature}°F` : '',
      vitals.bloodPressure ? `BP: ${vitals.bloodPressure}` : '',
      vitals.oxygenSaturation ? `SpO₂: ${vitals.oxygenSaturation}%` : '',
    ].filter(Boolean).join(' • ') || 'No vitals provided';
    pushUser(vitalsText);
    pushAI('Analyzing your health condition…');

    try {
      const entry: SymptomEntry = {
        ...currentEntry,
        age: profile.age,
        medicalHistory: profile.medicalHistory,
        allergies: profile.allergies,
      };
      const result = await classifySymptoms(entry);
      setClassification(result);

      /* build case record */
      const allSymptoms = [
        ...currentEntry.symptoms,
        ...currentEntry.rawText.split(',').map((s: string) => s.trim()).filter(Boolean),
      ];
      const caseRecord = {
        id: Date.now().toString(),
        patientId: 'p1',
        date: new Date().toISOString().split('T')[0],
        symptomsText: allSymptoms.join(', ') || currentEntry.rawText,
        symptoms: allSymptoms,
        severity: currentEntry.severity,
        duration: currentEntry.duration,
        vitals: currentEntry.vitals,
        classification: result,
        result: {
          risk: result.riskLevel,
          guidance: result.guidance,
          nextAction: result.recommendedAction,
          homeRemedies: result.homeRemedies,
        },
        status: result.riskLevel === 'emergency'
          ? 'emergency_active' as const
          : result.riskLevel === 'moderate'
            ? 'doctor_assigned' as const
            : 'active' as const,
        createdAt: Date.now(),
      };
      addCase(caseRecord);

      pushAI(`Analysis complete.\n\nRisk: ${result.riskLevel.toUpperCase()}\nConfidence: ${(result.confidenceScore * 100).toFixed(0)}%\n\n${result.guidance}`);
      setPhase('done');

      /* immediate routing for emergency */
      if (result.riskLevel === 'emergency') {
        setTimeout(() => {
          resetEntry();
          navigation.replace('EmergencyDashboard', { classificationId: caseRecord.id });
        }, 1500);
      }
    } catch {
      pushAI('Something went wrong. Please try again.');
      setSubmitted(false);
      setPhase('vitals');
    } finally {
      setSubmitting(false);
    }
  }, [currentEntry, profile, pushUser, pushAI, addCase, setClassification, resetEntry, navigation, submitted]);

  /* ─── Navigate to result dashboard ─── */
  const goToResult = useCallback(() => {
    resetEntry();
    clearChat();
  }, [resetEntry, clearChat]);

  /* ─── Chip toggle ─── */
  const toggleChip = (chip: string) => {
    const lower = chip.toLowerCase();
    const arr = currentEntry.symptoms.includes(lower)
      ? currentEntry.symptoms.filter((s: string) => s !== lower)
      : [...currentEntry.symptoms, lower];
    updateEntry({ symptoms: arr });
  };

  /* ─── Send manual text ─── */
  const sendText = () => {
    if (!textDraft.trim()) return;
    updateEntry({ rawText: currentEntry.rawText ? `${currentEntry.rawText}, ${textDraft.trim()}` : textDraft.trim() });
    setTextDraft('');
  };

  /* ─── Render chat bubble ─── */
  const renderBubble = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {!isUser && <Text style={styles.aiLabel}>🤖 Health AI</Text>}
        <Text style={[styles.bubbleText, isUser && styles.userText]}>{item.text}</Text>
      </View>
    );
  };

  /* ─── MAIN RENDER ─── */
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.flex}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🤖 Health AI Assistant</Text>
          <Text style={styles.headerSub}>Describe your symptoms. I will analyze and guide you.</Text>
        </View>

        {/* ── Chat messages ── */}
        <FlatList
          ref={flatRef}
          data={chatMessages}
          renderItem={renderBubble}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            phase === 'input' ? (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>🩺</Text>
                <Text style={styles.emptyChatText}>How are you feeling today?{'\n'}Choose voice or manual entry below.</Text>
              </View>
            ) : null
          }
        />

        {/* ── Phase: input ── */}
        {phase === 'input' && (
          <View style={styles.inputArea}>
            {/* mode selection */}
            {!mode && (
              <View style={styles.modeRow}>
                <Pressable style={styles.modeBtn} onPress={() => setMode('voice')}>
                  <Text style={styles.modeBtnIcon}>🎤</Text>
                  <Text style={styles.modeBtnTxt}>Voice Input</Text>
                </Pressable>
                <Pressable style={styles.modeBtn} onPress={() => setMode('manual')}>
                  <Text style={styles.modeBtnIcon}>✍️</Text>
                  <Text style={styles.modeBtnTxt}>Manual Entry</Text>
                </Pressable>
              </View>
            )}

            {/* voice */}
            {mode === 'voice' && (
              <VoiceRecorder onResult={(text: string) => {
                updateEntry({ rawText: text });
                setMode('manual'); // show editable view after recording
              }} />
            )}

            {/* manual / post-voice */}
            {mode === 'manual' && (
              <>
                {currentEntry.rawText ? (
                  <Card>
                    <Text style={styles.fieldLabel}>Your Description</Text>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      value={currentEntry.rawText}
                      onChangeText={(t) => updateEntry({ rawText: t })}
                      placeholder="Edit or add more details…"
                    />
                  </Card>
                ) : (
                  <View style={styles.manualInputRow}>
                    <TextInput
                      style={styles.chatInput}
                      value={textDraft}
                      onChangeText={setTextDraft}
                      placeholder="Describe how you feel…"
                      multiline
                    />
                    <Pressable style={styles.sendBtn} onPress={sendText}>
                      <Text style={styles.sendBtnTxt}>↑</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}

            {/* chips */}
            {mode && (
              <>
                <Text style={styles.chipLabel}>Quick add symptoms:</Text>
                <View style={styles.chipRow}>
                  {CHIPS.map((c) => {
                    const sel = currentEntry.symptoms.includes(c.toLowerCase());
                    return (
                      <Pressable key={c} style={[styles.chip, sel && styles.chipSel]} onPress={() => toggleChip(c)}>
                        <Text style={[styles.chipTxt, sel && styles.chipTxtSel]}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable style={styles.primaryBtn} onPress={confirmSymptoms}>
                  <Text style={styles.primaryBtnTxt}>Continue →</Text>
                </Pressable>
                <Pressable style={styles.switchMode} onPress={() => setMode(mode === 'voice' ? 'manual' : 'voice')}>
                  <Text style={styles.switchTxt}>{mode === 'voice' ? '✍️ Switch to Manual' : '🎤 Switch to Voice'}</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* ── Phase: details ── */}
        {phase === 'details' && (
          <View style={styles.inputArea}>
            <Text style={styles.fieldLabel}>Duration</Text>
            <View style={styles.chipRow}>
              {DURATIONS.map((d) => {
                const active = currentEntry.duration === d;
                return (
                  <Pressable key={d} style={[styles.chip, active && styles.chipSel]} onPress={() => updateEntry({ duration: d })}>
                    <Text style={[styles.chipTxt, active && styles.chipTxtSel]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Severity ({currentEntry.severity}/10)</Text>
            <View style={styles.severityRow}>
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <Pressable
                  key={n}
                  style={[styles.sevDot, currentEntry.severity >= n && styles.sevDotActive]}
                  onPress={() => updateEntry({ severity: n })}
                >
                  <Text style={[styles.sevNum, currentEntry.severity >= n && styles.sevNumActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggleBtn, currentEntry.chronicIllness && styles.toggleActive]}
                onPress={() => updateEntry({ chronicIllness: !currentEntry.chronicIllness })}
              >
                <Text style={[styles.toggleTxt, currentEntry.chronicIllness && styles.toggleTxtActive]}>Chronic Illness</Text>
              </Pressable>
              {profile.gender === 'Female' && (
                <Pressable
                  style={[styles.toggleBtn, currentEntry.pregnant && styles.toggleActive]}
                  onPress={() => updateEntry({ pregnant: !currentEntry.pregnant })}
                >
                  <Text style={[styles.toggleTxt, currentEntry.pregnant && styles.toggleTxtActive]}>Pregnant</Text>
                </Pressable>
              )}
            </View>

            <Pressable style={styles.primaryBtn} onPress={confirmDetails}>
              <Text style={styles.primaryBtnTxt}>Continue →</Text>
            </Pressable>
          </View>
        )}

        {/* ── Phase: vitals ── */}
        {phase === 'vitals' && (
          <View style={styles.inputArea}>
            <View style={styles.vitalRow}>
              <Text style={styles.vitalLabel}>🌡️ Temp (°F)</Text>
              <TextInput
                style={styles.vitalInput}
                keyboardType="numeric"
                value={currentEntry.vitals.temperature}
                onChangeText={(t) => updateEntry({ vitals: { ...currentEntry.vitals, temperature: t } })}
                placeholder="98.6"
              />
            </View>
            {Number(currentEntry.vitals.temperature) > 103 && (
              <Text style={styles.warning}>⚠️ High temperature detected!</Text>
            )}

            <View style={styles.vitalRow}>
              <Text style={styles.vitalLabel}>💉 BP (mmHg)</Text>
              <TextInput
                style={styles.vitalInput}
                value={currentEntry.vitals.bloodPressure}
                onChangeText={(t) => updateEntry({ vitals: { ...currentEntry.vitals, bloodPressure: t } })}
                placeholder="120/80"
              />
            </View>

            <View style={styles.vitalRow}>
              <Text style={styles.vitalLabel}>💨 SpO₂ (%)</Text>
              <TextInput
                style={styles.vitalInput}
                keyboardType="numeric"
                value={currentEntry.vitals.oxygenSaturation}
                onChangeText={(t) => updateEntry({ vitals: { ...currentEntry.vitals, oxygenSaturation: t } })}
                placeholder="97"
              />
            </View>
            {Number(currentEntry.vitals.oxygenSaturation) > 0 && Number(currentEntry.vitals.oxygenSaturation) < 90 && (
              <Text style={styles.warning}>⚠️ Critical oxygen level detected!</Text>
            )}

            <Text style={styles.hintText}>Leave blank if you don't have a measurement device.</Text>

            <Pressable style={styles.primaryBtn} onPress={handleAnalyze}>
              <Text style={styles.primaryBtnTxt}>🔍 Analyze Symptoms</Text>
            </Pressable>
            <Pressable style={styles.skipBtn} onPress={handleAnalyze}>
              <Text style={styles.skipTxt}>Skip vitals & analyze</Text>
            </Pressable>
          </View>
        )}

        {/* ── Phase: analyzing ── */}
        {phase === 'analyzing' && submitting && (
          <View style={styles.loadingArea}>
            <Loader message="Analyzing your health condition…" />
          </View>
        )}

        {/* ── Phase: done ── */}
        {phase === 'done' && (
          <View style={styles.inputArea}>
            <Pressable style={styles.primaryBtn} onPress={() => {
              const cls = latestClassification;
              resetEntry();
              clearChat();
              if (!cls || cls.riskLevel === 'mild') {
                navigation.replace('MildCaseDashboard');
              } else if (cls.riskLevel === 'moderate') {
                navigation.replace('DoctorNeededDashboard');
              }
              // emergency already auto-routed
            }}>
              <Text style={styles.primaryBtnTxt}>View Full Result →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.background },
  header: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  headerSub: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  chatContent: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyChatIcon: { fontSize: 48, marginBottom: 12 },
  emptyChatText: { color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  bubble: { maxWidth: '82%', borderRadius: 16, padding: 14, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  aiLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: theme.colors.textPrimary },
  userText: { color: '#FFF' },
  inputArea: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 14 },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeBtn: { flex: 1, backgroundColor: '#F6F8FB', borderRadius: 14, paddingVertical: 20, alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB' },
  modeBtnIcon: { fontSize: 28, marginBottom: 6 },
  modeBtnTxt: { fontWeight: '700', color: theme.colors.textPrimary },
  manualInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  chatInput: { flex: 1, minHeight: 44, maxHeight: 100, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#F9FAFB', fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnTxt: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 8, marginTop: 10 },
  textArea: { minHeight: 70, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, backgroundColor: '#F9FAFB', fontSize: 15, textAlignVertical: 'top' },
  chipLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginTop: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF' },
  chipSel: { backgroundColor: '#EBF3FF', borderColor: theme.colors.primary },
  chipTxt: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTxtSel: { color: theme.colors.primary },
  primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  switchMode: { alignItems: 'center', marginTop: 10 },
  switchTxt: { color: theme.colors.primary, fontWeight: '600', fontSize: 14 },
  severityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sevDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  sevDotActive: { backgroundColor: theme.colors.primary },
  sevNum: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  sevNumActive: { color: '#FFF' },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  toggleBtn: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#FFF' },
  toggleActive: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' },
  toggleTxt: { fontWeight: '600', color: theme.colors.textSecondary },
  toggleTxtActive: { color: '#92400E' },
  vitalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  vitalLabel: { width: 100, fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  vitalInput: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#F9FAFB', fontSize: 15 },
  warning: { color: theme.colors.danger, fontWeight: '700', fontSize: 13, marginBottom: 6 },
  hintText: { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 4, fontSize: 12 },
  skipBtn: { alignItems: 'center', marginTop: 8 },
  skipTxt: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 14 },
  loadingArea: { height: 120, alignItems: 'center', justifyContent: 'center' },
});
