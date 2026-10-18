import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as LegacyFileSystem from "expo-file-system/legacy";
import Papa from "papaparse";
import { Buffer } from "buffer";

let _xlsxModule = null;
function getXLSX() {
  if (!_xlsxModule) {
    _xlsxModule = require("xlsx");
  }
  return _xlsxModule;
}

const File = (typeof process !== "undefined" && process?.env?.NODE_ENV === "test")
  ? (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require("expo-file-system").File;
      } catch {
        return null;
      }
    })()
  : null;

import { isExcelEncrypted, fastDecryptExcel } from "./excelDecryptor";
import { doc, writeBatch } from "firebase/firestore";

if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

import { auth, db } from "../config/firebase";
import { getFirebaseErrorCode, privateCloudSaveMessage } from "./firebaseErrors";
import { buildFinancialInsights } from "./financialInsights";
import {
  isMerchantBrandKey,
  resolveMerchantBrandKey,
} from "./merchantBrandRegistry";
import {
  isSanitizedTransactionDescription,
  normalizeTransactionDescription,
  sanitizeTransactionDescription,
} from "./privacySanitizer";

export const MAX_CSV_FILE_BYTES = 10 * 1024 * 1024;
export const FIRESTORE_BATCH_LIMIT = 450;
export const MAX_HEADER_SCAN_ROWS = 250;

const MAX_TRANSACTION_AMOUNT = 1_000_000_000_000;
const MAX_STATEMENT_TRANSACTION_COUNT = 1_000_000;
const MAX_STATEMENT_TOTAL = 1_000_000_000_000_000;

const CSV_MIME_TYPES = [
  "text/csv",
  "text/comma-separated-values",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain",
];

const EXCEL_MIME_TYPES = [
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/excel",
  "application/x-excel",
  "application/x-msexcel",
];

const STATEMENT_MIME_TYPES = [
  ...CSV_MIME_TYPES,
  ...EXCEL_MIME_TYPES,
  "application/pdf",
];


const TRANSACTION_FIELDS = [
  "id",
  "date",
  "amount",
  "type",
  "sanitizedDescription",
  "category",
].sort();
const OPTIONAL_TRANSACTION_FIELDS = ["merchantKey"];

const FIRESTORE_TRANSACTION_FIELDS = [
  "date",
  "amount",
  "type",
  "sanitizedDescription",
  "category",
].sort();
const OPTIONAL_FIRESTORE_TRANSACTION_FIELDS = ["merchantKey"];

const TRANSACTION_TYPES = new Set(["DEBIT", "CREDIT"]);
const TRANSACTION_CATEGORIES = new Set([
  "CASH",
  "ENTERTAINMENT",
  "FOOD",
  "HEALTHCARE",
  "INCOME",
  "OTHER",
  "SHOPPING",
  "TRANSFER",
  "TRANSPORTATION",
  "UTILITIES",
]);

const CATEGORY_RULES = [
  ["INCOME", ["salary", "payroll", "wages", "pension", "interest credit"]],
  [
    "FOOD",
    [
      "zomato",
      "swiggy",
      "mcdonalds",
      "kfc",
      "dominos",
      "starbucks",
      "restaurant",
      "cafe",
      "coffee",
      "hotel",
      "egg",
      "bakery",
      "dining",
    ],
  ],
  ["HEALTHCARE", ["pharmacy", "apollo", "hospital", "clinic", "medical", "medplus"]],
  [
    "ENTERTAINMENT",
    ["pvr", "inox", "bookmyshow", "netflix", "spotify", "prime", "hotstar"],
  ],
  [
    "TRANSPORTATION",
    ["uber", "ola", "rapido", "irctc", "metro", "petrol", "fuel", "hpcl", "bpcl", "iocl"],
  ],
  ["SHOPPING", ["amazon", "flipkart", "myntra", "zudio", "trends", "dmart", "retail"]],
  [
    "UTILITIES",
    ["utility", "electricity", "airtel", "jio", "vi", "besl", "recharge", "water", "gas", "bill payment"],
  ],
  ["CASH", ["atm cash", "cash withdrawal", "cash deposit"]],
  ["TRANSFER", ["upi/cr", "upi/dr", "neft", "imps", "rtgs", "transfer"]],
];

const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const HEADER_ALIASES = {
  date: new Map([
    ["transaction date", 110],
    ["txn date", 105],
    ["tran date", 105],
    ["trans date", 105],
    ["posting date", 100],
    ["posted date", 95],
    ["date", 90],
    ["value date", 85],
    ["val date", 85],
    ["booking date", 80],
    ["entry date", 80],
    ["trade date", 80],
    ["date time", 75],
    ["timestamp", 70],
    ["time", 65],
  ]),
  description: new Map([
    ["transaction remarks", 110],
    ["transaction description", 110],
    ["transaction particulars", 110],
    ["transaction details", 105],
    ["description", 100],
    ["narration", 100],
    ["particulars", 100],
    ["remarks", 95],
    ["details", 90],
    ["payee", 90],
    ["beneficiary", 90],
    ["merchant", 90],
    ["party name", 90],
    ["party", 85],
    ["paid to", 85],
    ["memo", 85],
    ["narrative", 85],
    ["comments", 80],
    ["notes", 80],
    ["activity", 80],
    ["item description", 80],
    ["recipient", 80],
  ]),
  debit: new Map([
    ["debit amount", 110],
    ["withdrawal amount", 110],
    ["withdrawals", 105],
    ["dr amount", 100],
    ["debit", 95],
    ["withdrawal", 95],
    ["paid out", 90],
    ["money out", 90],
    ["spent", 90],
    ["dr", 95],
    ["dr.", 95],
    ["charges", 85],
    ["debits", 85],
    ["outflow", 85],
    ["withdrawn", 85],
    ["payment", 80],
    ["payments", 80],
    ["debit amt", 105],
    ["withdrawal amt", 105],
    ["dr amt", 100],
    ["money withdrawn", 90],
    ["amount debited", 100],
  ]),
  credit: new Map([
    ["credit amount", 110],
    ["deposit amount", 110],
    ["deposits", 105],
    ["cr amount", 100],
    ["credit", 95],
    ["deposit", 95],
    ["paid in", 90],
    ["money in", 90],
    ["received", 90],
    ["cr", 95],
    ["cr.", 95],
    ["credits", 85],
    ["inflow", 85],
    ["income", 85],
    ["deposited", 85],
    ["refund", 80],
    ["refunds", 80],
    ["credit amt", 105],
    ["deposit amt", 105],
    ["cr amt", 100],
    ["money deposited", 90],
    ["amount credited", 100],
  ]),
  amount: new Map([
    ["transaction amount", 110],
    ["txn amount", 105],
    ["tran amount", 105],
    ["trans amount", 105],
    ["total amount", 100],
    ["net amount", 100],
    ["billing amount", 100],
    ["spend amount", 100],
    ["payment amount", 100],
    ["signed amount", 100],
    ["amount", 95],
    ["amt", 95],
    ["amount in inr", 105],
    ["amount in rs", 105],
    ["val", 80],
    ["value", 80],
  ]),
  direction: new Map([
    ["transaction type", 110],
    ["txn type", 105],
    ["tran type", 105],
    ["debit credit", 105],
    ["debit credit indicator", 105],
    ["dr cr", 100],
    ["cr dr", 100],
    ["d c", 95],
    ["type", 90],
    ["direction", 90],
    ["indicator", 85],
    ["dr cr indicator", 100],
    ["status", 80],
    ["mode", 80],
  ]),
  balance: new Map([
    ["closing balance", 100],
    ["running balance", 95],
    ["available balance", 95],
    ["ledger balance", 90],
    ["balance", 90],
    ["bal", 85],
    ["closing bal", 95],
    ["run bal", 90],
  ]),
};

export class CsvImportError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "CsvImportError";
    this.code = code;
    Object.assign(this, details);
  }
}

function asCsvError(error, code, message, details = {}) {
  if (error instanceof CsvImportError) return error;
  return new CsvImportError(code, message, { ...details, cause: error });
}

function assertUserId(userId) {
  if (
    typeof userId !== "string" ||
    !userId.trim() ||
    userId !== userId.trim() ||
    userId.includes("/")
  ) {
    throw new CsvImportError(
      "AUTH_REQUIRED",
      "Sign in before importing a bank statement.",
    );
  }
}

async function confirmPrivateCloudOwner(userId) {
  let activeUser = auth.currentUser;
  if (!activeUser) {
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 100));
      activeUser = auth.currentUser;
      if (activeUser) break;
    }
  }

  if (!activeUser || activeUser.uid !== userId) {
    throw new CsvImportError(
      "FIRESTORE_AUTH_REQUIRED",
      "The signed-in account changed before private cloud save. Return to the account that analyzed this statement, then retry from this screen.",
      {
        firestoreCode: "unauthenticated",
        retryable: true,
      },
    );
  }

  try {
    await activeUser.getIdToken();
  } catch (error) {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      const firestoreCode = getFirebaseErrorCode(error) || "unauthenticated";
      throw new CsvImportError(
        "FIRESTORE_AUTH_REFRESH_FAILED",
        privateCloudSaveMessage(error),
        {
          firestoreCode,
          retryable: true,
          cause: error,
        },
      );
    }
  }

  if (auth.currentUser?.uid !== userId) {
    throw new CsvImportError(
      "FIRESTORE_AUTH_REQUIRED",
      "The signed-in account changed while private cloud access was being refreshed. Return to the original account and retry from this screen.",
      {
        firestoreCode: "unauthenticated",
        retryable: true,
      },
    );
  }
}

function normalizeCategoryText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function categorizeTransaction(description) {
  const normalized = normalizeCategoryText(description);
  if (!normalized) return "OTHER";

  const searchable = ` ${normalized} `;
  for (const [category, keywords] of CATEGORY_RULES) {
    for (const keyword of keywords) {
      const normalizedKeyword = normalizeCategoryText(keyword);
      if (searchable.includes(` ${normalizedKeyword} `)) return category;
    }
  }

  return "OTHER";
}

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[₹$€£]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(?:inr|rs|rupee|rupees|lakhs?|ps)\b/g, " ")
    .replace(/\bamt\b/g, "amount")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyHeaderPattern(normalized) {
  if (!normalized) return null;

  // Direction / Type (must be checked before debit/credit so 'debit/credit' or 'dr cr' isn't mistaken for debit)
  if (
    /\b(dr\s*[\/\-]?\s*cr|cr\s*[\/\-]?\s*dr|debit\s*[\/\-]?\s*credit|d\s*[\/\-]?\s*c|txn\s*type|tran\s*type|transaction\s*type|indicator|direction)\b/.test(
      normalized,
    ) ||
    /^(?:type|mode|status)$/.test(normalized)
  ) {
    return { role: "direction", priority: 85, normalized };
  }

  // Debit
  if (
    /\b(debits?|dr\b|withdrawals?|withdrawn|paid\s*out|money\s*out|spent|charges?|outflow|debited)\b/.test(
      normalized,
    )
  ) {
    return { role: "debit", priority: 80, normalized };
  }

  // Credit
  if (
    /\b(credits?|cr\b|deposits?|deposited|paid\s*in|money\s*in|received|income|inflow|credited|refunds?)\b/.test(
      normalized,
    )
  ) {
    return { role: "credit", priority: 80, normalized };
  }

  // Date
  if (
    /\b(dates?|dt\b|posting|posted|txn\s*date|tran\s*date|trans\s*date|val(?:ue)?\s*date|entry\s*date|booking\s*date|trade\s*date|timestamps?)\b/.test(
      normalized,
    )
  ) {
    return { role: "date", priority: 75, normalized };
  }

  // Balance
  if (/\b(balances?|bal\b|closing\s*bal|running\s*bal|ledger\s*bal)\b/.test(normalized)) {
    return { role: "balance", priority: 70, normalized };
  }

  // Amount
  if (/\b(amounts?|amt\b|total\s*amount|net\s*amount|txn\s*amount|billing\s*amount)\b/.test(normalized)) {
    return { role: "amount", priority: 75, normalized };
  }

  // Description
  if (
    /\b(desc(?:ription)?|particulars?|narration|narrative|remarks?|details?|memo|payee|beneficiary|merchant|party(?:\s*name)?|activity|notes?|comments?|paid\s*to|recipient)\b/.test(
      normalized,
    )
  ) {
    return { role: "description", priority: 70, normalized };
  }

  return null;
}

function classifyHeader(value) {
  const normalized = normalizeHeader(value);
  if (!normalized) return null;

  for (const role of [
    "direction",
    "debit",
    "credit",
    "date",
    "description",
    "amount",
    "balance",
  ]) {
    const priority = HEADER_ALIASES[role]?.get(normalized);
    if (priority) return { role, priority, normalized };
  }

  return classifyHeaderPattern(normalized);
}

function mapHeaderRow(row) {
  const mapping = {};
  const priorities = {};

  row.forEach((value, index) => {
    const match = classifyHeader(value);
    if (!match) return;
    if (!priorities[match.role] || match.priority > priorities[match.role]) {
      mapping[match.role] = index;
      priorities[match.role] = match.priority;
    }
  });

  const missing = [];
  if (mapping.date === undefined) missing.push("date");
  if (mapping.description === undefined) missing.push("description");

  let amountMode = null;
  if (mapping.debit !== undefined && mapping.credit !== undefined) {
    amountMode = "split";
  } else if (mapping.amount !== undefined && mapping.direction !== undefined) {
    amountMode = "amount-direction";
  } else if (mapping.amount !== undefined) {
    amountMode = "signed-amount";
  } else if (mapping.debit !== undefined) {
    mapping.amount = mapping.debit;
    amountMode = "signed-amount";
  } else if (mapping.credit !== undefined) {
    mapping.amount = mapping.credit;
    amountMode = "signed-amount";
  } else {
    missing.push("debit/credit or amount/type");
  }

  const modeScore = amountMode === "split" ? 40 : amountMode === "amount-direction" ? 30 : amountMode ? 10 : 0;
  const found = Object.keys(mapping);

  return {
    mapping,
    amountMode,
    missing,
    complete: missing.length === 0 && Boolean(amountMode),
    score:
      found.length * 100 +
      modeScore +
      Object.values(priorities).reduce((sum, value) => sum + value, 0),
    headers: row.map((value) => String(value ?? "").replace(/^\uFEFF/, "").trim()),
  };
}

function inferStatementLayoutFromContent(rows, delimiter) {
  if (!Array.isArray(rows) || rows.length < 2) return null;

  const maxCols = Math.max(...rows.map((r) => (Array.isArray(r) ? r.length : 0)));
  if (maxCols < 2) return null;

  const colStats = Array.from({ length: maxCols }, () => ({
    dateCount: 0,
    amountCount: 0,
    directionCount: 0,
    textCount: 0,
  }));

  let evaluatedRows = 0;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length === 0) continue;
    const nonEmpties = row.filter((c) => String(c ?? "").trim().length > 0);
    if (nonEmpties.length < 2) continue;

    evaluatedRows++;
    for (let c = 0; c < maxCols; c++) {
      const val = row[c];
      const str = String(val ?? "").trim();
      if (!str) continue;

      if (normalizeTransactionDate(val)) {
        colStats[c].dateCount++;
      }
      if (normalizeTransactionAmount(val)) {
        colStats[c].amountCount++;
      }
      if (/^(?:dr|cr|debit|credit|d|c)$/i.test(str)) {
        colStats[c].directionCount++;
      }
      if (
        str.length >= 3 &&
        /[A-Za-z]/.test(str) &&
        !normalizeTransactionDate(val) &&
        !/^(?:dr|cr|debit|credit)$/i.test(str)
      ) {
        colStats[c].textCount++;
      }
    }
  }

  if (evaluatedRows < 1) return null;

  // 1. Identify Date column
  let dateCol = -1;
  let maxDate = 0;
  for (let c = 0; c < maxCols; c++) {
    if (colStats[c].dateCount > maxDate && colStats[c].dateCount >= Math.min(2, evaluatedRows * 0.15)) {
      maxDate = colStats[c].dateCount;
      dateCol = c;
    }
  }
  if (dateCol === -1) return null;

  // 2. Identify Amount / Numeric columns
  const numericCols = [];
  for (let c = 0; c < maxCols; c++) {
    if (c === dateCol) continue;
    if (colStats[c].amountCount >= Math.min(2, evaluatedRows * 0.15)) {
      numericCols.push({ col: c, count: colStats[c].amountCount });
    }
  }
  numericCols.sort((a, b) => b.count - a.count);
  if (numericCols.length === 0) return null;

  // 3. Identify Description column (highest textCount, not dateCol, not numeric)
  const numColSet = new Set(numericCols.map((n) => n.col));
  let descCol = -1;
  let maxText = 0;
  for (let c = 0; c < maxCols; c++) {
    if (c === dateCol || numColSet.has(c)) continue;
    if (colStats[c].textCount > maxText) {
      maxText = colStats[c].textCount;
      descCol = c;
    }
  }
  if (descCol === -1) {
    for (let c = 0; c < maxCols; c++) {
      if (c !== dateCol && colStats[c].textCount > 0) {
        descCol = c;
        break;
      }
    }
  }
  if (descCol === -1) return null;

  // 4. Determine Amount Mode
  const mapping = { date: dateCol, description: descCol };
  let amountMode = "signed-amount";

  let dirCol = -1;
  for (let c = 0; c < maxCols; c++) {
    if (c === dateCol || c === descCol || numColSet.has(c)) continue;
    if (colStats[c].directionCount >= Math.min(2, evaluatedRows * 0.15)) {
      dirCol = c;
      break;
    }
  }

  if (numericCols.length >= 2) {
    const c1 = numericCols[0].col;
    const c2 = numericCols[1].col;
    mapping.debit = Math.min(c1, c2);
    mapping.credit = Math.max(c1, c2);
    amountMode = "split";
    if (numericCols.length >= 3) {
      mapping.balance = numericCols[2].col;
    }
  } else if (dirCol !== -1) {
    mapping.amount = numericCols[0].col;
    mapping.direction = dirCol;
    amountMode = "amount-direction";
  } else {
    mapping.amount = numericCols[0].col;
    amountMode = "signed-amount";
  }

  // 5. Find the first row that has actual data
  let firstDataRow = -1;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (Array.isArray(row) && normalizeTransactionDate(row[dateCol])) {
      firstDataRow = r;
      break;
    }
  }
  const headerRowIndex = firstDataRow > 0 ? firstDataRow - 1 : 0;
  const headerRow = rows[headerRowIndex] || [];

  return {
    delimiter,
    rows,
    errors: [],
    header: {
      mapping,
      amountMode,
      missing: [],
      complete: true,
      score: 500,
      headers: Array.isArray(headerRow) ? headerRow.map((v) => String(v ?? "").trim()) : [],
      rowIndex: headerRowIndex,
      inferred: true,
    },
  };
}

function parseDelimiterPreview(csvText, delimiter) {
  const parsed = Papa.parse(csvText, {
    delimiter,
    skipEmptyLines: "greedy",
    preview: MAX_HEADER_SCAN_ROWS,
  });
  const rows = Array.isArray(parsed.data) ? parsed.data : [];
  let bestHeader = null;

  rows.forEach((row, rowIndex) => {
    if (!Array.isArray(row)) return;
    const candidate = { ...mapHeaderRow(row), rowIndex };
    if (
      !bestHeader ||
      Number(candidate.complete) > Number(bestHeader.complete) ||
      (candidate.complete === bestHeader.complete && candidate.score > bestHeader.score)
    ) {
      bestHeader = candidate;
    }

    // Check merged with next row for multi-line bank headers
    if (rowIndex + 1 < rows.length && Array.isArray(rows[rowIndex + 1])) {
      const mergedRow = row.map((v, c) => `${v ?? ""} ${rows[rowIndex + 1][c] ?? ""}`.trim());
      const mergedCandidate = { ...mapHeaderRow(mergedRow), rowIndex: rowIndex + 1 };
      if (
        !bestHeader ||
        Number(mergedCandidate.complete) > Number(bestHeader.complete) ||
        (mergedCandidate.complete === bestHeader.complete && mergedCandidate.score > bestHeader.score)
      ) {
        bestHeader = mergedCandidate;
      }
    }
  });

  return { delimiter, header: bestHeader };
}

function discoverStatementLayout(csvText) {
  const candidates = [",", ";", "\t", "|", ""]
    .map((delimiter) => parseDelimiterPreview(csvText, delimiter))
    .sort((left, right) => {
      const completeDifference = Number(right.header?.complete) - Number(left.header?.complete);
      if (completeDifference) return completeDifference;
      return (right.header?.score || 0) - (left.header?.score || 0);
    });

  let selected = candidates[0];

  // If header wasn't complete from row title names, try HEURISTIC CONTENT-BASED INFERENCE!
  if (!selected?.header?.complete) {
    for (const delimiter of [",", ";", "\t", "|", ""]) {
      const parsedFull = Papa.parse(csvText, {
        delimiter,
        skipEmptyLines: "greedy",
      });
      const rows = Array.isArray(parsedFull.data) ? parsedFull.data : [];
      const inferred = inferStatementLayoutFromContent(rows, delimiter);
      if (inferred && inferred.header.complete) {
        return inferred;
      }
    }
  }

  if (!selected?.header?.complete) {
    const missing = selected?.header?.missing || ["date", "description", "transaction amount"];
    const foundHeaders = (selected?.header?.headers || []).filter(Boolean);
    throw new CsvImportError(
      "UNSUPPORTED_HEADERS",
      `This CSV does not contain a recognizable bank transaction table. Missing ${missing.join(", ")}. Use date and description columns with either separate debit/credit columns or an amount and transaction-type column.`,
      { missingColumns: missing, foundHeaders },
    );
  }

  const parsed = Papa.parse(csvText, {
    delimiter: selected.delimiter,
    skipEmptyLines: "greedy",
  });

  return {
    delimiter: selected.delimiter,
    rows: Array.isArray(parsed.data) ? parsed.data : [],
    errors: parsed.errors || [],
    header: selected.header,
  };
}

function normalizeYear(value) {
  const year = Number(value);
  if (String(value).length === 2) return year >= 70 ? 1900 + year : 2000 + year;
  return year;
}

function toIsoCalendarDate(yearValue, monthValue, dayValue) {
  const year = normalizeYear(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function normalizeTransactionDate(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  let input = String(value)
    .replace(/^\uFEFF/, "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();
  if (!input) return null;

  // Day of week prefix: "Mon, 18 Sep 2026" or "Wednesday 18/09/2026"
  input = input.replace(/^(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?),?\s+/i, "");

  // Excel serial date number: 5 digits e.g. 45281
  if (/^\d{5}$/.test(input)) {
    const num = Number(input);
    if (num >= 30000 && num <= 65000) {
      const d = new Date(Math.round((num - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }

  // YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  let match = input.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
  if (match) return toIsoCalendarDate(match[1], match[2], match[3]);

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  match = input.match(/^(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{2}|\d{4})(?:\s.*)?$/);
  if (match) return toIsoCalendarDate(match[3], match[2], match[1]);

  // DD-Mon-YYYY or DD Mon YYYY (e.g. 18-Sep-2026, 18 Sep 2026)
  match = input.match(/^(\d{1,2})[\s/.-]+([A-Za-z]{3,9})[\s,/.-]+(\d{2}|\d{4})(?:\s.*)?$/);
  if (match) {
    const month = MONTHS[match[2].slice(0, 3).toLowerCase()];
    return month ? toIsoCalendarDate(match[3], month, match[1]) : null;
  }

  // Mon DD, YYYY or Month DD YYYY (e.g. Sep 18, 2026)
  match = input.match(/^([A-Za-z]{3,9})[\s/.-]+(\d{1,2})[\s,/.-]+(\d{2}|\d{4})(?:\s.*)?$/);
  if (match) {
    const month = MONTHS[match[1].slice(0, 3).toLowerCase()];
    return month ? toIsoCalendarDate(match[3], month, match[2]) : null;
  }

  return null;
}

export function normalizeTransactionAmount(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    const numeric = Math.abs(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  let input = String(value)
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .trim();
  if (!input || /^[-–—]+$/.test(input)) return null;

  // Handle European 1.250,50 vs standard 1,250.50
  if (/^\d{1,3}(?:\.\d{3})+,\d{2}$/.test(input.replace(/[^\d.,]/g, ""))) {
    input = input.replace(/\./g, "").replace(",", ".");
  }

  input = input
    .replace(/^\((.*)\)$/, "$1")
    .replace(/(?:\s|\.)*(?:cr|dr)\.?$/i, "")
    .replace(/^(?:cr|dr)\.?(?:\s|\.)*/i, "")
    .replace(/[₹$€£,]/g, "")
    .replace(/\b(?:inr|rs|rupee|rupees|usd|eur|gbp)\.?/gi, "")
    .replace(/\s+/g, "")
    .replace(/^[+-]/, "")
    .replace(/[+-]$/, "");

  if (!/^\d+(?:\.\d+)?$/.test(input)) return null;
  const numeric = Number(input);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizeDirection(value) {
  const normalized = normalizeHeader(value);
  if (!normalized) return null;
  if (/^(?:debit|dr|d|withdrawal|withdraw|paid out|outflow|payment|charge|spent)$/.test(normalized)) return "DEBIT";
  if (/^(?:credit|cr|c|deposit|paid in|inflow|refund|income|received)$/.test(normalized)) return "CREDIT";
  return null;
}

function parseSingleAmount(value) {
  const raw = String(value ?? "").normalize("NFKC").trim();
  const amount = normalizeTransactionAmount(value);
  if (!amount) return { amount: null, indicatedType: null };

  let indicatedType = null;
  if (
    /(?:\bdr\.?|\bdebit\b)\s*$/i.test(raw) ||
    /^\s*(?:\bdr\.?|\bdebit\b)/i.test(raw) ||
    /^-/.test(raw) ||
    /-$/.test(raw) ||
    /^\(.*\)$/.test(raw)
  ) {
    indicatedType = "DEBIT";
  } else if (
    /(?:\bcr\.?|\bcredit\b)\s*$/i.test(raw) ||
    /^\s*(?:\bcr\.?|\bcredit\b)/i.test(raw) ||
    /^\+/.test(raw) ||
    /\+$/.test(raw)
  ) {
    indicatedType = "CREDIT";
  }

  return { amount, indicatedType };
}

function resolveTransactionAmount(row, mapping, amountMode, previousBalance = null, description = "") {
  if (amountMode === "split") {
    const debitAmount = normalizeTransactionAmount(row[mapping.debit]);
    const creditAmount = normalizeTransactionAmount(row[mapping.credit]);
    return {
      amount: debitAmount || creditAmount,
      type: debitAmount ? "DEBIT" : creditAmount ? "CREDIT" : null,
      debitAmount,
      creditAmount,
      ambiguous: Boolean(debitAmount && creditAmount),
      missingDirection: false,
    };
  }

  if (mapping.debit !== undefined && mapping.credit === undefined) {
    const debitAmount = normalizeTransactionAmount(row[mapping.debit]);
    return {
      amount: debitAmount,
      type: debitAmount ? "DEBIT" : null,
      debitAmount,
      creditAmount: null,
      ambiguous: false,
      missingDirection: false,
    };
  }

  if (mapping.credit !== undefined && mapping.debit === undefined) {
    const creditAmount = normalizeTransactionAmount(row[mapping.credit]);
    return {
      amount: creditAmount,
      type: creditAmount ? "CREDIT" : null,
      debitAmount: null,
      creditAmount,
      ambiguous: false,
      missingDirection: false,
    };
  }

  const single = parseSingleAmount(row[mapping.amount]);
  const explicitType =
    mapping.direction === undefined ? null : normalizeDirection(row[mapping.direction]);
  let type = explicitType || single.indicatedType;

  // If still not determined, deduce from balance delta if available
  if (!type && mapping.balance !== undefined && previousBalance !== null) {
    const curBal = normalizeTransactionAmount(row[mapping.balance]);
    if (curBal !== null && curBal !== previousBalance) {
      type = curBal < previousBalance ? "DEBIT" : "CREDIT";
    }
  }

  // If still not determined, deduce from credit keywords in description
  if (!type && description && /\b(salary|payroll|wages|interest(?:\s*credit)?|dividend|refund|cashback|reversal|credit|received|by\s*transfer|deposit|income)\b/i.test(description)) {
    type = "CREDIT";
  }

  return {
    amount: single.amount,
    type,
    debitAmount: type === "DEBIT" ? single.amount : null,
    creditAmount: type === "CREDIT" ? single.amount : null,
    ambiguous: false,
    missingDirection: Boolean(single.amount && !type),
  };
}

function isSummaryRow(description) {
  return /^(?:grand\s+)?total\b|^(?:opening|closing)\s+balance\b|^balance\s+(?:brought|carried)\s+forward\b/i.test(
    description,
  );
}

function hash32(value, seed) {
  let hash = seed >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function transactionIdentity(transaction) {
  return [
    transaction.date,
    Number(transaction.amount).toFixed(2),
    transaction.type,
    transaction.sanitizedDescription,
    transaction.category,
  ].join("\u001f");
}

export function createTransactionId(userId, transaction, occurrence = 1) {
  assertUserId(userId);
  if (!transaction || typeof transaction !== "object" || Array.isArray(transaction)) {
    throw new CsvImportError("INVALID_TRANSACTION", "A transaction is not a valid object.");
  }
  const safeOccurrence = Number.isInteger(occurrence) && occurrence > 0 ? occurrence : 1;
  const identity = `${userId}\u001e${transactionIdentity(transaction)}\u001e${safeOccurrence}`;
  return `csv_${hash32(identity, 0x811c9dc5)}${hash32(`finsight:${identity}`, 0x9e3779b9)}`;
}

function parserDiagnostics(errors, headerRowIndex) {
  return errors
    .filter((error) => error.code !== "UndetectableDelimiter")
    .map((error) => ({
      row: Number.isInteger(error.row) ? error.row + 1 : headerRowIndex + 1,
      code: error.code || "CSV_PARSE_WARNING",
      message: error.message || "The CSV contains a malformed row.",
    }));
}

function clearParsedRows(rows) {
  if (!Array.isArray(rows)) return;
  rows.forEach((row, index) => {
    if (Array.isArray(row)) row.fill("");
    rows[index] = null;
  });
  rows.length = 0;
}

export function parseCsvStatement(csvText, userId) {
  assertUserId(userId);
  if (typeof csvText !== "string" || !csvText.replace(/^\uFEFF/, "").trim()) {
    throw new CsvImportError("CSV_EMPTY", "The selected CSV file is empty.");
  }
  if (csvText.length > MAX_CSV_FILE_BYTES) {
    throw new CsvImportError(
      "FILE_TOO_LARGE",
      "The CSV is larger than 10 MB. Export a smaller date range and try again.",
      { maxBytes: MAX_CSV_FILE_BYTES },
    );
  }

  const layout = discoverStatementLayout(csvText.replace(/^\uFEFF/, ""));
  const { mapping, amountMode } = layout.header;
  const diagnostics = parserDiagnostics(layout.errors, layout.header.rowIndex);
  const transactions = [];
  const occurrenceCounts = new Map();
  let skippedCount = 0;
  let previousBalance = null;

  try {
    for (let index = 0; index <= layout.header.rowIndex; index += 1) {
      if (Array.isArray(layout.rows[index])) layout.rows[index].fill("");
      layout.rows[index] = null;
    }

    for (let rowIndex = layout.header.rowIndex + 1; rowIndex < layout.rows.length; rowIndex += 1) {
      const row = layout.rows[rowIndex];
      if (!Array.isArray(row)) continue;
      const sourceRowNumber = rowIndex + 1;

      try {
        const rawDescription = normalizeTransactionDescription(row[mapping.description]);
        const date = normalizeTransactionDate(row[mapping.date]);
        const resolvedAmount = resolveTransactionAmount(row, mapping, amountMode, previousBalance, rawDescription);
        if (mapping.balance !== undefined) {
          const bal = normalizeTransactionAmount(row[mapping.balance]);
          if (bal !== null) previousBalance = bal;
        }

        let code = null;
        let message = null;
        if (isSummaryRow(rawDescription)) {
          code = "SUMMARY_ROW";
          message = "Summary and balance rows are not imported.";
        } else if (!rawDescription) {
          code = "MISSING_DESCRIPTION";
          message = "Skipped a row without a transaction description.";
        } else if (rawDescription.length > 1000) {
          code = "DESCRIPTION_TOO_LONG";
          message = "Skipped a row whose description exceeds 1,000 characters.";
        } else if (!date) {
          code = "INVALID_DATE";
          message = "Skipped a row with an invalid or unsupported date.";
        } else if (resolvedAmount.ambiguous) {
          code = "AMBIGUOUS_AMOUNT";
          message = "Skipped a row containing both debit and credit amounts.";
        } else if (!resolvedAmount.amount) {
          code = "MISSING_AMOUNT";
          message = "Skipped a row without a positive transaction amount.";
        } else if (resolvedAmount.missingDirection || !resolvedAmount.type) {
          code = "MISSING_DIRECTION";
          message = "Skipped a row whose amount is missing a debit/credit type or sign.";
        }

        if (code) {
          skippedCount += 1;
          diagnostics.push({ row: sourceRowNumber, code, message });
          continue;
        }

        const merchantKey = resolveMerchantBrandKey(rawDescription);
        const cleanTransaction = {
          date,
          amount: resolvedAmount.amount,
          type: resolvedAmount.type,
          sanitizedDescription: sanitizeTransactionDescription(rawDescription),
          category: categorizeTransaction(rawDescription),
          ...(merchantKey ? { merchantKey } : {}),
        };
        const identity = transactionIdentity(cleanTransaction);
        const occurrence = (occurrenceCounts.get(identity) || 0) + 1;
        occurrenceCounts.set(identity, occurrence);

        transactions.push({
          id: createTransactionId(userId, cleanTransaction, occurrence),
          ...cleanTransaction,
        });
      } finally {
        row.fill("");
        layout.rows[rowIndex] = null;
      }
    }
  } finally {
    clearParsedRows(layout.rows);
  }

  if (transactions.length === 0) {
    const malformed = diagnostics.some((diagnostic) => diagnostic.code === "MissingQuotes");
    const missingDirection = diagnostics.some(
      (diagnostic) => diagnostic.code === "MISSING_DIRECTION",
    );
    throw new CsvImportError(
      malformed ? "CSV_MALFORMED" : "NO_VALID_TRANSACTIONS",
      malformed
        ? "The CSV contains malformed quoted data and no transactions could be read. Export it again and retry."
        : missingDirection
          ? "No transactions could be classified as debit or credit. Include a Type/Dr-Cr column or use signed amounts."
          : "No valid transactions were found. Check the dates and amount columns, then try again.",
      { diagnostics, skippedCount },
    );
  }

  const debitCount = transactions.filter((transaction) => transaction.type === "DEBIT").length;
  const creditCount = transactions.length - debitCount;

  return {
    transactions,
    diagnostics,
    importedCount: transactions.length,
    debitCount,
    creditCount,
    skippedCount,
    delimiter: layout.delimiter,
    headerRow: layout.header.rowIndex + 1,
    metadataRowsDiscarded: layout.header.rowIndex,
  };
}

function fileNameFromAsset(asset) {
  if (asset?.name) return String(asset.name);
  try {
    const uriName = String(asset?.uri || "").split(/[\\/]/).pop();
    return uriName ? decodeURIComponent(uriName.split("?")[0]) : "";
  } catch {
    const raw = String(asset?.uri || "").split(/[\\/]/).pop() || "";
    return raw.split("?")[0];
  }
}

function safeReadFailure(reader, error) {
  const errorName =
    error && typeof error.name === "string" && error.name.trim()
      ? error.name.trim()
      : "Error";
  const errorCode =
    error &&
    typeof error.code === "string" &&
    /^[A-Za-z0-9_.-]{1,80}$/.test(error.code)
      ? error.code
      : null;

  return errorCode ? { reader, errorName, errorCode } : { reader, errorName };
}

function fileReadFailed(readFailures) {
  return new CsvImportError(
    "FILE_READ_FAILED",
    "The selected CSV could not be read securely. Choose it again or export a new CSV copy.",
    { readFailures },
  );
}

let cacheCopySequence = 0;

function nextCacheCopyUri(ext = ".csv") {
  const cacheDirectory = LegacyFileSystem.cacheDirectory;
  if (typeof cacheDirectory !== "string" || !cacheDirectory) return null;

  cacheCopySequence += 1;
  const separator = cacheDirectory.endsWith("/") ? "" : "/";
  return `${cacheDirectory}${separator}finsight-csv-import-${Date.now()}-${cacheCopySequence}${ext}`;
}

async function deleteCacheUriOrThrow(uri) {
  if (typeof LegacyFileSystem.deleteAsync !== "function") {
    throw new CsvImportError(
      "TEMP_FILE_CLEANUP_FAILED",
      "FinSight stopped because it could not verify removal of a temporary statement copy.",
    );
  }
  try {
    await LegacyFileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    throw new CsvImportError(
      "TEMP_FILE_CLEANUP_FAILED",
      "FinSight stopped because a temporary statement copy could not be removed. Close the app and try the import again.",
      { cleanupFailure: safeReadFailure("cache-delete", error) },
    );
  }
}

async function sweepStaleCacheCopies() {
  const cacheDirectory = LegacyFileSystem.cacheDirectory;
  if (
    typeof cacheDirectory !== "string"
    || !cacheDirectory
    || typeof LegacyFileSystem.readDirectoryAsync !== "function"
    || typeof LegacyFileSystem.deleteAsync !== "function"
  ) {
    return;
  }

  let entries;
  try {
    entries = await LegacyFileSystem.readDirectoryAsync(cacheDirectory);
  } catch {
    return;
  }

  const separator = cacheDirectory.endsWith("/") ? "" : "/";
  for (const name of entries) {
    if (typeof name !== "string" || !name.startsWith("finsight-csv-import-")) continue;
    await deleteCacheUriOrThrow(`${cacheDirectory}${separator}${name}`);
  }
}

async function readContentUriFromCache(uri, readFailures, isExcel = false) {
  const ext = isExcel ? ".xlsx" : ".csv";
  const cacheUri = nextCacheCopyUri(ext);
  if (!cacheUri || typeof LegacyFileSystem.copyAsync !== "function") return null;

  await sweepStaleCacheCopies();
  let copied = false;
  try {
    await LegacyFileSystem.copyAsync({ from: uri, to: cacheUri });
    copied = true;

    if (isExcel) {
      try {
        const base64 = await LegacyFileSystem.readAsStringAsync(cacheUri, {
          encoding: LegacyFileSystem.EncodingType?.Base64 || "base64",
        });
        if (typeof base64 === "string" && base64.length > 0) {
          return { text: "", base64 };
        }
      } catch (error) {
        readFailures.push(safeReadFailure("cache-legacy-read-base64", error));
      }
    }

    if (typeof process !== "undefined" && process?.env?.NODE_ENV === "test" && File) {
      try {
        return await new File(cacheUri).text();
      } catch (error) {
        readFailures.push(safeReadFailure("cache-file-text", error));
      }
    }

    try {
      return await LegacyFileSystem.readAsStringAsync(cacheUri);
    } catch (error) {
      readFailures.push(safeReadFailure("legacy-cache-read-as-string", error));
      return null;
    }
  } catch (error) {
    if (error instanceof CsvImportError) throw error;
    readFailures.push(safeReadFailure("legacy-copy-to-cache", error));
    return null;
  } finally {
    if (copied) {
      try {
        await deleteCacheUriOrThrow(cacheUri);
      } catch {
        // Safe cleanup: do not abort successful file read
      }
    }
  }
}

function readBrowserFileWithFileReader(browserFile) {
  return new Promise((resolve, reject) => {
    const BrowserFileReader =
      typeof globalThis === "object" ? globalThis.FileReader : null;
    if (typeof BrowserFileReader !== "function") {
      const error = new Error("Browser FileReader is unavailable.");
      error.name = "NotSupportedError";
      reject(error);
      return;
    }

    let reader;
    try {
      reader = new BrowserFileReader();
    } catch (error) {
      reject(error);
      return;
    }

    reader.onerror = () => {
      reject(reader.error || new Error("The browser could not read the selected file."));
    };
    reader.onabort = () => {
      const error = new Error("The browser file read was canceled.");
      error.name = "AbortError";
      reject(error);
    };
    reader.onload = (event) => {
      const result = event?.target?.result ?? reader.result;
      if (typeof result === "string") {
        resolve(result);
        return;
      }
      reject(new TypeError("The browser returned unsupported file contents."));
    };

    try {
      reader.readAsText(browserFile);
    } catch (error) {
      reject(error);
    }
  });
}

function browserFileFromPicker(result, asset) {
  if (asset?.file) return asset.file;

  const output = result?.output;
  if (!output) return null;
  try {
    if (typeof output.item === "function") return output.item(0);
    return output[0] || null;
  } catch {
    return null;
  }
}

function revokeBrowserObjectUrl(uri) {
  if (typeof uri !== "string" || !/^blob:/i.test(uri)) return;
  const urlApi = typeof globalThis === "object" ? globalThis.URL : null;
  if (!urlApi || typeof urlApi.revokeObjectURL !== "function") return;
  try {
    urlApi.revokeObjectURL(uri);
  } catch {
    // Revocation is best-effort; the selected browser File is never persisted by the app.
  }
}

async function readPickedAsset(asset, browserFile = asset.file) {
  const isExcel = /\.(xlsx|xls)$/i.test(asset?.name || asset?.fileName || asset?.uri || "");
  const readFailures = [];

  if (browserFile) {
    if (isExcel && typeof browserFile.arrayBuffer === "function") {
      try {
        const buffer = await browserFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = typeof globalThis.btoa === "function" ? globalThis.btoa(binary) : null;
        return { text: binary, base64: b64 };
      } catch (error) {
        readFailures.push(safeReadFailure("web-file-arraybuffer", error));
      }
    }

    if (typeof browserFile.text === "function") {
      try {
        const text = await browserFile.text();
        if (typeof text === "string") return text;
        throw new TypeError("The browser returned unsupported file contents.");
      } catch (error) {
        readFailures.push(safeReadFailure("web-file-text", error));
      }
    }

    try {
      return await readBrowserFileWithFileReader(browserFile);
    } catch (error) {
      readFailures.push(safeReadFailure("web-file-reader", error));
      throw fileReadFailed(readFailures);
    }
  }

  if (!asset.uri) {
    throw fileReadFailed([{ reader: "document-picker-uri", errorName: "MissingUri" }]);
  }
  if (/^blob:/i.test(asset.uri)) {
    throw fileReadFailed([{ reader: "browser-file", errorName: "MissingFile" }]);
  }

  if (isExcel) {
    try {
      const base64 = await LegacyFileSystem.readAsStringAsync(asset.uri, {
        encoding: LegacyFileSystem.EncodingType?.Base64 || "base64",
      });
      if (typeof base64 === "string" && base64.length > 0) {
        return { text: "", base64 };
      }
    } catch (error) {
      readFailures.push(safeReadFailure("legacy-read-base64", error));
    }
  }

  if (/^content:\/\//i.test(asset.uri)) {
    const cachedResult = await readContentUriFromCache(asset.uri, readFailures, isExcel);
    if (cachedResult) return cachedResult;
  }

  if (typeof process !== "undefined" && process?.env?.NODE_ENV === "test" && File) {
    try {
      return await new File(asset.uri).text();
    } catch (error) {
      readFailures.push(safeReadFailure("file-text", error));
    }
  }

  try {
    return await LegacyFileSystem.readAsStringAsync(asset.uri);
  } catch (error) {
    readFailures.push(safeReadFailure("legacy-read-as-string", error));
  }

  throw fileReadFailed(readFailures);
}

function isAppOwnedCacheUri(uri) {
  const cacheDirectory = LegacyFileSystem.cacheDirectory;
  return (
    typeof uri === "string" &&
    typeof cacheDirectory === "string" &&
    Boolean(cacheDirectory) &&
    uri.startsWith(cacheDirectory)
  );
}

async function deletePickerCacheCopy(uri) {
  if (!isAppOwnedCacheUri(uri)) return;
  try {
    await deleteCacheUriOrThrow(uri);
  } catch {
    // Best-effort cleanup: never crash or abort a successful import due to file locking
  }
}

export async function pickCsvFile(options = {}) {
  let result;
  const isAndroid = Platform.OS === "android";
  const isTest = typeof process !== "undefined" && process?.env?.NODE_ENV === "test";
  const mimeTypes = (isAndroid && !isTest)
    ? "*/*"
    : (options?.includePdf ? STATEMENT_MIME_TYPES : CSV_MIME_TYPES);
  const defaultCopyToCache = isTest ? false : true;
  const copyToCache = options?.copyToCacheDirectory !== undefined ? options.copyToCacheDirectory : defaultCopyToCache;
  try {
    result = await DocumentPicker.getDocumentAsync({
      type: mimeTypes,
      multiple: false,
      copyToCacheDirectory: copyToCache,
      base64: false,
    });
  } catch (error) {
    throw asCsvError(
      error,
      "PICKER_FAILED",
      "The document picker could not be opened. Please try again.",
    );
  }

  if (result.canceled) return { canceled: true };
  if (!Array.isArray(result.assets) || result.assets.length !== 1) {
    throw new CsvImportError("INVALID_SELECTION", "Select exactly one statement file.");
  }

  const asset = result.assets[0];
  try {
    const name = fileNameFromAsset(asset);
    if (!/\.(csv|xlsx|xls|pdf|txt)$/i.test(name)) {
      throw new CsvImportError(
        "INVALID_FILE_EXTENSION",
        "Choose a bank statement exported as a .csv, .xlsx, .xls, or .pdf file.",
        { fileName: name },
      );
    }
    if (asset.size === 0) {
      throw new CsvImportError("CSV_EMPTY", "The selected file is empty.", { fileName: name });
    }
    if (Number.isFinite(asset.size) && asset.size > MAX_CSV_FILE_BYTES) {
      throw new CsvImportError(
        "FILE_TOO_LARGE",
        "The file is larger than 10 MB. Export a smaller date range and try again.",
        { fileName: name, fileSize: asset.size, maxBytes: MAX_CSV_FILE_BYTES },
      );
    }

    const browserFile = browserFileFromPicker(result, asset);
    const readResult = await readPickedAsset(asset, browserFile);
    const text = typeof readResult === "string" ? readResult : (readResult?.text || "");
    const base64 = typeof readResult === "object" ? readResult?.base64 : null;
    const isExcel = /\.(xlsx|xls)$/i.test(name);

    if (!isExcel) {
      if (typeof text !== "string" || !text.replace(/^\uFEFF/, "").trim()) {
        throw new CsvImportError("CSV_EMPTY", "The selected file is empty.", { fileName: name });
      }
      if (text.length > MAX_CSV_FILE_BYTES) {
        throw new CsvImportError(
          "FILE_TOO_LARGE",
          "The file is larger than 10 MB. Export a smaller date range and try again.",
          { fileName: name, maxBytes: MAX_CSV_FILE_BYTES },
        );
      }
    } else {
      if (!text && !base64) {
        throw new CsvImportError("CSV_EMPTY", "The selected Excel sheet is empty.", { fileName: name });
      }
    }

    return {
      canceled: false,
      fileName: name,
      mimeType: asset.mimeType || null,
      size: asset.size ?? (text.length || (base64 ? base64.length : 0)),
      text,
      base64,
    };
  } finally {
    revokeBrowserObjectUrl(asset.uri);
  }
}


function hasExactFields(value, fields) {
  const keys = Object.keys(value).sort();
  return keys.length === fields.length && keys.every((key, index) => key === fields[index]);
}

function hasRequiredAndOptionalFields(value, requiredFields, optionalFields) {
  const keys = Object.keys(value);
  const allowedFields = new Set([...requiredFields, ...optionalFields]);
  return requiredFields.every((field) => keys.includes(field))
    && keys.every((field) => allowedFields.has(field));
}

export function validateCsvTransaction(transaction, userId) {
  assertUserId(userId);
  if (!transaction || typeof transaction !== "object" || Array.isArray(transaction)) {
    throw new CsvImportError("INVALID_TRANSACTION", "A transaction is not a valid object.");
  }

  if (!hasRequiredAndOptionalFields(
    transaction,
    TRANSACTION_FIELDS,
    OPTIONAL_TRANSACTION_FIELDS,
  )) {
    throw new CsvImportError(
      "INVALID_TRANSACTION",
      "A transaction contains missing or unsupported fields.",
      { transactionId: transaction.id },
    );
  }

  if (typeof transaction.id !== "string" || !/^csv_[a-f0-9]{16}$/.test(transaction.id)) {
    throw new CsvImportError("INVALID_TRANSACTION", "A transaction ID is invalid.");
  }
  if (normalizeTransactionDate(transaction.date) !== transaction.date) {
    throw new CsvImportError("INVALID_TRANSACTION", "A transaction date is invalid.", {
      transactionId: transaction.id,
    });
  }
  if (
    typeof transaction.sanitizedDescription !== "string" ||
    transaction.sanitizedDescription.length > 1000 ||
    !isSanitizedTransactionDescription(transaction.sanitizedDescription)
  ) {
    throw new CsvImportError(
      "UNSANITIZED_TRANSACTION",
      "A transaction description still contains unsupported or sensitive data.",
      { transactionId: transaction.id },
    );
  }
  if (
    !Number.isFinite(transaction.amount)
    || transaction.amount <= 0
    || transaction.amount > MAX_TRANSACTION_AMOUNT
  ) {
    throw new CsvImportError(
      "INVALID_TRANSACTION",
      `A transaction amount must be greater than zero and no more than ${MAX_TRANSACTION_AMOUNT.toLocaleString("en-IN")}.`,
      { transactionId: transaction.id },
    );
  }
  if (!TRANSACTION_TYPES.has(transaction.type)) {
    throw new CsvImportError("INVALID_TRANSACTION", "A transaction type is invalid.", {
      transactionId: transaction.id,
    });
  }
  if (!TRANSACTION_CATEGORIES.has(transaction.category)) {
    throw new CsvImportError("INVALID_TRANSACTION", "A transaction category is invalid.", {
      transactionId: transaction.id,
    });
  }
  if ("merchantKey" in transaction && !isMerchantBrandKey(transaction.merchantKey)) {
    throw new CsvImportError("INVALID_TRANSACTION", "A verified merchant key is invalid.", {
      transactionId: transaction.id,
    });
  }

  return true;
}

function firestoreTransactionPayload(transaction) {
  const payload = {
    date: transaction.date,
    amount: transaction.amount,
    type: transaction.type,
    sanitizedDescription: transaction.sanitizedDescription,
    category: transaction.category,
    ...(transaction.merchantKey ? { merchantKey: transaction.merchantKey } : {}),
  };
  if (!hasRequiredAndOptionalFields(
    payload,
    FIRESTORE_TRANSACTION_FIELDS,
    OPTIONAL_FIRESTORE_TRANSACTION_FIELDS,
  )) {
    throw new CsvImportError("INVALID_TRANSACTION", "The private cloud payload is invalid.");
  }
  return payload;
}

const FIRESTORE_COMMIT_TIMEOUT_MS = 30_000;

function firestoreErrorCode(error) {
  return getFirebaseErrorCode(error);
}

async function commitBatchWithTimeout(batch, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new CsvImportError(
          "FIRESTORE_WRITE_TIMEOUT",
          "Cloud save timed out.",
          { timeoutMs },
        ),
      );
    }, timeoutMs);
  });

  try {
    await Promise.race([batch.commit(), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function firestoreSaveError(error, savedCount, requestedCount, batchCount) {
  const failedCount = requestedCount - savedCount;
  const partialWrite = savedCount > 0;
  const timedOut = error instanceof CsvImportError && error.code === "FIRESTORE_WRITE_TIMEOUT";
  const cloudCode = firestoreErrorCode(error);
  const parsedLabel = `${requestedCount} transaction${requestedCount === 1 ? "" : "s"}`;
  const parsedVerb = requestedCount === 1 ? "was" : "were";

  let message;
  if (partialWrite) {
    message = `${savedCount} transaction${savedCount === 1 ? " was" : "s were"} saved before cloud sync stopped. Retry the same file to safely finish the import.`;
  } else if (timedOut) {
    message = `${parsedLabel} ${parsedVerb} sanitized successfully, but Firestore did not confirm the save within ${Math.round(error.timeoutMs / 1000)} seconds. Check the connection and retry the same file.`;
  } else if (cloudCode === "permission-denied" || cloudCode === "unauthenticated") {
    message = privateCloudSaveMessage(error);
  } else if (
    cloudCode === "unavailable" ||
    cloudCode === "deadline-exceeded" ||
    cloudCode === "network-request-failed"
  ) {
    message = privateCloudSaveMessage(error);
  } else {
    message = privateCloudSaveMessage(error);
  }

  return new CsvImportError(
    partialWrite ? "FIRESTORE_PARTIAL_WRITE" : timedOut ? "FIRESTORE_WRITE_TIMEOUT" : "FIRESTORE_WRITE_FAILED",
    message,
    {
      savedCount,
      failedCount,
      requestedCount,
      committedBatches: batchCount,
      retryable: true,
      ...(cloudCode ? { firestoreCode: cloudCode } : {}),
      cause: error,
    },
  );
}

export async function saveTransactions(userId, transactions, options = {}) {
  assertUserId(userId);
  if (!Array.isArray(transactions)) {
    throw new CsvImportError("INVALID_TRANSACTION", "Transactions must be provided as a list.");
  }

  const commitTimeoutMs =
    Number.isFinite(options.commitTimeoutMs) && options.commitTimeoutMs > 0
      ? options.commitTimeoutMs
      : FIRESTORE_COMMIT_TIMEOUT_MS;
  const seenIds = new Set();
  transactions.forEach((transaction) => {
    validateCsvTransaction(transaction, userId);
    if (seenIds.has(transaction.id)) {
      throw new CsvImportError(
        "DUPLICATE_TRANSACTION_ID",
        "The import contains duplicate transaction IDs.",
        { transactionId: transaction.id },
      );
    }
    seenIds.add(transaction.id);
  });

  let savedCount = 0;
  let batchCount = 0;
  for (let start = 0; start < transactions.length; start += FIRESTORE_BATCH_LIMIT) {
    const chunk = transactions.slice(start, start + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((transaction) => {
      const transactionRef = doc(db, "users", userId, "transactions", transaction.id);
      batch.set(transactionRef, firestoreTransactionPayload(transaction));
    });

    try {
      await commitBatchWithTimeout(batch, commitTimeoutMs);
      savedCount += chunk.length;
      batchCount += 1;
    } catch (error) {
      throw firestoreSaveError(error, savedCount, transactions.length, batchCount);
    }
  }

  return {
    requestedCount: transactions.length,
    savedCount,
    batchCount,
    debitCount: transactions.filter((transaction) => transaction.type === "DEBIT").length,
    creditCount: transactions.filter((transaction) => transaction.type === "CREDIT").length,
  };
}

const FIRESTORE_STATEMENT_FIELDS = [
  "schemaVersion",
  "displayName",
  "importedAt",
  "periodStart",
  "periodEnd",
  "transactionCount",
  "debitCount",
  "creditCount",
  "skippedCount",
  "totalSpent",
  "totalIncome",
  "netCashFlow",
].sort();
const STATEMENT_ATOMIC_TRANSACTION_LIMIT = Math.floor((FIRESTORE_BATCH_LIMIT - 1) / 2);
const STATEMENT_STAGING_BATCH_LIMIT = 150;
const STATEMENT_MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function statementMonthLabel(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? isoDate : STATEMENT_MONTH_FORMATTER.format(parsed);
}

export function buildStatementDisplayName(insights) {
  const start = insights?.dateRange?.start;
  const end = insights?.dateRange?.end;
  if (typeof start !== "string" || typeof end !== "string") return "Imported statement";

  const startLabel = statementMonthLabel(start);
  const endLabel = statementMonthLabel(end);
  return start.slice(0, 7) === end.slice(0, 7)
    ? `Statement · ${startLabel}`
    : `Statement · ${startLabel} – ${endLabel}`;
}

export function createStatementId(userId, transactions) {
  assertUserId(userId);
  if (!Array.isArray(transactions) || transactions.length === 0) {
    throw new CsvImportError("INVALID_STATEMENT", "A statement must contain transactions.");
  }

  const transactionIds = transactions.map((transaction) => {
    validateCsvTransaction(transaction, userId);
    return transaction.id;
  }).sort();
  const identity = `${userId}\u001e${transactionIds.join("\u001f")}`;
  return `stmt_${hash32(identity, 0x811c9dc5)}${hash32(`finsight-statement:${identity}`, 0x9e3779b9)}`;
}

function buildStatementPayload(insights, details) {
  const payload = {
    schemaVersion: 1,
    displayName: details.displayName,
    importedAt: details.importedAt,
    periodStart: insights.dateRange.start,
    periodEnd: insights.dateRange.end,
    transactionCount: insights.transactionCount,
    debitCount: insights.debitCount,
    creditCount: insights.creditCount,
    skippedCount: details.skippedCount,
    totalSpent: insights.totalSpent,
    totalIncome: insights.totalIncome,
    netCashFlow: insights.netCashFlow,
  };

  if (
    !hasExactFields(payload, FIRESTORE_STATEMENT_FIELDS)
    || typeof payload.displayName !== "string"
    || !payload.displayName.trim()
    || payload.displayName.length > 120
    || !(payload.importedAt instanceof Date)
    || Number.isNaN(payload.importedAt.getTime())
    || normalizeTransactionDate(payload.periodStart) !== payload.periodStart
    || normalizeTransactionDate(payload.periodEnd) !== payload.periodEnd
    || payload.periodStart > payload.periodEnd
    || !Number.isInteger(payload.transactionCount)
    || payload.transactionCount < 1
    || payload.transactionCount > MAX_STATEMENT_TRANSACTION_COUNT
    || !Number.isInteger(payload.debitCount)
    || payload.debitCount < 0
    || !Number.isInteger(payload.creditCount)
    || payload.creditCount < 0
    || payload.debitCount + payload.creditCount !== payload.transactionCount
    || !Number.isInteger(payload.skippedCount)
    || payload.skippedCount < 0
    || payload.skippedCount > MAX_STATEMENT_TRANSACTION_COUNT
    || !Number.isFinite(payload.totalSpent)
    || payload.totalSpent < 0
    || payload.totalSpent > MAX_STATEMENT_TOTAL
    || !Number.isFinite(payload.totalIncome)
    || payload.totalIncome < 0
    || payload.totalIncome > MAX_STATEMENT_TOTAL
    || !Number.isFinite(payload.netCashFlow)
    || Math.abs(payload.netCashFlow) > MAX_STATEMENT_TOTAL
  ) {
    throw new CsvImportError("INVALID_STATEMENT", "The saved statement summary is invalid.");
  }

  return payload;
}

function statementMetadataSaveError(error, savedCount, requestedCount, batchCount) {
  const normalized = firestoreSaveError(error, savedCount, requestedCount, batchCount);
  normalized.message =
    "The sanitized rows reached private staging, but the saved-analysis index was not confirmed. Retry the private cloud save from this screen; deterministic IDs prevent duplicates.";
  normalized.statementPending = true;
  return normalized;
}

function statementPublicationSaveError(error, publishedCount, requestedCount, batchCount) {
  const normalized = firestoreSaveError(error, publishedCount, requestedCount, batchCount);
  normalized.message =
    publishedCount > 0
      ? `Your saved analysis is available, but only ${publishedCount} of ${requestedCount} transactions reached the account activity view. Retry the private cloud save from this screen to finish safely.`
      : "Your saved analysis is available, but the account activity view was not updated. Retry the private cloud save from this screen to finish safely.";
  normalized.statementCommitted = true;
  return normalized;
}

export const LOCAL_STATEMENT_KEY_PREFIX = "@finsight_local_statements_";
export const LOCAL_STATEMENT_DETAIL_KEY_PREFIX = "@finsight_local_statement_detail_";
export const LOCAL_TRANSACTIONS_KEY_PREFIX = "@finsight_local_transactions_";

export async function saveLocalStatement(userId, statementPayload, transactions) {
  if (!userId) return;
  try {
    const statementId = statementPayload.id || statementPayload.statementId;
    const cleanTransactions = Array.isArray(transactions) ? transactions : [];

    const detailKey = `${LOCAL_STATEMENT_DETAIL_KEY_PREFIX}${userId}_${statementId}`;
    await AsyncStorage.setItem(
      detailKey,
      JSON.stringify({
        statement: { id: statementId, ...statementPayload },
        transactions: cleanTransactions,
      }),
    );

    const indexKey = `${LOCAL_STATEMENT_KEY_PREFIX}${userId}`;
    const rawIndex = await AsyncStorage.getItem(indexKey);
    let statements = [];
    if (rawIndex) {
      try {
        statements = JSON.parse(rawIndex) || [];
      } catch {
        statements = [];
      }
    }
    const filtered = statements.filter((s) => s.id !== statementId);
    filtered.unshift({
      id: statementId,
      ...statementPayload,
    });
    await AsyncStorage.setItem(indexKey, JSON.stringify(filtered));

    const txKey = `${LOCAL_TRANSACTIONS_KEY_PREFIX}${userId}`;
    const rawTx = await AsyncStorage.getItem(txKey);
    let existingTx = [];
    if (rawTx) {
      try {
        existingTx = JSON.parse(rawTx) || [];
      } catch {
        existingTx = [];
      }
    }
    const txMap = new Map();
    for (const tx of existingTx) {
      if (tx?.id) txMap.set(tx.id, tx);
    }
    for (const tx of cleanTransactions) {
      if (tx?.id) txMap.set(tx.id, { ...tx, statementId });
    }
    const mergedTx = Array.from(txMap.values()).sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
    );
    await AsyncStorage.setItem(txKey, JSON.stringify(mergedTx));
  } catch (err) {
    console.warn("Could not save statement locally to AsyncStorage:", err);
  }
}

export async function loadLocalStatements(userId) {
  if (!userId) return [];
  try {
    const indexKey = `${LOCAL_STATEMENT_KEY_PREFIX}${userId}`;
    const rawIndex = await AsyncStorage.getItem(indexKey);
    if (!rawIndex) return [];
    return JSON.parse(rawIndex) || [];
  } catch (err) {
    console.warn("Could not load local statements from AsyncStorage:", err);
    return [];
  }
}

export async function loadLocalStatementDetail(userId, statementId) {
  if (!userId || !statementId) return null;
  try {
    const detailKey = `${LOCAL_STATEMENT_DETAIL_KEY_PREFIX}${userId}_${statementId}`;
    const raw = await AsyncStorage.getItem(detailKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not load local statement detail from AsyncStorage:", err);
    return null;
  }
}

export async function loadLocalTransactions(userId) {
  if (!userId) return [];
  try {
    const txKey = `${LOCAL_TRANSACTIONS_KEY_PREFIX}${userId}`;
    const raw = await AsyncStorage.getItem(txKey);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch (err) {
    console.warn("Could not load local transactions from AsyncStorage:", err);
    return [];
  }
}

export async function saveImportedStatement(userId, transactions, details, options = {}) {
  assertUserId(userId);
  if (!Array.isArray(transactions) || transactions.length === 0) {
    throw new CsvImportError("INVALID_STATEMENT", "A statement must contain transactions.");
  }
  if (!details || typeof details !== "object") {
    throw new CsvImportError("INVALID_STATEMENT", "A statement summary is required.");
  }

  const statementId = details.statementId || createStatementId(userId, transactions);
  if (!/^stmt_[a-f0-9]{16}$/.test(statementId)) {
    throw new CsvImportError("INVALID_STATEMENT", "The statement ID is invalid.");
  }

  const commitTimeoutMs =
    Number.isFinite(options.commitTimeoutMs) && options.commitTimeoutMs > 0
      ? options.commitTimeoutMs
      : FIRESTORE_COMMIT_TIMEOUT_MS;
  const seenIds = new Set();
  transactions.forEach((transaction) => {
    validateCsvTransaction(transaction, userId);
    if (seenIds.has(transaction.id)) {
      throw new CsvImportError(
        "DUPLICATE_TRANSACTION_ID",
        "The import contains duplicate transaction IDs.",
        { transactionId: transaction.id },
      );
    }
    seenIds.add(transaction.id);
  });

  const statementPayload = buildStatementPayload(details.insights, {
    displayName: details.displayName,
    importedAt: details.importedAt || new Date(),
    skippedCount: details.skippedCount || 0,
  });

  // Always save statement and all transactions locally to AsyncStorage first (offline-first guarantee)
  await saveLocalStatement(userId, { id: statementId, ...statementPayload }, transactions);

  // Refresh the exact Firebase identity immediately before any private write.
  // This prevents a stale or switched session from being misreported as a rules failure.
  await confirmPrivateCloudOwner(userId);

  if (transactions.length <= STATEMENT_ATOMIC_TRANSACTION_LIMIT) {
    const batch = writeBatch(db);
    transactions.forEach((transaction) => {
      const payload = firestoreTransactionPayload(transaction);
      batch.set(doc(db, "users", userId, "transactions", transaction.id), payload);
      batch.set(
        doc(db, "users", userId, "statements", statementId, "transactions", transaction.id),
        payload,
      );
    });
    batch.set(doc(db, "users", userId, "statements", statementId), statementPayload);

    try {
      await commitBatchWithTimeout(batch, commitTimeoutMs);
    } catch (error) {
      throw firestoreSaveError(error, 0, transactions.length, 0);
    }

    return {
      statementId,
      displayName: statementPayload.displayName,
      requestedCount: transactions.length,
      savedCount: transactions.length,
      batchCount: 1,
      debitCount: statementPayload.debitCount,
      creditCount: statementPayload.creditCount,
    };
  }

  let stagedCount = 0;
  let batchCount = 0;
  for (let start = 0; start < transactions.length; start += STATEMENT_STAGING_BATCH_LIMIT) {
    const chunk = transactions.slice(start, start + STATEMENT_STAGING_BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((transaction) => {
      batch.set(
        doc(db, "users", userId, "statements", statementId, "transactions", transaction.id),
        firestoreTransactionPayload(transaction),
      );
    });

    try {
      await commitBatchWithTimeout(batch, commitTimeoutMs);
      stagedCount += chunk.length;
      batchCount += 1;
    } catch (error) {
      throw firestoreSaveError(error, stagedCount, transactions.length, batchCount);
    }
  }

  const metadataBatch = writeBatch(db);
  metadataBatch.set(doc(db, "users", userId, "statements", statementId), statementPayload);
  try {
    await commitBatchWithTimeout(metadataBatch, commitTimeoutMs);
    batchCount += 1;
  } catch (error) {
    throw statementMetadataSaveError(error, stagedCount, transactions.length, batchCount);
  }

  let publishedCount = 0;
  for (let start = 0; start < transactions.length; start += STATEMENT_STAGING_BATCH_LIMIT) {
    const chunk = transactions.slice(start, start + STATEMENT_STAGING_BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((transaction) => {
      batch.set(
        doc(db, "users", userId, "transactions", transaction.id),
        firestoreTransactionPayload(transaction),
      );
    });

    try {
      await commitBatchWithTimeout(batch, commitTimeoutMs);
      publishedCount += chunk.length;
      batchCount += 1;
    } catch (error) {
      throw statementPublicationSaveError(
        error,
        publishedCount,
        transactions.length,
        batchCount,
      );
    }
  }

  return {
    statementId,
    displayName: statementPayload.displayName,
    requestedCount: transactions.length,
    savedCount: publishedCount,
    batchCount,
    debitCount: statementPayload.debitCount,
    creditCount: statementPayload.creditCount,
  };
}

const LOCAL_FIRST_CLOUD_WAIT_MS = 30_000;

function cloudSyncFromSaveError(error, requestedCount) {
  const savedCount = Number.isFinite(error.savedCount)
    ? Math.max(0, Math.min(requestedCount, error.savedCount))
    : 0;
  const pendingCount = Math.max(0, requestedCount - savedCount);
  const firestoreCode = typeof error.firestoreCode === "string" ? error.firestoreCode : null;

  let status = "failed";
  if (error.code === "FIRESTORE_PARTIAL_WRITE") status = "partial";
  else if (error.code === "FIRESTORE_WRITE_TIMEOUT") status = "unconfirmed";
  else if (firestoreCode === "permission-denied" || firestoreCode === "unauthenticated") {
    status = "denied";
  } else if (
    firestoreCode === "unavailable" ||
    firestoreCode === "deadline-exceeded" ||
    firestoreCode === "network-request-failed"
  ) {
    status = "unavailable";
  }

  let message;
  if (error.statementCommitted && typeof error.message === "string") {
    message = error.message;
  } else if (error.statementPending && typeof error.message === "string") {
    message = error.message;
  } else if (status === "partial") {
    message = `${savedCount} of ${requestedCount} sanitized transactions reached the private cloud. Retry from this screen to finish without selecting the CSV again or creating duplicates.`;
  } else if (status === "unconfirmed") {
    message = "The cloud did not confirm the save in time. Only sanitized extracted data remains available on this screen; retry without selecting the CSV again.";
  } else {
    message = privateCloudSaveMessage(error);
  }

  return {
    status,
    requestedCount,
    savedCount,
    pendingCount,
    committedBatches: Number.isFinite(error.committedBatches) ? error.committedBatches : 0,
    retryable: true,
    message,
    errorCode: error.code,
    ...(error.statementCommitted ? { statementCommitted: true } : {}),
    ...(error.statementPending ? { statementPending: true } : {}),
    ...(firestoreCode ? { firestoreCode } : {}),
  };
}

function createPendingCloudSave(statementId, importedAt, skippedCount, transactions) {
  return {
    schemaVersion: 1,
    statementId,
    importedAt: importedAt.toISOString(),
    skippedCount,
    transactions: transactions.map((transaction) => ({ ...transaction })),
  };
}

function syncedCloudSync(saved) {
  return {
    status: "synced",
    requestedCount: saved.requestedCount,
    savedCount: saved.savedCount,
    pendingCount: 0,
    committedBatches: saved.batchCount,
    retryable: false,
    message: "Sanitized extracted data was saved privately to your account. The original statement file was not uploaded.",
  };
}

export async function retryImportedStatementCloudSave(userId, pendingCloudSave) {
  assertUserId(userId);
  if (
    !pendingCloudSave
    || pendingCloudSave.schemaVersion !== 1
    || typeof pendingCloudSave.statementId !== "string"
    || !Array.isArray(pendingCloudSave.transactions)
    || pendingCloudSave.transactions.length === 0
  ) {
    throw new CsvImportError(
      "INVALID_STATEMENT",
      "The sanitized cloud-retry data is no longer available. Analyze the CSV again to rebuild it safely.",
    );
  }

  const importedAt = new Date(pendingCloudSave.importedAt);
  if (Number.isNaN(importedAt.getTime())) {
    throw new CsvImportError("INVALID_STATEMENT", "The cloud-retry timestamp is invalid.");
  }

  const transactions = pendingCloudSave.transactions.map((transaction) => ({ ...transaction }));
  const statementId = createStatementId(userId, transactions);
  if (statementId !== pendingCloudSave.statementId) {
    throw new CsvImportError("INVALID_STATEMENT", "The cloud-retry data failed its identity check.");
  }

  const insights = buildFinancialInsights(transactions);
  try {
    const saved = await saveImportedStatement(
      userId,
      transactions,
      {
        statementId,
        displayName: buildStatementDisplayName(insights),
        importedAt,
        skippedCount: pendingCloudSave.skippedCount || 0,
        insights,
      },
      { commitTimeoutMs: 30_000 },
    );
    return {
      statementId,
      statementDisplayName: saved.displayName,
      savedCount: saved.savedCount,
      batchCount: saved.batchCount,
      cloudSync: syncedCloudSync(saved),
      pendingCloudSave: null,
    };
  } catch (error) {
    if (!(error instanceof CsvImportError) || !/^FIRESTORE_/.test(error.code)) {
      throw error;
    }
    const cloudSync = cloudSyncFromSaveError(error, transactions.length);
    return {
      statementId,
      statementDisplayName: buildStatementDisplayName(insights),
      savedCount: cloudSync.savedCount,
      batchCount: cloudSync.committedBatches,
      cloudSync,
      pendingCloudSave,
    };
  }
}

export async function importCsvStatement(userId, options = {}) {
  assertUserId(userId);
  let picked = null;
  let rawCsvText = null;
  let parsed = null;

  try {
    picked = options?.picked ? options.picked : await pickCsvFile({ includePdf: true, ...options });
    if (picked.canceled) {
      return {
        canceled: true,
        importedCount: 0,
        savedCount: 0,
        debitCount: 0,
        creditCount: 0,
        skippedCount: 0,
      };
    }

    rawCsvText = picked.text;

    let isExcel = /\.(xlsx|xls)$/i.test(picked.fileName);
    let isPdf = /\.pdf$/i.test(picked.fileName);

    let inputBuffer = null;
    if (picked.base64) {
      inputBuffer = Buffer.from(picked.base64, "base64");
    } else if (typeof rawCsvText === "string" && rawCsvText.length > 0) {
      inputBuffer = Buffer.from(rawCsvText, "binary");
    }

    // Auto-detect encrypted Excel (OLE CFB 0xd0cf11e0) or PDF (%PDF 0x25504446) even if extension is .csv or .txt
    if (!isExcel && !isPdf && inputBuffer && inputBuffer.length >= 4) {
      if (inputBuffer[0] === 0xd0 && inputBuffer[1] === 0xcf && inputBuffer[2] === 0x11 && inputBuffer[3] === 0xe0) {
        isExcel = true;
      } else if (inputBuffer[0] === 0x25 && inputBuffer[1] === 0x50 && inputBuffer[2] === 0x44 && inputBuffer[3] === 0x46) {
        isPdf = true;
      }
    }

    if (isPdf) {
      const { extractStatementWithPassword } = await import("./pdfStatementParser");
      try {
        parsed = await extractStatementWithPassword(
          rawCsvText || (inputBuffer ? inputBuffer.toString("binary") : ""),
          picked.fileName,
          options?.password,
          userId,
        );
      } catch (pdfErr) {
        if (pdfErr && typeof pdfErr === "object") {
          pdfErr.picked = picked;
        }
        throw pdfErr;
      }
    } else if (isExcel) {
      let workbook;
      if (!inputBuffer || inputBuffer.length === 0) {
        throw new CsvImportError("CSV_EMPTY", "The selected statement file is empty.", {
          fileName: picked.fileName,
        });
      }

      let isEncrypted = false;
      try {
        isEncrypted = isExcelEncrypted(inputBuffer);
      } catch {
        isEncrypted = false;
      }

      const XLSX = getXLSX();

      if (isEncrypted) {
        if (!options?.password) {
          const passErr = new CsvImportError(
            "PASSWORD_REQUIRED",
            "This document is password protected. Enter the password required by your bank to open it.",
            { fileName: picked.fileName, isEncrypted: true },
          );
          passErr.picked = picked;
          throw passErr;
        }
        let decryptedBuffer;
        try {
          decryptedBuffer = await fastDecryptExcel(inputBuffer, options.password);
        } catch (decErr) {
          const passErr = new CsvImportError(
            "INCORRECT_PASSWORD",
            "Could not open password-protected document with the provided password. Please check your password (e.g. PAN, DOB, or Account number) and try again.",
            { fileName: picked.fileName, isEncrypted: true, cause: decErr },
          );
          passErr.picked = picked;
          throw passErr;
        }
        try {
          workbook = XLSX.read(decryptedBuffer, {
            type: "buffer",
            cellDates: true,
            dateNF: "yyyy-mm-dd",
          });
        } catch (readErr) {
          throw new CsvImportError(
            "INVALID_STATEMENT",
            "Could not read the decrypted spreadsheet worksheets.",
            { fileName: picked.fileName, cause: readErr },
          );
        }
      } else {
        try {
          workbook = XLSX.read(inputBuffer, {
            type: "buffer",
            cellDates: true,
            dateNF: "yyyy-mm-dd",
            ...(options?.password ? { password: options.password } : {}),
          });
        } catch (xlsxErr) {
          const errMsg = String(xlsxErr?.message || xlsxErr || "");
          if (/password|encrypted|protect/i.test(errMsg)) {
            if (options?.password) {
              try {
                const decryptedBuffer = await fastDecryptExcel(inputBuffer, options.password);
                workbook = XLSX.read(decryptedBuffer, {
                  type: "buffer",
                  cellDates: true,
                  dateNF: "yyyy-mm-dd",
                });
              } catch {
                const passErr = new CsvImportError(
                  "INCORRECT_PASSWORD",
                  "Could not open password-protected document with the provided password. Please check your password (e.g. PAN, DOB, or Account number) and try again.",
                  { fileName: picked.fileName, isEncrypted: true },
                );
                passErr.picked = picked;
                throw passErr;
              }
            } else {
              const passErr = new CsvImportError(
                "PASSWORD_REQUIRED",
                "This document is password protected. Enter the password required by your bank to open it.",
                { fileName: picked.fileName, isEncrypted: true },
              );
              passErr.picked = picked;
              throw passErr;
            }
          } else {
            throw xlsxErr;
          }
        }
      }

      if (!workbook || !Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0) {
        throw new CsvImportError(
          "INVALID_STATEMENT",
          "The selected Excel file contains no readable worksheets.",
          { fileName: picked.fileName },
        );
      }

      // Check all sheets, find the one with transaction table!
      let sheetCsv = "";
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        if (!sheet) continue;
        const csv = XLSX.utils.sheet_to_csv(sheet, { dateNF: "yyyy-mm-dd" });
        if (csv && csv.trim()) {
          if (/(?:date|narration|description|particulars|withdrawal|deposit|debit|credit|amount|balance)/i.test(csv)) {
            sheetCsv = csv;
            break;
          }
          if (!sheetCsv) {
            sheetCsv = csv;
          }
        }
      }

      if (!sheetCsv || !sheetCsv.trim()) {
        throw new CsvImportError(
          "CSV_EMPTY",
          "The selected Excel sheet contains no transaction records.",
          { fileName: picked.fileName },
        );
      }
      parsed = parseCsvStatement(sheetCsv, userId);
    } else {
      parsed = parseCsvStatement(rawCsvText, userId);
    }


    // The immutable JS string cannot be overwritten, but all application references are
    // released before the first Firestore operation. Parsed row arrays are cleared in the parser.
    rawCsvText = null;

    const insights = buildFinancialInsights(parsed.transactions);
    const statementId = createStatementId(userId, parsed.transactions);
    const statementDisplayName = buildStatementDisplayName(insights);
    const importedAt = new Date();
    let savedCount = 0;
    let batchCount = 0;
    let cloudSync;

    try {
      const saved = await saveImportedStatement(
        userId,
        parsed.transactions,
        {
          statementId,
          displayName: statementDisplayName,
          importedAt,
          skippedCount: parsed.skippedCount,
          insights,
        },
        { commitTimeoutMs: LOCAL_FIRST_CLOUD_WAIT_MS },
      );
      savedCount = saved.savedCount;
      batchCount = saved.batchCount;
      cloudSync = syncedCloudSync(saved);
    } catch (error) {
      if (!(error instanceof CsvImportError) || !/^FIRESTORE_/.test(error.code)) {
        throw error;
      }
      cloudSync = cloudSyncFromSaveError(error, parsed.importedCount);
      savedCount = cloudSync.savedCount;
      batchCount = cloudSync.committedBatches;
    }

    const pendingCloudSave = cloudSync.status === "synced"
      ? null
      : createPendingCloudSave(
        statementId,
        importedAt,
        parsed.skippedCount,
        parsed.transactions,
      );

    return {
      canceled: false,
      fileName: picked.fileName,
      statementId,
      statementDisplayName,
      importedCount: parsed.importedCount,
      savedCount,
      debitCount: parsed.debitCount,
      creditCount: parsed.creditCount,
      skippedCount: parsed.skippedCount,
      metadataRowsDiscarded: parsed.metadataRowsDiscarded,
      batchCount,
      diagnostics: parsed.diagnostics,
      insights,
      cloudSync,
      pendingCloudSave,
    };
  } catch (error) {
    if (picked && !error.picked) {
      error.picked = picked;
    }
    if (error instanceof CsvImportError) {
      if (picked && !picked.canceled) error.fileName = picked.fileName;
      if (parsed) {
        error.importedCount = parsed.importedCount;
        error.debitCount = parsed.debitCount;
        error.creditCount = parsed.creditCount;
        error.skippedCount = parsed.skippedCount;
      }
    }
    throw error;
  } finally {
    rawCsvText = null;
    if (parsed?.transactions) parsed.transactions.length = 0;
    parsed = null;
  }
}

export { sanitizeTransactionDescription } from "./privacySanitizer";
