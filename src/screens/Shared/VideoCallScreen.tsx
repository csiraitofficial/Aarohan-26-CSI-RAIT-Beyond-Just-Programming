import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme } from '../../utils/theme';

export type VideoCallParams = {
  roomUrl: string;
  patientName?: string;
  consultationId?: string;
};

type Props = NativeStackScreenProps<any, 'VideoCallScreen'>;

export const VideoCallScreen: React.FC<Props> = ({ navigation, route }) => {
  const { roomUrl, patientName, consultationId } = (route.params ?? {}) as VideoCallParams;
  const webviewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleEndCall = () => {
    Alert.alert('End Call', 'Are you sure you want to end the video call?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Call',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const handleNavigationChange = (nav: WebViewNavigation) => {
    // Daily.co redirects to a "left" page when the user leaves the call
    if (nav.url.includes('/left') || nav.url.includes('bye')) {
      navigation.goBack();
    }
  };

  if (!roomUrl) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-outline" size={40} color="#D97706" />
        <Text style={styles.errorTitle}>No Video Room</Text>
        <Text style={styles.errorText}>
          No video call room URL was provided. Please try again.
        </Text>
        <Pressable style={styles.errorBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.errorBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Top bar with call info */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.liveDot} />
          <Text style={styles.topBarTitle}>
            {patientName ? `Call with ${patientName}` : 'Video Consultation'}
          </Text>
        </View>
      </View>

      {/* WebView with Daily.co room */}
      <WebView
        ref={webviewRef}
        source={{ uri: roomUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => setError(e.nativeEvent.description)}
        onNavigationStateChange={handleNavigationChange}
        // Android WebView camera/mic permissions
        {...(Platform.OS === 'android'
          ? {
              androidLayerType: 'hardware',
              allowFileAccess: true,
            }
          : {})}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Connecting to video call...</Text>
        </View>
      )}

      {/* Error overlay */}
      {error && (
        <View style={styles.loadingOverlay}>
          <MaterialCommunityIcons name="close-circle-outline" size={40} color="#DC2626" />
          <Text style={styles.loadingText}>Failed to load video call</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              setError(null);
              webviewRef.current?.reload();
            }}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Floating End Call button */}
      <View style={styles.controlBar}>
        <Pressable style={styles.endCallBtn} onPress={handleEndCall}>
          <MaterialCommunityIcons name="phone-hangup" size={22} color="#FFF" />
          <Text style={styles.endCallText}>End Call</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  topBarTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  errorDetail: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  controlBar: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  endCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 30,
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  endCallIcon: {
    fontSize: 18,
    transform: [{ rotate: '135deg' }],
  },
  endCallText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Error container (no room URL)
  errorContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
