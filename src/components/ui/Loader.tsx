import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../utils/theme';

type Props = { message?: string };

export const Loader: React.FC<Props> = ({ message = 'Analyzing…' }) => (
  <View style={styles.wrap}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  text: { color: theme.colors.textSecondary, marginTop: 16, fontSize: 16 },
});
