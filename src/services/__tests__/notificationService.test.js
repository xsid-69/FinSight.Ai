import {
  processIncomingNotification,
  setNotificationListener,
  isDuplicateTransaction,
} from '../notificationService';
import { auth, db } from '../../config/firebase';
import { setDoc, getDoc, doc } from 'firebase/firestore';
import { loadLocalSmsTransactions, saveLocalSmsTransaction, hasSmsTransaction } from '../smsStorageService';
import * as Haptics from 'expo-haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

describe('notificationService', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    jest.clearAllMocks();
    auth.currentUser = { uid: testUserId };
  });

  it('falls back to guest mode when no user is authenticated and saves locally', async () => {
    auth.currentUser = null;
    const result = await processIncomingNotification({
      app: 'com.phonepe.app',
      title: 'PhonePe',
      text: 'Paid ₹150 to Sharma Tea Stall on PhonePe',
    });
    expect(result).not.toBeNull();
    expect(result.userId).toBe('guest');
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('skips processing if notification payload is invalid or spam', async () => {
    const result = await processIncomingNotification({
      app: 'com.phonepe.app',
      title: 'Special offer!',
      text: 'Cashback offer on your next recharge',
    });
    expect(result).toBeNull();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('processes valid debit notification and writes to Firestore and local storage', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });

    const rawNotification = {
      app: 'com.phonepe.app',
      title: 'PhonePe',
      text: 'Paid ₹150 to Sharma Tea Stall on PhonePe',
    };

    const savedTx = await processIncomingNotification(rawNotification);

    expect(savedTx).not.toBeNull();
    expect(savedTx.amount).toBe(150);
    expect(savedTx.type).toBe('DEBIT');
    expect(savedTx.merchant).toBe('Sharma Tea Stall');
    expect(savedTx.category).toBe('FOOD');
    expect(savedTx.source).toBe('APP_NOTIFICATION');
    expect(savedTx.sourceApp).toBe('PhonePe');
    expect(savedTx.appPackage).toBe('com.phonepe.app');
    expect(savedTx.sanitizedDescription).toBe('Sharma Tea Stall');
    expect(savedTx.id).toMatch(/^tx_[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}_150_/);

    expect(doc).toHaveBeenCalledWith(db, 'users', testUserId, 'transactions', savedTx.id);
    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalled();
  });

  it('prevents double logging when duplicate notification arrives', async () => {
    // First call: document does not exist yet
    getDoc.mockResolvedValueOnce({ exists: () => true });

    const rawNotification = {
      app: 'com.phonepe.app',
      title: 'PhonePe',
      text: 'Paid ₹150 to Sharma Tea Stall on PhonePe',
    };

    const result = await processIncomingNotification(rawNotification);
    expect(result).toBeNull();
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('triggers liveNotificationCallback when foreground listener is registered', async () => {
    getDoc.mockResolvedValueOnce({ exists: () => false });

    const callback = jest.fn();
    const unsubscribe = setNotificationListener(callback);

    const rawNotification = {
      app: 'net.one97.paytm',
      title: 'Money Received',
      text: 'Received ₹500 from Rahul Verma on Paytm',
    };

    await processIncomingNotification(rawNotification);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0].amount).toBe(500);
    expect(callback.mock.calls[0][0].type).toBe('CREDIT');

    unsubscribe();
  });

  it('deduplicates with SMS: prevents duplicate when SMS arrived in the same minute', async () => {
    const nowIso = new Date().toISOString();
    const dateMinuteKey = nowIso.slice(0, 16);

    // Save a mock SMS transaction to local storage
    const smsTx = {
      id: 'ref_123456789012',
      amount: 150,
      type: 'DEBIT',
      merchant: 'Sharma Tea Stall',
      sanitizedDescription: 'Sharma Tea Stall',
      category: 'FOOD',
      source: 'SMS_AUTO_PARSE',
      date: nowIso,
      createdAt: nowIso,
      userId: testUserId,
    };
    await saveLocalSmsTransaction(testUserId, smsTx);

    // Now an App Notification arrives for the same ₹150 payment at Sharma Tea Stall
    const notificationPayload = {
      amount: 150,
      type: 'DEBIT',
      merchant: 'Sharma Tea Stall',
    };
    const deterministicId = `tx_${dateMinuteKey}_150_sharmateasta`;

    const isDup = await isDuplicateTransaction(
      testUserId,
      deterministicId,
      notificationPayload,
      dateMinuteKey
    );
    expect(isDup).toBe(true);

    // Vice-versa: verify hasSmsTransaction also detects duplicate against notification
    const notificationTx = {
      id: deterministicId,
      amount: 150,
      type: 'DEBIT',
      merchant: 'Sharma Tea Stall',
      date: nowIso,
      createdAt: nowIso,
    };
    await saveLocalSmsTransaction(testUserId, notificationTx);

    const incomingSmsTx = {
      id: 'ref_987654321',
      amount: 150,
      type: 'DEBIT',
      date: nowIso,
      createdAt: nowIso,
    };
    const hasDup = await hasSmsTransaction(testUserId, incomingSmsTx);
    expect(hasDup).toBe(true);
  });
});
