import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { usePatient } from '../../context/PatientContext';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../utils/theme';

export const ProfileScreen: React.FC = () => {
  const { profile, updateProfile } = usePatient();
  const { logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  const save = () => {
    updateProfile(draft);
    setEditing(false);
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="My Profile" />

      <Card style={styles.avatarCard}>
        <View style={styles.avatarWrap}>
          <MaterialCommunityIcons name="account" size={40} color={theme.colors.primary} />
        </View>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.meta}>{profile.age} yrs • {profile.gender}</Text>
      </Card>

      {editing ? (
        <Card>
          <Field label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Field label="Age" value={String(draft.age)} onChange={(v) => setDraft({ ...draft, age: Number(v) || 0 })} numeric />
          <Field label="Gender" value={draft.gender} onChange={(v) => setDraft({ ...draft, gender: v })} />
          <Field label="Emergency Contact" value={draft.emergencyContact} onChange={(v) => setDraft({ ...draft, emergencyContact: v })} />
          <Field label="Medical History" value={draft.medicalHistory} onChange={(v) => setDraft({ ...draft, medicalHistory: v })} />
          <Field
            label="Allergies (comma-separated)"
            value={draft.allergies.join(', ')}
            onChange={(v) => setDraft({ ...draft, allergies: v.split(',').map((a) => a.trim()).filter(Boolean) })}
          />
          <View style={styles.editActions}>
            <SecondaryButton title="Cancel" onPress={() => { setDraft(profile); setEditing(false); }} />
            <View style={{ width: 12 }} />
            <PrimaryButton title="Save" onPress={save} />
          </View>
        </Card>
      ) : (
        <Card>
          <Row label="Emergency Contact" value={profile.emergencyContact} />
          <Row label="Language" value={profile.language.toUpperCase()} />
          <Row label="Medical History" value={profile.medicalHistory} />
          <Row label="Allergies" value={profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None'} />
          <View style={{ height: 16 }} />
          <PrimaryButton title="Edit Profile" onPress={() => setEditing(true)} />
        </Card>
      )}

      <View style={styles.logoutWrap}>
        <SecondaryButton title="Logout" onPress={confirmLogout} />
      </View>
    </ScrollView>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (v: string) => void; numeric?: boolean }> = ({ label, value, onChange, numeric }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput style={styles.fieldInput} value={value} onChangeText={onChange} keyboardType={numeric ? 'numeric' : 'default'} />
  </View>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowVal}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  avatarCard: { alignItems: 'center', paddingVertical: 24 },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EBF3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  name: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary },
  meta: { color: theme.colors.textSecondary, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { color: theme.colors.textSecondary },
  rowVal: { fontWeight: '600', color: theme.colors.textPrimary, maxWidth: '55%', textAlign: 'right' },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4 },
  fieldInput: { minHeight: 44, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, paddingHorizontal: 12, backgroundColor: '#FFF', fontSize: 15 },
  editActions: { flexDirection: 'row', marginTop: 16 },
  logoutWrap: { marginTop: 28 },
});
