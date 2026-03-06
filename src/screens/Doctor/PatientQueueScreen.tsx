import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { theme } from '../../utils/theme';
import { RiskLevel } from '../../models';

/* ─────────────────────────────────────────────
   Types & Mock Data
   ───────────────────────────────────────────── */
interface QueuePatient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  symptoms: string[];
  risk: RiskLevel;
  waitTime: number;
  location: string;
  vitals: { hr: number; bp: string; temp: number };
  aiRiskScore: number;
  history: string[];
  allergies: string[];
  assignedTime: string;
  lastVisit: string;
  insuranceStatus: 'active' | 'expired' | 'none';
  notes: string;
}

const PATIENTS: QueuePatient[] = [
  {
    id: 'P-1042', name: 'Ravi Kumar', age: 45, gender: 'M',
    symptoms: ['Chest pain', 'Shortness of breath', 'Dizziness'],
    risk: 'emergency', waitTime: 2, location: 'Mumbai',
    vitals: { hr: 112, bp: '160/100', temp: 99.2 },
    aiRiskScore: 94, history: ['Hypertension', 'Type 2 Diabetes'],
    allergies: ['Penicillin'], assignedTime: '10:23 AM',
    lastVisit: '2 weeks ago', insuranceStatus: 'active',
    notes: 'Recurrent chest pain episodes. ECG pending.',
  },
  {
    id: 'P-1038', name: 'Sana Ali', age: 32, gender: 'F',
    symptoms: ['Severe headache', 'Nausea', 'Blurred vision'],
    risk: 'moderate', waitTime: 12, location: 'Pune',
    vitals: { hr: 88, bp: '140/90', temp: 98.8 },
    aiRiskScore: 67, history: ['Migraine'],
    allergies: [], assignedTime: '10:18 AM',
    lastVisit: '3 months ago', insuranceStatus: 'active',
    notes: 'History of migraines with aura. No prior hospitalisation.',
  },
  {
    id: 'P-1035', name: 'Neha Das', age: 28, gender: 'F',
    symptoms: ['Fever', 'Sore throat', 'Body ache'],
    risk: 'mild', waitTime: 25, location: 'Thane',
    vitals: { hr: 78, bp: '120/80', temp: 101.2 },
    aiRiskScore: 22, history: [],
    allergies: ['Sulfa drugs'], assignedTime: '10:05 AM',
    lastVisit: 'First visit', insuranceStatus: 'none',
    notes: '',
  },
  {
    id: 'P-1044', name: 'Arjun Patel', age: 58, gender: 'M',
    symptoms: ['Abdominal pain', 'Vomiting', 'Fever'],
    risk: 'moderate', waitTime: 8, location: 'Navi Mumbai',
    vitals: { hr: 95, bp: '135/88', temp: 100.8 },
    aiRiskScore: 58, history: ['Gallstones', 'Cholecystitis'],
    allergies: ['Aspirin'], assignedTime: '10:30 AM',
    lastVisit: '1 month ago', insuranceStatus: 'expired',
    notes: 'Scheduled for cholecystectomy evaluation.',
  },
  {
    id: 'P-1046', name: 'Priya Sharma', age: 24, gender: 'F',
    symptoms: ['Cough', 'Runny nose', 'Mild fatigue'],
    risk: 'mild', waitTime: 35, location: 'Borivali',
    vitals: { hr: 72, bp: '118/76', temp: 99.0 },
    aiRiskScore: 12, history: [],
    allergies: [], assignedTime: '09:55 AM',
    lastVisit: 'First visit', insuranceStatus: 'active',
    notes: '',
  },
  {
    id: 'P-1048', name: 'Mohammed Ansari', age: 67, gender: 'M',
    symptoms: ['Difficulty breathing', 'Wheezing', 'Chest tightness'],
    risk: 'emergency', waitTime: 1, location: 'Andheri',
    vitals: { hr: 108, bp: '150/95', temp: 98.6 },
    aiRiskScore: 91, history: ['COPD', 'Asthma', 'Smoking history'],
    allergies: ['Ibuprofen'], assignedTime: '10:38 AM',
    lastVisit: '1 week ago', insuranceStatus: 'active',
    notes: 'Acute exacerbation of COPD. O2 therapy may be needed.',
  },
];

const PRIORITY: Record<string, number> = { emergency: 0, moderate: 1, mild: 2, pending: 3 };

const RISK = {
  emergency: { color: '#DC2626', bg: '#FEF2F2', surface: '#FFF5F5', label: 'Critical', dot: '#EF4444' },
  moderate:  { color: '#D97706', bg: '#FFFBEB', surface: '#FFFDF5', label: 'Urgent',   dot: '#F59E0B' },
  mild:      { color: '#059669', bg: '#ECFDF5', surface: '#F0FDF4', label: 'Stable',   dot: '#10B981' },
  pending:   { color: '#6B7280', bg: '#F9FAFB', surface: '#F3F4F6', label: 'Pending',  dot: '#9CA3AF' },
};

const FILTERS: Array<RiskLevel | 'all'> = ['all', 'emergency', 'moderate', 'mild'];

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
const riskColor = (score: number) =>
  score >= 75 ? '#DC2626' : score >= 40 ? '#D97706' : '#059669';

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).join('').toUpperCase();

const formatWait = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`);

/* ═════════════════════════════════════════════
   Main Screen
   ═════════════════════════════════════════════ */
export const PatientQueueScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const filtered = useMemo(() => {
    let list = PATIENTS;
    if (filter !== 'all') list = list.filter((p) => p.risk === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.symptoms.some((s) => s.toLowerCase().includes(q)),
      );
    }
    return [...list].sort((a, b) => PRIORITY[a.risk] - PRIORITY[b.risk]);
  }, [filter, search]);

  const stats = useMemo(() => ({
    total: PATIENTS.length,
    emergency: PATIENTS.filter((p) => p.risk === 'emergency').length,
    urgent: PATIENTS.filter((p) => p.risk === 'moderate').length,
    stable: PATIENTS.filter((p) => p.risk === 'mild').length,
  }), []);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };
  const closeDetail = () => {
    Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }).start(() => {
      setDetailOpen(false);
      setSelectedId(null);
    });
  };

  const selected = PATIENTS.find((p) => p.id === selectedId) || null;

  return (
    <View style={s.root}>
      {/* ─── Header ─── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Patient Queue</Text>
          <Text style={s.subGreeting}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            {'  ·  '}{PATIENTS.length} patients waiting
          </Text>
        </View>
        <View style={s.liveBadge}>
          <View style={s.liveDot} />
          <Text style={s.liveText}>Live</Text>
        </View>
      </View>

      {/* ─── Stat Strip ─── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.statStrip}>
        <StatChip icon="👥" value={stats.total}     label="Total"     accent="#3B82F6" />
        <StatChip icon="🔴" value={stats.emergency} label="Critical"  accent="#DC2626" />
        <StatChip icon="🟠" value={stats.urgent}    label="Urgent"    accent="#D97706" />
        <StatChip icon="🟢" value={stats.stable}    label="Stable"    accent="#059669" />
      </ScrollView>

      {/* ─── Search ─── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Text style={s.searchIco}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, ID or symptom…"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Text style={s.clearX}>✕</Text>
            </Pressable>
          )}
        </View>
        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
          {FILTERS.map((f) => {
            const on = f === filter;
            const r = f === 'all' ? null : RISK[f];
            const count = f === 'all' ? PATIENTS.length : PATIENTS.filter((p) => p.risk === f).length;
            return (
              <Pressable key={f} onPress={() => setFilter(f)} style={[s.chip, on && (r ? { backgroundColor: r.bg, borderColor: r.color + '50' } : s.chipAllOn)]}>
                {r && <View style={[s.chipDot, { backgroundColor: r.dot }]} />}
                <Text style={[s.chipLabel, on && { color: r ? r.color : '#4338CA', fontWeight: '700' }]}>
                  {f === 'all' ? 'All' : r!.label}
                </Text>
                <View style={[s.chipCount, on && { backgroundColor: r ? r.color : '#4338CA' }]}>
                  <Text style={s.chipCountText}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Queue List ─── */}
      <ScrollView style={s.list} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 48 }}>🔎</Text>
            <Text style={s.emptyTitle}>No patients match</Text>
            <Text style={s.emptySub}>Try changing filters or search terms</Text>
          </View>
        ) : (
          filtered.map((p) => (
            <PatientCard
              key={p.id}
              patient={p}
              isActive={p.id === selectedId}
              onPress={() => openDetail(p.id)}
            />
          ))
        )}
      </ScrollView>

      {/* ─── Detail Sheet (slide-in) ─── */}
      {detailOpen && selected && (
        <Animated.View style={[s.detailOverlay, { transform: [{ translateX: slideAnim }] }]}>
          <DetailSheet patient={selected} onClose={closeDetail} />
        </Animated.View>
      )}
    </View>
  );
};

/* ═════════════════════════════════════════════
   Sub-components
   ═════════════════════════════════════════════ */

/* ── Stat Chip ── */
const StatChip: React.FC<{ icon: string; value: number; label: string; accent: string }> = ({
  icon, value, label, accent,
}) => (
  <View style={[s.statCard, { borderColor: accent + '18' }]}>
    <View style={[s.statIconWrap, { backgroundColor: accent + '14' }]}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
    </View>
    <Text style={[s.statVal, { color: accent }]}>{value}</Text>
    <Text style={s.statLbl}>{label}</Text>
  </View>
);

/* ── Patient Card ── */
const PatientCard: React.FC<{
  patient: QueuePatient;
  isActive: boolean;
  onPress: () => void;
}> = ({ patient, isActive, onPress }) => {
  const r = RISK[patient.risk];
  const urgent = patient.waitTime <= 5;

  return (
    <Pressable onPress={onPress}>
      <View style={[s.card, isActive && { backgroundColor: '#F0F7FF', borderColor: '#93C5FD' }]}>
        {/* Top row */}
        <View style={s.cardRow}>
          {/* Avatar */}
          <View style={[s.avatar, { backgroundColor: r.bg }]}>
            <Text style={[s.avatarLetter, { color: r.color }]}>{initials(patient.name)}</Text>
            <View style={[s.statusDot, { backgroundColor: r.dot }]} />
          </View>
          {/* Info */}
          <View style={s.cardInfo}>
            <View style={s.nameRow}>
              <Text style={s.cardName} numberOfLines={1}>{patient.name}</Text>
              <View style={[s.priorityTag, { backgroundColor: r.bg }]}>
                <Text style={[s.priorityText, { color: r.color }]}>{r.label}</Text>
              </View>
            </View>
            <Text style={s.cardMeta}>{patient.id}  ·  {patient.age}y {patient.gender === 'M' ? 'Male' : 'Female'}  ·  {patient.location}</Text>
          </View>
          {/* Wait time */}
          <View style={[s.waitPill, urgent && { backgroundColor: '#FEF2F2' }]}>
            <Text style={[s.waitNum, urgent && { color: '#DC2626' }]}>{formatWait(patient.waitTime)}</Text>
            <Text style={[s.waitLabel, urgent && { color: '#DC262699' }]}>wait</Text>
          </View>
        </View>

        {/* Symptoms row */}
        <View style={s.sympRow}>
          {patient.symptoms.map((sym, i) => (
            <View key={i} style={s.sympChip}>
              <Text style={s.sympText}>{sym}</Text>
            </View>
          ))}
        </View>

        {/* Footer: AI bar + vitals */}
        <View style={s.cardFoot}>
          <View style={s.aiBar}>
            <Text style={s.aiLbl}>AI Risk</Text>
            <View style={s.aiTrack}>
              <View style={[s.aiFill, { width: `${patient.aiRiskScore}%`, backgroundColor: riskColor(patient.aiRiskScore) }]} />
            </View>
            <Text style={[s.aiPct, { color: riskColor(patient.aiRiskScore) }]}>{patient.aiRiskScore}%</Text>
          </View>
          <View style={s.vitMini}>
            <VitalMini label="HR" value={`${patient.vitals.hr}`} alert={patient.vitals.hr > 100} />
            <VitalMini label="BP" value={patient.vitals.bp} alert={false} />
            <VitalMini label="Temp" value={`${patient.vitals.temp}°`} alert={patient.vitals.temp > 100.4} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

/* ── Mini Vital ── */
const VitalMini: React.FC<{ label: string; value: string; alert: boolean }> = ({ label, value, alert }) => (
  <View style={[s.vitChip, alert && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
    <Text style={[s.vitVal, alert && { color: '#DC2626' }]}>{value}</Text>
    <Text style={s.vitLbl}>{label}</Text>
  </View>
);

/* ═════════════════════════════════════════════
   Detail Sheet
   ═════════════════════════════════════════════ */
const DetailSheet: React.FC<{ patient: QueuePatient; onClose: () => void }> = ({ patient, onClose }) => {
  const r = RISK[patient.risk];
  const [tab, setTab] = useState<'overview' | 'vitals' | 'history'>('overview');

  return (
    <View style={s.sheet}>
      {/* Sheet Header */}
      <View style={s.sheetHeader}>
        <Pressable onPress={onClose} hitSlop={12} style={s.backBtn}>
          <Text style={s.backArrow}>←</Text>
        </Pressable>
        <Text style={s.sheetTitle}>Patient Details</Text>
        <View style={[s.sheetBadge, { backgroundColor: r.color }]}>
          <Text style={s.sheetBadgeText}>{r.label}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetBody}>
        {/* Profile Card */}
        <View style={[s.profileCard, { borderColor: r.color + '25' }]}>
          <View style={[s.profileAvatar, { backgroundColor: r.bg }]}>
            <Text style={{ fontSize: 32 }}>{patient.gender === 'M' ? '👨' : '👩'}</Text>
          </View>
          <Text style={s.profileName}>{patient.name}</Text>
          <Text style={s.profileMeta}>{patient.age} years  ·  {patient.gender === 'M' ? 'Male' : 'Female'}  ·  {patient.id}</Text>
          <Text style={s.profileLoc}>📍 {patient.location}  ·  Assigned {patient.assignedTime}</Text>
          {/* Insurance badge */}
          <View style={[s.insBadge,
            patient.insuranceStatus === 'active'  ? { backgroundColor: '#ECFDF5' } :
            patient.insuranceStatus === 'expired' ? { backgroundColor: '#FEF2F2' } :
                                                    { backgroundColor: '#F3F4F6' }
          ]}>
            <Text style={[s.insText,
              patient.insuranceStatus === 'active'  ? { color: '#059669' } :
              patient.insuranceStatus === 'expired' ? { color: '#DC2626' } :
                                                      { color: '#6B7280' }
            ]}>
              {patient.insuranceStatus === 'active' ? '✓ Insurance Active' :
               patient.insuranceStatus === 'expired' ? '✗ Insurance Expired' :
               '— No Insurance'}
            </Text>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={s.tabBar}>
          {(['overview', 'vitals', 'history'] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabOn]}>
              <Text style={[s.tabText, tab === t && s.tabTextOn]}>
                {t === 'overview' ? '🩺 Overview' : t === 'vitals' ? '💓 Vitals' : '📂 History'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'overview' && <OverviewTab patient={patient} />}
        {tab === 'vitals' && <VitalsTab patient={patient} />}
        {tab === 'history' && <HistoryTab patient={patient} />}

        {/* Allergy Banner */}
        {patient.allergies.length > 0 && (
          <View style={s.allergyBanner}>
            <Text style={s.allergyTitle}>⚠️  Known Allergies</Text>
            <View style={s.allergyChips}>
              {patient.allergies.map((a, i) => (
                <View key={i} style={s.allergyPill}>
                  <Text style={s.allergyPillText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={s.sheetActions}>
          <Pressable style={[s.sheetBtn, { backgroundColor: theme.colors.primary }]}>
            <Text style={s.sheetBtnText}>💬  Start Consultation</Text>
          </Pressable>
          <View style={s.sheetBtnRow}>
            <Pressable style={[s.sheetBtnSm, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={[s.sheetBtnSmText, { color: '#059669' }]}>📝 Add Note</Text>
            </Pressable>
            <Pressable style={[s.sheetBtnSm, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={[s.sheetBtnSmText, { color: '#2563EB' }]}>📄 Records</Text>
            </Pressable>
            <Pressable style={[s.sheetBtnSm, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Text style={[s.sheetBtnSmText, { color: '#DC2626' }]}>🚨 Escalate</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/* ── Overview Tab ── */
const OverviewTab: React.FC<{ patient: QueuePatient }> = ({ patient }) => {
  const r = RISK[patient.risk];
  return (
    <View style={s.tabContent}>
      {/* AI Triage Ring */}
      <View style={s.aiRingCard}>
        <View style={s.aiRingOuter}>
          <View style={[s.aiRing, { borderColor: riskColor(patient.aiRiskScore) }]}>
            <Text style={[s.aiRingNum, { color: riskColor(patient.aiRiskScore) }]}>{patient.aiRiskScore}</Text>
            <Text style={s.aiRingSub}>/ 100</Text>
          </View>
        </View>
        <View style={s.aiRingInfo}>
          <Text style={s.aiRingTitle}>AI Triage Score</Text>
          <Text style={[s.aiRingDesc, { color: riskColor(patient.aiRiskScore) }]}>
            {patient.aiRiskScore >= 75 ? 'High risk — immediate attention' :
             patient.aiRiskScore >= 40 ? 'Moderate — prompt consultation' :
             'Low risk — routine care'}
          </Text>
          <Text style={s.aiRingMeta}>Last assessed: {patient.assignedTime}</Text>
        </View>
      </View>

      {/* Presenting Symptoms */}
      <Text style={s.secTitle}>Presenting Symptoms</Text>
      {patient.symptoms.map((sym, i) => (
        <View key={i} style={s.symItem}>
          <View style={[s.symDot, { backgroundColor: r.dot }]} />
          <Text style={s.symText}>{sym}</Text>
        </View>
      ))}

      {/* Clinical Notes */}
      {patient.notes ? (
        <>
          <Text style={[s.secTitle, { marginTop: 16 }]}>Clinical Notes</Text>
          <View style={s.noteBox}>
            <Text style={s.noteText}>{patient.notes}</Text>
          </View>
        </>
      ) : null}

      {/* Quick Info */}
      <Text style={[s.secTitle, { marginTop: 16 }]}>Quick Info</Text>
      <View style={s.infoGrid}>
        <InfoTile icon="🕐" label="Wait Time" value={formatWait(patient.waitTime)} />
        <InfoTile icon="📅" label="Last Visit" value={patient.lastVisit} />
        <InfoTile icon="📍" label="Location" value={patient.location} />
        <InfoTile icon="⏰" label="Assigned" value={patient.assignedTime} />
      </View>
    </View>
  );
};

/* ── Vitals Tab ── */
const VitalsTab: React.FC<{ patient: QueuePatient }> = ({ patient }) => (
  <View style={s.tabContent}>
    <View style={s.vitGrid}>
      <VitalGauge
        icon="💓" label="Heart Rate" value={`${patient.vitals.hr}`} unit="bpm"
        normal="60–100" alert={patient.vitals.hr > 100}
      />
      <VitalGauge
        icon="🩸" label="Blood Pressure" value={patient.vitals.bp} unit="mmHg"
        normal="120/80" alert={false}
      />
      <VitalGauge
        icon="🌡️" label="Temperature" value={`${patient.vitals.temp}`} unit="°F"
        normal="97.8–99.1" alert={patient.vitals.temp > 100.4}
      />
    </View>
    <View style={s.vitNote}>
      <Text style={s.vitNoteIcon}>ℹ️</Text>
      <Text style={s.vitNoteText}>Vitals auto-updated from connected devices. Last sync: 2 min ago</Text>
    </View>
  </View>
);

/* ── History Tab ── */
const HistoryTab: React.FC<{ patient: QueuePatient }> = ({ patient }) => (
  <View style={s.tabContent}>
    <Text style={s.secTitle}>Medical History</Text>
    {patient.history.length === 0 ? (
      <View style={s.histEmpty}>
        <Text style={{ fontSize: 32 }}>📋</Text>
        <Text style={s.histEmptyText}>No significant medical history recorded</Text>
      </View>
    ) : (
      patient.history.map((h, i) => (
        <View key={i} style={s.histItem}>
          <View style={s.histDotLine}>
            <View style={s.histDot} />
            {i < patient.history.length - 1 && <View style={s.histLine} />}
          </View>
          <View style={s.histCard}>
            <Text style={s.histText}>{h}</Text>
            <Text style={s.histDate}>Ongoing condition</Text>
          </View>
        </View>
      ))
    )}
  </View>
);

/* ── Vital Gauge Card ── */
const VitalGauge: React.FC<{
  icon: string; label: string; value: string; unit: string; normal: string; alert: boolean;
}> = ({ icon, label, value, unit, normal, alert }) => (
  <View style={[s.gaugeCard, alert && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <Text style={[s.gaugeVal, alert && { color: '#DC2626' }]}>{value}</Text>
    <Text style={s.gaugeUnit}>{unit}</Text>
    <Text style={s.gaugeLbl}>{label}</Text>
    <Text style={[s.gaugeNorm, alert && { color: '#DC262699' }]}>Normal: {normal}</Text>
    {alert && <View style={s.alertDot} />}
  </View>
);

/* ── Info Tile ── */
const InfoTile: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={s.infoTile}>
    <Text style={{ fontSize: 16 }}>{icon}</Text>
    <Text style={s.infoVal}>{value}</Text>
    <Text style={s.infoLbl}>{label}</Text>
  </View>
);

/* ═════════════════════════════════════════════
   Styles
   ═════════════════════════════════════════════ */
const { width: W } = Dimensions.get('window');

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FA' },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  subGreeting: { fontSize: 12, color: '#64748B', marginTop: 2 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5, borderWidth: 1, borderColor: '#BBF7D0' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  /* Stats */
  statStrip: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  statCard: { width: 84, backgroundColor: '#FFF', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  statIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statVal: { fontSize: 20, fontWeight: '900' },
  statLbl: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 1, letterSpacing: 0.4 },

  /* Search */
  searchWrap: { paddingHorizontal: 16, marginBottom: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIco: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#1E293B' },
  clearX: { fontSize: 14, color: '#94A3B8', paddingLeft: 8 },

  /* Filters */
  filterScroll: { marginTop: 8, flexGrow: 0 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6, borderWidth: 1, borderColor: '#E2E8F0', gap: 5 },
  chipAllOn: { backgroundColor: '#EEF2FF', borderColor: '#A5B4FC' },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  chipCount: { backgroundColor: '#94A3B8', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  chipCountText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

  /* List */
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },

  /* Card */
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#EEF0F4', shadowColor: '#64748B', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarLetter: { fontSize: 14, fontWeight: '800' },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFF' },
  cardInfo: { flex: 1, marginLeft: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  cardMeta: { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  waitPill: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignItems: 'center', marginLeft: 6 },
  waitNum: { fontSize: 13, fontWeight: '800', color: '#475569' },
  waitLabel: { fontSize: 8, fontWeight: '600', color: '#94A3B8', marginTop: -1 },

  /* Symptoms */
  sympRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  sympChip: { backgroundColor: '#F1F5F9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sympText: { fontSize: 10, color: '#475569', fontWeight: '500' },

  /* Card footer */
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  aiBar: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  aiLbl: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  aiTrack: { flex: 1, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden', maxWidth: 70 },
  aiFill: { height: '100%', borderRadius: 2 },
  aiPct: { fontSize: 11, fontWeight: '800' },
  vitMini: { flexDirection: 'row', gap: 4 },
  vitChip: { backgroundColor: '#F8FAFC', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  vitVal: { fontSize: 10, fontWeight: '700', color: '#334155' },
  vitLbl: { fontSize: 7, fontWeight: '600', color: '#94A3B8', marginTop: -1 },

  /* Detail Overlay */
  detailOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, width: Math.min(W * 0.88, 400), shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: -4, height: 0 }, elevation: 10 },

  /* Sheet */
  sheet: { flex: 1, backgroundColor: '#FFF' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 10 },
  backBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#334155' },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#0F172A' },
  sheetBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  sheetBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  sheetBody: { padding: 16, paddingBottom: 40 },

  /* Profile card */
  profileCard: { alignItems: 'center', padding: 20, borderRadius: 16, backgroundColor: '#FAFBFC', borderWidth: 1, marginBottom: 16 },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  profileMeta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  profileLoc: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  insBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  insText: { fontSize: 11, fontWeight: '700' },

  /* Tabs */
  tabBar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 3, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabOn: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  tabText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  tabTextOn: { color: '#0F172A', fontWeight: '700' },
  tabContent: { marginBottom: 16 },

  /* Overview: AI Ring */
  aiRingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFBFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16, gap: 14 },
  aiRingOuter: {},
  aiRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  aiRingNum: { fontSize: 20, fontWeight: '900' },
  aiRingSub: { fontSize: 8, color: '#94A3B8', fontWeight: '600', marginTop: -2 },
  aiRingInfo: { flex: 1 },
  aiRingTitle: { fontSize: 13, fontWeight: '700', color: '#334155' },
  aiRingDesc: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  aiRingMeta: { fontSize: 9, color: '#94A3B8', marginTop: 3 },

  /* Overview: Symptoms */
  secTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8, letterSpacing: 0.2 },
  symItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  symDot: { width: 6, height: 6, borderRadius: 3 },
  symText: { fontSize: 13, color: '#334155' },

  /* Overview: Notes */
  noteBox: { backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FDE68A' },
  noteText: { fontSize: 12, color: '#78350F', lineHeight: 18 },

  /* Overview: Info Grid */
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoTile: { width: '47%', backgroundColor: '#FAFBFC', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 2 },
  infoVal: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  infoLbl: { fontSize: 9, fontWeight: '600', color: '#94A3B8' },

  /* Vitals tab */
  vitGrid: { gap: 8 },
  gaugeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFBFC', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10, flexWrap: 'wrap', position: 'relative' },
  gaugeVal: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  gaugeUnit: { fontSize: 11, color: '#94A3B8', fontWeight: '600', marginRight: 'auto' },
  gaugeLbl: { fontSize: 12, fontWeight: '600', color: '#334155' },
  gaugeNorm: { fontSize: 9, color: '#94A3B8', fontWeight: '500' },
  alertDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' },
  vitNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#F0F9FF', borderRadius: 10, padding: 10 },
  vitNoteIcon: { fontSize: 14 },
  vitNoteText: { fontSize: 10, color: '#0369A1', fontWeight: '500', flex: 1 },

  /* History tab */
  histEmpty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  histEmptyText: { fontSize: 12, color: '#94A3B8' },
  histItem: { flexDirection: 'row', marginBottom: 0, gap: 10 },
  histDotLine: { alignItems: 'center', width: 16 },
  histDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6', marginTop: 4 },
  histLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: 2 },
  histCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  histText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  histDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  /* Allergy banner */
  allergyBanner: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 16 },
  allergyTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 8 },
  allergyChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergyPill: { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FDE68A' },
  allergyPillText: { fontSize: 11, fontWeight: '700', color: '#92400E' },

  /* Actions */
  sheetActions: { gap: 8, marginTop: 4 },
  sheetBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sheetBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  sheetBtnRow: { flexDirection: 'row', gap: 6 },
  sheetBtnSm: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  sheetBtnSmText: { fontSize: 11, fontWeight: '700' },
});
