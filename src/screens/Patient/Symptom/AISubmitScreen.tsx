import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { RiskBadge } from '../../../components/ui/RiskBadge';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { EmergencyBanner } from '../../../components/ui/EmergencyBanner';
import { theme } from '../../../utils/theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'AISubmitScreen'>;

export const AISubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { risk, guidance, nextAction, homeRemedies } = route.params;
  const isEmergency = risk === 'emergency';
  const isModerate = risk === 'moderate';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isEmergency && <EmergencyBanner message="🚨 Emergency Attention Required" />}

      {/* Risk badge */}
      <Card style={styles.riskCard}>
        <RiskBadge risk={risk} large />
        <Text style={styles.riskTitle}>
          {risk === 'mild' ? 'Low Risk Condition' : risk === 'moderate' ? 'Doctor Consultation Recommended' : 'Emergency Attention Required'}
        </Text>
      </Card>

      {/* AI guidance */}
      <Card>
        <Text style={styles.sectionTitle}>AI Analysis</Text>
        <Text style={styles.body}>{guidance}</Text>
      </Card>

      {/* Next action */}
      <Card>
        <Text style={styles.sectionTitle}>Recommended Next Step</Text>
        <Text style={styles.body}>{nextAction}</Text>
      </Card>

      {/* Home remedies for mild */}
      {homeRemedies && homeRemedies.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>Home Remedies</Text>
          {homeRemedies.map((r: string, i: number) => (
            <Text key={i} style={styles.remedy}>• {r}</Text>
          ))}
        </Card>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {isEmergency && (
          <>
            <PrimaryButton title="📞 Call Emergency" variant="danger" onPress={() => Linking.openURL('tel:112')} />
            <View style={styles.spacer} />
            <PrimaryButton title="📍 Share Location" variant="danger" onPress={() => {}} />
            <View style={styles.spacer} />
            <SecondaryButton title="Alert Nearby Doctor" onPress={() => {}} />
          </>
        )}
        {isModerate && (
          <>
            <PrimaryButton title="🩺 Connect to Doctor" onPress={() => {}} />
            <View style={styles.spacer} />
            <SecondaryButton title="Schedule Consultation" onPress={() => {}} />
          </>
        )}
        {risk === 'mild' && (
          <>
            <PrimaryButton title="💾 Save to Records" onPress={() => navigation.navigate('RecordsScreen')} />
            <View style={styles.spacer} />
            <SecondaryButton title="🔔 Set Reminder" onPress={() => navigation.navigate('RemindersScreen')} />
            <View style={styles.spacer} />
            <SecondaryButton title="Talk to Doctor (Optional)" onPress={() => {}} />
          </>
        )}
        <View style={styles.spacer} />
        <SecondaryButton title="← Back to Home" onPress={() => navigation.popToTop()} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 50 },
  riskCard: { alignItems: 'center', paddingVertical: 28 },
  riskTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.textPrimary, marginTop: 12, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8, color: theme.colors.textPrimary },
  body: { color: theme.colors.textSecondary, lineHeight: 22 },
  remedy: { color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 4 },
  actions: { marginTop: 20 },
  spacer: { height: 12 },
});
