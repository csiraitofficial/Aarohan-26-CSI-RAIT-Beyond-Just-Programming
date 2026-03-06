import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PatientTabParamList, PatientStackParamList } from './types';

import { HomeScreen } from '../screens/Patient/HomeScreen';
import { SymptomScreen } from '../screens/Patient/Symptom/SymptomScreen';
import { AISubmitScreen } from '../screens/Patient/Symptom/AISubmitScreen';
import { SymptomAgentScreen } from '../screens/Patient/Symptom/SymptomAgentScreen';
import { MildCaseDashboard } from '../screens/Patient/Symptom/MildCaseDashboard';
import { DoctorNeededDashboard } from '../screens/Patient/Symptom/DoctorNeededDashboard';
import { EmergencyDashboard } from '../screens/Patient/Symptom/EmergencyDashboard';
import { DoctorSelectionScreen } from '../screens/Patient/Symptom/DoctorSelectionScreen';
import { RecordsScreen } from '../screens/Patient/RecordsScreen';
import { CaseDetailScreen } from '../screens/Patient/CaseDetailScreen';
import { RemindersScreen } from '../screens/Patient/RemindersScreen';
import { ProfileScreen } from '../screens/Patient/ProfileScreen';
import { EmergencyScreen } from '../screens/Patient/EmergencyScreen';
import { MediScanScreen } from '../screens/Patient/MediScanScreen';
import { MediScanResultScreen } from '../screens/Patient/MediScanResultScreen';

import { theme } from '../utils/theme';
import { LogoutButton } from '../components/ui/LogoutButton';

const TabIcon = ({ emoji }: { emoji: string }) => (
  <Text style={{ fontSize: 20 }}>{emoji}</Text>
);

/* ─── Individual stacks inside each tab ─── */
const HomeStack = createNativeStackNavigator<PatientStackParamList>();
function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Home', headerShown: false }} />
      {/* New AI Agent flow */}
      <HomeStack.Screen name="SymptomAgentScreen" component={SymptomAgentScreen} options={{ title: '🤖 AI Health Check', headerShown: false }} />
      <HomeStack.Screen name="MildCaseDashboard" component={MildCaseDashboard} options={{ title: 'Self-Care Plan', headerShown: false }} />
      <HomeStack.Screen name="DoctorNeededDashboard" component={DoctorNeededDashboard} options={{ title: 'Doctor Needed', headerShown: false }} />
      <HomeStack.Screen name="EmergencyDashboard" component={EmergencyDashboard} options={{ title: '🚨 Emergency', headerShown: false }} />
      <HomeStack.Screen name="DoctorSelectionScreen" component={DoctorSelectionScreen} options={{ title: 'Select Doctor', headerShown: false }} />
      {/* Legacy screens */}
      <HomeStack.Screen name="SymptomScreen" component={SymptomScreen} options={{ title: 'Check Symptoms' }} />
      <HomeStack.Screen name="AISubmitScreen" component={AISubmitScreen} options={{ title: 'AI Result' }} />
      <HomeStack.Screen name="RecordsScreen" component={RecordsScreen} options={{ title: 'Records' }} />
      <HomeStack.Screen name="CaseDetailScreen" component={CaseDetailScreen} options={{ title: 'Case Details' }} />
      <HomeStack.Screen name="RemindersScreen" component={RemindersScreen} options={{ title: 'Reminders' }} />
      <HomeStack.Screen name="EmergencyScreen" component={EmergencyScreen} options={{ title: '🚨 Emergency', headerStyle: { backgroundColor: '#FEE2E2' } }} />
    </HomeStack.Navigator>
  );
}

const SymptomsStack = createNativeStackNavigator<PatientStackParamList>();
function SymptomsStackScreen() {
  return (
    <SymptomsStack.Navigator>
      <SymptomsStack.Screen name="SymptomAgentScreen" component={SymptomAgentScreen} options={{ title: '🤖 AI Health Check', headerShown: false }} />
      <SymptomsStack.Screen name="MildCaseDashboard" component={MildCaseDashboard} options={{ title: 'Self-Care Plan', headerShown: false }} />
      <SymptomsStack.Screen name="DoctorNeededDashboard" component={DoctorNeededDashboard} options={{ title: 'Doctor Needed', headerShown: false }} />
      <SymptomsStack.Screen name="EmergencyDashboard" component={EmergencyDashboard} options={{ title: '🚨 Emergency', headerShown: false }} />
      <SymptomsStack.Screen name="DoctorSelectionScreen" component={DoctorSelectionScreen} options={{ title: 'Select Doctor', headerShown: false }} />
      {/* Legacy */}
      <SymptomsStack.Screen name="SymptomScreen" component={SymptomScreen} options={{ title: 'Check Symptoms' }} />
      <SymptomsStack.Screen name="AISubmitScreen" component={AISubmitScreen} options={{ title: 'AI Result' }} />
    </SymptomsStack.Navigator>
  );
}

const MediScanStack = createNativeStackNavigator<PatientStackParamList>();
function MediScanStackScreen() {
  return (
    <MediScanStack.Navigator>
      <MediScanStack.Screen name="MediScanScreen" component={MediScanScreen} options={{ title: 'MediScan AI', headerShown: false }} />
      <MediScanStack.Screen name="MediScanResultScreen" component={MediScanResultScreen} options={{ title: 'Scan Results', headerShown: false }} />
    </MediScanStack.Navigator>
  );
}

const RecordsStack = createNativeStackNavigator<PatientStackParamList>();
function RecordsStackScreen() {
  return (
    <RecordsStack.Navigator>
      <RecordsStack.Screen name="RecordsScreen" component={RecordsScreen} options={{ title: 'Health Records' }} />
      <RecordsStack.Screen name="CaseDetailScreen" component={CaseDetailScreen} options={{ title: 'Case Details' }} />
    </RecordsStack.Navigator>
  );
}

const RemindersStack = createNativeStackNavigator<PatientStackParamList>();
function RemindersStackScreen() {
  return (
    <RemindersStack.Navigator>
      <RemindersStack.Screen name="RemindersScreen" component={RemindersScreen} options={{ title: 'Reminders' }} />
    </RemindersStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<PatientStackParamList>();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </ProfileStack.Navigator>
  );
}

/* ─── Bottom Tabs ─── */
const Tab = createBottomTabNavigator<PatientTabParamList>();

export const PatientTabNavigator: React.FC = () => {
  const logoutBtn = () => <LogoutButton />;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerRight: logoutBtn,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700', color: '#1F2937' },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{
          title: 'Swasthya Saathi',
          tabBarLabel: 'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tab.Screen
        name="SymptomsTab"
        component={SymptomsStackScreen}
        options={{
          title: 'AI Health Check',
          tabBarLabel: 'Symptoms',
          tabBarIcon: () => <TabIcon emoji="🩺" />,
        }}
      />
      <Tab.Screen
        name="MediScanTab"
        component={MediScanStackScreen}
        options={{
          title: 'MediScan AI',
          tabBarLabel: 'MediScan',
          tabBarIcon: () => <TabIcon emoji="🩻" />,
        }}
      />
      <Tab.Screen
        name="RecordsTab"
        component={RecordsStackScreen}
        options={{
          title: 'Health Records',
          tabBarLabel: 'Records',
          tabBarIcon: () => <TabIcon emoji="📁" />,
        }}
      />
      <Tab.Screen
        name="RemindersTab"
        component={RemindersStackScreen}
        options={{
          title: 'Reminders',
          tabBarLabel: 'Reminders',
          tabBarIcon: () => <TabIcon emoji="🔔" />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
