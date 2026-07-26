export type ProjectionDuration = 12 | 36 | 60;
export type TransactionType = "income" | "expense";
export type FactSeverity = "info" | "warning" | "critical";

export interface Transaction {
  id: string;
  userId: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  isRecurring: boolean;
  createdAt: string;
}

export interface OneTimeCost {
  id: string;
  label: string;
  amount: number;
  monthOffset: number;
}

export interface ScenarioConfig {
  name: string;
  durationMonths: ProjectionDuration;
  oneTimeCosts: OneTimeCost[];
  monthlyIncomeDelta: number;
  monthlyRecurringExpenseDelta: number;
  monthlyVariableExpenseDelta: number;
}

export interface FinancialProfile {
  startMonth: string;
  initialBalance: number;
  monthlyIncome: number;
  monthlyRecurringExpenses: number;
  monthlyVariableExpenses: number;
  annualIncomeGrowthRate: number;
  annualExpenseInflationRate: number;
}

export interface ProjectedMonth {
  monthIndex: number;
  month: string;
  startingBalance: number;
  income: number;
  recurringExpenses: number;
  variableExpenses: number;
  scenarioCosts: number;
  endingBalance: number;
  savingsRate: number;
  emergencyRunwayMonths: number;
}

export interface FinancialFact {
  id: string;
  kind: "spending_velocity" | "anomaly" | "runway" | "savings_rate";
  severity: FactSeverity;
  title: string;
  category?: string;
  currentValue: number;
  baselineValue: number;
  variancePercentage: number;
  displayValue: string;
  period: string;
}

export interface AIInsight {
  id: string;
  factId: string;
  narrative: string;
  generatedAt: string;
  model: string;
}

export type CategoryTotals = Readonly<Record<string, number>>;
