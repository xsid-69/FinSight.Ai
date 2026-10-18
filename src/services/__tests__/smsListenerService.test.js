import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmsListenerBridge } from '../smsListenerBridge';
import { setDoc } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { startSmsTracking, stopSmsTracking } from '../smsListenerService';
import { saveLocalSmsTransaction } from '../smsStorageService';

jest.mock('../smsListenerBridge', () => ({
  SmsListenerBridge: {
    addListener: jest.fn(),
    readRecentSms: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn((_db, ...parts) => ({ path: parts.join('/') })),
  getDoc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDocs: jest.fn().mockResolvedValue({ docs: [] }),
  onSnapshot: jest.fn(() => jest.fn()),
}));

jest.mock('../../config/firebase', () => ({
  db: { id: 'test-firestore' },
  auth: { currentUser: { uid: 'user_123' } },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

describe('smsListenerService', () => {
  let capturedListener;
  let mockRemove;

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockRemove = jest.fn();
    SmsListenerBridge.addListener.mockImplementation((cb) => {
      capturedListener = cb;
      return { remove: mockRemove };
    });
  });

  afterEach(() => {
    stopSmsTracking();
  });

  it('starts listening and registers an SMS listener', () => {
    const onNewTx = jest.fn();
    const unsubscribe = startSmsTracking('user_123', onNewTx);

    expect(SmsListenerBridge.addListener).toHaveBeenCalled();
    expect(typeof capturedListener).toBe('function');

    unsubscribe();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('ignores spam, non-bank, or phishing SMS with 0 writes to Firestore', async () => {
    const onNewTx = jest.fn();
    startSmsTracking('user_123', onNewTx);

    // Spam message from a mobile number with phishing link
    await capturedListener({
      originatingAddress: '+919876543210',
      body: 'Claim cashback at http://fakebank.com now!',
    });

    expect(setDoc).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(onNewTx).not.toHaveBeenCalled();
  });

  it('processes valid bank SMS, saves to dedicated Firestore collection, triggers haptics and invokes callback', async () => {
    const onNewTx = jest.fn();
    startSmsTracking('user_123', onNewTx);

    const validSms = {
      originatingAddress: 'VK-SBIINB',
      body: 'Dear UPI user A/C X1131 debited by 300.00 on date 18Sep26 trf to RIZWAN QURESHI Refno 626127227690 If not u? call-1800111109 for other services-18001234-SBI',
    };

    await capturedListener(validSms);

    expect(setDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'users/user_123/sms_transactions/ref_626127227690' }),
      expect.objectContaining({
        id: 'ref_626127227690',
        amount: 300.0,
        type: 'DEBIT',
        merchant: 'RIZWAN QURESHI',
        userId: 'user_123',
      })
    );
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(onNewTx).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'ref_626127227690',
        amount: 300.0,
        merchant: 'RIZWAN QURESHI',
      })
    );
  });

  it('deduplicates transactions: does not write or alert if transaction already exists', async () => {
    const onNewTx = jest.fn();
    startSmsTracking('user_123', onNewTx);

    const validSms = {
      originatingAddress: 'VK-SBIINB',
      body: 'Dear UPI user A/C X1131 debited by 300.00 on date 18Sep26 trf to RIZWAN QURESHI Refno 626127227690 for services-SBI',
    };

    // Pre-populate duplicate transaction in local storage
    await saveLocalSmsTransaction('user_123', {
      id: 'ref_626127227690',
      referenceNo: '626127227690',
      amount: 300.0,
      type: 'DEBIT',
      merchant: 'RIZWAN QURESHI',
    });

    await capturedListener(validSms);

    expect(setDoc).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(onNewTx).not.toHaveBeenCalled();
  });
});
