import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Receipt,
  Clapperboard,
  Landmark,
} from "@tamagui/lucide-icons";
import type { LucideIcon } from "../components/IconSquare";
import type { CurrencyCode } from "../constants/typography";

/* ----------------------------- Financial health ----------------------------- */

export interface FinancialHealth {
  score: number; // 0–100
  status: string;
  monthlySpending: number;
  projectedSavings: number;
  currency: CurrencyCode;
}

export const HEALTH: FinancialHealth = {
  score: 82,
  status: "Healthy",
  monthlySpending: 18450,
  projectedSavings: 11850,
  currency: "INR",
};

/* --------------------------- Spending summary cards -------------------------- */

export interface SummaryStat {
  id: string;
  title: string;
  value: number;
  currency?: CurrencyCode;
  /** e.g. "-8.2% vs last month" */
  caption: string;
  /** direction of the caption metric */
  trend: "down" | "up" | "flat" | "alert";
  /** render value as a plain count instead of money */
  isCount?: boolean;
}

export const SUMMARY_STATS: SummaryStat[] = [
  { id: "spend", title: "This month", value: 18450, currency: "INR", caption: "8.2% vs last month", trend: "down" },
  { id: "saved", title: "Saved", value: 11850, currency: "INR", caption: "64% of target", trend: "up" },
  { id: "anomaly", title: "Detected anomalies", value: 2, caption: "Needs attention", trend: "alert", isCount: true },
];

/* -------------------------------- AI insight -------------------------------- */

export interface AIInsight {
  id: string;
  headline: string;
  body: string;
}

export const AI_INSIGHT: AIInsight = {
  id: "insight-food",
  headline: "AI Insight",
  body: "Your food spending is 18% higher than your 3-month average. Most of the increase came from weekend transactions.",
};

/* --------------------------------- Anomaly ---------------------------------- */

export interface Anomaly {
  id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  zScore: number;
  note: string;
  /** Daily spend samples; the last point is the flagged spike. */
  series: number[];
  /** Upper bound of the "normal" range (for the shaded band). */
  normalMax: number;
}

export const ANOMALY: Anomaly = {
  id: "anom-1",
  title: "Spending anomaly",
  amount: 6420,
  currency: "INR",
  zScore: 3.1,
  note: "High activity detected today",
  series: [1200, 980, 1450, 1100, 1320, 1050, 1480, 6420],
  normalMax: 1800,
};

/* ------------------------------ Cash-flow forecast --------------------------- */

export type ForecastHorizon = 12 | 24 | 36;

export interface ForecastPoint {
  /** Month index from now (0 = current). */
  t: number;
  /** Actual balance (null in the future). */
  actual: number | null;
  /** Forecast balance (null in the past). */
  forecast: number | null;
  /** Confidence band. */
  lower: number | null;
  upper: number | null;
}

/** Deterministic Holt-Winters-style series: 6 months actual + horizon forecast. */
export function buildForecast(horizon: ForecastHorizon): ForecastPoint[] {
  const actualMonths = 6;
  const base = 62000;
  const trend = 2100;
  const seasonalAmp = 4200;
  const points: ForecastPoint[] = [];

  // Actuals (slightly noisy, deterministic)
  const noise = [0, 1600, -900, 2200, -400, 1800];
  for (let i = 0; i < actualMonths; i++) {
    const seasonal = Math.sin((i / 6) * Math.PI * 2) * seasonalAmp;
    const val = base + trend * i + seasonal + noise[i];
    points.push({ t: i, actual: Math.round(val), forecast: null, lower: null, upper: null });
  }

  // Bridge point so actual + forecast lines connect
  const last = points[actualMonths - 1].actual as number;
  points[actualMonths - 1].forecast = last;
  points[actualMonths - 1].lower = last;
  points[actualMonths - 1].upper = last;

  // Forecast
  for (let h = 1; h <= horizon; h++) {
    const i = actualMonths - 1 + h;
    const seasonal = Math.sin((i / 6) * Math.PI * 2) * seasonalAmp;
    const val = base + trend * i + seasonal;
    const spread = 1800 + h * 260; // widening confidence
    points.push({
      t: i,
      actual: null,
      forecast: Math.round(val),
      lower: Math.round(val - spread),
      upper: Math.round(val + spread),
    });
  }
  return points;
}

/* ------------------------------- Goal simulator ------------------------------ */

export interface Goal {
  name: string;
  amount: number;
  targetMonths: number;
  currentSavings: number;
  monthlySavings: number;
  currency: CurrencyCode;
}

export const GOAL: Goal = {
  name: "Laptop",
  amount: 60000,
  targetMonths: 5,
  currentSavings: 21500,
  monthlySavings: 11850,
  currency: "INR",
};

export interface GoalResult {
  projectedBalance: number;
  affordable: boolean;
  monthsToReach: number;
  successProbability: number;
}

export function simulateGoal(g: Goal): GoalResult {
  const projectedBalance = g.currentSavings + g.monthlySavings * g.targetMonths;
  const affordable = projectedBalance >= g.amount;
  const remaining = Math.max(0, g.amount - g.currentSavings);
  const monthsToReach = g.monthlySavings > 0 ? remaining / g.monthlySavings : Infinity;
  const ratio = projectedBalance / g.amount;
  const successProbability = Math.max(0, Math.min(0.98, 0.5 + (ratio - 1) * 1.4));
  return {
    projectedBalance: Math.round(projectedBalance),
    affordable,
    monthsToReach: Number(monthsToReach.toFixed(1)),
    successProbability: Math.round(successProbability * 100),
  };
}

/* ------------------------------- Cohort mirror ------------------------------- */

export interface CohortCategory {
  id: string;
  name: string;
  percentile: number;
  peerMedian: number;
  currency: CurrencyCode;
}

export interface Cohort {
  label: string;
  incomeBand: string;
  categories: CohortCategory[];
  /** KDE-like density samples for the peer distribution graph. */
  distribution: number[];
  /** User's position along the distribution (0–1). */
  userPosition: number;
}

export const COHORT: Cohort = {
  label: "College students in Nagpur",
  incomeBand: "₹8K – ₹12K income",
  categories: [
    { id: "c-food", name: "Food", percentile: 89, peerMedian: 4200, currency: "INR" },
    { id: "c-transport", name: "Transport", percentile: 61, peerMedian: 2600, currency: "INR" },
    { id: "c-ent", name: "Entertainment", percentile: 74, peerMedian: 1900, currency: "INR" },
  ],
  distribution: [2, 5, 9, 16, 24, 33, 41, 47, 44, 37, 29, 21, 14, 9, 5, 3],
  userPosition: 0.82,
};

/* --------------------------------- Transactions ------------------------------ */

export type ClassificationTier = "instant" | "learned" | "ai";

export interface AnalyzedTransaction {
  id: string;
  merchant: string;
  category: string;
  categoryIcon: LucideIcon;
  date: string;
  amount: number;
  currency: CurrencyCode;
  type: "credit" | "debit";
  classification: ClassificationTier;
  confidence: number;
}

export interface TransactionDay {
  id: string;
  label: string;
  items: AnalyzedTransaction[];
}

export interface TransactionsMeta {
  analyzed: number;
  autoCategorizedPct: number;
}

export const TRANSACTIONS_META: TransactionsMeta = { analyzed: 1248, autoCategorizedPct: 97.4 };

export interface CategoryFilter {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_FILTERS: CategoryFilter[] = [
  { id: "all", label: "All", icon: Landmark },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "transport", label: "Transport", icon: Car },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "bills", label: "Bills", icon: Receipt },
  { id: "ent", label: "Entertainment", icon: Clapperboard },
];

export const TRANSACTION_DAYS: TransactionDay[] = [
  {
    id: "d-today",
    label: "Today",
    items: [
      { id: "t-zomato", merchant: "Zomato", category: "Food", categoryIcon: UtensilsCrossed, date: "Today", amount: 483, currency: "INR", type: "debit", classification: "instant", confidence: 99 },
      { id: "t-uber", merchant: "Uber", category: "Transport", categoryIcon: Car, date: "Today", amount: 218, currency: "INR", type: "debit", classification: "instant", confidence: 98 },
      { id: "t-kalpana", merchant: "Kalpana Stores", category: "Shopping", categoryIcon: ShoppingBag, date: "Today", amount: 1240, currency: "INR", type: "debit", classification: "ai", confidence: 96 },
    ],
  },
  {
    id: "d-yesterday",
    label: "Yesterday",
    items: [
      { id: "t-pvr", merchant: "PVR Cinemas", category: "Entertainment", categoryIcon: Clapperboard, date: "Yesterday", amount: 640, currency: "INR", type: "debit", classification: "learned", confidence: 94 },
      { id: "t-salary", merchant: "Monthly Salary", category: "Income", categoryIcon: Landmark, date: "Yesterday", amount: 32000, currency: "INR", type: "credit", classification: "instant", confidence: 100 },
      { id: "t-swiggy", merchant: "Swiggy", category: "Food", categoryIcon: UtensilsCrossed, date: "Yesterday", amount: 418, currency: "INR", type: "debit", classification: "instant", confidence: 99 },
    ],
  },
];

/* ------------------------------- AI assistant -------------------------------- */

export const AI_PROMPTS: string[] = [
  "Can I buy a ₹60,000 laptop in 5 months?",
  "Why did my spending increase this month?",
  "Where can I cut ₹3,000?",
  "How do I compare with other students?",
];

export interface AIResponseMetric {
  label: string;
  value: string;
}

export interface AIResponse {
  headline: string;
  body: string;
  metrics: AIResponseMetric[];
  action: string;
}

export const AI_SAMPLE_RESPONSE: AIResponse = {
  headline: "Financial analysis",
  body: "Yes — based on your current trend, you can reach ₹60,000 in approximately 4.6 months.",
  metrics: [
    { label: "Required monthly savings", value: "₹10,720" },
    { label: "Current average", value: "₹11,850" },
    { label: "Confidence", value: "High" },
  ],
  action: "View projection",
};
