// CHWDashboardScreen – Community Health Worker dashboard
// All state is lifted to the root component so every tab sees live data.

import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { LogoutButton } from '../../components/ui/LogoutButton';

// ─── Palette ─────────────────────────────────────────────────────────────────
const G = {
  dark: '#1B5E20', mid: '#2E7D32', light: '#388E3C',
  pale: '#E8F5E9', accent: '#00C853', white: '#FFFFFF',
  bg: '#F1F8E9', text: '#1A2E1A', sub: '#4A6741', border: '#C8E6C9',
  red: '#C62828', redPale: '#FFEBEE',
  orange: '#E65100', orangePale: '#FFF3E0',
  yellow: '#F9A825', yellowPale: '#FFFDE7',
  gray: '#607D8B', grayPale: '#ECEFF1',
};

const W = Dimensions.get('window').width;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CHWUser {
  id: string; name: string; village: string;
  status: 'active' | 'inactive' | 'never_opened';
  risk: 'high' | 'medium' | 'low';
  phone: string; age: number; conditions: string;
  flagged?: boolean;
  registeredAt: number;
}

export interface HelpRequest {
  id: string; userName: string; village: string;
  issue: string; timeRaised: string; raisedAt: number;
  urgent: boolean; escalated?: boolean;
}

export interface VisitLog { userId: string; notes: string; date: string }

// ─── Initial Mock Data ────────────────────────────────────────────────────────
const INIT_USERS: CHWUser[] = [
  { id: '1', name: 'Priya Sharma',   village: 'Koregaon', status: 'active',      risk: 'low',    phone: '9876543210', age: 34, conditions: 'None',                   registeredAt: Date.now() - 8.64e7 * 7 },
  { id: '2', name: 'Ramesh Patil',   village: 'Wai',      status: 'active',      risk: 'high',   phone: '9123456780', age: 58, conditions: 'Diabetes, Hypertension', registeredAt: Date.now() - 8.64e7 * 5, flagged: true },
  { id: '3', name: 'Sunita Yadav',   village: 'Satara',   status: 'inactive',    risk: 'medium', phone: '9988776655', age: 45, conditions: 'Asthma',                  registeredAt: Date.now() - 8.64e7 * 3 },
  { id: '4', name: 'Mohan Gaikwad',  village: 'Koregaon', status: 'never_opened',risk: 'low',    phone: '9001122334', age: 29, conditions: 'None',                   registeredAt: Date.now() - 8.64e7 * 2 },
  { id: '5', name: 'Lata Deshmukh',  village: 'Patan',    status: 'active',      risk: 'medium', phone: '8765432109', age: 52, conditions: 'Thyroid',                registeredAt: Date.now() - 8.64e7 },
  { id: '6', name: 'Vijay More',     village: 'Wai',      status: 'inactive',    risk: 'high',   phone: '7654321098', age: 63, conditions: 'Heart disease',          registeredAt: Date.now() - 8.64e7 * 4 },
];

const INIT_HELP: HelpRequest[] = [
  { id: 'h1', userName: 'Ramesh Patil',  village: 'Wai',      issue: 'Severe chest pain since morning, difficulty breathing', timeRaised: '2 hrs ago',  raisedAt: Date.now() - 7200000,  urgent: true  },
  { id: 'h2', userName: 'Lata Deshmukh', village: 'Patan',    issue: 'Missed medication for 3 days, feeling dizzy',           timeRaised: '4 hrs ago',  raisedAt: Date.now() - 14400000, urgent: false },
  { id: 'h3', userName: 'Sunita Yadav',  village: 'Satara',   issue: 'Asthma attack, inhaler ran out',                        timeRaised: '6 hrs ago',  raisedAt: Date.now() - 21600000, urgent: true  },
  { id: 'h4', userName: 'Mohan Gaikwad', village: 'Koregaon', issue: 'Needs help installing SmartCare app',                   timeRaised: '1 day ago',  raisedAt: Date.now() - 86400000, urgent: false },
];

const INIT_SESSIONS = 34;
const VILLAGES = ['All', 'Koregaon', 'Wai', 'Satara', 'Patan'];
const STATUS_FILTERS = ['All', 'active', 'inactive', 'never_opened'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── QR Code SVG mock ─────────────────────────────────────────────────────────
const QR_PATTERN = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,0,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,1,0,0,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0],
  [1,0,1,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,1,1,0],
  [0,1,0,0,1,0,0,1,0,0,1,1,0,1,0,1,0,1,0,0,1],
  [1,0,1,0,1,0,1,1,0,1,0,0,1,0,1,0,1,0,1,0,1],
  [0,0,0,1,0,1,0,0,1,1,0,1,0,1,0,0,0,1,0,1,0],
  [1,1,0,0,1,0,1,0,1,0,1,0,0,1,1,0,1,0,0,1,1],
  [0,0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,1,1,0,1,0],
  [1,1,1,1,1,1,1,0,1,0,0,1,0,0,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,0,1,1,0,1,0,1,0,1,0],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,0,1,1,0,1],
  [1,0,1,1,1,0,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,1,0,1,0,1,0,1,0],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
];

const QRCodeMock: React.FC = () => {
  const sz = 210; const cell = sz / 21;
  return (
    <View style={{ alignItems: 'center', padding: 12, backgroundColor: G.white, borderRadius: 12, alignSelf: 'center' }}>
      <Svg width={sz} height={sz}>
        {QR_PATTERN.map((row, r) => row.map((bit, c) =>
          bit ? <Rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell - 1} height={cell - 1} fill={G.dark} rx={1} /> : null
        ))}
      </Svg>
      <Text style={{ marginTop: 8, fontSize: 11, color: G.sub, textAlign: 'center' }}>Scan to install SmartCare</Text>
    </View>
  );
};

// ─── Small UI primitives ─────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: CHWUser['status'] }> = ({ status }) => {
  const cfg = { active: { bg: '#E8F5E9', text: '#1B5E20', label: '● Active' }, inactive: { bg: G.grayPale, text: G.gray, label: '● Inactive' }, never_opened: { bg: '#FFFDE7', text: '#F57F17', label: '● Never Opened' } }[status];
  return <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}><Text style={{ color: cfg.text, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text></View>;
};

const RiskChip: React.FC<{ risk: CHWUser['risk'] }> = ({ risk }) => {
  const cfg = { high: { bg: G.redPale, text: G.red }, medium: { bg: G.orangePale, text: G.orange }, low: { bg: G.pale, text: G.dark } }[risk];
  return <View style={{ backgroundColor: cfg.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}><Text style={{ color: cfg.text, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{risk}</Text></View>;
};

const Btn: React.FC<{ label: string; bg: string; onPress: () => void; small?: boolean }> = ({ label, bg, onPress, small }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75}
    style={{ backgroundColor: bg, borderRadius: 8, paddingHorizontal: small ? 10 : 14, paddingVertical: small ? 5 : 9, marginRight: 6, marginTop: 4 }}>
    <Text style={{ color: G.white, fontSize: small ? 11 : 13, fontWeight: '700' }}>{label}</Text>
  </TouchableOpacity>
);

// ─── Animated stat card ───────────────────────────────────────────────────────
interface StatCardProps { icon: string; value: number | string; label: string; trend: string; trendUp?: boolean | null; onPress?: () => void }
const StatCard: React.FC<StatCardProps> = ({ icon, value, label, trend, trendUp, onPress }) => {
  const sc = useRef(new Animated.Value(1)).current;
  const col = trendUp === true ? G.accent : trendUp === false ? G.red : G.gray;
  return (
    <Animated.View style={[s.statCard, { transform: [{ scale: sc }] }]}>
      <Pressable style={{ flex: 1 }} onPress={onPress}
        onPressIn={() => Animated.spring(sc, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(sc, { toValue: 1, useNativeDriver: true }).start()}>
        <View style={s.statIconWrap}><Text style={s.statIcon}>{icon}</Text></View>
        <Text style={s.statValue}>{value}</Text>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={[s.statTrend, { color: col }]}>{trend}</Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── MODAL: Call ─────────────────────────────────────────────────────────────
const CallModal: React.FC<{ user: CHWUser | null; onClose: () => void }> = ({ user, onClose }) => (
  <Modal visible={!!user} transparent animationType="fade" onRequestClose={onClose}>
    <View style={m.overlay}>
      <View style={m.sheet}>
        <Text style={m.title}>📞 Call Patient</Text>
        {user && <>
          <View style={m.avatarRow}>
            <View style={m.avatar}><Text style={m.avatarTxt}>{user.name.charAt(0)}</Text></View>
            <View>
              <Text style={m.name}>{user.name}</Text>
              <Text style={m.sub}>📍 {user.village} · Age {user.age}</Text>
            </View>
          </View>
          <View style={m.phoneBox}>
            <Text style={m.phoneLabel}>Mobile Number</Text>
            <Text style={m.phone}>{user.phone}</Text>
          </View>
        </>}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <Btn label="Close" bg={G.gray} onPress={onClose} />
          <Btn label="📞  Call Now" bg={G.mid} onPress={() => { onClose(); Alert.alert('Calling…', `Dialling ${user?.phone}`); }} />
        </View>
      </View>
    </View>
  </Modal>
);

// ─── MODAL: Log Visit ─────────────────────────────────────────────────────────
const LogVisitModal: React.FC<{ user: CHWUser | null; onSave: (log: VisitLog) => void; onClose: () => void }> = ({ user, onSave, onClose }) => {
  const [notes, setNotes] = useState('');
  const save = () => {
    if (!notes.trim()) { Alert.alert('Missing notes', 'Enter visit notes before saving.'); return; }
    onSave({ userId: user!.id, notes: notes.trim(), date: new Date().toLocaleDateString('en-IN') });
    setNotes('');
    onClose();
    Alert.alert('Visit Logged ✅', `Visit notes saved for ${user!.name}.`);
  };
  return (
    <Modal visible={!!user} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={m.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={m.sheet}>
          <Text style={m.title}>📝 Log Home Visit</Text>
          {user && <Text style={m.sub}>Patient: <Text style={{ fontWeight: '700', color: G.text }}>{user.name}</Text> — {user.village}</Text>}
          <Text style={[m.phoneLabel, { marginTop: 16 }]}>Visit Date</Text>
          <Text style={{ color: G.text, fontWeight: '700', marginBottom: 12 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          <Text style={m.phoneLabel}>Visit Notes *</Text>
          <TextInput style={[s.fieldInput, { height: 110, textAlignVertical: 'top', marginTop: 6 }]}
            placeholder="Describe the visit, observations, medications given…"
            placeholderTextColor={G.sub} value={notes} onChangeText={setNotes} multiline />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Btn label="Cancel" bg={G.gray} onPress={onClose} />
            <Btn label="💾  Save Visit" bg={G.mid} onPress={save} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  TAB 1 – DASHBOARD OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
interface DashboardTabProps {
  users: CHWUser[]; helpRequests: HelpRequest[]; sessions: number;
  onNavigate: (tab: TabKey) => void;
}
const DashboardTab: React.FC<DashboardTabProps> = ({ users, helpRequests, sessions, onNavigate }) => {
  const activeCount   = users.filter(u => u.status === 'active').length;
  const pendingCount  = helpRequests.length;
  const recentHelp    = [...helpRequests].sort((a, b) => b.raisedAt - a.raisedAt).slice(0, 5);
  const recentUsers   = [...users].sort((a, b) => b.registeredAt - a.registeredAt).slice(0, 5);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.welcomeCard}>
        <Text style={s.welcomeHi}>Good morning, Health Worker 👋</Text>
        <Text style={s.welcomeSub}>Here's your live community health snapshot</Text>
      </View>

      <Text style={s.sectionTitle}>Overview</Text>
      <View style={s.statGrid}>
        <StatCard icon="👥" value={users.length}  label="Total Users Registered" trend={`↑ ${users.filter(u => Date.now() - u.registeredAt < 604800000).length} this week`} trendUp={true}  onPress={() => onNavigate('users')} />
        <StatCard icon="✅" value={activeCount}   label="Active Users"           trend={`${Math.round(activeCount / users.length * 100)}% of total`} trendUp={true}  onPress={() => onNavigate('users')} />
        <StatCard icon="🆘" value={pendingCount}  label="Help Requests Pending"  trend={helpRequests.filter(r => r.urgent).length + ' urgent'} trendUp={pendingCount > 0 ? false : null} onPress={() => onNavigate('help')} />
        <StatCard icon="📢" value={sessions}      label="Awareness Sessions"     trend="→ programme ongoing" trendUp={null} />
      </View>

      <Text style={s.sectionTitle}>Recent Help Requests</Text>
      {recentHelp.length === 0
        ? <View style={s.emptyMini}><Text style={s.emptyTxt}>No pending requests 🎉</Text></View>
        : recentHelp.map(r => (
          <TouchableOpacity key={r.id} style={[s.miniCard, r.urgent && { borderLeftColor: G.red }]} activeOpacity={0.8} onPress={() => onNavigate('help')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={s.miniName}>{r.userName} {r.urgent && <Text style={{ color: G.red }}>🚨</Text>}</Text>
              <Text style={s.miniTime}>{r.timeRaised}</Text>
            </View>
            <Text style={s.miniSub} numberOfLines={1}>{r.issue}</Text>
          </TouchableOpacity>
        ))
      }

      <Text style={[s.sectionTitle, { marginTop: 16 }]}>Recent Registrations</Text>
      {recentUsers.map(u => (
        <TouchableOpacity key={u.id} style={s.miniCard} activeOpacity={0.8} onPress={() => onNavigate('users')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={s.miniAvatar}><Text style={{ color: G.dark, fontWeight: '800' }}>{u.name.charAt(0)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.miniName}>{u.name}</Text>
              <Text style={s.miniSub}>📍 {u.village} · Age {u.age}</Text>
            </View>
            <StatusBadge status={u.status} />
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  TAB 2 – MY USERS
// ─────────────────────────────────────────────────────────────────────────────
interface UsersTabProps {
  users: CHWUser[];
  onFlagRisk: (id: string) => void;
  onLogVisit: (user: CHWUser) => void;
  onCall: (user: CHWUser) => void;
}
const UsersTab: React.FC<UsersTabProps> = ({ users, onFlagRisk, onLogVisit, onCall }) => {
  const [search,  setSearch]  = useState('');
  const [village, setVillage] = useState('All');
  const [status,  setStatus]  = useState('All');

  const allVillages = ['All', ...Array.from(new Set(users.map(u => u.village)))];

  const filtered = users.filter(u => {
    const ms = u.name.toLowerCase().includes(search.toLowerCase());
    const mv = village === 'All' || u.village === village;
    const mst = status  === 'All' || u.status  === status;
    return ms && mv && mst;
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <TextInput style={s.searchInput} placeholder="🔍  Search by name…" placeholderTextColor={G.sub}
        value={search} onChangeText={setSearch} />

      <Text style={s.filterLabel}>Village</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {allVillages.map(v => (
          <TouchableOpacity key={v} onPress={() => setVillage(v)} style={[s.chip, village === v && s.chipActive]}>
            <Text style={[s.chipText, village === v && s.chipTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.filterLabel}>Status</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {STATUS_FILTERS.map(sf => (
          <TouchableOpacity key={sf} onPress={() => setStatus(sf)} style={[s.chip, status === sf && s.chipActive]}>
            <Text style={[s.chipText, status === sf && s.chipTextActive]}>
              {sf === 'never_opened' ? 'Never Opened' : sf.charAt(0).toUpperCase() + sf.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.sectionTitle}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</Text>
      {filtered.map(u => (
        <View key={u.id} style={[s.userCard, u.flagged && s.userCardFlagged]}>
          {u.flagged && <View style={s.flagBanner}><Text style={{ color: G.white, fontSize: 11, fontWeight: '800' }}>🚩 HIGH RISK FLAGGED</Text></View>}
          <View style={s.userCardTop}>
            <View style={[s.userAvatar, u.flagged && { backgroundColor: G.redPale }]}>
              <Text style={[s.userAvatarText, u.flagged && { color: G.red }]}>{u.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName}>{u.name}</Text>
              <Text style={s.userSub}>📍 {u.village}  ·  Age {u.age}</Text>
            </View>
            <RiskChip risk={u.risk} />
          </View>
          <View style={{ marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <StatusBadge status={u.status} />
          </View>
          {u.conditions !== 'None' && <Text style={s.userConditions}>⚕ {u.conditions}</Text>}
          <View style={s.actionRow}>
            <Btn small label="📞 Call"      bg={G.mid}   onPress={() => onCall(u)} />
            <Btn small label="📝 Log Visit" bg={G.light} onPress={() => onLogVisit(u)} />
            <Btn small label={u.flagged ? '🚩 Flagged' : '🚩 Flag Risk'}
              bg={u.flagged ? G.red : G.orange}
              onPress={() => {
                Alert.alert(u.flagged ? 'Remove Flag' : 'Flag as High Risk',
                  u.flagged ? `Remove high-risk flag from ${u.name}?` : `Mark ${u.name} as high-risk?`,
                  [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => onFlagRisk(u.id) }]);
              }} />
          </View>
        </View>
      ))}
      {filtered.length === 0 && (
        <View style={s.emptyState}><Text style={{ fontSize: 40 }}>🔍</Text><Text style={s.emptyText}>No users match these filters</Text></View>
      )}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  TAB 3 – REGISTER NEW USER
// ─────────────────────────────────────────────────────────────────────────────
interface RegisterTabProps { onRegister: (u: CHWUser) => void }
const RegisterTab: React.FC<RegisterTabProps> = ({ onRegister }) => {
  const [form, setForm] = useState({ name: '', age: '', village: '', phone: '', conditions: '' });
  const [showQR,   setShowQR]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const upd = (f: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const validate = () => {
    if (!form.name.trim() || !form.age.trim() || !form.village.trim() || !form.phone.trim()) {
      Alert.alert('Missing fields', 'Name, Age, Village and Phone are required.'); return false;
    }
    const age = parseInt(form.age, 10);
    if (isNaN(age) || age < 1 || age > 120) {
      Alert.alert('Invalid age', 'Please enter a valid age between 1 and 120.'); return false;
    }
    if (!/^\d{10}$/.test(form.phone.trim())) {
      Alert.alert('Invalid phone', 'Phone number must be exactly 10 digits.'); return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      const newUser: CHWUser = {
        id: uid(), name: form.name.trim(), age: parseInt(form.age, 10),
        village: form.village.trim(), phone: form.phone.trim(),
        conditions: form.conditions.trim() || 'None',
        status: 'never_opened', risk: 'low',
        registeredAt: Date.now(),
      };
      onRegister(newUser);
      setForm({ name: '', age: '', village: '', phone: '', conditions: '' });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 900);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {success && (
        <View style={s.successBanner}>
          <Text style={{ color: G.white, fontWeight: '800', fontSize: 14 }}>✅ Patient registered successfully!</Text>
          <Text style={{ color: '#A5D6A7', fontSize: 11, marginTop: 2 }}>Visible in My Users tab now.</Text>
        </View>
      )}

      <View style={s.formCard}>
        <Text style={s.formTitle}>Register New Patient</Text>
        <Text style={s.formSub}>Fill in details to add a community member</Text>

        {([
          { label: 'Full Name *',      field: 'name'   as const, ph: 'e.g. Priya Sharma',          kb: 'default'   as const },
          { label: 'Age *',            field: 'age'    as const, ph: 'e.g. 34',                    kb: 'numeric'   as const },
          { label: 'Village *',        field: 'village'as const, ph: 'e.g. Koregaon',              kb: 'default'   as const },
          { label: 'Phone Number *',   field: 'phone'  as const, ph: '10-digit mobile number',     kb: 'phone-pad' as const },
        ]).map(f => (
          <View key={f.field} style={{ marginBottom: 14 }}>
            <Text style={s.fieldLabel}>{f.label}</Text>
            <TextInput style={s.fieldInput} placeholder={f.ph} placeholderTextColor={G.sub}
              value={form[f.field]} onChangeText={upd(f.field)} keyboardType={f.kb} />
          </View>
        ))}

        <View style={{ marginBottom: 20 }}>
          <Text style={s.fieldLabel}>Existing Health Conditions</Text>
          <TextInput style={[s.fieldInput, { height: 90, textAlignVertical: 'top' }]}
            placeholder="e.g. Diabetes, Hypertension (leave blank if none)"
            placeholderTextColor={G.sub} value={form.conditions} onChangeText={upd('conditions')} multiline />
        </View>

        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          <Text style={s.submitBtnText}>{loading ? 'Registering…' : '➕  Register Patient'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.qrCard}>
        <Text style={s.formTitle}>Share App via QR Code</Text>
        <Text style={s.formSub}>Let patients scan to install SmartCare</Text>
        <TouchableOpacity style={s.qrToggleBtn} onPress={() => setShowQR(p => !p)} activeOpacity={0.8}>
          <Text style={s.qrToggleText}>{showQR ? '▲  Hide QR Code' : '▼  Generate QR Code'}</Text>
        </TouchableOpacity>
        {showQR && (
          <View style={{ marginTop: 16 }}>
            <QRCodeMock />
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: G.dark, marginTop: 14 }]}
              onPress={() => Alert.alert('Share QR', 'Sharing feature coming soon.')} activeOpacity={0.8}>
              <Text style={s.submitBtnText}>📤  Share QR Code</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{ height: 28 }} />
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  TAB 4 – HELP REQUESTS & ALERTS
// ─────────────────────────────────────────────────────────────────────────────
interface HelpTabProps {
  requests: HelpRequest[];
  onResolve:  (id: string) => void;
  onEscalate: (id: string) => void;
}
const HelpTab: React.FC<HelpTabProps> = ({ requests, onResolve, onEscalate }) => {
  // Sorted: urgent first, then by time newest first
  const sorted = [...requests].sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return b.raisedAt - a.raisedAt;
  });
  const urgent   = sorted.filter(r => r.urgent && !r.escalated);
  const normal   = sorted.filter(r => !r.urgent && !r.escalated);
  const escalated = sorted.filter(r => r.escalated);

  const confirmResolve = (r: HelpRequest) =>
    Alert.alert('Mark Resolved', `Remove "${r.userName}"'s request?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Resolve', onPress: () => onResolve(r.id) },
    ]);

  const confirmEscalate = (r: HelpRequest) =>
    Alert.alert('Escalate to Supervisor', `Send ${r.userName}'s case to your supervisor?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Escalate', style: 'destructive', onPress: () => onEscalate(r.id) },
    ]);

  const renderCard = (r: HelpRequest) => (
    <View key={r.id} style={[s.helpCard, r.urgent && s.helpCardUrgent, r.escalated && s.helpCardEscalated]}>
      <View style={s.helpCardHeader}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {r.urgent    && <View style={s.urgentBadge}><Text style={{ color: G.white, fontSize: 10, fontWeight: '800' }}>URGENT</Text></View>}
          {r.escalated && <View style={[s.urgentBadge, { backgroundColor: G.orange }]}><Text style={{ color: G.white, fontSize: 10, fontWeight: '800' }}>ESCALATED</Text></View>}
        </View>
        <Text style={s.helpTime}>🕒 {r.timeRaised}</Text>
      </View>
      <Text style={s.helpName}>{r.userName}</Text>
      <Text style={s.helpVillage}>📍 {r.village}</Text>
      <Text style={s.helpIssue}>{r.issue}</Text>
      <View style={s.actionRow}>
        <Btn small label="✅ Resolved"  bg={G.mid}    onPress={() => confirmResolve(r)} />
        {!r.escalated && <Btn small label="⬆ Escalate" bg={r.urgent ? G.red : G.orange} onPress={() => confirmEscalate(r)} />}
      </View>
    </View>
  );

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={s.helpSummaryRow}>
        <View style={[s.helpSummaryChip, { backgroundColor: G.redPale }]}>
          <Text style={{ color: G.red, fontWeight: '800', fontSize: 18 }}>{urgent.length}</Text>
          <Text style={{ color: G.red, fontSize: 11, fontWeight: '600' }}>Urgent</Text>
        </View>
        <View style={[s.helpSummaryChip, { backgroundColor: G.pale }]}>
          <Text style={{ color: G.dark, fontWeight: '800', fontSize: 18 }}>{normal.length}</Text>
          <Text style={{ color: G.dark, fontSize: 11, fontWeight: '600' }}>Normal</Text>
        </View>
        <View style={[s.helpSummaryChip, { backgroundColor: G.orangePale }]}>
          <Text style={{ color: G.orange, fontWeight: '800', fontSize: 18 }}>{escalated.length}</Text>
          <Text style={{ color: G.orange, fontSize: 11, fontWeight: '600' }}>Escalated</Text>
        </View>
      </View>

      {urgent.length > 0 && <Text style={[s.sectionTitle, { color: G.red }]}>🚨 Urgent Requests</Text>}
      {urgent.map(renderCard)}

      {normal.length > 0 && <Text style={s.sectionTitle}>📋 Other Requests</Text>}
      {normal.map(renderCard)}

      {escalated.length > 0 && <Text style={[s.sectionTitle, { color: G.orange }]}>⬆ Escalated to Supervisor</Text>}
      {escalated.map(renderCard)}

      {requests.length === 0 && (
        <View style={s.emptyState}><Text style={{ fontSize: 48 }}>🎉</Text><Text style={s.emptyText}>All clear — no pending requests!</Text></View>
      )}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT SCREEN – lifts all shared state
// ─────────────────────────────────────────────────────────────────────────────
type TabKey = 'dashboard' | 'users' | 'register' | 'help';
const TABS: Array<{ key: TabKey; icon: string; label: string }> = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'users',     icon: '👥', label: 'My Users'  },
  { key: 'register',  icon: '➕', label: 'Register'  },
  { key: 'help',      icon: '🆘', label: 'Help'      },
];

export const CHWDashboardScreen: React.FC = () => {
  const [activeTab,    setActiveTab]    = useState<TabKey>('dashboard');
  const [users,        setUsers]        = useState<CHWUser[]>(INIT_USERS);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(INIT_HELP);
  const [sessions]                      = useState(INIT_SESSIONS);
  const [visitLogs,    setVisitLogs]    = useState<VisitLog[]>([]);

  // Modals
  const [callUser,      setCallUser]      = useState<CHWUser | null>(null);
  const [logVisitUser,  setLogVisitUser]  = useState<CHWUser | null>(null);

  // ── Simulate a new help request arriving every 90 s ──────────────────────
  const MOCK_ALERTS: Omit<HelpRequest, 'id' | 'raisedAt' | 'timeRaised'>[] = [
    { userName: 'Anita More',    village: 'Wai',      issue: 'High fever for 2 days, no improvement', urgent: false },
    { userName: 'Suresh Raut',   village: 'Satara',   issue: 'Severe headache and vomiting',           urgent: true  },
    { userName: 'Kavita Jadhav', village: 'Koregaon', issue: 'Low blood pressure, feeling faint',      urgent: true  },
  ];
  const nextAlert = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      const mock = MOCK_ALERTS[nextAlert.current % MOCK_ALERTS.length];
      nextAlert.current++;
      const req: HelpRequest = { ...mock, id: uid(), raisedAt: Date.now(), timeRaised: 'just now' };
      setHelpRequests(prev => [req, ...prev]);
    }, 90000);
    return () => clearInterval(t);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleFlagRisk = (id: string) =>
    setUsers(prev => prev.map(u => u.id === id ? { ...u, flagged: !u.flagged, risk: u.flagged ? u.risk : 'high' } : u));

  const handleRegister = (u: CHWUser) => setUsers(prev => [u, ...prev]);

  const handleResolve  = (id: string) => setHelpRequests(prev => prev.filter(r => r.id !== id));

  const handleEscalate = (id: string) => {
    setHelpRequests(prev => prev.map(r => r.id === id ? { ...r, escalated: true } : r));
    Alert.alert('Escalated ✅', 'Your supervisor has been notified.');
  };

  const handleLogVisit = (log: VisitLog) => setVisitLogs(prev => [log, ...prev]);

  // ── Badge count for Help tab ──────────────────────────────────────────────
  const pendingCount = helpRequests.filter(r => !r.escalated).length;

  return (
    <View style={{ flex: 1, backgroundColor: G.bg }}>
      {/* Modals */}
      <CallModal     user={callUser}     onClose={() => setCallUser(null)} />
      <LogVisitModal user={logVisitUser} onSave={handleLogVisit} onClose={() => setLogVisitUser(null)} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>SmartCare CHW</Text>
          <Text style={s.headerSub}>Community Health Worker Portal</Text>
        </View>
        <LogoutButton />
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const badge  = tab.key === 'help' && pendingCount > 0 ? pendingCount : 0;
          return (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} style={[s.tabItem, active && s.tabItemActive]}>
              <View>
                <Text style={{ fontSize: 18 }}>{tab.icon}</Text>
                {badge > 0 && <View style={s.badge}><Text style={s.badgeTxt}>{badge}</Text></View>}
              </View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
        {activeTab === 'dashboard' && (
          <DashboardTab users={users} helpRequests={helpRequests} sessions={sessions} onNavigate={setActiveTab} />
        )}
        {activeTab === 'users' && (
          <UsersTab users={users} onFlagRisk={handleFlagRisk} onLogVisit={setLogVisitUser} onCall={setCallUser} />
        )}
        {activeTab === 'register' && (
          <RegisterTab onRegister={handleRegister} />
        )}
        {activeTab === 'help' && (
          <HelpTab requests={helpRequests} onResolve={handleResolve} onEscalate={handleEscalate} />
        )}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: { backgroundColor: G.dark, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: G.white },
  headerSub:   { fontSize: 11, color: '#A5D6A7', marginTop: 1 },

  tabBar:       { backgroundColor: G.mid, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: G.dark },
  tabItem:      { flex: 1, alignItems: 'center', paddingVertical: 8, gap: 2, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabItemActive:{ borderBottomColor: G.accent, backgroundColor: G.dark },
  tabLabel:     { fontSize: 10, color: '#A5D6A7', fontWeight: '600' },
  tabLabelActive:{ color: G.white },
  badge:        { position: 'absolute', top: -4, right: -8, backgroundColor: G.red, borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
  badgeTxt:     { color: G.white, fontSize: 9, fontWeight: '900' },

  welcomeCard:{ backgroundColor: G.dark, borderRadius: 14, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  welcomeHi:  { color: G.white, fontSize: 17, fontWeight: '800' },
  welcomeSub: { color: '#A5D6A7', fontSize: 12, marginTop: 4 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: G.text, marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  statGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard:     { width: (W - 44) / 2, backgroundColor: G.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderLeftWidth: 4, borderLeftColor: G.accent },
  statIconWrap: { width: 40, height: 40, backgroundColor: G.pale, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statIcon:     { fontSize: 20 },
  statValue:    { fontSize: 28, fontWeight: '900', color: G.dark },
  statLabel:    { fontSize: 12, color: G.sub, fontWeight: '600', marginTop: 2, lineHeight: 16 },
  statTrend:    { fontSize: 11, fontWeight: '700', marginTop: 6 },

  miniCard:   { backgroundColor: G.white, borderRadius: 10, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: G.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  miniAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: G.pale, justifyContent: 'center', alignItems: 'center' },
  miniName:   { fontSize: 13, fontWeight: '700', color: G.text },
  miniSub:    { fontSize: 11, color: G.sub, marginTop: 1 },
  miniTime:   { fontSize: 10, color: G.gray },
  emptyMini:  { paddingVertical: 12, paddingHorizontal: 14, backgroundColor: G.pale, borderRadius: 10, marginBottom: 8 },
  emptyTxt:   { color: G.sub, fontWeight: '600', fontSize: 13 },

  searchInput: { backgroundColor: G.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: G.text, borderWidth: 1, borderColor: G.border, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  filterLabel: { fontSize: 11, fontWeight: '700', color: G.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  chip:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: G.white, marginRight: 8, borderWidth: 1, borderColor: G.border },
  chipActive:  { backgroundColor: G.dark, borderColor: G.dark },
  chipText:    { fontSize: 12, color: G.text, fontWeight: '600' },
  chipTextActive: { color: G.white },

  userCard:        { backgroundColor: G.white, borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  userCardFlagged: { borderWidth: 1.5, borderColor: G.red, backgroundColor: '#FFFAFA' },
  flagBanner:      { backgroundColor: G.red, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  userCardTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  userAvatar:      { width: 44, height: 44, borderRadius: 22, backgroundColor: G.pale, justifyContent: 'center', alignItems: 'center' },
  userAvatarText:  { fontSize: 18, fontWeight: '800', color: G.dark },
  userName:        { fontSize: 15, fontWeight: '800', color: G.text },
  userSub:         { fontSize: 11, color: G.sub, marginTop: 2 },
  userConditions:  { fontSize: 11, color: G.orange, marginTop: 6, fontWeight: '600' },
  actionRow:       { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  emptyState:      { alignItems: 'center', paddingVertical: 40 },
  emptyText:       { color: G.sub, fontSize: 14, marginTop: 10, fontWeight: '600' },

  successBanner: { backgroundColor: G.dark, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6, elevation: 3 },
  formCard:      { backgroundColor: G.white, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  qrCard:        { backgroundColor: G.white, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  formTitle:     { fontSize: 16, fontWeight: '800', color: G.dark, marginBottom: 4 },
  formSub:       { fontSize: 12, color: G.sub, marginBottom: 18 },
  fieldLabel:    { fontSize: 12, fontWeight: '700', color: G.text, marginBottom: 6 },
  fieldInput:    { backgroundColor: G.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: G.text, borderWidth: 1, borderColor: G.border },
  submitBtn:     { backgroundColor: G.mid, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: G.white, fontSize: 15, fontWeight: '800' },
  qrToggleBtn:   { borderWidth: 1, borderColor: G.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  qrToggleText:  { color: G.dark, fontWeight: '700', fontSize: 13 },

  helpSummaryRow:     { flexDirection: 'row', gap: 12, marginBottom: 20 },
  helpSummaryChip:    { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center' },
  helpCard:           { backgroundColor: G.white, borderRadius: 14, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2, borderLeftWidth: 4, borderLeftColor: G.border },
  helpCardUrgent:     { backgroundColor: '#FFF5F5', borderLeftColor: G.red, shadowOpacity: 0.12 },
  helpCardEscalated:  { backgroundColor: '#FFF8F0', borderLeftColor: G.orange },
  helpCardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  urgentBadge:        { backgroundColor: G.red, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  helpTime:           { fontSize: 11, color: G.gray },
  helpName:           { fontSize: 15, fontWeight: '800', color: G.text },
  helpVillage:        { fontSize: 12, color: G.sub, marginTop: 2 },
  helpIssue:          { fontSize: 13, color: G.text, marginTop: 6, lineHeight: 20 },
});

// ─── Modal styles ─────────────────────────────────────────────────────────────
const m = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: G.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  title:     { fontSize: 18, fontWeight: '800', color: G.dark, marginBottom: 16 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar:    { width: 52, height: 52, borderRadius: 26, backgroundColor: G.pale, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { fontSize: 22, fontWeight: '800', color: G.dark },
  name:      { fontSize: 16, fontWeight: '800', color: G.text },
  sub:       { fontSize: 12, color: G.sub, marginTop: 2 },
  phoneBox:  { backgroundColor: G.pale, borderRadius: 12, padding: 16, alignItems: 'center' },
  phoneLabel:{ fontSize: 11, fontWeight: '700', color: G.sub, textTransform: 'uppercase', letterSpacing: 0.5 },
  phone:     { fontSize: 26, fontWeight: '900', color: G.dark, marginTop: 4, letterSpacing: 2 },
});
