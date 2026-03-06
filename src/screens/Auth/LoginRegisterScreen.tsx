import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../components/ui/Card';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { UserRole } from '../../models';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { theme } from '../../utils/theme';

// Real backend auth is active  — set to true only for offline UI testing
const DEMO_MODE = false;

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const ROLES: { value: UserRole; label: string; icon: string; color: string; bg: string }[] = [
  { value: 'patient',  label: 'Patient',  icon: '🧑',  color: '#0A84FF', bg: '#EFF6FF' },
  { value: 'doctor',   label: 'Doctor',   icon: '👨‍⚕️', color: '#059669', bg: '#ECFDF5' },
  { value: 'chw',      label: 'CHW',      icon: '🏥',  color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'admin',    label: 'Admin',    icon: '🛡️',  color: '#DC2626', bg: '#FEF2F2' },
];

export const LoginRegisterScreen: React.FC<Props> = () => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [role, setRole]         = useState<UserRole>('patient');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (DEMO_MODE) {
        // ── Demo mode: skip API, log in with any input ──
        await login(role, 'demo-token', 'demo-user-001');
      } else {
        // ── Real auth (restore when backend is ready) ──
        const { login: apiLogin, register: apiRegister } = await import('../../services/api');
        if (mode === 'register') {
          const res = await apiRegister({ full_name: fullName, phone, password });
          await login((res.user.role as UserRole) || role, res.access_token, res.user.id);
        } else {
          const res = await apiLogin({ phone, password });
          await login((res.user.role as UserRole) || role, res.access_token, res.user.id);
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please try again.';
      // Use Alert to show authentication errors to the user
      const { Alert } = require('react-native');
      Alert.alert('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        <Text style={styles.title}>Swasthya Saathi</Text>
        <Text style={styles.subtitle}>Your Health Companion</Text>

        {/* Demo badge */}
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>🚧 Demo Mode — any input works</Text>
        </View>

        {/* Login / Register tabs */}
        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode('login')}>
            <Text style={[styles.modeText, mode === 'login' && styles.modeActive]}>{t('login')}</Text>
          </Pressable>
          <Pressable onPress={() => setMode('register')}>
            <Text style={[styles.modeText, mode === 'register' && styles.modeActive]}>{t('register')}</Text>
          </Pressable>
        </View>

        {mode === 'register' && (
          <InputField
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
        )}

        <InputField
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <InputField
          label={t('password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
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
                <Text style={styles.roleIcon}>{r.icon}</Text>
                <Text style={[styles.roleText, { color: active ? r.color : theme.colors.textSecondary, fontWeight: active ? '700' : '500' }]}>
                  {r.label}
                </Text>
                {active && <View style={[styles.roleDot, { backgroundColor: r.color }]} />}
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton
          title={loading ? 'Signing in…' : mode === 'login' ? t('login') : t('register')}
          onPress={handleSubmit}
          disabled={loading}
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
  demoBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
    marginBottom: 16,
  },
  demoBadgeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
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
  roleIcon: {
    fontSize: 16,
  },
  roleText: {
    fontSize: 13,
    flex: 1,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});