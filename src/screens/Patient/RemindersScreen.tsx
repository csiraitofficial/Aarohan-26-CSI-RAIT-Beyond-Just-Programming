import React, { useState } from 'react';
import {
  Alert, Dimensions, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { usePatient } from '../../context/PatientContext';
import { theme } from '../../utils/theme';

const SW = Dimensions.get('window').width;
type Props = NativeStackScreenProps<PatientStackParamList, 'RemindersScreen'>;
type TabKey = 'medicines' | 'appointments' | 'checkups';
type FormType = 'medicine' | 'appointment' | 'checkup';

const SHADOW = {
  shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 }, elevation: 3,
};

/* ─── Static demo data types ─── */
interface ApptItem {
  id: string; doctorName: string; specialization: string;
  date: string; time: string; mode: 'online' | 'in-person';
  location: string; initials: string; color: string;
}
interface CheckItem {
  id: string; type: string; date: string; location: string;
  icon: string; status: 'pending' | 'completed';
}

const INIT_APPOINTMENTS: ApptItem[] = [
  { id: 'a1', doctorName: 'Dr. Anjali Sharma',  specialization: 'Cardiologist',       date: 'March 8, 2026',  time: '11:30 AM', mode: 'in-person', location: 'Apollo Hospital, Room 204',      initials: 'AS', color: '#7C3AED' },
  { id: 'a2', doctorName: 'Dr. Rajesh Mehta',   specialization: 'General Physician',  date: 'March 12, 2026', time: '10:00 AM', mode: 'online',    location: 'Video Call',                    initials: 'RM', color: '#0A84FF' },
  { id: 'a3', doctorName: 'Dr. Priya Nair',     specialization: 'Endocrinologist',    date: 'March 20, 2026', time: '03:00 PM', mode: 'in-person', location: 'Fortis Medical Center, Floor 3', initials: 'PN', color: '#16A34A' },
];
const INIT_CHECKUPS: CheckItem[] = [
  { id: 'c1', type: 'Blood Pressure Check',  date: 'March 10, 2026', location: 'Community Health Center',  icon: '🩺', status: 'pending'   },
  { id: 'c2', type: 'Blood Sugar Test',      date: 'March 14, 2026', location: 'Pathcare Lab, Sector 5',   icon: '🩸', status: 'pending'   },
  { id: 'c3', type: 'Chest X-Ray',           date: 'March 7, 2026',  location: 'City Diagnostic Center',   icon: '🫁', status: 'pending'   },
  { id: 'c4', type: 'Full Body Checkup',     date: 'Feb 20, 2026',   location: 'Apollo Hospital',          icon: '🏥', status: 'completed' },
];
const TODAY_EXTRA = [
  { id: 'e1', name: 'Vitamin D3',  dosage: '1 Tablet', time: '08:00 AM', taken: false, accent: '#7C3AED' },
  { id: 'e2', name: 'Metformin',   dosage: '500 mg',   time: '08:30 AM', taken: true,  accent: '#16A34A' },
];
const UPCOMING_EXTRA = [
  { id: 'u1', name: 'Atorvastatin', dosage: '10 mg',  time: '09:00 PM', accent: '#B45309' },
  { id: 'u2', name: 'Aspirin',      dosage: '75 mg',  time: '10:00 PM', accent: '#0A84FF' },
];

/* ─── Progress Ring (SVG) ─── */
const ProgressRing: React.FC<{ taken: number; total: number }> = ({ taken, total }) => {
  const SIZE = 80; const R = 32;
  const circ = 2 * Math.PI * R;
  const pct  = total > 0 ? taken / total : 0;
  const offset = circ - pct * circ;
  const color = taken === total && total > 0 ? '#16A34A' : theme.colors.primary;
  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={40} cy={40} r={R} stroke="#E5E7EB"   strokeWidth={7} fill="none" />
        <Circle cx={40} cy={40} r={R} stroke={color}     strokeWidth={7} fill="none"
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 40 40)" />
      </Svg>
      <Text style={{ fontSize: 18, fontWeight: '900', color: theme.colors.textPrimary }}>{taken}</Text>
      <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>/{total}</Text>
    </View>
  );
};

/* ─── Reusable Form Field ─── */
const FormField: React.FC<{ label: string; value: string; onChangeText: (t: string) => void; placeholder: string }> = ({ label, value, onChangeText, placeholder }) => (
  <View style={s.formField}>
    <Text style={s.formLabel}>{label}</Text>
    <TextInput
      style={s.formInput} value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor="#9CA3AF"
    />
  </View>
);

/* ─── Main Screen ─── */
export const RemindersScreen: React.FC<Props> = ({ navigation }) => {
  const { reminders, toggleReminder, deleteReminder, addReminder } = usePatient();

  const [activeTab,    setActiveTab]    = useState<TabKey>('medicines');
  const [appointments, setAppointments] = useState<ApptItem[]>(INIT_APPOINTMENTS);
  const [checkups,     setCheckups]     = useState<CheckItem[]>(INIT_CHECKUPS);
  const [showModal,    setShowModal]    = useState(false);
  const [formType,     setFormType]     = useState<FormType>('medicine');

  /* Form state */
  const [medName,          setMedName]          = useState('');
  const [medDosage,        setMedDosage]        = useState('');
  const [medTime,          setMedTime]          = useState('');
  const [medRepeat,        setMedRepeat]        = useState('');
  const [apptDoctor,       setApptDoctor]       = useState('');
  const [apptSpec,         setApptSpec]         = useState('');
  const [apptDate,         setApptDate]         = useState('');
  const [apptTime,         setApptTime]         = useState('');
  const [apptLocation,     setApptLocation]     = useState('');
  const [checkupType,      setCheckupType]      = useState('');
  const [checkupDate,      setCheckupDate]      = useState('');
  const [checkupLocation,  setCheckupLocation]  = useState('');

  /* Derived */
  const medReminders      = reminders.filter(r => r.type === 'medication');
  const followUpReminders = reminders.filter(r => r.type === 'follow-up');
  const aiCheckReminders  = reminders.filter(r => r.type === 'ai-check');
  const takenCount        = TODAY_EXTRA.filter(m => m.taken).length + medReminders.filter(r => !r.enabled).length;
  const totalMeds         = medReminders.length + TODAY_EXTRA.length + UPCOMING_EXTRA.length;
  const pendingCheckups   = checkups.filter(c => c.status === 'pending');
  const doneCheckups      = checkups.filter(c => c.status === 'completed');
  const nextAppt          = appointments[0];
  const takenPct          = totalMeds > 0 ? Math.round((takenCount / totalMeds) * 100) : 0;
  const checkupDonePct    = checkups.length > 0 ? Math.round((doneCheckups.length / checkups.length) * 100) : 0;

  const TABS: Array<{ key: TabKey; label: string; icon: string; count: number }> = [
    { key: 'medicines',    label: 'Medicines',     icon: '💊', count: totalMeds                },
    { key: 'appointments', label: 'Appointments',  icon: '🩺', count: appointments.length      },
    { key: 'checkups',     label: 'Checkups',      icon: '🔬', count: pendingCheckups.length   },
  ];

  const confirmDelete = (id: string) =>
    Alert.alert('Delete Reminder', 'Remove this reminder?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReminder(id) },
    ]);

  const markCheckupDone = (id: string) =>
    setCheckups(cs => cs.map(c => c.id === id ? { ...c, status: 'completed' as const } : c));

  const resetForm = () => {
    setMedName(''); setMedDosage(''); setMedTime(''); setMedRepeat('');
    setApptDoctor(''); setApptSpec(''); setApptDate(''); setApptTime(''); setApptLocation('');
    setCheckupType(''); setCheckupDate(''); setCheckupLocation('');
  };

  const handleSave = () => {
    if (formType === 'medicine') {
      if (!medName || !medTime) { Alert.alert('Missing Info', 'Medicine name and time are required.'); return; }
      addReminder({ id: Date.now().toString(), title: `${medName}${medDosage ? ' · ' + medDosage : ''}`, type: 'medication', time: medTime, enabled: true });
    } else if (formType === 'appointment') {
      if (!apptDoctor || !apptDate || !apptTime) { Alert.alert('Missing Info', 'Doctor, date and time are required.'); return; }
      const initials = apptDoctor.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
      setAppointments(prev => [...prev, { id: Date.now().toString(), doctorName: apptDoctor, specialization: apptSpec || 'General', date: apptDate, time: apptTime, mode: 'in-person', location: apptLocation || 'TBD', initials, color: '#7C3AED' }]);
    } else {
      if (!checkupType || !checkupDate) { Alert.alert('Missing Info', 'Checkup type and date are required.'); return; }
      setCheckups(prev => [...prev, { id: Date.now().toString(), type: checkupType, date: checkupDate, location: checkupLocation || 'TBD', icon: '🔬', status: 'pending' }]);
    }
    resetForm();
    setShowModal(false);
  };

  return (
    <View style={s.root}>

      {/* ══════════════ HEADER ══════════════ */}
      <View style={s.header}>
        <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()} style={s.headerBtn} hitSlop={12}>
          <Text style={s.headerBack}>←</Text>
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Reminders</Text>
          <Text style={s.headerSub}>{reminders.filter(r => r.enabled).length} active alerts</Text>
        </View>
        <Pressable style={s.headerBtn} hitSlop={12}>
          <Text style={s.headerBell}>🔔</Text>
          <View style={s.bellDot} />
        </Pressable>
      </View>

      {/* ══════════════ SUMMARY STRIP ══════════════ */}
      <View style={s.summaryStrip}>
        <View style={[s.summaryCard, { borderTopColor: theme.colors.primary }]}>
          <Text style={s.summaryEmoji}>💊</Text>
          <Text style={s.summaryVal}>{takenCount}/{totalMeds}</Text>
          <Text style={s.summaryLbl}>Meds Today</Text>
        </View>
        <View style={[s.summaryCard, { borderTopColor: '#7C3AED' }]}>
          <Text style={s.summaryEmoji}>🩺</Text>
          <Text style={s.summaryVal}>Mar 8</Text>
          <Text style={s.summaryLbl}>Next Appt</Text>
        </View>
        <View style={[s.summaryCard, { borderTopColor: '#16A34A' }]}>
          <Text style={s.summaryEmoji}>🔬</Text>
          <Text style={s.summaryVal}>{pendingCheckups.length}</Text>
          <Text style={s.summaryLbl}>Due Checks</Text>
        </View>
        <View style={[s.summaryCard, { borderTopColor: '#DC2626' }]}>
          <Text style={s.summaryEmoji}>⚡</Text>
          <Text style={s.summaryVal}>{reminders.filter(r => r.enabled).length}</Text>
          <Text style={s.summaryLbl}>Active</Text>
        </View>
      </View>

      {/* ══════════════ TAB BAR ══════════════ */}
      <View style={s.tabBar}>
        {TABS.map(tab => (
          <Pressable key={tab.key} style={[s.tabItem, activeTab === tab.key && s.tabItemActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={s.tabIcon}>{tab.icon}</Text>
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            {tab.count > 0 && (
              <View style={[s.tabBadge, activeTab === tab.key && s.tabBadgeActive]}>
                <Text style={[s.tabBadgeTxt, activeTab === tab.key && s.tabBadgeTxtActive]}>{tab.count}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* ══════════════ CONTENT ══════════════ */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ─────────── MEDICINES TAB ─────────── */}
        {activeTab === 'medicines' && (
          <>
            {/* Daily Progress Card */}
            <View style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
              <ProgressRing taken={takenCount} total={totalMeds} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={s.progressTitle}>Today's Doses</Text>
                <Text style={s.progressSub}>{takenCount} taken · {totalMeds - takenCount} remaining</Text>
                <View style={s.progressBarBg}>
                  <View style={[s.progressBarFill, { width: `${takenPct}%` }]} />
                </View>
                <Text style={s.progressPct}>{takenPct}% Complete</Text>
              </View>
            </View>

            {/* Streak / Tips row */}
            <View style={s.tipsRow}>
              <View style={[s.tipChip, { backgroundColor: '#F0FDF4' }]}>
                <Text style={{ fontSize: 14 }}>🔥</Text>
                <Text style={[s.tipTxt, { color: '#15803D' }]}>3-day streak</Text>
              </View>
              <View style={[s.tipChip, { backgroundColor: '#EBF3FF' }]}>
                <Text style={{ fontSize: 14 }}>⏰</Text>
                <Text style={[s.tipTxt, { color: theme.colors.primary }]}>Next: 08:00 AM</Text>
              </View>
              <View style={[s.tipChip, { backgroundColor: '#FFFBEB' }]}>
                <Text style={{ fontSize: 14 }}>💡</Text>
                <Text style={[s.tipTxt, { color: '#B45309' }]}>Take with food</Text>
              </View>
            </View>

            {/* Today's medicines — from context */}
            <Text style={s.sectionTitle}>📅 Today's Medicines</Text>
            {medReminders.map(r => (
              <View key={r.id} style={[s.medCard, { borderLeftColor: r.enabled ? '#16A34A' : theme.colors.primary }]}>
                <View style={[s.medIconBox, { backgroundColor: r.enabled ? '#F0FDF4' : '#EBF3FF' }]}>
                  <Text style={{ fontSize: 22 }}>💊</Text>
                </View>
                <View style={s.medInfo}>
                  <Text style={s.medName}>{r.title}</Text>
                  <Text style={s.medMeta}>⏰ {r.time} · Tap switch to mark taken</Text>
                </View>
                <View style={s.medRight}>
                  <View style={[s.statusChip, { backgroundColor: r.enabled ? '#DCFCE7' : '#EBF3FF' }]}>
                    <Text style={[s.statusChipTxt, { color: r.enabled ? '#15803D' : theme.colors.primary }]}>
                      {r.enabled ? '✓ Taken' : '◎ Pending'}
                    </Text>
                  </View>
                  <Switch
                    value={r.enabled} onValueChange={() => toggleReminder(r.id)}
                    trackColor={{ false: '#E5E7EB', true: '#DCFCE7' }}
                    thumbColor={r.enabled ? '#16A34A' : '#9CA3AF'}
                    style={{ transform: [{ scale: 0.8 }] }}
                  />
                  <Pressable onPress={() => confirmDelete(r.id)} hitSlop={8}>
                    <Text style={{ fontSize: 16, color: '#D1D5DB' }}>🗑</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Extra sample today medicines */}
            {TODAY_EXTRA.map(m => (
              <View key={m.id} style={[s.medCard, { borderLeftColor: m.taken ? '#16A34A' : m.accent }]}>
                <View style={[s.medIconBox, { backgroundColor: m.taken ? '#F0FDF4' : '#EBF3FF' }]}>
                  <Text style={{ fontSize: 22 }}>💊</Text>
                </View>
                <View style={s.medInfo}>
                  <Text style={s.medName}>{m.name}</Text>
                  <Text style={s.medMeta}>{m.dosage} · ⏰ {m.time}</Text>
                </View>
                <View style={[s.statusChip, { backgroundColor: m.taken ? '#DCFCE7' : '#FEF9C3' }]}>
                  <Text style={[s.statusChipTxt, { color: m.taken ? '#15803D' : '#B45309' }]}>
                    {m.taken ? '✓ Taken' : 'Take Now'}
                  </Text>
                </View>
              </View>
            ))}

            {/* Upcoming medicines */}
            <Text style={[s.sectionTitle, { marginTop: 8 }]}>🕐 Upcoming — Later Today</Text>
            {UPCOMING_EXTRA.map(m => (
              <View key={m.id} style={[s.medCard, { borderLeftColor: m.accent }]}>
                <View style={[s.medIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <Text style={{ fontSize: 22 }}>💊</Text>
                </View>
                <View style={s.medInfo}>
                  <Text style={s.medName}>{m.name}</Text>
                  <Text style={s.medMeta}>{m.dosage} · ⏰ {m.time}</Text>
                </View>
                <View style={[s.statusChip, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[s.statusChipTxt, { color: '#D97706' }]}>Upcoming</Text>
                </View>
              </View>
            ))}

            {/* AI Health checks */}
            {aiCheckReminders.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 8 }]}>🤖 AI Health Checks</Text>
                {aiCheckReminders.map(r => (
                  <View key={r.id} style={[s.medCard, { borderLeftColor: '#7C3AED' }]}>
                    <View style={[s.medIconBox, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={{ fontSize: 22 }}>🤖</Text>
                    </View>
                    <View style={s.medInfo}>
                      <Text style={s.medName}>{r.title}</Text>
                      <Text style={s.medMeta}>⏰ {r.time} · Symptom check</Text>
                    </View>
                    <Switch
                      value={r.enabled} onValueChange={() => toggleReminder(r.id)}
                      trackColor={{ false: '#E5E7EB', true: '#EDE9FE' }}
                      thumbColor={r.enabled ? '#7C3AED' : '#9CA3AF'}
                      style={{ transform: [{ scale: 0.8 }] }}
                    />
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ─────────── APPOINTMENTS TAB ─────────── */}
        {activeTab === 'appointments' && (
          <>
            {/* Hero — next appointment */}
            {nextAppt && (
              <View style={[s.card, s.heroApptCard]}>
                <View style={s.heroApptBadgeRow}>
                  <View style={s.upNextBadge}>
                    <Text style={s.upNextTxt}>● UP NEXT</Text>
                  </View>
                  <View style={[s.modeBadge, { backgroundColor: nextAppt.mode === 'online' ? '#EBF3FF' : '#F0FDF4' }]}>
                    <Text style={[s.modeBadgeTxt, { color: nextAppt.mode === 'online' ? theme.colors.primary : '#15803D' }]}>
                      {nextAppt.mode === 'online' ? '📱 Online' : '🏥 In-Person'}
                    </Text>
                  </View>
                </View>
                <View style={s.heroApptTop}>
                  <View style={[s.apptAvatar, { backgroundColor: nextAppt.color }]}>
                    <Text style={s.apptAvatarTxt}>{nextAppt.initials}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={s.heroApptDoctor}>{nextAppt.doctorName}</Text>
                    <Text style={s.heroApptSpec}>{nextAppt.specialization}</Text>
                  </View>
                </View>
                <View style={s.heroApptMeta}>
                  <View style={s.heroMetaItem}><Text style={s.heroMetaIcon}>📅</Text><Text style={s.heroMetaTxt}>{nextAppt.date}</Text></View>
                  <View style={s.heroMetaItem}><Text style={s.heroMetaIcon}>⏰</Text><Text style={s.heroMetaTxt}>{nextAppt.time}</Text></View>
                  <View style={[s.heroMetaItem, { flex: 2 }]}><Text style={s.heroMetaIcon}>📍</Text><Text style={s.heroMetaTxt} numberOfLines={1}>{nextAppt.location}</Text></View>
                </View>
                <View style={s.heroApptBtns}>
                  <Pressable style={s.viewDetailBtn}>
                    <Text style={s.viewDetailTxt}>View Details</Text>
                  </Pressable>
                  {nextAppt.mode === 'online' ? (
                    <Pressable style={s.joinCallBtn}>
                      <Text style={s.joinCallTxt}>📹 Join Call</Text>
                    </Pressable>
                  ) : (
                    <Pressable style={s.joinCallBtn}>
                      <Text style={s.joinCallTxt}>🗺 Get Directions</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* All appointments list */}
            <Text style={s.sectionTitle}>📋 All Appointments</Text>
            {appointments.map((a, idx) => (
              <View key={a.id} style={[s.apptCard, idx === 0 && { borderWidth: 1.5, borderColor: a.color + '50' }]}>
                <View style={[s.apptAvatarSm, { backgroundColor: a.color }]}>
                  <Text style={s.apptAvatarSmTxt}>{a.initials}</Text>
                </View>
                <View style={s.apptInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.apptDoctor}>{a.doctorName}</Text>
                    {idx === 0 && <View style={s.nextTag}><Text style={s.nextTagTxt}>NEXT</Text></View>}
                  </View>
                  <Text style={s.apptSpec}>{a.specialization}</Text>
                  <View style={s.apptMetaRow}>
                    <Text style={s.apptMetaTxt}>📅 {a.date}</Text>
                    <Text style={s.apptDot}>·</Text>
                    <Text style={s.apptMetaTxt}>⏰ {a.time}</Text>
                  </View>
                  <Text style={s.apptLoc} numberOfLines={1}>📍 {a.location}</Text>
                </View>
                <View style={[s.modeBadgeSm, { backgroundColor: a.mode === 'online' ? '#EBF3FF' : '#F0FDF4' }]}>
                  <Text style={{ fontSize: 18 }}>{a.mode === 'online' ? '📱' : '🏥'}</Text>
                </View>
              </View>
            ))}

            {/* Follow-up reminders from context */}
            {followUpReminders.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 8 }]}>📞 Follow-up Reminders</Text>
                {followUpReminders.map(r => (
                  <View key={r.id} style={[s.medCard, { borderLeftColor: '#7C3AED' }]}>
                    <View style={[s.medIconBox, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={{ fontSize: 22 }}>🩺</Text>
                    </View>
                    <View style={s.medInfo}>
                      <Text style={s.medName}>{r.title}</Text>
                      <Text style={s.medMeta}>⏰ {r.time}</Text>
                    </View>
                    <Switch
                      value={r.enabled} onValueChange={() => toggleReminder(r.id)}
                      trackColor={{ false: '#E5E7EB', true: '#EDE9FE' }}
                      thumbColor={r.enabled ? '#7C3AED' : '#9CA3AF'}
                      style={{ transform: [{ scale: 0.8 }] }}
                    />
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* ─────────── CHECKUPS TAB ─────────── */}
        {activeTab === 'checkups' && (
          <>
            {/* Progress summary card */}
            <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 16 }]}>
              <View style={s.checkupRing}>
                <Text style={s.checkupRingNum}>{doneCheckups.length}</Text>
                <Text style={s.checkupRingLbl}>Done</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.textPrimary }}>Health Checkups</Text>
                  <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: '700' }}>{pendingCheckups.length} pending</Text>
                </View>
                <View style={s.checkupBarBg}>
                  <View style={[s.checkupBarFill, { width: `${checkupDonePct}%` }]} />
                </View>
                <Text style={{ fontSize: 11, color: '#16A34A', fontWeight: '600', marginTop: 4 }}>
                  {checkupDonePct}% completed this month
                </Text>
              </View>
            </View>

            {/* Health score card */}
            <View style={[s.card, { backgroundColor: '#EBF3FF', borderWidth: 1, borderColor: '#BFDBFE' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 36 }}>💙</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '900', color: theme.colors.primary }}>Health Score: 78/100</Text>
                  <Text style={{ fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 }}>
                    Complete your pending checkups to improve your score
                  </Text>
                </View>
              </View>
            </View>

            {/* Pending checkups */}
            <Text style={s.sectionTitle}>⏳ Upcoming Checkups</Text>
            {pendingCheckups.map(c => (
              <View key={c.id} style={s.checkupCard}>
                <View style={s.checkupIconBox}>
                  <Text style={{ fontSize: 24 }}>{c.icon}</Text>
                </View>
                <View style={s.checkupInfo}>
                  <Text style={s.checkupType}>{c.type}</Text>
                  <Text style={s.checkupMeta}>📅 {c.date}</Text>
                  <Text style={s.checkupLoc}>📍 {c.location}</Text>
                </View>
                <View style={s.checkupActions}>
                  <Pressable style={s.markDoneBtn} onPress={() => markCheckupDone(c.id)}>
                    <Text style={s.markDoneTxt}>✓ Done</Text>
                  </Pressable>
                  <Pressable style={s.remapBtn}>
                    <Text style={s.remapTxt}>📅</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Completed checkups */}
            {doneCheckups.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 8 }]}>✅ Completed</Text>
                {doneCheckups.map(c => (
                  <View key={c.id} style={[s.checkupCard, { opacity: 0.65 }]}>
                    <View style={[s.checkupIconBox, { backgroundColor: '#F0FDF4' }]}>
                      <Text style={{ fontSize: 24 }}>{c.icon}</Text>
                    </View>
                    <View style={s.checkupInfo}>
                      <Text style={s.checkupType}>{c.type}</Text>
                      <Text style={s.checkupMeta}>📅 {c.date}</Text>
                      <Text style={s.checkupLoc}>📍 {c.location}</Text>
                    </View>
                    <View style={s.doneBadge}>
                      <Text style={s.doneBadgeTxt}>✓ Done</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ══════════════ FAB ══════════════ */}
      <Pressable style={s.fab} onPress={() => setShowModal(true)}>
        <Text style={s.fabTxt}>＋</Text>
      </Pressable>

      {/* ══════════════ ADD REMINDER MODAL ══════════════ */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={s.modalOverlay} onPress={() => setShowModal(false)} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeaderRow}>
              <Text style={s.modalTitle}>Add Reminder</Text>
              <Pressable onPress={() => setShowModal(false)} hitSlop={12}>
                <Text style={{ fontSize: 22, color: theme.colors.textSecondary }}>✕</Text>
              </Pressable>
            </View>

            {/* Form type selector */}
            <View style={s.formTypeSel}>
              {(['medicine', 'appointment', 'checkup'] as FormType[]).map(ft => (
                <Pressable key={ft} style={[s.formTypeBtn, formType === ft && s.formTypeBtnActive]} onPress={() => setFormType(ft)}>
                  <Text style={{ fontSize: 22 }}>{ft === 'medicine' ? '💊' : ft === 'appointment' ? '🩺' : '🔬'}</Text>
                  <Text style={[s.formTypeTxt, formType === ft && s.formTypeTxtActive]}>
                    {ft === 'medicine' ? 'Medicine' : ft === 'appointment' ? 'Appointment' : 'Checkup'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {formType === 'medicine' && (
                <>
                  <FormField label="Medicine Name *"  value={medName}    onChangeText={setMedName}    placeholder="e.g. Paracetamol" />
                  <FormField label="Dosage"           value={medDosage}  onChangeText={setMedDosage}  placeholder="e.g. 500 mg" />
                  <FormField label="Time *"           value={medTime}    onChangeText={setMedTime}    placeholder="e.g. 08:00 AM" />
                  <FormField label="Repeat Schedule"  value={medRepeat}  onChangeText={setMedRepeat}  placeholder="e.g. Daily, Twice a day" />
                </>
              )}
              {formType === 'appointment' && (
                <>
                  <FormField label="Doctor Name *"        value={apptDoctor}    onChangeText={setApptDoctor}    placeholder="e.g. Dr. Sharma" />
                  <FormField label="Specialization"       value={apptSpec}      onChangeText={setApptSpec}      placeholder="e.g. Cardiologist" />
                  <FormField label="Date *"               value={apptDate}      onChangeText={setApptDate}      placeholder="e.g. March 15, 2026" />
                  <FormField label="Time *"               value={apptTime}      onChangeText={setApptTime}      placeholder="e.g. 11:30 AM" />
                  <FormField label="Location / Online"    value={apptLocation}  onChangeText={setApptLocation}  placeholder="Hospital or 'Online'" />
                </>
              )}
              {formType === 'checkup' && (
                <>
                  <FormField label="Checkup Type *"  value={checkupType}      onChangeText={setCheckupType}      placeholder="e.g. Blood Pressure Check" />
                  <FormField label="Date *"          value={checkupDate}      onChangeText={setCheckupDate}      placeholder="e.g. March 20, 2026" />
                  <FormField label="Location"        value={checkupLocation}  onChangeText={setCheckupLocation}  placeholder="e.g. Community Health Center" />
                </>
              )}
              <Pressable style={s.saveBtn} onPress={handleSave}>
                <Text style={s.saveBtnTxt}>💾  Save Reminder</Text>
              </Pressable>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

/* ─── STYLESHEET ─── */
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: theme.colors.background },
  scrollContent:{ padding: 16, paddingBottom: 20 },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.primary, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20,
  },
  headerBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerBack:   { fontSize: 22, color: '#FFF', fontWeight: '700' },
  headerCenter: { alignItems: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
  headerSub:    { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  headerBell:   { fontSize: 22 },
  bellDot: {
    position: 'absolute', top: 0, right: 0,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: theme.colors.primary,
  },

  /* Summary strip */
  summaryStrip: {
    flexDirection: 'row', backgroundColor: theme.colors.surface,
    paddingHorizontal: 10, paddingVertical: 10, gap: 6,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  summaryCard: {
    flex: 1, backgroundColor: '#F8FAFF', borderRadius: 10, paddingVertical: 8,
    alignItems: 'center', borderTopWidth: 3, ...SHADOW,
  },
  summaryEmoji: { fontSize: 16, marginBottom: 2 },
  summaryVal:   { fontSize: 14, fontWeight: '900', color: theme.colors.textPrimary },
  summaryLbl:   { fontSize: 9,  color: theme.colors.textSecondary, marginTop: 1, fontWeight: '600' },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row', backgroundColor: theme.colors.surface,
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10, gap: 4,
    backgroundColor: '#F3F4F6',
  },
  tabItemActive:    { backgroundColor: theme.colors.primary },
  tabIcon:          { fontSize: 14 },
  tabLabel:         { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  tabLabelActive:   { color: '#FFF' },
  tabBadge:         { backgroundColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  tabBadgeActive:   { backgroundColor: 'rgba(255,255,255,0.3)' },
  tabBadgeTxt:      { fontSize: 10, fontWeight: '800', color: theme.colors.textSecondary },
  tabBadgeTxtActive:{ color: '#FFF' },

  /* Generic card */
  card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 14, ...SHADOW },

  /* Progress bar */
  progressTitle:    { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 4 },
  progressSub:      { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8 },
  progressBarBg:    { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressBarFill:  { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
  progressPct:      { fontSize: 11, color: theme.colors.primary, fontWeight: '700', marginTop: 4 },

  /* Tips row */
  tipsRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tipChip:   { flex: 1, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  tipTxt:    { fontSize: 10, fontWeight: '700' },

  /* Section title */
  sectionTitle: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10, marginTop: 4, paddingLeft: 2 },

  /* Medicine card */
  medCard: {
    backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14,
    marginBottom: 10, borderLeftWidth: 4,
    flexDirection: 'row', alignItems: 'center', gap: 0, ...SHADOW,
  },
  medIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  medInfo:    { flex: 1 },
  medName:    { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  medMeta:    { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  medRight:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusChip: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusChipTxt: { fontSize: 11, fontWeight: '700' },

  /* Hero appointment card */
  heroApptCard:     { marginBottom: 14 },
  heroApptBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  upNextBadge:      { backgroundColor: '#FEF9C3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  upNextTxt:        { fontSize: 11, fontWeight: '800', color: '#B45309', letterSpacing: 0.5 },
  modeBadge:        { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  modeBadgeTxt:     { fontSize: 11, fontWeight: '700' },
  heroApptTop:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  apptAvatar:       { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  apptAvatarTxt:    { color: '#FFF', fontSize: 18, fontWeight: '900' },
  heroApptDoctor:   { fontSize: 17, fontWeight: '900', color: theme.colors.textPrimary },
  heroApptSpec:     { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  heroApptMeta:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  heroMetaItem:     { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  heroMetaIcon:     { fontSize: 13 },
  heroMetaTxt:      { fontSize: 12, color: theme.colors.textPrimary, fontWeight: '600', flex: 1 },
  heroApptBtns:     { flexDirection: 'row', gap: 10 },
  viewDetailBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 11, borderWidth: 1.5,
    borderColor: theme.colors.primary, alignItems: 'center',
  },
  viewDetailTxt:{ color: theme.colors.primary, fontWeight: '800', fontSize: 13 },
  joinCallBtn:  { flex: 1, borderRadius: 10, paddingVertical: 11, backgroundColor: theme.colors.primary, alignItems: 'center' },
  joinCallTxt:  { color: '#FFF', fontWeight: '800', fontSize: 13 },

  /* Small appointment card */
  apptCard:      { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', ...SHADOW },
  apptAvatarSm:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  apptAvatarSmTxt:{ color: '#FFF', fontSize: 14, fontWeight: '900' },
  apptInfo:      { flex: 1 },
  apptDoctor:    { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  apptSpec:      { fontSize: 11, color: theme.colors.textSecondary, marginTop: 1 },
  apptMetaRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  apptMetaTxt:   { fontSize: 11, color: theme.colors.textSecondary },
  apptDot:       { color: theme.colors.textSecondary },
  apptLoc:       { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  nextTag:       { backgroundColor: '#EBF3FF', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  nextTagTxt:    { fontSize: 9, fontWeight: '900', color: theme.colors.primary, letterSpacing: 0.5 },
  modeBadgeSm:   { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  /* Checkup cards */
  checkupRing:    { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#86EFAC' },
  checkupRingNum: { fontSize: 20, fontWeight: '900', color: '#15803D' },
  checkupRingLbl: { fontSize: 9, color: '#16A34A', fontWeight: '700' },
  checkupBarBg:   { height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  checkupBarFill: { height: 6, backgroundColor: '#16A34A', borderRadius: 3 },
  checkupCard:    { backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', ...SHADOW },
  checkupIconBox: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkupInfo:    { flex: 1 },
  checkupType:    { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  checkupMeta:    { fontSize: 12, color: theme.colors.textSecondary, marginTop: 3 },
  checkupLoc:     { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  checkupActions: { flexDirection: 'column', gap: 6, alignItems: 'center' },
  markDoneBtn:    { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#86EFAC' },
  markDoneTxt:    { fontSize: 11, color: '#15803D', fontWeight: '800' },
  remapBtn:       { backgroundColor: '#EBF3FF', borderRadius: 8, width: 30, height: 28, alignItems: 'center', justifyContent: 'center' },
  remapTxt:       { fontSize: 14 },
  doneBadge:      { backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  doneBadgeTxt:   { fontSize: 11, fontWeight: '800', color: '#15803D' },

  /* FAB */
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: theme.colors.primary, shadowOpacity: 0.45, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  fabTxt: { fontSize: 30, color: '#FFF', fontWeight: '300', marginTop: -2 },

  /* Modal */
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:     { backgroundColor: theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '82%' },
  modalHandle:    { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:     { fontSize: 18, fontWeight: '900', color: theme.colors.textPrimary },
  formTypeSel:    { flexDirection: 'row', gap: 8, marginBottom: 20 },
  formTypeBtn:    { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F3F4F6', gap: 4 },
  formTypeBtnActive:{ backgroundColor: theme.colors.primary },
  formTypeTxt:    { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  formTypeTxtActive:{ color: '#FFF' },

  /* Form fields */
  formField:  { marginBottom: 14 },
  formLabel:  { fontSize: 12, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 6 },
  formInput:  {
    backgroundColor: '#F8FAFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: theme.colors.textPrimary, borderWidth: 1, borderColor: theme.colors.border,
  },
  saveBtn:    { backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveBtnTxt: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
});
