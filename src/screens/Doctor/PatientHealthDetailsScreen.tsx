import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../../utils/theme';

/* ─── Mock Patient Data ─── */
interface PatientDetail {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  location: string;
  bloodGroup: string;
  emergencyContact: string;
  insuranceId: string;
  symptoms: Array<{ name: string; duration: string; severity: 'mild' | 'moderate' | 'severe' }>;
  vitals: {
    heartRate: number;
    bloodPressure: string;
    spo2: number;
    temperature: number;
    respiratoryRate: number;
    bloodSugar: number;
  };
  medicalHistory: Array<{ condition: string; since: string; status: 'active' | 'resolved' }>;
  allergies: Array<{ substance: string; reaction: string; severity: 'mild' | 'moderate' | 'severe' }>;
  currentMedications: Array<{ name: string; dosage: string; frequency: string }>;
  reports: Array<{ name: string; date: string; type: string; status: 'normal' | 'abnormal' }>;
  pastVisits: Array<{ date: string; reason: string; doctor: string }>;
}

const PATIENT: PatientDetail = {
  id: 'P-1042',
  name: 'Ravi Kumar',
  age: 45,
  gender: 'M',
  phone: '+91 98765 43210',
  email: 'ravi.kumar@email.com',
  location: 'Mumbai, Maharashtra',
  bloodGroup: 'B+',
  emergencyContact: '+91 98765 99999',
  insuranceId: 'INS-2024-78432',
  symptoms: [
    { name: 'Chest pain', duration: '2 hours', severity: 'severe' },
    { name: 'Shortness of breath', duration: '3 hours', severity: 'severe' },
    { name: 'Dizziness', duration: '1 hour', severity: 'moderate' },
    { name: 'Sweating', duration: '2 hours', severity: 'moderate' },
  ],
  vitals: {
    heartRate: 112,
    bloodPressure: '160/100',
    spo2: 89,
    temperature: 99.2,
    respiratoryRate: 24,
    bloodSugar: 180,
  },
  medicalHistory: [
    { condition: 'Hypertension', since: '2018', status: 'active' },
    { condition: 'Type 2 Diabetes', since: '2020', status: 'active' },
    { condition: 'Appendectomy', since: '2015', status: 'resolved' },
  ],
  allergies: [
    { substance: 'Penicillin', reaction: 'Rash, Hives', severity: 'severe' },
    { substance: 'Shellfish', reaction: 'Itching', severity: 'mild' },
  ],
  currentMedications: [
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
    { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
    { name: 'Aspirin', dosage: '75mg', frequency: 'Once daily' },
  ],
  reports: [
    { name: 'CBC Report', date: '28 Feb 2026', type: 'Blood Test', status: 'normal' },
    { name: 'ECG Report', date: '01 Mar 2026', type: 'Cardiac', status: 'abnormal' },
    { name: 'Lipid Profile', date: '25 Feb 2026', type: 'Blood Test', status: 'abnormal' },
    { name: 'Chest X-Ray', date: '01 Mar 2026', type: 'Radiology', status: 'normal' },
    { name: 'HbA1c', date: '20 Feb 2026', type: 'Blood Test', status: 'abnormal' },
  ],
  pastVisits: [
    { date: '15 Feb 2026', reason: 'Routine checkup', doctor: 'Dr. Mehta' },
    { date: '02 Jan 2026', reason: 'Diabetes follow-up', doctor: 'Dr. Sharma' },
    { date: '10 Dec 2025', reason: 'Chest discomfort', doctor: 'Dr. Patel' },
  ],
};

/* Drug interaction database */
const DRUG_INTERACTIONS: Array<{
  drug1: string;
  drug2: string;
  severity: 'high' | 'moderate' | 'low';
  description: string;
}> = [
  {
    drug1: 'Aspirin',
    drug2: 'Ibuprofen',
    severity: 'high',
    description: 'Concurrent use increases risk of GI bleeding. Ibuprofen may reduce the cardioprotective effects of aspirin.',
  },
  {
    drug1: 'Metformin',
    drug2: 'Contrast Dye',
    severity: 'high',
    description: 'Risk of lactic acidosis. Discontinue metformin 48 hours before contrast procedures.',
  },
  {
    drug1: 'Amlodipine',
    drug2: 'Simvastatin',
    severity: 'moderate',
    description: 'Amlodipine may increase simvastatin levels. Limit simvastatin dose to 20mg/day.',
  },
];

type TabKey = 'symptoms' | 'vitals' | 'history' | 'reports' | 'medications';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'symptoms', label: 'Symptoms', icon: '🩺' },
  { key: 'vitals', label: 'Vitals', icon: '❤️' },
  { key: 'history', label: 'History', icon: '📂' },
  { key: 'reports', label: 'Reports', icon: '📄' },
  { key: 'medications', label: 'Meds', icon: '💊' },
];

export const PatientHealthDetailsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('symptoms');
  const [showDrugAlert, setShowDrugAlert] = useState(true);

  const SEVERITY_COLORS = {
    mild: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
    moderate: { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    severe: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  };

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* ─── Drug Interaction Alert ─── */}
      {showDrugAlert && (
        <View style={styles.drugAlert}>
          <View style={styles.drugAlertHeader}>
            <View style={styles.drugAlertIconContainer}>
              <Text style={{ fontSize: 20 }}>⚠️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.drugAlertTitle}>Drug Interaction Warning</Text>
              <Text style={styles.drugAlertSubtitle}>
                {DRUG_INTERACTIONS.length} potential interactions detected
              </Text>
            </View>
            <Pressable onPress={() => setShowDrugAlert(false)} style={styles.drugAlertClose}>
              <Text style={{ color: '#92400E', fontSize: 16 }}>✕</Text>
            </Pressable>
          </View>
          {DRUG_INTERACTIONS.filter((d) => d.severity === 'high').map((interaction, i) => (
            <View key={i} style={styles.drugAlertItem}>
              <View style={styles.drugAlertSeverity}>
                <Text style={styles.drugAlertSeverityText}>HIGH</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.drugAlertDrugs}>
                  {interaction.drug1} + {interaction.drug2}
                </Text>
                <Text style={styles.drugAlertDesc}>{interaction.description}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ─── Patient Profile Card ─── */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatarContainer}>
            <View style={styles.profileAvatar}>
              <Text style={{ fontSize: 32 }}>{PATIENT.gender === 'M' ? '👨' : '👩'}</Text>
            </View>
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{PATIENT.name}</Text>
            <Text style={styles.profileMeta}>
              {PATIENT.age} yrs · {PATIENT.gender === 'M' ? 'Male' : 'Female'} · {PATIENT.bloodGroup}
            </Text>
            <Text style={styles.profileId}>{PATIENT.id}</Text>
          </View>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>Emergency</Text>
          </View>
        </View>

        {/* Quick Info Grid */}
        <View style={styles.quickInfoGrid}>
          <QuickInfoItem icon="📍" label="Location" value={PATIENT.location} />
          <QuickInfoItem icon="📞" label="Phone" value={PATIENT.phone} />
          <QuickInfoItem icon="🆘" label="Emergency" value={PATIENT.emergencyContact} />
          <QuickInfoItem icon="🏥" label="Insurance" value={PATIENT.insuranceId} />
        </View>
      </View>

      {/* ─── Vitals Overview Strip ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.vitalsStrip}
        contentContainerStyle={styles.vitalsStripContent}
      >
        <VitalStripItem
          icon="💓"
          label="Heart Rate"
          value={`${PATIENT.vitals.heartRate}`}
          unit="bpm"
          alert={PATIENT.vitals.heartRate > 100}
          trend="up"
        />
        <VitalStripItem
          icon="🩸"
          label="Blood Pressure"
          value={PATIENT.vitals.bloodPressure}
          unit="mmHg"
          alert={true}
          trend="up"
        />
        <VitalStripItem
          icon="🫁"
          label="SpO₂"
          value={`${PATIENT.vitals.spo2}`}
          unit="%"
          alert={PATIENT.vitals.spo2 < 92}
          trend="down"
        />
        <VitalStripItem
          icon="🌡️"
          label="Temp"
          value={`${PATIENT.vitals.temperature}`}
          unit="°F"
          alert={PATIENT.vitals.temperature > 100.4}
          trend="stable"
        />
        <VitalStripItem
          icon="🌬"
          label="Resp Rate"
          value={`${PATIENT.vitals.respiratoryRate}`}
          unit="/min"
          alert={PATIENT.vitals.respiratoryRate > 20}
          trend="up"
        />
        <VitalStripItem
          icon="🍬"
          label="Blood Sugar"
          value={`${PATIENT.vitals.bloodSugar}`}
          unit="mg/dL"
          alert={PATIENT.vitals.bloodSugar > 140}
          trend="up"
        />
      </ScrollView>

      {/* ─── Tab Navigation ─── */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={{ fontSize: 16 }}>{tab.icon}</Text>
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ─── Tab Content ─── */}
      <View style={styles.tabContent}>
        {activeTab === 'symptoms' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🩺 Symptoms Summary</Text>
              <View style={styles.symptomCount}>
                <Text style={styles.symptomCountText}>{PATIENT.symptoms.length} Active</Text>
              </View>
            </View>
            {PATIENT.symptoms.map((symptom, i) => {
              const sev = SEVERITY_COLORS[symptom.severity];
              return (
                <View key={i} style={styles.symptomCard}>
                  <View style={styles.symptomCardHeader}>
                    <View style={[styles.severityDot, { backgroundColor: sev.color }]} />
                    <Text style={styles.symptomName}>{symptom.name}</Text>
                    <View style={[styles.severityBadge, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                      <Text style={[styles.severityText, { color: sev.color }]}>
                        {symptom.severity.charAt(0).toUpperCase() + symptom.severity.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.symptomDetails}>
                    <Text style={styles.symptomDuration}>⏱ Duration: {symptom.duration}</Text>
                  </View>
                </View>
              );
            })}

            {/* AI Assessment Summary */}
            <View style={styles.aiAssessmentCard}>
              <View style={styles.aiAssessmentHeader}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
                <Text style={styles.aiAssessmentTitle}>AI Clinical Assessment</Text>
              </View>
              <View style={styles.aiAssessmentBody}>
                <Text style={styles.aiAssessmentText}>
                  Based on symptom analysis, the patient presents with symptoms consistent with{' '}
                  <Text style={{ fontWeight: '700', color: '#DC2626' }}>Acute Coronary Syndrome</Text>.
                  Combination of chest pain, shortness of breath, and elevated heart rate with low SpO₂
                  suggests immediate cardiac evaluation is recommended.
                </Text>
                <View style={styles.aiAssessmentFlags}>
                  <Text style={styles.aiFlagTitle}>Red Flags Detected:</Text>
                  <View style={styles.aiFlagItem}>
                    <Text style={{ color: '#DC2626' }}>⚡</Text>
                    <Text style={styles.aiFlagText}>SpO₂ below 90% — Critical oxygen levels</Text>
                  </View>
                  <View style={styles.aiFlagItem}>
                    <Text style={{ color: '#DC2626' }}>⚡</Text>
                    <Text style={styles.aiFlagText}>Tachycardia with chest pain — Cardiac risk</Text>
                  </View>
                  <View style={styles.aiFlagItem}>
                    <Text style={{ color: '#DC2626' }}>⚡</Text>
                    <Text style={styles.aiFlagText}>History of hypertension + diabetes — Compounding factors</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'vitals' && (
          <View>
            <Text style={styles.sectionTitle}>❤️ Detailed Vitals</Text>
            <View style={styles.vitalsDetailGrid}>
              <VitalDetailCard
                icon="💓"
                label="Heart Rate"
                value={`${PATIENT.vitals.heartRate}`}
                unit="bpm"
                normal="60-100"
                status={PATIENT.vitals.heartRate > 100 ? 'critical' : 'normal'}
              />
              <VitalDetailCard
                icon="🩸"
                label="Blood Pressure"
                value={PATIENT.vitals.bloodPressure}
                unit="mmHg"
                normal="120/80"
                status="critical"
              />
              <VitalDetailCard
                icon="🫁"
                label="Oxygen Sat."
                value={`${PATIENT.vitals.spo2}`}
                unit="%"
                normal="95-100"
                status={PATIENT.vitals.spo2 < 92 ? 'critical' : 'warning'}
              />
              <VitalDetailCard
                icon="🌡️"
                label="Temperature"
                value={`${PATIENT.vitals.temperature}`}
                unit="°F"
                normal="97.8-99.1"
                status={PATIENT.vitals.temperature > 100.4 ? 'warning' : 'normal'}
              />
              <VitalDetailCard
                icon="🌬"
                label="Resp. Rate"
                value={`${PATIENT.vitals.respiratoryRate}`}
                unit="/min"
                normal="12-20"
                status={PATIENT.vitals.respiratoryRate > 20 ? 'warning' : 'normal'}
              />
              <VitalDetailCard
                icon="🍬"
                label="Blood Sugar"
                value={`${PATIENT.vitals.bloodSugar}`}
                unit="mg/dL"
                normal="70-140"
                status={PATIENT.vitals.bloodSugar > 140 ? 'warning' : 'normal'}
              />
            </View>

            {/* Vitals Trend Mini-chart placeholder */}
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>📈 Vitals Trend (Last 7 Days)</Text>
              <View style={styles.trendChart}>
                <View style={styles.trendRow}>
                  <Text style={styles.trendLabel}>HR</Text>
                  {[92, 88, 95, 98, 105, 108, 112].map((v, i) => (
                    <View key={i} style={styles.trendBarContainer}>
                      <View
                        style={[
                          styles.trendBar,
                          { height: v * 0.5, backgroundColor: v > 100 ? '#DC2626' : '#3B82F6' },
                        ]}
                      />
                      <Text style={styles.trendBarLabel}>{v}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'history' && (
          <View>
            <Text style={styles.sectionTitle}>📂 Medical History</Text>
            {PATIENT.medicalHistory.map((item, i) => (
              <View key={i} style={styles.historyCard}>
                <View style={styles.historyCardHeader}>
                  <View
                    style={[
                      styles.historyStatusDot,
                      { backgroundColor: item.status === 'active' ? '#DC2626' : '#059669' },
                    ]}
                  />
                  <Text style={styles.historyCondition}>{item.condition}</Text>
                  <View
                    style={[
                      styles.historyStatusBadge,
                      {
                        backgroundColor: item.status === 'active' ? '#FEF2F2' : '#ECFDF5',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyStatusText,
                        { color: item.status === 'active' ? '#DC2626' : '#059669' },
                      ]}
                    >
                      {item.status === 'active' ? 'Active' : 'Resolved'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historySince}>Since {item.since}</Text>
              </View>
            ))}

            {/* Allergies */}
            <View style={styles.allergySectionCard}>
              <Text style={styles.allergySectionTitle}>⚠️ Allergies & Sensitivities</Text>
              {PATIENT.allergies.map((allergy, i) => {
                const sev = SEVERITY_COLORS[allergy.severity];
                return (
                  <View key={i} style={styles.allergyDetailCard}>
                    <View style={styles.allergyDetailHeader}>
                      <View style={[styles.allergyIcon, { backgroundColor: sev.bg }]}>
                        <Text style={{ fontSize: 16 }}>⚠️</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.allergySubstance}>{allergy.substance}</Text>
                        <Text style={styles.allergyReaction}>Reaction: {allergy.reaction}</Text>
                      </View>
                      <View style={[styles.severityBadge, { backgroundColor: sev.bg, borderColor: sev.border }]}>
                        <Text style={[styles.severityText, { color: sev.color }]}>
                          {allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Past Visits */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.sectionTitle}>🏥 Past Visits</Text>
              {PATIENT.pastVisits.map((visit, i) => (
                <View key={i} style={styles.visitCard}>
                  <View style={styles.visitTimeline}>
                    <View style={styles.visitDot} />
                    {i < PATIENT.pastVisits.length - 1 && <View style={styles.visitLine} />}
                  </View>
                  <View style={styles.visitContent}>
                    <Text style={styles.visitDate}>{visit.date}</Text>
                    <Text style={styles.visitReason}>{visit.reason}</Text>
                    <Text style={styles.visitDoctor}>{visit.doctor}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'reports' && (
          <View>
            <Text style={styles.sectionTitle}>📄 Medical Reports</Text>
            {PATIENT.reports.map((report, i) => (
              <Pressable key={i} style={styles.reportCard}>
                <View style={styles.reportIcon}>
                  <Text style={{ fontSize: 22 }}>
                    {report.type === 'Blood Test' ? '🩸' : report.type === 'Cardiac' ? '❤️' : '📷'}
                  </Text>
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportName}>{report.name}</Text>
                  <Text style={styles.reportMeta}>
                    {report.type} · {report.date}
                  </Text>
                </View>
                <View
                  style={[
                    styles.reportStatus,
                    {
                      backgroundColor: report.status === 'normal' ? '#ECFDF5' : '#FEF2F2',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: report.status === 'normal' ? '#059669' : '#DC2626',
                    }}
                  >
                    {report.status === 'normal' ? 'Normal' : 'Abnormal'}
                  </Text>
                </View>
                <Text style={styles.reportArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === 'medications' && (
          <View>
            <Text style={styles.sectionTitle}>💊 Current Medications</Text>
            {PATIENT.currentMedications.map((med, i) => (
              <View key={i} style={styles.medCard}>
                <View style={styles.medIcon}>
                  <Text style={{ fontSize: 20 }}>💊</Text>
                </View>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{med.name}</Text>
                  <Text style={styles.medDosage}>
                    {med.dosage} · {med.frequency}
                  </Text>
                </View>
                {DRUG_INTERACTIONS.some(
                  (d) => d.drug1 === med.name || d.drug2 === med.name
                ) && (
                  <View style={styles.medWarning}>
                    <Text style={{ fontSize: 14 }}>⚠️</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Drug Interaction Detail */}
            <View style={styles.interactionSection}>
              <Text style={styles.interactionTitle}>🔬 Known Interactions</Text>
              {DRUG_INTERACTIONS.map((interaction, i) => (
                <View key={i} style={styles.interactionCard}>
                  <View style={styles.interactionHeader}>
                    <View
                      style={[
                        styles.interactionSeverityBadge,
                        {
                          backgroundColor:
                            interaction.severity === 'high'
                              ? '#FEF2F2'
                              : interaction.severity === 'moderate'
                              ? '#FFFBEB'
                              : '#ECFDF5',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color:
                            interaction.severity === 'high'
                              ? '#DC2626'
                              : interaction.severity === 'moderate'
                              ? '#D97706'
                              : '#059669',
                        }}
                      >
                        {interaction.severity.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.interactionDrugs}>
                      {interaction.drug1} × {interaction.drug2}
                    </Text>
                  </View>
                  <Text style={styles.interactionDesc}>{interaction.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ─── Quick Action Footer ─── */}
      <View style={styles.quickActionFooter}>
        <Pressable style={[styles.footerBtn, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.footerBtnIcon}>💬</Text>
          <Text style={styles.footerBtnText}>Start Consultation</Text>
        </Pressable>
        <Pressable style={[styles.footerBtn, { backgroundColor: '#059669' }]}>
          <Text style={styles.footerBtnIcon}>📝</Text>
          <Text style={styles.footerBtnText}>E-Prescription</Text>
        </Pressable>
        <Pressable style={[styles.footerBtn, { backgroundColor: '#DC2626' }]}>
          <Text style={styles.footerBtnIcon}>🚨</Text>
          <Text style={styles.footerBtnText}>Emergency Alert</Text>
        </Pressable>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */

const QuickInfoItem: React.FC<{ icon: string; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.quickInfoItem}>
    <Text style={{ fontSize: 14 }}>{icon}</Text>
    <View>
      <Text style={styles.quickInfoLabel}>{label}</Text>
      <Text style={styles.quickInfoValue}>{value}</Text>
    </View>
  </View>
);

const VitalStripItem: React.FC<{
  icon: string;
  label: string;
  value: string;
  unit: string;
  alert: boolean;
  trend: 'up' | 'down' | 'stable';
}> = ({ icon, label, value, unit, alert, trend }) => (
  <View style={[styles.vitalStripItem, alert && styles.vitalStripItemAlert]}>
    <View style={styles.vitalStripTop}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
      <Text style={{ fontSize: 12, color: trend === 'up' ? '#DC2626' : trend === 'down' ? '#3B82F6' : '#059669' }}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
      </Text>
    </View>
    <Text style={[styles.vitalStripValue, alert && { color: '#DC2626' }]}>{value}</Text>
    <Text style={styles.vitalStripUnit}>{unit}</Text>
    <Text style={styles.vitalStripLabel}>{label}</Text>
  </View>
);

const VitalDetailCard: React.FC<{
  icon: string;
  label: string;
  value: string;
  unit: string;
  normal: string;
  status: 'normal' | 'warning' | 'critical';
}> = ({ icon, label, value, unit, normal, status }) => {
  const statusConfig = {
    normal: { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', label: 'Normal' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', label: 'Warning' },
    critical: { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', label: 'Critical' },
  };
  const cfg = statusConfig[status];

  return (
    <View style={[styles.vitalDetailCard, { borderColor: cfg.border, backgroundColor: '#FFF' }]}>
      <View style={[styles.vitalDetailStatus, { backgroundColor: cfg.bg }]}>
        <Text style={{ fontSize: 8, color: cfg.color, fontWeight: '800' }}>{cfg.label}</Text>
      </View>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
      <Text style={[styles.vitalDetailValue, { color: cfg.color }]}>{value}</Text>
      <Text style={styles.vitalDetailUnit}>{unit}</Text>
      <Text style={styles.vitalDetailLabel}>{label}</Text>
      <Text style={styles.vitalDetailNormal}>Normal: {normal}</Text>
    </View>
  );
};

/* ═══════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  // Drug Interaction Alert
  drugAlert: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  drugAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  drugAlertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drugAlertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  drugAlertSubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  drugAlertClose: {
    padding: 4,
  },
  drugAlertItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    alignItems: 'flex-start',
  },
  drugAlertSeverity: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  drugAlertSeverityText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  drugAlertDrugs: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
  },
  drugAlertDesc: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
    lineHeight: 16,
  },

  // Profile Card
  profileCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileAvatarContainer: {
    position: 'relative',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#BFDBFE',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileMeta: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  profileId: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  profileBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  profileBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // Quick Info Grid
  quickInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  quickInfoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
  },
  quickInfoLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  quickInfoValue: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  // Vitals Strip
  vitalsStrip: {
    marginTop: 12,
    flexGrow: 0,
  },
  vitalsStripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  vitalStripItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    width: 110,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalStripItemAlert: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  vitalStripTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 6,
  },
  vitalStripValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  vitalStripUnit: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  vitalStripLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 4,
  },

  // Tabs
  tabContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  // Tab Content
  tabContent: {
    padding: 16,
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  symptomCount: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  symptomCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // Symptom cards
  symptomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  symptomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  symptomName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  symptomDetails: {
    marginTop: 8,
    paddingLeft: 16,
  },
  symptomDuration: {
    fontSize: 12,
    color: '#64748B',
  },

  // AI Assessment
  aiAssessmentCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  aiAssessmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiAssessmentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  aiAssessmentBody: {},
  aiAssessmentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  aiAssessmentFlags: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  aiFlagTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 6,
  },
  aiFlagItem: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 3,
  },
  aiFlagText: {
    fontSize: 12,
    color: '#7F1D1D',
    flex: 1,
  },

  // Vitals Detail
  vitalsDetailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vitalDetailCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  vitalDetailStatus: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 8,
  },
  vitalDetailValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  vitalDetailUnit: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  vitalDetailLabel: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
    marginTop: 6,
  },
  vitalDetailNormal: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },

  // Trend
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  trendChart: {
    paddingTop: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 80,
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginRight: 4,
  },
  trendBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  trendBar: {
    width: 16,
    borderRadius: 4,
    minHeight: 4,
  },
  trendBarLabel: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 4,
  },

  // History
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyCondition: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  historyStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historySince: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    paddingLeft: 16,
  },

  // Allergies Section
  allergySectionCard: {
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allergySectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 12,
  },
  allergyDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  allergyDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  allergyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergySubstance: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  allergyReaction: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Past Visits Timeline
  visitCard: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  visitTimeline: {
    alignItems: 'center',
    width: 24,
  },
  visitDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  visitLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  visitContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 16,
  },
  visitDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  visitReason: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  visitDoctor: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Reports
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  reportIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  reportMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  reportStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reportArrow: {
    fontSize: 20,
    color: '#CBD5E1',
    fontWeight: '700',
  },

  // Medications
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  medIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  medDosage: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  medWarning: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },

  // Interactions
  interactionSection: {
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  interactionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 12,
  },
  interactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  interactionSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  interactionDrugs: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  interactionDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },

  // Quick Action Footer
  quickActionFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  footerBtnIcon: {
    fontSize: 16,
  },
  footerBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
