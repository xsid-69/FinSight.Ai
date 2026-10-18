import {
  merchantBrandDisplayName,
  resolveMerchantBrandKey,
} from "./merchantBrandRegistry";

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

const KNOWN_MERCHANT_EXPANSIONS = Object.freeze({
  "bablu ki": "Bablu Kirana",
  "hardcast": "McDonald's (Hardcastle)",
  "one97 co": "One97 (Paytm)",
  "jk egg c": "JK Egg Center",
  "super fr": "Super Fresh",
  "oam indu": "Oam Industries",
  "nagpur m": "Nagpur Metro Rail",
  "zepto ma": "Zepto",
  "irctc ti": "IRCTC Tickets",
  "confirm": "ConfirmTkt",
  "confirmtkt": "ConfirmTkt",
  "ebznagpur": "EBZ Nagpur",
  "maharash": "Maharashtra State",
  "new yada": "New Yadav",
  "manish t": "Manish Traders",
  "fitness": "Fitness Center",
  "gangour": "Gangour Sweets",
  "shri kru": "Shri Krupa",
  "principa": "Principal",
  "princip": "Principal",
  "edtech p": "EdTech",
  "tea corner": "Tea Corner",
  "jay bhol": "Jay Bhole",
  "m a saha": "M A Sahani",
  "hirurkar": "Hirurkar",
  "lalit ja": "Lalit J.",
  "mr anil": "Mr. Anil",
  "mr nares": "Mr. Naresh",
  "mr abhis": "Mr. Abhishek",
  "mrs madh": "Mrs. Madhu",
  "vinod ku": "Vinod Kumar",
  "vimal pr": "Vimal Prasad",
  "arun mah": "Arun Mahajan",
  "seema gu": "Seema Gupta",
  "mukesh m": "Mukesh M.",
  "sanket m": "Sanket M.",
  "chetan a": "Chetan A.",
  "pratik p": "Pratik P.",
  "krish vi": "Krish V.",
  "krishvil": "Krishvil",
  "prashikr": "Prashik R.",
  "prashik": "Prashik",
  "amit shi": "Amit S.",
  "kunal mu": "Kunal M.",
  "ganesh s": "Ganesh S.",
  "master g": "Master G.",
  "master a": "Master A.",
  "sheikh r": "Sheikh R.",
  "ravish r": "Ravish R.",
  "jyoti an": "Jyoti A.",
  "pranay g": "Pranay G.",
  "joel ran": "Joel Ranvir",
  "om raju": "Om Raju",
  "shamuvel": "Shamuvel",
  "mohammad": "Mohammad",
  "kalpana": "Kalpana",
  "shripad": "Shripad",
  "dhillon": "Dhillon",
  "sandeep": "Sandeep",
  "manisha": "Manisha",
});

function toProperMerchantCase(str) {
  if (!str) return "Transaction";
  const acronyms = new Set([
    "NPCI",
    "BHIM",
    "ATM",
    "UPI",
    "EBZ",
    "JK",
    "AWS",
    "IRCTC",
    "PVR",
    "DMART",
    "AI",
    "SMS",
  ]);
  return str
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) return upper;
      if (/^(?:mr|dr)$/i.test(word)) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() + ".";
      if (/^mrs$/i.test(word)) return "Mrs.";
      if (word.length === 1 && /[a-z]/i.test(word)) return word.toUpperCase() + ".";
      if (/^[A-Z]\.$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function merchantLabel(description) {
  const normalized = String(description || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Transaction";

  // Non-UPI special banking cases
  if (/PFMS/i.test(normalized) && /DBT/i.test(normalized)) {
    return "PFMS Govt DBT";
  }
  if (/PMSBY/i.test(normalized)) {
    return "PMSBY Insurance Renewal";
  }
  if (/INTERES.*CREDIT/i.test(normalized)) {
    return "Interest Credit";
  }
  if (/ATM\s+(?:WDL|CASH)/i.test(normalized)) {
    if (/NAGPUR/i.test(normalized)) return "ATM Cash (Nagpur)";
    return "ATM Cash Withdrawal";
  }
  if (/TATASTEELDIV/i.test(normalized)) {
    return "Tata Steel Dividend";
  }

  let str = normalized;

  // 1. Strip initial bank action / channel prefixes:
  // e.g. "WDL TFR", "DEP TFR", "WDL", "DEP", "CWDR", "TFR", "TRF", "TRANSFER",
  // "TRANSACTION MADE VIA", "TRANSACTION MADE", "TXN MADE VIA", "PAYMENT VIA", etc.
  str = str.replace(
    /^(?:(?:WDL|DEP|CWDR|TFR|TRF)\s+(?:TFR|TRF|TRANSFER)|WDL|DEP|CWDR|TFR|TRF|TRANSFER|WITHDRAWAL|DEPOSIT|TRANSACTION\s+MADE\s+VIA|TRANSACTION\s+MADE|TXN\s+MADE\s+VIA|PAYMENT\s+VIA|PAID\s+VIA)[\s/.:_-]*/i,
    "",
  );

  // 2. Strip channel indicator: UPI, POS, NEFT, IMPS, RTGS, ECS, ACH, NACH, CMS, INB, MB, ATM, CARD, ECOM, TPAP
  str = str.replace(
    /^(?:UPI|POS|NEFT|IMPS|RTGS|ECS|ACH|NACH|CMS|INB|MB|ATM|CARD|ECOM|TPAP)[\s/.:_-]+/i,
    "",
  );

  // 3. Strip DR/CR indicator: "DR/", "CR/", "DR-", "CR-"
  str = str.replace(/^(?:DR|CR)[\s/.:_-]+/i, "");

  // 4. Handle slash-separated bank UPI narratives:
  // e.g. "XXXX/Utkarsh /UTKS/s upercard /Paid XXXX AT 00306 AKOLA"
  // or "645726216708/Utkarsh /UTKS/supercard@/Paid..."
  // or "123/ZOMATO, ONLINE"
  let handleSegment = "";
  if (str.includes("/")) {
    const parts = str.split("/").map((p) => p.trim()).filter(Boolean);
    if (
      parts.length >= 3 &&
      /^(?:REF|TXN)$/i.test(parts[0]) &&
      (/^(?:[0-9xX*.-]{4,})$/i.test(parts[1]) || !isNaN(Number(parts[1])))
    ) {
      str = parts[2];
      if (parts.length >= 4) {
        handleSegment = parts[3];
      }
    } else if (
      parts.length >= 2 &&
      (/^(?:[0-9xX*.-]{4,}|REF.*|TXN.*)$/i.test(parts[0]) || !isNaN(Number(parts[0])))
    ) {
      // parts[1] is the merchant / recipient!
      str = parts[1];
      if (parts.length >= 4) {
        handleSegment = parts[3];
      }
    } else if (parts.length >= 1) {
      if (/^(?:DR|CR)$/i.test(parts[0]) && parts.length >= 2) {
        if (
          parts.length >= 3 &&
          (/^(?:[0-9xX*.-]{4,}|REF.*|TXN.*)$/i.test(parts[1]) || !isNaN(Number(parts[1])))
        ) {
          str = parts[2];
          if (parts.length >= 5) {
            handleSegment = parts[4];
          }
        } else {
          str = parts[1];
          if (parts.length >= 4) {
            handleSegment = parts[3];
          }
        }
      } else {
        str = parts[0];
      }
    }
  }

  // Handle Credit Reversal / Refund indicator
  if (/^C\s*R(?:\s+[0-9xX*.-]+.*)?$/i.test(str)) {
    return "Credit Reversal";
  }
  if (/^D\s*R(?:\s+[0-9xX*.-]+.*)?$/i.test(str)) {
    return "Debit Adjustment";
  }

  // 5. Check handleSegment clues for high-confidence branding
  const hLower = handleSegment.toLowerCase();
  if (hLower.includes("metrorail")) return "Nagpur Metro Rail";
  if (hLower.includes("amznplmacd")) return "McDonald's (Hardcastle)";
  if (hLower.includes("zeptonow")) return "Zepto";
  if (hLower.includes("bhimcashba")) return "NPCI BHIM Cashback";
  if (hLower.includes("ranvirpata")) return "Joel Ranvir";
  if (hLower.includes("thuteprana")) return "Pranay Thute";
  if (hLower.includes("oamindustr")) return "Oam Industries";
  if (hLower.includes("confirmtkt") || hLower.includes("confirmtic")) return "ConfirmTkt";
  if (hLower.includes("irctc")) return "IRCTC Tickets";

  // 6. Handle hyphen or dash separated narratives:
  // e.g. "WDL-UPI-12345-ZOMATO" or "UPI-ZOMATO-12345"
  if (str.includes("-") && !/\s/.test(str)) {
    const parts = str.split("-").map((p) => p.trim()).filter(Boolean);
    const candidate = parts.find(
      (p) => !/^(?:[0-9xX*.-]{4,}|UPI|WDL|DEP|DR|CR|REF|TXN|[a-z]{4}0[a-z0-9]{6})$/i.test(p),
    );
    if (candidate) {
      str = candidate;
    }
  }

  // 7. Clean VPA handles and masked handle placeholders
  str = str.replace(/@(?:upi|ybl|ibl|paytm|ok[a-z0-9]+|[a-z0-9.-]+)\b/gi, "");
  str = str.replace(/@/g, "");
  str = str.replace(/\bPRIVATE_HANDLE\b/gi, "");

  // 8. Strip trailing bank narrative junk:
  str = str.replace(/\s*(?:AT\s+\d+.*|\/Paid.*|\/UPI.*|\/Paym.*|REF\s+.*|UTR\s+.*|RRN\s+.*)$/i, "");
  str = str.replace(/^(?:Paid|UPI|Paym|Transfer|Payment)\s+(?:to\s+)?/i, "");
  str = str.replace(/\s*(?:Paid|UPI|Paym)\s+[0-9xX*.-]+.*$/i, "");
  str = str.replace(/[\s/.:_-]+$/, "").replace(/^[\s/.:_-]+/, "").trim();

  // If after cleaning it is empty or just generic keywords, fallback gracefully
  if (!str || /^(?:XXXX|WDL|DEP|TFR|TRF|UPI|DR|CR|NA|NULL)$/i.test(str)) {
    return (
      toProperMerchantCase(
        normalized
          .replace(/^(?:(?:WDL|DEP)\s+TFR|WDL|DEP|TFR|TRF|UPI)[\s/.:_-]*/i, "")
          .trim()
      ) || "Transaction"
    );
  }

  // 9. Check known expansions dictionary
  const key = str.toLowerCase().trim();
  if (KNOWN_MERCHANT_EXPANSIONS[key]) {
    return KNOWN_MERCHANT_EXPANSIONS[key];
  }

  // Smushed initial: PRASHIKR -> Prashik R.
  if (/^PRASHIKR$/i.test(str)) {
    return "Prashik R.";
  }

  // Single trailing initial with space: SANKET M -> Sanket M.
  const initialMatch = str.match(/^(.+)\s+([A-Z])$/i);
  if (initialMatch) {
    return (
      toProperMerchantCase(initialMatch[1]) +
      " " +
      initialMatch[2].toUpperCase() +
      "."
    );
  }

  return toProperMerchantCase(str);
}

export function transactionMerchantLabel(transaction) {
  const rawDesc =
    transaction?.sanitizedDescription || transaction?.merchant || "";
  const cleaned = merchantLabel(rawDesc);

  const brandKey =
    transaction?.merchantKey ||
    resolveMerchantBrandKey(cleaned) ||
    resolveMerchantBrandKey(rawDesc);

  if (brandKey) {
    const brandName = merchantBrandDisplayName(brandKey);
    if (brandName) return brandName;
  }

  return cleaned;
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

    const merchant = transactionMerchantLabel(transaction);
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
      body: `${formatInr(largestDebit.amount)} at ${transactionMerchantLabel(largestDebit)} on ${formatDate(largestDebit.date)}.`,
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
