import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../utils/theme';

type Props = {
  onResult: (text: string) => void;
};

export const VoiceRecorder: React.FC<Props> = ({ onResult }) => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.15, duration: 500, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
      if (timer.current) clearInterval(timer.current);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [recording, pulse]);

  const toggle = () => {
    if (recording) {
      setRecording(false);
      // Simulate speech-to-text result
      const sampleResults = [
        'I have been having a fever and headache for two days',
        'I feel chest pain when breathing deeply',
        'My throat is sore and I have a cough',
      ];
      const text = sampleResults[Math.floor(Math.random() * sampleResults.length)];
      setTimeout(() => onResult(text), 600);
      setSeconds(0);
    } else {
      setRecording(true);
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{recording ? 'Listening…' : 'Tap to describe how you feel'}</Text>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable style={[styles.mic, recording && styles.micActive]} onPress={toggle}>
          <Text style={styles.micIcon}>{recording ? '⏹' : '🎙️'}</Text>
        </Pressable>
      </Animated.View>
      {recording && <Text style={styles.timer}>{fmt(seconds)}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 20 },
  hint: { color: theme.colors.textSecondary, marginBottom: 16, fontSize: 15 },
  mic: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#EBF3FF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: theme.colors.primary,
  },
  micActive: { backgroundColor: '#FEE2E2', borderColor: theme.colors.danger },
  micIcon: { fontSize: 32 },
  timer: { marginTop: 12, fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
});
