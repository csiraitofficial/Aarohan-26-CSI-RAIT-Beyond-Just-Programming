import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { EmergencyBanner } from '../../../components/ui/EmergencyBanner';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { usePatient } from '../../../context/PatientContext';
import { theme } from '../../../utils/theme';
import { MOCK_DOCTORS, Doctor } from '../../../data/doctors';

type Props = NativeStackScreenProps<PatientStackParamList, 'EmergencyDashboard'>;

/**
 * First-aid tips keyed by symptom keywords.
 */
const FIRST_AID_TIPS: Record<string, string[]> = {
  chest: [
    'Have the person sit upright in a comfortable position.',
    'Loosen tight clothing around chest and neck.',
    'If prescribed, help them take nitroglycerin.',
    'Chew an aspirin (325 mg) if not allergic.',
    'If person becomes unresponsive, begin CPR.',
  ],
  breathing: [
    'Sit the person upright — do NOT lay them flat.',
    'Open windows or move to fresh air.',
    'Loosen any tight clothing around the neck/chest.',
    'If they have an inhaler, help them use it.',
    'Count breaths per minute — report to 112.',
  ],
  bleeding: [
    'Apply firm, direct pressure with a clean cloth.',
    'Elevate the injured limb above heart level if possible.',
    'Do NOT remove embedded objects — stabilize them.',
    'If bleeding soaks through, add more cloth on top.',
    'Apply a tourniquet ONLY if life-threatening limb bleeding.',
  ],
  burn: [
    'Cool the burn under running water for 10-20 minutes.',
    'Do NOT apply ice, butter, or toothpaste.',
    'Remove jewelry/clothing near the burn (if not stuck).',
    'Cover loosely with a clean, dry dressing.',
    'Give small sips of water for pain management.',
  ],
  seizure: [
    'Clear the area of hard/sharp objects.',
    'Do NOT hold the person down or put anything in mouth.',
    'Turn them on their side (recovery position).',
    'Time the seizure — call 112 if >5 minutes.',
    'Stay with them until fully alert.',
  ],
  unconscious: [
    'Check for breathing — if not breathing, begin CPR.',
    'Place in the recovery position (on their side).',
    'Do NOT give food, water, or medicine.',
    'Keep the airway clear.',
    'Stay with them and call 112 immediately.',
  ],
};

export const EmergencyDashboard: React.FC<Props> = ({ navigation }) => {
  const { profile, caseHistory, latestClassification } = usePatient();
  const [countdown, setCountdown] = useState(10);
  const [alertsSent, setAlertsSent] = useState(false);

  const latest = caseHistory.length > 0 ? caseHistory[0] : null;
  const cls = latestClassification ?? latest?.classification;

  // Match first aid tips based on symptoms/guidance text
  const firstAidTips = useMemo(() => {
    const text = (cls?.guidance || cls?.escalationReason || latest?.symptomsText || '').toLowerCase();
    for (const [keyword, tips] of Object.entries(FIRST_AID_TIPS)) {
      if (text.includes(keyword)) return tips;
    }
    // Default emergency tips
    return [
      'Stay calm and remain seated or lying down.',
      'Keep your phone charged and reachable.',
      'Unlock your front door for paramedics.',
      'Do not eat or drink unless instructed.',
      'If possible, have someone stay with you.',
    ];
  }, [cls, latest]);

  // Emergency-specialized doctors
  const emergencyDoctors = MOCK_DOCTORS.filter(
    (d) => d.availability.toLowerCase().includes('now') || d.specialty.toLowerCase().includes('emergency'),
  ).slice(0, 2);

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
          {alertsSent ? '✅ Alerts Sent Successfully' : 'Notifying Emergency Contacts…'}
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
          <Text style={styles.reasonTitle}>⚠️ Critical Finding</Text>
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
          title={`📱 Call ${profile.emergencyContact || 'Emergency Contact'}`}
          variant="danger"
          onPress={() => Linking.openURL(`tel:${(profile.emergencyContact || '112').replace(/\s/g, '')}`)}
        />
        <View style={styles.spacer} />
        <PrimaryButton
          title="📍 Share Live Location"
          variant="neutral"
          onPress={() => {
            /* would use expo-location in production */
          }}
        />
      </View>

      {/* ── First Aid Tips ── */}
      <Card style={styles.firstAidCard}>
        <Text style={styles.firstAidTitle}>🩹 First Aid — Do This NOW</Text>
        {firstAidTips.map((tip, i) => (
          <View key={i} style={styles.firstAidRow}>
            <View style={styles.firstAidNum}>
              <Text style={styles.firstAidNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.firstAidText}>{tip}</Text>
          </View>
        ))}
      </Card>

      {/* ── Available Emergency Doctors ── */}
      {emergencyDoctors.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>👨‍⚕️ Emergency Doctors Notified</Text>
          {emergencyDoctors.map((doc: Doctor) => (
            <View key={doc.id} style={styles.doctorRow}>
              <View style={styles.doctorAvatar}>
                <Text style={styles.doctorAvatarText}>{doc.name.charAt(4)}</Text>
              </View>
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doc.name}</Text>
                <Text style={styles.doctorSpec}>{doc.specialty} • {doc.experience}</Text>
                <Text style={styles.doctorStatus}>🟢 {doc.availability}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* ── Do NOT ── */}
      <Card style={styles.dontCard}>
        <Text style={styles.dontTitle}>🚫 Do NOT Do These</Text>
        <Text style={styles.dontItem}>• Do not drive yourself to the hospital</Text>
        <Text style={styles.dontItem}>• Do not take medications not prescribed to you</Text>
        <Text style={styles.dontItem}>• Do not ignore worsening symptoms</Text>
        <Text style={styles.dontItem}>• Do not leave the person alone if unconscious</Text>
      </Card>

      {/* ── Visit Summary (Shared with Doctor) ── */}
      {latest && (
        <Card style={styles.summaryCard}>
          <Text style={styles.caseTitle}>📋 Your Visit Summary</Text>
          {latest.symptomsText ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Chief Complaint</Text>
              <Text style={styles.summaryText}>{latest.symptomsText || latest.symptoms.join(', ')}</Text>
            </View>
          ) : null}
          <View style={styles.summaryChips}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Risk Level</Text>
              <Text style={[styles.summaryChipValue, styles.emergencyColor]}>Emergency</Text>
            </View>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Severity</Text>
              <Text style={styles.summaryChipValue}>{latest.severity}/10</Text>
            </View>
            {cls && (
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipLabel}>Confidence</Text>
                <Text style={styles.summaryChipValue}>{(cls.confidenceScore * 100).toFixed(0)}%</Text>
              </View>
            )}
          </View>
          {latest.vitals.oxygenSaturation ? <Row label="SpO₂" value={`${latest.vitals.oxygenSaturation}%`} /> : null}
          {latest.vitals.temperature ? <Row label="Temperature" value={`${latest.vitals.temperature}°F`} /> : null}
          {latest.vitals.bloodPressure ? <Row label="Blood Pressure" value={latest.vitals.bloodPressure} /> : null}
        </Card>
      )}

      {/* ── Secondary actions ── */}
      <View style={styles.secondaryActions}>
        <SecondaryButton title="💾 Save to Records" onPress={() => navigation.navigate('RecordsScreen')} />
      </View>

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
  countdownSub: { color: '#991B1B', textAlign: 'center', fontSize: 13, paddingHorizontal: 12, lineHeight: 20 },
  reasonCard: { backgroundColor: '#FEE2E2', borderLeftWidth: 4, borderLeftColor: '#DC2626' },
  reasonTitle: { fontSize: 16, fontWeight: '800', color: '#991B1B', marginBottom: 6 },
  reasonText: { color: '#991B1B', lineHeight: 22, fontWeight: '600' },
  actions: { marginTop: 8 },
  spacer: { height: 10 },
  // First Aid
  firstAidCard: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' },
  firstAidTitle: { fontSize: 17, fontWeight: '800', color: '#92400E', marginBottom: 14 },
  firstAidRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  firstAidNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F59E0B',
    alignItems: 'center', justifyContent: 'center',
  },
  firstAidNumText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  firstAidText: { flex: 1, color: '#78350F', lineHeight: 22, fontSize: 14 },
  // Doctors
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  doctorRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'center' },
  doctorAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#DC2626',
    alignItems: 'center', justifyContent: 'center',
  },
  doctorAvatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  doctorSpec: { fontSize: 13, color: theme.colors.textSecondary },
  doctorStatus: { fontSize: 12, color: '#16A34A', fontWeight: '600', marginTop: 2 },
  // Don't
  dontCard: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  dontTitle: { fontSize: 16, fontWeight: '800', color: '#991B1B', marginBottom: 10 },
  dontItem: { color: '#991B1B', lineHeight: 24, marginBottom: 2, fontSize: 14 },
  // Case
  caseTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: theme.colors.textSecondary, fontSize: 14 },
  rowVal: { fontWeight: '600', color: theme.colors.textPrimary, fontSize: 14 },
  secondaryActions: { marginTop: 16 },
  okLink: { textAlign: 'center', color: theme.colors.primary, fontWeight: '700', fontSize: 15, marginTop: 24 },
  // Summary
  summaryCard: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  summaryRow: { marginBottom: 10 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#991B1B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  summaryText: { fontSize: 15, color: theme.colors.textPrimary, lineHeight: 22 },
  summaryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  summaryChip: { flex: 1, minWidth: 80, backgroundColor: '#FFF', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
  summaryChipLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryChipValue: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 2 },
  emergencyColor: { color: '#DC2626' },
});
