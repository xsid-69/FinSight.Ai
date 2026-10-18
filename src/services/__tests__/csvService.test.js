import { readFileSync } from "fs";
import { join } from "path";
import fc from "fast-check";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import * as LegacyFileSystem from "expo-file-system/legacy";
import { doc, writeBatch } from "firebase/firestore";

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-file-system", () => ({
  File: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  writeBatch: jest.fn(),
}));

jest.mock("../../config/firebase", () => ({
  auth: {
    currentUser: {
      uid: "firebase-user-1",
      getIdToken: jest.fn().mockResolvedValue("fresh-test-token"),
    },
  },
  db: { id: "test-firestore" },
}));

import {
  isFirestoreSafeTransactionDescription,
  sanitizeTransactionDescription,
} from "../privacySanitizer";
import {
  resolveMerchantBrandKey,
  resolveMerchantBrandVisual,
} from "../merchantBrandRegistry";
import {
  FIRESTORE_BATCH_LIMIT,
  MAX_CSV_FILE_BYTES,
  CsvImportError,
  categorizeTransaction,
  createTransactionId,
  importCsvStatement,
  normalizeTransactionAmount,
  normalizeTransactionDate,
  parseCsvStatement,
  pickCsvFile,
  saveTransactions,
} from "../csvService";

const CREATED_AT = "2025-03-10T09:08:07.006Z";
const USER_ID = "firebase-user-1";
const SUPPLIED_STATEMENT_FIXTURE = join(
  __dirname,
  "fixtures",
  "dummy_bank_statement_60_records.csv",
);
const batchInstances = [];

function configureSuccessfulBatches() {
  writeBatch.mockImplementation(() => {
    const batch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };
    batchInstances.push(batch);
    return batch;
  });
}

function transaction(index, overrides = {}) {
  return {
    id: `csv_${index.toString(16).padStart(16, "0").slice(-16)}`,
    date: "2025-03-10",
    sanitizedDescription: `Transaction ${index}`,
    amount: index + 1,
    type: "DEBIT",
    category: "OTHER",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  batchInstances.length = 0;
  doc.mockImplementation((_database, ...segments) => ({ path: segments.join("/") }));
  File.mockImplementation((uri) => ({
    uri,
    text: jest.fn().mockResolvedValue("Date,Description,Debit,Credit\n01/01/2025,Native read,100,"),
  }));
  LegacyFileSystem.readAsStringAsync.mockRejectedValue(
    new Error("Legacy reader should not be used when File.text succeeds."),
  );
  configureSuccessfulBatches();
});

describe("verified merchant brand resolution", () => {
  test.each([
    ["UPI/OLA@upi", "ola", "OLA"],
    ["UPI/DR/123/UBER/PAYMENT", "uber", "U"],
    ["POS/DOMINO'S", "dominos", "D"],
    ["AMAZON PAY REFUND", "amazonpay", "AP"],
    ["GOOGLE PAY ORDER", "googlepay", "GP"],
  ])("resolves reviewed aliases to local visual identities: %s", (description, key, mark) => {
    expect(resolveMerchantBrandKey(description)).toBe(key);
    expect(resolveMerchantBrandVisual(description)).toMatchObject({ key, mark });
  });

  test.each([
    "Olaf Bakery",
    "Amazonia Cafe",
    "SUPERUBER",
    "AMAZON UBER",
    "PRIVATE_HANDLE",
  ])("does not infer a brand from unsafe or ambiguous text: %s", (description) => {
    expect(resolveMerchantBrandKey(description)).toBeNull();
    expect(resolveMerchantBrandVisual(description)).toBeNull();
  });
});

describe("categorizeTransaction", () => {
  const categoryKeywords = {
    FOOD: ["zomato", "swiggy", "mcdonalds", "kfc", "dominos", "restaurant", "cafe", "hotel", "egg", "bakery", "dining"],
    ENTERTAINMENT: ["pvr", "inox", "bookmyshow", "netflix", "spotify", "prime", "hotstar"],
    TRANSPORTATION: ["uber", "ola", "rapido", "irctc", "metro", "petrol", "fuel", "hpcl", "bpcl", "iocl"],
    SHOPPING: ["amazon", "flipkart", "myntra", "zudio", "trends", "dmart", "retail"],
    UTILITIES: ["electricity", "airtel", "jio", "vi", "besl", "recharge", "water", "gas"],
    TRANSFER: ["upi/cr", "upi/dr", "neft", "imps", "transfer"],
  };

  test.each(Object.entries(categoryKeywords))("classifies every %s keyword case-insensitively", (category, keywords) => {
    for (const keyword of keywords) {
      expect(categorizeTransaction(`BANK-${keyword.toUpperCase()} / PAYMENT`)).toBe(category);
    }
  });

  test("uses the declared category order when narration contains multiple category keywords", () => {
    expect(categorizeTransaction("UPI/DR/123/ZOMATO ORDER")).toBe("FOOD");
    expect(categorizeTransaction("UPI/CR AMAZON REFUND")).toBe("SHOPPING");
  });

  test.each([
    ["MOVIE TICKET", "vi"],
    ["VEGGIE MARKET", "egg"],
    ["SCHOLARSHIP CREDIT", "ola"],
  ])("does not match short keyword substrings in %s", (description) => {
    expect(categorizeTransaction(description)).toBe("OTHER");
  });

  test("matches UPI direction tokens across bank punctuation", () => {
    expect(categorizeTransaction("001-UPI/DR/beneficiary")).toBe("TRANSFER");
    expect(categorizeTransaction("001 UPI.CR beneficiary")).toBe("TRANSFER");
  });
});

describe("date and amount normalization", () => {
  test.each([
    ["31/01/2025", "2025-01-31"],
    ["1-2-2024", "2024-02-01"],
    ["03 Mar 2023", "2023-03-03"],
    ["04-September-22", "2022-09-04"],
    ["2025-12-09", "2025-12-09"],
    ["2025/07/08 10:20:30", "2025-07-08"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeTransactionDate(input)).toBe(expected);
  });

  test.each(["31/02/2025", "2025-13-01", "not a date", ""])("rejects invalid date %s", (input) => {
    expect(normalizeTransactionDate(input)).toBeNull();
  });

  test.each([
    ["₹1,23,456.78", 123456.78],
    ["(1,250.50)", 1250.5],
    ["9,000.00 DR", 9000],
    ["INR 700 Cr.", 700],
    [-42.25, 42.25],
  ])("normalizes amount %p", (input, expected) => {
    expect(normalizeTransactionAmount(input)).toBe(expected);
  });

  test.each(["", "-", "₹0.00", "12.2.3", "total"])("rejects unusable amount %p", (input) => {
    expect(normalizeTransactionAmount(input)).toBeNull();
  });
});

describe("parseCsvStatement bank formats", () => {
  test("parses an SBI export with BOM, preamble, quoted commas, totals, and debit/credit rows", () => {
    const csv = [
      "\uFEFFState Bank of India statement",
      "Account Number: XXXX1234",
      "Txn Date,Value Date,Description,Ref No.,Debit,Credit,Balance",
      '01/02/2024,01/02/2024,"UPI/DR/123/ZOMATO, ONLINE",R1,"₹1,234.50",,"9,000.00"',
      '02-Feb-2024,02-Feb-2024,NEFT SALARY,R2,,"50,000.00 CR","59,000.00"',
      "03/02/2024,,Total,,1234.50,50000,",
    ].join("\n");

    const parsed = parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT });

    expect(parsed).toMatchObject({
      importedCount: 2,
      debitCount: 1,
      creditCount: 1,
      skippedCount: 1,
      delimiter: ",",
      headerRow: 3,
    });
    expect(parsed.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "SUMMARY_ROW" })]));
    expect(parsed.transactions[0]).toEqual({
      id: expect.stringMatching(/^csv_[a-f0-9]{16}$/),
      date: "2024-02-01",
      sanitizedDescription: "UPI/DR/123/ZOMATO, ONLINE",
      amount: 1234.5,
      type: "DEBIT",
      category: "FOOD",
      merchantKey: "zomato",
    });
    expect(Object.keys(parsed.transactions[0])).toEqual([
      "id",
      "date",
      "amount",
      "type",
      "sanitizedDescription",
      "category",
      "merchantKey",
    ]);
    expect(parsed.transactions[1]).toMatchObject({
      date: "2024-02-02",
      amount: 50000,
      type: "CREDIT",
      category: "INCOME",
    });
  });

  test("parses an HDFC semicolon export with a quoted newline and currency suffixes", () => {
    const csv = [
      "HDFC BANK STATEMENT;;;;",
      "Date;Narration;Withdrawal Amt. (INR);Deposit Amt. (INR);Closing Balance",
      '31-01-2024;"SWIGGY ORDER,\nLATE NIGHT";"1,250.00 DR";;"20,000.00"',
      '01 February 2024;IMPS TRANSFER;;"(5,000.00)";"25,000.00"',
    ].join("\n");

    const parsed = parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT });

    expect(parsed.delimiter).toBe(";");
    expect(parsed.transactions).toHaveLength(2);
    expect(parsed.transactions[0]).toMatchObject({
      date: "2024-01-31",
      sanitizedDescription: "SWIGGY ORDER, LATE NIGHT",
      amount: 1250,
      type: "DEBIT",
      category: "FOOD",
      merchantKey: "swiggy",
    });
    expect(parsed.transactions[1]).toMatchObject({
      date: "2024-02-01",
      amount: 5000,
      type: "CREDIT",
      category: "TRANSFER",
    });
  });

  test("parses an ICICI tab export with Transaction Remarks and ISO dates", () => {
    const csv = [
      "Transaction Date\tValue Date\tTransaction Remarks\tWithdrawal Amount (INR)\tDeposit Amount (INR)\tBalance (INR)",
      '2024-03-05\t2024-03-05\t"UPI/CR/AMAZON REFUND"\t\t"1,00,000.00"\t"2,00,000.00"',
      "2024-03-06\t2024-03-06\tHPCL FUEL\t750.25\t\t199249.75",
    ].join("\n");

    const parsed = parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT });

    expect(parsed.delimiter).toBe("\t");
    expect(parsed.transactions).toEqual([
      expect.objectContaining({ type: "CREDIT", amount: 100000, category: "SHOPPING" }),
      expect.objectContaining({ type: "DEBIT", amount: 750.25, category: "TRANSPORTATION" }),
    ]);
  });

  test("detects pipe-delimited headers after metadata rows", () => {
    const csv = "Generated by bank\nDate|Description|Debit|Credit|Balance\n01/01/2025|CAFE PAYMENT|250||900";
    const parsed = parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT });
    expect(parsed.delimiter).toBe("|");
    expect(parsed.transactions[0].category).toBe("FOOD");
  });

  test("retains only verified merchant keys before UPI handles are privacy-masked", () => {
    const csv = [
      "Date,Description,Debit,Credit",
      "01/01/2025,UPI/OLA@upi,100,",
      "02/01/2025,UPI/UBER@upi,200,",
      "03/01/2025,UPI/DOMINOS@upi,300,",
      "04/01/2025,UPI/OLAF@upi,400,",
      "05/01/2025,UPI/AMAZONIA@upi,500,",
    ].join("\n");

    const parsed = parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT });

    expect(parsed.transactions.map(({ merchantKey }) => merchantKey)).toEqual([
      "ola",
      "uber",
      "dominos",
      undefined,
      undefined,
    ]);
    expect(parsed.transactions.every(
      ({ sanitizedDescription }) => sanitizedDescription === "UPI/PRIVATE_HANDLE",
    )).toBe(true);
  });

  test("parses the exact supplied statement using amount columns rather than the Type label", () => {
    const csv = readFileSync(SUPPLIED_STATEMENT_FIXTURE, "utf8");
    const parsed = parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT });

    expect(parsed).toMatchObject({
      importedCount: 60,
      debitCount: 46,
      creditCount: 14,
      skippedCount: 0,
      delimiter: ",",
      headerRow: 1,
    });
    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.transactions).toHaveLength(60);
    expect(parsed.transactions.every(({ date }) => /^2026-\d{2}-\d{2}$/.test(date))).toBe(true);
    expect(parsed.transactions.every(({ amount }) => Number.isFinite(amount) && amount > 0)).toBe(true);

    expect(parsed.transactions.find(({ sanitizedDescription }) => sanitizedDescription === "POS/STARBUCKS")).toMatchObject({
      date: "2026-07-01",
      amount: 2640.66,
      type: "DEBIT",
    });
    expect(parsed.transactions.find(({ sanitizedDescription }) => sanitizedDescription === "NEFT/SALARY CREDIT")).toMatchObject({
      date: "2026-08-25",
      amount: 21046.74,
      type: "CREDIT",
      category: "INCOME",
    });
    expect(parsed.transactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ sanitizedDescription: "UPI/PRIVATE_HANDLE", category: "ENTERTAINMENT" }),
      expect.objectContaining({ sanitizedDescription: "UPI/PRIVATE_HANDLE", category: "FOOD" }),
      expect.objectContaining({
        sanitizedDescription: "UPI/PRIVATE_HANDLE",
        category: "TRANSPORTATION",
        merchantKey: "ola",
      }),
      expect.objectContaining({
        sanitizedDescription: "UPI/PRIVATE_HANDLE",
        category: "TRANSPORTATION",
        merchantKey: "uber",
      }),
      expect.objectContaining({
        sanitizedDescription: "POS/DMART",
        category: "SHOPPING",
        merchantKey: "dmart",
      }),
    ]));

    const privacyContractSamples = [
      ["POS @ STORE", "POS STORE"],
      ["REFERENCE AB123456", "REF XXXX"],
      ["TRANSACTIONID AB123456", "REF XXXX"],
      ["ORDERID AB123456", "REF XXXX"],
      ["MANDATE AB123456", "REF XXXX"],
    ];
    for (const [raw, expected] of privacyContractSamples) {
      const sanitized = sanitizeTransactionDescription(raw);
      expect(sanitized).toBe(expected);
      expect(isFirestoreSafeTransactionDescription(sanitized)).toBe(true);
    }
  });
});

describe("header discovery aliases", () => {
  test.each(["Date", "Txn Date", "Transaction Date", "Value Date"])("accepts date header %s", (dateHeader) => {
    const csv = `${dateHeader},Description,Debit,Credit\n01/01/2025,Test debit,100,`;
    expect(parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT }).importedCount).toBe(1);
  });

  test.each(["Description", "Narration", "Particulars", "Remarks", "Transaction Remarks"])("accepts description header %s", (descriptionHeader) => {
    const csv = `Date,${descriptionHeader},Debit,Credit\n01/01/2025,Test debit,100,`;
    expect(parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT }).importedCount).toBe(1);
  });

  test.each(["Debit", "Withdrawal", "Dr Amount", "Debit Amount", "Withdrawal Amt. (INR)"])("accepts debit header %s", (debitHeader) => {
    const csv = `Date,Description,${debitHeader},Credit\n01/01/2025,Test debit,100,`;
    expect(parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT }).transactions[0].type).toBe("DEBIT");
  });

  test.each(["Credit", "Deposit", "Cr Amount", "Credit Amount", "Deposit Amt. ₹"])("accepts credit header %s", (creditHeader) => {
    const csv = `Date,Description,Debit,${creditHeader}\n01/01/2025,Test credit,,100`;
    expect(parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT }).transactions[0].type).toBe("CREDIT");
  });
});

describe("parser diagnostics and deterministic identity", () => {
  test("keeps IDs stable across re-imports while preserving genuinely duplicate rows", () => {
    const csv = [
      "Date,Description,Debit,Credit",
      "01/01/2025,Same merchant,100,",
      "01/01/2025,Same merchant,100,",
    ].join("\n");

    const first = parseCsvStatement(csv, USER_ID, { createdAt: "2025-01-01T00:00:00.000Z" });
    const second = parseCsvStatement(csv, USER_ID, { createdAt: "2025-02-01T00:00:00.000Z" });

    expect(first.transactions.map(({ id }) => id)).toEqual(second.transactions.map(({ id }) => id));
    expect(first.transactions[0].id).not.toBe(first.transactions[1].id);
    const cleanIdentity = {
      date: "2025-01-01",
      amount: 100,
      type: "DEBIT",
      sanitizedDescription: "Same merchant",
      category: "OTHER",
    };
    expect(createTransactionId(USER_ID, cleanIdentity, 1)).toBe(
      createTransactionId(USER_ID, cleanIdentity, 1),
    );
  });

  test("returns actionable direction details for single-amount statements", () => {
    expect(() => parseCsvStatement("Date,Description,Amount\n01/01/2025,Test,100", USER_ID)).toThrow(
      expect.objectContaining({
        code: "NO_VALID_TRANSACTIONS",
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ code: "MISSING_DIRECTION" }),
        ]),
      }),
    );
  });

  test("rejects empty, malformed, and no-valid-row statements", () => {
    expect(() => parseCsvStatement("\uFEFF  \n", USER_ID)).toThrow(expect.objectContaining({ code: "CSV_EMPTY" }));
    expect(() =>
      parseCsvStatement('Date,Description,Debit,Credit\n01/01/2025,"unterminated,100,', USER_ID),
    ).toThrow(expect.objectContaining({ code: "CSV_MALFORMED" }));
    expect(() =>
      parseCsvStatement("Date,Description,Debit,Credit\nnot-a-date,No amount,,", USER_ID),
    ).toThrow(expect.objectContaining({ code: "NO_VALID_TRANSACTIONS", diagnostics: expect.any(Array) }));
  });

  test("diagnoses invalid and no-amount rows while retaining valid rows", () => {
    const csv = [
      "Date,Description,Debit,Credit",
      "32/01/2025,Bad date,50,",
      "01/01/2025,No amount,,",
      "01/01/2025,Both amounts,25,25",
      "01/01/2025,Valid,10,",
    ].join("\n");
    const parsed = parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT });
    expect(parsed).toMatchObject({ importedCount: 1, skippedCount: 3 });
    expect(parsed.diagnostics.map(({ code }) => code).sort()).toEqual([
      "AMBIGUOUS_AMOUNT",
      "INVALID_DATE",
      "MISSING_AMOUNT",
    ]);
  });

  // **Validates: Requirements 3**
  test("property: valid generated rows always produce the exact normalized transaction invariants", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 28 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 2020, max: 2035 }),
        fc.integer({ min: 1, max: 10_000_000 }),
        fc.boolean(),
        (day, month, year, paise, debit) => {
          const amount = (paise / 100).toFixed(2);
          const csv = [
            "Date,Description,Debit,Credit",
            `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year},Generated row,${debit ? amount : ""},${debit ? "" : amount}`,
          ].join("\n");
          const parsed = parseCsvStatement(csv, USER_ID, { createdAt: CREATED_AT });
          const item = parsed.transactions[0];

          expect(Object.keys(item)).toEqual([
            "id",
            "date",
            "amount",
            "type",
            "sanitizedDescription",
            "category",
          ]);
          expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(item.amount).toBeGreaterThan(0);
          expect(Number.isFinite(item.amount)).toBe(true);
          expect(item.type).toBe(debit ? "DEBIT" : "CREDIT");
          expect(item.sanitizedDescription).toBe("Generated row");
          expect(item).not.toEqual(expect.objectContaining({ undefined: expect.anything() }));
        },
      ),
      { seed: 20250310, numRuns: 100 },
    );
  });
});

describe("pickCsvFile", () => {
  test("uses the SDK 57 picker contract and reads web assets through the web File API", async () => {
    const text = "Date,Description,Debit,Credit\n01/01/2025,Web file,100,";
    const fileText = jest.fn().mockResolvedValue(text);
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "statement.CSV", uri: "blob:test", size: text.length, mimeType: "text/csv", file: { text: fileText } }],
    });

    await expect(pickCsvFile()).resolves.toMatchObject({
      canceled: false,
      fileName: "statement.CSV",
      mimeType: "text/csv",
      text,
    });
    expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
      type: ["text/csv", "text/comma-separated-values", "application/csv", "application/vnd.ms-excel", "text/plain"],
      multiple: false,
      copyToCacheDirectory: false,
      base64: false,
    });
    expect(fileText).toHaveBeenCalledTimes(1);
    expect(File).not.toHaveBeenCalled();
    expect(LegacyFileSystem.readAsStringAsync).not.toHaveBeenCalled();
  });

  test("reads a native cache URI through Expo FileSystem File.text without using the fallback", async () => {
    const text = "Date,Description,Debit,Credit\n01/01/2025,Native read,100,";
    const fileText = jest.fn().mockResolvedValue(text);
    File.mockImplementation((uri) => ({ uri, text: fileText }));
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "native.csv", uri: "file:///cache/native.csv", size: text.length, mimeType: "text/csv" }],
    });

    await expect(pickCsvFile()).resolves.toMatchObject({
      canceled: false,
      fileName: "native.csv",
      text,
    });
    expect(File).toHaveBeenCalledWith("file:///cache/native.csv");
    expect(fileText).toHaveBeenCalledTimes(1);
    expect(LegacyFileSystem.readAsStringAsync).not.toHaveBeenCalled();
  });

  test("falls back to the SDK 57 legacy reader when native File.text fails", async () => {
    const uri = "file:///cache/fallback.csv";
    const text = "Date,Description,Debit,Credit\n01/01/2025,Fallback read,100,";
    const fileText = jest.fn().mockRejectedValue(new Error("primary reader unavailable"));
    File.mockImplementation((fileUri) => ({ uri: fileUri, text: fileText }));
    LegacyFileSystem.readAsStringAsync.mockResolvedValue(text);
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "fallback.csv", uri, size: text.length, mimeType: "text/csv" }],
    });

    await expect(pickCsvFile()).resolves.toMatchObject({ text });
    expect(fileText).toHaveBeenCalledTimes(1);
    expect(LegacyFileSystem.readAsStringAsync).toHaveBeenCalledWith(uri);
    expect(fileText.mock.invocationCallOrder[0]).toBeLessThan(
      LegacyFileSystem.readAsStringAsync.mock.invocationCallOrder[0],
    );
  });

  test("passes Android content URIs unchanged to the supported native readers", async () => {
    const uri = "content://com.android.providers.downloads.documents/document/42";
    const text = "Date,Description,Debit,Credit\n01/01/2025,Content provider read,,250";
    const fileText = jest.fn().mockRejectedValue(new Error("SAF primary read failed"));
    File.mockImplementation((fileUri) => ({ uri: fileUri, text: fileText }));
    LegacyFileSystem.readAsStringAsync.mockResolvedValue(text);
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "content.csv", uri, size: text.length, mimeType: "text/csv" }],
    });

    await expect(pickCsvFile()).resolves.toMatchObject({ text });
    expect(File).toHaveBeenCalledWith(uri);
    expect(LegacyFileSystem.readAsStringAsync).toHaveBeenCalledWith(uri);
  });

  test("returns picker cancellation as a non-error result", async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });
    await expect(pickCsvFile()).resolves.toEqual({ canceled: true });
  });

  test("rejects wrong extensions before attempting a read", async () => {
    const fileText = jest.fn();
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "statement.docx", uri: "file:///statement.docx", size: 20, file: { text: fileText } }],
    });

    await expect(pickCsvFile()).rejects.toMatchObject({ code: "INVALID_FILE_EXTENSION" });
    expect(fileText).not.toHaveBeenCalled();
  });

  test("accepts .xlsx and .xls file extensions", async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "statement.xlsx", uri: "file:///statement.xlsx", size: 20, file: { arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(10)) } }],
    });

    await expect(pickCsvFile()).resolves.toMatchObject({
      canceled: false,
      fileName: "statement.xlsx",
    });
  });


  test.each([
    [0, "CSV_EMPTY"],
    [MAX_CSV_FILE_BYTES + 1, "FILE_TOO_LARGE"],
  ])("validates selected asset size %s", async (size, code) => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "statement.csv", uri: "file:///statement.csv", size }],
    });
    await expect(pickCsvFile()).rejects.toMatchObject({ code });
  });

  test("returns FILE_READ_FAILED only after every native reader fails", async () => {
    const uri = "content://private.provider/document/statement";
    const primaryError = Object.assign(new Error(`permission denied for ${uri}`), { code: "EACCES" });
    File.mockImplementation(() => ({ text: jest.fn().mockRejectedValue(primaryError) }));
    LegacyFileSystem.readAsStringAsync.mockRejectedValue(new Error(`provider failed for ${uri}`));
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "statement.csv", uri, size: 200 }],
    });

    await expect(pickCsvFile()).rejects.toMatchObject({
      code: "FILE_READ_FAILED",
      message: "The selected CSV could not be read securely. Choose it again or export a new CSV copy.",
      readFailures: [
        { reader: "file-text", errorName: "Error", errorCode: "EACCES" },
        { reader: "legacy-read-as-string", errorName: "Error" },
      ],
    });
    expect(LegacyFileSystem.readAsStringAsync).toHaveBeenCalledWith(uri);
  });
});

describe("Firestore ingestion", () => {
  test("uses deterministic owner paths and idempotent batch.set writes", async () => {
    const item = transaction(1);

    await saveTransactions(USER_ID, [item]);
    await saveTransactions(USER_ID, [item]);

    expect(doc).toHaveBeenNthCalledWith(1, expect.anything(), "users", USER_ID, "transactions", item.id);
    expect(doc).toHaveBeenNthCalledWith(2, expect.anything(), "users", USER_ID, "transactions", item.id);
    expect(batchInstances).toHaveLength(2);
    const expectedPayload = {
      date: item.date,
      amount: item.amount,
      type: item.type,
      sanitizedDescription: item.sanitizedDescription,
      category: item.category,
    };
    expect(batchInstances[0].set).toHaveBeenCalledWith(
      { path: `users/${USER_ID}/transactions/${item.id}` },
      expectedPayload,
    );
    expect(batchInstances[1].set).toHaveBeenCalledWith(
      { path: `users/${USER_ID}/transactions/${item.id}` },
      expectedPayload,
    );
  });

  test("chunks more than 500 transactions below the Firestore batch limit and awaits every commit", async () => {
    const items = Array.from({ length: 501 }, (_, index) => transaction(index));

    const result = await saveTransactions(USER_ID, items);

    expect(FIRESTORE_BATCH_LIMIT).toBeLessThanOrEqual(500);
    expect(result).toMatchObject({ requestedCount: 501, savedCount: 501, batchCount: 2 });
    expect(writeBatch).toHaveBeenCalledTimes(2);
    expect(batchInstances[0].set).toHaveBeenCalledTimes(FIRESTORE_BATCH_LIMIT);
    expect(batchInstances[1].set).toHaveBeenCalledTimes(501 - FIRESTORE_BATCH_LIMIT);
    expect(batchInstances[0].commit).toHaveBeenCalledTimes(1);
    expect(batchInstances[1].commit).toHaveBeenCalledTimes(1);
    expect(doc).toHaveBeenLastCalledWith(
      expect.anything(),
      "users",
      USER_ID,
      "transactions",
      transaction(500).id,
    );
  });

  test("surfaces accurate partial-commit information when a later batch fails", async () => {
    let batchIndex = 0;
    writeBatch.mockImplementation(() => {
      const currentIndex = batchIndex;
      batchIndex += 1;
      const batch = {
        set: jest.fn(),
        commit: currentIndex === 0
          ? jest.fn().mockResolvedValue(undefined)
          : jest.fn().mockRejectedValue(new Error("offline")),
      };
      batchInstances.push(batch);
      return batch;
    });
    const items = Array.from({ length: 501 }, (_, index) => transaction(index));

    await expect(saveTransactions(USER_ID, items)).rejects.toMatchObject({
      code: "FIRESTORE_PARTIAL_WRITE",
      savedCount: FIRESTORE_BATCH_LIMIT,
      failedCount: 501 - FIRESTORE_BATCH_LIMIT,
      requestedCount: 501,
      committedBatches: 1,
    });
  });

  test("rejects extra fields and invalid amounts before creating a write batch", async () => {
    await expect(saveTransactions(USER_ID, [transaction(1, { userId: "another-user" })])).rejects.toMatchObject({
      code: "INVALID_TRANSACTION",
    });
    await expect(saveTransactions(USER_ID, [transaction(2, { amount: 0 })])).rejects.toMatchObject({
      code: "INVALID_TRANSACTION",
    });
    expect(writeBatch).not.toHaveBeenCalled();
  });

  test("runs picker, parser, and cloud save end to end without uploading the original file", async () => {
    const text = "Date,Description,Debit,Credit\n01/01/2025,DMART RETAIL,123.45,";
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "bank.csv", uri: "blob:bank", size: text.length, file: { text: jest.fn().mockResolvedValue(text) } }],
    });

    const result = await importCsvStatement(USER_ID);

    expect(result).toMatchObject({
      canceled: false,
      fileName: "bank.csv",
      importedCount: 1,
      savedCount: 1,
      debitCount: 1,
      creditCount: 0,
      cloudSync: {
        status: "synced",
        requestedCount: 1,
        savedCount: 1,
        pendingCount: 0,
      },
    });
    expect(batchInstances[0].set).toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.stringMatching(/^users\/firebase-user-1\/transactions\/csv_/) }),
      {
        date: "2025-01-01",
        amount: 123.45,
        type: "DEBIT",
        sanitizedDescription: "DMART RETAIL",
        category: "SHOPPING",
        merchantKey: "dmart",
      },
    );
  });

  test("runs picker, parser, and cloud save end to end with an Excel .xlsx statement", async () => {
    const XLSX = require("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      ["Date", "Narration", "Withdrawal Amount", "Deposit Amount"],
      ["15/08/2025", "Swiggy Food Order", "450.00", ""],
      ["20/08/2025", "Salary Credit", "", "65000.00"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement");
    const b64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

    LegacyFileSystem.readAsStringAsync.mockResolvedValue(b64);
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "statement.xlsx", uri: "file:///statement.xlsx", size: 500 }],
    });

    const result = await importCsvStatement(USER_ID);

    expect(result).toMatchObject({
      canceled: false,
      fileName: "statement.xlsx",
      importedCount: 2,
      savedCount: 2,
      debitCount: 1,
      creditCount: 1,
      cloudSync: {
        status: "synced",
      },
    });
  });


  test("ends an end-to-end import cleanly when the picker is canceled", async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });
    await expect(importCsvStatement(USER_ID)).resolves.toMatchObject({
      canceled: true,
      savedCount: 0,
    });
    expect(writeBatch).not.toHaveBeenCalled();
  });

  test("requires authentication before opening the picker", async () => {
    await expect(importCsvStatement("")).rejects.toBeInstanceOf(CsvImportError);
    await expect(importCsvStatement("")).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    expect(DocumentPicker.getDocumentAsync).not.toHaveBeenCalled();
  });

  describe("universal statement recognition across all bank formats", () => {
    test("parses Axis Bank format with Tran Date, PARTICULARS, DR, CR, and BAL", () => {
      const csv = [
        "Tran Date,CHQNO,PARTICULARS,DR,CR,BAL",
        "01-02-2025,123456,UPI/ZOMATO/FOOD,450.00,,15000.00",
        "02-02-2025,,SALARY CREDIT,,75000.00,90000.00",
      ].join("\n");

      const parsed = parseCsvStatement(csv, USER_ID);
      expect(parsed.importedCount).toBe(2);
      expect(parsed.transactions[0]).toMatchObject({
        date: "2025-02-01",
        amount: 450,
        type: "DEBIT",
        merchantKey: "zomato",
      });
      expect(parsed.transactions[1]).toMatchObject({
        date: "2025-02-02",
        amount: 75000,
        type: "CREDIT",
        category: "INCOME",
      });
    });

    test("parses Kotak Bank format with Date, Transaction Details, Amount, and Dr / Cr", () => {
      const csv = [
        "Sl. No.,Date,Transaction Details,Chq / Ref No.,Amount,Dr / Cr,Balance",
        "1,15/01/2025,SWIGGY BANGALORE,REF123,320.00,DR,12000.00",
        "2,16/01/2025,INTEREST CREDIT,REF456,150.00,CR,12150.00",
      ].join("\n");

      const parsed = parseCsvStatement(csv, USER_ID);
      expect(parsed.importedCount).toBe(2);
      expect(parsed.transactions[0]).toMatchObject({
        date: "2025-01-15",
        amount: 320,
        type: "DEBIT",
        merchantKey: "swiggy",
      });
      expect(parsed.transactions[1]).toMatchObject({
        date: "2025-01-16",
        amount: 150,
        type: "CREDIT",
      });
    });

    test("parses multi-line / merged bank statement headers", () => {
      const csv = [
        "Date,Transaction Particulars,Transaction Amount,Transaction Amount,Balance",
        ",,Withdrawal,Deposit,",
        "05/03/2025,UBER TRIP,420.00,,9580.00",
        "06/03/2025,REFUND,,100.00,9680.00",
      ].join("\n");

      const parsed = parseCsvStatement(csv, USER_ID);
      expect(parsed.importedCount).toBe(2);
      expect(parsed.transactions[0]).toMatchObject({
        date: "2025-03-05",
        amount: 420,
        type: "DEBIT",
        merchantKey: "uber",
      });
      expect(parsed.transactions[1]).toMatchObject({
        date: "2025-03-06",
        amount: 100,
        type: "CREDIT",
      });
    });

    test("infers table layout from content when column headers are unknown or non-standard", () => {
      const csv = [
        "UNKNOWN_HEADER_1,UNKNOWN_HEADER_2,UNKNOWN_HEADER_3,UNKNOWN_HEADER_4",
        "2025-04-10,Amazon Retail,1499.00,",
        "2025-04-11,Salary Deposit,,45000.00",
      ].join("\n");

      const parsed = parseCsvStatement(csv, USER_ID);
      expect(parsed.importedCount).toBe(2);
      expect(parsed.transactions[0]).toMatchObject({
        date: "2025-04-10",
        amount: 1499,
        type: "DEBIT",
        merchantKey: "amazon",
      });
      expect(parsed.transactions[1]).toMatchObject({
        date: "2025-04-11",
        amount: 45000,
        type: "CREDIT",
      });
    });

    test("parses single debit/charges statement without credit column", () => {
      const csv = [
        "Date,Description,Charges,Balance",
        "01/01/2025,STARBUCKS COFFEE,350.00,9650.00",
        "02/01/2025,DOMINOS PIZZA,650.00,9000.00",
      ].join("\n");

      const parsed = parseCsvStatement(csv, USER_ID);
      expect(parsed.importedCount).toBe(2);
      expect(parsed.transactions[0]).toMatchObject({
        date: "2025-01-01",
        amount: 350,
        type: "DEBIT",
        merchantKey: "starbucks",
      });
      expect(parsed.transactions[1]).toMatchObject({
        date: "2025-01-02",
        amount: 650,
        type: "DEBIT",
        merchantKey: "dominos",
      });
    });

    test("normalizes Excel serial dates, day-of-week prefixes, and month-first dates", () => {
      expect(normalizeTransactionDate("Monday, 18 Sep 2026")).toBe("2026-09-18");
      expect(normalizeTransactionDate("Sep 18, 2026")).toBe("2026-09-18");
      expect(normalizeTransactionDate("September 18, 2026")).toBe("2026-09-18");
      expect(normalizeTransactionDate(45550)).toBe("2024-09-15");
    });
  });
});
