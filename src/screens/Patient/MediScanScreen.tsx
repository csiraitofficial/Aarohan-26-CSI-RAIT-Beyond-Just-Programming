import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { uploadMediScan, MediScanResponse } from '../../services/api';
import { theme } from '../../utils/theme';

type Props = {
  navigation: any;
};

export const MediScanScreen: React.FC<Props> = ({ navigation }) => {
  const { token } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async (source: 'camera' | 'gallery') => {
    let permission;
    if (source === 'camera') {
      permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to capture medical images.');
        return;
      }
    } else {
      permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access is needed to select medical images.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      ...(source === 'camera'
        ? {}
        : {}),
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });

    if (source === 'camera') {
      const camResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });
      if (!camResult.canceled && camResult.assets[0]) {
        setImageUri(camResult.assets[0].uri);
      }
      return;
    }

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Please select or capture a medical image first.');
      return;
    }
    if (!token) {
      Alert.alert('Auth Error', 'Please log in to use MediScan AI.');
      return;
    }

    setLoading(true);
    try {
      const result: MediScanResponse = await uploadMediScan(imageUri, description, token);
      navigation.navigate('MediScanResultScreen', { result });
    } catch (error: any) {
      Alert.alert('Analysis Failed', error.message || 'Could not analyze the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImageUri(null);
    setDescription('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🔬</Text>
        <Text style={styles.headerTitle}>MediScan AI</Text>
        <Text style={styles.headerSubtitle}>
          Upload a chest X-ray or medical scan for AI-powered disease detection
        </Text>
      </View>

      {/* Image Picker Area */}
      <View style={styles.imageSection}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <TouchableOpacity style={styles.clearBtn} onPress={clearImage}>
              <Text style={styles.clearBtnText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>🩻</Text>
            <Text style={styles.placeholderText}>No image selected</Text>
            <Text style={styles.placeholderHint}>
              Tap below to capture or select a medical image
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.pickButton, styles.cameraButton]}
          onPress={() => pickImage('camera')}
        >
          <Text style={styles.pickButtonIcon}>📷</Text>
          <Text style={styles.pickButtonText}>Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickButton, styles.galleryButton]}
          onPress={() => pickImage('gallery')}
        >
          <Text style={styles.pickButtonIcon}>🖼️</Text>
          <Text style={styles.pickButtonText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {/* Description Input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Patient has persistent cough for 2 weeks..."
          placeholderTextColor="#9CA3AF"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Supported Scans Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🏥 Supported Scan Types</Text>
        <Text style={styles.infoText}>
          Chest X-rays • CT Scans • Medical radiographs
        </Text>
        <Text style={styles.infoSubtext}>
          Detects 50 conditions including Pneumonia, TB, COVID-19, Lung Cancer, and more
        </Text>
      </View>

      {/* Analyze Button */}
      <TouchableOpacity
        style={[styles.analyzeButton, (!imageUri || loading) && styles.analyzeButtonDisabled]}
        onPress={handleAnalyze}
        disabled={!imageUri || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.analyzeButtonText}>  Analyzing with AI...</Text>
          </View>
        ) : (
          <Text style={styles.analyzeButtonText}>🔬 Analyze Scan</Text>
        )}
      </TouchableOpacity>

      {/* Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>
          ⚠️ AI-assisted analysis is not a substitute for professional medical diagnosis.
          Always consult a qualified healthcare provider.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  imageSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  previewContainer: {
    width: '100%',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: theme.radius.md,
  },
  clearBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clearBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  placeholderHint: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    gap: 8,
  },
  cameraButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  galleryButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  pickButtonIcon: {
    fontSize: 20,
  },
  pickButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    fontSize: 14,
    color: theme.colors.textPrimary,
    minHeight: 80,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#075985',
    fontWeight: '500',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 4,
  },
  analyzeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    marginBottom: 16,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disclaimerCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    textAlign: 'center',
  },
});
