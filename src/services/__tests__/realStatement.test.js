import fs from "fs";
import officecrypto from "officecrypto-tool";
import * as XLSX from "xlsx";
import * as DocumentPicker from "expo-document-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  cacheDirectory: "file:///mock-cache/",
}));

const mockBatch = {
  set: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  writeBatch: jest.fn(() => mockBatch),
  getFirestore: jest.fn(() => ({})),
}));

jest.mock("../../config/firebase", () => ({
  auth: { currentUser: { uid: "user_real_test", getIdToken: jest.fn().mockResolvedValue("tok") } },
  db: {},
}));

import { importCsvStatement, parseCsvStatement } from "../csvService";

describe("Real user bank statement decryption and parsing", () => {
  const filePath = "d:/FinSight-AI/Email_Statement_23092026202314585503.xlsx";
  const password = "51770141204";

  test("decrypts and extracts all transactions from Email_Statement_23092026202314585503.xlsx", async () => {
    expect(fs.existsSync(filePath)).toBe(true);
    const buffer = fs.readFileSync(filePath);

    // Decrypt using officecrypto-tool
    const decrypted = await officecrypto.decrypt(buffer, { password });
    expect(decrypted).toBeTruthy();

    // Read with XLSX
    const wb = XLSX.read(decrypted, { type: "buffer" });
    expect(wb.SheetNames.length).toBeGreaterThan(0);

    const sheetName = wb.SheetNames[0];
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
    expect(csv.length).toBeGreaterThan(100);

    // Parse statement
    const parsed = parseCsvStatement(csv, "user_real_test");
    expect(parsed.importedCount).toBe(460);
    expect(parsed.debitCount).toBe(267);
    expect(parsed.creditCount).toBe(193);

    // Verify first transaction structure
    const firstTx = parsed.transactions[0];
    expect(firstTx).toHaveProperty("date");
    expect(firstTx).toHaveProperty("amount");
    expect(firstTx).toHaveProperty("type");
    expect(firstTx).toHaveProperty("sanitizedDescription");
    expect(firstTx.amount).toBeGreaterThan(0);
  });

  test("importCsvStatement throws PASSWORD_REQUIRED when real encrypted file is selected without password", async () => {
    const base64 = fs.readFileSync(filePath).toString("base64");
    LegacyFileSystem.readAsStringAsync.mockResolvedValue(base64);
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "Email_Statement_23092026202314585503.xlsx", uri: "file:///Email_Statement.xlsx", size: 100000 }],
    });

    await expect(importCsvStatement("user_real_test")).rejects.toMatchObject({
      code: "PASSWORD_REQUIRED",
    });
  });

  test("importCsvStatement throws INCORRECT_PASSWORD when real encrypted file is provided wrong password", async () => {
    const base64 = fs.readFileSync(filePath).toString("base64");
    LegacyFileSystem.readAsStringAsync.mockResolvedValue(base64);
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "Email_Statement_23092026202314585503.xlsx", uri: "file:///Email_Statement.xlsx", size: 100000 }],
    });

    await expect(importCsvStatement("user_real_test", { password: "wrongpassword123" })).rejects.toMatchObject({
      code: "INCORRECT_PASSWORD",
    });
  });

  test("importCsvStatement seamlessly decrypts, parses, and saves real statement with correct password", async () => {
    const base64 = fs.readFileSync(filePath).toString("base64");
    LegacyFileSystem.readAsStringAsync.mockResolvedValue(base64);
    DocumentPicker.getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: "Email_Statement_23092026202314585503.xlsx", uri: "file:///Email_Statement.xlsx", size: 100000 }],
    });

    const result = await importCsvStatement("user_real_test", { password });
    expect(result.canceled).toBe(false);
    expect(result.importedCount).toBe(460);
    expect(result.debitCount).toBe(267);
    expect(result.creditCount).toBe(193);
    expect(result.cloudSync.status).toBe("synced");
  });

  test("all 460 real transactions pass firestore rules constraints", async () => {
    const buffer = fs.readFileSync(filePath);
    const decrypted = await officecrypto.decrypt(buffer, { password });
    const wb = XLSX.read(decrypted, { type: "buffer" });
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    const parsed = parseCsvStatement(csv, "user_real_test");

    const failed = [];
    parsed.transactions.forEach((tx) => {
      const val = tx.sanitizedDescription;
      const issues = [];
      if (typeof val !== "string" || val.length === 0 || val.length > 1000) issues.push("length");
      if (/@/.test(val)) issues.push("contains @");
      if (/[A-Za-z]{4}0[A-Za-z0-9]{6}/.test(val)) issues.push("IFSC");
      if (/[A-Za-z]{5}[0-9]{4}[A-Za-z]/.test(val)) issues.push("PAN");
      if (/[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][0-9][A-Za-z][0-9]/.test(val)) issues.push("GSTIN");
      if (/[0-9]([ .-]?[0-9]){9}/.test(val)) issues.push("phone/10digit");
      if (/([Aa]\/?[Cc]|[Aa][Cc][Cc][Tt]|[Aa][Cc][Cc][Oo][Uu][Nn][Tt]|[Cc][Aa][Rr][Dd]|[Cc][Ii][Ff]|[Cc][Uu][Ss][Tt][Oo][Mm][Ee][Rr])( [Nn][Uu][Mm][Bb][Ee][Rr]| [Nn][Oo][.]?| [Ii][Dd]| #)?[ :=-]*[xX*]*[0-9][0-9 xX*.-]{2,}[0-9]/.test(val)) issues.push("acct_card");
      if (/([Uu][Tt][Rr]|[Rr][Rr][Nn]|[Rr][Ee][Ff][Ee][Rr][Ee][Nn][Cc][Ee]|[Rr][Ee][Ff]|[Tt][Rr][Aa][Nn][Ss][Aa][Cc][Tt][Ii][Oo][Nn]|[Tt][Xx][Nn]|[Oo][Rr][Dd][Ee][Rr]|[Mm][Aa][Nn][Dd][Aa][Tt][Ee])( *([Nn][Uu][Mm][Bb][Ee][Rr]|[Nn][Oo][.]?|[Ii][Dd]|#))?[ :=-]*[A-Za-z0-9][A-Za-z0-9._/-]{5,}/.test(val)) issues.push("ref_utr");
      if (issues.length > 0) {
        failed.push({ id: tx.id, desc: val, issues });
      }
    });

    if (failed.length > 0) {
      console.log("Failed transactions count:", failed.length);
      console.log("Sample failed:", failed.slice(0, 10));
    }
    expect(failed).toEqual([]);
  });

  test("inspects and verifies merchant labels for real statement", async () => {
    const { transactionMerchantLabel } = require("../financialInsights");
    const buffer = fs.readFileSync(filePath);
    const decrypted = await officecrypto.decrypt(buffer, { password });
    const wb = XLSX.read(decrypted, { type: "buffer" });
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]);
    const parsed = parseCsvStatement(csv, "user_real_test");
    
    const labels = parsed.transactions.map((tx) => transactionMerchantLabel(tx));
    expect(labels.length).toBe(460);
    // Verified names are present and properly formatted
    expect(labels).toContain("Bablu Kirana");
    expect(labels).toContain("Utkarsh");
    expect(labels).toContain("Prashik R.");
    expect(labels).toContain("Krish V.");
    expect(labels).toContain("Om Raju");
    expect(labels).toContain("Sanket M.");
    expect(labels).toContain("Chetan A.");
    expect(labels).toContain("New Yadav");
    expect(labels).toContain("Maharashtra State");
    
    // Ensure no raw banking jargon in any label
    labels.forEach((lbl) => {
      expect(lbl).not.toMatch(/^WDL\s+TFR/i);
      expect(lbl).not.toMatch(/^DEP\s+TFR/i);
      expect(lbl).not.toMatch(/UPI\/[DC]R\//i);
      expect(lbl).not.toMatch(/AT\s+00306\s+AKOLA/i);
    });
  });
});
