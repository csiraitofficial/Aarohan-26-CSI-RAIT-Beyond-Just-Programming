import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../components/ui/Card';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { UserRole } from '../../models';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const ROLES: { value: UserRole; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; bg: string }[] = [
  { value: 'patient',  label: 'Patient',  icon: 'account-outline',        color: '#0A84FF', bg: '#EFF6FF' },
  { value: 'doctor',   label: 'Doctor',   icon: 'stethoscope',             color: '#059669', bg: '#ECFDF5' },
  { value: 'chw',      label: 'CHW',      icon: 'hospital-building',       color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'admin',    label: 'Admin',    icon: 'shield-account-outline',  color: '#DC2626', bg: '#FEF2F2' },
];

export const LoginRegisterScreen: React.FC<Props> = () => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [name, setName]         = useState('');
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [role, setRole]         = useState<UserRole>('patient');
  const [error, setError]       = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (!name.trim()) { setError('Please enter your name.'); return; }
    // Dummy auth — no backend, no password, just pick a name + role and go
    login(role, 'dummy-token', 'dummy-user-id', name.trim());
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        <Text style={styles.title}>Swasthya Saathi</Text>
        <Text style={styles.subtitle}>Your Health Companion</Text>

        {/* Login / Register tabs */}
        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode('login')}>
            <Text style={[styles.modeText, mode === 'login' && styles.modeActive]}>{t('login')}</Text>
          </Pressable>
          <Pressable onPress={() => setMode('register')}>
            <Text style={[styles.modeText, mode === 'register' && styles.modeActive]}>{t('register')}</Text>
          </Pressable>
        </View>

        <InputField
          label="Your Name"
          value={name}
          onChangeText={setName}
        />

        {/* Role selector */}
        <Text style={styles.roleLabel}>Select Your Role</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => {
            const active = role === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[
                  styles.roleChip,
                  { borderColor: active ? r.color : '#E5E7EB', backgroundColor: active ? r.bg : '#F9FAFB' },
                ]}
              >
                <MaterialCommunityIcons name={r.icon} size={16} color={active ? r.color : '#94A3B8'} />
                <Text style={[styles.roleText, { color: active ? r.color : theme.colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
                  {r.label}
                </Text>
                {active && <View style={[styles.roleDot, { backgroundColor: r.color }]} />}
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <PrimaryButton
          title={mode === 'login' ? 'Enter as ' + role.charAt(0).toUpperCase() + role.slice(1) : 'Register as ' + role.charAt(0).toUpperCase() + role.slice(1)}
          onPress={handleSubmit}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  card: {
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: theme.spacing.md,
  },
  modeText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    paddingBottom: 4,
  },
  modeActive: {
    color: theme.colors.primary,
    fontWeight: '700',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
    minWidth: '45%',
    flex: 1,
  },
  // roleIcon style removed — using MaterialCommunityIcons inline
  roleText: {
    fontSize: 13,
    flex: 1,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
});