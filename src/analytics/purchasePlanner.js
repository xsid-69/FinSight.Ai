import { projectCashFlow } from "./holtWinters";

const MINIMUM_HISTORY_MONTHS = 6;
const MAXIMUM_ANALYSIS_MONTHS = 12;
const DISCRETIONARY_CATEGORIES = new Set(["ENTERTAINMENT", "SHOPPING"]);

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMoney(value) {
  return Math.round((finiteNumber(value) + Number.EPSILON) * 100) / 100;
}

function monthIndexFromKey(key) {
  if (typeof key !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) return null;
  const [year, month] = key.split("-").map(Number);
  return year * 12 + month - 1;
}

function monthKeyFromIndex(index) {
  const year = Math.floor(index / 12);
  const month = index % 12;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function transactionMonthKey(transaction) {
  const date = transaction?.date;
  if (typeof date !== "string") return null;
  const match = date.match(/^(\d{4})-(0[1-9]|1[0-2])-/);
  return match ? `${match[1]}-${match[2]}` : null;
}

function monthDisplayLabel(key) {
  const index = monthIndexFromKey(key);
  if (index === null) return "";
  const date = new Date(Date.UTC(Math.floor(index / 12), index % 12, 1));
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values) {
  if (!values.length) return 0;
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

function formatCurrency(value) {
  const amount = Math.round(finiteNumber(value));
  const sign = amount < 0 ? "−" : "";
  return `${sign}₹${Math.abs(amount).toLocaleString("en-IN")}`;
}

/**
 * Finds the latest uninterrupted run of completed calendar months represented
 * by real transactions. The current calendar month is excluded because it is
 * partial and would bias monthly averages.
 */
export function analyzeTransactionCoverage(
  transactions,
  referenceDate = new Date(),
  minimumMonths = MINIMUM_HISTORY_MONTHS,
) {
  const source = Array.isArray(transactions) ? transactions : [];
  const currentMonthIndex = referenceDate.getUTCFullYear() * 12 + referenceDate.getUTCMonth();
  const lastCompletedMonthIndex = currentMonthIndex - 1;
  const monthCounts = new Map();

  source.forEach((transaction) => {
    const key = transactionMonthKey(transaction);
    const index = monthIndexFromKey(key);
    if (index === null || index > lastCompletedMonthIndex) return;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  });

  const observedMonthKeys = [...monthCounts.keys()].sort();
  let latestConsecutiveRun = [];
  let currentRun = [];

  observedMonthKeys.forEach((key) => {
    const index = monthIndexFromKey(key);
    const previousIndex = currentRun.length
      ? monthIndexFromKey(currentRun[currentRun.length - 1])
      : null;

    if (previousIndex === null || index === previousIndex + 1) {
      currentRun.push(key);
    } else {
      currentRun = [key];
    }
    latestConsecutiveRun = [...currentRun];
  });

  const analyzedMonthKeys = latestConsecutiveRun.slice(-MAXIMUM_ANALYSIS_MONTHS);
  const hasMinimumHistory = latestConsecutiveRun.length >= minimumMonths;
  const firstKey = analyzedMonthKeys[0] ?? null;
  const lastKey = analyzedMonthKeys[analyzedMonthKeys.length - 1] ?? null;

  return {
    requiredMonths: minimumMonths,
    hasMinimumHistory,
    completeMonthCount: latestConsecutiveRun.length,
    observedMonthCount: observedMonthKeys.length,
    analyzedMonthKeys,
    transactionCount: analyzedMonthKeys.reduce(
      (sum, key) => sum + (monthCounts.get(key) ?? 0),
      0,
    ),
    startMonth: firstKey,
    endMonth: lastKey,
    startLabel: firstKey ? monthDisplayLabel(firstKey) : "",
    endLabel: lastKey ? monthDisplayLabel(lastKey) : "",
    rangeLabel: firstKey && lastKey
      ? `${monthDisplayLabel(firstKey)} – ${monthDisplayLabel(lastKey)}`
      : "No completed-month history",
    excludedCurrentMonth: source.some((transaction) => {
      const key = transactionMonthKey(transaction);
      return monthIndexFromKey(key) === currentMonthIndex;
    }),
  };
}

export function buildHistoricalProfile(transactions, coverage) {
  const source = Array.isArray(transactions) ? transactions : [];
  const monthKeys = coverage?.analyzedMonthKeys ?? [];
  const allowedMonths = new Set(monthKeys);
  const records = new Map(
    monthKeys.map((key) => [key, {
      monthKey: key,
      label: monthDisplayLabel(key),
      income: 0,
      spending: 0,
      netCashFlow: 0,
      discretionarySpending: 0,
      transactionCount: 0,
    }]),
  );

  source.forEach((transaction) => {
    const key = transactionMonthKey(transaction);
    if (!allowedMonths.has(key)) return;
    const amount = finiteNumber(transaction?.amount);
    if (amount <= 0) return;

    const record = records.get(key);
    record.transactionCount += 1;
    if (transaction.type === "CREDIT") {
      record.income += amount;
    } else if (transaction.type === "DEBIT") {
      record.spending += amount;
      if (DISCRETIONARY_CATEGORIES.has(transaction.category)) {
        record.discretionarySpending += amount;
      }
    }
  });

  const monthlyRecords = monthKeys.map((key) => {
    const record = records.get(key);
    return {
      ...record,
      income: roundMoney(record.income),
      spending: roundMoney(record.spending),
      netCashFlow: roundMoney(record.income - record.spending),
      discretionarySpending: roundMoney(record.discretionarySpending),
    };
  });

  const incomes = monthlyRecords.map((record) => record.income);
  const spending = monthlyRecords.map((record) => record.spending);
  const netCashFlows = monthlyRecords.map((record) => record.netCashFlow);
  const averageIncome = mean(incomes);
  const averageSpending = mean(spending);
  const averageNetCashFlow = mean(netCashFlows);
  const averageDiscretionarySpending = mean(
    monthlyRecords.map((record) => record.discretionarySpending),
  );
  const spendingDeviation = standardDeviation(spending);
  const netCashFlowDeviation = standardDeviation(netCashFlows);
  const spendingCoefficientOfVariation = averageSpending > 0
    ? spendingDeviation / averageSpending
    : 0;
  const positiveCashFlowMonths = netCashFlows.filter((value) => value > 0).length;
  const negativeCashFlowMonths = netCashFlows.filter((value) => value < 0).length;
  const savingsRate = averageIncome > 0 ? (averageNetCashFlow / averageIncome) * 100 : 0;

  let confidence = "Medium";
  if (
    monthlyRecords.length >= 12
    && spendingCoefficientOfVariation <= 0.3
    && positiveCashFlowMonths >= 9
  ) {
    confidence = "High";
  } else if (
    spendingCoefficientOfVariation > 0.65
    || negativeCashFlowMonths > monthlyRecords.length / 2
  ) {
    confidence = "Cautious";
  }

  return {
    monthlyRecords,
    monthlyNetCashFlows: netCashFlows,
    monthsAnalyzed: monthlyRecords.length,
    transactionCount: monthlyRecords.reduce(
      (sum, record) => sum + record.transactionCount,
      0,
    ),
    averageIncome: roundMoney(averageIncome),
    averageSpending: roundMoney(averageSpending),
    averageNetCashFlow: roundMoney(averageNetCashFlow),
    averageDiscretionarySpending: roundMoney(averageDiscretionarySpending),
    savingsRate: roundMoney(savingsRate),
    spendingDeviation: roundMoney(spendingDeviation),
    netCashFlowDeviation: roundMoney(netCashFlowDeviation),
    spendingCoefficientOfVariation: roundMoney(spendingCoefficientOfVariation),
    positiveCashFlowMonths,
    negativeCashFlowMonths,
    confidence,
    rangeLabel: coverage?.rangeLabel ?? "",
  };
}

function buildQuestions({
  status,
  purchaseName,
  purchasePrice,
  targetMonth,
  availableCash,
  protectedReserve,
  historical,
  verdict,
  coverage,
  sourceLabel,
}) {
  const affordableAnswer = status === "affordable"
    ? `Yes, under the supplied assumptions. Paying the full ${formatCurrency(purchasePrice)} keeps projected cash at or above ${formatCurrency(verdict.minimumProjectedCash)} while protecting the ${formatCurrency(protectedReserve)} reserve.`
    : status === "caution"
      ? `The full price can be paid, but the reserve or historical cash-flow check is tight. The lowest projected cash level is ${formatCurrency(verdict.minimumProjectedCash)}.`
      : `Not on the current timing. After the full-price deduction, modeled cash falls to ${formatCurrency(verdict.minimumProjectedCash)}.`;

  const waitAnswer = verdict.earliestReserveSafeMonth
    ? verdict.earliestReserveSafeMonth <= targetMonth
      ? "The selected month already has enough projected cash for the full price and protected reserve test."
      : `The first modeled month that can cover the full price while preserving the reserve is month ${verdict.earliestReserveSafeMonth}.`
    : `No month inside the ${verdict.forecastMonths}-month forecast covers the full price while preserving the reserve.`;

  return [
    {
      question: `Can I afford ${purchaseName}?`,
      answer: affordableAnswer,
    },
    {
      question: "Will my protected cash remain intact?",
      answer: verdict.reserveMaintained
        ? `Yes in the modeled horizon. Cash immediately after purchase is ${formatCurrency(verdict.cashAfterImmediatePayment)}, and the later minimum remains above the reserve.`
        : `No. The runway falls ${formatCurrency(verdict.reserveGap)} below the protected reserve at its weakest point.`,
    },
    {
      question: "What does my historical cash flow say?",
      answer: `Average historical free cash flow is ${formatCurrency(historical.averageNetCashFlow)} per month, with ${historical.positiveCashFlowMonths} positive month${historical.positiveCashFlowMonths === 1 ? "" : "s"} across the ${historical.monthsAnalyzed}-month analysis.`,
    },
    {
      question: "Would waiting help?",
      answer: waitAnswer,
    },
    {
      question: "How reliable is this estimate?",
      answer: `Confidence is ${historical.confidence.toLowerCase()}. It uses ${historical.monthsAnalyzed} completed months (${coverage.rangeLabel}) and ${historical.transactionCount} validated transactions.`,
    },
    {
      question: "What assumptions should I know?",
      answer: `The source is ${sourceLabel}. Available cash (${formatCurrency(availableCash)}) and the reserve were entered by you. The model projects historical free cash flow, then permanently deducts the full product price in month ${targetMonth}; unusual or missing activity can change the result.`,
    },
  ];
}

function buildRecommendations({
  status,
  historical,
  verdict,
  protectedReserve,
  purchasePrice,
  targetMonth,
  sourceLabel,
}) {
  const recommendations = [];
  const reserveShortfall = Math.max(
    verdict.reserveGap,
    protectedReserve - verdict.cashAfterImmediatePayment,
  );

  if (reserveShortfall > 0) {
    recommendations.push(
      `Increase available cash or lower the ${formatCurrency(purchasePrice)} product price by at least ${formatCurrency(reserveShortfall)} to protect the reserve across the forecast.`,
    );
  }

  if (historical.averageNetCashFlow <= 0) {
    recommendations.push(
      `Historical free cash flow averages ${formatCurrency(historical.averageNetCashFlow)} per month. Strengthen monthly cash flow before committing to the full-price purchase.`,
    );
  }

  if (
    verdict.earliestReserveSafeMonth
    && verdict.earliestReserveSafeMonth > targetMonth
  ) {
    recommendations.push(
      `Wait until about month ${verdict.earliestReserveSafeMonth}; that is the first modeled point where available cash covers the product price and protected reserve.`,
    );
  }

  if (historical.confidence === "Cautious") {
    recommendations.push(
      "Confidence is cautious because the historical pattern is less stable. Keep more cash protected or re-run the plan after additional completed months.",
    );
  }

  if (status === "affordable" && recommendations.length === 0) {
    recommendations.push(
      `Using ${sourceLabel}, the month-${targetMonth} full-price plan meets the cash and reserve checks. Re-run it if the product price, available cash, reserve, timing, or source changes.`,
    );
  }

  return recommendations.slice(0, 4);
}

/**
 * Runs a deterministic, real-data purchase analysis. No result is produced
 * unless at least six consecutive completed transaction months are available.
 */
export function analyzePurchasePlan(transactions, inputs, referenceDate = new Date()) {
  const coverage = analyzeTransactionCoverage(transactions, referenceDate);
  if (!coverage.hasMinimumHistory) {
    return {
      eligible: false,
      coverage,
      errors: [
        `At least ${coverage.requiredMonths} consecutive completed months are required.`,
      ],
    };
  }

  const purchaseName = String(inputs?.purchaseName ?? "").trim();
  const purchasePrice = finiteNumber(inputs?.purchasePrice, Number.NaN);
  const availableCash = finiteNumber(inputs?.availableCash, Number.NaN);
  const protectedReserve = finiteNumber(inputs?.protectedReserve, Number.NaN);
  const targetMonth = Math.floor(finiteNumber(inputs?.targetMonth, Number.NaN));
  const sourceLabel = String(
    inputs?.sourceLabel ?? "All imported transactions",
  ).trim() || "All imported transactions";
  const errors = [];

  if (!purchaseName) errors.push("Enter the product or purchase name.");
  if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
    errors.push("Enter a valid purchase price greater than zero.");
  }
  if (!Number.isFinite(availableCash) || availableCash < 0) {
    errors.push("Enter your current available liquid cash.");
  }
  if (!Number.isFinite(protectedReserve) || protectedReserve < 0) {
    errors.push("Enter the amount of cash you want to protect.");
  }
  if (!Number.isFinite(targetMonth) || targetMonth < 1 || targetMonth > 36) {
    errors.push("Choose a purchase month between 1 and 36.");
  }

  if (errors.length > 0) return { eligible: false, coverage, errors };

  const historical = buildHistoricalProfile(transactions, coverage);
  const forecastMonths = Math.min(36, Math.max(12, targetMonth + 12));
  const baseline = projectCashFlow(
    historical.monthlyNetCashFlows,
    availableCash,
    forecastMonths,
  );

  const trajectory = baseline.map((point) => ({
    ...point,
    simulatedBalance: point.monthIndex < targetMonth
      ? point.baselineBalance
      : Math.round(point.baselineBalance - purchasePrice),
  }));

  const targetPoint = trajectory.find((point) => point.monthIndex === targetMonth);
  const postPurchasePoints = trajectory.filter((point) => point.monthIndex >= targetMonth);
  const minimumPoint = postPurchasePoints.reduce(
    (minimum, point) => (
      !minimum || point.simulatedBalance < minimum.simulatedBalance ? point : minimum
    ),
    null,
  );
  const cashAfterImmediatePayment = targetPoint?.simulatedBalance
    ?? availableCash - purchasePrice;
  const minimumProjectedCash = minimumPoint?.simulatedBalance ?? cashAfterImmediatePayment;
  const reserveMaintained = minimumProjectedCash >= protectedReserve;
  const nonNegativeRunway = minimumProjectedCash >= 0;
  const cashFlowHealthy = historical.averageNetCashFlow > 0;

  let status = "affordable";
  if (cashAfterImmediatePayment < 0 || !nonNegativeRunway) {
    status = "not_affordable";
  } else if (
    cashAfterImmediatePayment < protectedReserve
    || !reserveMaintained
    || !cashFlowHealthy
  ) {
    status = "caution";
  }

  const minimumBaselineFromMonth = new Array(baseline.length);
  let runningMinimumBaseline = Number.POSITIVE_INFINITY;
  for (let index = baseline.length - 1; index >= 0; index -= 1) {
    runningMinimumBaseline = Math.min(
      runningMinimumBaseline,
      baseline[index].baselineBalance,
    );
    minimumBaselineFromMonth[index] = runningMinimumBaseline;
  }
  const earliestReserveSafePoint = baseline.find(
    (point, index) => (
      minimumBaselineFromMonth[index] - purchasePrice >= protectedReserve
    ),
  );
  const verdict = {
    status,
    forecastMonths,
    cashAtPurchaseBeforePayment: targetPoint?.baselineBalance ?? 0,
    cashAfterImmediatePayment: roundMoney(cashAfterImmediatePayment),
    minimumProjectedCash: roundMoney(minimumProjectedCash),
    minimumCashMonth: minimumPoint?.monthIndex ?? targetMonth,
    protectedReserve: roundMoney(protectedReserve),
    reserveMaintained,
    reserveGap: roundMoney(Math.max(0, protectedReserve - minimumProjectedCash)),
    nonNegativeRunway,
    earliestReserveSafeMonth: earliestReserveSafePoint?.monthIndex ?? null,
  };

  const questions = buildQuestions({
    status,
    purchaseName,
    purchasePrice,
    targetMonth,
    availableCash,
    protectedReserve,
    historical,
    verdict,
    coverage,
    sourceLabel,
  });
  const recommendations = buildRecommendations({
    status,
    historical,
    verdict,
    protectedReserve,
    purchasePrice,
    targetMonth,
    sourceLabel,
  });

  return {
    eligible: true,
    coverage,
    inputs: {
      purchaseName,
      purchasePrice: roundMoney(purchasePrice),
      availableCash: roundMoney(availableCash),
      protectedReserve: roundMoney(protectedReserve),
      targetMonth,
      sourceLabel,
    },
    historical,
    verdict,
    trajectory,
    questions,
    recommendations,
  };
}

export const purchasePlannerConstants = {
  minimumHistoryMonths: MINIMUM_HISTORY_MONTHS,
  maximumAnalysisMonths: MAXIMUM_ANALYSIS_MONTHS,
};
