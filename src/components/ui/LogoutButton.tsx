import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface Props {
  color?: string;
}

export const LogoutButton: React.FC<Props> = ({ color = '#EF4444' }) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            await logout();
            setLoading(false);
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) return <ActivityIndicator size="small" color={color} style={styles.btn} />;

  return (
    <Pressable
      onPress={handleLogout}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
      hitSlop={8}
    >
      <Text style={[styles.icon, { color }]}>⏻</Text>
      <Text style={[styles.label, { color }]}>Sign Out</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pressed: { opacity: 0.6 },
  icon: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700' },
});
