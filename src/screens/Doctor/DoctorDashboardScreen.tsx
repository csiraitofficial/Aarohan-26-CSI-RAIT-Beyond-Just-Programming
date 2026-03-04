import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/ui/Card';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { PatientCase, RiskLevel } from '../../models';
import { theme } from '../../utils/theme';
import { LogoutButton } from '../../components/ui/LogoutButton';

const sampleCases: PatientCase[] = [
  { id: '1', name: 'Ravi Kumar', risk: 'mild', time: '10:05 AM' },
  { id: '2', name: 'Sana Ali', risk: 'moderate', time: '10:18 AM' },
  { id: '3', name: 'Neha Das', risk: 'emergency', time: '10:23 AM' }
];

const tabs: Array<RiskLevel | 'all'> = ['all', 'mild', 'moderate', 'emergency'];

export const DoctorDashboardScreen: React.FC = () => {
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? sampleCases : sampleCases.filter((item) => item.risk === filter)),
    [filter]
  );

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 12 }}>
        <LogoutButton />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Doctor Dashboard</Text>
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const active = tab === filter;
            return (
              <Pressable key={tab} onPress={() => setFilter(tab)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab[0].toUpperCase() + tab.slice(1)}</Text>
              </Pressable>
            );
          })}
        </View>

        {filtered.map((item) => (
          <Card key={item.id}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.caseRow}>
              <RiskBadge risk={item.risk} />
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <PrimaryButton title="Open Case" onPress={() => {}} />
          </Card>
        ))}
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  content: {
    padding: theme.spacing.lg
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md
  },
  tab: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF'
  },
  tabActive: {
    backgroundColor: '#E8F1FF',
    borderColor: theme.colors.primary
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontWeight: '600'
  },
  tabTextActive: {
    color: theme.colors.primary
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10
  },
  caseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  time: {
    color: theme.colors.textSecondary
  }
});