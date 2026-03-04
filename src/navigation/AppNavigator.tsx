import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from './types';
import { OnboardingScreen } from '../screens/Auth/OnboardingScreen';
import { LoginRegisterScreen } from '../screens/Auth/LoginRegisterScreen';
import { PatientTabNavigator } from './PatientTabNavigator';
import { DoctorDashboardScreen } from '../screens/Doctor/DoctorDashboardScreen';
import { CHWDashboardScreen } from '../screens/CHW/CHWDashboardScreen';
import { AdminDashboardScreen } from '../screens/Admin/AdminDashboardScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { token, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!token ? (
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Auth" component={LoginRegisterScreen} options={{ title: 'Login / Register' }} />
        </>
      ) : role === 'patient' ? (
        <Stack.Screen name="PatientTabs" component={PatientTabNavigator} options={{ headerShown: false }} />
      ) : role === 'doctor' ? (
        <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} options={{ title: 'Doctor' }} />
      ) : role === 'chw' ? (
        <Stack.Screen name="CHWDashboard" component={CHWDashboardScreen} options={{ title: 'CHW' }} />
      ) : (
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin' }} />
      )}
    </Stack.Navigator>
  );
};