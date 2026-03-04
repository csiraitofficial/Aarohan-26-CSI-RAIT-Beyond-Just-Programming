import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../utils/theme';

type Props = { title: string; subtitle?: string };

export const SectionHeader: React.FC<Props> = ({ title, subtitle }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.textPrimary },
  sub: { color: theme.colors.textSecondary, marginTop: 2 },
});
