import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { Card } from '../../components/ui/Card';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { usePatient } from '../../context/PatientContext';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'CaseDetailScreen'>;

export const CaseDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { caseHistory } = usePatient();
  const record = caseHistory.find((c) => c.id === route.params.caseId);

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Record not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <RiskBadge risk={record.result.risk} large />
        <Text style={styles.date}>{record.date}</Text>
        <Text style={styles.status}>{record.status.toUpperCase()}</Text>
      </Card>

      <Card>
        <Text style={styles.section}>Symptoms</Text>
        <Text style={styles.val}>{record.symptoms.join(', ')}</Text>
        <Text style={styles.section}>Severity</Text>
        <Text style={styles.val}>{record.severity}/10</Text>
      </Card>

      <Card>
        <Text style={styles.section}>Vitals</Text>
        <Row label="Temperature" value={`${record.vitals.temperature || '—'} °F`} />
        <Row label="Blood Pressure" value={record.vitals.bloodPressure || '—'} />
        <Row label="SpO₂" value={`${record.vitals.oxygenSaturation || '—'} %`} />
      </Card>

      <Card>
        <Text style={styles.section}>AI Assessment</Text>
        <Text style={styles.val}>{record.result.guidance}</Text>
        <Text style={styles.section}>Recommended Action</Text>
        <Text style={styles.val}>{record.result.nextAction}</Text>
      </Card>

      {record.doctorNotes ? (
        <Card>
          <Text style={styles.section}>Doctor Notes</Text>
          <Text style={styles.val}>{record.doctorNotes}</Text>
        </Card>
      ) : null}

      <SecondaryButton title="← Back to Records" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowVal}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  headerCard: { alignItems: 'center', paddingVertical: 20 },
  date: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 10 },
  status: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 4, letterSpacing: 1 },
  section: { fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 12, marginBottom: 4 },
  val: { fontSize: 15, color: theme.colors.textPrimary, lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { color: theme.colors.textSecondary },
  rowVal: { fontWeight: '600', color: theme.colors.textPrimary },
  empty: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: 60 },
});
