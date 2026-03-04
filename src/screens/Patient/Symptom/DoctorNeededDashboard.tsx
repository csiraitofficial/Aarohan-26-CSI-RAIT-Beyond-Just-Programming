import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { usePatient } from '../../../context/PatientContext';
import { theme } from '../../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'DoctorNeededDashboard'>;

export const DoctorNeededDashboard: React.FC<Props> = ({ navigation }) => {
  const { caseHistory, latestClassification } = usePatient();
  const latest = caseHistory.length > 0 ? caseHistory[0] : null;
  const cls = latestClassification ?? latest?.classification;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Status Header ── */}
      <Card style={styles.headerCard}>
        <RiskBadge risk="moderate" large />
        <Text style={styles.title}>Doctor Consultation Recommended</Text>
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

      {/* ── Case Summary ── */}
      <Card>
        <Text style={styles.sectionIcon}>📝</Text>
        <Text style={styles.sectionTitle}>Case Summary</Text>
        {latest && (
          <>
            <Row label="Symptoms" value={latest.symptoms.join(', ')} />
            <Row label="Severity" value={`${latest.severity}/10`} />
            <Row label="Duration" value={latest.duration || 'Not specified'} />
            {latest.vitals.temperature ? <Row label="Temperature" value={`${latest.vitals.temperature}°F`} /> : null}
            {latest.vitals.bloodPressure ? <Row label="Blood Pressure" value={latest.vitals.bloodPressure} /> : null}
            {latest.vitals.oxygenSaturation ? <Row label="SpO₂" value={`${latest.vitals.oxygenSaturation}%`} /> : null}
          </>
        )}
      </Card>

      {/* ── AI Guidance ── */}
      <Card>
        <Text style={styles.sectionIcon}>🤖</Text>
        <Text style={styles.sectionTitle}>AI Guidance</Text>
        <Text style={styles.body}>{cls?.guidance ?? 'Medical attention recommended.'}</Text>
      </Card>

      {/* ── Estimated Wait ── */}
      <Card style={styles.waitCard}>
        <Text style={styles.waitIcon}>⏱️</Text>
        <Text style={styles.waitTitle}>Estimated Wait Time</Text>
        <Text style={styles.waitTime}>~15 minutes</Text>
        <Text style={styles.waitSub}>Your case has been added to the doctor queue</Text>
      </Card>

      {/* ── Warning Signs ── */}
      {cls?.warningSignsToWatch && cls.warningSignsToWatch.length > 0 && (
        <Card style={styles.warningCard}>
          <Text style={styles.sectionTitle}>⚠️ Seek Emergency If:</Text>
          {cls.warningSignsToWatch.map((w: string, i: number) => (
            <Text key={i} style={styles.warningItem}>• {w}</Text>
          ))}
        </Card>
      )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <PrimaryButton title="🩺 Connect to Available Doctor" onPress={() => {}} />
        <View style={styles.spacer} />
        <SecondaryButton title="📅 Schedule Appointment" onPress={() => {}} />
        <View style={styles.spacer} />
        <SecondaryButton title="📎 Upload Additional Reports" onPress={() => {}} />
      </View>

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
  confidence: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  reasonCard: { backgroundColor: '#FEF3C7', borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  reasonText: { color: '#92400E', lineHeight: 22, fontWeight: '600' },
  sectionIcon: { fontSize: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  body: { color: theme.colors.textSecondary, lineHeight: 22, fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: theme.colors.textSecondary, fontSize: 14 },
  rowVal: { fontWeight: '600', color: theme.colors.textPrimary, fontSize: 14, maxWidth: '55%', textAlign: 'right' },
  waitCard: { alignItems: 'center', paddingVertical: 20 },
  waitIcon: { fontSize: 28, marginBottom: 6 },
  waitTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary },
  waitTime: { fontSize: 28, fontWeight: '900', color: theme.colors.moderate, marginVertical: 4 },
  waitSub: { color: theme.colors.textSecondary, fontSize: 13, textAlign: 'center' },
  warningCard: { backgroundColor: '#FEF2F2' },
  warningItem: { color: '#991B1B', lineHeight: 22, marginBottom: 4 },
  actions: { marginTop: 16 },
  spacer: { height: 12 },
  backLink: { textAlign: 'center', color: theme.colors.primary, fontWeight: '700', fontSize: 15, marginTop: 20 },
});
