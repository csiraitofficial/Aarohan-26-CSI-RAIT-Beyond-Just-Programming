import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/ui/Card';
import { theme } from '../../utils/theme';
import { LogoutButton } from '../../components/ui/LogoutButton';

const Bar: React.FC<{ height: number }> = ({ height }) => <View style={[styles.bar, { height }]} />;

const HeatTile: React.FC<{ active?: boolean }> = ({ active }) => <View style={[styles.heatTile, active && styles.heatActive]} />;

export const AdminDashboardScreen: React.FC = () => {
  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 12 }}>
        <LogoutButton />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Admin Dashboard</Text>

        <View style={styles.cardRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total Cases</Text>
            <Text style={styles.statValue}>1,248</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Active Emergencies</Text>
            <Text style={[styles.statValue, styles.emergencyValue]}>23</Text>
          </Card>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Trend Graph</Text>
          <View style={styles.graphRow}>
            <Bar height={28} />
            <Bar height={40} />
            <Bar height={34} />
            <Bar height={52} />
            <Bar height={46} />
            <Bar height={60} />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Heat Map</Text>
          <View style={styles.heatGrid}>
            <HeatTile active />
            <HeatTile />
            <HeatTile active />
            <HeatTile />
            <HeatTile active />
            <HeatTile />
            <HeatTile />
            <HeatTile active />
          </View>
        </Card>
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
    marginBottom: 12
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12
  },
  statCard: {
    flex: 1
  },
  statLabel: {
    color: theme.colors.textSecondary,
    marginBottom: 8
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800'
  },
  emergencyValue: {
    color: theme.colors.emergency
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12
  },
  graphRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 72
  },
  bar: {
    flex: 1,
    backgroundColor: '#93C5FD',
    borderRadius: 6
  },
  heatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  heatTile: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#DBEAFE'
  },
  heatActive: {
    backgroundColor: '#60A5FA'
  }
});