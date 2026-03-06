import { AssessmentResult } from '../models';

/* Root stack — contains auth screens + role home screens */
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  PatientTabs: undefined;
  DoctorDashboard: undefined;
  CHWDashboard: undefined;
  AdminDashboard: undefined;
};

/* Patient inner stack — used inside each tab & for modals */
export type PatientStackParamList = {
  HomeScreen: undefined;
  /* Legacy symptom screens (kept for backward compat) */
  SymptomScreen: undefined;
  AISubmitScreen: AssessmentResult;
  /* New AI Agent flow */
  SymptomAgentScreen: undefined;
  MildCaseDashboard: undefined;
  DoctorNeededDashboard: undefined;
  EmergencyDashboard: { classificationId: string };
  DoctorSelectionScreen: undefined;
  /* Shared */
  RecordsScreen: undefined;
  CaseDetailScreen: { caseId: string };
  RemindersScreen: undefined;
  ProfileScreen: undefined;
  EmergencyScreen: undefined;
};

/* Bottom-tab param list */
export type PatientTabParamList = {
  HomeTab: undefined;
  SymptomsTab: undefined;
  RecordsTab: undefined;
  RemindersTab: undefined;
  ProfileTab: undefined;
};

/* Doctor tab param list */
export type DoctorTabParamList = {
  QueueTab: undefined;
  HealthTab: undefined;
  ConsultTab: undefined;
  PrescriptionTab: undefined;
  NotificationsTab: undefined;
};

/* Doctor stack param list */
export type DoctorStackParamList = {
  PatientQueueScreen: undefined;
  PatientHealthDetailsScreen: { patientId?: string };
  LiveConsultationScreen: { patientId?: string };
  EPrescriptionScreen: { patientId?: string };
  DoctorNotificationsScreen: undefined;
};