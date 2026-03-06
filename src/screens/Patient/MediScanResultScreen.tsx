import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../utils/theme';
import { MediScanResponse } from '../../services/api';

type Props = {
  route: { params: { result: MediScanResponse } };
  navigation: any;
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: '#F0FDF4', text: '#166534', label: 'Normal' },
  moderate: { bg: '#FFFBEB', text: '#92400E', label: 'Moderate' },
  high: { bg: '#FFF7ED', text: '#9A3412', label: 'High' },
  critical: { bg: '#FEF2F2', text: '#991B1B', label: 'Critical' },
};

export const MediScanResultScreen: React.FC<Props> = ({ route, navigation }) => {
  const { result } = route.params;
  const severity = SEVERITY_COLORS[result.severity] || SEVERITY_COLORS.moderate;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔬 Scan Results</Text>
      </View>

      {/* Severity Banner */}
      {result.is_critical && (
        <View style={styles.criticalBanner}>
          <Text style={styles.criticalText}>
            🚨 CRITICAL: Immediate medical attention may be required
          </Text>
        </View>
      )}

      {/* Primary Diagnosis Card */}
      <View style={[styles.diagnosisCard, { borderColor: severity.text + '40' }]}>
        <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
          <Text style={[styles.severityText, { color: severity.text }]}>
            {severity.label}
          </Text>
        </View>
        <Text style={styles.diseaseName}>{result.disease}</Text>
        <View style={styles.confidenceRow}>
          <View style={styles.confidenceBarBg}>
            <View
              style={[
                styles.confidenceBarFill,
                {
                  width: `${Math.min(result.confidence, 100)}%`,
                  backgroundColor:
                    result.confidence > 80
                      ? '#16A34A'
                      : result.confidence > 50
                      ? '#CA8A04'
                      : '#DC2626',
                },
              ]}
            />
          </View>
          <Text style={styles.confidenceValue}>{result.confidence.toFixed(1)}%</Text>
        </View>
      </View>

      {/* GradCAM Heatmap */}
      {result.gradcam_image && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 AI Heatmap Analysis</Text>
          <View style={styles.gradcamContainer}>
            <Image
              source={{ uri: result.gradcam_image }}
              style={styles.gradcamImage}
              resizeMode="contain"
            />
            <Text style={styles.gradcamHint}>
              Highlighted regions indicate areas of interest detected by the AI model
            </Text>
          </View>
        </View>
      )}

      {/* Top 5 Predictions */}
      {result.top5 && result.top5.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏥 Differential Diagnoses</Text>
          <View style={styles.card}>
            {result.top5.map((pred, idx) => (
              <View key={idx} style={styles.predictionRow}>
                <View style={styles.predictionRank}>
                  <Text style={styles.rankText}>{idx + 1}</Text>
                </View>
                <Text style={styles.predictionDisease} numberOfLines={1}>
                  {pred.disease}
                </Text>
                <View style={styles.predBarContainer}>
                  <View
                    style={[
                      styles.predBarFill,
                      {
                        width: `${Math.min(pred.confidence, 100)}%`,
                        backgroundColor:
                          idx === 0 ? theme.colors.primary : '#94A3B8',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.predConfidence}>
                  {pred.confidence.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Clinical Info */}
      {result.clinical_info && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Clinical Information</Text>
          <View style={styles.card}>
            <Text style={styles.clinicalText}>{result.clinical_info}</Text>
          </View>
        </View>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Recommendations</Text>
          <View style={styles.card}>
            {result.recommendations.map((rec, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listText}>{rec}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Warning Signs */}
      {result.warning_signs && result.warning_signs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Warning Signs to Watch</Text>
          <View style={[styles.card, styles.warningCard]}>
            {result.warning_signs.map((sign, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>⚠</Text>
                <Text style={[styles.listText, { color: '#92400E' }]}>{sign}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Medications */}
      {result.medications && result.medications.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Common Medications</Text>
          <View style={styles.card}>
            {result.medications.map((med, idx) => (
              <View key={idx} style={styles.listItem}>
                <Text style={styles.listBullet}>💊</Text>
                <Text style={styles.listText}>{med}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.newScanBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.newScanBtnText}>🔬 New Scan</Text>
        </TouchableOpacity>

        {result.severity !== 'none' && (
          <TouchableOpacity
            style={styles.doctorBtn}
            onPress={() => {
              try {
                navigation.navigate('DoctorSelectionScreen');
              } catch {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.doctorBtnText}>👨‍⚕️ Consult Doctor</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  criticalBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  criticalText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  diagnosisCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diseaseName: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  confidenceBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    minWidth: 55,
    textAlign: 'right',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  gradcamContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gradcamImage: {
    width: '100%',
    height: 250,
  },
  gradcamHint: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontStyle: 'italic',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  predictionRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  predictionDisease: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  predBarContainer: {
    width: 60,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  predBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  predConfidence: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    minWidth: 42,
    textAlign: 'right',
  },
  clinicalText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    paddingVertical: 4,
    gap: 8,
  },
  listBullet: {
    fontSize: 14,
    marginTop: 1,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  disclaimerCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  newScanBtn: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  newScanBtnText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  doctorBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doctorBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
