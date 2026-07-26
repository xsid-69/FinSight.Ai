import type {
  FinancialFact,
  FinancialProfile,
  ProjectedMonth,
  ScenarioConfig,
} from "@/types/financial";

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const roundMetric = (value: number) => Math.round(value * 10) / 10;

const assertFiniteProfile = (profile: FinancialProfile) => {
  const values = [
    profile.initialBalance,
    profile.monthlyIncome,
    profile.monthlyRecurringExpenses,
    profile.monthlyVariableExpenses,
    profile.annualIncomeGrowthRate,
    profile.annualExpenseInflationRate,
  ];

  if (!values.every(Number.isFinite)) {
    throw new Error("Financial profile contains a non-finite number.");
  }

  if (
    profile.monthlyIncome < 0 ||
    profile.monthlyRecurringExpenses < 0 ||
    profile.monthlyVariableExpenses < 0
  ) {
    throw new Error("Income and expense baselines cannot be negative.");
  }
};

const monthKey = (startMonth: string, offset: number) => {
  if (!/^\d{4}-\d{2}$/.test(startMonth)) {
    throw new Error("startMonth must use YYYY-MM format.");
  }
  const [year, month] = startMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
};

export function generateCashProjection(
  profile: FinancialProfile,
  scenario?: ScenarioConfig,
): ProjectedMonth[] {
  assertFiniteProfile(profile);
  const duration = scenario?.durationMonths ?? 36;
  const incomeGrowth = Math.pow(1 + profile.annualIncomeGrowthRate, 1 / 12);
  const expenseInflation = Math.pow(1 + profile.annualExpenseInflationRate, 1 / 12);
  let balance = profile.initialBalance;

  return Array.from({ length: duration }, (_, monthIndex) => {
    const income = Math.max(
      0,
      profile.monthlyIncome * Math.pow(incomeGrowth, monthIndex) +
        (scenario?.monthlyIncomeDelta ?? 0),
    );
    const recurringExpenses = Math.max(
      0,
      profile.monthlyRecurringExpenses * Math.pow(expenseInflation, monthIndex) +
        (scenario?.monthlyRecurringExpenseDelta ?? 0),
    );
    const variableExpenses = Math.max(
      0,
      profile.monthlyVariableExpenses * Math.pow(expenseInflation, monthIndex) +
        (scenario?.monthlyVariableExpenseDelta ?? 0),
    );
    const scenarioCosts =
      scenario?.oneTimeCosts
        .filter((cost) => cost.monthOffset === monthIndex)
        .reduce((total, cost) => total + cost.amount, 0) ?? 0;
    const startingBalance = balance;
    const totalOutflow = recurringExpenses + variableExpenses + scenarioCosts;
    const endingBalance = startingBalance + income - totalOutflow;
    const operatingExpenses = recurringExpenses + variableExpenses;

    const projection: ProjectedMonth = {
      monthIndex,
      month: monthKey(profile.startMonth, monthIndex),
      startingBalance: roundMoney(startingBalance),
      income: roundMoney(income),
      recurringExpenses: roundMoney(recurringExpenses),
      variableExpenses: roundMoney(variableExpenses),
      scenarioCosts: roundMoney(scenarioCosts),
      endingBalance: roundMoney(endingBalance),
      savingsRate: roundMetric(income === 0 ? 0 : ((income - totalOutflow) / income) * 100),
      emergencyRunwayMonths: roundMetric(
        operatingExpenses === 0 ? 0 : Math.max(0, endingBalance / operatingExpenses),
      ),
    };

    balance = endingBalance;
    return projection;
  });
}

export function detectProactiveFacts(
  currentTotals: Readonly<Record<string, number>>,
  historicalAverages: Readonly<Record<string, number>>,
  thresholdPercentage = 20,
): FinancialFact[] {
  if (!Number.isFinite(thresholdPercentage) || thresholdPercentage < 0) {
    throw new Error("Fact threshold must be a non-negative finite number.");
  }

  return Object.entries(currentTotals).flatMap(([category, currentValue]) => {
    const baselineValue = historicalAverages[category] ?? 0;
    if (![currentValue, baselineValue].every(Number.isFinite) || currentValue < 0) {
      throw new Error(`Invalid totals supplied for ${category}.`);
    }

    const variancePercentage =
      baselineValue === 0
        ? currentValue > 0
          ? 100
          : 0
        : ((currentValue - baselineValue) / baselineValue) * 100;

    if (Math.abs(variancePercentage) < thresholdPercentage) return [];

    const roundedVariance = roundMetric(variancePercentage);
    const direction = roundedVariance >= 0 ? "above" : "below";
    const severity: FinancialFact["severity"] =
      roundedVariance >= 50 ? "critical" : roundedVariance >= 20 ? "warning" : "info";

    return [{
      id: `${category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-${direction}`,
      kind: baselineValue === 0 ? "anomaly" : "spending_velocity",
      severity,
      title: `${category} spending moved ${direction} its baseline`,
      category,
      currentValue: roundMoney(currentValue),
      baselineValue: roundMoney(baselineValue),
      variancePercentage: roundedVariance,
      displayValue: `${Math.abs(roundedVariance)}% ${direction}`,
      period: "Current month",
    } satisfies FinancialFact];
  });
}
