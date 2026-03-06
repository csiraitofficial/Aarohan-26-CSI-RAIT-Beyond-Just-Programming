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