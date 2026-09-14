import { collection, getDocs } from "firebase/firestore";

import { db } from "../config/firebase";
import { getFirebaseErrorCode, privateCloudReadMessage } from "./firebaseErrors";
import { isSanitizedTransactionDescription } from "./privacySanitizer";

const STORED_TRANSACTION_FIELDS = [
  "amount",
  "category",
  "date",
  "sanitizedDescription",
  "type",
];

const MAX_TRANSACTION_AMOUNT = 1_000_000_000_000;
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

export class TransactionLoadError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "TransactionLoadError";
    this.cause = cause;
    this.firebaseCode = getFirebaseErrorCode(cause);
  }
}

function assertUserId(userId) {
  if (
    typeof userId !== "string" ||
    !userId.trim() ||
    userId !== userId.trim() ||
    userId.includes("/")
  ) {
    throw new TransactionLoadError("Sign in to view your imported transactions.");
  }
}

function isRealIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function hasExactStoredFields(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const keys = Object.keys(data).sort();
  return (
    keys.length === STORED_TRANSACTION_FIELDS.length &&
    keys.every((key, index) => key === STORED_TRANSACTION_FIELDS[index])
  );
}

export function isCleanStoredTransaction(data) {
  return (
    hasExactStoredFields(data) &&
    isRealIsoDate(data.date) &&
    Number.isFinite(data.amount) &&
    data.amount > 0 &&
    data.amount <= MAX_TRANSACTION_AMOUNT &&
    TRANSACTION_TYPES.has(data.type) &&
    TRANSACTION_CATEGORIES.has(data.category) &&
    typeof data.sanitizedDescription === "string" &&
    data.sanitizedDescription.length <= 1000 &&
    isSanitizedTransactionDescription(data.sanitizedDescription)
  );
}

export async function loadPrivateTransactions(userId) {
  assertUserId(userId);

  let snapshot;
  try {
    snapshot = await getDocs(collection(db, "users", userId, "transactions"));
  } catch (error) {
    throw new TransactionLoadError(
      privateCloudReadMessage("your private transactions", error),
      error,
    );
  }

  const transactions = [];
  let ignoredCount = 0;

  snapshot.docs.forEach((documentSnapshot) => {
    const data = documentSnapshot.data();
    if (!/^csv_[a-f0-9]{16}$/.test(documentSnapshot.id) || !isCleanStoredTransaction(data)) {
      ignoredCount += 1;
      return;
    }
    transactions.push({ id: documentSnapshot.id, ...data });
  });

  transactions.sort(
    (left, right) =>
      right.date.localeCompare(left.date) || right.id.localeCompare(left.id),
  );

  return { transactions, ignoredCount };
}

/**
 * Lazily loads statement metadata so existing Home tests and lightweight
 * transaction consumers do not initialize the full statement service.
 */
export async function loadPrivateStatements(userId) {
  const statementService = await import("./statementService");
  return statementService.loadPrivateStatements(userId);
}

export async function loadPrivateStatement(userId, statementId) {
  const statementService = await import("./statementService");
  return statementService.loadPrivateStatement(userId, statementId);
}
