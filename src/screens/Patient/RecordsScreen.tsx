import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { CaseCard } from '../../components/ui/CaseCard';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { usePatient } from '../../context/PatientContext';
import { RiskLevel } from '../../models';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'RecordsScreen'>;

const FILTERS: Array<RiskLevel | 'all'> = ['all', 'mild', 'moderate', 'emergency'];

export const RecordsScreen: React.FC<Props> = ({ navigation }) => {
  const { caseHistory } = usePatient();
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');

  const filtered = filter === 'all' ? caseHistory : caseHistory.filter((c) => c.result.risk === filter);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Health Records" subtitle={`${caseHistory.length} total records`} />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f === filter;
          return (
            <Pressable key={f} style={[styles.filterChip, active && styles.filterActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterTxt, active && styles.filterTxtActive]}>{f[0].toUpperCase() + f.slice(1)}</Text>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 && <Text style={styles.empty}>No records found.</Text>}

      {filtered.map((c) => (
        <CaseCard
          key={c.id}
          id={c.id}
          date={c.date}
          symptoms={c.symptoms}
          risk={c.result.risk}
          status={c.status}
          onPress={() => navigation.navigate('CaseDetailScreen', { caseId: c.id })}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF' },
  filterActive: { borderColor: theme.colors.primary, backgroundColor: '#EBF3FF' },
  filterTxt: { fontWeight: '600', color: theme.colors.textSecondary },
  filterTxtActive: { color: theme.colors.primary },
  empty: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: 40 },
});
