// src/services/notificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { parseNotificationPayload } from './notificationParser';
import { loadLocalSmsTransactions, saveLocalSmsTransaction } from './smsStorageService';
import { NotificationListenerBridge } from './notificationListenerBridge';
import * as Haptics from 'expo-haptics';

let liveNotificationCallback = null;
let bridgeSubscription = null;

/**
 * Register a listener for foreground UI notifications (toasts, real-time feedback).
 */
export function setNotificationListener(callback) {
  liveNotificationCallback = callback;
  return () => {
    if (liveNotificationCallback === callback) {
      liveNotificationCallback = null;
    }
  };
}

/**
 * Checks if a transaction is a duplicate of an existing SMS or notification transaction.
 * Compares exact deterministic ID, or same minute + amount + type + merchant.
 */
export async function isDuplicateTransaction(userId, deterministicId, parsedTx, dateMinuteKey) {
  try {
    const effectiveUserId = userId || 'guest';

    // 1. Direct Firestore document check if authenticated
    if (db && effectiveUserId !== 'guest') {
      try {
        const txRef = doc(db, 'users', effectiveUserId, 'transactions', deterministicId);
        const existingDoc = await getDoc(txRef);
        if (existingDoc && existingDoc.exists()) {
          return true;
        }
      } catch (_) {}
    }

    // 2. Cross-check with local transaction cache (SMS + previous notifications)
    const localTxs = await loadLocalSmsTransactions(effectiveUserId);
    if (Array.isArray(localTxs) && localTxs.length > 0) {
      const cleanTargetMerchant = (parsedTx.merchant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const hasMatch = localTxs.some((item) => {
        if (!item) return false;
        if (item.id === deterministicId) return true;

        const sameAmount = Math.abs(Number(item.amount) - Number(parsedTx.amount)) < 0.01;
        const sameType = item.type === parsedTx.type;
        if (!sameAmount || !sameType) return false;

        // Check if within the same minute or matching merchant
        const itemDateStr = item.date || item.createdAt || '';
        const itemMinute = itemDateStr.slice(0, 16);
        const itemCleanMerchant = (item.merchant || item.sanitizedDescription || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        const sameMinute = Boolean(itemMinute && itemMinute === dateMinuteKey);
        const merchantOverlap = Boolean(
          cleanTargetMerchant &&
          itemCleanMerchant &&
          (cleanTargetMerchant.includes(itemCleanMerchant) || itemCleanMerchant.includes(cleanTargetMerchant))
        );

        if (sameMinute && merchantOverlap) return true;
        if (sameMinute && (item.source === 'APP_NOTIFICATION' || item.source === 'SMS_AUTO_PARSE')) return true;

        return false;
      });

      if (hasMatch) return true;
    }

    return false;
  } catch (err) {
    console.warn('Error checking duplicate transaction:', err);
    return false;
  }
}

/**
 * Main ingestion handler called by native listeners, Headless JS Task, or in-app triggers.
 */
export async function processIncomingNotification(rawNotification) {
  try {
    const parsedTx = parseNotificationPayload(rawNotification);
    if (!parsedTx) return null;

    let userId = auth?.currentUser?.uid;
    if (!userId) {
      try {
        userId = await AsyncStorage.getItem('@finsight_active_user_id');
      } catch (_) {}
    }

    // Resilient fallback to 'guest' for local/offline sessions
    if (!userId) {
      userId = 'guest';
    }

    // DEDUPLICATION ENGINE (Fingerprint Hashing):
    // Minute-level bucket + amount + cleaned merchant prevents double logging 
    // if both SMS and App Notification trigger for the same payment.
    const dateMinuteKey = new Date().toISOString().slice(0, 16); // e.g. "2026-10-17T17:45"
    const cleanMerchantKey = (parsedTx.merchant || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 12);
    const deterministicId = `tx_${dateMinuteKey}_${Math.round(parsedTx.amount)}_${cleanMerchantKey}`;

    const isDuplicate = await isDuplicateTransaction(
      userId,
      deterministicId,
      parsedTx,
      dateMinuteKey
    );

    if (isDuplicate) {
      console.log(`Duplicate transaction prevented: ${deterministicId}`);
      return null;
    }

    const nowIso = new Date().toISOString();
    const transactionPayload = {
      id: deterministicId,
      userId: userId,
      amount: parsedTx.amount,
      type: parsedTx.type, // 'DEBIT' or 'CREDIT'
      merchant: parsedTx.merchant,
      description: parsedTx.merchant,
      sanitizedDescription: parsedTx.merchant,
      category: parsedTx.category,
      source: 'APP_NOTIFICATION',
      sourceApp: parsedTx.sourceApp,
      appPackage: parsedTx.appPackage,
      date: nowIso,
      createdAt: nowIso,
    };

    // 1. Write to Cloud Firestore if user is authenticated
    if (db && userId !== 'guest') {
      try {
        const txRef = doc(db, 'users', userId, 'transactions', deterministicId);
        await setDoc(txRef, transactionPayload);
      } catch (dbErr) {
        console.warn('Could not sync notification transaction to Firestore:', dbErr);
      }
    }

    // 2. Cache in local storage for instant offline access and cross-source deduplication with SMS
    await saveLocalSmsTransaction(userId, transactionPayload);

    // 3. Trigger subtle haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {
      // Ignore in background headless mode
    }

    // 4. Trigger UI callback if active
    if (typeof liveNotificationCallback === 'function') {
      try {
        liveNotificationCallback(transactionPayload);
      } catch (cbErr) {
        console.warn('Error in liveNotificationCallback:', cbErr);
      }
    }

    console.log(`⚡ [Notification Captured]: ${parsedTx.type} ₹${parsedTx.amount} at ${parsedTx.merchant} (${parsedTx.sourceApp})`);
    return transactionPayload;
  } catch (error) {
    console.error('Error in processIncomingNotification:', error);
    return null;
  }
}

/**
 * Scans active status bar notifications currently present in Android drawer.
 * Ingests any unread payment notifications from PhonePe, Paytm, Super.money, etc.
 */
export async function syncActiveNotifications(userId, onNewTransaction) {
  try {
    const activeList = await NotificationListenerBridge.readActiveNotifications();
    if (!Array.isArray(activeList) || activeList.length === 0) return 0;

    let importedCount = 0;
    for (const item of activeList) {
      const result = await processIncomingNotification(item);
      if (result) {
        importedCount++;
        if (typeof onNewTransaction === 'function') {
          onNewTransaction(result);
        }
      }
    }
    return importedCount;
  } catch (err) {
    console.warn('Error syncing active status bar notifications:', err);
    return 0;
  }
}

/**
 * Ingests any notifications queued in native cache while app was backgrounded or closed.
 */
export async function flushPendingNotifications(userId, onNewTransaction) {
  try {
    const pendingList = await NotificationListenerBridge.flushPendingNotifications();
    if (!Array.isArray(pendingList) || pendingList.length === 0) return 0;

    let importedCount = 0;
    for (const item of pendingList) {
      const result = await processIncomingNotification(item);
      if (result) {
        importedCount++;
        if (typeof onNewTransaction === 'function') {
          onNewTransaction(result);
        }
      }
    }
    return importedCount;
  } catch (err) {
    console.warn('Error flushing pending notifications:', err);
    return 0;
  }
}

/**
 * Starts continuous native notification tracking:
 * 1. Flushes background pending notifications
 * 2. Scans active status bar notifications (PhonePe, Paytm, Super.money)
 * 3. Registers real-time event listener for instant UI updates
 */
export function startNotificationTracking(userId, onNewTransaction) {
  if (bridgeSubscription) {
    bridgeSubscription.remove();
    bridgeSubscription = null;
  }

  // Register live UI callback
  setNotificationListener((tx) => {
    if (typeof onNewTransaction === 'function') {
      onNewTransaction(tx);
    }
  });

  // 1. Process any pending notifications from native cache
  void flushPendingNotifications(userId, onNewTransaction);

  // 2. Query active notifications currently in Android drawer
  void syncActiveNotifications(userId, onNewTransaction);

  // 3. Attach real-time native listener
  bridgeSubscription = NotificationListenerBridge.addListener(async (data) => {
    try {
      const rawPayload = data?.notification || data;
      const result = await processIncomingNotification(rawPayload);
      if (result && typeof onNewTransaction === 'function') {
        onNewTransaction(result);
      }
    } catch (err) {
      console.error('Error handling live notification event:', err);
    }
  });

  return () => {
    stopNotificationTracking();
  };
}

export function stopNotificationTracking() {
  if (bridgeSubscription) {
    bridgeSubscription.remove();
    bridgeSubscription = null;
  }
  setNotificationListener(null);
}
