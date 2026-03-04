import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { EmergencyBanner } from '../../../components/ui/EmergencyBanner';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { usePatient } from '../../../context/PatientContext';
import { theme } from '../../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'EmergencyDashboard'>;

export const EmergencyDashboard: React.FC<Props> = ({ navigation }) => {
  const { profile, caseHistory, latestClassification } = usePatient();
  const [countdown, setCountdown] = useState(10);
  const [alertsSent, setAlertsSent] = useState(false);

  const latest = caseHistory.length > 0 ? caseHistory[0] : null;
  const cls = latestClassification ?? latest?.classification;

  /* countdown timer */
  useEffect(() => {
    if (countdown <= 0) {
      setAlertsSent(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Full red banner ── */}
      <EmergencyBanner message="🚨 Emergency Attention Required" />

      {/* ── Countdown ── */}
      <Card style={styles.countdownCard}>
        <Text style={styles.countdownLabel}>
          {alertsSent ? '✅ Alerts Sent' : 'Notifying Emergency Contacts…'}
        </Text>
        <Text style={styles.countdownNum}>{countdown > 0 ? countdown : '✓'}</Text>
        <Text style={styles.countdownSub}>
          {alertsSent
            ? 'Emergency contact and nearby doctors have been notified.'
            : 'Sending alerts to your emergency contact and nearby doctors…'}
        </Text>
      </Card>

      {/* ── Escalation reason ── */}
      {cls?.escalationReason && (
        <Card style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>⚠️ Escalation Reason</Text>
          <Text style={styles.reasonText}>{cls.escalationReason}</Text>
        </Card>
      )}

      {/* ── Emergency Actions (2 taps max) ── */}
      <View style={styles.actions}>
        <PrimaryButton
          title="📞 Call Ambulance (112)"
          variant="danger"
          onPress={() => Linking.openURL('tel:112')}
        />
        <View style={styles.spacer} />
        <PrimaryButton
          title="🩺 Alert Nearby Doctor"
          variant="danger"
          onPress={() => {}}
        />
        <View style={styles.spacer} />
        <PrimaryButton
          title="📍 Share Live Location"
          variant="neutral"
          onPress={() => {
            /* would use expo-location in production */
          }}
        />
        <View style={styles.spacer} />
        <PrimaryButton
          title={`📱 Call ${profile.emergencyContact}`}
          variant="danger"
          onPress={() => Linking.openURL(`tel:${profile.emergencyContact.replace(/\s/g, '')}`)}
        />
      </View>

      {/* ── Emergency Guidance ── */}
      <Card>
        <Text style={styles.guidanceTitle}>🏥 While You Wait</Text>
        <Text style={styles.guidanceItem}>• Stay calm and remain seated or lying down.</Text>
        <Text style={styles.guidanceItem}>• If chest pain: chew an aspirin if available.</Text>
        <Text style={styles.guidanceItem}>• If difficulty breathing: sit upright, open windows.</Text>
        <Text style={styles.guidanceItem}>• Do not eat or drink unless instructed.</Text>
        <Text style={styles.guidanceItem}>• Keep your phone charged and reachable.</Text>
        <Text style={styles.guidanceItem}>• Unlock your front door for paramedics.</Text>
      </Card>

      {/* ── Case info ── */}
      {latest && (
        <Card>
          <Text style={styles.caseTitle}>Case Information</Text>
          <Row label="Symptoms" value={latest.symptoms.join(', ')} />
          <Row label="Severity" value={`${latest.severity}/10`} />
          {latest.vitals.oxygenSaturation ? <Row label="SpO₂" value={`${latest.vitals.oxygenSaturation}%`} /> : null}
          {latest.vitals.temperature ? <Row label="Temperature" value={`${latest.vitals.temperature}°F`} /> : null}
        </Card>
      )}

      {/* ── I'm OK link ── */}
      <Text style={styles.okLink} onPress={() => navigation.popToTop()}>
        ← I'm okay, go back to Home
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
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  content: { padding: theme.spacing.lg, paddingBottom: 50 },
  countdownCard: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FEE2E2' },
  countdownLabel: { fontSize: 14, fontWeight: '700', color: '#991B1B' },
  countdownNum: { fontSize: 56, fontWeight: '900', color: '#DC2626', marginVertical: 8 },
  countdownSub: { color: '#991B1B', textAlign: 'center', fontSize: 13, paddingHorizontal: 12 },
  reasonCard: { backgroundColor: '#FEE2E2', borderLeftWidth: 4, borderLeftColor: '#DC2626' },
  reasonTitle: { fontSize: 15, fontWeight: '800', color: '#991B1B', marginBottom: 6 },
  reasonText: { color: '#991B1B', lineHeight: 22, fontWeight: '600' },
  actions: { marginTop: 8 },
  spacer: { height: 10 },
  guidanceTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  guidanceItem: { color: theme.colors.textSecondary, lineHeight: 24, marginBottom: 2, fontSize: 14 },
  caseTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: theme.colors.textSecondary, fontSize: 14 },
  rowVal: { fontWeight: '600', color: theme.colors.textPrimary, fontSize: 14 },
  okLink: { textAlign: 'center', color: theme.colors.primary, fontWeight: '700', fontSize: 15, marginTop: 24 },
});
