import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../utils/theme';

type Props = { steps: string[]; current: number };

export const StepIndicator: React.FC<Props> = ({ steps, current }) => (
  <View style={styles.row}>
    {steps.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <View key={label} style={styles.step}>
          <View style={[styles.circle, done && styles.done, active && styles.active]}>
            <Text style={[styles.num, (done || active) && styles.numActive]}>{i + 1}</Text>
          </View>
          <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>{label}</Text>
          {i < steps.length - 1 && <View style={[styles.line, done && styles.lineDone]} />}
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  step: { alignItems: 'center', flex: 1, position: 'relative' },
  circle: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 2,
    borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF',
  },
  done: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  active: { borderColor: theme.colors.primary },
  num: { fontSize: 13, fontWeight: '700', color: theme.colors.textSecondary },
  numActive: { color: '#FFF' },
  label: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
  labelActive: { color: theme.colors.primary, fontWeight: '700' },
  line: {
    position: 'absolute', top: 15, left: '60%', right: '-40%', height: 2,
    backgroundColor: theme.colors.border, zIndex: -1,
  },
  lineDone: { backgroundColor: theme.colors.primary },
});
