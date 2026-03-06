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
import * as api from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

const roles: UserRole[] = ['patient', 'doctor', 'chw', 'admin'];

export const LoginRegisterScreen: React.FC<Props> = () => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ name: false, phone: false, email: false, password: false });

  const errors = useMemo(() => {
    return {
      name: mode === 'register' && name.length < 2 ? 'Please enter your full name.' : '',
      phone: phone.length >= 10 ? '' : 'Please enter a valid phone number.',
      email: email && !email.includes('@') ? 'Please enter a valid email address.' : '',
      password: password.length >= 6 ? '' : 'Password must be at least 6 characters.'
    };
  }, [name, phone, email, password, mode]);

  const canSubmit = 
    phone.length >= 10 && 
    password.length >= 6 && 
    (mode === 'login' || name.length >= 2);

  const handleSubmit = async () => {
    setTouched({ name: true, phone: true, email: true, password: true });
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    try {
      let response: api.AuthResponse;
      
      if (mode === 'register') {
        response = await api.register({
          full_name: name,
          phone: phone.startsWith('+') ? phone : `+91${phone}`,
          email: email || undefined,
          password,
        });
        Alert.alert('Success', 'Registration successful! You are now logged in.');
      } else {
        response = await api.login({
          phone: phone.startsWith('+') ? phone : `+91${phone}`,
          password,
        });
      }

      // Store the real token from the API
      await login(response.user.role as UserRole, response.access_token);
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert(
        'Authentication Failed',
        error instanceof Error ? error.message : 'Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
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

        {mode === 'register' && (
          <InputField
            label={t('name') || 'Full Name'}
            value={name}
            onChangeText={(v) => { setName(v); setTouched((prev) => ({ ...prev, name: true })); }}
            error={touched.name ? errors.name : ''}
          />
        )}

        <InputField
          label={t('phone') || 'Phone Number'}
          value={phone}
          onChangeText={(v) => { setPhone(v); setTouched((prev) => ({ ...prev, phone: true })); }}
          error={touched.phone ? errors.phone : ''}
          placeholder="+919999999999 or 9999999999"
          keyboardType="phone-pad"
        />

        {mode === 'register' && (
          <InputField
            label={t('email') || 'Email (optional)'}
            value={email}
            onChangeText={(v) => { setEmail(v); setTouched((prev) => ({ ...prev, email: true })); }}
            error={touched.email ? errors.email : ''}
            keyboardType="email-address"
          />
        )}

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

        <PrimaryButton 
          title={mode === 'login' ? t('login') : t('register')} 
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