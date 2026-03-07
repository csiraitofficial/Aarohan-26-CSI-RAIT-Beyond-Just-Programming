import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Card } from '../../components/ui/Card';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../components/ui/SecondaryButton';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { useAuth } from '../../context/AuthContext';
import { fetchProfile, updateProfileApi } from '../../services/api';
import { theme } from '../../utils/theme';

interface ProfileData {
  full_name: string;
  phone: string;
  email: string;
  role: string;
  gender: string;
  date_of_birth: string;
  language_preference: string;
  address: string;
}

export const ProfileScreen: React.FC = () => {
  const { token, fullName, phone, role, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: fullName || '',
    phone: phone || '',
    email: '',
    role: role || 'patient',
    gender: '',
    date_of_birth: '',
    language_preference: 'en',
    address: '',
  });
  const [draft, setDraft] = useState<ProfileData>(profile);

  useEffect(() => {
    if (!token) return;
    fetchProfile(token)
      .then((user) => {
        const p: ProfileData = {
          full_name: user.full_name || '',
          phone: user.phone || '',
          email: user.email || '',
          role: user.role || 'patient',
          gender: user.gender || '',
          date_of_birth: user.date_of_birth || '',
          language_preference: user.language_preference || 'en',
          address: user.address || '',
        };
        setProfile(p);
        setDraft(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await updateProfileApi(
        {
          full_name: draft.full_name,
          gender: draft.gender || undefined,
          date_of_birth: draft.date_of_birth || undefined,
          language_preference: draft.language_preference || undefined,
          address: draft.address || undefined,
          email: draft.email || undefined,
        },
        token,
      );
      const p: ProfileData = {
        full_name: updated.full_name || '',
        phone: updated.phone || '',
        email: updated.email || '',
        role: updated.role || 'patient',
        gender: updated.gender || '',
        date_of_birth: updated.date_of_birth || '',
        language_preference: updated.language_preference || 'en',
        address: updated.address || '',
      };
      setProfile(p);
      setDraft(p);
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>  
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const roleLabel = profile.role.charAt(0).toUpperCase() + profile.role.slice(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionHeader title="My Profile" />

      <Card style={styles.avatarCard}>
        <View style={styles.avatarWrap}>
          <MaterialCommunityIcons name="account" size={40} color={theme.colors.primary} />
        </View>
        <Text style={styles.name}>{profile.full_name || 'User'}</Text>
        <Text style={styles.meta}>{roleLabel} {profile.gender ? `• ${profile.gender}` : ''}</Text>
      </Card>

      {editing ? (
        <Card>
          <Field label="Full Name" value={draft.full_name} onChange={(v) => setDraft({ ...draft, full_name: v })} />
          <Field label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
          <Field label="Gender" value={draft.gender} onChange={(v) => setDraft({ ...draft, gender: v })} />
          <Field label="Date of Birth (YYYY-MM-DD)" value={draft.date_of_birth} onChange={(v) => setDraft({ ...draft, date_of_birth: v })} />
          <Field label="Language" value={draft.language_preference} onChange={(v) => setDraft({ ...draft, language_preference: v })} />
          <Field label="Address" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
          <View style={styles.editActions}>
            <SecondaryButton title="Cancel" onPress={() => { setDraft(profile); setEditing(false); }} />
            <View style={{ width: 12 }} />
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <PrimaryButton title="Save" onPress={save} />
            )}
          </View>
        </Card>
      ) : (
        <Card>
          <Row label="Phone" value={profile.phone} />
          <Row label="Email" value={profile.email || 'Not set'} />
          <Row label="Role" value={roleLabel} />
          <Row label="Gender" value={profile.gender || 'Not set'} />
          <Row label="Date of Birth" value={profile.date_of_birth || 'Not set'} />
          <Row label="Language" value={profile.language_preference.toUpperCase()} />
          <Row label="Address" value={profile.address || 'Not set'} />
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
