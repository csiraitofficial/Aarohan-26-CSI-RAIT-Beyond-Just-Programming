import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { usePatient } from '../../../context/PatientContext';
import { theme } from '../../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'MildCaseDashboard'>;

export const MildCaseDashboard: React.FC<Props> = ({ navigation }) => {
  const { caseHistory, latestClassification } = usePatient();
  const latest = caseHistory.length > 0 ? caseHistory[0] : null;
  const cls = latestClassification ?? latest?.classification;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Status Header ── */}
      <Card style={styles.headerCard}>
        <RiskBadge risk="mild" large />
        <Text style={styles.title}>Low Risk Condition</Text>
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

      {/* ── Self-care Guidance ── */}
      {cls?.homeRemedies && cls.homeRemedies.length > 0 && (
        <Card>
          <Text style={styles.sectionIcon}>💊</Text>
          <Text style={styles.sectionTitle}>Self-Care Guidance</Text>
          {cls.homeRemedies.map((r: string, i: number) => (
            <View key={i} style={styles.remedyRow}>
              <Text style={styles.remedyBullet}>•</Text>
              <Text style={styles.remedyText}>{r}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* ── Warning Signs ── */}
      {cls?.warningSignsToWatch && cls.warningSignsToWatch.length > 0 && (
        <Card style={styles.warningCard}>
          <Text style={styles.sectionIcon}>⚠️</Text>
          <Text style={styles.sectionTitle}>Warning Signs to Watch</Text>
          {cls.warningSignsToWatch.map((w: string, i: number) => (
            <View key={i} style={styles.remedyRow}>
              <Text style={styles.warningBullet}>!</Text>
              <Text style={styles.warningText}>{w}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <PrimaryButton title="💾 Save Record" onPress={() => navigation.navigate('RecordsScreen')} />
        <View style={styles.spacer} />
        <SecondaryButton title="🔔 Set Follow-Up Reminder" onPress={() => navigation.navigate('RemindersScreen')} />
        <View style={styles.spacer} />
        <SecondaryButton title="🩺 Talk to Doctor (Optional)" onPress={() => {}} />
      </View>

      {/* ── Disclaimer ── */}
      <Text style={styles.disclaimer}>
        This is AI-powered guidance. Consult a doctor if symptoms worsen or do not improve in 24-48 hours.
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
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 12 },
  confidence: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4 },
  sectionIcon: { fontSize: 20, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.textPrimary, marginBottom: 10 },
  body: { color: theme.colors.textSecondary, lineHeight: 22, fontSize: 15 },
  remedyRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  remedyBullet: { color: theme.colors.mild, fontWeight: '700', fontSize: 16 },
  remedyText: { flex: 1, color: theme.colors.textPrimary, lineHeight: 22 },
  warningCard: { backgroundColor: '#FFFBEB' },
  warningBullet: { color: '#D97706', fontWeight: '900', fontSize: 14 },
  warningText: { flex: 1, color: '#92400E', lineHeight: 22 },
  actions: { marginTop: 16 },
  spacer: { height: 12 },
  disclaimer: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12, marginTop: 24, lineHeight: 18, fontStyle: 'italic' },
  backLink: { textAlign: 'center', color: theme.colors.primary, fontWeight: '700', fontSize: 15, marginTop: 16 },
});
