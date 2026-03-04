import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../utils/theme';

type Props = { title: string; onPress: () => void };

export const SecondaryButton: React.FC<Props> = ({ title, onPress }) => (
  <Pressable style={styles.btn} onPress={onPress}>
    <Text style={styles.label}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  label: { color: theme.colors.primary, fontWeight: '700', fontSize: 16 },
});
