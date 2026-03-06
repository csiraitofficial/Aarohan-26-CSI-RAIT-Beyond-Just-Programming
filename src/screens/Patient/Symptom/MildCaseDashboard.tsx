import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { usePatient } from '../../../context/PatientContext';
import { theme } from '../../../utils/theme';
import { NATURAL_REMEDIES, NaturalRemedy } from '../../../data/naturalRemedies';

type Props = NativeStackScreenProps<PatientStackParamList, 'MildCaseDashboard'>;

export const MildCaseDashboard: React.FC<Props> = ({ navigation }) => {
  const { caseHistory, latestClassification } = usePatient();
  const latest = caseHistory.length > 0 ? caseHistory[0] : null;
  const cls = latestClassification ?? latest?.classification;

  // Find matching natural remedies based on guidance text
  const matchedRemedies = useMemo(() => {
    const guidance = (cls?.guidance || latest?.symptomsText || '').toLowerCase();
    return NATURAL_REMEDIES.filter((r) =>
      r.keywords.some((kw) => guidance.includes(kw))
    ).slice(0, 5);
  }, [cls, latest]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Status Header ── */}
      <Card style={styles.headerCard}>
        <RiskBadge risk="mild" large />
        <Text style={styles.title}>Low Risk Condition</Text>
        <Text style={styles.subtitle}>You can manage this at home</Text>
        {cls && (
          <Text style={styles.confidence}>
            Confidence: {(cls.confidenceScore * 100).toFixed(0)}%
          </Text>
        )}
      </Card>

      {/* ── AI Explanation ── */}
      <Card>
        <Text style={styles.sectionIcon}>🤖</Text>
        <Text style={styles.sectionTitle}>AI Analysis</Text>
        <Text style={styles.body}>{cls?.guidance ?? 'Your symptoms appear to be mild.'}</Text>
      </Card>

      {/* ── Visit Summary ── */}
      {latest && (
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionIcon}>📋</Text>
          <Text style={styles.sectionTitle}>Your Visit Summary</Text>
          {latest.symptomsText ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Chief Complaint</Text>
              <Text style={styles.summaryValue}>{latest.symptomsText}</Text>
            </View>
          ) : null}
          <View style={styles.summaryChips}>
            <View style={styles.summaryChip}>
              <Text style={styles.summaryChipLabel}>Risk Level</Text>
              <Text style={[styles.summaryChipValue, styles.mildColor]}>Low Risk</Text>
            </View>
            {latest.severity ? (
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipLabel}>Severity</Text>
                <Text style={styles.summaryChipValue}>{latest.severity}/10</Text>
              </View>
            ) : null}
            {cls && (
              <View style={styles.summaryChip}>
                <Text style={styles.summaryChipLabel}>Confidence</Text>
                <Text style={styles.summaryChipValue}>{(cls.confidenceScore * 100).toFixed(0)}%</Text>
              </View>
            )}
          </View>
        </Card>
      )}

      {/* ── Natural Remedies (primary focus) ── */}
      <Card style={styles.remedyCard}>
        <Text style={styles.sectionIcon}>🌿</Text>
        <Text style={styles.sectionTitle}>Natural Remedies</Text>
        <Text style={styles.remedyIntro}>
          Try these natural approaches before considering medication:
        </Text>
        {matchedRemedies.length > 0 ? (
          matchedRemedies.map((remedy: NaturalRemedy, i: number) => (
            <View key={i} style={styles.remedyItem}>
              <Text style={styles.remedyEmoji}>{remedy.emoji}</Text>
              <View style={styles.remedyInfo}>
                <Text style={styles.remedyName}>{remedy.name}</Text>
                <Text style={styles.remedyDesc}>{remedy.description}</Text>
                {remedy.howTo && (
                  <Text style={styles.remedyHowTo}>💡 {remedy.howTo}</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.remedyItem}>
            <Text style={styles.remedyEmoji}>💧</Text>
            <View style={styles.remedyInfo}>
              <Text style={styles.remedyName}>Stay Hydrated & Rest</Text>
              <Text style={styles.remedyDesc}>
                Drink plenty of water, get adequate sleep, and allow your body time to recover.
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* ── Self-care Guidance from AI ── */}
      {cls?.homeRemedies && cls.homeRemedies.length > 0 && (
        <Card>
          <Text style={styles.sectionIcon}>💊</Text>
          <Text style={styles.sectionTitle}>Additional Self-Care Tips</Text>
          {cls.homeRemedies.map((r: string, i: number) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{r}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* ── When to Seek Help ── */}
      <Card style={styles.seekHelpCard}>
        <Text style={styles.sectionIcon}>🏥</Text>
        <Text style={styles.sectionTitle}>When to See a Doctor</Text>
        {cls?.warningSignsToWatch && cls.warningSignsToWatch.length > 0 ? (
          cls.warningSignsToWatch.map((w: string, i: number) => (
            <View key={i} style={styles.tipRow}>
              <Text style={styles.warningBullet}>⚠️</Text>
              <Text style={styles.warningText}>{w}</Text>
            </View>
          ))
        ) : (
          <>
            <View style={styles.tipRow}>
              <Text style={styles.warningBullet}>⚠️</Text>
              <Text style={styles.warningText}>Symptoms persist beyond 48 hours</Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.warningBullet}>⚠️</Text>
              <Text style={styles.warningText}>Symptoms suddenly worsen</Text>
            </View>
            <View style={styles.tipRow}>
              <Text style={styles.warningBullet}>⚠️</Text>
              <Text style={styles.warningText}>New symptoms develop (fever, rash, etc.)</Text>
            </View>
          </>
        )}
      </Card>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <PrimaryButton title="💾 Save to Records" onPress={() => navigation.navigate('RecordsScreen')} />
        <View style={styles.spacer} />
        <SecondaryButton title="🔔 Set Follow-Up Reminder" onPress={() => navigation.navigate('RemindersScreen')} />
        <View style={styles.spacer} />
        <SecondaryButton
          title="🩺 Consult a Doctor (Optional)"
          onPress={() => navigation.navigate('DoctorNeededDashboard')}
        />
      </View>

      {/* ── Disclaimer ── */}
      <Text style={styles.disclaimer}>
        ⚕️ This is AI-powered guidance and should not replace professional medical advice.
        Consult a healthcare provider if symptoms persist or worsen.
      </Text>

      <Text style={styles.backLink} onPress={() => navigation.popToTop()}>
        ← Back to Home
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 50 },
  headerCard: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#F0FDF4' },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 12 },
  subtitle: { fontSize: 14, color: '#16A34A', fontWeight: '600', marginTop: 4 },
  confidence: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  sectionIcon: { fontSize: 22, marginBottom: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  body: { color: theme.colors.textSecondary, lineHeight: 22, fontSize: 15 },
  remedyCard: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  remedyIntro: { color: theme.colors.textSecondary, fontSize: 13, marginBottom: 14, fontStyle: 'italic' },
  remedyItem: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  remedyEmoji: { fontSize: 28, marginTop: 2 },
  remedyInfo: { flex: 1 },
  remedyName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 2 },
  remedyDesc: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  remedyHowTo: { fontSize: 13, color: '#16A34A', marginTop: 4, fontStyle: 'italic', lineHeight: 18 },
  tipRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  tipBullet: { color: theme.colors.mild, fontWeight: '700', fontSize: 16 },
  tipText: { flex: 1, color: theme.colors.textPrimary, lineHeight: 22 },
  seekHelpCard: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  warningBullet: { fontSize: 14 },
  warningText: { flex: 1, color: '#92400E', lineHeight: 22 },
  actions: { marginTop: 16 },
  spacer: { height: 12 },
  disclaimer: {
    textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12,
    marginTop: 24, lineHeight: 18, fontStyle: 'italic', paddingHorizontal: 8,
  },
  backLink: { textAlign: 'center', color: theme.colors.primary, fontWeight: '700', fontSize: 15, marginTop: 16 },
  // Visit Summary
  summaryCard: { backgroundColor: '#F0F9FF', borderWidth: 1, borderColor: '#BAE6FD' },
  summaryRow: { marginBottom: 10 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  summaryValue: { fontSize: 15, color: theme.colors.textPrimary, lineHeight: 22 },
  summaryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  summaryChip: { flex: 1, minWidth: 80, backgroundColor: '#FFF', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0F2FE' },
  summaryChipLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryChipValue: { fontSize: 15, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 2 },
  mildColor: { color: '#16A34A' },
});
