/**
 * Cohort Financial Mirror & Peer Ranking Service
 * Real-time Firestore synchronization of real user cohort profiles,
 * live multi-user leaderboard calculations, and head-to-head peer comparisons.
 *
 * NO DUMMY USERS: Operates strictly on authenticated Firebase users.
 */

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  COHORT_BENCHMARKS,
  aggregateCategoryTotals,
  calculateCohortMetrics,
} from "../analytics/kdeEngine";

/**
 * Derives a human-readable key financial habit based on category spend distribution.
 */
export function deriveKeyHabit(categories, monthlySpend = 0) {
  const f = Number(categories?.FOOD) || 0;
  const s = Number(categories?.SHOPPING) || 0;
  const t = Number(categories?.TRAVEL) || 0;
  const e = Number(categories?.ENTERTAINMENT) || 0;
  const total = f + s + t + e || monthlySpend;

  if (total <= 0) {
    return "New account starting fresh";
  }

  if (f > 0 && f / total > 0.5) {
    return "High dining out ratio; tracking meals";
  }
  if (s > 0 && s / total > 0.4) {
    return "Active retail & ecommerce budgeter";
  }
  if (t > 0 && t / total > 0.35) {
    return "Frequent commute & transit saver";
  }
  if (e > 0 && e / total > 0.3) {
    return "Weekend events & entertainment budgeter";
  }
  if (f < 2000 && total < 5000) {
    return "Hostel mess & home dining discipline";
  }
  return "Balanced 4-category budget tracker";
}

/**
 * Publishes the logged-in user's live spending metrics and demographic profile
 * to the shared Firestore cohort_profiles collection for real-time ranking.
 */
export async function publishUserCohortProfile(user, { userCategoryTotals, metrics, demographics, profile }) {
  if (!user?.uid || !db) return null;

  try {
    const userId = user.uid;
    const displayName =
      profile?.fullName ||
      user.displayName ||
      user.fullName ||
      (user.email ? user.email.split("@")[0] : "FinSight User");

    const cohortId =
      demographics?.cohortKey ||
      (demographics?.cityId === "pune" ? "pune_students" : "nagpur_students");
    const city = demographics?.city || demographics?.cityName || "Nagpur";
    const college =
      demographics?.college ||
      demographics?.roleLabel ||
      demographics?.role ||
      `${city}, MH`;

    const monthlySpend = Math.round(Number(userCategoryTotals?.totalDiscretionary) || 0);
    const hasRealData = Boolean(
      userCategoryTotals?.hasRealData && monthlySpend > 0,
    );

    const categories = {
      FOOD: Math.round(Number(userCategoryTotals?.FOOD) || 0),
      SHOPPING: Math.round(Number(userCategoryTotals?.SHOPPING) || 0),
      TRAVEL: Math.round(Number(userCategoryTotals?.TRAVEL) || 0),
      ENTERTAINMENT: Math.round(Number(userCategoryTotals?.ENTERTAINMENT) || 0),
    };

    const savingsRate =
      metrics?.stance?.type === "TOP_SAVER"
        ? "72%"
        : metrics?.stance?.type === "BALANCED"
          ? "54%"
          : "28%";

    const badge =
      metrics?.stance?.type === "TOP_SAVER"
        ? "Top Disciplined Saver"
        : metrics?.stance?.type === "BALANCED"
          ? "Budget Master"
          : monthlySpend > 0
            ? "Active Spender"
            : "Starting Fresh";

    const keyHabit = deriveKeyHabit(categories, monthlySpend);

    const profilePayload = {
      userId,
      id: userId,
      name: displayName,
      avatar: user.photoURL || null,
      city,
      cohortId,
      college,
      monthlySpend,
      categories,
      savingsRate,
      percentile: metrics?.overallPercentile || 0,
      badge,
      keyHabit,
      hasRealTransactions: hasRealData,
      updatedAt: serverTimestamp(),
      lastActive: new Date().toISOString(),
    };

    // 1. Sync to public cohort_profiles collection
    const cohortRef = doc(db, "cohort_profiles", userId);
    await setDoc(cohortRef, profilePayload, { merge: true });

    // 2. Sync demographic/spend snapshot to users collection
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        cohortId,
        city,
        monthlySpend,
        categories,
        savingsRate,
        percentile: metrics?.overallPercentile || 0,
        hasRealTransactions: hasRealData,
        lastActive: new Date().toISOString(),
      },
      { merge: true },
    );

    return profilePayload;
  } catch (err) {
    // Non-blocking in offline or read-only modes
    console.warn("[cohortService] publishUserCohortProfile error:", err);
    return null;
  }
}

/**
 * Aggregates transactions and syncs user's live spending metrics to cohort profiles.
 */
export async function syncUserTransactionsToCohort(user, transactions, savedDemographics, profile) {
  if (!user?.uid || !Array.isArray(transactions)) return null;

  try {
    const agg = aggregateCategoryTotals(transactions);
    const cohortId =
      savedDemographics?.cohortKey ||
      (savedDemographics?.cityId === "pune" ? "pune_students" : "nagpur_students");
    const activeCohort = COHORT_BENCHMARKS[cohortId] || COHORT_BENCHMARKS.nagpur_students;
    const metrics = calculateCohortMetrics(agg, activeCohort);

    return await publishUserCohortProfile(user, {
      userCategoryTotals: agg,
      metrics,
      demographics: savedDemographics || {
        cohortKey: cohortId,
        city: activeCohort.name,
        college: `${activeCohort.name}, MH`,
      },
      profile,
    });
  } catch (err) {
    console.warn("[cohortService] syncUserTransactionsToCohort error:", err);
    return null;
  }
}

/**
 * Saves or updates user demographics directly in Firestore.
 */
export async function syncUserProfileDemographics(userId, demographics) {
  if (!userId || !db || !demographics) return;

  try {
    const cohortId =
      demographics.cohortKey ||
      (demographics.cityId === "pune" ? "pune_students" : "nagpur_students");
    const city = demographics.city || demographics.cityName || "Nagpur";

    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        city,
        cohortId,
        demographics,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    const cohortRef = doc(db, "cohort_profiles", userId);
    await setDoc(
      cohortRef,
      {
        city,
        cohortId,
        college: demographics.role || `${city}, MH`,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn("[cohortService] syncUserProfileDemographics error:", err);
  }
}

/**
 * Ranks real peers using the live financial mirror algorithm:
 * - Active users with real spend are sorted ascending (lower spend = higher rank / disciplined saver).
 * - Starting from scratch users (0 spend) are placed after active savers.
 * - Current user is integrated with isCurrentUser: true.
 * - Strictly outputs real users.
 */
export function computeRealPeerLeaderboard(rawPeers, currentUserId, fallbackUserData) {
  const map = new Map();

  // Populate from rawPeers (only valid users with unique IDs)
  if (Array.isArray(rawPeers)) {
    rawPeers.forEach((p) => {
      const uid = p.userId || p.id;
      if (!uid) return;
      // Skip known dummy/mock user IDs
      if (typeof uid === "string" && (uid.startsWith("rank_") || uid.startsWith("friend_"))) {
        return;
      }
      const monthlySpend = Number(p.monthlySpend) || 0;
      const hasRealTransactions = Boolean(p.hasRealTransactions || monthlySpend > 0);
      const categories = p.categories || { FOOD: 0, SHOPPING: 0, TRAVEL: 0, ENTERTAINMENT: 0 };

      map.set(uid, {
        ...p,
        id: uid,
        userId: uid,
        name: p.name || (p.email ? p.email.split("@")[0] : "FinSight User"),
        avatar: p.avatar || null,
        college: p.college || p.city || "Nagpur, MH",
        monthlySpend,
        hasRealTransactions,
        categories,
        savingsRate: p.savingsRate || "50%",
        badge: p.badge || (monthlySpend > 0 ? "Disciplined Saver" : "Starting Fresh"),
        keyHabit: p.keyHabit || deriveKeyHabit(categories, monthlySpend),
        isCurrentUser: uid === currentUserId,
      });
    });
  }

  // Ensure current user is in the pool
  if (currentUserId) {
    const existing = map.get(currentUserId);
    const fallbackSpend = Number(fallbackUserData?.totalUserSpend) || 0;
    const fallbackHasReal = Boolean(fallbackUserData?.hasRealTransactions || fallbackSpend > 0);

    if (!existing && fallbackUserData) {
      map.set(currentUserId, {
        id: currentUserId,
        userId: currentUserId,
        name: fallbackUserData.name || "You",
        avatar: fallbackUserData.avatar || null,
        monthlySpend: fallbackSpend,
        savingsRate: fallbackUserData.savingsRate || "60%",
        college: fallbackUserData.location || "Nagpur, MH",
        badge: fallbackSpend > 0 ? "Disciplined Saver" : "Verified Live User",
        keyHabit: fallbackUserData.keyHabit || "Active FinSight Tracker",
        categories: fallbackUserData.categories || { FOOD: 0, SHOPPING: 0, TRAVEL: 0, ENTERTAINMENT: 0 },
        hasRealTransactions: fallbackHasReal,
        isCurrentUser: true,
      });
    } else if (existing && fallbackUserData) {
      // Keep existing verified Firestore spend unless fresher real transactions exist
      const userHasRealSpend = Boolean(fallbackUserData.hasRealTransactions && fallbackSpend > 0);
      const spendToUse = userHasRealSpend
        ? fallbackSpend
        : (Number(existing.monthlySpend) || fallbackSpend || 0);
      const realTxToUse = userHasRealSpend || Boolean(existing.hasRealTransactions);

      map.set(currentUserId, {
        ...existing,
        name: existing.name || fallbackUserData.name || "You",
        avatar: existing.avatar || fallbackUserData.avatar || null,
        monthlySpend: spendToUse,
        categories: userHasRealSpend ? (fallbackUserData.categories || existing.categories) : existing.categories,
        savingsRate: userHasRealSpend ? (fallbackUserData.savingsRate || existing.savingsRate) : existing.savingsRate,
        hasRealTransactions: realTxToUse,
        isCurrentUser: true,
      });
    }
  }

  const allPeers = Array.from(map.values());

  // Rank sorting algorithm:
  // 1. Users with real verified spend: sorted by monthlySpend ascending (lowest spend = top saver / highest discipline)
  // 2. Users starting from scratch (0 spend): placed after active savers, sorted deterministically
  const sorted = allPeers.sort((a, b) => {
    const aSpend = Number(a.monthlySpend) || 0;
    const bSpend = Number(b.monthlySpend) || 0;
    const aActive = (Boolean(a.hasRealTransactions) || aSpend > 0) && aSpend > 0;
    const bActive = (Boolean(b.hasRealTransactions) || bSpend > 0) && bSpend > 0;

    if (aActive && bActive) {
      if (aSpend !== bSpend) return aSpend - bSpend;
      return (a.name || "").localeCompare(b.name || "");
    }
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return (a.name || "").localeCompare(b.name || "");
  });

  // Assign 1-indexed ranks
  const rankedAll = sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  const userIndex = rankedAll.findIndex((item) => item.isCurrentUser);
  const userRank = userIndex >= 0 ? userIndex + 1 : 1;
  const isTop5 = userRank <= 5;
  const top5Leaderboard = rankedAll.slice(0, 5);

  const fifthPlace = top5Leaderboard[4] || top5Leaderboard[top5Leaderboard.length - 1];
  const userItem = rankedAll[userIndex];
  const userSpend = userItem ? userItem.monthlySpend : 0;
  const gapToTop5 =
    !isTop5 && fifthPlace ? Math.max(0, userSpend - fifthPlace.monthlySpend) : 0;

  const activeAvatars = rankedAll
    .map((p) => p.avatar)
    .filter(Boolean)
    .slice(0, 3);

  return {
    top5Leaderboard,
    allRankedPeers: rankedAll,
    userRank,
    isTop5,
    gapToTop5,
    fifthPlace,
    totalPeersCount: rankedAll.length,
    activeAvatars,
  };
}

/**
 * Subscribes to the live Firestore cohort_profiles collection for a given cohortId.
 * When real users add transactions or update spending, the ranking updates instantaneously.
 */
export function subscribeToCohortLeaderboard(cohortId, currentUserId, onUpdate, onError) {
  if (!db) {
    onUpdate?.({
      top5Leaderboard: [],
      allRankedPeers: [],
      userRank: 1,
      isTop5: true,
      gapToTop5: 0,
      fifthPlace: null,
      totalPeersCount: 1,
      activeAvatars: [],
      loaded: true,
    });
    return () => {};
  }

  let isMounted = true;

  try {
    const colRef = collection(db, "cohort_profiles");

    const unsubscribe = onSnapshot(
      colRef,
      async (snapshot) => {
        if (!isMounted) return;

        const rawList = [];
        snapshot?.forEach?.((docSnap) => {
          if (docSnap.exists?.()) {
            rawList.push({ id: docSnap.id, ...docSnap.data() });
          }
        });

        // Also check if any additional registered users in users collection need seeding
        try {
          const usersCol = collection(db, "users");
          const usersSnap = await getDocs(usersCol);
          usersSnap?.forEach?.((uDoc) => {
            if (uDoc.exists?.()) {
              const uData = uDoc.data();
              const uId = uDoc.id;
              const alreadyPresent = rawList.some((r) => (r.userId || r.id) === uId);
              if (!alreadyPresent) {
                const uMonthlySpend = Number(uData.monthlySpend) || 0;
                rawList.push({
                  id: uId,
                  userId: uId,
                  name: uData.fullName || (uData.email ? uData.email.split("@")[0] : "FinSight User"),
                  email: uData.email || null,
                  avatar: uData.avatar || null,
                  city: uData.city || "Nagpur",
                  cohortId: uData.cohortId || cohortId || "nagpur_students",
                  college: uData.college || `${uData.city || "Nagpur"}, MH`,
                  monthlySpend: uMonthlySpend,
                  categories: uData.categories || { FOOD: 0, SHOPPING: 0, TRAVEL: 0, ENTERTAINMENT: 0 },
                  savingsRate: uData.savingsRate || "50%",
                  hasRealTransactions: Boolean(uData.hasRealTransactions || uMonthlySpend > 0),
                });
              }
            }
          });
        } catch {
          // Users collection might be locked or empty; continue with cohort_profiles
        }

        // Filter for cohort matching the selectedCohortId or user city
        const targetCohort = cohortId || "nagpur_students";
        const matchingPeers = rawList.filter((p) => {
          if (!p.cohortId) return true; // Include unassigned users in default view
          return p.cohortId === targetCohort;
        });

        // If target cohort has fewer than 5 real peers, include all registered peers
        // across cohorts so that live real users are always visible on the board!
        const peersToRank = matchingPeers.length >= 5 ? matchingPeers : rawList;

        const ranking = computeRealPeerLeaderboard(
          peersToRank.length > 0 ? peersToRank : rawList,
          currentUserId,
        );

        onUpdate?.({
          ...ranking,
          loaded: true,
        });
      },
      (error) => {
        console.warn("[cohortService] onSnapshot subscription error:", error);
        onError?.(error);
        if (isMounted) {
          onUpdate?.({
            top5Leaderboard: [],
            allRankedPeers: [],
            userRank: 1,
            isTop5: true,
            gapToTop5: 0,
            fifthPlace: null,
            totalPeersCount: 1,
            activeAvatars: [],
            loaded: true,
          });
        }
      },
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribe === "function") unsubscribe();
    };
  } catch (err) {
    console.warn("[cohortService] Failed to establish cohort listener:", err);
    onUpdate?.({
      top5Leaderboard: [],
      allRankedPeers: [],
      userRank: 1,
      isTop5: true,
      gapToTop5: 0,
      fifthPlace: null,
      totalPeersCount: 1,
      activeAvatars: [],
      loaded: true,
    });
    return () => {};
  }
}
