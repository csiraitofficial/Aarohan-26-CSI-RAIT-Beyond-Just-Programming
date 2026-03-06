import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { theme } from '../../utils/theme';
import { RiskLevel } from '../../models';

/* ─── Mock Data ─── */
interface QueuePatient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  symptoms: string[];
  risk: RiskLevel;
  waitTime: number; // minutes
  location: string;
  vitals: { hr: number; bp: string; spo2: number; temp: number };
  aiRiskScore: number; // 0-100
  history: string[];
  allergies: string[];
  assignedTime: string;
}

const MOCK_PATIENTS: QueuePatient[] = [
  {
    id: 'P-1042',
    name: 'Ravi Kumar',
    age: 45,
    gender: 'M',
    symptoms: ['Chest pain', 'Shortness of breath', 'Dizziness'],
    risk: 'emergency',
    waitTime: 2,
    location: 'Mumbai, Maharashtra',
    vitals: { hr: 112, bp: '160/100', spo2: 89, temp: 99.2 },
    aiRiskScore: 94,
    history: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'],
    assignedTime: '10:23 AM',
  },
  {
    id: 'P-1038',
    name: 'Sana Ali',
    age: 32,
    gender: 'F',
    symptoms: ['Severe headache', 'Nausea', 'Blurred vision'],
    risk: 'moderate',
    waitTime: 12,
    location: 'Pune, Maharashtra',
    vitals: { hr: 88, bp: '140/90', spo2: 96, temp: 98.8 },
    aiRiskScore: 67,
    history: ['Migraine'],
    allergies: [],
    assignedTime: '10:18 AM',
  },
  {
    id: 'P-1035',
    name: 'Neha Das',
    age: 28,
    gender: 'F',
    symptoms: ['Fever', 'Sore throat', 'Body ache'],
    risk: 'mild',
    waitTime: 25,
    location: 'Thane, Maharashtra',
    vitals: { hr: 78, bp: '120/80', spo2: 98, temp: 101.2 },
    aiRiskScore: 22,
    history: [],
    allergies: ['Sulfa drugs'],
    assignedTime: '10:05 AM',
  },
  {
    id: 'P-1044',
    name: 'Arjun Patel',
    age: 58,
    gender: 'M',
    symptoms: ['Abdominal pain', 'Vomiting', 'Fever'],
    risk: 'moderate',
    waitTime: 8,
    location: 'Navi Mumbai',
    vitals: { hr: 95, bp: '135/88', spo2: 95, temp: 100.8 },
    aiRiskScore: 58,
    history: ['Gallstones', 'Cholecystitis'],
    allergies: ['Aspirin'],
    assignedTime: '10:30 AM',
  },
  {
    id: 'P-1046',
    name: 'Priya Sharma',
    age: 24,
    gender: 'F',
    symptoms: ['Cough', 'Runny nose', 'Mild fatigue'],
    risk: 'mild',
    waitTime: 35,
    location: 'Borivali, Mumbai',
    vitals: { hr: 72, bp: '118/76', spo2: 99, temp: 99.0 },
    aiRiskScore: 12,
    history: [],
    allergies: [],
    assignedTime: '09:55 AM',
  },
  {
    id: 'P-1048',
    name: 'Mohammed Ansari',
    age: 67,
    gender: 'M',
    symptoms: ['Difficulty breathing', 'Wheezing', 'Chest tightness'],
    risk: 'emergency',
    waitTime: 1,
    location: 'Andheri, Mumbai',
    vitals: { hr: 108, bp: '150/95', spo2: 87, temp: 98.6 },
    aiRiskScore: 91,
    history: ['COPD', 'Asthma', 'Smoking history'],
    allergies: ['Ibuprofen'],
    assignedTime: '10:38 AM',
  },
];

const RISK_CONFIG = {
  emergency: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', label: 'Emergency', icon: '🔴' },
  moderate: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', label: 'Urgent', icon: '🟠' },
  mild: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', label: 'Normal', icon: '🟢' },
  pending: { color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB', label: 'Pending', icon: '⚪' },
};

const FILTER_TABS: Array<RiskLevel | 'all'> = ['all', 'emergency', 'moderate', 'mild'];

export const PatientQueueScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_PATIENTS[0].id);
  const screenWidth = Dimensions.get('window').width;
  const isWide = screenWidth > 768;

  const filtered = useMemo(() => {
    let list = MOCK_PATIENTS;
    if (filter !== 'all') list = list.filter((p) => p.risk === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.symptoms.some((s) => s.toLowerCase().includes(q))
      );
    }
    // Sort by risk priority
    const order: Record<string, number> = { emergency: 0, moderate: 1, mild: 2, pending: 3 };
    return [...list].sort((a, b) => order[a.risk] - order[b.risk]);
  }, [filter, search]);

  const selectedPatient = MOCK_PATIENTS.find((p) => p.id === selectedId) || null;

  const stats = useMemo(() => {
    const total = MOCK_PATIENTS.length;
    const emergency = MOCK_PATIENTS.filter((p) => p.risk === 'emergency').length;
    const urgent = MOCK_PATIENTS.filter((p) => p.risk === 'moderate').length;
    return { total, emergency, urgent, consulting: 1 };
  }, []);

  return (
    <View style={styles.root}>
      {/* ─── Stats Bar ─── */}
      <View style={styles.statsBar}>
        <StatCard value={stats.total} label="Waiting" icon="🕐" color="#3B82F6" bg="#EFF6FF" />
        <StatCard value={stats.emergency} label="Emergency" icon="🚨" color="#DC2626" bg="#FEF2F2" />
        <StatCard value={stats.urgent} label="Urgent" icon="⚠️" color="#D97706" bg="#FFFBEB" />
        <StatCard value={stats.consulting} label="Active" icon="💬" color="#059669" bg="#ECFDF5" />
      </View>

      {/* ─── Search & Filters ─── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search patient name, ID, or symptoms..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTER_TABS.map((tab) => {
            const active = tab === filter;
            const cfg = tab === 'all' ? null : RISK_CONFIG[tab];
            return (
              <Pressable
                key={tab}
                onPress={() => setFilter(tab)}
                style={[
                  styles.filterPill,
                  active && {
                    backgroundColor: tab === 'all' ? '#E0E7FF' : cfg!.bg,
                    borderColor: tab === 'all' ? '#818CF8' : cfg!.border,
                  },
                ]}
              >
                {cfg && <Text style={{ fontSize: 10, marginRight: 4 }}>{cfg.icon}</Text>}
                <Text
                  style={[
                    styles.filterText,
                    active && { color: tab === 'all' ? '#4338CA' : cfg!.color, fontWeight: '700' },
                  ]}
                >
                  {tab === 'all' ? 'All Patients' : cfg!.label}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    active && {
                      backgroundColor: tab === 'all' ? '#4338CA' : cfg!.color,
                    },
                  ]}
                >
                  <Text style={styles.filterCountText}>
                    {tab === 'all'
                      ? MOCK_PATIENTS.length
                      : MOCK_PATIENTS.filter((p) => p.risk === tab).length}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Main Content ─── */}
      <View style={styles.mainContent}>
        {/* Patient List */}
        <ScrollView style={styles.listPane} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>📋</Text>
              <Text style={styles.emptyTitle}>No patients found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
            </View>
          )}
          {filtered.map((patient, idx) => (
            <PatientQueueCard
              key={patient.id}
              patient={patient}
              isSelected={patient.id === selectedId}
              onSelect={() => setSelectedId(patient.id)}
              index={idx}
            />
          ))}
        </ScrollView>

        {/* ─── Quick Preview Panel ─── */}
        {selectedPatient && (
          <ScrollView style={styles.previewPane} showsVerticalScrollIndicator={false}>
            <PreviewPanel patient={selectedPatient} />
          </ScrollView>
        )}
      </View>
    </View>
  );
};

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

const StatCard: React.FC<{ value: number; label: string; icon: string; color: string; bg: string }> = ({
  value,
  label,
  icon,
  color,
  bg,
}) => (
  <View style={[styles.statCard, { backgroundColor: bg, borderColor: color + '20' }]}>
    <View style={styles.statTop}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
    <Text style={[styles.statLabel, { color: color + 'CC' }]}>{label}</Text>
  </View>
);

const PatientQueueCard: React.FC<{
  patient: QueuePatient;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}> = ({ patient, isSelected, onSelect, index }) => {
  const cfg = RISK_CONFIG[patient.risk];

  return (
    <Pressable onPress={onSelect}>
      <View
        style={[
          styles.queueCard,
          { borderLeftColor: cfg.color, borderLeftWidth: 4 },
          isSelected && styles.queueCardSelected,
        ]}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.avatar, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.avatarText, { color: cfg.color }]}>
                {patient.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <View style={[styles.riskTag, { backgroundColor: cfg.bg }]}>
                  <Text style={{ fontSize: 8 }}>{cfg.icon}</Text>
                  <Text style={[styles.riskTagText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              </View>
              <Text style={styles.patientMeta}>
                {patient.id} · {patient.age}y · {patient.gender === 'M' ? 'Male' : 'Female'} · {patient.location}
              </Text>
            </View>
          </View>
          <View style={styles.waitBadge}>
            <Text style={styles.waitIcon}>⏱</Text>
            <Text style={[styles.waitText, patient.waitTime <= 5 && { color: '#DC2626', fontWeight: '800' }]}>
              {patient.waitTime}m
            </Text>
          </View>
        </View>

        {/* Symptoms */}
        <View style={styles.symptomRow}>
          {patient.symptoms.map((s, i) => (
            <View key={i} style={styles.symptomChip}>
              <Text style={styles.symptomChipText}>{s}</Text>
            </View>
          ))}
        </View>

        {/* AI Risk + Vitals Mini */}
        <View style={styles.cardFooter}>
          <View style={styles.aiScoreContainer}>
            <Text style={styles.aiLabel}>AI Risk</Text>
            <View style={styles.aiScoreBarBg}>
              <View
                style={[
                  styles.aiScoreBarFill,
                  {
                    width: `${patient.aiRiskScore}%`,
                    backgroundColor:
                      patient.aiRiskScore >= 75
                        ? '#DC2626'
                        : patient.aiRiskScore >= 40
                        ? '#D97706'
                        : '#059669',
                  },
                ]}
              />
            </View>
            <Text
              style={[
                styles.aiScoreText,
                {
                  color:
                    patient.aiRiskScore >= 75
                      ? '#DC2626'
                      : patient.aiRiskScore >= 40
                      ? '#D97706'
                      : '#059669',
                },
              ]}
            >
              {patient.aiRiskScore}%
            </Text>
          </View>

          <View style={styles.miniVitals}>
            <Text style={[styles.miniVitalText, patient.vitals.spo2 < 92 && { color: '#DC2626' }]}>
              SpO₂ {patient.vitals.spo2}%
            </Text>
            <Text style={styles.miniVitalDot}>·</Text>
            <Text style={[styles.miniVitalText, patient.vitals.hr > 100 && { color: '#DC2626' }]}>
              HR {patient.vitals.hr}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={[styles.actionBtn, styles.actionPrimary]}>
            <Text style={styles.actionBtnIcon}>💬</Text>
            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Consult</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.actionSecondary]}>
            <Text style={styles.actionBtnIcon}>📋</Text>
            <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Records</Text>
          </Pressable>
          {patient.risk !== 'emergency' && (
            <Pressable style={[styles.actionBtn, styles.actionDanger]}>
              <Text style={styles.actionBtnIcon}>🚨</Text>
              <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Escalate</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const PreviewPanel: React.FC<{ patient: QueuePatient }> = ({ patient }) => {
  const cfg = RISK_CONFIG[patient.risk];

  return (
    <View style={styles.previewContent}>
      {/* Patient Header */}
      <View style={[styles.previewHeader, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
        <View style={[styles.previewAvatar, { backgroundColor: cfg.color + '20' }]}>
          <Text style={{ fontSize: 28, color: cfg.color }}>
            {patient.gender === 'M' ? '👨‍⚕️' : '👩‍⚕️'}
          </Text>
        </View>
        <Text style={styles.previewName}>{patient.name}</Text>
        <Text style={styles.previewMeta}>
          {patient.age} years · {patient.gender === 'M' ? 'Male' : 'Female'}
        </Text>
        <View style={[styles.previewRiskBadge, { backgroundColor: cfg.color }]}>
          <Text style={styles.previewRiskText}>{cfg.label}</Text>
        </View>
      </View>

      {/* Contact / Location */}
      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>📍 Location</Text>
        <Text style={styles.previewSectionContent}>{patient.location}</Text>
      </View>

      {/* Symptoms Detail */}
      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>🩺 Symptoms</Text>
        {patient.symptoms.map((s, i) => (
          <View key={i} style={styles.previewSymptomItem}>
            <View style={[styles.previewSymptomDot, { backgroundColor: cfg.color }]} />
            <Text style={styles.previewSymptomText}>{s}</Text>
          </View>
        ))}
      </View>

      {/* Vitals */}
      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>❤️ Vitals</Text>
        <View style={styles.vitalsGrid}>
          <VitalItem
            label="Heart Rate"
            value={`${patient.vitals.hr} bpm`}
            icon="💓"
            alert={patient.vitals.hr > 100}
          />
          <VitalItem label="Blood Pressure" value={patient.vitals.bp} icon="🩸" alert={false} />
          <VitalItem
            label="SpO₂"
            value={`${patient.vitals.spo2}%`}
            icon="🫁"
            alert={patient.vitals.spo2 < 92}
          />
          <VitalItem
            label="Temperature"
            value={`${patient.vitals.temp}°F`}
            icon="🌡️"
            alert={patient.vitals.temp > 100.4}
          />
        </View>
      </View>

      {/* AI Risk Assessment */}
      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>🤖 AI Risk Assessment</Text>
        <View style={styles.aiDetailCard}>
          <View style={styles.aiCircleContainer}>
            <View
              style={[
                styles.aiCircle,
                {
                  borderColor:
                    patient.aiRiskScore >= 75
                      ? '#DC2626'
                      : patient.aiRiskScore >= 40
                      ? '#D97706'
                      : '#059669',
                },
              ]}
            >
              <Text
                style={[
                  styles.aiCircleText,
                  {
                    color:
                      patient.aiRiskScore >= 75
                        ? '#DC2626'
                        : patient.aiRiskScore >= 40
                        ? '#D97706'
                        : '#059669',
                  },
                ]}
              >
                {patient.aiRiskScore}
              </Text>
              <Text style={styles.aiCircleSub}>/ 100</Text>
            </View>
          </View>
          <Text style={styles.aiDetailLabel}>
            {patient.aiRiskScore >= 75
              ? 'High risk — Immediate attention recommended'
              : patient.aiRiskScore >= 40
              ? 'Moderate risk — Consultation needed soon'
              : 'Low risk — Routine consultation'}
          </Text>
        </View>
      </View>

      {/* Medical History */}
      <View style={styles.previewSection}>
        <Text style={styles.previewSectionTitle}>📂 Medical History</Text>
        {patient.history.length === 0 ? (
          <Text style={styles.noDataText}>No significant history</Text>
        ) : (
          patient.history.map((h, i) => (
            <View key={i} style={styles.historyItem}>
              <Text style={styles.historyDot}>•</Text>
              <Text style={styles.historyText}>{h}</Text>
            </View>
          ))
        )}
      </View>

      {/* Allergies */}
      {patient.allergies.length > 0 && (
        <View style={[styles.previewSection, styles.allergySection]}>
          <Text style={styles.previewSectionTitle}>⚠️ Allergies</Text>
          <View style={styles.allergyRow}>
            {patient.allergies.map((a, i) => (
              <View key={i} style={styles.allergyChip}>
                <Text style={styles.allergyChipText}>{a}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.previewActions}>
        <Pressable style={[styles.previewActionBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.previewActionBtnText}>💬  Start Consultation</Text>
        </Pressable>
        <Pressable style={[styles.previewActionBtn, { backgroundColor: '#374151' }]}>
          <Text style={styles.previewActionBtnText}>📄  View Full Record</Text>
        </Pressable>
      </View>
    </View>
  );
};

const VitalItem: React.FC<{ label: string; value: string; icon: string; alert: boolean }> = ({
  label,
  value,
  icon,
  alert,
}) => (
  <View style={[styles.vitalItem, alert && styles.vitalItemAlert]}>
    <Text style={{ fontSize: 18 }}>{icon}</Text>
    <Text style={[styles.vitalValue, alert && { color: '#DC2626' }]}>{value}</Text>
    <Text style={styles.vitalLabel}>{label}</Text>
  </View>
);

/* ═══════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // Search
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    height: '100%',
  },
  clearBtn: {
    fontSize: 16,
    color: '#94A3B8',
    padding: 4,
  },

  // Filters
  filterRow: {
    marginTop: 10,
    flexGrow: 0,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterCount: {
    marginLeft: 6,
    backgroundColor: '#94A3B8',
    borderRadius: 999,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // Main Content
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  listPane: {
    flex: 1,
    paddingHorizontal: 16,
  },
  previewPane: {
    width: 340,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Queue Card
  queueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  queueCardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  patientMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  riskTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 3,
  },
  riskTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  waitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  waitIcon: {
    fontSize: 12,
  },
  waitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  // Symptoms
  symptomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  symptomChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  symptomChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },

  // Card Footer — AI + Vitals
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  aiScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  aiScoreBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    maxWidth: 80,
  },
  aiScoreBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  aiScoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  miniVitals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniVitalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  miniVitalDot: {
    color: '#CBD5E1',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionPrimary: {
    backgroundColor: theme.colors.primary,
  },
  actionSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  actionBtnIcon: {
    fontSize: 14,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── Preview Panel ───
  previewContent: {
    padding: 16,
  },
  previewHeader: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  previewMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  previewRiskBadge: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewRiskText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Sections
  previewSection: {
    marginBottom: 16,
  },
  previewSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  previewSectionContent: {
    fontSize: 13,
    color: '#64748B',
  },

  // Symptoms Preview
  previewSymptomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  previewSymptomDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewSymptomText: {
    fontSize: 13,
    color: '#334155',
  },

  // Vitals Grid
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalItem: {
    width: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalItemAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  vitalLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },

  // AI Detail
  aiDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiCircleContainer: {
    marginBottom: 10,
  },
  aiCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  aiCircleText: {
    fontSize: 22,
    fontWeight: '900',
  },
  aiCircleSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  aiDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 18,
  },

  // History
  noDataText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  historyItem: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  historyDot: {
    color: '#94A3B8',
    fontSize: 14,
  },
  historyText: {
    fontSize: 13,
    color: '#334155',
  },

  // Allergies
  allergySection: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allergyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergyChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allergyChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },

  // Preview Actions
  previewActions: {
    gap: 8,
    marginTop: 8,
  },
  previewActionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  previewActionBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
