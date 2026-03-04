import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

const roles: UserRole[] = ['patient', 'doctor', 'chw', 'admin'];

export const LoginRegisterScreen: React.FC<Props> = () => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [touched, setTouched] = useState({ email: false, password: false });

  const errors = useMemo(() => {
    return {
      email: email.includes('@') ? '' : 'Please enter a valid email address.',
      password: password.length >= 6 ? '' : 'Password must be at least 6 characters.'
    };
  }, [email, password]);

  const canSubmit = email.includes('@') && password.length >= 6;

  const handleSubmit = async () => {
    setTouched({ email: true, password: true });
    if (!canSubmit) {
      return;
    }
    await login(role);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode('login')}>
            <Text style={[styles.modeText, mode === 'login' && styles.modeActive]}>{t('login')}</Text>
          </Pressable>
          <Pressable onPress={() => setMode('register')}>
            <Text style={[styles.modeText, mode === 'register' && styles.modeActive]}>{t('register')}</Text>
          </Pressable>
        </View>

        <InputField
          label={t('email')}
          value={email}
          onChangeText={(v) => { setEmail(v); setTouched((prev) => ({ ...prev, email: true })); }}
          error={touched.email ? errors.email : ''}
        />
        <InputField
          label={t('password')}
          value={password}
          onChangeText={(v) => { setPassword(v); setTouched((prev) => ({ ...prev, password: true })); }}
          secureTextEntry
          error={touched.password ? errors.password : ''}
        />

        <Text style={styles.roleLabel}>{t('chooseRole')}</Text>
        <View style={styles.roleRow}>
          {roles.map((item) => {
            const active = item === role;
            return (
              <Pressable key={item} onPress={() => setRole(item)} style={[styles.roleChip, active && styles.roleChipActive]}>
                <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>{t(item)}</Text>
              </Pressable>
            );
          })}
        </View>

        <PrimaryButton title={mode === 'login' ? t('login') : t('register')} onPress={handleSubmit} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background
  },
  card: {
    marginBottom: 0
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: theme.spacing.md
  },
  modeText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '700'
  },
  modeActive: {
    color: theme.colors.primary
  },
  roleLabel: {
    color: theme.colors.textSecondary,
    marginBottom: 10
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.md
  },
  roleChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF'
  },
  roleChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#E8F1FF'
  },
  roleChipText: {
    color: theme.colors.textSecondary,
    fontWeight: '600'
  },
  roleChipTextActive: {
    color: theme.colors.primary
  }
});