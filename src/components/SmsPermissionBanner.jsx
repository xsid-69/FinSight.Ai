import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Mastercard-Themed SMS Permission Banner
 * Displayed when SMS permissions have not been granted on Android devices.
 * Adheres strictly to the app's clean card surface and Mastercard Identity Red palette.
 */
export function SmsPermissionBanner({ onRequestPermission }) {
  return (
    <View
      style={styles.bannerContainer}
      testID="sms-permission-banner"
    >
      <View style={styles.headerRow}>
        <View style={styles.logoPill}>
          <View style={styles.redCircle} />
          <View style={styles.orangeCircle} />
        </View>
        <Text style={styles.title}>
          ⚡ Enable Auto-Spend Tracking
        </Text>
      </View>
      <Text style={styles.subText}>
        Allow SMS permission to auto-detect bank UPI spends with zero manual typing.
      </Text>
      <Pressable
        onPress={onRequestPermission}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Allow SMS Permission"
      >
        <Text style={styles.buttonText}>
          Allow SMS Permission
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(235, 0, 27, 0.22)',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 28,
    height: 18,
  },
  redCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EB001B',
  },
  orangeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF5F00',
    marginLeft: -6,
    opacity: 0.92,
  },
  title: {
    color: '#171717',
    fontWeight: '800',
    fontSize: 15.5,
    letterSpacing: -0.2,
  },
  subText: {
    color: '#4F4C48',
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 5,
  },
  button: {
    marginTop: 14,
    backgroundColor: '#EB001B',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EB001B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.2,
  },
});

export default SmsPermissionBanner;
