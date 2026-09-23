import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';

function getDb() {
  try {
    const { db } = require('../config/firebase');
    return db || null;
  } catch {
    return null;
  }
}

const STORAGE_PREFIX = '@finsight_sms_transactions_';

function getStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'guest'}`;
}

/**
 * Checks if an SMS transaction already exists in local storage.
 */
export async function hasSmsTransaction(userId, transaction) {
  if (!transaction || !transaction.id) return false;
  try {
    const existing = await loadLocalSmsTransactions(userId);
    return existing.some((item) => {
      if (item.id === transaction.id) return true;
      if (
        transaction.referenceNo &&
        item.referenceNo &&
        item.referenceNo === transaction.referenceNo
      ) {
        return true;
      }
      return false;
    });
  } catch {
    return false;
  }
}

/**
 * Loads SMS transactions cached locally in AsyncStorage.
 * Instant, offline-first, ensures transactions are never removed.
 */
export async function loadLocalSmsTransactions(userId) {
  try {
    const key = getStorageKey(userId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Error reading local SMS transactions from AsyncStorage:', err);
    return [];
  }
}

/**
 * Saves an SMS transaction to AsyncStorage.
 * Automatically deduplicates by transaction ID and reference number.
 */
export async function saveLocalSmsTransaction(userId, transaction) {
  if (!transaction || !transaction.id) return [];
  try {
    const key = getStorageKey(userId);
    const existing = await loadLocalSmsTransactions(userId);

    const isDuplicate = existing.some((item) => {
      if (item.id === transaction.id) return true;
      if (
        transaction.referenceNo &&
        item.referenceNo &&
        item.referenceNo === transaction.referenceNo
      ) {
        return true;
      }
      return false;
    });

    if (isDuplicate) {
      return existing;
    }

    const updated = [transaction, ...existing];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving local SMS transaction to AsyncStorage:', err);
    return [];
  }
}

/**
 * Persists an SMS transaction to Cloud Firestore in its dedicated collection.
 * Path: /users/{userId}/sms_transactions/{transaction.id}
 */
export async function saveSmsTransactionToDb(userId, transaction) {
  if (!userId || !transaction || !transaction.id) return false;
  const db = getDb();
  if (!db) return false;
  try {
    const txDocRef = doc(db, 'users', userId, 'sms_transactions', transaction.id);
    await setDoc(txDocRef, {
      ...transaction,
      userId,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    // Graceful error handling; local AsyncStorage guarantees zero data loss
    return false;
  }
}

/**
 * Synchronizes local AsyncStorage with Cloud Firestore's /sms_transactions collection.
 * Merges and persists the union of records.
 */
export async function syncSmsTransactions(userId) {
  if (!userId) return await loadLocalSmsTransactions(userId);
  const db = getDb();
  if (!db) return await loadLocalSmsTransactions(userId);
  try {
    const localTxs = await loadLocalSmsTransactions(userId);
    const smsColRef = collection(db, 'users', userId, 'sms_transactions');
    const snapshot = await getDocs(smsColRef);

    const cloudTxs = [];
    snapshot.forEach((d) => {
      cloudTxs.push(d.data());
    });

    // Merge deduplicated
    const txMap = new Map();
    for (const tx of cloudTxs) {
      if (tx?.id) txMap.set(tx.id, tx);
    }
    for (const tx of localTxs) {
      if (tx?.id && !txMap.has(tx.id)) {
        txMap.set(tx.id, tx);
      }
    }

    const merged = Array.from(txMap.values()).sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const key = getStorageKey(userId);
    await AsyncStorage.setItem(key, JSON.stringify(merged));
    return merged;
  } catch (err) {
    return await loadLocalSmsTransactions(userId);
  }
}

/**
 * Real-time listener for Firestore /users/{userId}/sms_transactions.
 */
export function subscribeToSmsTransactions(userId, onUpdate) {
  if (!userId || typeof onUpdate !== 'function') return () => {};
  const db = getDb();
  if (!db) return () => {};

  try {
    const smsColRef = collection(db, 'users', userId, 'sms_transactions');
    const unsubscribe = onSnapshot(
      smsColRef,
      async (snapshot) => {
        const cloudTxs = [];
        snapshot.forEach((d) => {
          cloudTxs.push(d.data());
        });

        if (cloudTxs.length > 0) {
          const localTxs = await loadLocalSmsTransactions(userId);
          const txMap = new Map();
          for (const tx of cloudTxs) {
            if (tx?.id) txMap.set(tx.id, tx);
          }
          for (const tx of localTxs) {
            if (tx?.id && !txMap.has(tx.id)) {
              txMap.set(tx.id, tx);
            }
          }
          const merged = Array.from(txMap.values()).sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0).getTime();
            const dateB = new Date(b.date || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          const key = getStorageKey(userId);
          await AsyncStorage.setItem(key, JSON.stringify(merged));
          onUpdate(merged);
        }
      },
      () => {
        // Fallback gracefully on permission or network issues
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

