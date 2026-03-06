import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { theme } from '../../utils/theme';
import { transcribeVoice } from '../../services/api';

type Props = {
  onResult: (text: string) => void;
  language?: string;
  token?: string | null;
};

export const VoiceRecorder: React.FC<Props> = ({ onResult, language = 'en', token }) => {
  const [transcribing, setTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // expo-audio hooks
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 300);
  const isRecording = recorderState.isRecording;

  useEffect(() => {
    if (isRecording) {
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
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [isRecording, pulse]);

  const startRecording = async () => {
    try {
      setError(null);

      // Request permissions using the top-level export
      const permResult = await requestRecordingPermissionsAsync();
      if (!permResult.granted) {
        setError('Microphone permission is required');
        return;
      }

      // Prepare and start recording
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSeconds(0);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Could not start recording');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    setTranscribing(true);

    try {
      await recorder.stop();

      // Get the URI from the recorder instance
      const uri = recorder.uri;

      if (!uri) {
        setError('No recording found');
        setTranscribing(false);
        return;
      }

      if (!token) {
        setError('Please log in to use voice input');
        setTranscribing(false);
        return;
      }

      // Send to backend for transcription
      const result = await transcribeVoice(uri, language, token);
      if (result.text && result.text.trim()) {
        onResult(result.text.trim());
      } else {
        setError('Could not understand speech. Please try again.');
      }
    } catch (err) {
      console.error('Transcription failed:', err);
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setError(message);
    } finally {
      setTranscribing(false);
      setSeconds(0);
    }
  };

  const toggle = () => {
    if (transcribing) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const hintText = transcribing
    ? 'Transcribing…'
    : isRecording
      ? 'Listening…'
      : 'Tap to speak';

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{hintText}</Text>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          style={[styles.mic, isRecording && styles.micActive, transcribing && styles.micTranscribing]}
          onPress={toggle}
          disabled={transcribing}
        >
          <Text style={styles.micIcon}>{transcribing ? '⏳' : isRecording ? '⏹' : '🎙️'}</Text>
        </Pressable>
      </Animated.View>
      {isRecording && <Text style={styles.timer}>{fmt(seconds)}</Text>}
      {error && (
        <Pressable onPress={() => setError(null)}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </Pressable>
      )}
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
  micTranscribing: { backgroundColor: '#FFF7ED', borderColor: '#F59E0B', opacity: 0.7 },
  micIcon: { fontSize: 32 },
  timer: { marginTop: 12, fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
  errorText: { marginTop: 10, color: '#DC2626', fontSize: 13, textAlign: 'center', maxWidth: 280 },
});
