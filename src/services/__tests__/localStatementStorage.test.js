import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  writeBatch: jest.fn(() => ({ set: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) })),
  getFirestore: jest.fn(() => ({})),
}));

jest.mock("../../config/firebase", () => ({
  auth: { currentUser: { uid: "user_test", getIdToken: jest.fn().mockResolvedValue("tok") } },
  db: {},
}));

import {
  saveLocalStatement,
  loadLocalStatements,
  loadLocalStatementDetail,
  loadLocalTransactions,
  LOCAL_STATEMENT_KEY_PREFIX,
  LOCAL_STATEMENT_DETAIL_KEY_PREFIX,
  LOCAL_TRANSACTIONS_KEY_PREFIX,
} from "../csvService";

describe("Local statement storage in AsyncStorage", () => {
  const userId = "test_user_local_123";

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("saves statement and transactions locally to AsyncStorage", async () => {
    const statementPayload = {
      id: "stmt_0123456789abcdef",
      displayName: "Statement Mar 2026",
      importedAt: new Date().toISOString(),
      debitCount: 2,
      creditCount: 1,
      totalSpent: 1500,
      totalIncome: 5000,
      netCashFlow: 3500,
    };

    const transactions = [
      {
        id: "csv_0000000000000001",
        date: "2026-03-01",
        amount: 500,
        type: "DEBIT",
        sanitizedDescription: "Swiggy Order",
        category: "FOOD",
      },
      {
        id: "csv_0000000000000002",
        date: "2026-03-02",
        amount: 1000,
        type: "DEBIT",
        sanitizedDescription: "Amazon Purchase",
        category: "SHOPPING",
      },
      {
        id: "csv_0000000000000003",
        date: "2026-03-05",
        amount: 5000,
        type: "CREDIT",
        sanitizedDescription: "Salary Credit",
        category: "INCOME",
      },
    ];

    await saveLocalStatement(userId, statementPayload, transactions);

    // 1. Verify saved statements list
    const statements = await loadLocalStatements(userId);
    expect(statements).toHaveLength(1);
    expect(statements[0].id).toBe("stmt_0123456789abcdef");
    expect(statements[0].displayName).toBe("Statement Mar 2026");

    // 2. Verify saved statement detail
    const detail = await loadLocalStatementDetail(userId, "stmt_0123456789abcdef");
    expect(detail).toBeTruthy();
    expect(detail.statement.id).toBe("stmt_0123456789abcdef");
    expect(detail.transactions).toHaveLength(3);
    expect(detail.transactions[0].sanitizedDescription).toBe("Swiggy Order");

    // 3. Verify local merged transactions
    const localTx = await loadLocalTransactions(userId);
    expect(localTx).toHaveLength(3);
    // Should be sorted descending by date
    expect(localTx[0].date).toBe("2026-03-05");
    expect(localTx[1].date).toBe("2026-03-02");
    expect(localTx[2].date).toBe("2026-03-01");
  });

  test("handles empty/missing data gracefully without throwing", async () => {
    expect(await loadLocalStatements(null)).toEqual([]);
    expect(await loadLocalStatementDetail(null, "stmt_123")).toBeNull();
    expect(await loadLocalTransactions(null)).toEqual([]);
  });
});
