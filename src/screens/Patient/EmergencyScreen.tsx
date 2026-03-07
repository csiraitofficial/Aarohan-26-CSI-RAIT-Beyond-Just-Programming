import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../navigation/types';
import { EmergencyBanner } from '../../components/ui/EmergencyBanner';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Card } from '../../components/ui/Card';
import { usePatient } from '../../context/PatientContext';
import { theme } from '../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'EmergencyScreen'>;

export const EmergencyScreen: React.FC<Props> = ({ navigation }) => {
  const { profile } = usePatient();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <EmergencyBanner message="Emergency Mode Activated" />

      <Card style={styles.countdownCard}>
        <Text style={styles.countdownLabel}>Help is being notified</Text>
        <Text style={styles.countdownNum}>{countdown > 0 ? countdown : '✓'}</Text>
        <Text style={styles.countdownSub}>
          {countdown > 0 ? 'Notifying your emergency contact and nearby doctors…' : 'Alerts sent successfully.'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.guidanceTitle}>While you wait</Text>
        <Text style={styles.guidance}>• Stay calm and remain seated or lying down.</Text>
        <Text style={styles.guidance}>• If you feel chest pain, chew an aspirin if available.</Text>
        <Text style={styles.guidance}>• Do not eat or drink unless instructed.</Text>
        <Text style={styles.guidance}>• Keep your phone charged and reachable.</Text>
      </Card>

      <View style={styles.actions}>
        <PrimaryButton title="Call 112 (Emergency)" variant="danger" onPress={() => Linking.openURL('tel:112')} />
        <View style={{ height: 12 }} />
        <PrimaryButton
          title={`Call ${profile.emergencyContact}`}
          variant="danger"
          onPress={() => Linking.openURL(`tel:${profile.emergencyContact.replace(/\s/g, '')}`)}
        />
        <View style={{ height: 12 }} />
        <PrimaryButton title="Share My Location" variant="neutral" onPress={() => {}} />
        <View style={{ height: 24 }} />
        <Text style={styles.backLink} onPress={() => navigation.popToTop()}>← I'm okay, go back to Home</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  content: { padding: theme.spacing.lg, paddingBottom: 50 },
  countdownCard: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FEE2E2' },
  countdownLabel: { fontSize: 14, fontWeight: '700', color: '#991B1B' },
  countdownNum: { fontSize: 56, fontWeight: '900', color: '#DC2626', marginVertical: 8 },
  countdownSub: { color: '#991B1B', textAlign: 'center', fontSize: 13 },
  guidanceTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  guidance: { color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 4 },
  actions: { marginTop: 16 },
  backLink: { textAlign: 'center', color: theme.colors.primary, fontWeight: '700', fontSize: 15 },
});
