import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RiskLevel } from '../../models';
import { Card } from './Card';
import { RiskBadge } from './RiskBadge';
import { theme } from '../../utils/theme';

type Props = {
  id: string;
  date: string;
  symptoms: string[];
  risk: RiskLevel;
  status: string;
  onPress: () => void;
};

export const CaseCard: React.FC<Props> = ({ date, symptoms, risk, status, onPress }) => (
  <Card style={styles.card}>
    <View style={styles.topRow}>
      <RiskBadge risk={risk} />
      <Text style={styles.date}>{date}</Text>
    </View>
    <Text style={styles.symptoms} numberOfLines={2}>{symptoms.join(', ')}</Text>
    <View style={styles.bottomRow}>
      <Text style={styles.status}>{status.toUpperCase()}</Text>
      <Text style={styles.link} onPress={onPress}>View Details →</Text>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { color: theme.colors.textSecondary, fontSize: 13 },
  symptoms: { color: theme.colors.textPrimary, fontWeight: '600', marginBottom: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontSize: 11, fontWeight: '700', color: theme.colors.textSecondary, letterSpacing: 0.5 },
  link: { color: theme.colors.primary, fontWeight: '700', fontSize: 14 },
});
