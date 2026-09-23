import { collection, getDocs, onSnapshot } from "firebase/firestore";

import { db } from "../config/firebase";
import { getFirebaseErrorCode, privateCloudReadMessage } from "./firebaseErrors";
import { isMerchantBrandKey } from "./merchantBrandRegistry";
import { isSanitizedTransactionDescription } from "./privacySanitizer";

const STORED_TRANSACTION_FIELDS = [
  "amount",
  "category",
  "date",
  "sanitizedDescription",
  "type",
];
const OPTIONAL_STORED_TRANSACTION_FIELDS = [
  "merchantKey",
  "id",
  "description",
  "merchant",
  "accountMask",
  "referenceNo",
  "source",
  "createdAt",
  "userId",
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
  if (typeof value !== "string") return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function hasExactStoredFields(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const keys = Object.keys(data);
  const allowedFields = new Set([
    ...STORED_TRANSACTION_FIELDS,
    ...OPTIONAL_STORED_TRANSACTION_FIELDS,
  ]);
  return STORED_TRANSACTION_FIELDS.every((field) => keys.includes(field))
    && keys.every((field) => allowedFields.has(field));
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
    isSanitizedTransactionDescription(data.sanitizedDescription) &&
    (!("merchantKey" in data) || isMerchantBrandKey(data.merchantKey))
  );
}

function isValidTransactionId(id) {
  return typeof id === "string" && (/^csv_[a-f0-9]{16}$/.test(id) || /^(ref_[A-Za-z0-9_-]+|sms_[0-9._-]+)$/.test(id));
}

function readPrivateTransactionSnapshot(snapshot) {
  const transactions = [];
  let ignoredCount = 0;

  snapshot.docs.forEach((documentSnapshot) => {
    const data = documentSnapshot.data();
    if (!isValidTransactionId(documentSnapshot.id) || !isCleanStoredTransaction(data)) {
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

  return readPrivateTransactionSnapshot(snapshot);
}

/**
 * Subscribes to the signed-in owner's canonical transaction collection.
 * Every snapshot passes through the same strict validation as one-time loads.
 */
export function subscribeToPrivateTransactions(userId, onData, onError) {
  assertUserId(userId);
  if (typeof onData !== "function") {
    throw new TypeError("A transaction snapshot callback is required.");
  }

  return onSnapshot(
    collection(db, "users", userId, "transactions"),
    (snapshot) => onData(readPrivateTransactionSnapshot(snapshot)),
    (error) => {
      const loadError = new TransactionLoadError(
        privateCloudReadMessage("your private transactions", error),
        error,
      );
      if (typeof onError === "function") onError(loadError);
    },
  );
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
