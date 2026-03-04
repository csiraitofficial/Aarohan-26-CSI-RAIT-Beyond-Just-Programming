import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { theme } from '../../utils/theme';

type VitalsCardProps = {
  heartRate: number;
  spo2: number;
  temp: number;
};

export const VitalsCard: React.FC<VitalsCardProps> = ({ heartRate, spo2, temp }) => {
  return (
    <Card>
      <Text style={styles.title}>Latest Vitals</Text>
      <View style={styles.row}>
        <Text style={styles.item}>Heart Rate: {heartRate} bpm</Text>
        <Text style={styles.item}>SpO₂: {spo2}%</Text>
      </View>
      <Text style={styles.item}>Temperature: {temp}°C</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  item: {
    color: theme.colors.textSecondary,
    fontSize: 14
  }
});