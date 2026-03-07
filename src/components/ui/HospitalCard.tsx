import React from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Hospital } from '../../services/hospitalService';
import { theme } from '../../utils/theme';

interface HospitalCardProps {
  hospital: Hospital;
  isNearest?: boolean;
  insideZone?: boolean;
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  isNearest = false,
  insideZone = false,
}) => {
  const distanceText =
    hospital.distance < 1
      ? `${(hospital.distance * 1000).toFixed(0)} m`
      : `${hospital.distance.toFixed(1)} km`;

  const openInMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${hospital.lat},${hospital.lon}`,
      android: `geo:0,0?q=${hospital.lat},${hospital.lon}(${encodeURIComponent(hospital.name)})`,
      default: `https://www.openstreetmap.org/?mlat=${hospital.lat}&mlon=${hospital.lon}#map=17/${hospital.lat}/${hospital.lon}`,
    });
    if (url) Linking.openURL(url);
  };

  const callHospital = () => {
    if (hospital.phone) {
      Linking.openURL(`tel:${hospital.phone.replace(/\s/g, '')}`);
    }
  };

  return (
    <View style={[styles.card, isNearest && styles.cardNearest, insideZone && styles.cardInside]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{hospital.type === 'clinic' ? '🏥' : '🏨'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{hospital.name}</Text>
          {hospital.address ? (
            <Text style={styles.address} numberOfLines={1}>{hospital.address}</Text>
          ) : null}
        </View>
        <View style={styles.distanceWrap}>
          <Text style={styles.distanceValue}>{distanceText}</Text>
          <Text style={styles.distanceLabel}>away</Text>
        </View>
      </View>

      {/* Tags row */}
      <View style={styles.tags}>
        {isNearest && (
          <View style={[styles.tag, styles.tagNearest]}>
            <Text style={styles.tagTextNearest}>📍 Nearest</Text>
          </View>
        )}
        {insideZone && (
          <View style={[styles.tag, styles.tagInside]}>
            <Text style={styles.tagTextInside}>✅ You are here</Text>
          </View>
        )}
        {hospital.emergencyService && (
          <View style={[styles.tag, styles.tagEmergency]}>
            <Text style={styles.tagTextEmergency}>🚑 Emergency</Text>
          </View>
        )}
        {hospital.openingHours && (
          <View style={[styles.tag, styles.tagHours]}>
            <Text style={styles.tagTextHours}>🕐 {hospital.openingHours}</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={openInMaps}>
          <Text style={styles.actionIcon}>🗺️</Text>
          <Text style={styles.actionText}>Directions</Text>
        </Pressable>
        {hospital.phone && (
          <Pressable style={styles.actionBtn} onPress={callHospital}>
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Call</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardNearest: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: '#F0F7FF',
  },
  cardInside: {
    borderColor: '#16A34A',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  address: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  distanceWrap: { alignItems: 'flex-end' },
  distanceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  distanceLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagNearest: { backgroundColor: '#DBEAFE' },
  tagTextNearest: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  tagInside: { backgroundColor: '#DCFCE7' },
  tagTextInside: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  tagEmergency: { backgroundColor: '#FEE2E2' },
  tagTextEmergency: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  tagHours: { backgroundColor: '#FEF9C3' },
  tagTextHours: { fontSize: 11, fontWeight: '600', color: '#A16207' },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  actionIcon: { fontSize: 14 },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
