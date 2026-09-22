/**
 * Dummy Users & Peer Comparison Data
 * FinSight-AI Demographic Ranking & KDE Engine
 *
 * Provides realistic, diverse dummy peer profiles across cohorts,
 * dynamic leaderboard calculation integrating the real user,
 * and portable Compare Link encode/decode utilities.
 */

export const EXPANDED_COHORT_LEADERBOARDS = {
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
    {
      id: "rank_p4",
      rank: 4,
      name: "Rhea Sen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 4600,
      savingsRate: "59%",
      college: "Fergusson Pune",
      badge: "Bookworm Saver",
      keyHabit: "Used book trading & low cafe spend",
      percentile: 29,
      categories: { FOOD: 2400, SHOPPING: 950, TRAVEL: 750, ENTERTAINMENT: 500 },
    },
    {
      id: "rank_p5",
      rank: 5,
      name: "Gaurav Patil",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 4950,
      savingsRate: "55%",
      college: "PICT Pune",
      badge: "Tech Commuter",
      keyHabit: "Shared flat rentals & weekly grocery run",
      percentile: 34,
      categories: { FOOD: 2600, SHOPPING: 1000, TRAVEL: 800, ENTERTAINMENT: 550 },
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
    {
      id: "rank_pro4",
      rank: 4,
      name: "Pooja Hegde",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 11200,
      savingsRate: "52%",
      college: "Architect, Bhopal",
      badge: "Disciplined Professional",
      keyHabit: "Batch food prep and monthly SIP automation",
      percentile: 33,
      categories: { FOOD: 5200, SHOPPING: 2800, TRAVEL: 1800, ENTERTAINMENT: 1400 },
    },
    {
      id: "rank_pro5",
      rank: 5,
      name: "Naveen Saxena",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 12400,
      savingsRate: "48%",
      college: "Operations Manager, Lucknow",
      badge: "Strategic Spender",
      keyHabit: "Strict quarterly electronics buying window",
      percentile: 38,
      categories: { FOOD: 5600, SHOPPING: 3200, TRAVEL: 2000, ENTERTAINMENT: 1600 },
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
    {
      id: "rank_b4",
      rank: 4,
      name: "Meghna Rao",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 21800,
      savingsRate: "53%",
      college: "Backend Engineer, Bellandur",
      badge: "Balanced Coder",
      keyHabit: "Strict ₹2,000 weekly cafe & delivery budget",
      percentile: 32,
      categories: { FOOD: 9800, SHOPPING: 5600, TRAVEL: 3600, ENTERTAINMENT: 2800 },
    },
    {
      id: "rank_b5",
      rank: 5,
      name: "Varun Nair",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      monthlySpend: 23500,
      savingsRate: "50%",
      college: "Data Scientist, Whitefield",
      badge: "Smart Investor",
      keyHabit: "Carpooling with team & automated mutual funds",
      percentile: 37,
      categories: { FOOD: 10500, SHOPPING: 6200, TRAVEL: 3800, ENTERTAINMENT: 3000 },
    },
  ],
};

// Curated sample peer invites for quick testing when a friend link is not yet copied
export const SAMPLE_FRIEND_INVITES = [
  {
    id: "friend_riya",
    name: "Riya Patel",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
    college: "Nagpur • Friend",
    monthlySpend: 4800,
    savingsRate: "52%",
    keyHabit: "Cooks weekdays, 1 weekend meal out",
    categories: { FOOD: 2400, SHOPPING: 1100, TRAVEL: 800, ENTERTAINMENT: 500 },
  },
  {
    id: "friend_dev",
    name: "Dev Sen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    college: "Pune • Colleague",
    monthlySpend: 5600,
    savingsRate: "46%",
    keyHabit: "Budgeted online shopping & metro passes",
    categories: { FOOD: 2800, SHOPPING: 1400, TRAVEL: 900, ENTERTAINMENT: 500 },
  },
];

/**
 * Encodes a user's spending profile into a shareable FinSight Compare Link and text.
 */
export function generateCompareLink(userProfile, userCategoryTotals, savingsRate = "55%") {
  const name = encodeURIComponent(userProfile?.name || "FinSight User");
  const f = Math.round(userCategoryTotals?.FOOD || 0);
  const s = Math.round(userCategoryTotals?.SHOPPING || 0);
  const t = Math.round(userCategoryTotals?.TRAVEL || 0);
  const e = Math.round(userCategoryTotals?.ENTERTAINMENT || 0);
  const total = f + s + t + e;
  const sav = encodeURIComponent(savingsRate);

  const query = `name=${name}&spend=${total}&f=${f}&s=${s}&t=${t}&e=${e}&sav=${sav}`;
  const link = `https://finsight.ai/compare?${query}`;
  const code = `FS-${Math.abs(total)}-${name.slice(0, 3).toUpperCase()}`;

  const shareText = `📊 Compare spending with ${decodeURIComponent(name)} on FinSight-AI!
Monthly Spend: ₹${total.toLocaleString("en-IN")} • Savings Rate: ${decodeURIComponent(sav)}
Tap below to compare your 4-category budget head-to-head:
${link}`;

  return {
    link,
    code,
    shareText,
    total,
  };
}

/**
 * Parses a FinSight compare link or code into a structured peer object.
 */
export function parseCompareLink(linkOrCode) {
  if (!linkOrCode || typeof linkOrCode !== "string") return null;

  try {
    if (linkOrCode.includes("?")) {
      const queryString = linkOrCode.split("?")[1];
      const params = new URLSearchParams(queryString);
      const name = params.get("name") || "FinSight Friend";
      const spend = Number(params.get("spend")) || 0;
      const f = Number(params.get("f")) || Math.round(spend * 0.45);
      const s = Number(params.get("s")) || Math.round(spend * 0.25);
      const t = Number(params.get("t")) || Math.round(spend * 0.15);
      const e = Number(params.get("e")) || Math.round(spend * 0.15);
      const sav = params.get("sav") || "50%";

      return {
        id: `friend_${Date.now()}`,
        name: decodeURIComponent(name),
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
        college: "FinSight Friend • Shared Link",
        monthlySpend: spend || f + s + t + e,
        savingsRate: decodeURIComponent(sav),
        keyHabit: "Direct compare link invited friend",
        categories: { FOOD: f, SHOPPING: s, TRAVEL: t, ENTERTAINMENT: e },
      };
    }
  } catch {
    // URL parsing fallback
  }

  // Fallback to sample friend invite if code matches or unparsed
  return SAMPLE_FRIEND_INVITES[0];
}

/**
 * Dynamically ranks the logged-in user inside the cohort peer roster:
 * - Computes the user's rightful rank based on monthly spend.
 * - If the user qualifies for the Top 5, injects the user into the Top 5 list.
 * - Caps the returned leaderboard strictly to the Top 5 rankers.
 * - Returns user placement details (rank, isTop5, gap to #5).
 */
export function computeDynamicLeaderboard(activeCohort, cohortLeaderboard, realUserData) {
  const basePeers = Array.isArray(cohortLeaderboard) ? [...cohortLeaderboard] : [];
  const userSpend = Math.round(Number(realUserData?.totalUserSpend) || 0);

  // Construct user entry
  const userPeerEntry = {
    id: "current_user_entry",
    isCurrentUser: true,
    name: realUserData?.name || "You",
    avatar: realUserData?.avatar || null,
    monthlySpend: userSpend,
    savingsRate: realUserData?.savingsRate || "60%",
    college: realUserData?.location || activeCohort?.name || "Nagpur, MH",
    badge: "Verified Live User",
    keyHabit: realUserData?.keyHabit || "Active FinSight Transaction Tracker",
    categories: realUserData?.categories || { FOOD: 0, SHOPPING: 0, TRAVEL: 0, ENTERTAINMENT: 0 },
  };

  // Filter out any previous user entry to avoid duplicates
  const cleanedPeers = basePeers.filter((p) => p.id !== "current_user_entry");

  // Merge user into peers pool and sort ascending by spend (lower spend = better financial discipline/saver)
  const combined = [...cleanedPeers, userPeerEntry].sort((a, b) => a.monthlySpend - b.monthlySpend);

  // Assign 1-indexed ranks
  const rankedAll = combined.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  // Locate the user's earned rank
  const userRankIndex = rankedAll.findIndex((item) => item.isCurrentUser);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : 6;
  const isTop5 = userRank <= 5;

  // Strict Top 5 rankers
  const top5Leaderboard = rankedAll.slice(0, 5);

  // Gap to reach #5 if outside Top 5
  const fifthPlace = top5Leaderboard[4] || top5Leaderboard[top5Leaderboard.length - 1];
  const gapToTop5 = !isTop5 && fifthPlace ? Math.max(0, userSpend - fifthPlace.monthlySpend) : 0;

  return {
    top5Leaderboard,
    userRank,
    isTop5,
    gapToTop5,
    fifthPlace,
  };
}

/**
 * Calculates a head-to-head comparison between a user's category spend and a peer's spend.
 */
export function calculateComparison(userCategoryTotals, peer) {
  const categories = ["FOOD", "SHOPPING", "TRAVEL", "ENTERTAINMENT"];
  const userTotal = categories.reduce((acc, cat) => acc + (userCategoryTotals?.[cat] || 0), 0);
  const peerTotal = peer.monthlySpend || categories.reduce((acc, cat) => acc + (peer.categories?.[cat] || 0), 0);

  const spendDelta = userTotal - peerTotal; // positive means user spends more than peer
  const percentDelta = peerTotal > 0 ? Math.round((spendDelta / peerTotal) * 100) : 0;

  const categoryDeltas = categories.map((cat) => {
    const userCatSpend = userCategoryTotals?.[cat] || 0;
    const peerCatSpend = peer.categories?.[cat] || Math.round(peerTotal / 4);
    const delta = userCatSpend - peerCatSpend;
    const userWins = delta <= 0; // user spends less or equal

    return {
      category: cat,
      userSpend: userCatSpend,
      peerSpend: peerCatSpend,
      delta,
      userWins,
    };
  });

  const categoriesWhereUserSaves = categoryDeltas.filter((c) => c.userWins).length;

  let keyInsight = "";
  if (spendDelta < -500) {
    keyInsight = `Impressive! You spend ₹${Math.abs(spendDelta).toLocaleString("en-IN")} less per month than ${peer.name}. You hold an edge in ${categoriesWhereUserSaves} of 4 discretionary categories.`;
  } else if (Math.abs(spendDelta) <= 500) {
    keyInsight = `Neck-and-neck! Your discretionary budget closely mirrors ${peer.name}'s spending footprint with just a ₹${Math.abs(spendDelta).toLocaleString("en-IN")} difference.`;
  } else {
    keyInsight = `${peer.name} spends ₹${spendDelta.toLocaleString("en-IN")} less per month. Adopting their habit ("${peer.keyHabit}") could boost your monthly savings rate!`;
  }

  return {
    userTotal,
    peerTotal,
    spendDelta,
    percentDelta,
    categoryDeltas,
    categoriesWhereUserSaves,
    keyInsight,
  };
}
