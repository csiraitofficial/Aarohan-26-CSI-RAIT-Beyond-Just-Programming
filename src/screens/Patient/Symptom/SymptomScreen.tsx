import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { StepIndicator } from '../../../components/ui/StepIndicator';
import { VoiceRecorder } from '../../../components/ui/VoiceRecorder';
import { Card } from '../../../components/ui/Card';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { Loader } from '../../../components/ui/Loader';
import { usePatient } from '../../../context/PatientContext';
import { assessSymptoms } from '../../../services/aiService';
import { theme } from '../../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'SymptomScreen'>;

const STEPS = ['Symptoms', 'Details', 'Vitals', 'Review'];

const CHIPS = ['Fever', 'Cough', 'Headache', 'Fatigue', 'Chest Pain', 'Nausea', 'Sore Throat', 'Body Aches'];
const DURATIONS = ['1 day', '2–3 days', '1 week', 'More than 1 week'];

export const SymptomScreen: React.FC<Props> = ({ navigation }) => {
  const { currentEntry, updateEntry, resetEntry, addCase, setLoading, loading } = usePatient();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'voice' | 'manual'>('voice');
  const [submitting, setSubmitting] = useState(false);

  /* helpers */
  const toggleChip = (chip: string) => {
    const lower = chip.toLowerCase();
    const arr = currentEntry.symptoms.includes(lower)
      ? currentEntry.symptoms.filter((s: string) => s !== lower)
      : [...currentEntry.symptoms, lower];
    updateEntry({ symptoms: arr });
  };

  const canNext = () => {
    if (step === 0) return currentEntry.symptoms.length > 0 || currentEntry.rawText.trim().length > 0;
    if (step === 1) return currentEntry.severity > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const allSymptoms = [
        ...currentEntry.symptoms,
        ...currentEntry.rawText.split(',').map((s: string) => s.trim()).filter(Boolean),
      ];
      const result = await assessSymptoms(allSymptoms);
      const record = {
        id: Date.now().toString(),
        patientId: 'patient_001',
        date: new Date().toISOString().split('T')[0],
        symptoms: allSymptoms,
        symptomsText: allSymptoms.join(', '),
        severity: currentEntry.severity,
        duration: '1 day',
        vitals: currentEntry.vitals,
        result,
        classification: {
          riskLevel: result.risk,
          confidenceScore: 0.7,
          recommendedAction: result.nextAction,
          redFlagsDetected: false,
          requiresDoctor: result.risk !== 'mild',
          guidance: result.guidance,
        },
        status: result.risk === 'emergency' ? 'referred' as const : 'pending' as const,
        createdAt: Date.now(),
      };
      addCase(record);
      resetEntry();
      navigation.replace('AISubmitScreen', result);
    } catch {
      // fallback
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) return <Loader message="AI is analyzing your symptoms…" />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StepIndicator steps={STEPS} current={step} />

        {/* ── STEP 0: Symptoms ── */}
        {step === 0 && (
          <>
            <View style={styles.modeRow}>
              <Pressable style={[styles.modeBtn, mode === 'voice' && styles.modeBtnActive]} onPress={() => setMode('voice')}>
                <Text style={[styles.modeTxt, mode === 'voice' && styles.modeTxtActive]}>🎙️ Voice</Text>
              </Pressable>
              <Pressable style={[styles.modeBtn, mode === 'manual' && styles.modeBtnActive]} onPress={() => setMode('manual')}>
                <Text style={[styles.modeTxt, mode === 'manual' && styles.modeTxtActive]}>✍️ Manual</Text>
              </Pressable>
            </View>

            {mode === 'voice' ? (
              <VoiceRecorder onResult={(text: string) => updateEntry({ rawText: text })} />
            ) : null}

            {currentEntry.rawText ? (
              <Card>
                <Text style={styles.fieldLabel}>Transcribed / Your Input</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  value={currentEntry.rawText}
                  onChangeText={(t) => updateEntry({ rawText: t })}
                  placeholder="Edit or type your symptoms…"
                />
              </Card>
            ) : null}

            {mode === 'manual' && !currentEntry.rawText ? (
              <Card>
                <Text style={styles.fieldLabel}>Describe your symptoms</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  value={currentEntry.rawText}
                  onChangeText={(t) => updateEntry({ rawText: t })}
                  placeholder="e.g. I have fever and headache since 2 days…"
                />
              </Card>
            ) : null}

            <Text style={styles.fieldLabel}>Quick add</Text>
            <View style={styles.chipRow}>
              {CHIPS.map((c) => {
                const selected = currentEntry.symptoms.includes(c.toLowerCase());
                return (
                  <Pressable key={c} style={[styles.chip, selected && styles.chipSelected]} onPress={() => toggleChip(c)}>
                    <Text style={[styles.chipTxt, selected && styles.chipTxtSelected]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* ── STEP 1: Details ── */}
        {step === 1 && (
          <>
            <Text style={styles.fieldLabel}>Duration</Text>
            <View style={styles.chipRow}>
              {DURATIONS.map((d) => {
                const active = currentEntry.duration === d;
                return (
                  <Pressable key={d} style={[styles.chip, active && styles.chipSelected]} onPress={() => updateEntry({ duration: d })}>
                    <Text style={[styles.chipTxt, active && styles.chipTxtSelected]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Severity ({currentEntry.severity}/10)</Text>
            <View style={styles.sliderRow}>
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <Pressable
                  key={n}
                  style={[styles.sliderDot, currentEntry.severity >= n && styles.sliderDotActive]}
                  onPress={() => updateEntry({ severity: n })}
                >
                  <Text style={[styles.sliderNum, currentEntry.severity >= n && styles.sliderNumActive]}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelTxt}>Mild</Text>
              <Text style={styles.sliderLabelTxt}>Moderate</Text>
              <Text style={styles.sliderLabelTxt}>Severe</Text>
            </View>

            <Text style={styles.fieldLabel}>Medical History (optional)</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.medicalHistory}
              onChangeText={(t) => updateEntry({ medicalHistory: t })}
              placeholder="e.g. Diabetes, Hypertension"
            />

            <Text style={styles.fieldLabel}>Allergies (optional)</Text>
            <TextInput
              style={styles.input}
              value={currentEntry.allergies.join(', ')}
              onChangeText={(t) => updateEntry({ allergies: t.split(',').map((a) => a.trim()).filter(Boolean) })}
              placeholder="e.g. Penicillin, Peanuts"
            />
          </>
        )}

        {/* ── STEP 2: Vitals ── */}
        {step === 2 && (
          <>
            <Card>
              <Text style={styles.vitalIcon}>🌡️ Temperature (°F)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={currentEntry.vitals.temperature}
                onChangeText={(t) => updateEntry({ vitals: { ...currentEntry.vitals, temperature: t } })}
                placeholder="e.g. 98.6"
              />
              {Number(currentEntry.vitals.temperature) > 103 && (
                <Text style={styles.warning}>⚠️ High temperature detected!</Text>
              )}
            </Card>
            <Card>
              <Text style={styles.vitalIcon}>💉 Blood Pressure (mmHg)</Text>
              <TextInput
                style={styles.input}
                value={currentEntry.vitals.bloodPressure}
                onChangeText={(t) => updateEntry({ vitals: { ...currentEntry.vitals, bloodPressure: t } })}
                placeholder="e.g. 120/80"
              />
            </Card>
            <Card>
              <Text style={styles.vitalIcon}>💨 Oxygen Saturation (%)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={currentEntry.vitals.oxygenSaturation}
                onChangeText={(t) => updateEntry({ vitals: { ...currentEntry.vitals, oxygenSaturation: t } })}
                placeholder="e.g. 97"
              />
              {Number(currentEntry.vitals.oxygenSaturation) > 0 && Number(currentEntry.vitals.oxygenSaturation) < 90 && (
                <Text style={styles.warning}>⚠️ Low SpO₂! Seek immediate help.</Text>
              )}
            </Card>
            <Text style={styles.hintText}>Leave blank if you don't have a measurement device.</Text>
          </>
        )}

        {/* ── STEP 3: Review ── */}
        {step === 3 && (
          <Card>
            <Text style={styles.reviewTitle}>Review Summary</Text>
            <Text style={styles.reviewLabel}>Symptoms</Text>
            <Text style={styles.reviewVal}>
              {[...currentEntry.symptoms, ...currentEntry.rawText.split(',').map((s: string) => s.trim()).filter(Boolean)].join(', ') || '—'}
            </Text>
            <Text style={styles.reviewLabel}>Duration</Text>
            <Text style={styles.reviewVal}>{currentEntry.duration || 'Not specified'}</Text>
            <Text style={styles.reviewLabel}>Severity</Text>
            <Text style={styles.reviewVal}>{currentEntry.severity}/10</Text>
            <Text style={styles.reviewLabel}>Temperature</Text>
            <Text style={styles.reviewVal}>{currentEntry.vitals.temperature || '—'} °F</Text>
            <Text style={styles.reviewLabel}>Blood Pressure</Text>
            <Text style={styles.reviewVal}>{currentEntry.vitals.bloodPressure || '—'}</Text>
            <Text style={styles.reviewLabel}>SpO₂</Text>
            <Text style={styles.reviewVal}>{currentEntry.vitals.oxygenSaturation || '—'} %</Text>
          </Card>
        )}

        {/* ── Nav Buttons ── */}
        <View style={styles.navRow}>
          {step > 0 && <SecondaryButton title="Back" onPress={() => setStep(step - 1)} />}
          <View style={{ flex: 1 }}>
            {step < 3 ? (
              <PrimaryButton title="Next" onPress={() => setStep(step + 1)} />
            ) : (
              <PrimaryButton title="Analyze with AI" onPress={handleSubmit} />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  modeBtn: { flex: 1, minHeight: 44, borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  modeBtnActive: { borderColor: theme.colors.primary, backgroundColor: '#EBF3FF' },
  modeTxt: { fontWeight: '700', color: theme.colors.textSecondary },
  modeTxtActive: { color: theme.colors.primary },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 8, marginTop: 14 },
  textArea: { minHeight: 80, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 12, backgroundColor: '#FFF', fontSize: 15, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF' },
  chipSelected: { backgroundColor: '#EBF3FF', borderColor: theme.colors.primary },
  chipTxt: { color: theme.colors.textSecondary, fontWeight: '600' },
  chipTxtSelected: { color: theme.colors.primary },
  input: { minHeight: 48, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: 14, backgroundColor: '#FFF', fontSize: 15 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  sliderDotActive: { backgroundColor: theme.colors.primary },
  sliderNum: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary },
  sliderNumActive: { color: '#FFF' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabelTxt: { fontSize: 11, color: theme.colors.textSecondary },
  vitalIcon: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8 },
  warning: { color: theme.colors.danger, fontWeight: '700', marginTop: 6 },
  hintText: { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 12, fontSize: 13 },
  reviewTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14, color: theme.colors.textPrimary },
  reviewLabel: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 10 },
  reviewVal: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
});
