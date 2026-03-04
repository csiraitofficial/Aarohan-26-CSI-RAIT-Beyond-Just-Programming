import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RiskLevel } from '../../models';
import { theme } from '../../utils/theme';

type RiskBadgeProps = {
  risk: RiskLevel;
  large?: boolean;
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, large = false }) => {
  const map = {
    mild: { bg: '#DCFCE7', text: theme.colors.mild, label: 'Mild' },
    moderate: { bg: '#FEF9C3', text: theme.colors.moderate, label: 'Moderate' },
    emergency: { bg: '#FEE2E2', text: theme.colors.emergency, label: 'Emergency' }
  };
  const config = map[risk];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, large && styles.large]}>
      <Text style={[styles.text, { color: config.text }, large && styles.largeText]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start'
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  text: {
    fontWeight: '700',
    fontSize: 13
  },
  largeText: {
    fontSize: 20
  }
});