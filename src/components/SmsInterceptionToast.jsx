import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const useNativeDriver = Platform.OS !== 'web' && process.env.NODE_ENV !== 'test';

/**
 * Floating Dynamic Island Toast
 * Displays an emerald-bordered Obsidian Dark pill when an SMS transaction is intercepted.
 * Auto-dismisses after 4 seconds using spring physics.
 */
export function SmsInterceptionToast({
  transaction,
  onDismiss,
  duration = 4000,
}) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!transaction) return;

    // Animate In with spring physics
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver,
        damping: 14,
        mass: 0.8,
        stiffness: 120,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver,
        friction: 6,
      }),
    ]).start();

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [transaction]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 200,
        useNativeDriver,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver,
      }),
    ]).start();

    if (typeof onDismiss === 'function') {
      onDismiss();
    }
  };

  if (!transaction) return null;

  const {
    amount = 0,
    type = 'DEBIT',
    merchant = 'Bank Transfer',
    category = 'TRANSFER',
    referenceNo = '',
  } = transaction;

  const isDebit = type === 'DEBIT';
  const prefix = isDebit ? '-' : '+';
  const formattedAmount = `${prefix}₹${Number(amount).toFixed(2)}`;
  const actionText = isDebit ? 'Paid to' : 'Received from';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
      pointerEvents="box-none"
      testID="sms-interception-toast"
    >
      <Pressable
        onPress={handleDismiss}
        style={styles.pill}
      >
        <View style={styles.contentRow}>
          {/* Warm Mastercard Orange Lightning Bolt Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconGlow} />
            <Text style={styles.lightningIcon}>⚡</Text>
          </View>

          {/* Details */}
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.titleText}>
                Intercepted:{' '}
                <Text
                  style={[
                    styles.amountText,
                    isDebit ? styles.debitColor : styles.creditColor,
                  ]}
                >
                  {formattedAmount}
                </Text>
              </Text>
              <Text style={styles.liveBadge}>LIVE</Text>
            </View>

            <Text
              numberOfLines={1}
              style={styles.subText}
            >
              {actionText} {merchant} • {category}
              {referenceNo ? ` • Ref: ${referenceNo}` : ''}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  pill: {
    backgroundColor: '#242321',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(235, 0, 27, 0.38)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#EB001B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 95, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 95, 0, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF5F00',
    opacity: 0.22,
  },
  lightningIcon: {
    fontSize: 20,
    color: '#FF5F00',
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  titleText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  amountText: {
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  debitColor: {
    color: '#FFFFFF',
  },
  creditColor: {
    color: '#34E0A1', // Green strictly reserved for credit money
  },
  liveBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#EB001B',
    backgroundColor: 'rgba(235, 0, 27, 0.16)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(235, 0, 27, 0.35)',
  },
  subText: {
    color: '#A8A29E',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default SmsInterceptionToast;
