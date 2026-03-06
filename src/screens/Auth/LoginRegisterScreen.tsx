import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../components/ui/Card';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { UserRole } from '../../models';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { theme } from '../../utils/theme';
import { login as apiLogin, register as apiRegister } from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export const LoginRegisterScreen: React.FC<Props> = () => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ phone: false, password: false, fullName: false });

  const errors = useMemo(() => {
    return {
      phone: phone.length >= 10 ? '' : 'Please enter a valid phone number.',
      password: password.length >= 6 ? '' : 'Password must be at least 6 characters.',
      fullName: fullName.length >= 2 ? '' : 'Please enter your full name.',
    };
  }, [phone, password, fullName]);

  const canSubmit = phone.length >= 10 && password.length >= 6 && (mode === 'login' || fullName.length >= 2);

  const handleSubmit = async () => {
    setTouched({ phone: true, password: true, fullName: true });
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      if (mode === 'register') {
        const response = await apiRegister({ full_name: fullName, phone, password });
        const role = (response.user.role as UserRole) || 'patient';
        await login(role, response.access_token);
      } else {
        const response = await apiLogin({ phone, password });
        const role = (response.user.role as UserRole) || 'patient';
        await login(role, response.access_token);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Swasthya Saathi</Text>
        <Text style={styles.subtitle}>Your Health Companion</Text>

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
            onChangeText={(v) => { setFullName(v); setTouched((prev) => ({ ...prev, fullName: true })); }}
            error={touched.fullName ? errors.fullName : ''}
          />
        )}

        <InputField
          label="Phone Number"
          value={phone}
          onChangeText={(v) => { setPhone(v); setTouched((prev) => ({ ...prev, phone: true })); }}
          keyboardType="phone-pad"
          error={touched.phone ? errors.phone : ''}
        />
        <InputField
          label={t('password')}
          value={password}
          onChangeText={(v) => { setPassword(v); setTouched((prev) => ({ ...prev, password: true })); }}
          secureTextEntry
          error={touched.password ? errors.password : ''}
        />

        <PrimaryButton
          title={loading ? 'Please wait...' : mode === 'login' ? t('login') : t('register')}
          onPress={handleSubmit}
          disabled={loading}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 20,
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
});