import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PatientStackParamList } from '../../navigation/types';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { EmergencyModal } from '../../components/ui/EmergencyModal';
import { usePatient } from '../../context/PatientContext';
import { theme } from '../../utils/theme';
import { Reminder } from '../../models';

type Props = NativeStackScreenProps<PatientStackParamList, 'HomeScreen'>;

/* ── helpers ── */
const riskColors: Record<string, { bg: string; text: string; border: string }> = {
  mild:      { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
  moderate:  { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D' },
  emergency: { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
};

const reminderIconMap: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  medication: 'pill',
  'follow-up': 'stethoscope',
  'ai-check': 'robot-outline',
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { profile, caseHistory, reminders } = usePatient();
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);

  const lastCase = caseHistory.length > 0 ? caseHistory[0] : null;
  const lastRisk = lastCase?.result.risk ?? 'mild';
  const lastCheckDate = lastCase?.date ?? '—';
  const activeEmergency = caseHistory.find((c) => c.status === 'emergency_active');
  const upcomingReminders: Reminder[] = reminders.filter((r) => r.enabled).slice(0, 3);

  const healthTips = [
    'Drink plenty of water and rest if you have a fever.',
    'Take prescribed medications on time for faster recovery.',
    'Monitor your oxygen levels if you feel short of breath.',
  ];
  const tip = healthTips[new Date().getDate() % healthTips.length];

  const riskStyle = riskColors[lastRisk] ?? riskColors.mild;

  /* ── Staggered fade-in animation ── */
  const fadeAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([...Array(5)].map(() => new Animated.Value(18))).current;

  useEffect(() => {
    const animations = fadeAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim, { toValue: 1, duration: 400, delay: i * 80, useNativeDriver: true }),
        Animated.timing(slideAnims[i], { toValue: 0, duration: 400, delay: i * 80, useNativeDriver: true }),
      ])
    );
    Animated.stagger(0, animations).start();
  }, []);

  const animStyle = (i: number) => ({ opacity: fadeAnims[i], transform: [{ translateY: slideAnims[i] }] });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* ═══════════════════════════════════════
          TOP HEADER
      ═══════════════════════════════════════ */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appName}>Swasthya Saathi</Text>
          <Text style={styles.greeting}>Hello, {(profile.name || 'User').split(' ')[0]}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setNotifVisible(!notifVisible)}
            accessibilityLabel="Notifications"
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.primary} />
            {activeEmergency && <View style={styles.notifDot} />}
          </Pressable>
          <Pressable
            style={styles.avatarWrap}
            onPress={() => navigation.navigate('ProfileScreen')}
            accessibilityLabel="Profile"
          >
            <MaterialCommunityIcons name="account-outline" size={24} color={theme.colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* notification mini-panel */}
      {notifVisible && (
        <View style={styles.notifPanel}>
          {activeEmergency ? (
            <Pressable
              onPress={() => {
                setNotifVisible(false);
                navigation.navigate('EmergencyDashboard', { classificationId: activeEmergency.id });
              }}
            >
              <Text style={styles.notifItem}><MaterialCommunityIcons name="alert-circle" size={14} color="#DC2626" /> Emergency case active — Tap to view</Text>
            </Pressable>
          ) : (
            <Text style={styles.notifItem}><MaterialCommunityIcons name="check-circle-outline" size={14} color="#059669" /> No urgent notifications</Text>
          )}
        </View>
      )}

      {/* ═══════════════════════════════════════
          HEALTH STATUS CARD
      ═══════════════════════════════════════ */}
      <Animated.View style={animStyle(0)}>
      <View style={[styles.healthCard, { backgroundColor: riskStyle.bg, borderColor: riskStyle.border }]}>
        <View style={styles.healthCardTop}>
          <View>
            <Text style={styles.healthCardTitle}>Your Health Status</Text>
            <Text style={styles.healthCardSub}>Last check: {lastCheckDate}</Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: riskStyle.border }]} />
        </View>
        <View style={styles.healthCardBottom}>
          <RiskBadge risk={lastRisk} />
          <Text style={[styles.healthCardRiskLabel, { color: riskStyle.text }]}>
            {lastRisk.charAt(0).toUpperCase() + lastRisk.slice(1)} condition
          </Text>
        </View>
      </View>
      </Animated.View>

      {/* ═══════════════════════════════════════
          PRIMARY ACTION — START HEALTH CHECK
      ═══════════════════════════════════════ */}
      <Animated.View style={animStyle(1)}>
      <View style={styles.primaryCard}>
        <View style={styles.primaryCardInner}>
          <View style={styles.primaryCardIconWrap}>
            <MaterialCommunityIcons name="robot-outline" size={28} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.primaryCardTitle}>Start Health Check</Text>
            <Text style={styles.primaryCardDesc}>Analyze your symptoms and vitals.</Text>
          </View>
        </View>
        <PrimaryButton
          title="Start AI Health Check"
          onPress={() => navigation.navigate('SymptomAgentScreen')}
        />
      </View>
      </Animated.View>

      {/* ═══════════════════════════════════════
          QUICK ACTIONS — 2 × 2 GRID
      ═══════════════════════════════════════ */}
      <Animated.View style={animStyle(2)}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.gridRow}>
        {/* AI Health Check */}
        <Pressable
          style={[styles.gridCard, styles.gridCardBlue]}
          onPress={() => navigation.navigate('SymptomAgentScreen')}
          accessibilityLabel="AI Health Check"
        >
          <MaterialCommunityIcons name="robot-outline" size={28} color="#0A84FF" />
          <Text style={styles.gridLabel}>AI Health{'\n'}Check</Text>
        </Pressable>

        {/* Health Records */}
        <Pressable
          style={[styles.gridCard, styles.gridCardGreen]}
          onPress={() => navigation.navigate('RecordsScreen')}
          accessibilityLabel="My Health Records"
        >
          <MaterialCommunityIcons name="folder-outline" size={28} color="#059669" />
          <Text style={styles.gridLabel}>My Health{'\n'}Records</Text>
        </Pressable>
      </View>
      <View style={styles.gridRow}>
        {/* Reminders */}
        <Pressable
          style={[styles.gridCard, styles.gridCardYellow]}
          onPress={() => navigation.navigate('RemindersScreen')}
          accessibilityLabel="Reminders"
        >
          <MaterialCommunityIcons name="bell-outline" size={28} color="#D97706" />
          <Text style={styles.gridLabel}>Reminders</Text>
        </Pressable>

        {/* Emergency Help */}
        <Pressable
          style={[styles.gridCard, styles.gridCardRed]}
          onPress={() => setEmergencyVisible(true)}
          accessibilityLabel="Emergency Help"
        >
          <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#DC2626" />
          <Text style={styles.gridLabel}>Emergency{'\n'}Help</Text>
        </Pressable>
      </View>
      </Animated.View>

      {/* ── Nearby Hospitals ── */}
      <Pressable
        style={styles.hospitalCard}
        onPress={() => navigation.navigate('NearbyHospitalsScreen')}
        accessibilityLabel="Find Nearby Hospitals"
      >
        <View style={styles.hospitalCardInner}>
          <Text style={styles.hospitalCardEmoji}>🏥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.hospitalCardTitle}>Find Nearby Hospitals</Text>
            <Text style={styles.hospitalCardDesc}>Locate hospitals, clinics & emergency rooms near you</Text>
          </View>
          <Text style={styles.hospitalCardArrow}>›</Text>
        </View>
      </Pressable>

      {/* ═══════════════════════════════════════
          UPCOMING REMINDERS
      ═══════════════════════════════════════ */}
      <Animated.View style={animStyle(3)}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
        <Pressable onPress={() => navigation.navigate('RemindersScreen')}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      {upcomingReminders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No upcoming reminders. Add one in Reminders.</Text>
        </View>
      ) : (
        upcomingReminders.map((r) => (
          <Pressable
            key={r.id}
            style={styles.reminderCard}
            onPress={() => navigation.navigate('RemindersScreen')}
          >
            <View style={styles.reminderIconWrap}>
              <MaterialCommunityIcons name={reminderIconMap[r.type] ?? 'calendar-outline'} size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reminderTitle}>{r.title}</Text>
              <Text style={styles.reminderTime}>{r.time}</Text>
            </View>
            <Text style={styles.reminderArrow}>›</Text>
          </Pressable>
        ))
      )}
      </Animated.View>

      {/* ═══════════════════════════════════════
          HEALTH TIP
      ═══════════════════════════════════════ */}
      <Animated.View style={animStyle(4)}>
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#0369A1" />
          <Text style={styles.tipTitle}>Health Tip</Text>
        </View>
        <Text style={styles.tipText}>{tip}</Text>
      </View>
      </Animated.View>

      {/* ═══════════════════════════════════════
          EMERGENCY ACCESS
      ═══════════════════════════════════════ */}
      <View style={styles.emergencyCard}>
        <View style={styles.emergencyCardTop}>
          <View style={styles.emergencyIconWrap}>
            <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#991B1B" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emergencyCardTitle}>Emergency Help</Text>
            <Text style={styles.emergencyCardDesc}>Request immediate medical assistance.</Text>
          </View>
        </View>
        <Pressable
          style={styles.emergencyBtn}
          onPress={() => setEmergencyVisible(true)}
          accessibilityLabel="Request Emergency Help"
        >
          <Text style={styles.emergencyBtnText}>Request Emergency Help</Text>
        </Pressable>
      </View>

      {/* ═══════════════════════════════════════
          EMERGENCY CONFIRM MODAL
      ═══════════════════════════════════════ */}
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

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: 52, paddingBottom: 48 },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: { flex: 1 },
  appName: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, letterSpacing: 0.6, textTransform: 'uppercase' },
  greeting: { fontSize: 24, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 18 },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.danger, borderWidth: 1.5, borderColor: '#FFF' },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.primary },
  avatarEmoji: { fontSize: 24 },

  /* ── Notification panel ── */
  notifPanel: {
    backgroundColor: '#FFF',
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...CARD_SHADOW,
  },
  notifItem: { fontSize: 14, color: theme.colors.textPrimary, fontWeight: '600' },

  /* ── Health Status Card ── */
  healthCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    padding: theme.spacing.md,
    marginBottom: 16,
    ...CARD_SHADOW,
  },
  healthCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  healthCardTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  healthCardSub: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 3 },
  statusDot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  healthCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  healthCardRiskLabel: { fontSize: 14, fontWeight: '700' },

  /* ── Primary Action Card ── */
  primaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...CARD_SHADOW,
  },
  primaryCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  primaryCardIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center' },
  primaryCardTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
  primaryCardDesc: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 3 },

  /* ── Section Header ── */
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 12 },
  seeAll: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, marginBottom: 12 },

  /* ── Quick Actions Grid ── */
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  gridCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...CARD_SHADOW,
  },
  gridCardBlue:   { backgroundColor: '#EBF3FF' },
  gridCardGreen:  { backgroundColor: '#F0FDF4' },
  gridCardYellow: { backgroundColor: '#FFFBEB' },
  gridCardRed:    { backgroundColor: '#FEF2F2' },
  gridIcon: { fontSize: 30 },
  gridLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center', lineHeight: 18 },

  /* ── Reminders ── */
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    ...CARD_SHADOW,
  },
  reminderIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center' },
  reminderIcon: { fontSize: 20 },
  reminderTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  reminderTime: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  reminderArrow: { fontSize: 22, color: theme.colors.textSecondary },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },

  /* ── Health Tip ── */
  tipCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    ...CARD_SHADOW,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipIcon: { fontSize: 20 },
  tipTitle: { fontSize: 15, fontWeight: '800', color: '#0369A1' },
  tipText: { fontSize: 14, color: '#0C4A6E', lineHeight: 21 },

  /* ── Emergency Card ── */
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    ...CARD_SHADOW,
  },
  emergencyCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  emergencyIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  emergencyCardTitle: { fontSize: 17, fontWeight: '800', color: '#991B1B' },
  emergencyCardDesc: { fontSize: 13, color: '#B91C1C', marginTop: 3 },
  emergencyBtn: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  emergencyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  /* ── Nearby Hospitals Card ── */
  hospitalCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  hospitalCardInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hospitalCardEmoji: { fontSize: 32 },
  hospitalCardTitle: { fontSize: 16, fontWeight: '800', color: '#1E40AF' },
  hospitalCardDesc: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
  hospitalCardArrow: { fontSize: 26, color: '#3B82F6', fontWeight: '300' },
});
