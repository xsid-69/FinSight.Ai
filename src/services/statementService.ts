import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "../config/firebase";
import type {
  SavedStatement,
  SavedStatementCollectionResult,
  SavedStatementDetail,
} from "../types/transactions";
import { buildFinancialInsights } from "./financialInsights";
import { getFirebaseErrorCode, privateCloudReadMessage } from "./firebaseErrors";
import { isCleanStoredTransaction } from "./transactionService";

const STATEMENT_FIELDS = [
  "creditCount",
  "debitCount",
  "displayName",
  "importedAt",
  "netCashFlow",
  "periodEnd",
  "periodStart",
  "schemaVersion",
  "skippedCount",
  "totalIncome",
  "totalSpent",
  "transactionCount",
].sort();

const STATEMENT_ID_PATTERN = /^stmt_[a-f0-9]{16}$/;
const MAX_STATEMENT_TRANSACTION_COUNT = 1_000_000;
const MAX_STATEMENT_TOTAL = 1_000_000_000_000_000;

export class StatementLoadError extends Error {
  cause?: unknown;
  firebaseCode: string | null;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "StatementLoadError";
    this.cause = cause;
    this.firebaseCode = getFirebaseErrorCode(cause);
  }
}

function assertUserId(userId: string) {
  if (!userId || userId !== userId.trim() || userId.includes("/")) {
    throw new StatementLoadError("Sign in to view your saved statements.");
  }
}

function assertStatementId(statementId: string) {
  if (!STATEMENT_ID_PATTERN.test(statementId)) {
    throw new StatementLoadError("This saved statement reference is invalid.");
  }
}

function isRealIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function timestampToIso(value: unknown): string | null {
  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (value && typeof value === "object" && "toDate" in value) {
    const toDate = (value as { toDate?: unknown }).toDate;
    if (typeof toDate === "function") {
      try {
        const candidate = toDate.call(value);
        if (candidate instanceof Date) date = candidate;
      } catch {
        return null;
      }
    }
  }

  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function hasExactStatementFields(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const keys = Object.keys(data).sort();
  return keys.length === STATEMENT_FIELDS.length
    && keys.every((key, index) => key === STATEMENT_FIELDS[index]);
}

function toSavedStatement(id: string, data: unknown): SavedStatement | null {
  if (!STATEMENT_ID_PATTERN.test(id) || !hasExactStatementFields(data)) return null;

  const importedAt = timestampToIso(data.importedAt);
  if (
    data.schemaVersion !== 1
    || typeof data.displayName !== "string"
    || !data.displayName.trim()
    || data.displayName.length > 120
    || !importedAt
    || !isRealIsoDate(data.periodStart)
    || !isRealIsoDate(data.periodEnd)
    || data.periodStart > data.periodEnd
    || !Number.isInteger(data.transactionCount)
    || (data.transactionCount as number) < 1
    || (data.transactionCount as number) > MAX_STATEMENT_TRANSACTION_COUNT
    || !Number.isInteger(data.debitCount)
    || (data.debitCount as number) < 0
    || !Number.isInteger(data.creditCount)
    || (data.creditCount as number) < 0
    || (data.debitCount as number) + (data.creditCount as number) !== data.transactionCount
    || !Number.isInteger(data.skippedCount)
    || (data.skippedCount as number) < 0
    || (data.skippedCount as number) > MAX_STATEMENT_TRANSACTION_COUNT
    || !Number.isFinite(data.totalSpent)
    || (data.totalSpent as number) < 0
    || (data.totalSpent as number) > MAX_STATEMENT_TOTAL
    || !Number.isFinite(data.totalIncome)
    || (data.totalIncome as number) < 0
    || (data.totalIncome as number) > MAX_STATEMENT_TOTAL
    || !Number.isFinite(data.netCashFlow)
    || Math.abs(data.netCashFlow as number) > MAX_STATEMENT_TOTAL
  ) {
    return null;
  }

  return {
    id,
    schemaVersion: 1,
    displayName: data.displayName,
    importedAt,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    transactionCount: data.transactionCount,
    debitCount: data.debitCount,
    creditCount: data.creditCount,
    skippedCount: data.skippedCount,
    totalSpent: data.totalSpent,
    totalIncome: data.totalIncome,
    netCashFlow: data.netCashFlow,
  } as SavedStatement;
}

export async function loadPrivateStatements(
  userId: string,
): Promise<SavedStatementCollectionResult> {
  assertUserId(userId);

  let snapshot;
  try {
    snapshot = await getDocs(collection(db, "users", userId, "statements"));
  } catch (error) {
    throw new StatementLoadError(
      privateCloudReadMessage("your saved analyses", error),
      error,
    );
  }

  const statements: SavedStatement[] = [];
  let ignoredCount = 0;
  snapshot.docs.forEach((documentSnapshot) => {
    const statement = toSavedStatement(documentSnapshot.id, documentSnapshot.data());
    if (statement) statements.push(statement);
    else ignoredCount += 1;
  });

  statements.sort(
    (left, right) => right.importedAt.localeCompare(left.importedAt) || right.id.localeCompare(left.id),
  );

  return { statements, ignoredCount };
}

export async function loadPrivateStatement(
  userId: string,
  statementId: string,
): Promise<SavedStatementDetail> {
  assertUserId(userId);
  assertStatementId(statementId);

  try {
    const statementRef = doc(db, "users", userId, "statements", statementId);
    const [statementSnapshot, transactionSnapshot] = await Promise.all([
      getDoc(statementRef),
      getDocs(collection(statementRef, "transactions")),
    ]);

    if (!statementSnapshot.exists()) {
      throw new StatementLoadError("This saved statement is no longer available.");
    }

    const statement = toSavedStatement(statementSnapshot.id, statementSnapshot.data());
    if (!statement) {
      throw new StatementLoadError("This saved statement does not match the privacy-safe format.");
    }

    const transactions: SavedStatementDetail["transactions"] = [];
    let ignoredCount = 0;
    transactionSnapshot.docs.forEach((documentSnapshot) => {
      const data = documentSnapshot.data();
      if (!/^csv_[a-f0-9]{16}$/.test(documentSnapshot.id) || !isCleanStoredTransaction(data)) {
        ignoredCount += 1;
        return;
      }
      transactions.push({
        id: documentSnapshot.id,
        date: data.date as string,
        amount: data.amount as number,
        type: data.type as SavedStatementDetail["transactions"][number]["type"],
        sanitizedDescription: data.sanitizedDescription as string,
        category: data.category as SavedStatementDetail["transactions"][number]["category"],
      });
    });

    transactions.sort(
      (left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id),
    );

    if (transactions.length === 0) {
      throw new StatementLoadError("No privacy-safe transactions were found for this statement.");
    }

    const insights = buildFinancialInsights(transactions);
    const moneyMatches = (left: number, right: number) => Math.abs(left - right) < 0.005;
    const snapshotMatchesManifest =
      ignoredCount === 0
      && transactions.length === statement.transactionCount
      && insights.debitCount === statement.debitCount
      && insights.creditCount === statement.creditCount
      && insights.dateRange.start === statement.periodStart
      && insights.dateRange.end === statement.periodEnd
      && moneyMatches(insights.totalSpent, statement.totalSpent)
      && moneyMatches(insights.totalIncome, statement.totalIncome)
      && moneyMatches(insights.netCashFlow, statement.netCashFlow);

    if (!snapshotMatchesManifest) {
      throw new StatementLoadError(
        "This saved statement is incomplete or no longer matches its verified summary. Re-import the original CSV to repair it safely.",
      );
    }

    return {
      statement,
      transactions,
      ignoredCount: 0,
      insights,
    } as SavedStatementDetail;
  } catch (error) {
    if (error instanceof StatementLoadError) throw error;
    throw new StatementLoadError(
      privateCloudReadMessage("this saved analysis", error),
      error,
    );
  }
}
