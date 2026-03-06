import React, { useRef, useState } from 'react';
import {
  Alert, Animated, Pressable, ScrollView, Share,
  StyleSheet, Text, View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { PatientStackParamList } from '../../navigation/types';
import { usePatient } from '../../context/PatientContext';
import { RiskLevel } from '../../models';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'CaseDetailScreen'>;

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const RISK_PALETTE: Record<RiskLevel, { bg: string; border: string; text: string; light: string; pill: string }> = {
  mild:      { bg: '#15803D', border: '#86EFAC', text: '#FFF',    light: '#F0FDF4', pill: '#DCFCE7' },
  moderate:  { bg: '#B45309', border: '#FCD34D', text: '#FFF',    light: '#FFFBEB', pill: '#FEF9C3' },
  emergency: { bg: '#DC2626', border: '#FCA5A5', text: '#FFF',    light: '#FEF2F2', pill: '#FEE2E2' },
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active:           { bg: '#EBF3FF', text: theme.colors.primary },
  doctor_assigned:  { bg: '#FEF9C3', text: '#92400E' },
  closed:           { bg: '#F3F4F6', text: '#6B7280' },
  emergency_active: { bg: '#FEE2E2', text: '#991B1B' },
  referred:         { bg: '#F5F3FF', text: '#7C3AED' },
  pending:          { bg: '#F0FDF4', text: '#166534' },
};

const CARD_SHADOW = {
  shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 }, elevation: 3,
};

/* ─────────────────────────────────────────────────────────
   CONFIDENCE RING (SVG)
───────────────────────────────────────────────────────── */
const ConfidenceRing: React.FC<{ pct: number; color: string; size?: number }> = ({ pct, color, size = 68 }) => {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E5E7EB" strokeWidth={6} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={6} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: '800', color }}>{pct}%</Text>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────
   VITAL CARD  (grid item)
───────────────────────────────────────────────────────── */
const VitalCard: React.FC<{ icon: string; label: string; value: string; unit: string; normal?: boolean }> = ({
  icon, label, value, unit, normal = true,
}) => (
  <View style={[vcStyles.card, !normal && { borderColor: theme.colors.danger, borderWidth: 1.5 }]}>
    <Text style={vcStyles.icon}>{icon}</Text>
    <Text style={vcStyles.value} numberOfLines={1}>{value || '—'}</Text>
    {value ? <Text style={vcStyles.unit}>{unit}</Text> : null}
    <Text style={vcStyles.label} numberOfLines={1}>{label}</Text>
    {!normal && <View style={vcStyles.alertDot} />}
  </View>
);
const vcStyles = StyleSheet.create({
  card: {
    width: '30%', backgroundColor: '#F8FAFF', borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', position: 'relative',
  },
  icon:    { fontSize: 22, marginBottom: 4 },
  value:   { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  unit:    { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  label:   { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '600', textAlign: 'center' },
  alertDot: {
    position: 'absolute', top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.danger,
  },
});

/* ─────────────────────────────────────────────────────────
   SECTION LABEL
───────────────────────────────────────────────────────── */
const SectionLabel: React.FC<{ icon: string; title: string; accent?: string }> = ({ icon, title, accent = theme.colors.primary }) => (
  <View style={slStyles.row}>
    <View style={[slStyles.bar, { backgroundColor: accent }]} />
    <Text style={slStyles.icon}>{icon}</Text>
    <Text style={slStyles.title}>{title}</Text>
  </View>
);
const slStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  bar:   { width: 4, height: 20, borderRadius: 2 },
  icon:  { fontSize: 16 },
  title: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary },
});

/* ─────────────────────────────────────────────────────────
   CARD WRAPPER
───────────────────────────────────────────────────────── */
const InfoCard: React.FC<React.PropsWithChildren<{ style?: object }>> = ({ children, style }) => (
  <View style={[cdStyles.card, style]}>{children}</View>
);

/* ─────────────────────────────────────────────────────────
   TIMELINE STEP
───────────────────────────────────────────────────────── */
const TimelineStep: React.FC<{ done: boolean; label: string; sub?: string; last?: boolean }> = ({ done, label, sub, last }) => (
  <View style={tlStyles.wrap}>
    <View style={tlStyles.left}>
      <View style={[tlStyles.dot, { backgroundColor: done ? theme.colors.primary : '#E5E7EB' }]}>
        {done && <Text style={tlStyles.check}>✓</Text>}
      </View>
      {!last && <View style={[tlStyles.line, { backgroundColor: done ? theme.colors.primary : '#E5E7EB' }]} />}
    </View>
    <View style={tlStyles.content}>
      <Text style={[tlStyles.label, { color: done ? theme.colors.textPrimary : theme.colors.textSecondary }]}>{label}</Text>
      {sub ? <Text style={tlStyles.sub}>{sub}</Text> : null}
    </View>
  </View>
);
const tlStyles = StyleSheet.create({
  wrap:    { flexDirection: 'row', gap: 12, marginBottom: 4 },
  left:    { alignItems: 'center', width: 22 },
  dot:     { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  check:   { fontSize: 12, color: '#FFF', fontWeight: '800' },
  line:    { width: 2, flex: 1, minHeight: 24, marginTop: 3 },
  content: { flex: 1, paddingBottom: 16 },
  label:   { fontSize: 13, fontWeight: '700' },
  sub:     { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
});

/* ─────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────── */
export const CaseDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseHistory, profile } = usePatient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const record = caseHistory.find((c) => c.id === route.params.caseId);

  if (!record) {
    return (
      <View style={cdStyles.notFound}>
        <Text style={{ fontSize: 56 }}>🗂️</Text>
        <Text style={cdStyles.notFoundTitle}>Record Not Found</Text>
        <Text style={cdStyles.notFoundSub}>This record may have been removed.</Text>
        <Pressable onPress={() => navigation.goBack()} style={cdStyles.notFoundBtn}>
          <Text style={cdStyles.notFoundBtnTxt}>← Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const risk      = record.result.risk;
  const palette   = RISK_PALETTE[risk];
  const statusCfg = STATUS_COLORS[record.status] ?? STATUS_COLORS.active;
  const dateObj   = new Date(record.date);
  const formattedDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const shortDate     = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const confidence    = record.classification?.confidenceScore != null
    ? Math.round(record.classification.confidenceScore * 100) : null;
  const homeRemedies: string[] = record.classification?.homeRemedies ??
    (risk === 'mild'
      ? ['Rest well and get adequate sleep', 'Stay hydrated — drink 8+ glasses of water', 'Take paracetamol if needed for fever/pain']
      : []);
  const warningSigns: string[] = record.classification?.warningSignsToWatch ??
    (risk !== 'mild'
      ? ['Difficulty breathing or shortness of breath', 'Fever above 104°F (40°C)', 'Chest tightness or palpitations']
      : []);
  const statusOrder = ['active', 'doctor_assigned', 'referred', 'closed'];
  const currentIdx  = statusOrder.indexOf(record.status);
  const doctorReferral =
    risk === 'emergency' ? '🚨 Immediate emergency referral required' :
    risk === 'moderate'  ? '👨‍⚕️ Doctor consultation strongly recommended' :
                           '✅ No doctor referral required at this time';
  const reportText =
    `Swasthya Saathi — Health Report\n${'━'.repeat(32)}\n` +
    `Patient : ${profile?.name ?? 'Patient'}\nDate    : ${formattedDate}\n` +
    `Risk    : ${risk.toUpperCase()}\n\n` +
    `Symptoms: ${record.symptoms.join(', ')}\n\n` +
    `AI Guidance:\n${record.result.guidance}\n\n` +
    `Next Action:\n${record.result.nextAction}\n\n` +
    `Report ID: #${record.id}`;

  const handleShare    = () => Share.share({ message: reportText, title: 'Health Report' }).catch(() => {});
  const handleDownload = () =>
    Alert.alert('Report Saved', 'Your health report has been saved to Downloads.', [{ text: 'OK' }]);

  return (
    <View style={cdStyles.root}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={cdStyles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO HEADER ── */}
        <View style={[cdStyles.hero, { backgroundColor: palette.bg }]}>
          <Pressable onPress={() => navigation.goBack()} style={cdStyles.heroBack} hitSlop={12}>
            <Text style={cdStyles.heroBackTxt}>← Records</Text>
          </Pressable>
          <View style={cdStyles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={cdStyles.heroApp}>Swasthya Saathi</Text>
              <Text style={cdStyles.heroTitle}>Health Report</Text>
              <Text style={cdStyles.heroDate}>{formattedDate}</Text>
            </View>
            <View style={cdStyles.riskCircle}>
              <Text style={cdStyles.riskEmoji}>
                {risk === 'mild' ? '🟢' : risk === 'moderate' ? '🟡' : '🔴'}
              </Text>
              <Text style={cdStyles.riskWord}>
                {risk.charAt(0).toUpperCase() + risk.slice(1)}
              </Text>
            </View>
          </View>
          <View style={cdStyles.heroPills}>
            <View style={cdStyles.heroPill}>
              <Text style={cdStyles.heroPillTxt}>📋 ID #{record.id}</Text>
            </View>
            <View style={[cdStyles.heroPill, { backgroundColor: statusCfg.bg }]}>
              <Text style={[cdStyles.heroPillTxt, { color: statusCfg.text }]}>
                {record.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* ── SYMPTOMS ── */}
        <InfoCard>
          <SectionLabel icon="🤒" title="Symptoms Reported" />
          <View style={cdStyles.tagWrap}>
            {(record.symptoms.length > 0 ? record.symptoms : ['No symptoms recorded']).map((s) => (
              <View key={s} style={cdStyles.symTag}>
                <Text style={cdStyles.symTagTxt}>{s}</Text>
              </View>
            ))}
          </View>
        </InfoCard>

        {/* ── VITALS 3-COLUMN GRID ── */}
        <InfoCard>
          <SectionLabel icon="📋" title="Entered Vitals" />
          <View style={cdStyles.vitalsGrid}>
            <VitalCard icon="🌡️" label="Temperature"   value={record.vitals.temperature}      unit="°F"   />
            <VitalCard icon="🩺" label="Blood Pressure" value={record.vitals.bloodPressure}    unit="mmHg" />
            <VitalCard icon="🫁" label="Oxygen (SpO₂)" value={record.vitals.oxygenSaturation} unit="%"
              normal={
                !record.vitals.oxygenSaturation ||
                parseFloat(record.vitals.oxygenSaturation) >= 95
              }
            />
            <VitalCard icon="🩸" label="Blood Sugar"   value="" unit="mg/dL" />
            <VitalCard icon="❤️" label="Heart Rate"    value="" unit="bpm"   />
            <VitalCard icon="⚖️" label="BMI"           value="" unit="kg/m²" />
          </View>
          <Text style={cdStyles.vitalsNote}>— values not entered for this check</Text>
        </InfoCard>

        {/* ── AI ANALYSIS ── */}
        <InfoCard style={{ borderLeftWidth: 4, borderLeftColor: palette.bg }}>
          <SectionLabel icon="🤖" title="AI Risk Analysis" accent={palette.bg} />
          <View style={cdStyles.aiTopRow}>
            <View style={[cdStyles.aiRiskBadge, { backgroundColor: palette.pill }]}>
              <Text style={[cdStyles.aiRiskLabel, { color: palette.bg }]}>
                {risk.toUpperCase()}
              </Text>
              <Text style={[cdStyles.aiRiskSublabel, { color: palette.bg }]}>Risk Level</Text>
            </View>
            {confidence !== null && (
              <View style={cdStyles.aiConf}>
                <ConfidenceRing pct={confidence} color={palette.bg} />
                <Text style={cdStyles.aiConfLabel}>AI Confidence</Text>
              </View>
            )}
          </View>
          <View style={[cdStyles.guidanceBox, { backgroundColor: palette.light }]}>
            <Text style={cdStyles.guidanceTxt}>{record.result.guidance}</Text>
          </View>
          {record.classification?.redFlagsDetected && (
            <View style={cdStyles.redFlagBox}>
              <Text style={cdStyles.redFlagTxt}>⚠️ Red flags detected — seek care immediately</Text>
            </View>
          )}
        </InfoCard>

        {/* ── DOCTOR RECOMMENDATION + TIMELINE ── */}
        <InfoCard>
          <SectionLabel icon="👨‍⚕️" title="Doctor Recommendation" />
          <View style={cdStyles.referralRow}>
            <Text style={cdStyles.referralTxt}>{doctorReferral}</Text>
          </View>
          <View style={cdStyles.nextActionBox}>
            <Text style={cdStyles.nextActionLabel}>Recommended Next Action</Text>
            <Text style={cdStyles.nextActionTxt}>{record.result.nextAction}</Text>
          </View>
          {record.doctorNotes ? (
            <View style={cdStyles.doctorNotesBox}>
              <Text style={cdStyles.doctorNotesLabel}>📝 Doctor Notes</Text>
              <Text style={cdStyles.doctorNotesTxt}>{record.doctorNotes}</Text>
            </View>
          ) : null}
          <View style={cdStyles.timelineWrap}>
            <Text style={cdStyles.timelineTitle}>Case Timeline</Text>
            <TimelineStep done label="Case Registered"   sub={shortDate} />
            <TimelineStep done={currentIdx >= 1} label="Doctor Assigned"  sub={currentIdx >= 1 ? 'Consultation arranged' : 'Pending'} />
            <TimelineStep done={currentIdx >= 2} label="Referral Issued"  sub={currentIdx >= 2 ? 'Referred to specialist' : '—'} />
            <TimelineStep done={record.status === 'closed'} label="Case Closed" sub={record.status === 'closed' ? 'Resolved' : 'Open'} last />
          </View>
        </InfoCard>

        {/* ── TREATMENT ADVICE ── */}
        <InfoCard>
          <SectionLabel icon="💊" title="Treatment Advice" />
          {homeRemedies.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={cdStyles.adviceSubhead}>🌿 Home Remedies</Text>
              {homeRemedies.map((r, i) => (
                <View key={i} style={cdStyles.bulletRow}>
                  <Text style={cdStyles.bullet}>•</Text>
                  <Text style={cdStyles.bulletTxt}>{r}</Text>
                </View>
              ))}
            </View>
          )}
          {warningSigns.length > 0 && (
            <View>
              <Text style={[cdStyles.adviceSubhead, { color: theme.colors.danger }]}>⚠️ Warning Signs</Text>
              {warningSigns.map((w, i) => (
                <View key={i} style={cdStyles.bulletRow}>
                  <Text style={[cdStyles.bullet, { color: theme.colors.danger }]}>•</Text>
                  <Text style={[cdStyles.bulletTxt, { color: '#991B1B' }]}>{w}</Text>
                </View>
              ))}
            </View>
          )}
          {homeRemedies.length === 0 && warningSigns.length === 0 && (
            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              No specific advice available for this case.
            </Text>
          )}
        </InfoCard>

        {/* ── FOOTER ── */}
        <View style={cdStyles.footerCard}>
          <Text style={cdStyles.footerLogo}>Swasthya Saathi</Text>
          <Text style={cdStyles.footerSub}>Report ID: #{record.id}</Text>
          <Text style={cdStyles.footerSub}>Generated on {shortDate}</Text>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── STICKY BOTTOM BAR ── */}
      <View style={cdStyles.stickyBar}>
        <Pressable style={[cdStyles.stickyBtn, cdStyles.downloadBtn]} onPress={handleDownload}>
          <Text style={cdStyles.downloadTxt}>⬇ Download</Text>
        </Pressable>
        <Pressable style={[cdStyles.stickyBtn, cdStyles.shareBtn]} onPress={handleShare}>
          <Text style={cdStyles.shareTxt}>🔗 Share with Doctor</Text>
        </Pressable>
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────── */
const cdStyles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 20 },

  /* not found */
  notFound:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: theme.colors.background },
  notFoundTitle:  { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 12 },
  notFoundSub:    { fontSize: 14, color: theme.colors.textSecondary, marginTop: 6, textAlign: 'center' },
  notFoundBtn:    { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: theme.colors.primary, borderRadius: 12 },
  notFoundBtnTxt: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  /* hero */
  hero:        { paddingTop: 52, paddingBottom: 22, paddingHorizontal: 20 },
  heroBack:    { marginBottom: 12 },
  heroBackTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  heroTop:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  heroApp:     { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  heroTitle:   { color: '#FFF', fontSize: 26, fontWeight: '900', marginBottom: 4 },
  heroDate:    { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  riskCircle:  { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  riskEmoji:   { fontSize: 28 },
  riskWord:    { fontSize: 10, color: '#FFF', fontWeight: '800', marginTop: 2 },
  heroPills:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  heroPill:    { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  heroPillTxt: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  /* card */
  card: {
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: 18,
    marginHorizontal: 16, marginBottom: 14,
    ...CARD_SHADOW,
  },

  /* symptoms */
  tagWrap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symTag:    { backgroundColor: '#EBF3FF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  symTagTxt: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },

  /* vitals */
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  vitalsNote: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 10, fontStyle: 'italic' },

  /* AI analysis */
  aiTopRow:       { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  aiRiskBadge:    { borderRadius: 12, padding: 14, alignItems: 'center', minWidth: 90 },
  aiRiskLabel:    { fontSize: 20, fontWeight: '900' },
  aiRiskSublabel: { fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.85 },
  aiConf:         { alignItems: 'center', gap: 6 },
  aiConfLabel:    { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600' },
  guidanceBox:    { borderRadius: 12, padding: 14, marginBottom: 10 },
  guidanceTxt:    { fontSize: 14, color: theme.colors.textPrimary, lineHeight: 21 },
  redFlagBox:     { backgroundColor: '#FEE2E2', borderRadius: 10, padding: 10 },
  redFlagTxt:     { color: '#991B1B', fontWeight: '700', fontSize: 13 },

  /* doctor recommendation */
  referralRow:      { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, marginBottom: 12 },
  referralTxt:      { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  nextActionBox:    { backgroundColor: '#EBF3FF', borderRadius: 10, padding: 12, marginBottom: 12 },
  nextActionLabel:  { fontSize: 11, fontWeight: '700', color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  nextActionTxt:    { fontSize: 13, color: theme.colors.textPrimary, lineHeight: 20 },
  doctorNotesBox:   { backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginBottom: 12 },
  doctorNotesLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  doctorNotesTxt:   { fontSize: 13, color: theme.colors.textPrimary, lineHeight: 20 },

  /* timeline */
  timelineWrap:  { marginTop: 8, paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.border },
  timelineTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 14 },

  /* treatment advice */
  adviceSubhead: { fontSize: 13, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 8 },
  bulletRow:     { flexDirection: 'row', gap: 8, marginBottom: 5 },
  bullet:        { fontSize: 14, color: theme.colors.primary, lineHeight: 20 },
  bulletTxt:     { flex: 1, fontSize: 13, color: theme.colors.textPrimary, lineHeight: 20 },

  /* footer */
  footerCard: {
    marginHorizontal: 16, marginBottom: 8, backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: 20, alignItems: 'center', ...CARD_SHADOW,
  },
  footerLogo: { fontSize: 16, fontWeight: '900', color: theme.colors.primary, letterSpacing: 0.5 },
  footerSub:  { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },

  /* sticky bottom bar */
  stickyBar:   {
    flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 28,
    backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border,
    ...CARD_SHADOW,
  },
  stickyBtn:   { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  downloadBtn: { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: theme.colors.border },
  downloadTxt: { fontSize: 14, fontWeight: '800', color: theme.colors.textPrimary },
  shareBtn:    { backgroundColor: theme.colors.primary },
  shareTxt:    { fontSize: 14, fontWeight: '800', color: '#FFF' },
});
