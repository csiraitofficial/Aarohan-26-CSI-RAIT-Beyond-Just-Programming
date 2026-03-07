import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

/* ─── Types ─── */
interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  route: string;
}

interface DrugWarning {
  drug: string;
  message: string;
  severity: 'high' | 'moderate';
}

/* ─── Mock ─── */
const PATIENT = {
  name: 'Ravi Kumar',
  age: 45,
  gender: 'M',
  id: 'P-1042',
  allergies: ['Penicillin'],
  currentMeds: ['Metformin 500mg', 'Amlodipine 5mg', 'Aspirin 75mg'],
};

const COMMON_MEDS = [
  'Paracetamol 500mg',
  'Amoxicillin 250mg',
  'Metformin 500mg',
  'Amlodipine 5mg',
  'Omeprazole 20mg',
  'Cetirizine 10mg',
  'Azithromycin 500mg',
  'Ibuprofen 400mg',
  'Pantoprazole 40mg',
  'Atorvastatin 10mg',
];

const FREQUENCIES = ['Once daily', 'Twice daily', 'Thrice daily', 'Every 6 hours', 'As needed', 'Before meals', 'After meals'];
const DURATIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months'];
const ROUTES = ['Oral', 'Topical', 'Injection', 'Inhalation', 'Sublingual'];

export const EPrescriptionScreen: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: '1',
      name: 'Aspirin',
      dosage: '150mg',
      frequency: 'Once daily',
      duration: '14 days',
      instructions: 'Take after food',
      route: 'Oral',
    },
  ]);
  const [diagnosis, setDiagnosis] = useState('Suspected Acute Coronary Syndrome');
  const [notes, setNotes] = useState('Patient presents with chest pain, SOB, and dizziness. ECG recommended urgently.');
  const [followUp, setFollowUp] = useState('3 days');
  const [showAddMed, setShowAddMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFrequency, setNewMedFrequency] = useState('Twice daily');
  const [newMedDuration, setNewMedDuration] = useState('7 days');
  const [newMedRoute, setNewMedRoute] = useState('Oral');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [medSearch, setMedSearch] = useState('');

  const warnings: DrugWarning[] = [];
  medications.forEach((med) => {
    if (PATIENT.allergies.some((a) => med.name.toLowerCase().includes(a.toLowerCase()))) {
      warnings.push({
        drug: med.name,
        message: `Patient is allergic to ${PATIENT.allergies.join(', ')}!`,
        severity: 'high',
      });
    }
    if (med.name.toLowerCase().includes('ibuprofen') && medications.some((m) => m.name.toLowerCase().includes('aspirin'))) {
      warnings.push({
        drug: med.name,
        message: 'Ibuprofen may reduce cardioprotective effect of Aspirin',
        severity: 'moderate',
      });
    }
  });

  const addMedication = () => {
    if (!newMedName.trim()) return;
    const med: Medication = {
      id: Date.now().toString(),
      name: newMedName,
      dosage: newMedDosage || 'As prescribed',
      frequency: newMedFrequency,
      duration: newMedDuration,
      instructions: newMedInstructions || 'As directed',
      route: newMedRoute,
    };
    setMedications((prev) => [...prev, med]);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedInstructions('');
    setShowAddMed(false);
  };

  const removeMedication = (id: string) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
  };

  const filteredCommonMeds = medSearch
    ? COMMON_MEDS.filter((m) => m.toLowerCase().includes(medSearch.toLowerCase()))
    : COMMON_MEDS;

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* ─── Header ─── */}
      <View style={styles.prescriptionHeader}>
        <View style={styles.rxSymbol}>
          <Text style={styles.rxText}>℞</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>E-Prescription</Text>
          <Text style={styles.headerSubtitle}>Generate and send digital prescription</Text>
        </View>
        <View style={styles.dateTag}>
          <Text style={styles.dateTagText}>06 Mar 2026</Text>
        </View>
      </View>

      {/* ─── Patient Summary ─── */}
      <View style={styles.patientSummary}>
        <View style={styles.patientSummaryRow}>
          <View style={styles.patientSummaryAvatar}>
            <MaterialCommunityIcons name="account" size={22} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientSummaryName}>{PATIENT.name}</Text>
            <Text style={styles.patientSummaryMeta}>
              {PATIENT.age}y · {PATIENT.gender === 'M' ? 'Male' : 'Female'} · {PATIENT.id}
            </Text>
          </View>
        </View>
        {PATIENT.allergies.length > 0 && (
          <View style={styles.allergyWarning}>
            <MaterialCommunityIcons name="alert-outline" size={14} color="#DC2626" />
            <Text style={styles.allergyWarningText}>
              Allergies: {PATIENT.allergies.join(', ')}
            </Text>
          </View>
        )}
        <View style={styles.currentMedsRow}>
          <Text style={styles.currentMedsLabel}>Current Medications:</Text>
          <View style={styles.currentMedsChips}>
            {PATIENT.currentMeds.map((m, i) => (
              <View key={i} style={styles.currentMedChip}>
                <Text style={styles.currentMedChipText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ─── Drug Warnings ─── */}
      {warnings.length > 0 && (
        <View style={styles.warningsContainer}>
          {warnings.map((w, i) => (
            <View
              key={i}
              style={[
                styles.warningCard,
                { borderColor: w.severity === 'high' ? '#FECACA' : '#FDE68A' },
              ]}
            >
              <Text style={{ fontSize: 16 }}>
                {w.severity === 'high'
                  ? <MaterialCommunityIcons name="cancel" size={16} color="#DC2626" />
                  : <MaterialCommunityIcons name="alert-outline" size={16} color="#D97706" />}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.warningDrug, { color: w.severity === 'high' ? '#DC2626' : '#D97706' }]}>
                  {w.drug}
                </Text>
                <Text style={styles.warningMsg}>{w.message}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ─── Diagnosis ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}><MaterialCommunityIcons name="hospital-building" size={14} color="#0F172A" /> Diagnosis</Text>
        <TextInput
          style={styles.textArea}
          value={diagnosis}
          onChangeText={setDiagnosis}
          placeholder="Enter diagnosis..."
          placeholderTextColor="#94A3B8"
          multiline
        />
      </View>

      {/* ─── Medications List ─── */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}><MaterialCommunityIcons name="pill" size={14} color="#0F172A" /> Medications ({medications.length})</Text>
          <Pressable style={styles.addMedBtn} onPress={() => setShowAddMed(!showAddMed)}>
            <Text style={styles.addMedBtnText}>{showAddMed ? '✕ Cancel' : '+ Add Med'}</Text>
          </Pressable>
        </View>

        {medications.map((med, i) => (
          <View key={med.id} style={styles.medListCard}>
            <View style={styles.medListHeader}>
              <View style={styles.medListNum}>
                <Text style={styles.medListNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.medListName}>{med.name}</Text>
                <Text style={styles.medListDetails}>
                  {med.dosage} · {med.route} · {med.frequency} · {med.duration}
                </Text>
              </View>
              <Pressable onPress={() => removeMedication(med.id)} style={styles.medRemoveBtn}>
                <MaterialCommunityIcons name="close" size={14} color="#DC2626" />
              </Pressable>
            </View>
            <View style={styles.medListFooter}>
              <Text style={styles.medListInstructions}><MaterialCommunityIcons name="note-text-outline" size={11} color="#94A3B8" /> {med.instructions}</Text>
            </View>
          </View>
        ))}

        {/* Add Medication Form */}
        {showAddMed && (
          <View style={styles.addMedForm}>
            <Text style={styles.addMedFormTitle}>Add New Medication</Text>

            {/* Search / Name */}
            <Text style={styles.fieldLabel}>Medication Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={newMedName || medSearch}
              onChangeText={(t) => { setMedSearch(t); setNewMedName(t); }}
              placeholder="Search or type medication name..."
              placeholderTextColor="#94A3B8"
            />
            {medSearch.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {filteredCommonMeds.map((m, i) => (
                  <Pressable
                    key={i}
                    style={styles.suggestChip}
                    onPress={() => { setNewMedName(m); setMedSearch(''); }}
                  >
                    <Text style={styles.suggestChipText}>{m}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {/* Dosage */}
            <Text style={styles.fieldLabel}>Dosage</Text>
            <TextInput
              style={styles.fieldInput}
              value={newMedDosage}
              onChangeText={setNewMedDosage}
              placeholder="e.g., 500mg, 10ml"
              placeholderTextColor="#94A3B8"
            />

            {/* Route */}
            <Text style={styles.fieldLabel}>Route</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {ROUTES.map((r) => (
                <Pressable
                  key={r}
                  style={[styles.optionChip, newMedRoute === r && styles.optionChipActive]}
                  onPress={() => setNewMedRoute(r)}
                >
                  <Text style={[styles.optionChipText, newMedRoute === r && styles.optionChipTextActive]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Frequency */}
            <Text style={styles.fieldLabel}>Frequency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f}
                  style={[styles.optionChip, newMedFrequency === f && styles.optionChipActive]}
                  onPress={() => setNewMedFrequency(f)}
                >
                  <Text style={[styles.optionChipText, newMedFrequency === f && styles.optionChipTextActive]}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Duration */}
            <Text style={styles.fieldLabel}>Duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.optionChip, newMedDuration === d && styles.optionChipActive]}
                  onPress={() => setNewMedDuration(d)}
                >
                  <Text style={[styles.optionChipText, newMedDuration === d && styles.optionChipTextActive]}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Instructions */}
            <Text style={styles.fieldLabel}>Special Instructions</Text>
            <TextInput
              style={styles.fieldInput}
              value={newMedInstructions}
              onChangeText={setNewMedInstructions}
              placeholder="e.g., Take after food, avoid alcohol"
              placeholderTextColor="#94A3B8"
            />

            <Pressable style={styles.addMedSubmit} onPress={addMedication}>
              <Text style={styles.addMedSubmitText}>+ Add to Prescription</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ─── Clinical Notes ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}><MaterialCommunityIcons name="clipboard-text-outline" size={14} color="#0F172A" /> Clinical Notes</Text>
        <TextInput
          style={[styles.textArea, { height: 80 }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Additional notes..."
          placeholderTextColor="#94A3B8"
          multiline
        />
      </View>

      {/* ─── Follow-up ─── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}><MaterialCommunityIcons name="calendar-outline" size={14} color="#0F172A" /> Follow-up</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['No follow-up', '3 days', '1 week', '2 weeks', '1 month'].map((f) => (
            <Pressable
              key={f}
              style={[styles.optionChip, followUp === f && styles.optionChipActive]}
              onPress={() => setFollowUp(f)}
            >
              <Text style={[styles.optionChipText, followUp === f && styles.optionChipTextActive]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ─── Actions ─── */}
      <View style={styles.actionSection}>
        <Pressable style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.actionBtnIcon}><MaterialCommunityIcons name="send-outline" size={18} color="#FFF" /></Text>
          <Text style={styles.actionBtnText}>Send to Patient</Text>
        </Pressable>
        <View style={styles.actionRow}>
          <Pressable style={[styles.actionBtnSmall, { backgroundColor: '#059669' }]}>
            <Text style={styles.actionBtnSmallText}><MaterialCommunityIcons name="content-save-outline" size={12} color="#FFF" /> Save Draft</Text>
          </Pressable>
          <Pressable style={[styles.actionBtnSmall, { backgroundColor: '#374151' }]}>
            <Text style={styles.actionBtnSmallText}><MaterialCommunityIcons name="printer-outline" size={12} color="#FFF" /> Print</Text>
          </Pressable>
          <Pressable style={[styles.actionBtnSmall, { backgroundColor: '#7C3AED' }]}>
            <Text style={styles.actionBtnSmallText}><MaterialCommunityIcons name="file-pdf-box" size={12} color="#FFF" /> PDF</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  // Header
  prescriptionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  rxSymbol: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  rxText: { fontSize: 24, fontWeight: '900', color: theme.colors.primary },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  dateTag: {
    backgroundColor: '#F1F5F9', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  dateTagText: { fontSize: 11, fontWeight: '700', color: '#64748B' },

  // Patient Summary
  patientSummary: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  patientSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  patientSummaryAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  patientSummaryName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  patientSummaryMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  allergyWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#FECACA',
  },
  allergyWarningText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
  currentMedsRow: { marginTop: 12 },
  currentMedsLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8', marginBottom: 6 },
  currentMedsChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  currentMedChip: {
    backgroundColor: '#F1F5F9', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  currentMedChipText: { fontSize: 11, color: '#475569', fontWeight: '500' },

  // Warnings
  warningsContainer: { paddingHorizontal: 16, marginTop: 8, gap: 6 },
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
    borderWidth: 1,
  },
  warningDrug: { fontSize: 13, fontWeight: '700' },
  warningMsg: { fontSize: 11, color: '#78350F', marginTop: 2 },

  // Sections
  section: { marginHorizontal: 16, marginTop: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    fontSize: 14, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0',
    textAlignVertical: 'top', minHeight: 50,
  },

  // Medication List
  medListCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  medListHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  medListNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  medListNumText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
  medListName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  medListDetails: { fontSize: 11, color: '#64748B', marginTop: 2 },
  medRemoveBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center',
  },
  medListFooter: { marginTop: 8, paddingLeft: 38 },
  medListInstructions: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },

  // Add Med
  addMedBtn: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE',
  },
  addMedBtnText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  addMedForm: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#BFDBFE', marginTop: 4,
  },
  addMedFormTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12,
    fontSize: 14, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10,
  },
  suggestChip: {
    backgroundColor: '#F1F5F9', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 6,
  },
  suggestChipText: { fontSize: 12, color: '#334155', fontWeight: '500' },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, marginRight: 8,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
  },
  optionChipActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  optionChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  optionChipTextActive: { color: '#2563EB', fontWeight: '700' },
  addMedSubmit: {
    backgroundColor: theme.colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  addMedSubmitText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  // Actions
  actionSection: { paddingHorizontal: 16, marginTop: 20 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, gap: 8,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  actionBtnIcon: { fontSize: 18 },
  actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtnSmall: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
  actionBtnSmallText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
