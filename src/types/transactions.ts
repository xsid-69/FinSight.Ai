export type TransactionType = "DEBIT" | "CREDIT";

export type TransactionCategory =
  | "CASH"
  | "ENTERTAINMENT"
  | "FOOD"
  | "HEALTHCARE"
  | "INCOME"
  | "OTHER"
  | "SHOPPING"
  | "TRANSFER"
  | "TRANSPORTATION"
  | "UTILITIES";

export type MerchantBrandKey =
  | "zomato"
  | "swiggy"
  | "instamart"
  | "uber"
  | "ola"
  | "rapido"
  | "amazonpay"
  | "amazon"
  | "flipkart"
  | "myntra"
  | "ajio"
  | "nykaa"
  | "tatacliq"
  | "netflix"
  | "spotify"
  | "hotstar"
  | "primevideo"
  | "bookmyshow"
  | "pvr"
  | "blinkit"
  | "zepto"
  | "bigbasket"
  | "jiomart"
  | "dmart"
  | "relianceretail"
  | "apollopharmacy"
  | "starbucks"
  | "mcdonalds"
  | "kfc"
  | "dominos"
  | "irctc"
  | "makemytrip"
  | "goibibo"
  | "cleartrip"
  | "jio"
  | "airtel"
  | "cred"
  | "paytm"
  | "googlepay"
  | "phonepe"
  | "google"
  | "apple";

export interface PrivateTransaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  sanitizedDescription: string;
  category: TransactionCategory;
  merchantKey?: MerchantBrandKey;
  merchant?: string;
  description?: string;
  referenceNo?: string;
  accountMask?: string;
  source?: string;
  createdAt?: string;
  userId?: string;
}

export interface CategoryInsight {
  category: TransactionCategory;
  label: string;
  amount: number;
  count: number;
  share: number;
}

export interface MonthlyActivityInsight {
  month: string;
  label: string;
  totalSpent: number;
  totalIncome: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface InsightObservation {
  id: string;
  tone: "positive" | "warning" | "neutral";
  title: string;
  body: string;
}

export interface FinancialInsights {
  transactionCount: number;
  debitCount: number;
  creditCount: number;
  totalSpent: number;
  totalIncome: number;
  netCashFlow: number;
  savingsRate: number | null;
  averageDebit: number;
  periodLabel: string;
  dateRange: { start: string | null; end: string | null };
  categoryBreakdown: CategoryInsight[];
  monthlyActivity: MonthlyActivityInsight[];
  topCategory: CategoryInsight | null;
  topMerchant: { merchant: string; amount: number; count: number } | null;
  largestDebit: PrivateTransaction | null;
  recurringMerchants: { merchant: string; amount: number; count: number }[];
  observations: InsightObservation[];
}

export interface TransactionCollectionResult {
  transactions: PrivateTransaction[];
  ignoredCount: number;
}

export interface SavedStatement {
  id: string;
  schemaVersion: 1;
  displayName: string;
  importedAt: string;
  periodStart: string;
  periodEnd: string;
  transactionCount: number;
  debitCount: number;
  creditCount: number;
  skippedCount: number;
  totalSpent: number;
  totalIncome: number;
  netCashFlow: number;
}

export interface SavedStatementCollectionResult {
  statements: SavedStatement[];
  ignoredCount: number;
}

export interface SavedStatementDetail {
  statement: SavedStatement;
  transactions: PrivateTransaction[];
  ignoredCount: number;
  insights: FinancialInsights;
}
