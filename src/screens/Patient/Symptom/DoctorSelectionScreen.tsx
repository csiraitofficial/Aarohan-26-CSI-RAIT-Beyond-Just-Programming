import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PatientStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { SecondaryButton } from '../../../components/ui/SecondaryButton';
import { usePatient } from '../../../context/PatientContext';
import { theme } from '../../../utils/theme';
import { MOCK_DOCTORS, Doctor } from '../../../data/doctors';

type Props = NativeStackScreenProps<PatientStackParamList, 'DoctorSelectionScreen'>;

export const DoctorSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { latestClassification } = usePatient();

  const handleConfirm = () => {
    if (!selectedDoctor) return;
    const doc = MOCK_DOCTORS.find((d) => d.id === selectedDoctor);
    setConfirmed(true);
    Alert.alert(
      '✅ Appointment Requested',
      `Your consultation with ${doc?.name} has been requested.\n\nYou will receive a notification when the doctor is ready.`,
      [
        {
          text: 'Go to Home',
          onPress: () => navigation.popToTop(),
        },
        {
          text: 'View Records',
          onPress: () => navigation.navigate('RecordsScreen'),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍⚕️ Select a Doctor</Text>
        <Text style={styles.headerSub}>
          Choose a doctor for your consultation. All doctors are verified.
        </Text>
      </View>

      {/* ── Doctor cards ── */}
      {MOCK_DOCTORS.map((doc: Doctor) => {
        const isSelected = selectedDoctor === doc.id;
        return (
          <Pressable key={doc.id} onPress={() => setSelectedDoctor(doc.id)}>
            <Card style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}>
              <View style={styles.cardTop}>
                <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                  <Text style={styles.avatarText}>{doc.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.doctorName}>{doc.name}</Text>
                  <Text style={styles.doctorSpec}>{doc.specialty}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaTag}>⭐ {doc.rating}</Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Text style={styles.metaTag}>{doc.experience}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </View>

              {/* ── Expanded details ── */}
              {isSelected && (
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🕐 Availability</Text>
                    <Text style={styles.detailValue}>{doc.availability}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🗣️ Languages</Text>
                    <Text style={styles.detailValue}>{doc.languages.join(', ')}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>💰 Consultation Fee</Text>
                    <Text style={styles.detailValueFee}>{doc.fee}</Text>
                  </View>
                </View>
              )}
            </Card>
          </Pressable>
        );
      })}

      {/* ── Confirm Button ── */}
      <View style={styles.actions}>
        <PrimaryButton
          title={selectedDoctor ? '✅ Confirm & Request Consultation' : 'Select a Doctor Above'}
          onPress={handleConfirm}
          disabled={!selectedDoctor}
        />
        <View style={styles.spacer} />
        <SecondaryButton title="← Go Back" onPress={() => navigation.goBack()} />
      </View>

      <Text style={styles.disclaimer}>
        💡 In production, this would connect to a real doctor scheduling system.
        Consultation fees are indicative.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, paddingBottom: 50 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.textPrimary },
  headerSub: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 },
  // Doctor cards
  doctorCard: {
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 4,
  },
  doctorCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#EFF6FF',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: theme.colors.primary },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  cardInfo: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  doctorSpec: { fontSize: 13, color: theme.colors.primary, fontWeight: '600', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  metaTag: { fontSize: 12, color: theme.colors.textSecondary },
  metaDot: { fontSize: 10, color: theme.colors.textSecondary },
  checkmark: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  checkmarkText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  // Expanded
  cardDetails: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 13, color: theme.colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, maxWidth: '55%', textAlign: 'right' },
  detailValueFee: { fontSize: 15, fontWeight: '800', color: '#16A34A' },
  // Actions
  actions: { marginTop: 20 },
  spacer: { height: 12 },
  disclaimer: {
    textAlign: 'center', color: theme.colors.textSecondary, fontSize: 12,
    marginTop: 24, lineHeight: 18, fontStyle: 'italic', paddingHorizontal: 8,
  },
});
