import SmsListener from '@dr.pogodin/react-native-sms-listener';
import { parseBankSms } from './smsParser';
import {
  hasSmsTransaction,
  saveLocalSmsTransaction,
  saveSmsTransactionToDb,
} from './smsStorageService';
import * as Haptics from 'expo-haptics';

let subscription = null;

export function startSmsTracking(userId, onNewTransaction) {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }

  if (!userId) return () => {};

  if (!SmsListener || typeof SmsListener.addListener !== 'function') {
    console.warn('SMS Listener is not available in current environment.');
    return () => {};
  }

  subscription = SmsListener.addListener(async (message) => {
    try {
      if (!message || !message.body) return;

      const parsedTx = parseBankSms(message.body, message.originatingAddress);
      if (!parsedTx) return; // Non-bank, phishing, or OTP message

      parsedTx.userId = userId;
      if (!parsedTx.sanitizedDescription) {
        parsedTx.sanitizedDescription = parsedTx.merchant || 'Bank Transfer';
      }

      // Check for duplicate transaction
      const isDuplicate = await hasSmsTransaction(userId, parsedTx);
      if (isDuplicate) return;

      // 1. Persist locally to AsyncStorage immediately (guarantees zero data loss across app restarts)
      await saveLocalSmsTransaction(userId, parsedTx);

      // 2. Persist to dedicated Cloud Firestore collection /users/{userId}/sms_transactions
      void saveSmsTransactionToDb(userId, parsedTx);

      // 3. Tactile Haptic Vibration
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Gracefully continue if haptics are not supported
      }

      // 4. Trigger callback for in-app floating UI toast and instant state update
      if (typeof onNewTransaction === 'function') {
        onNewTransaction(parsedTx);
      }
    } catch (error) {
      console.error('Error processing live SMS:', error);
    }
  });

  return () => {
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
  };
}

export function stopSmsTracking() {
  if (subscription) {
    subscription.remove();
    subscription = null;
  }
}

/**
 * Developer & Testing Simulator
 * Simulates incoming SMS execution through full parsing, dedicated storage,
 * haptics, and UI callbacks without requiring native Android carrier SMS.
 */
export async function simulateIncomingSms(userId, message, onNewTransaction) {
  const { body, originatingAddress = 'VK-SBIINB' } = message || {};
  if (!body) return { success: false, reason: 'Empty SMS body' };

  const parsedTx = parseBankSms(body, originatingAddress);
  if (!parsedTx) {
    return {
      success: false,
      reason: 'Rejected by Anti-Fake Filters (Invalid bank sender code, phishing link, or OTP)',
    };
  }

  if (userId) {
    parsedTx.userId = userId;
    if (!parsedTx.sanitizedDescription) {
      parsedTx.sanitizedDescription = parsedTx.merchant || 'Bank Transfer';
    }

    const isDuplicate = await hasSmsTransaction(userId, parsedTx);
    if (isDuplicate) {
      return { success: false, reason: 'Duplicate transaction already recorded' };
    }

    // Persist to both local AsyncStorage and dedicated Firestore database
    await saveLocalSmsTransaction(userId, parsedTx);
    void saveSmsTransactionToDb(userId, parsedTx);
  }

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Continue gracefully
  }

  if (typeof onNewTransaction === 'function') {
    onNewTransaction(parsedTx);
  }

  return { success: true, transaction: parsedTx };
}


