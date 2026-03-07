import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { HospitalCard } from '../../components/ui/HospitalCard';
import { useNearbyHospitals } from '../../hooks/useNearbyHospitals';
import { useGeofencing } from '../../hooks/useGeofencing';
import { theme } from '../../utils/theme';
import { Hospital } from '../../services/hospitalService';

type Props = NativeStackScreenProps<PatientStackParamList, 'NearbyHospitalsScreen'>;

const RADIUS_OPTIONS = [2, 5, 10, 20];

export const NearbyHospitalsScreen: React.FC<Props> = ({ navigation }) => {
  const [radius, setRadius] = useState(5);
  const { hospitals, loading, phase, error, userLat, userLon, refresh } = useNearbyHospitals(radius);
  const geofencing = useGeofencing();

  const handleToggleMonitoring = async () => {
    if (geofencing.isMonitoring) {
      geofencing.stop();
    } else if (hospitals.length > 0) {
      await geofencing.start(hospitals);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Nearby Hospitals</Text>
        <Text style={styles.subtitle}>
          {userLat && userLon
            ? `📍 ${userLat.toFixed(4)}, ${userLon.toFixed(4)}`
            : 'Detecting location…'}
        </Text>
      </View>

      {/* Radius selector */}
      <View style={styles.radiusSection}>
        <Text style={styles.radiusLabel}>Search Radius</Text>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map((r) => (
            <Pressable
              key={r}
              style={[styles.radiusChip, radius === r && styles.radiusChipActive]}
              onPress={() => setRadius(r)}
            >
              <Text style={[styles.radiusChipText, radius === r && styles.radiusChipTextActive]}>
                {r} km
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Geofence toggle */}
      <Pressable
        style={[styles.monitorBtn, geofencing.isMonitoring && styles.monitorBtnActive]}
        onPress={handleToggleMonitoring}
      >
        <Text style={styles.monitorIcon}>{geofencing.isMonitoring ? '🟢' : '📡'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.monitorTitle, geofencing.isMonitoring && styles.monitorTitleActive]}>
            {geofencing.isMonitoring ? 'Geofence Active' : 'Enable Geofence Alerts'}
          </Text>
          <Text style={styles.monitorSub}>
            {geofencing.isMonitoring
              ? 'You will be alerted when near a hospital'
              : 'Get notified when you arrive at a hospital'}
          </Text>
        </View>
        <View style={[styles.toggleTrack, geofencing.isMonitoring && styles.toggleTrackActive]}>
          <View style={[styles.toggleThumb, geofencing.isMonitoring && styles.toggleThumbActive]} />
        </View>
      </Pressable>

      {/* Status card when monitoring */}
      {geofencing.isMonitoring && (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={styles.statusValue}>
                {geofencing.insideHospitalZone ? '✅ At Hospital' : '🔍 Tracking'}
              </Text>
            </View>
            {geofencing.nearestHospital && (
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Nearest</Text>
                <Text style={styles.statusValue} numberOfLines={1}>
                  {geofencing.nearestHospital.name}
                </Text>
              </View>
            )}
          </View>
          {geofencing.currentLat && geofencing.currentLon && (
            <Text style={styles.statusCoords}>
              Live: {geofencing.currentLat.toFixed(5)}, {geofencing.currentLon.toFixed(5)}
            </Text>
          )}
        </View>
      )}

      {/* Loading / Error / Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {phase === 'permission' ? '🔐 Requesting location access…'
              : phase === 'gps' ? '📡 Getting your GPS location…'
              : phase === 'fetching' ? `🏥 Finding hospitals within ${radius} km…`
              : 'Loading…'}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : hospitals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🏥</Text>
          <Text style={styles.emptyTitle}>No hospitals found</Text>
          <Text style={styles.emptyText}>
            Try increasing the search radius or check your internet connection.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.resultHeader}>
            <Text style={styles.resultCount}>
              {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} found
            </Text>
            <Pressable onPress={refresh}>
              <Text style={styles.refreshBtn}>🔄 Refresh</Text>
            </Pressable>
          </View>
          {hospitals.map((hospital: Hospital, idx: number) => (
            <HospitalCard
              key={hospital.id}
              hospital={hospital}
              isNearest={idx === 0}
              insideZone={geofencing.isMonitoring && geofencing.nearestHospital?.id === hospital.id && geofencing.insideHospitalZone}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: 52, paddingBottom: 48 },

  header: { marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  title: { fontSize: 26, fontWeight: '900', color: theme.colors.textPrimary },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },

  /* Radius selector */
  radiusSection: { marginBottom: 16 },
  radiusLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginBottom: 8 },
  radiusRow: { flexDirection: 'row', gap: 8 },
  radiusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  radiusChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  radiusChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary },
  radiusChipTextActive: { color: '#FFFFFF' },

  /* Monitor toggle */
  monitorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  monitorBtnActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  monitorIcon: { fontSize: 24 },
  monitorTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  monitorTitleActive: { color: '#15803D' },
  monitorSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: { backgroundColor: '#16A34A' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: { alignSelf: 'flex-end' },

  /* Status card */
  statusCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusRow: { flexDirection: 'row', gap: 16 },
  statusItem: { flex: 1 },
  statusLabel: { fontSize: 11, fontWeight: '600', color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusValue: { fontSize: 14, fontWeight: '700', color: '#047857', marginTop: 2 },
  statusCoords: { fontSize: 11, color: '#6B7280', marginTop: 8 },

  /* Results */
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCount: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary },
  refreshBtn: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

  /* States */
  center: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 12 },
  errorCard: { alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: theme.radius.lg, padding: 24, marginTop: 12 },
  errorEmoji: { fontSize: 36, marginBottom: 8 },
  errorText: { fontSize: 14, color: '#991B1B', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  emptyCard: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary },
  emptyText: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
});
