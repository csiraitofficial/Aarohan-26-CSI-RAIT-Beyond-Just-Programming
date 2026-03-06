import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PatientQueueScreen } from '../screens/Doctor/PatientQueueScreen';
import { PatientHealthDetailsScreen } from '../screens/Doctor/PatientHealthDetailsScreen';
import { LiveConsultationScreen } from '../screens/Doctor/LiveConsultationScreen';
import { EPrescriptionScreen } from '../screens/Doctor/EPrescriptionScreen';
import { DoctorNotificationsScreen } from '../screens/Doctor/DoctorNotificationsScreen';
import { VideoCallScreen } from '../screens/Shared/VideoCallScreen';

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
  VideoCallScreen: { roomUrl: string; patientName?: string; consultationId?: string };
};

const TabIcon = ({ name, color, size }: { name: keyof typeof MaterialCommunityIcons.glyphMap; color: string; size: number }) => (
  <MaterialCommunityIcons name={name} size={size} color={color} />
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
      <ConsultStack.Screen
        name="VideoCallScreen"
        component={VideoCallScreen}
        options={{ headerShown: false, animation: 'fade' }}
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
          tabBarIcon: ({ color, size }) => <TabIcon name="clipboard-text-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="HealthTab"
        component={HealthStackScreen}
        options={{
          title: 'Health Details',
          tabBarLabel: 'Health',
          tabBarIcon: ({ color, size }) => <TabIcon name="heart-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ConsultTab"
        component={ConsultStackScreen}
        options={{
          title: 'Live Consultation',
          tabBarLabel: 'Consult',
          tabBarIcon: ({ color, size }) => <TabIcon name="chat-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PrescriptionTab"
        component={PrescriptionStackScreen}
        options={{
          title: 'E-Prescription',
          tabBarLabel: 'Rx',
          tabBarIcon: ({ color, size }) => <TabIcon name="file-document-edit-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackScreen}
        options={{
          title: 'Notifications',
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => <TabIcon name="bell-outline" color={color} size={size} />,
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
