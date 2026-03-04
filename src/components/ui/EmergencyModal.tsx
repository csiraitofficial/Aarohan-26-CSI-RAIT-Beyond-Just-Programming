import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../utils/theme';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const EmergencyModal: React.FC<Props> = ({ visible, onConfirm, onCancel }) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.icon}>🚨</Text>
        <Text style={styles.title}>Are you in immediate danger?</Text>
        <Text style={styles.sub}>
          We will share your location, notify your emergency contact, and alert the nearest doctor.
        </Text>
        <Pressable style={styles.yesBtn} onPress={onConfirm}>
          <Text style={styles.yesTxt}>Yes — Get Help Now</Text>
        </Pressable>
        <Pressable style={styles.noBtn} onPress={onCancel}>
          <Text style={styles.noTxt}>No, go back</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 28, alignItems: 'center' },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', color: theme.colors.danger, textAlign: 'center', marginBottom: 8 },
  sub: { color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  yesBtn: {
    width: '100%', minHeight: 52, backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  yesTxt: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  noBtn: { width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  noTxt: { color: theme.colors.textSecondary, fontWeight: '600', fontSize: 15 },
});
