import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
  VictoryArea,
} from 'victory-native';
import Svg, { G, Path, Text as SvgText, Circle } from 'react-native-svg';
import { PatientStackParamList } from '../../navigation/types';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { usePatient } from '../../context/PatientContext';
import { CaseRecord, RiskLevel } from '../../models';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'RecordsScreen'>;

const FILTERS: Array<{ key: RiskLevel | 'all'; label: string; emoji: string }> = [
  { key: 'all',       label: 'All',       emoji: '📋' },
  { key: 'mild',      label: 'Mild',      emoji: '🟢' },
  { key: 'moderate',  label: 'Moderate',  emoji: '🟡' },
  { key: 'emergency', label: 'Emergency', emoji: '🔴' },
];

const RISK_COLOR: Record<RiskLevel, string> = {
  mild:      theme.colors.mild,
  moderate:  theme.colors.moderate,
  emergency: theme.colors.emergency,
};
const RISK_BG: Record<RiskLevel, string> = {
  mild:      '#F0FDF4',
  moderate:  '#FFFBEB',
  emergency: '#FEF2F2',
};
const RISK_SCORE: Record<RiskLevel, number> = { mild: 1, moderate: 2, emergency: 3 };

const SCREEN_W = Dimensions.get('window').width;
const CHART_W  = SCREEN_W - theme.spacing.lg * 2 - 32;

const CARD_SHADOW = {
  shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 }, elevation: 3,
};

/* ─────────────────────────────────────────────────────────
   DONUT CHART
───────────────────────────────────────────────────────── */
function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function donutArc(cx: number, cy: number, outerR: number, innerR: number, startDeg: number, endDeg: number) {
  const so = polarToCartesian(cx, cy, outerR, startDeg);
  const eo = polarToCartesian(cx, cy, outerR, endDeg);
  const si = polarToCartesian(cx, cy, innerR, endDeg);
  const ei = polarToCartesian(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${so.x} ${so.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${eo.x} ${eo.y}`,
    `L ${si.x} ${si.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ei.x} ${ei.y}`,
    'Z',
  ].join(' ');
}

interface DonutProps {
  data: Array<{ label: string; value: number; color: string }>;
  total: number;
  size?: number;
}
const DonutChart: React.FC<DonutProps> = ({ data, total, size = 150 }) => {
  if (total === 0) return null;
  const cx = size / 2, cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.55;
  const slices: Array<{ d: string; color: string; mid: number; pct: number }> = [];
  let cum = 0;
  data.forEach(({ value, color }) => {
    if (value === 0) return;
    const sweep = (value / total) * 358; // 358 leaves a tiny gap
    const end = cum + sweep;
    slices.push({ d: donutArc(cx, cy, outerR, innerR, cum + 1, end), color, mid: cum + sweep / 2, pct: Math.round((value / total) * 100) });
    cum = end + 2;
  });
  return (
    <Svg width={size} height={size}>
      <G>
        {slices.map((s, i) => <Path key={i} d={s.d} fill={s.color} />)}
        {/* center label */}
        <SvgText x={cx} y={cy - 8} textAnchor="middle" alignmentBaseline="middle" fontSize={22} fontWeight="800" fill={theme.colors.textPrimary}>
          {total}
        </SvgText>
        <SvgText x={cx} y={cy + 12} textAnchor="middle" alignmentBaseline="middle" fontSize={10} fontWeight="600" fill={theme.colors.textSecondary}>
          CHECKS
        </SvgText>
      </G>
    </Svg>
  );
};

/* ─────────────────────────────────────────────────────────
   STAT PILL
───────────────────────────────────────────────────────── */
const StatPill: React.FC<{ label: string; value: string | number; color: string; bg: string }> = ({ label, value, color, bg }) => (
  <View style={[statStyles.wrap, { backgroundColor: bg }]}>
    <Text style={[statStyles.value, { color }]}>{value}</Text>
    <Text style={[statStyles.label, { color }]}>{label}</Text>
  </View>
);
const statStyles = StyleSheet.create({
  wrap:  { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2, opacity: 0.8 },
});

/* ─────────────────────────────────────────────────────────
   RECORD CARD
───────────────────────────────────────────────────────── */
const RecordCard: React.FC<{ record: CaseRecord; onPress: () => void }> = ({ record: c, onPress }) => {
  const riskColor = RISK_COLOR[c.result.risk];
  const riskBg    = RISK_BG[c.result.risk];
  const dateObj   = new Date(c.date);
  const day       = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const year      = dateObj.getFullYear();
  const referral  = c.result.risk === 'emergency' ? '🚨 Emergency Referral' : c.result.risk === 'moderate' ? '👨‍⚕️ Doctor Recommended' : '✅ Not Required';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [rcStyles.card, pressed && { opacity: 0.88 }]}>
      {/* left accent bar */}
      <View style={[rcStyles.accent, { backgroundColor: riskColor }]} />
      <View style={rcStyles.body}>
        {/* top row */}
        <View style={rcStyles.topRow}>
          <View style={rcStyles.dateBox}>
            <Text style={rcStyles.day}>{day}</Text>
            <Text style={rcStyles.year}>{year}</Text>
          </View>
          <RiskBadge risk={c.result.risk} />
        </View>
        {/* symptoms */}
        <View style={rcStyles.symRow}>
          <Text style={rcStyles.symLabel}>SYMPTOMS</Text>
          <Text style={rcStyles.symText} numberOfLines={2}>{c.symptoms.length > 0 ? c.symptoms.join(' · ') : c.symptomsText || '—'}</Text>
        </View>
        {/* footer */}
        <View style={rcStyles.footer}>
          <View style={[rcStyles.referralBadge, { backgroundColor: riskBg }]}>
            <Text style={[rcStyles.referralTxt, { color: riskColor }]}>{referral}</Text>
          </View>
          <View style={rcStyles.detailsBtn}>
            <Text style={rcStyles.detailsTxt}>View Report →</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};
const rcStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  accent: { width: 5, borderRadius: 0 },
  body: { flex: 1, padding: theme.spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  dateBox: {},
  day: { fontSize: 17, fontWeight: '800', color: theme.colors.textPrimary },
  year: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  symRow: { marginBottom: 12 },
  symLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.8, marginBottom: 4 },
  symText: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, lineHeight: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  referralBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  referralTxt: { fontSize: 11, fontWeight: '700' },
  detailsBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  detailsTxt: { fontSize: 12, fontWeight: '700', color: '#FFF' },
});

/* ─────────────────────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────────────────────── */
export const RecordsScreen: React.FC<Props> = ({ navigation }) => {
  const { caseHistory } = usePatient();
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');

  const counts = useMemo(() => {
    const c = { mild: 0, moderate: 0, emergency: 0 };
    caseHistory.forEach((r) => { c[r.result.risk]++; });
    return c;
  }, [caseHistory]);

  const pieData = [
    { label: 'Mild',      value: counts.mild,      color: RISK_COLOR.mild },
    { label: 'Moderate',  value: counts.moderate,  color: RISK_COLOR.moderate },
    { label: 'Emergency', value: counts.emergency, color: RISK_COLOR.emergency },
  ];

  const lineData = useMemo(() =>
    [...caseHistory]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c, i) => ({ x: i + 1, y: RISK_SCORE[c.result.risk], label: c.date.slice(5) })),
    [caseHistory],
  );

  const filtered     = filter === 'all' ? caseHistory : caseHistory.filter((c) => c.result.risk === filter);
  const sortedList   = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
  const lastCheck    = caseHistory.length ? [...caseHistory].sort((a,b) => b.createdAt - a.createdAt)[0].date : '—';
  const lastCheckFmt = lastCheck !== '—' ? new Date(lastCheck).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ════════════════════════════════════════
          HEADER
      ════════════════════════════════════════ */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSub}>Swasthya Saathi</Text>
          <Text style={styles.headerTitle}>My Health Records</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalNum}>{caseHistory.length}</Text>
          <Text style={styles.totalLbl}>Records</Text>
        </View>
      </View>

      {/* ════════════════════════════════════════
          STAT ROW
      ════════════════════════════════════════ */}
      <View style={styles.statRow}>
        <StatPill label="Mild"      value={counts.mild}      color={RISK_COLOR.mild}      bg="#F0FDF4" />
        <View style={{ width: 8 }} />
        <StatPill label="Moderate"  value={counts.moderate}  color={RISK_COLOR.moderate}  bg="#FFFBEB" />
        <View style={{ width: 8 }} />
        <StatPill label="Emergency" value={counts.emergency} color={RISK_COLOR.emergency} bg="#FEF2F2" />
      </View>

      {/* ════════════════════════════════════════
          HEALTH SUMMARY CARD  (Donut + Legend)
      ════════════════════════════════════════ */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Risk Distribution</Text>
        </View>
        <Text style={styles.cardSubtitle}>Health Check Summary · Last: {lastCheckFmt}</Text>

        <View style={styles.summaryRow}>
          <DonutChart data={pieData} total={caseHistory.length} size={150} />
          <View style={styles.legend}>
            {pieData.map((d) => (
              <View key={d.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.legendLabel}>{d.label}</Text>
                  <Text style={styles.legendSub}>{d.value} case{d.value !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={[styles.legendPct, { color: d.color }]}>
                  {caseHistory.length ? Math.round((d.value / caseHistory.length) * 100) : 0}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ════════════════════════════════════════
          HEALTH TREND  (Line Chart)
      ════════════════════════════════════════ */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardAccent} />
          <Text style={styles.cardTitle}>Health Trend</Text>
        </View>
        <Text style={styles.cardSubtitle}>Risk level over time · lower is healthier</Text>

        {lineData.length > 1 ? (
          <>
            <VictoryChart
              width={CHART_W}
              height={190}
              padding={{ top: 16, bottom: 40, left: 52, right: 16 }}
              domain={{ y: [0.5, 3.5] }}
            >
              <VictoryAxis
                tickValues={lineData.map((d) => d.x)}
                tickFormat={(t: number) => lineData[t - 1]?.label ?? ''}
                style={{
                  axis: { stroke: theme.colors.border },
                  tickLabels: { fontSize: 9, fill: theme.colors.textSecondary, angle: -20 },
                  grid: { stroke: 'transparent' },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickValues={[1, 2, 3]}
                tickFormat={(v: number) => (['', 'Mild', 'Mod', 'Emer'] as string[])[v] ?? ''}
                style={{
                  axis: { stroke: theme.colors.border },
                  tickLabels: { fontSize: 9, fill: theme.colors.textSecondary },
                  grid: { stroke: theme.colors.border, strokeDasharray: '4,4', strokeOpacity: 0.5 },
                }}
              />
              <VictoryArea
                data={lineData}
                style={{ data: { fill: theme.colors.primary, fillOpacity: 0.08, stroke: 'transparent' } }}
                interpolation="monotoneX"
              />
              <VictoryLine
                data={lineData}
                style={{ data: { stroke: theme.colors.primary, strokeWidth: 2.5 } }}
                interpolation="monotoneX"
              />
              <VictoryScatter
                data={lineData}
                size={6}
                style={{
                  data: {
                    fill: (({ datum }: { datum?: { y?: number } }) =>
                      datum?.y === 3 ? RISK_COLOR.emergency : datum?.y === 2 ? RISK_COLOR.moderate : RISK_COLOR.mild) as any,
                    stroke: '#FFF',
                    strokeWidth: 2,
                  },
                }}
              />
            </VictoryChart>
            <View style={styles.trendLegend}>
              {[
                { color: RISK_COLOR.mild,      label: 'Mild' },
                { color: RISK_COLOR.moderate,  label: 'Moderate' },
                { color: RISK_COLOR.emergency, label: 'Emergency' },
              ].map((l) => (
                <View key={l.label} style={styles.trendLegItem}>
                  <View style={[styles.trendDot, { backgroundColor: l.color }]} />
                  <Text style={styles.trendLegTxt}>{l.label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : lineData.length === 1 ? (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartIcon}>📊</Text>
            <Text style={styles.emptyChartTxt}>Need 2+ records to show trend</Text>
          </View>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyChartIcon}>📊</Text>
            <Text style={styles.emptyChartTxt}>No health data yet</Text>
          </View>
        )}
      </View>

      {/* ════════════════════════════════════════
          FILTER TABS
      ════════════════════════════════════════ */}
      <View style={styles.filterScrollRow}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const cnt = f.key === 'all' ? caseHistory.length : counts[f.key as RiskLevel];
          return (
            <Pressable
              key={f.key}
              style={[styles.filterChip, active && styles.filterActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={styles.filterEmoji}>{f.emoji}</Text>
              <Text style={[styles.filterTxt, active && styles.filterTxtActive]}>{f.label}</Text>
              <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeTxt, active && styles.filterBadgeTxtActive]}>{cnt}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* ════════════════════════════════════════
          SECTION LABEL
      ════════════════════════════════════════ */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {filter === 'all' ? 'All Records' : `${filter.charAt(0).toUpperCase()}${filter.slice(1)} Records`}
        </Text>
        <Text style={styles.listCount}>{sortedList.length} found</Text>
      </View>

      {/* ════════════════════════════════════════
          RECORDS LIST
      ════════════════════════════════════════ */}
      {sortedList.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🗂️</Text>
          <Text style={styles.emptyStateTitle}>No records found</Text>
          <Text style={styles.emptyStateSub}>Try changing the filter or complete a health check first.</Text>
        </View>
      ) : (
        sortedList.map((c) => (
          <RecordCard
            key={c.id}
            record={c}
            onPress={() => navigation.navigate('CaseDetailScreen', { caseId: c.id })}
          />
        ))
      )}
    </ScrollView>
  );
};

/* ─────────────────────────────────────────────────────────
   SCREEN STYLES
───────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content:   { padding: theme.spacing.lg, paddingTop: 52, paddingBottom: 52 },

  /* Header */
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center', justifyContent: 'center',
    ...CARD_SHADOW,
  },
  backArrow: { fontSize: 20, color: theme.colors.primary },
  headerSub:   { fontSize: 11, fontWeight: '700', color: theme.colors.primary, letterSpacing: 0.6, textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary },
  totalBadge: { alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  totalNum: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  totalLbl: { fontSize: 10, fontWeight: '700', color: '#FFF', opacity: 0.85 },

  /* Stats */
  statRow: { flexDirection: 'row', marginBottom: 16 },

  /* Generic card */
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...CARD_SHADOW,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: theme.colors.primary },
  cardTitle:    { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  cardSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 14, marginLeft: 12 },

  /* Donut + legend layout */
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot:   { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  legendSub:   { fontSize: 11, color: theme.colors.textSecondary },
  legendPct:   { fontSize: 15, fontWeight: '800' },

  /* Trend chart */
  trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4, marginBottom: 4 },
  trendLegItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trendDot: { width: 8, height: 8, borderRadius: 4 },
  trendLegTxt: { fontSize: 11, fontWeight: '600', color: theme.colors.textSecondary },

  emptyChart: { alignItems: 'center', paddingVertical: 28 },
  emptyChartIcon: { fontSize: 36, marginBottom: 8 },
  emptyChartTxt: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600' },

  /* Filter chips */
  filterScrollRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  filterActive: { borderColor: theme.colors.primary, backgroundColor: '#EBF3FF' },
  filterEmoji: { fontSize: 13 },
  filterTxt: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary },
  filterTxtActive: { color: theme.colors.primary },
  filterBadge: { backgroundColor: theme.colors.border, borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  filterBadgeActive: { backgroundColor: theme.colors.primary },
  filterBadgeTxt: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary },
  filterBadgeTxtActive: { color: '#FFF' },

  /* List header */
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary },
  listCount: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '600' },

  /* Empty state */
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateIcon: { fontSize: 52, marginBottom: 12 },
  emptyStateTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 6 },
  emptyStateSub: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
