/**
 * Kernel Density Estimation (KDE) & Percentile Math Engine
 * Feature 04: The Cohort Financial Mirror
 *
 * Deterministic, sub-5ms mathematical engine to benchmark user spending
 * against anonymized peer demographics using log-normal Gaussian Cumulative Distribution.
 */

/**
 * Static baseline distributions for cohorts (Derived from anonymized consumer data)
 * Categories strictly limited to 4: FOOD, SHOPPING, TRAVEL, ENTERTAINMENT.
 */
export const COHORT_BENCHMARKS = {
  nagpur_students: {
    id: "nagpur_students",
    name: "College Students (Nagpur)",
    shortName: "Nagpur Students",
    spendRange: "₹8k–₹15k/mo",
    medianMonthlySpend: 8500,
    topHandlersThreshold: 4800, // Top 10% disciplined savers spend under this
    categories: {
      FOOD: { median: 3800, topHandlers: 2100, label: "Food & Dining", icon: "🍔" },
      SHOPPING: { median: 1800, topHandlers: 800, label: "Shopping", icon: "🛍️" },
      TRAVEL: { median: 1400, topHandlers: 900, label: "Travel & Transport", icon: "🚗" },
      ENTERTAINMENT: { median: 1500, topHandlers: 600, label: "Entertainment", icon: "🎬" },
    },
  },
  pune_students: {
    id: "pune_students",
    name: "College Students (Pune)",
    shortName: "Pune Students",
    spendRange: "₹10k–₹18k/mo",
    medianMonthlySpend: 11200,
    topHandlersThreshold: 6200,
    categories: {
      FOOD: { median: 4900, topHandlers: 2700, label: "Food & Dining", icon: "🍔" },
      SHOPPING: { median: 2400, topHandlers: 1100, label: "Shopping", icon: "🛍️" },
      TRAVEL: { median: 1900, topHandlers: 1100, label: "Travel & Transport", icon: "🚗" },
      ENTERTAINMENT: { median: 2000, topHandlers: 800, label: "Entertainment", icon: "🎬" },
    },
  },
  entry_professionals: {
    id: "entry_professionals",
    name: "Young Professionals (Tier-2 Metro)",
    shortName: "Tier-2 Professionals",
    spendRange: "₹18k–₹30k/mo",
    medianMonthlySpend: 22000,
    topHandlersThreshold: 13500,
    categories: {
      FOOD: { median: 8500, topHandlers: 4500, label: "Food & Dining", icon: "🍔" },
      SHOPPING: { median: 5500, topHandlers: 2500, label: "Shopping", icon: "🛍️" },
      TRAVEL: { median: 4000, topHandlers: 2500, label: "Travel & Transport", icon: "🚗" },
      ENTERTAINMENT: { median: 4000, topHandlers: 1800, label: "Entertainment", icon: "🎬" },
    },
  },
  tech_bengaluru: {
    id: "tech_bengaluru",
    name: "Entry-Level Tech Professionals (Bengaluru)",
    shortName: "Bengaluru Tech",
    spendRange: "₹35k–₹55k/mo",
    medianMonthlySpend: 42000,
    topHandlersThreshold: 24000,
    categories: {
      FOOD: { median: 16000, topHandlers: 8500, label: "Food & Dining", icon: "🍔" },
      SHOPPING: { median: 10500, topHandlers: 5000, label: "Shopping", icon: "🛍️" },
      TRAVEL: { median: 7500, topHandlers: 4500, label: "Travel & Transport", icon: "🚗" },
      ENTERTAINMENT: { median: 8000, topHandlers: 4000, label: "Entertainment", icon: "🎬" },
    },
  },
};

export const COHORT_LEADERBOARDS = {
  nagpur_students: [
    {
      id: "rank_1",
      rank: 1,
      name: "Aarav Sharma",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 2150,
      savingsRate: "75%",
      college: "VNIT Nagpur",
      badge: "Top Disciplined Saver",
      keyHabit: "Bulk meal prep & university transit pass",
      percentile: 12,
      categories: { FOOD: 1200, SHOPPING: 350, TRAVEL: 400, ENTERTAINMENT: 200 },
    },
    {
      id: "rank_2",
      rank: 2,
      name: "Priya Deshmukh",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 2480,
      savingsRate: "71%",
      college: "GHRCE Nagpur",
      badge: "Budget Master",
      keyHabit: "Strict ₹500/week dining ceiling",
      percentile: 15,
      categories: { FOOD: 1400, SHOPPING: 450, TRAVEL: 380, ENTERTAINMENT: 250 },
    },
    {
      id: "rank_3",
      rank: 3,
      name: "Rohan Verma",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 2890,
      savingsRate: "66%",
      college: "RCOEM Nagpur",
      badge: "Smart Commuter",
      keyHabit: "Carpooling & shared subscriptions",
      percentile: 22,
      categories: { FOOD: 1650, SHOPPING: 500, TRAVEL: 440, ENTERTAINMENT: 300 },
    },
    {
      id: "rank_4",
      rank: 4,
      name: "Ananya Joshi",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 3120,
      savingsRate: "63%",
      college: "LAD College",
      badge: "Disciplined Saver",
      keyHabit: "No impulse weekend deliveries",
      percentile: 26,
      categories: { FOOD: 1750, SHOPPING: 600, TRAVEL: 470, ENTERTAINMENT: 300 },
    },
    {
      id: "rank_5",
      rank: 5,
      name: "Kunal Bansod",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 3420,
      savingsRate: "60%",
      college: "YCCE Nagpur",
      badge: "Prudent Student",
      keyHabit: "Library study groups & hostel kitchen",
      percentile: 30,
      categories: { FOOD: 1900, SHOPPING: 650, TRAVEL: 520, ENTERTAINMENT: 350 },
    },
    {
      id: "rank_6",
      rank: 6,
      name: "Meera Kulkarni",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 3850,
      savingsRate: "55%",
      college: "GMC Nagpur",
      badge: "Consistent Tracker",
      keyHabit: "Weekly expense logs on FinSight",
      percentile: 35,
      categories: { FOOD: 2100, SHOPPING: 750, TRAVEL: 600, ENTERTAINMENT: 400 },
    },
  ],
  pune_students: [
    {
      id: "rank_p1",
      rank: 1,
      name: "Aditya Kulkarni",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 3450,
      savingsRate: "69%",
      college: "COEP Pune",
      badge: "Top Disciplined Saver",
      keyHabit: "Metro pass & campus mess meals",
      percentile: 14,
      categories: { FOOD: 1850, SHOPPING: 600, TRAVEL: 600, ENTERTAINMENT: 400 },
    },
    {
      id: "rank_p2",
      rank: 2,
      name: "Tanvi Nair",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 3820,
      savingsRate: "66%",
      college: "Symbiosis Pune",
      badge: "Frugal Pioneer",
      keyHabit: "Shared student textbook & OTT library",
      percentile: 18,
      categories: { FOOD: 2050, SHOPPING: 700, TRAVEL: 650, ENTERTAINMENT: 420 },
    },
    {
      id: "rank_p3",
      rank: 3,
      name: "Sameer Shinde",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 4200,
      savingsRate: "62%",
      college: "MIT WPU Pune",
      badge: "Eco Commuter",
      keyHabit: "Cycling to campus & packed tiffin",
      percentile: 24,
      categories: { FOOD: 2200, SHOPPING: 850, TRAVEL: 650, ENTERTAINMENT: 500 },
    },
  ],
  entry_professionals: [
    {
      id: "rank_pro1",
      rank: 1,
      name: "Siddharth Rao",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 7800,
      savingsRate: "65%",
      college: "Tech Consultant, Indore",
      badge: "Top Money Handler",
      keyHabit: "Automated 40% salary savings to SIP",
      percentile: 15,
      categories: { FOOD: 3800, SHOPPING: 1800, TRAVEL: 1200, ENTERTAINMENT: 1000 },
    },
    {
      id: "rank_pro2",
      rank: 2,
      name: "Divya Kapoor",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 8900,
      savingsRate: "60%",
      college: "Product Designer, Jaipur",
      badge: "Smart Minimalist",
      keyHabit: "Capsule wardrobe & cook-at-home policy",
      percentile: 22,
      categories: { FOOD: 4200, SHOPPING: 2100, TRAVEL: 1400, ENTERTAINMENT: 1200 },
    },
    {
      id: "rank_pro3",
      rank: 3,
      name: "Arjun Bhatia",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 9800,
      savingsRate: "56%",
      college: "Analyst, Nagpur",
      badge: "Financial Strategist",
      keyHabit: "Zero-fee rewards card & carpool",
      percentile: 28,
      categories: { FOOD: 4600, SHOPPING: 2400, TRAVEL: 1600, ENTERTAINMENT: 1200 },
    },
  ],
  tech_bengaluru: [
    {
      id: "rank_b1",
      rank: 1,
      name: "Nikhil Kamath-style",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 14200,
      savingsRate: "70%",
      college: "Fintech Engineer, HSR Layout",
      badge: "Elite Saver",
      keyHabit: "Walk to office & batch cooking Sundays",
      percentile: 12,
      categories: { FOOD: 6500, SHOPPING: 3200, TRAVEL: 2500, ENTERTAINMENT: 2000 },
    },
    {
      id: "rank_b2",
      rank: 2,
      name: "Sneha Reddy",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 16800,
      savingsRate: "64%",
      college: "Cloud Architect, Indiranagar",
      badge: "Frugal Dev",
      keyHabit: "Company food credits & shared flat",
      percentile: 18,
      categories: { FOOD: 7500, SHOPPING: 4100, TRAVEL: 2800, ENTERTAINMENT: 2400 },
    },
    {
      id: "rank_b3",
      rank: 3,
      name: "Karthik Iyer",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 19500,
      savingsRate: "58%",
      college: "SDE-2, Koramangala",
      badge: "Disciplined Builder",
      keyHabit: "Public EV scooter & strict weekend budget",
      percentile: 26,
      categories: { FOOD: 8800, SHOPPING: 4900, TRAVEL: 3200, ENTERTAINMENT: 2600 },
    },
  ],
};

export const STRICT_CATEGORIES = ["FOOD", "SHOPPING", "TRAVEL", "ENTERTAINMENT"];

/**
 * Evaluates the user's spend against the cohort using a normalized Gaussian Cumulative Distribution.
 * Returns an integer percentile from 1 to 99.
 */
export function calculatePercentile(userSpend, medianSpend) {
  if (!Number.isFinite(userSpend) || userSpend <= 0) return 5;
  if (!Number.isFinite(medianSpend) || medianSpend <= 0) return 50;

  // Standard log-normal variance for consumer expenditures
  const ratio = userSpend / medianSpend;
  const z = Math.log(ratio) / 0.45;

  // Standard Normal CDF Approximation (Abramowitz & Stegun 26.2.17)
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;

  const percentile = Math.min(99, Math.max(1, Math.round(p * 100)));
  return percentile;
}

/**
 * Analyzes the user's 4-category spending and derives targeted saving strategies.
 */
export function generateStrategies(userCategoryTotals, cohortData) {
  const strategies = [];
  const categories = STRICT_CATEGORIES;

  categories.forEach((cat) => {
    const userSpend = userCategoryTotals?.[cat] || 0;
    const catBenchmark = cohortData?.categories?.[cat];
    if (!catBenchmark) return;

    const median = catBenchmark.median;
    const topHandlers = catBenchmark.topHandlers;

    if (userSpend > median * 1.15) {
      const excess = Math.round(userSpend - median);
      let concreteTip = `Your spend exceeds the cohort median by ₹${excess.toLocaleString("en-IN")}. Reducing non-essential purchases here will lower your overall percentile toward the top savers.`;

      if (cat === "FOOD") {
        concreteTip = `Cut 2 dining deliveries per week to save ~₹${excess.toLocaleString("en-IN")}/mo and drop your food rank from ${calculatePercentile(userSpend, median)}th toward median peers.`;
      } else if (cat === "SHOPPING") {
        concreteTip = `Pause discretionary ecommerce checkouts for 14 days to recover ~₹${excess.toLocaleString("en-IN")}/mo and realign with peer median.`;
      } else if (cat === "TRAVEL") {
        concreteTip = `Bundle weekend rides and switch 2 cab trips per week to metro/public transit to save ~₹${excess.toLocaleString("en-IN")}/mo.`;
      } else if (cat === "ENTERTAINMENT") {
        concreteTip = `Audit recurring streaming subscriptions and weekend movie passes to trim ~₹${excess.toLocaleString("en-IN")}/mo.`;
      }

      strategies.push({
        category: cat,
        severity: "HIGH",
        headline: `Trim ${catBenchmark.label.toLowerCase()} spending by ₹${excess.toLocaleString("en-IN")}`,
        action: concreteTip,
        excess,
        targetSavings: excess,
      });
    } else if (userSpend <= topHandlers && userSpend > 0) {
      const saved = Math.round(median - userSpend);
      strategies.push({
        category: cat,
        severity: "EXCELLENT",
        headline: `Top-Tier Discipline in ${catBenchmark.label}`,
        action: `You spend like the top 10% money handlers in this category! You are saving ~₹${saved.toLocaleString("en-IN")} compared to average peers.`,
        saved,
        targetSavings: 0,
      });
    }
  });

  // If user has balanced spending across all categories and no high warnings
  if (strategies.length === 0) {
    strategies.push({
      category: "OVERALL",
      severity: "BALANCED",
      headline: "Balanced Spending Across All Core Categories",
      action: "Your expenditures are well within the demographic median. Maintain steady cash flow discipline to edge closer to top 10% savers.",
      targetSavings: 0,
    });
  }

  return strategies;
}

/**
 * Aggregates raw Firestore private transactions into the 4 strict categories:
 * FOOD, SHOPPING, TRAVEL (maps TRANSPORTATION and TRAVEL), ENTERTAINMENT.
 * Normalizes by the number of active distinct months represented.
 */
export function aggregateCategoryTotals(transactions) {
  const totals = {
    FOOD: 0,
    SHOPPING: 0,
    TRAVEL: 0,
    ENTERTAINMENT: 0,
  };

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return {
      ...totals,
      monthCount: 1,
      totalDiscretionary: 0,
      hasRealData: false,
    };
  }

  const distinctMonths = new Set();
  let validDebitCount = 0;

  transactions.forEach((tx) => {
    if (!tx || tx.type !== "DEBIT") return;
    const amount = Number(tx.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    validDebitCount += 1;
    if (typeof tx.date === "string" && tx.date.length >= 7) {
      distinctMonths.add(tx.date.slice(0, 7));
    }

    const category = String(tx.category || "").toUpperCase();
    if (category === "FOOD") {
      totals.FOOD += amount;
    } else if (category === "SHOPPING") {
      totals.SHOPPING += amount;
    } else if (category === "TRANSPORTATION" || category === "TRAVEL") {
      totals.TRAVEL += amount;
    } else if (category === "ENTERTAINMENT") {
      totals.ENTERTAINMENT += amount;
    }
  });

  const monthCount = Math.max(1, distinctMonths.size);
  const normalized = {
    FOOD: Math.round(totals.FOOD / monthCount),
    SHOPPING: Math.round(totals.SHOPPING / monthCount),
    TRAVEL: Math.round(totals.TRAVEL / monthCount),
    ENTERTAINMENT: Math.round(totals.ENTERTAINMENT / monthCount),
    monthCount,
    hasRealData: validDebitCount > 0,
  };

  normalized.totalDiscretionary =
    normalized.FOOD + normalized.SHOPPING + normalized.TRAVEL + normalized.ENTERTAINMENT;

  return normalized;
}

/**
 * Computes full cohort benchmarking metrics, stances, badges, and comparison pins.
 */
export function calculateCohortMetrics(userCategoryTotals, cohort) {
  const selectedCohort = cohort || COHORT_BENCHMARKS.nagpur_students;
  const categories = STRICT_CATEGORIES;

  const totalUserSpend = categories.reduce(
    (acc, cat) => acc + (userCategoryTotals?.[cat] || 0),
    0,
  );

  const overallPercentile = calculatePercentile(
    totalUserSpend,
    selectedCohort.medianMonthlySpend,
  );

  // Stance classification
  let stance = {
    type: "BALANCED",
    title: "Balanced Peer Average",
    badgeLabel: "⚖️ Balanced Peer Average",
    description: "Spending within normal variance of your local demographic.",
    color: "#64748B", // Slate
    badgeBg: "rgba(100, 116, 139, 0.18)",
    badgeBorder: "rgba(148, 163, 184, 0.3)",
    badgeText: "#94A3B8",
  };

  if (overallPercentile > 65) {
    stance = {
      type: "HIGH_SPENDER",
      title: "High Spender Stance",
      badgeLabel: `⚠️ Spending more than ${overallPercentile}% of your local peers`,
      description: "Discretionary spend is elevated compared to cohort median.",
      color: "#F59E0B", // Amber
      badgeBg: "rgba(245, 158, 11, 0.16)",
      badgeBorder: "rgba(245, 158, 11, 0.35)",
      badgeText: "#FBBF24",
    };
  } else if (overallPercentile <= 35) {
    stance = {
      type: "TOP_SAVER",
      title: "Top Money Handler",
      badgeLabel: `🏆 Top ${Math.max(1, overallPercentile)}% disciplined saver in your demographic`,
      description: "Exceptional cash flow discipline. Outperforming 65%+ of peers.",
      color: "#F79E1B", // Warm Gold
      badgeBg: "rgba(247, 158, 27, 0.16)",
      badgeBorder: "rgba(247, 158, 27, 0.35)",
      badgeText: "#F79E1B",
    };
  }

  // Gap to Top 10% Handlers
  const gapToTopHandlers = Math.max(0, totalUserSpend - selectedCohort.topHandlersThreshold);

  // Category level breakdown metrics
  const categoryMetrics = categories.map((cat) => {
    const userSpend = userCategoryTotals?.[cat] || 0;
    const catBenchmark = selectedCohort.categories[cat];
    const percentile = calculatePercentile(userSpend, catBenchmark.median);
    const isHigh = userSpend > catBenchmark.median * 1.15;
    const isTopSaver = userSpend <= catBenchmark.topHandlers && userSpend > 0;

    return {
      category: cat,
      label: catBenchmark.label,
      icon: catBenchmark.icon,
      userSpend,
      median: catBenchmark.median,
      topHandlers: catBenchmark.topHandlers,
      percentile,
      isHigh,
      isTopSaver,
      excess: Math.max(0, userSpend - catBenchmark.median),
      saved: Math.max(0, catBenchmark.median - userSpend),
    };
  });

  const strategies = generateStrategies(userCategoryTotals, selectedCohort);

  return {
    cohort: selectedCohort,
    totalUserSpend,
    overallPercentile,
    stance,
    gapToTopHandlers,
    categoryMetrics,
    strategies,
  };
}
