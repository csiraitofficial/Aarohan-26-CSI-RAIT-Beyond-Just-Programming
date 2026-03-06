import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { PatientQueueScreen } from '../screens/Doctor/PatientQueueScreen';
import { PatientHealthDetailsScreen } from '../screens/Doctor/PatientHealthDetailsScreen';
import { LiveConsultationScreen } from '../screens/Doctor/LiveConsultationScreen';
import { EPrescriptionScreen } from '../screens/Doctor/EPrescriptionScreen';
import { DoctorNotificationsScreen } from '../screens/Doctor/DoctorNotificationsScreen';

import { theme } from '../utils/theme';
import { LogoutButton } from '../components/ui/LogoutButton';

/* ─── Param Lists ─── */
export type DoctorTabParamList = {
  QueueTab: undefined;
  HealthTab: undefined;
  ConsultTab: undefined;
  PrescriptionTab: undefined;
  NotificationsTab: undefined;
};

export type DoctorStackParamList = {
  PatientQueueScreen: undefined;
  PatientHealthDetailsScreen: { patientId?: string };
  LiveConsultationScreen: { patientId?: string };
  EPrescriptionScreen: { patientId?: string };
  DoctorNotificationsScreen: undefined;
};

const TabIcon = ({ emoji }: { emoji: string }) => (
  <Text style={{ fontSize: 20 }}>{emoji}</Text>
);

/* ─── Stacks inside each tab ─── */
const QueueStack = createNativeStackNavigator<DoctorStackParamList>();
function QueueStackScreen() {
  return (
    <QueueStack.Navigator>
      <QueueStack.Screen
        name="PatientQueueScreen"
        component={PatientQueueScreen}
        options={{ headerShown: false }}
      />
      <QueueStack.Screen
        name="PatientHealthDetailsScreen"
        component={PatientHealthDetailsScreen}
        options={{ title: 'Patient Details', headerShown: false }}
      />
    </QueueStack.Navigator>
  );
}

const HealthStack = createNativeStackNavigator<DoctorStackParamList>();
function HealthStackScreen() {
  return (
    <HealthStack.Navigator>
      <HealthStack.Screen
        name="PatientHealthDetailsScreen"
        component={PatientHealthDetailsScreen}
        options={{ headerShown: false }}
      />
    </HealthStack.Navigator>
  );
}

const ConsultStack = createNativeStackNavigator<DoctorStackParamList>();
function ConsultStackScreen() {
  return (
    <ConsultStack.Navigator>
      <ConsultStack.Screen
        name="LiveConsultationScreen"
        component={LiveConsultationScreen}
        options={{ headerShown: false }}
      />
    </ConsultStack.Navigator>
  );
}

const PrescriptionStack = createNativeStackNavigator<DoctorStackParamList>();
function PrescriptionStackScreen() {
  return (
    <PrescriptionStack.Navigator>
      <PrescriptionStack.Screen
        name="EPrescriptionScreen"
        component={EPrescriptionScreen}
        options={{ headerShown: false }}
      />
    </PrescriptionStack.Navigator>
  );
}

const NotificationsStack = createNativeStackNavigator<DoctorStackParamList>();
function NotificationsStackScreen() {
  return (
    <NotificationsStack.Navigator>
      <NotificationsStack.Screen
        name="DoctorNotificationsScreen"
        component={DoctorNotificationsScreen}
        options={{ headerShown: false }}
      />
    </NotificationsStack.Navigator>
  );
}

/* ─── Bottom Tabs ─── */
const Tab = createBottomTabNavigator<DoctorTabParamList>();

export const DoctorTabNavigator: React.FC = () => {
  const logoutBtn = () => <LogoutButton />;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerRight: logoutBtn,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '700', color: '#1F2937', fontSize: 16 },
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="QueueTab"
        component={QueueStackScreen}
        options={{
          title: 'Patient Queue',
          tabBarLabel: 'Queue',
          tabBarIcon: () => <TabIcon emoji="📋" />,
        }}
      />
      <Tab.Screen
        name="HealthTab"
        component={HealthStackScreen}
        options={{
          title: 'Health Details',
          tabBarLabel: 'Health',
          tabBarIcon: () => <TabIcon emoji="❤️" />,
        }}
      />
      <Tab.Screen
        name="ConsultTab"
        component={ConsultStackScreen}
        options={{
          title: 'Live Consultation',
          tabBarLabel: 'Consult',
          tabBarIcon: () => <TabIcon emoji="💬" />,
        }}
      />
      <Tab.Screen
        name="PrescriptionTab"
        component={PrescriptionStackScreen}
        options={{
          title: 'E-Prescription',
          tabBarLabel: 'Rx',
          tabBarIcon: () => <TabIcon emoji="📝" />,
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackScreen}
        options={{
          title: 'Notifications',
          tabBarLabel: 'Alerts',
          tabBarIcon: () => <TabIcon emoji="🔔" />,
          tabBarBadge: 3,
          tabBarBadgeStyle: styles.badge,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: '#DC2626',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
  },
});
