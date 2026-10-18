import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  loadLocalSmsTransactions,
  saveLocalSmsTransaction,
  saveSmsTransactionToDb,
  syncSmsTransactions,
  subscribeToSmsTransactions,
  addManualTransaction,
  removeLocalSmsTransaction,
  clearAllSmsTransactions,
} from '../smsStorageService';

jest.mock('../../config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  writeBatch: jest.fn(() => ({
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  getDocs: jest.fn(async () => ({
    forEach: (cb) => {
      cb({
        id: 'ref_cloud_123',
        ref: {},
        data: () => ({
          id: 'ref_cloud_123',
          amount: 500,
          type: 'DEBIT',
          date: '2026-09-20',
          merchant: 'Swiggy',
        }),
      });
    },
  })),
  setDoc: jest.fn(async () => {}),
  onSnapshot: jest.fn((colRef, onNext) => {
    onNext({
      forEach: (cb) => {
        cb({
          data: () => ({
            id: 'ref_snapshot_456',
            amount: 250,
            type: 'DEBIT',
            date: '2026-09-21',
            merchant: 'Zomato',
          }),
        });
      },
    });
    return jest.fn();
  }),
}));

describe('smsStorageService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  const sampleTx1 = {
    id: 'ref_112233445566',
    amount: 300,
    type: 'DEBIT',
    merchant: 'AMAZON PAY',
    category: 'SHOPPING',
    referenceNo: '112233445566',
    date: '2026-09-18',
  };

  const sampleTx2 = {
    id: 'ref_998877665544',
    amount: 1200,
    type: 'CREDIT',
    merchant: 'SALARY',
    category: 'INCOME',
    referenceNo: '998877665544',
    date: '2026-09-19',
  };

  it('loads empty array initially from AsyncStorage', async () => {
    const txs = await loadLocalSmsTransactions('user_1');
    expect(txs).toEqual([]);
  });

  it('saves and loads SMS transactions from AsyncStorage', async () => {
    const saved = await saveLocalSmsTransaction('user_1', sampleTx1);
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe('ref_112233445566');

    const loaded = await loadLocalSmsTransactions('user_1');
    expect(loaded).toHaveLength(1);
    expect(loaded[0].merchant).toBe('AMAZON PAY');
  });

  it('deduplicates transactions with identical id or referenceNo', async () => {
    await saveLocalSmsTransaction('user_1', sampleTx1);
    const again = await saveLocalSmsTransaction('user_1', {
      ...sampleTx1,
      id: 'diff_id',
      referenceNo: '112233445566', // same reference number
    });
    expect(again).toHaveLength(1);

    const reAdded = await saveLocalSmsTransaction('user_1', sampleTx1);
    expect(reAdded).toHaveLength(1);
  });

  it('saves to Cloud Firestore under /sms_transactions', async () => {
    const success = await saveSmsTransactionToDb('user_1', sampleTx1);
    expect(success).toBe(true);
  });

  it('synchronizes local and cloud transactions without duplicates', async () => {
    await saveLocalSmsTransaction('user_1', sampleTx1);
    const synced = await syncSmsTransactions('user_1');

    expect(synced.some((t) => t.id === 'ref_112233445566')).toBe(true);
    expect(synced.some((t) => t.id === 'ref_cloud_123')).toBe(true);
  });

  it('subscribes to real-time snapshot updates', async () => {
    const onUpdate = jest.fn();
    const unsubscribe = subscribeToSmsTransactions('user_1', onUpdate);

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });

  it('adds manual transactions with manual tag and persists them', async () => {
    const manualTx = await addManualTransaction('user_1', {
      amount: 450,
      type: 'DEBIT',
      merchant: 'Local Cafe',
      category: 'FOOD',
    });

    expect(manualTx.merchant).toBe('Local Cafe');
    expect(manualTx.amount).toBe(450);
    expect(manualTx.isManual).toBe(true);

    const loaded = await loadLocalSmsTransactions('user_1');
    expect(loaded.some((t) => t.id === manualTx.id)).toBe(true);
  });

  it('removes local transactions by id', async () => {
    await saveLocalSmsTransaction('user_1', sampleTx1);
    await saveLocalSmsTransaction('user_1', sampleTx2);

    const remaining = await removeLocalSmsTransaction('user_1', sampleTx1.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(sampleTx2.id);

    const reloaded = await loadLocalSmsTransactions('user_1');
    expect(reloaded).toHaveLength(1);
    expect(reloaded[0].id).toBe(sampleTx2.id);
  });

  it('clears all transactions for a user', async () => {
    await saveLocalSmsTransaction('user_1', sampleTx1);
    await saveLocalSmsTransaction('user_1', sampleTx2);

    const result = await clearAllSmsTransactions('user_1');
    expect(result).toBe(true);

    const reloaded = await loadLocalSmsTransactions('user_1');
    expect(reloaded).toEqual([]);
  });
});
