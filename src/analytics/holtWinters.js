const ISO_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])(?:-|$)/;

function toMonthKey(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const match = value.match(ISO_MONTH_PATTERN);
    if (match) return `${match[1]}-${match[2]}`;
  }

  const candidate = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = candidate instanceof Date ? candidate : new Date(candidate);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function smoothingFactor(value, fallback) {
  const number = finiteNumber(value, fallback);
  return Math.min(1, Math.max(0, number));
}

/**
 * Aggregates transactions into chronological monthly net savings.
 * Net savings = total credits - total debits for each observed calendar month.
 *
 * @param {Array<{date?: unknown, createdAt?: unknown, amount?: unknown, type?: string}>} transactions
 * @returns {number[]}
 */
export function calculateMonthlySavings(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return [];

  const monthlyTotals = {};

  transactions.forEach((transaction) => {
    const monthKey = toMonthKey(transaction?.date ?? transaction?.createdAt);
    if (!monthKey) return;

    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { credits: 0, debits: 0 };
    }

    const amount = finiteNumber(transaction?.amount);
    if (transaction?.type === "CREDIT") {
      monthlyTotals[monthKey].credits += amount;
    } else {
      monthlyTotals[monthKey].debits += amount;
    }
  });

  return Object.keys(monthlyTotals)
    .sort()
    .map((key) => monthlyTotals[key].credits - monthlyTotals[key].debits);
}

/**
 * Applies deterministic Holt double exponential smoothing to monthly savings,
 * then accumulates each future monthly forecast into a projected cash balance.
 *
 * @param {number[]} monthlySavingsHistory
 * @param {number} currentBalance
 * @param {number} forecastMonths
 * @param {number} alpha Level smoothing factor.
 * @param {number} beta Trend smoothing factor.
 * @returns {Array<{monthIndex: number, monthLabel: string, projectedNetSavings: number, baselineBalance: number}>}
 */
export function projectCashFlow(
  monthlySavingsHistory,
  currentBalance,
  forecastMonths = 12,
  alpha = 0.3,
  beta = 0.1,
) {
  const history = Array.isArray(monthlySavingsHistory)
    ? monthlySavingsHistory.map((value) => finiteNumber(value)).filter(Number.isFinite)
    : [];
  const levelSmoothing = smoothingFactor(alpha, 0.3);
  const trendSmoothing = smoothingFactor(beta, 0.1);
  const horizon = Math.max(0, Math.floor(finiteNumber(forecastMonths, 12)));

  let level = 0;
  let trend = 0;

  if (history.length === 0) {
    level = 5000;
    trend = 200;
  } else if (history.length === 1) {
    level = history[0];
  } else {
    level = history[0];
    trend = history[1] - history[0];

    for (let index = 1; index < history.length; index += 1) {
      const previousLevel = level;
      level = levelSmoothing * history[index]
        + (1 - levelSmoothing) * (previousLevel + trend);
      trend = trendSmoothing * (level - previousLevel)
        + (1 - trendSmoothing) * trend;
    }
  }

  let runningBalance = finiteNumber(currentBalance);
  const projections = [];

  for (let month = 1; month <= horizon; month += 1) {
    const projectedNetSavings = level + month * trend;
    runningBalance += projectedNetSavings;
    projections.push({
      monthIndex: month,
      monthLabel: `M+${month}`,
      projectedNetSavings: Math.round(projectedNetSavings),
      baselineBalance: Math.round(runningBalance),
    });
  }

  return projections;
}

/**
 * Applies a one-time goal purchase at the selected month. The deduction remains
 * in every downstream balance so the two trajectories stay directly comparable.
 *
 * @param {Array<{monthIndex: number, baselineBalance: number}>} projections
 * @param {number} targetCost
 * @param {number} targetMonthIndex
 * @returns {{isAffordable: boolean, targetCost: number, targetMonthIndex: number, remainingCashAtTarget: number, trajectory: Array<object>}}
 */
export function evaluateGoalFeasibility(projections, targetCost, targetMonthIndex) {
  const source = Array.isArray(projections) ? projections : [];
  const cost = finiteNumber(targetCost);
  const targetIndex = Math.max(1, Math.floor(finiteNumber(targetMonthIndex, 1)));

  const trajectory = source.map((projection) => ({
    ...projection,
    simulatedBalance: projection.monthIndex >= targetIndex
      ? projection.baselineBalance - cost
      : projection.baselineBalance,
  }));

  const targetPoint = trajectory.find((projection) => projection.monthIndex === targetIndex)
    ?? trajectory[0]
    ?? null;
  const remainingCashAtTarget = targetPoint?.simulatedBalance ?? -cost;

  return {
    isAffordable: Boolean(targetPoint) && remainingCashAtTarget >= 0,
    targetCost: cost,
    targetMonthIndex: targetIndex,
    remainingCashAtTarget,
    trajectory,
  };
}
