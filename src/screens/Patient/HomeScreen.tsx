import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { EmergencyBanner } from '../../components/ui/EmergencyBanner';
import { EmergencyModal } from '../../components/ui/EmergencyModal';
import { usePatient } from '../../context/PatientContext';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'HomeScreen'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { profile, caseHistory, reminders } = usePatient();
  const [emergencyVisible, setEmergencyVisible] = useState(false);

  const lastRisk = caseHistory.length > 0 ? caseHistory[0].result.risk : 'mild';
  const activeEmergency = caseHistory.find((c) => c.status === 'emergency_active');
  const pendingDoctor = caseHistory.find((c) => c.status === 'doctor_assigned');
  const activeCase = caseHistory.find((c) => c.status === 'active');
  const upcomingReminder = reminders.find((r) => r.enabled);

  /* dynamic alerts */
  const alerts: Array<{ icon: string; text: string; color: string }> = [];
  if (activeEmergency) alerts.push({ icon: '🚨', text: 'Emergency case unresolved', color: '#FEE2E2' });
  if (pendingDoctor) alerts.push({ icon: '🩺', text: 'Pending doctor consultation', color: '#FEF3C7' });
  if (upcomingReminder) alerts.push({ icon: '🔔', text: `Upcoming: ${upcomingReminder.title}`, color: '#EBF3FF' });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Active Emergency Banner ── */}
      {activeEmergency && (
        <Pressable onPress={() => navigation.navigate('EmergencyDashboard', { classificationId: activeEmergency.id })}>
          <EmergencyBanner message="🚨 Emergency Active — Tap to view" />
        </Pressable>
      )}

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello, {profile.name.split(' ')[0]}</Text>
          <View style={styles.statusRow}>
            <Text style={styles.sub}>Health Status</Text>
            <RiskBadge risk={lastRisk} />
          </View>
        </View>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatar}>👩🏽</Text>
        </View>
      </View>

      {/* ── Dynamic Alert Banners ── */}
      {alerts.map((a, i) => (
        <View key={i} style={[styles.alertBanner, { backgroundColor: a.color }]}>
          <Text style={styles.alertIcon}>{a.icon}</Text>
          <Text style={styles.alertText}>{a.text}</Text>
        </View>
      ))}

      {/* ── Current Case Status ── */}
      {(activeCase || pendingDoctor) && (
        <Card style={styles.caseStatusCard}>
          <Text style={styles.caseStatusTitle}>📋 Active Case</Text>
          <View style={styles.caseStatusRow}>
            <RiskBadge risk={(activeCase || pendingDoctor)!.result.risk} />
            <Text style={styles.caseStatusDate}>{(activeCase || pendingDoctor)!.date}</Text>
          </View>
          <Text style={styles.caseStatusSymptoms}>{(activeCase || pendingDoctor)!.symptoms.join(', ')}</Text>
          <Text style={styles.caseStatusLabel}>
            Status: {(activeCase || pendingDoctor)!.status.replace('_', ' ').toUpperCase()}
          </Text>
        </Card>
      )}

      {/* ── Action Cards ── */}
      <Pressable style={styles.actionCard} onPress={() => navigation.navigate('SymptomAgentScreen')}>
        <Text style={styles.actionIcon}>🤖</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>AI Health Check</Text>
          <Text style={styles.actionSub}>Voice or manual symptom entry</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </Pressable>

      <Pressable style={styles.actionCard} onPress={() => navigation.navigate('RecordsScreen')}>
        <Text style={styles.actionIcon}>📁</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>My Health Records</Text>
          <Text style={styles.actionSub}>{caseHistory.length} past records</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </Pressable>

      <Pressable style={[styles.actionCard, styles.emergencyCard]} onPress={() => setEmergencyVisible(true)}>
        <Text style={styles.actionIcon}>🚨</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, { color: '#991B1B' }]}>Emergency Help</Text>
          <Text style={[styles.actionSub, { color: '#B91C1C' }]}>Immediate assistance</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </Pressable>

      {/* ── Recent Activity ── */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {caseHistory.slice(0, 3).map((c) => (
        <Pressable key={c.id} onPress={() => navigation.navigate('CaseDetailScreen', { caseId: c.id })}>
          <Card style={styles.activityCard}>
            <View style={styles.activityRow}>
              <RiskBadge risk={c.result.risk} />
              <Text style={styles.activityDate}>{c.date}</Text>
            </View>
            <Text style={styles.activitySymptoms}>{c.symptoms.join(', ')}</Text>
            <Text style={styles.activityStatus}>{c.status.replace('_', ' ').toUpperCase()}</Text>
          </Card>
        </Pressable>
      ))}

      <EmergencyModal
        visible={emergencyVisible}
        onConfirm={() => {
          setEmergencyVisible(false);
          navigation.navigate('EmergencyScreen');
        }}
        onCancel={() => setEmergencyVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '800', color: theme.colors.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sub: { color: theme.colors.textSecondary },
  avatarWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center' },
  avatar: { fontSize: 28 },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 12, marginBottom: 8 },
  alertIcon: { fontSize: 18 },
  alertText: { flex: 1, fontWeight: '600', color: theme.colors.textPrimary, fontSize: 14 },
  caseStatusCard: { backgroundColor: '#F0FDF4', borderLeftWidth: 4, borderLeftColor: theme.colors.primary },
  caseStatusTitle: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 8 },
  caseStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  caseStatusDate: { color: theme.colors.textSecondary, fontSize: 13 },
  caseStatusSymptoms: { color: theme.colors.textPrimary, fontWeight: '600', marginBottom: 4 },
  caseStatusLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    borderRadius: theme.radius.lg, padding: theme.spacing.md, marginBottom: 12, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  emergencyCard: { backgroundColor: '#FEE2E2' },
  actionIcon: { fontSize: 28 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  actionSub: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 },
  arrow: { fontSize: 18, color: theme.colors.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 12, marginBottom: 12 },
  activityCard: { marginBottom: 8 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  activityDate: { color: theme.colors.textSecondary, fontSize: 13 },
  activitySymptoms: { color: theme.colors.textPrimary, fontWeight: '600' },
  activityStatus: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },
});
