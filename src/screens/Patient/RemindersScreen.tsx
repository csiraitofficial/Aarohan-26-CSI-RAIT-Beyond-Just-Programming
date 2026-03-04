import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { usePatient } from '../../context/PatientContext';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'RemindersScreen'>;

const typeIcon: Record<string, string> = { medication: '💊', 'follow-up': '🩺', 'ai-check': '🤖' };

export const RemindersScreen: React.FC<Props> = () => {
  const { reminders, toggleReminder, deleteReminder } = usePatient();

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Reminder', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteReminder(id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="Reminders" subtitle={`${reminders.length} reminders set`} />

      {reminders.length === 0 && <Text style={styles.empty}>No reminders yet.</Text>}

      {reminders.map((r) => (
        <Card key={r.id}>
          <View style={styles.row}>
            <Text style={styles.icon}>{typeIcon[r.type] ?? '🔔'}</Text>
            <View style={styles.info}>
              <Text style={styles.title}>{r.title}</Text>
              <Text style={styles.time}>{r.time} • {r.type}</Text>
            </View>
            <Switch value={r.enabled} onValueChange={() => toggleReminder(r.id)} />
          </View>
          <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(r.id)}>
            <Text style={styles.deleteTxt}>Delete</Text>
          </Pressable>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary },
  time: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 2 },
  deleteBtn: { marginTop: 10, alignSelf: 'flex-end' },
  deleteTxt: { color: theme.colors.danger, fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: theme.colors.textSecondary, marginTop: 40 },
});
