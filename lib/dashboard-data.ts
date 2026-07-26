import { detectProactiveFacts } from "@/lib/math-engine";
import type { FinancialProfile, ScenarioConfig } from "@/types/financial";

// Edit this file to change the entire demo workspace without touching JSX.
export const dashboardCopy = {
  workspace: "Personal wealth workspace",
  greeting: "Good morning, Arjun",
  title: "Your money, made legible.",
  subtitle: "Deterministic forecasts with AI used only for language and intent.",
};

export const financialProfile: FinancialProfile = {
  startMonth: "2026-08",
  initialBalance: 428_650,
  monthlyIncome: 184_000,
  monthlyRecurringExpenses: 68_200,
  monthlyVariableExpenses: 42_750,
  annualIncomeGrowthRate: 0.055,
  annualExpenseInflationRate: 0.042,
};

export const recurringExpenses = [
  { label: "Home loan", amount: 38_500 },
  { label: "Insurance", amount: 11_800 },
  { label: "Subscriptions", amount: 6_450 },
  { label: "Utilities", amount: 11_450 },
] as const;

export const defaultScenario: ScenarioConfig = {
  name: "Laptop purchase next month",
  durationMonths: 36,
  oneTimeCosts: [
    { id: "laptop", label: "Laptop", amount: 150_000, monthOffset: 1 },
  ],
  monthlyIncomeDelta: 0,
  monthlyRecurringExpenseDelta: 0,
  monthlyVariableExpenseDelta: 0,
};

const currentCategoryTotals = {
  Food: 18_620,
  Transport: 8_940,
  Shopping: 16_300,
  Utilities: 10_920,
} as const;

const historicalCategoryAverages = {
  Food: 13_470,
  Transport: 8_310,
  Shopping: 9_850,
  Utilities: 11_240,
} as const;

export const proactiveFacts = detectProactiveFacts(
  currentCategoryTotals,
  historicalCategoryAverages,
  20,
);

export const exampleQueries = [
  "What if I buy a 1.5 lakh laptop next month?",
  "What if rent rises by 8,000 per month for 3 years?",
  "What if my monthly income increases by 25,000?",
] as const;

export const recentTransactions = [
  { id: "salary-july", description: "Monthly salary", category: "Income", amount: 184_000, date: "26 Jul", type: "income" },
  { id: "grocery-weekly", description: "Nature's Basket", category: "Food", amount: 4_860, date: "25 Jul", type: "expense" },
  { id: "electricity-july", description: "Electricity bill", category: "Utilities", amount: 3_240, date: "24 Jul", type: "expense" },
  { id: "metro-card", description: "Metro card", category: "Transport", amount: 1_500, date: "23 Jul", type: "expense" },
] as const;

export const categorySpending = [
  { label: "Food", amount: 18_620, opacity: 1 },
  { label: "Shopping", amount: 16_300, opacity: 0.82 },
  { label: "Utilities", amount: 10_920, opacity: 0.64 },
  { label: "Transport", amount: 8_940, opacity: 0.48 },
] as const;
