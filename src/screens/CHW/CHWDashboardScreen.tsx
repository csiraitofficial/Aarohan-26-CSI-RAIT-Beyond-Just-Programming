import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/ui/Card';
import { theme } from '../../utils/theme';
import { LogoutButton } from '../../components/ui/LogoutButton';

const Tile: React.FC<{ icon: string; title: string; onPress?: () => void }> = ({ icon, title, onPress }) => (
  <Pressable style={styles.tile} onPress={onPress}>
    <Text style={styles.tileIcon}>{icon}</Text>
    <Text style={styles.tileText}>{title}</Text>
  </Pressable>
);

async function checkConnectivity(): Promise<boolean> {
  try {
    const res = await fetch('https://clients3.google.com/generate_204', { method: 'HEAD' });
    return res.status === 204;
  } catch {
    return false;
  }
}

export const CHWDashboardScreen: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const online = await checkConnectivity();
      if (!cancelled) setIsOffline(!online);
    };
    check();
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 12 }}>
        <LogoutButton />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>CHW Dashboard</Text>
        {isOffline ? (
          <Card style={styles.offlineCard}>
            <Text style={styles.offlineText}>Offline mode: Data will sync once internet is back.</Text>
          </Card>
        ) : null}

        <View style={styles.grid}>
          <Tile icon="🏠" title="Home Visits" />
          <Tile icon="📋" title="Case Notes" />
          <Tile icon="🧪" title="Vitals Entry" />
          <Tile icon="📶" title="Sync Queue" />
        </View>
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
  offlineCard: {
    backgroundColor: '#FEF3C7'
  },
  offlineText: {
    color: '#92400E',
    fontWeight: '700'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  tile: {
    width: '47%',
    minHeight: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileIcon: {
    fontSize: 28,
    marginBottom: 10
  },
  tileText: {
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center'
  }
});