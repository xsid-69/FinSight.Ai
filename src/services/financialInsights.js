const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function formatInr(value) {
  return INR_FORMATTER.format(roundMoney(Math.abs(value)));
}

function formatDate(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? value : DATE_FORMATTER.format(parsed);
}

function monthLabel(monthKey) {
  const parsed = new Date(`${monthKey}-01T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? monthKey : MONTH_FORMATTER.format(parsed);
}

export function categoryLabel(category) {
  const labels = {
    CASH: "Cash",
    ENTERTAINMENT: "Entertainment",
    FOOD: "Food & dining",
    HEALTHCARE: "Healthcare",
    INCOME: "Income",
    OTHER: "Other",
    SHOPPING: "Shopping",
    TRANSFER: "Transfers",
    TRANSPORTATION: "Transport",
    UTILITIES: "Bills & utilities",
  };
  return labels[category] || String(category || "Other");
}

export function merchantLabel(description) {
  const normalized = String(description || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Transaction";

  const withoutChannel = normalized.replace(
    /^(?:upi|pos|ecs|neft|imps|rtgs|ach|atm|card)[\s/.:_-]+/i,
    "",
  );
  const withoutHandle = withoutChannel.replace(
    /@(?:upi|ybl|ibl|paytm|ok[a-z0-9]+)\b/gi,
    "",
  );
  const merchant = withoutHandle.replace(/^[\s/.:_-]+|[\s/.:_-]+$/g, "").trim();
  return merchant || normalized;
}

function emptyInsights() {
  return {
    transactionCount: 0,
    debitCount: 0,
    creditCount: 0,
    totalSpent: 0,
    totalIncome: 0,
    netCashFlow: 0,
    savingsRate: null,
    averageDebit: 0,
    periodLabel: "No statement history",
    dateRange: { start: null, end: null },
    categoryBreakdown: [],
    monthlyActivity: [],
    topCategory: null,
    topMerchant: null,
    largestDebit: null,
    recurringMerchants: [],
    observations: [],
  };
}

export function buildFinancialInsights(inputTransactions) {
  if (!Array.isArray(inputTransactions) || inputTransactions.length === 0) {
    return emptyInsights();
  }

  const transactions = inputTransactions
    .filter(
      (transaction) =>
        transaction &&
        typeof transaction.date === "string" &&
        Number.isFinite(transaction.amount) &&
        transaction.amount > 0 &&
        (transaction.type === "DEBIT" || transaction.type === "CREDIT"),
    )
    .slice()
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id));

  if (transactions.length === 0) return emptyInsights();

  const debits = transactions.filter((transaction) => transaction.type === "DEBIT");
  const credits = transactions.filter((transaction) => transaction.type === "CREDIT");
  const totalSpent = roundMoney(debits.reduce((sum, transaction) => sum + transaction.amount, 0));
  const totalIncome = roundMoney(credits.reduce((sum, transaction) => sum + transaction.amount, 0));
  const netCashFlow = roundMoney(totalIncome - totalSpent);
  const savingsRate = totalIncome > 0 ? roundMoney((netCashFlow / totalIncome) * 100) : null;

  const categoryTotals = new Map();
  const merchantTotals = new Map();
  const monthlyTotals = new Map();

  transactions.forEach((transaction) => {
    const month = transaction.date.slice(0, 7);
    const monthly = monthlyTotals.get(month) || {
      month,
      label: monthLabel(month),
      totalSpent: 0,
      totalIncome: 0,
      netCashFlow: 0,
      transactionCount: 0,
    };
    monthly.transactionCount += 1;
    if (transaction.type === "DEBIT") monthly.totalSpent += transaction.amount;
    else monthly.totalIncome += transaction.amount;
    monthlyTotals.set(month, monthly);

    if (transaction.type !== "DEBIT") return;

    const category = categoryTotals.get(transaction.category) || {
      category: transaction.category,
      label: categoryLabel(transaction.category),
      amount: 0,
      count: 0,
      share: 0,
    };
    category.amount += transaction.amount;
    category.count += 1;
    categoryTotals.set(transaction.category, category);

    const merchant = merchantLabel(transaction.sanitizedDescription);
    const merchantTotal = merchantTotals.get(merchant) || {
      merchant,
      amount: 0,
      count: 0,
    };
    merchantTotal.amount += transaction.amount;
    merchantTotal.count += 1;
    merchantTotals.set(merchant, merchantTotal);
  });

  const categoryBreakdown = Array.from(categoryTotals.values())
    .map((item) => ({
      ...item,
      amount: roundMoney(item.amount),
      share: totalSpent > 0 ? roundMoney((item.amount / totalSpent) * 100) : 0,
    }))
    .sort((left, right) => right.amount - left.amount || left.label.localeCompare(right.label));

  const merchants = Array.from(merchantTotals.values())
    .map((item) => ({ ...item, amount: roundMoney(item.amount) }))
    .sort((left, right) => right.amount - left.amount || right.count - left.count);

  const monthlyActivity = Array.from(monthlyTotals.values())
    .map((item) => ({
      ...item,
      totalSpent: roundMoney(item.totalSpent),
      totalIncome: roundMoney(item.totalIncome),
      netCashFlow: roundMoney(item.totalIncome - item.totalSpent),
    }))
    .sort((left, right) => left.month.localeCompare(right.month));

  const largestDebit = debits
    .slice()
    .sort((left, right) => right.amount - left.amount || right.date.localeCompare(left.date))[0] || null;
  const topCategory = categoryBreakdown[0] || null;
  const topMerchant = merchants[0] || null;
  const recurringMerchants = merchants.filter((item) => item.count >= 2).slice(0, 5);
  const startDate = transactions[0].date;
  const endDate = transactions[transactions.length - 1].date;
  const periodLabel = startDate === endDate
    ? formatDate(startDate)
    : `${formatDate(startDate)} – ${formatDate(endDate)}`;

  const observations = [];
  observations.push({
    id: "cash-flow",
    tone: netCashFlow >= 0 ? "positive" : "warning",
    title: netCashFlow >= 0 ? "Positive cash flow" : "Spending exceeded money in",
    body: netCashFlow >= 0
      ? `Money in was ${formatInr(netCashFlow)} higher than spending across this statement.`
      : `Spending was ${formatInr(netCashFlow)} higher than money in across this statement.`,
  });

  if (topCategory) {
    observations.push({
      id: "top-category",
      tone: "neutral",
      title: `${topCategory.label} led spending`,
      body: `${formatInr(topCategory.amount)} across ${topCategory.count} transaction${topCategory.count === 1 ? "" : "s"}, or ${Math.round(topCategory.share)}% of debits.`,
    });
  }

  if (monthlyActivity.length >= 2) {
    const latest = monthlyActivity[monthlyActivity.length - 1];
    const previous = monthlyActivity[monthlyActivity.length - 2];
    if (previous.totalSpent > 0) {
      const change = roundMoney(((latest.totalSpent - previous.totalSpent) / previous.totalSpent) * 100);
      observations.push({
        id: "monthly-change",
        tone: change > 10 ? "warning" : change < -10 ? "positive" : "neutral",
        title: `${latest.label} spending ${change >= 0 ? "rose" : "fell"}`,
        body: `${Math.abs(Math.round(change))}% versus ${previous.label}, based only on the dates represented in this file.`,
      });
    }
  }

  if (largestDebit) {
    observations.push({
      id: "largest-debit",
      tone: "neutral",
      title: "Largest debit to review",
      body: `${formatInr(largestDebit.amount)} at ${merchantLabel(largestDebit.sanitizedDescription)} on ${formatDate(largestDebit.date)}.`,
    });
  }

  if (recurringMerchants.length > 0) {
    const recurring = recurringMerchants[0];
    observations.push({
      id: "recurring-merchant",
      tone: "neutral",
      title: `${recurring.merchant} appeared repeatedly`,
      body: `${recurring.count} debits totalled ${formatInr(recurring.amount)} in this statement.`,
    });
  }

  return {
    transactionCount: transactions.length,
    debitCount: debits.length,
    creditCount: credits.length,
    totalSpent,
    totalIncome,
    netCashFlow,
    savingsRate,
    averageDebit: debits.length > 0 ? roundMoney(totalSpent / debits.length) : 0,
    periodLabel,
    dateRange: { start: startDate, end: endDate },
    categoryBreakdown,
    monthlyActivity,
    topCategory,
    topMerchant,
    largestDebit,
    recurringMerchants,
    observations,
  };
}
