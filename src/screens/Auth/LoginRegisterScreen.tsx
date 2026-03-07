import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Card } from '../../components/ui/Card';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { UserRole } from '../../models';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { login as apiLogin, register as apiRegister, RegisterData } from '../../services/api';
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

  const [mode, setMode]         = useState<'login' | 'register'>('login');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // --- Login fields ---
  const [loginPhone, setLoginPhone]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPwd, setShowLoginPwd]   = useState(false);

  // --- Register fields ---
  const [regStep, setRegStep]   = useState(1); // 1 = role, 2 = common info, 3 = role-specific
  const [role, setRole]         = useState<UserRole>('patient');

  // Common register fields
  const [fullName, setFullName]             = useState('');
  const [regPhone, setRegPhone]             = useState('');
  const [regPassword, setRegPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPwd, setShowRegPwd]         = useState(false);

  // Patient fields
  const [dob, setDob]                       = useState('');
  const [gender, setGender]                 = useState('');
  const [language, setLanguage]             = useState('en');

  // Doctor fields
  const [licenseNumber, setLicenseNumber]   = useState('');
  const [specialization, setSpecialization] = useState('');
  const [hospitalName, setHospitalName]     = useState('');

  // CHW fields
  const [workerId, setWorkerId]             = useState('');
  const [assignedDistrict, setAssignedDistrict] = useState('');

  const resetRegister = () => {
    setRegStep(1);
    setFullName(''); setRegPhone(''); setRegPassword(''); setConfirmPassword('');
    setDob(''); setGender(''); setLanguage('en');
    setLicenseNumber(''); setSpecialization(''); setHospitalName('');
    setWorkerId(''); setAssignedDistrict('');
    setError(null);
  };

  // ─── LOGIN HANDLER ───────────────────────────────────
  const handleLogin = async () => {
    setError(null);
    if (!loginPhone.trim()) { setError('Phone number is required'); return; }
    if (!loginPassword) { setError('Password is required'); return; }
    setLoading(true);
    try {
      const res = await apiLogin({ phone: loginPhone.trim(), password: loginPassword });
      login(res.user.role as UserRole, res.access_token, res.user.id, res.user.full_name, res.user.phone);
    } catch (e: any) {
      setError(e?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── REGISTER HANDLER ────────────────────────────────
  const handleRegister = async () => {
    setError(null);
    if (!fullName.trim()) { setError('Full name is required'); return; }
    if (!regPhone.trim()) { setError('Phone number is required'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (regPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    if (role === 'doctor' && !licenseNumber.trim()) { setError('License number is required'); return; }
    if (role === 'chw' && !workerId.trim()) { setError('Worker ID is required'); return; }

    const data: RegisterData = {
      full_name: fullName.trim(),
      phone: regPhone.trim(),
      password: regPassword,
      role: role.toUpperCase(),
      date_of_birth: dob || undefined,
      gender: gender || undefined,
      language_preference: language || 'en',
    };

    if (role === 'doctor') {
      data.license_number = licenseNumber.trim();
      data.specialization = specialization.trim() || undefined;
      data.hospital_name = hospitalName.trim() || undefined;
    } else if (role === 'chw') {
      data.worker_id = workerId.trim();
      data.assigned_district = assignedDistrict.trim() || undefined;
    }

    setLoading(true);
    try {
      const res = await apiRegister(data);
      login(res.user.role as UserRole, res.access_token, res.user.id, res.user.full_name, res.user.phone);
    } catch (e: any) {
      setError(e?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP NAVIGATION ─────────────────────────────────
  const canGoNext = () => {
    if (regStep === 2) {
      return fullName.trim() && regPhone.trim() && regPassword.length >= 6 && regPassword === confirmPassword;
    }
    return true;
  };

  const totalSteps = (role === 'patient' || role === 'admin') ? 3 : 3;

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        <Text style={styles.title}>Swasthya Saathi</Text>
        <Text style={styles.subtitle}>Your Health Companion</Text>

        {/* Login / Register tabs */}
        <View style={styles.modeRow}>
          <Pressable onPress={() => { setMode('login'); setError(null); }}>
            <Text style={[styles.modeText, mode === 'login' && styles.modeActive]}>{t('login')}</Text>
          </Pressable>
          <Pressable onPress={() => { setMode('register'); resetRegister(); }}>
            <Text style={[styles.modeText, mode === 'register' && styles.modeActive]}>{t('register')}</Text>
          </Pressable>
        </View>

        {/* ──── LOGIN TAB ──── */}
        {mode === 'login' && (
          <>
            <InputField
              label="Phone Number"
              value={loginPhone}
              onChangeText={setLoginPhone}
              keyboardType="phone-pad"
            />
            <View>
              <InputField
                label="Password"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry={!showLoginPwd}
              />
              <Pressable style={styles.eyeBtn} onPress={() => setShowLoginPwd(!showLoginPwd)}>
                <MaterialCommunityIcons name={showLoginPwd ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
              </Pressable>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 12 }} />
            ) : (
              <PrimaryButton title="Login" onPress={handleLogin} />
            )}
          </>
        )}

        {/* ──── REGISTER TAB ──── */}
        {mode === 'register' && (
          <>
            {/* Step indicator */}
            <View style={styles.stepsRow}>
              {[1, 2, 3].map((s) => (
                <View key={s} style={[styles.stepDot, s === regStep && styles.stepDotActive, s < regStep && styles.stepDotDone]} />
              ))}
            </View>
            <Text style={styles.stepLabel}>
              {regStep === 1 ? 'Select Your Role' : regStep === 2 ? 'Basic Information' : 'Additional Details'}
            </Text>

            {/* STEP 1: role selection */}
            {regStep === 1 && (
              <>
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
                <PrimaryButton title="Next" onPress={() => setRegStep(2)} />
              </>
            )}

            {/* STEP 2: common fields */}
            {regStep === 2 && (
              <>
                <InputField label="Full Name" value={fullName} onChangeText={setFullName} />
                <InputField label="Phone Number" value={regPhone} onChangeText={setRegPhone} keyboardType="phone-pad" />
                <View>
                  <InputField label="Password" value={regPassword} onChangeText={setRegPassword} secureTextEntry={!showRegPwd} />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowRegPwd(!showRegPwd)}>
                    <MaterialCommunityIcons name={showRegPwd ? 'eye-off' : 'eye'} size={20} color="#94A3B8" />
                  </Pressable>
                </View>
                <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.btnRow}>
                  <Pressable onPress={() => setRegStep(1)} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Back</Text>
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton
                      title="Next"
                      onPress={() => {
                        setError(null);
                        if (!fullName.trim()) { setError('Full name is required'); return; }
                        if (!regPhone.trim()) { setError('Phone number is required'); return; }
                        if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
                        if (regPassword !== confirmPassword) { setError('Passwords do not match'); return; }
                        setRegStep(3);
                      }}
                    />
                  </View>
                </View>
              </>
            )}

            {/* STEP 3: role-specific fields */}
            {regStep === 3 && (
              <>
                {role === 'patient' && (
                  <>
                    <InputField label="Date of Birth (YYYY-MM-DD)" value={dob} onChangeText={setDob} />
                    <InputField label="Gender" value={gender} onChangeText={setGender} />
                    <InputField label="Preferred Language (en, hi, bn...)" value={language} onChangeText={setLanguage} />
                  </>
                )}
                {role === 'doctor' && (
                  <>
                    <InputField label="License Number *" value={licenseNumber} onChangeText={setLicenseNumber} />
                    <InputField label="Specialization" value={specialization} onChangeText={setSpecialization} />
                    <InputField label="Hospital Name" value={hospitalName} onChangeText={setHospitalName} />
                  </>
                )}
                {role === 'chw' && (
                  <>
                    <InputField label="Worker ID *" value={workerId} onChangeText={setWorkerId} />
                    <InputField label="Assigned District" value={assignedDistrict} onChangeText={setAssignedDistrict} />
                  </>
                )}
                {role === 'admin' && (
                  <Text style={styles.infoText}>No additional details needed for Admin.</Text>
                )}

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.btnRow}>
                  <Pressable onPress={() => setRegStep(2)} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Back</Text>
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    {loading ? (
                      <ActivityIndicator size="large" color={theme.colors.primary} />
                    ) : (
                      <PrimaryButton
                        title={'Register as ' + role.charAt(0).toUpperCase() + role.slice(1)}
                        onPress={handleRegister}
                      />
                    )}
                  </View>
                </View>
              </>
            )}
          </>
        )}
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
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
    borderRadius: 5,
  },
  stepDotDone: {
    backgroundColor: '#059669',
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
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
  roleText: {
    fontSize: 13,
    flex: 1,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: 32,
    padding: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backBtnText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
});