import React, { useState, useRef, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { createVideoRoom } from '../../services/api';
import { DoctorStackParamList } from '../../navigation/DoctorTabNavigator';

/* ─── Types ─── */
interface ChatMsg {
  id: string;
  sender: 'doctor' | 'patient' | 'system';
  text: string;
  timestamp: string;
}

/* ─── Mock Data ─── */
const ACTIVE_PATIENT = {
  name: 'Ravi Kumar',
  age: 45,
  gender: 'M',
  id: 'P-1042',
  risk: 'emergency' as const,
  symptoms: ['Chest pain', 'Shortness of breath', 'Dizziness'],
  vitals: { hr: 112, bp: '160/100', spo2: 89, temp: 99.2 },
  duration: '00:12:34',
};

const INITIAL_MESSAGES: ChatMsg[] = [
  { id: '1', sender: 'system', text: 'Consultation started with Ravi Kumar', timestamp: '10:23 AM' },
  { id: '2', sender: 'patient', text: 'Doctor, I have been having chest pain for the last 2 hours. It feels tight and heavy.', timestamp: '10:24 AM' },
  { id: '3', sender: 'doctor', text: 'I can see your vitals. Your oxygen level is concerning at 89%. Can you describe if the pain radiates to your arm or jaw?', timestamp: '10:25 AM' },
  { id: '4', sender: 'patient', text: 'Yes, I feel some pain going to my left arm. I am also sweating a lot.', timestamp: '10:26 AM' },
  { id: '5', sender: 'system', text: 'AI Alert: Symptoms are consistent with possible ACS. Immediate ECG recommended.', timestamp: '10:26 AM' },
];

const QUICK_RESPONSES = [
  'Take deep breaths',
  'On a scale of 1-10, rate your pain',
  'Have you taken any medication?',
  'Stay calm, help is on the way',
  'Can you send a photo?',
];

export const LiveConsultationScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMsg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStartingCall, setIsStartingCall] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<DoctorStackParamList>>();
  const { token } = useAuth();

  const handleStartVideoCall = async () => {
    if (!token) {
      Alert.alert('Error', 'You must be logged in to start a video call.');
      return;
    }
    setIsStartingCall(true);
    try {
      const room = await createVideoRoom(token);
      navigation.navigate('VideoCallScreen', {
        roomUrl: room.room_url,
        patientName: ACTIVE_PATIENT.name,
        consultationId: room.consultation_id ?? undefined,
      });
    } catch (err: any) {
      Alert.alert('Video Call Error', err.message || 'Failed to create video room.');
    } finally {
      setIsStartingCall(false);
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const msg: ChatMsg = {
      id: Date.now().toString(),
      sender: 'doctor',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');
    // Simulate patient typing
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* ─── Patient Info Bar ─── */}
      <View style={styles.patientBar}>
        <View style={styles.patientBarLeft}>
          <View style={styles.patientBarAvatar}>
            <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.patientBarName}>{ACTIVE_PATIENT.name}</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.patientBarMeta}>
              {ACTIVE_PATIENT.age}y · {ACTIVE_PATIENT.id} · {ACTIVE_PATIENT.duration}
            </Text>
          </View>
        </View>
        <View style={styles.patientBarActions}>
          <Pressable style={styles.barActionBtn}>
            <MaterialCommunityIcons name="phone-outline" size={18} color="#334155" />
          </Pressable>
          <Pressable style={styles.barActionBtn} onPress={handleStartVideoCall} disabled={isStartingCall}>
            <MaterialCommunityIcons name={isStartingCall ? 'loading' : 'video-outline'} size={18} color="#334155" />
          </Pressable>
          <Pressable style={[styles.barActionBtn, { backgroundColor: '#FEF2F2' }]}>
            <MaterialCommunityIcons name="phone-hangup" size={16} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* Mini Vitals Strip */}
      <View style={styles.miniVitalsBar}>
        <MiniVital label="HR" value={`${ACTIVE_PATIENT.vitals.hr}`} unit="bpm" alert={ACTIVE_PATIENT.vitals.hr > 100} />
        <MiniVital label="BP" value={ACTIVE_PATIENT.vitals.bp} unit="" alert={true} />
        <MiniVital label="Temp" value={`${ACTIVE_PATIENT.vitals.temp}°F`} unit="" alert={false} />
        <View style={styles.symptomMini}>
          {ACTIVE_PATIENT.symptoms.slice(0, 2).map((s, i) => (
            <Text key={i} style={styles.symptomMiniText}>{s}</Text>
          ))}
        </View>
      </View>

      {/* ─── Messages ─── */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          if (msg.sender === 'system') {
            return (
              <View key={msg.id} style={styles.systemMsg}>
                <Text style={styles.systemMsgText}>{msg.text}</Text>
                <Text style={styles.systemMsgTime}>{msg.timestamp}</Text>
              </View>
            );
          }
          const isDoctor = msg.sender === 'doctor';
          return (
            <View
              key={msg.id}
              style={[styles.msgRow, isDoctor ? styles.msgRowDoctor : styles.msgRowPatient]}
            >
              {!isDoctor && (
                <View style={styles.msgAvatar}>
                  <MaterialCommunityIcons name="account-outline" size={14} color="#64748B" />
                </View>
              )}
              <View style={[styles.bubble, isDoctor ? styles.bubbleDoctor : styles.bubblePatient]}>
                <Text style={[styles.bubbleText, isDoctor && { color: '#FFF' }]}>{msg.text}</Text>
                <Text style={[styles.bubbleTime, isDoctor && { color: '#FFFFFF99' }]}>
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}
        {isTyping && (
          <View style={[styles.msgRow, styles.msgRowPatient]}>
            <View style={styles.msgAvatar}>
              <MaterialCommunityIcons name="account-outline" size={14} color="#64748B" />
            </View>
            <View style={[styles.bubble, styles.bubblePatient, { paddingVertical: 12 }]}>
              <Text style={styles.typingDots}>● ● ●</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── Quick Replies ─── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickReplyBar}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {QUICK_RESPONSES.map((q, i) => (
          <Pressable key={i} style={styles.quickReplyChip} onPress={() => sendMessage(q)}>
            <Text style={styles.quickReplyText}>{q}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ─── Input Bar ─── */}
      <View style={styles.inputBar}>
        <Pressable style={styles.attachBtn}>
          <MaterialCommunityIcons name="paperclip" size={20} color="#64748B" />
        </Pressable>
        <TextInput
          style={styles.chatInput}
          placeholder="Type your message..."
          placeholderTextColor="#94A3B8"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <Pressable style={styles.sendBtn} onPress={() => sendMessage(input)}>
          <MaterialCommunityIcons name="send" size={18} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const MiniVital: React.FC<{ label: string; value: string; unit: string; alert: boolean }> = ({
  label, value, unit, alert,
}) => (
  <View style={[styles.miniVitalItem, alert && styles.miniVitalAlert]}>
    <Text style={styles.miniVitalLabel}>{label}</Text>
    <Text style={[styles.miniVitalValue, alert && { color: '#DC2626' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4F8' },

  // Patient Bar
  patientBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  patientBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  patientBarAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  patientBarName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  patientBarMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#059669', letterSpacing: 0.5 },
  patientBarActions: { flexDirection: 'row', gap: 6 },
  barActionBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },

  // Mini Vitals
  miniVitalsBar: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 8, gap: 6,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  miniVitalItem: {
    backgroundColor: '#F8FAFC', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center',
  },
  miniVitalAlert: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  miniVitalLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '600' },
  miniVitalValue: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 1 },
  symptomMini: { flex: 1, justifyContent: 'center', paddingLeft: 6 },
  symptomMiniText: { fontSize: 10, color: '#64748B', fontWeight: '500' },

  // Chat
  chatArea: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 8 },
  systemMsg: {
    alignSelf: 'center', backgroundColor: '#FEF3C7', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 12, maxWidth: '85%',
  },
  systemMsgText: { fontSize: 12, color: '#92400E', textAlign: 'center', fontWeight: '500' },
  systemMsgTime: { fontSize: 9, color: '#B45309', textAlign: 'center', marginTop: 4 },
  msgRow: { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  msgRowDoctor: { justifyContent: 'flex-end' },
  msgRowPatient: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 6,
  },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleDoctor: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubblePatient: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, color: '#1E293B', lineHeight: 20 },
  bubbleTime: { fontSize: 9, color: '#94A3B8', marginTop: 4, textAlign: 'right' },
  typingDots: { color: '#94A3B8', fontSize: 14, letterSpacing: 3 },

  // Quick Replies
  quickReplyBar: { flexGrow: 0, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FAFBFC', paddingVertical: 8 },
  quickReplyChip: {
    backgroundColor: '#EFF6FF', borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  quickReplyText: { fontSize: 12, color: '#2563EB', fontWeight: '600' },

  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 8,
  },
  attachBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  chatInput: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    maxHeight: 100, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center',
  },
});
