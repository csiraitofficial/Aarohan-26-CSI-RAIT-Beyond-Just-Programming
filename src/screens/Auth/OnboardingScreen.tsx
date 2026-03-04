import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useLanguage } from '../../context/LanguageContext';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.illustration}>🏥</Text>
        <Text style={styles.logo}>Aarohan</Text>
        <Text style={styles.tagline}>{t('tagline')}</Text>
        <LanguageSwitcher />
      </View>
      <PrimaryButton title={t('continue')} onPress={() => navigation.navigate('Auth')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    justifyContent: 'space-between'
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  illustration: {
    fontSize: 64
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textPrimary
  },
  tagline: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 16,
    paddingHorizontal: 20
  }
});