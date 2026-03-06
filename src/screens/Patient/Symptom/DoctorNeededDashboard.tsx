import React, { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { usePatient } from '../../../context/PatientContext';
import { theme } from '../../../utils/theme';
import { NATURAL_REMEDIES, NaturalRemedy } from '../../../data/naturalRemedies';
import { MEDICATION_SUGGESTIONS, MedicationSuggestion } from '../../../data/medications';
import { MOCK_DOCTORS, Doctor } from '../../../data/doctors';

type Props = NativeStackScreenProps<PatientStackParamList, 'DoctorNeededDashboard'>;

export const DoctorNeededDashboard: React.FC<Props> = ({ navigation }) => {
  const { caseHistory, latestClassification } = usePatient();
  const latest = caseHistory.length > 0 ? caseHistory[0] : null;
  const cls = latestClassification ?? latest?.classification;

  // Match remedies & medications based on guidance/symptoms
  const guidance = (cls?.guidance || latest?.symptomsText || '').toLowerCase();
  const matchedRemedies = useMemo(
    () => NATURAL_REMEDIES.filter((r) => r.keywords.some((kw) => guidance.includes(kw))).slice(0, 3),
    [guidance],
  );
  const matchedMeds = useMemo(
    () => MEDICATION_SUGGESTIONS.filter((m) => m.keywords.some((kw) => guidance.includes(kw))).slice(0, 3),
    [guidance],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Status Header ── */}
      <Card style={styles.headerCard}>
        <RiskBadge risk="moderate" large />
        <Text style={styles.title}>Doctor Consultation Recommended</Text>
        <Text style={styles.subtitle}>Try home remedies while you wait</Text>
        {cls && (
          <Text style={styles.confidence}>
            Confidence: {(cls.confidenceScore * 100).toFixed(0)}%
          </Text>
        )}
      </Card>

      {/* ── Escalation Reason ── */}
      {cls?.escalationReason && (
        <Card style={styles.reasonCard}>
          <Text style={styles.sectionIcon}>📋</Text>
          <Text style={styles.sectionTitle}>Reason for Escalation</Text>
          <Text style={styles.reasonText}>{cls.escalationReason}</Text>
        </Card>
      )}

      {/* ── AI Guidance ── */}
      <Card>
        <Text style={styles.sectionIcon}>🤖</Text>
        <Text style={styles.sectionTitle}>AI Analysis</Text>
        <Text style={styles.body}>{cls?.guidance ?? 'Medical attention recommended.'}</Text>
      </Card>

      {/* ── Natural Remedies (while waiting) ── */}
      <Card style={styles.remedyCard}>
        <Text style={styles.sectionIcon}>🌿</Text>
        <Text style={styles.sectionTitle}>While You Wait — Natural Remedies</Text>
        {matchedRemedies.length > 0 ? (
          matchedRemedies.map((remedy: NaturalRemedy, i: number) => (
            <View key={i} style={styles.remedyItem}>
              <Text style={styles.remedyEmoji}>{remedy.emoji}</Text>
              <View style={styles.remedyInfo}>
                <Text style={styles.remedyName}>{remedy.name}</Text>
                <Text style={styles.remedyDesc}>{remedy.description}</Text>
                {remedy.howTo && <Text style={styles.remedyHowTo}>💡 {remedy.howTo}</Text>}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.remedyItem}>
            <Text style={styles.remedyEmoji}>💧</Text>
            <View style={styles.remedyInfo}>
              <Text style={styles.remedyName}>Stay Hydrated & Rest</Text>
              <Text style={styles.remedyDesc}>
                Drink plenty of fluids and rest while waiting for your consultation.
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* ── OTC Medication Suggestions ── */}
      <Card style={styles.medCard}>
        <Text style={styles.sectionIcon}>💊</Text>
        <Text style={styles.sectionTitle}>Suggested Over-the-Counter Medications</Text>
        <Text style={styles.medDisclaimer}>
          ⚕️ Verify with the doctor before taking any medication
        </Text>
        {matchedMeds.length > 0 ? (
          matchedMeds.map((med: MedicationSuggestion, i: number) => (
            <View key={i} style={styles.medItem}>
              <View style={styles.medHeader}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medType}>{med.type}</Text>
              </View>
              <Text style={styles.medPurpose}>{med.purpose}</Text>
              {med.dosage && <Text style={styles.medDosage}>📏 {med.dosage}</Text>}
              {med.warning && <Text style={styles.medWarning}>⚠️ {med.warning}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.body}>
            No specific OTC suggestions — the doctor will provide a prescription after consultation.
          </Text>
        )}
      </Card>

      {/* ── Visit Summary ── */}
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionIcon}>📋</Text>
        <Text style={styles.sectionTitle}>Your Visit Summary</Text>
        {latest?.symptomsText ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Chief Complaint</Text>
            <Text style={styles.summaryValue}>{latest.symptomsText}</Text>
          </View>
        ) : null}
        <View style={styles.summaryChips}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryChipLabel}>Risk Level</Text>
            <Text style={[styles.summaryChipValue, styles.moderateColor]}>Moderate</Text>
          </View>
          {latest?.severity ? (
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Severity</Text>
              <Text style={styles.summaryChipValue}>{latest.severity}/10</Text>
            </View>
          ) : null}
          {cls && (
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Confidence</Text>
              <Text style={styles.summaryChipValue}>{(cls.confidenceScore * 100).toFixed(0)}%</Text>
            </View>
          )}
        </View>
        {latest?.duration ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>{latest.duration}</Text>
          </View>
        ) : null}
        {latest?.vitals.temperature ? <Row label="Temperature" value={`${latest.vitals.temperature}°F`} /> : null}
        {latest?.vitals.bloodPressure ? <Row label="Blood Pressure" value={latest.vitals.bloodPressure} /> : null}
        {latest?.vitals.oxygenSaturation ? <Row label="SpO₂" value={`${latest.vitals.oxygenSaturation}%`} /> : null}
      </Card>

      {/* ── Available Doctors ── */}
      <Card>
        <Text style={styles.sectionIcon}>👨‍⚕️</Text>
        <Text style={styles.sectionTitle}>Available Doctors</Text>
        {MOCK_DOCTORS.slice(0, 3).map((doc: Doctor) => (
          <View key={doc.id} style={styles.doctorRow}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarText}>{doc.name.charAt(0)}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doc.name}</Text>
              <Text style={styles.doctorSpec}>{doc.specialty}</Text>
              <Text style={styles.doctorMeta}>
                ⭐ {doc.rating} • {doc.experience} • {doc.availability}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* ── Warning Signs ── */}
      <Card style={styles.warningCard}>
        <Text style={styles.sectionTitle}>🚨 Seek Emergency Care If:</Text>
        {cls?.warningSignsToWatch && cls.warningSignsToWatch.length > 0 ? (
          cls.warningSignsToWatch.map((w: string, i: number) => (
            <Text key={i} style={styles.warningItem}>• {w}</Text>
          ))
        ) : (
          <>
            <Text style={styles.warningItem}>• Breathing becomes difficult</Text>
            <Text style={styles.warningItem}>• Severe pain that doesn't improve</Text>
            <Text style={styles.warningItem}>• High fever (&gt;103°F / 39.4°C)</Text>
            <Text style={styles.warningItem}>• Loss of consciousness</Text>
          </>
        )}
      </Card>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <PrimaryButton title="🩺 Select a Doctor" onPress={() => navigation.navigate('DoctorSelectionScreen' as any)} />
        <View style={styles.spacer} />
        <SecondaryButton title="💾 Save to Records" onPress={() => navigation.navigate('RecordsScreen')} />
        <View style={styles.spacer} />
        <SecondaryButton title="🔔 Set Follow-Up Reminder" onPress={() => navigation.navigate('RemindersScreen')} />
      </View>

      <Text style={styles.disclaimer}>
        ⚕️ AI-generated suggestions. Always consult a qualified healthcare professional before taking medication.
      </Text>

      <Text style={styles.backLink} onPress={() => navigation.popToTop()}>
        ← Back to Home
      </Text>
    </ScrollView>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowVal}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 50 },
  headerCard: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#FFFBEB' },
  title: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#D97706', fontWeight: '600', marginTop: 4 },
  confidence: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  reasonCard: { backgroundColor: '#FEF3C7', borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  reasonText: { color: '#92400E', lineHeight: 22, fontWeight: '600' },
  sectionIcon: { fontSize: 22, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  body: { color: theme.colors.textSecondary, lineHeight: 22, fontSize: 15 },
  // Remedies
  remedyCard: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  remedyItem: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
  remedyEmoji: { fontSize: 26, marginTop: 2 },
  remedyInfo: { flex: 1 },
  remedyName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 2 },
  remedyDesc: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 },
  remedyHowTo: { fontSize: 12, color: '#16A34A', marginTop: 4, fontStyle: 'italic', lineHeight: 18 },
  // Medications
  medCard: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' },
  medDisclaimer: { fontSize: 12, color: '#B45309', fontStyle: 'italic', marginBottom: 12 },
  medItem: { marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  medHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  medName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  medType: { fontSize: 11, fontWeight: '600', color: '#3B82F6', backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  medPurpose: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 4 },
  medDosage: { fontSize: 12, color: '#1E40AF', marginBottom: 2 },
  medWarning: { fontSize: 12, color: '#B45309', fontStyle: 'italic' },
  // Case
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: theme.colors.textSecondary, fontSize: 14 },
  rowVal: { fontWeight: '600', color: theme.colors.textPrimary, fontSize: 14, maxWidth: '55%', textAlign: 'right' },
  // Doctors
  doctorRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'center' },
  doctorAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  doctorAvatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  doctorSpec: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
  doctorMeta: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  // Warning
  warningCard: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  warningItem: { color: '#991B1B', lineHeight: 22, marginBottom: 4 },
  actions: { marginTop: 16 },
  spacer: { height: 12 },
  disclaimer: {
    textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12,
    marginTop: 24, lineHeight: 18, fontStyle: 'italic', paddingHorizontal: 8,
  },
  backLink: { textAlign: 'center', color: theme.colors.primary, fontWeight: '700', fontSize: 15, marginTop: 20 },
  // Visit Summary
  summaryCard: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  summaryRow: { marginBottom: 10 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  summaryValue: { fontSize: 15, color: theme.colors.textPrimary, lineHeight: 22 },
  summaryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  summaryChip: { flex: 1, minWidth: 80, backgroundColor: '#FFF', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  summaryChipLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryChipValue: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 2 },
  moderateColor: { color: '#D97706' },
});
