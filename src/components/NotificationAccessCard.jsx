// src/components/NotificationAccessCard.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, AppState, StyleSheet, ActivityIndicator, Linking, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import RNAndroidNotificationListener from 'react-native-android-notification-listener';
import { NotificationListenerBridge } from '../services/notificationListenerBridge';
import { processIncomingNotification, syncActiveNotifications } from '../services/notificationService';

const TRACKED_APPS = [
  'Super.money',
  'PhonePe',
  'Paytm',
  'Google Pay',
  'Amazon Pay',
  'CRED',
  'BHIM UPI',
  'Bank SMS',
];

export function NotificationAccessCard({ onScanComplete }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [simulatedFeedback, setSimulatedFeedback] = useState('');

  const checkStatus = async () => {
    try {
      if (RNAndroidNotificationListener && typeof RNAndroidNotificationListener.getPermissionStatus === 'function') {
        const legacyStatus = await RNAndroidNotificationListener.getPermissionStatus();
        if (legacyStatus === 'authorized') {
          setHasPermission(true);
          return;
        }
      }
      const status = await NotificationListenerBridge.getPermissionStatus();
      setHasPermission(status === 'authorized');
    } catch (e) {
      console.log('Error checking notification permission status:', e);
      setHasPermission(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Re-check permission when user returns to app from system settings
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkStatus();
      }
    });
    return () => sub.remove();
  }, []);

  const openSettings = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (_) {}

    try {
      if (RNAndroidNotificationListener && typeof RNAndroidNotificationListener.requestPermission === 'function') {
        try {
          RNAndroidNotificationListener.requestPermission();
        } catch (_) {}
      }
      await NotificationListenerBridge.requestPermission();
    } catch (e) {
      console.log('Error requesting notification permission:', e);
      try {
        await Linking.openSettings();
      } catch (openErr) {
        console.log('Linking.openSettings failed:', openErr);
      }
    }
  };

  const showRestrictedSettingsGuide = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch (_) {}

    Alert.alert(
      "Android 13/14/15 Permission Setup",
      "For apps installed directly, Android secures Notification Access behind Restricted Settings:\n\n1. Tap 'Open App Settings' below\n2. Tap the 3 dots (⋮) in the top-right corner\n3. Tap 'Allow restricted settings'\n4. Return to FInsightAI and tap 'Enable Notification Access'\n5. Turn ON the toggle for FInsight AI Notification Radar",
      [
        { text: "Got it", style: "cancel" },
        {
          text: "Open App Settings",
          onPress: () => {
            NotificationListenerBridge.openAppDetails().catch(() => {
              Linking.openSettings().catch(() => {});
            });
          },
        },
      ]
    );
  };

  const handleScanActiveNotifications = async () => {
    setIsScanning(true);
    setSimulatedFeedback('');
    try {
      let activeUserId = 'guest';
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        activeUserId = (await AsyncStorage.getItem('@finsight_active_user_id')) || 'guest';
      } catch (_) {}

      const imported = await syncActiveNotifications(activeUserId, (tx) => {
        if (typeof onScanComplete === 'function') {
          onScanComplete(tx);
        }
      });
      if (imported > 0) {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
        setSimulatedFeedback(`⚡ Found & synced ${imported} payment notification(s) from your notification drawer!`);
      } else {
        setSimulatedFeedback('⚡ Radar checked: No pending payment notifications found in status bar.');
      }
      setTimeout(() => setSimulatedFeedback(''), 5000);
    } catch (err) {
      console.warn('Scan active notifications error:', err);
      setSimulatedFeedback('Could not scan notifications. Ensure permission is granted.');
      setTimeout(() => setSimulatedFeedback(''), 4000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSimulatePayment = async (customApp = 'PhonePe', amount = 150, merchant = 'Sharma Tea Stall') => {
    setIsSimulating(true);
    setSimulatedFeedback('');
    try {
      let mockNotification;
      if (customApp === 'Super.money') {
        mockNotification = {
          app: 'money.super.payments',
          title: 'Super.money',
          text: `Paid ₹${amount} to ${merchant} on Super.money UPI`,
        };
      } else if (customApp === 'Google Pay') {
        mockNotification = {
          app: 'com.google.android.apps.nbu.paisa.user',
          title: 'Google Pay',
          text: `Payment of ₹${amount} to ${merchant} successful`,
        };
      } else {
        mockNotification = {
          app: 'com.phonepe.app',
          title: 'PhonePe',
          text: `Paid ₹${amount} to ${merchant} on PhonePe`,
        };
      }

      const result = await processIncomingNotification(mockNotification);
      if (result) {
        if (typeof onScanComplete === 'function') {
          onScanComplete(result);
        }
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
        setSimulatedFeedback(`⚡ Success: ₹${amount} at ${merchant} (${customApp}) captured in live ledger!`);
      } else {
        setSimulatedFeedback('⚡ Duplicate payment prevented (already logged this minute).');
      }
      setTimeout(() => setSimulatedFeedback(''), 4500);
    } catch (err) {
      console.warn('Simulation error:', err);
      setSimulatedFeedback('Simulation failed. Check storage.');
      setTimeout(() => setSimulatedFeedback(''), 4000);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <View
      testID="notification-access-card"
      style={hasPermission ? styles.activeContainer : styles.cardContainer}
    >
      {/* Top Header Row with Luxury Obsidian Accents */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>
            {hasPermission ? '🟢 Real-Time UPI Tracking Active' : '⚡ Real-Time UPI Tracking'}
          </Text>
          <Text style={styles.subtitle}>
            {hasPermission ? 'Zero-Latency Local Engine' : 'Air-Gapped Notification Radar'}
          </Text>
        </View>
        <View style={hasPermission ? styles.activeBadge : styles.badge}>
          <View style={hasPermission ? styles.activeDot : styles.standbyDot} />
          <Text style={hasPermission ? styles.activeBadgeText : styles.badgeText}>
            {hasPermission ? 'LIVE' : '1-Tap Setup'}
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        {hasPermission
          ? 'Continuous background listener is active. Push notifications from Super.money, PhonePe, Paytm, Google Pay, Amazon Pay, CRED, and all UPI apps are automatically parsed with zero cloud data leaks.'
          : 'Enable notification access so FInsightAI can capture UPI micro-spends from Super.money, PhonePe, Paytm, and Google Pay automatically—even when no bank SMS is delivered.'}
      </Text>

      {/* Tracked Ecosystem Badges */}
      <View style={styles.tagsContainer}>
        {TRACKED_APPS.map((item) => (
          <View key={item} style={styles.tagPill}>
            <Text style={styles.tagPillText}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Simulated Live Feedback Alert */}
      {simulatedFeedback ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackText}>{simulatedFeedback}</Text>
        </View>
      ) : null}

      {/* Action Buttons Row */}
      <View style={styles.buttonRow}>
        {!hasPermission ? (
          <Pressable
            testID="notification-access-button"
            onPress={openSettings}
            accessibilityRole="button"
            accessibilityLabel="Enable Notification Auto-Tracking"
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              Enable Notification Access
            </Text>
          </Pressable>
        ) : null}

        {hasPermission ? (
          <Pressable
            testID="scan-active-notifications-button"
            onPress={handleScanActiveNotifications}
            disabled={isScanning}
            accessibilityRole="button"
            accessibilityLabel="Scan Notifications Drawer"
            style={({ pressed }) => [
              styles.scanButton,
              pressed && styles.buttonPressed,
            ]}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.scanButtonText}>
                🔍 Scan Drawer
              </Text>
            )}
          </Pressable>
        ) : null}

        <Pressable
          testID="test-simulate-button"
          onPress={() => handleSimulatePayment('PhonePe', 150, 'Sharma Tea Stall')}
          disabled={isSimulating}
          accessibilityRole="button"
          accessibilityLabel="Test Interception"
          style={({ pressed }) => [
            hasPermission ? styles.testButtonActive : styles.testButton,
            pressed && styles.buttonPressed,
          ]}
        >
          {isSimulating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.testButtonText}>
              ⚡ Test (₹150)
            </Text>
          )}
        </Pressable>
      </View>

      {/* Multi-app instant test triggers when active */}
      {hasPermission ? (
        <View style={styles.multiSimRow}>
          <Text style={styles.quickTestLabel}>Quick Ingestion Tests:</Text>
          <View style={styles.multiSimButtons}>
            <Pressable
              onPress={() => handleSimulatePayment('Super.money', 350, 'Chai Point')}
              disabled={isSimulating}
              style={({ pressed }) => [styles.pillSimButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.pillSimText}>+ Super.money ₹350</Text>
            </Pressable>
            <Pressable
              onPress={() => handleSimulatePayment('Google Pay', 1200, 'Zomato')}
              disabled={isSimulating}
              style={({ pressed }) => [styles.pillSimButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.pillSimText}>+ Google Pay ₹1,200</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {!hasPermission ? (
        <Pressable
          testID="restricted-settings-help-button"
          onPress={showRestrictedSettingsGuide}
          style={styles.helpLink}
          accessibilityRole="button"
          accessibilityLabel="Trouble enabling? Android 13+ Guide"
        >
          <Text style={styles.helpLinkText}>
            ℹ️ Toggle grayed out? Tap here for Android 13/14/15 guide
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#0F1117',
    borderWidth: 1.2,
    borderColor: 'rgba(235, 0, 27, 0.35)',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#EB001B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  activeContainer: {
    backgroundColor: '#0E1318',
    borderWidth: 1.2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 20,
    padding: 15,
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15.5,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235, 0, 27, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 27, 0.3)',
    gap: 5,
  },
  badgeText: {
    color: '#FF4D4D',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  standbyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EB001B',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    gap: 5,
  },
  activeBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 0.6,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tagPillText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    fontWeight: '600',
  },
  feedbackBox: {
    marginTop: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    borderRadius: 10,
    padding: 9,
  },
  feedbackText: {
    color: '#34D399',
    fontSize: 11.5,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#EB001B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EB001B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: -0.1,
  },
  testButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.45)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    color: '#60A5FA',
    fontWeight: '700',
    fontSize: 11.5,
  },
  testButtonActive: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.38)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11.5,
  },
  multiSimRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.8,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickTestLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10.5,
    fontWeight: '600',
  },
  multiSimButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  pillSimButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
  },
  pillSimText: {
    color: '#F59E0B',
    fontSize: 10.5,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  helpLink: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  helpLinkText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});

export default NotificationAccessCard;
