import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

/* ─── Types ─── */
interface Notification {
  id: string;
  type: 'emergency' | 'consultation' | 'message' | 'system' | 'report' | 'reminder';
  title: string;
  body: string;
  time: string;
  read: boolean;
  patientName?: string;
  patientId?: string;
}

/* ─── Mock Data ─── */
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'emergency',
    title: 'Emergency Alert',
    body: 'Patient Mohammed Ansari (P-1048) has critical SpO₂ at 87%. Immediate attention required.',
    time: '2 min ago',
    read: false,
    patientName: 'Mohammed Ansari',
    patientId: 'P-1048',
  },
  {
    id: '2',
    type: 'consultation',
    title: 'New Consultation Request',
    body: 'Sana Ali has been assigned to you with moderate priority. Symptoms: Severe headache, Nausea.',
    time: '12 min ago',
    read: false,
    patientName: 'Sana Ali',
    patientId: 'P-1038',
  },
  {
    id: '3',
    type: 'message',
    title: 'Patient Message',
    body: 'Ravi Kumar: "Doctor, I am still feeling the chest pain. Should I take another aspirin?"',
    time: '25 min ago',
    read: false,
    patientName: 'Ravi Kumar',
    patientId: 'P-1042',
  },
  {
    id: '4',
    type: 'report',
    title: 'Lab Report Available',
    body: 'ECG Report for Ravi Kumar (P-1042) is now available. Status: Abnormal findings detected.',
    time: '1 hr ago',
    read: true,
    patientName: 'Ravi Kumar',
    patientId: 'P-1042',
  },
  {
    id: '5',
    type: 'system',
    title: 'System Update',
    body: 'AI triage model has been updated to v2.4. Improved detection accuracy for cardiac symptoms.',
    time: '2 hrs ago',
    read: true,
  },
  {
    id: '6',
    type: 'reminder',
    title: 'Follow-up Reminder',
    body: 'Neha Das (P-1035) has a follow-up appointment scheduled for today at 3:00 PM.',
    time: '3 hrs ago',
    read: true,
    patientName: 'Neha Das',
    patientId: 'P-1035',
  },
  {
    id: '7',
    type: 'consultation',
    title: 'Consultation Completed',
    body: 'Consultation with Priya Sharma (P-1046) has been marked as completed. Prescription sent.',
    time: '4 hrs ago',
    read: true,
    patientName: 'Priya Sharma',
    patientId: 'P-1046',
  },
  {
    id: '8',
    type: 'message',
    title: 'CHW Message',
    body: 'CHW Sunita: "Doctor, patient Arjun Patel needs urgent follow-up regarding abdominal pain."',
    time: '5 hrs ago',
    read: true,
    patientName: 'Arjun Patel',
    patientId: 'P-1044',
  },
];

type FilterType = 'all' | 'emergency' | 'consultation' | 'message' | 'report' | 'system' | 'reminder';

const TYPE_CONFIG: Record<
  string,
  { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; bg: string; label: string }
> = {
  emergency: { icon: 'alert-circle-outline', color: '#DC2626', bg: '#FEF2F2', label: 'Emergency' },
  consultation: { icon: 'chat-outline', color: '#2563EB', bg: '#EFF6FF', label: 'Consultation' },
  message: { icon: 'email-outline', color: '#7C3AED', bg: '#F5F3FF', label: 'Message' },
  report: { icon: 'file-document-outline', color: '#059669', bg: '#ECFDF5', label: 'Report' },
  system: { icon: 'cog-outline', color: '#64748B', bg: '#F1F5F9', label: 'System' },
  reminder: { icon: 'bell-outline', color: '#D97706', bg: '#FFFBEB', label: 'Reminder' },
};

const FILTERS: FilterType[] = ['all', 'emergency', 'consultation', 'message', 'report', 'reminder'];

export const DoctorNotificationsScreen: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <View style={styles.root}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </Text>
        </View>
        {unreadCount > 0 && (
          <Pressable style={styles.markAllBtn} onPress={markAllRead}>
            <Text style={styles.markAllText}>✓ Mark all read</Text>
          </Pressable>
        )}
      </View>

      {/* ─── Filters ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {FILTERS.map((f) => {
          const active = f === filter;
          const cfg = f === 'all' ? null : TYPE_CONFIG[f];
          const count = f === 'all'
            ? notifications.length
            : notifications.filter((n) => n.type === f).length;
          return (
            <Pressable
              key={f}
              style={[
                styles.filterChip,
                active && {
                  backgroundColor: f === 'all' ? '#E0E7FF' : cfg!.bg,
                  borderColor: f === 'all' ? '#818CF8' : cfg!.color + '40',
                },
              ]}
              onPress={() => setFilter(f)}
            >
              {cfg && <MaterialCommunityIcons name={cfg.icon} size={14} color={cfg.color} />}
              <Text
                style={[
                  styles.filterChipText,
                  active && { color: f === 'all' ? '#4338CA' : cfg!.color, fontWeight: '700' },
                ]}
              >
                {f === 'all' ? 'All' : cfg!.label}
              </Text>
              <View
                style={[
                  styles.filterChipCount,
                  active && { backgroundColor: f === 'all' ? '#4338CA' : cfg!.color },
                ]}
              >
                <Text style={styles.filterChipCountText}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ─── Notification List ─── */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! New alerts will appear here.
            </Text>
          </View>
        ) : (
          filtered.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type];
            return (
              <Pressable
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
                onPress={() => markRead(notif.id)}
              >
                <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
                  <MaterialCommunityIcons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={[styles.notifTitle, !notif.read && { color: '#0F172A' }]}>
                      {notif.title}
                    </Text>
                    {!notif.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  <View style={styles.notifFooter}>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                    {notif.patientName && (
                      <View style={styles.notifPatientTag}>
                        <Text style={styles.notifPatientTagText}>
                          <MaterialCommunityIcons name="account-outline" size={10} color="#475569" /> {notif.patientName}
                        </Text>
                      </View>
                    )}
                  </View>
                  {notif.type === 'emergency' && !notif.read && (
                    <View style={styles.notifActions}>
                      <Pressable style={[styles.notifActionBtn, { backgroundColor: '#DC2626' }]}>
                        <Text style={styles.notifActionBtnText}>Respond Now</Text>
                      </Pressable>
                      <Pressable style={[styles.notifActionBtn, { backgroundColor: '#F1F5F9' }]}>
                        <Text style={[styles.notifActionBtnText, { color: '#475569' }]}>View Details</Text>
                      </Pressable>
                    </View>
                  )}
                  {notif.type === 'message' && !notif.read && (
                    <View style={styles.notifActions}>
                      <Pressable style={[styles.notifActionBtn, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.notifActionBtnText}>Reply</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  markAllBtn: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE',
  },
  markAllText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },

  // Filters
  filterBar: { flexGrow: 0, paddingVertical: 10 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#FFFFFF', marginRight: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterChipCount: {
    backgroundColor: '#94A3B8', borderRadius: 999,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterChipCountText: { fontSize: 9, fontWeight: '800', color: '#FFF' },

  // List
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },

  // Card
  notifCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  notifCardUnread: {
    borderColor: '#BFDBFE', backgroundColor: '#FAFCFF',
    shadowColor: '#3B82F6', shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  notifTitle: { fontSize: 14, fontWeight: '700', color: '#334155', flex: 1 },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6',
  },
  notifBody: { fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 19 },
  notifFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8,
  },
  notifTime: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  notifPatientTag: {
    backgroundColor: '#F1F5F9', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  notifPatientTagText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  notifActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  notifActionBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
  },
  notifActionBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  // Empty
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
});
