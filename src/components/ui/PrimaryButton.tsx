import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme } from '../../utils/theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'neutral';
  disabled?: boolean;
};

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, variant = 'primary', disabled = false }) => {
  const backgroundColor =
    variant === 'danger' ? theme.colors.danger : variant === 'neutral' ? '#374151' : theme.colors.primary;

  return (
    <Pressable
      style={[styles.button, { backgroundColor }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.label}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16
  }
});