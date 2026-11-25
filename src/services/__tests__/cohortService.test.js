import {
  computeRealPeerLeaderboard,
  deriveKeyHabit,
  publishUserCohortProfile,
  syncUserTransactionsToCohort,
} from "../cohortService";
import { generateCompareLink, parseCompareLink } from "../../data/dummyPeers";
import { doc, setDoc } from "firebase/firestore";

describe("cohortService - Real User Financial Mirror & Ranking Engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("deriveKeyHabit", () => {
    test("returns starting fresh message when spend is zero or empty", () => {
      expect(deriveKeyHabit({}, 0)).toBe("New account starting fresh");
      expect(deriveKeyHabit({ FOOD: 0, SHOPPING: 0, TRAVEL: 0, ENTERTAINMENT: 0 }, 0)).toBe(
        "New account starting fresh",
      );
    });

    test("detects high dining out pattern", () => {
      expect(
        deriveKeyHabit({ FOOD: 3000, SHOPPING: 500, TRAVEL: 500, ENTERTAINMENT: 500 }, 4500),
      ).toBe("High dining out ratio; tracking meals");
    });

    test("detects active shopping budgeter", () => {
      expect(
        deriveKeyHabit({ FOOD: 1000, SHOPPING: 2500, TRAVEL: 500, ENTERTAINMENT: 500 }, 4500),
      ).toBe("Active retail & ecommerce budgeter");
    });

    test("detects frequent commute & transit saver", () => {
      expect(
        deriveKeyHabit({ FOOD: 1000, SHOPPING: 500, TRAVEL: 2000, ENTERTAINMENT: 500 }, 4000),
      ).toBe("Frequent commute & transit saver");
    });

    test("detects balanced 4-category budget tracker", () => {
      expect(
        deriveKeyHabit({ FOOD: 1500, SHOPPING: 1500, TRAVEL: 1500, ENTERTAINMENT: 1500 }, 6000),
      ).toBe("Balanced 4-category budget tracker");
    });
  });

  describe("computeRealPeerLeaderboard", () => {
    test("filters out dummy static peer rank IDs (rank_*)", () => {
      const rawPeers = [
        { id: "rank_1", userId: "rank_1", name: "Dummy 1", monthlySpend: 1500 },
        { id: "rank_2", userId: "rank_2", name: "Dummy 2", monthlySpend: 2500 },
        {
          id: "user_real_1",
          userId: "user_real_1",
          name: "Real User 1",
          monthlySpend: 2000,
          hasRealTransactions: true,
        },
      ];

      const result = computeRealPeerLeaderboard(rawPeers, "user_real_1");
      expect(result.allRankedPeers).toHaveLength(1);
      expect(result.allRankedPeers[0].id).toBe("user_real_1");
      expect(result.allRankedPeers[0].name).toBe("Real User 1");
      expect(result.top5Leaderboard).toHaveLength(1);
    });

    test("ranks real users by monthly spend ascending (lowest spend = top saver)", () => {
      const rawPeers = [
        {
          id: "user_sneha",
          userId: "user_sneha",
          name: "Sneha Patil",
          monthlySpend: 4500,
          hasRealTransactions: true,
        },
        {
          id: "user_rohit",
          userId: "user_rohit",
          name: "Rohit Sharma",
          monthlySpend: 2100,
          hasRealTransactions: true,
        },
        {
          id: "user_amit",
          userId: "user_amit",
          name: "Amit Deshmukh",
          monthlySpend: 3200,
          hasRealTransactions: true,
        },
      ];

      const result = computeRealPeerLeaderboard(rawPeers, "user_amit");

      expect(result.top5Leaderboard).toHaveLength(3);
      expect(result.top5Leaderboard[0].name).toBe("Rohit Sharma");
      expect(result.top5Leaderboard[0].rank).toBe(1);
      expect(result.top5Leaderboard[1].name).toBe("Amit Deshmukh");
      expect(result.top5Leaderboard[1].rank).toBe(2);
      expect(result.top5Leaderboard[1].isCurrentUser).toBe(true);
      expect(result.top5Leaderboard[2].name).toBe("Sneha Patil");
      expect(result.top5Leaderboard[2].rank).toBe(3);

      expect(result.userRank).toBe(2);
      expect(result.isTop5).toBe(true);
      expect(result.totalPeersCount).toBe(3);
    });

    test("places starting fresh users (0 spend) after active spenders", () => {
      const rawPeers = [
        {
          id: "user_fresh",
          userId: "user_fresh",
          name: "Fresh User",
          monthlySpend: 0,
          hasRealTransactions: false,
        },
        {
          id: "user_active",
          userId: "user_active",
          name: "Active Saver",
          monthlySpend: 2500,
          hasRealTransactions: true,
        },
      ];

      const result = computeRealPeerLeaderboard(rawPeers, "user_fresh");

      expect(result.top5Leaderboard[0].name).toBe("Active Saver");
      expect(result.top5Leaderboard[0].rank).toBe(1);
      expect(result.top5Leaderboard[1].name).toBe("Fresh User");
      expect(result.top5Leaderboard[1].rank).toBe(2);
      expect(result.userRank).toBe(2);
    });

    test("strictly limits top5Leaderboard to 5 users even when many real users exist", () => {
      const rawPeers = Array.from({ length: 8 }, (_, i) => ({
        id: `user_${i}`,
        userId: `user_${i}`,
        name: `User ${i}`,
        monthlySpend: (i + 1) * 1000,
        hasRealTransactions: true,
      }));

      const result = computeRealPeerLeaderboard(rawPeers, "user_6"); // Rank 7

      expect(result.top5Leaderboard).toHaveLength(5);
      expect(result.allRankedPeers).toHaveLength(8);
      expect(result.userRank).toBe(7);
      expect(result.isTop5).toBe(false);
      expect(result.gapToTop5).toBe(2000); // 7000 - 5000 (5th place)
      expect(result.totalPeersCount).toBe(8);
    });

    test("integrates current user with fallbackUserData when not yet present in rawPeers", () => {
      const result = computeRealPeerLeaderboard([], "user_new", {
        name: "Test User",
        totalUserSpend: 1800,
        savingsRate: "65%",
      });

      expect(result.top5Leaderboard).toHaveLength(1);
      expect(result.top5Leaderboard[0].id).toBe("user_new");
      expect(result.top5Leaderboard[0].name).toBe("Test User");
      expect(result.top5Leaderboard[0].monthlySpend).toBe(1800);
      expect(result.top5Leaderboard[0].isCurrentUser).toBe(true);
      expect(result.userRank).toBe(1);
      expect(result.isTop5).toBe(true);
    });
  });

  describe("publishUserCohortProfile & syncUserTransactionsToCohort", () => {
    test("publishes profile to cohort_profiles and users collections", async () => {
      const user = { uid: "user_xyz_123", email: "student@test.com" };
      const profile = { fullName: "Aaradhya Joshi" };
      const userCategoryTotals = {
        FOOD: 1200,
        SHOPPING: 400,
        TRAVEL: 300,
        ENTERTAINMENT: 200,
        totalDiscretionary: 2100,
        hasRealData: true,
      };
      const metrics = {
        overallPercentile: 15,
        stance: { type: "TOP_SAVER" },
      };

      const result = await publishUserCohortProfile(user, {
        userCategoryTotals,
        metrics,
        demographics: { cohortKey: "nagpur_students", city: "Nagpur" },
        profile,
      });

      expect(result).toBeTruthy();
      expect(result.userId).toBe("user_xyz_123");
      expect(result.name).toBe("Aaradhya Joshi");
      expect(result.monthlySpend).toBe(2100);
      expect(result.savingsRate).toBe("72%");
      expect(result.badge).toBe("Top Disciplined Saver");
      expect(setDoc).toHaveBeenCalledTimes(2);
    });

    test("syncUserTransactionsToCohort aggregates raw transactions and publishes", async () => {
      const user = { uid: "user_test_tx", email: "tx@test.com" };
      const transactions = [
        { amount: 500, category: "FOOD", type: "DEBIT", date: "2026-09-10" },
        { amount: 300, category: "SHOPPING", type: "DEBIT", date: "2026-09-11" },
        { amount: 200, category: "TRANSPORTATION", type: "DEBIT", date: "2026-09-12" },
      ];

      const result = await syncUserTransactionsToCohort(user, transactions);

      expect(result).toBeTruthy();
      expect(result.userId).toBe("user_test_tx");
      expect(result.categories.FOOD).toBe(500);
      expect(result.categories.SHOPPING).toBe(300);
      expect(result.categories.TRAVEL).toBe(200); // TRANSPORTATION mapped to TRAVEL
      expect(result.monthlySpend).toBe(1000);
      expect(setDoc).toHaveBeenCalled();
    });
  });

  describe("generateCompareLink & parseCompareLink", () => {
    test("generates portable compare link with URL, app deep link, code, and share text", () => {
      const payload = generateCompareLink(
        { name: "Siddharth", city: "Nagpur" },
        { FOOD: 1500, SHOPPING: 1000, TRAVEL: 500, ENTERTAINMENT: 500 },
        "65%",
      );

      expect(payload.link).toContain("https://finsight.ai/compare?");
      expect(payload.link).toContain("name=Siddharth");
      expect(payload.link).toContain("spend=3500");
      expect(payload.appLink).toContain("finsight://compare?");
      expect(payload.code).toBe("FS-3500-SIDD");
      expect(payload.shareText).toContain("Siddharth");
      expect(payload.shareText).toContain("₹3,500");
      expect(payload.total).toBe(3500);
    });

    test("parses standard FinSight compare web link", () => {
      const url = "https://finsight.ai/compare?name=Rohan&spend=4200&f=2000&s=1000&t=600&e=600&sav=58%25&city=Nagpur";
      const peer = parseCompareLink(url);

      expect(peer).toBeTruthy();
      expect(peer.name).toBe("Rohan");
      expect(peer.monthlySpend).toBe(4200);
      expect(peer.categories.FOOD).toBe(2000);
      expect(peer.categories.SHOPPING).toBe(1000);
      expect(peer.savingsRate).toBe("58%");
    });

    test("parses compare link embedded in WhatsApp share message", () => {
      const message = `📊 Compare spending head-to-head with Priya on FinSight-AI!
💰 Monthly Discretionary Spend: ₹3,800 • Savings Rate: 62%
🔑 Compare Code: FS-3800-PRIY

Tap below to compare your 4-category budget:
https://finsight.ai/compare?name=Priya&spend=3800&f=1800&s=900&t=500&e=600&sav=62%25&city=Nagpur`;

      const peer = parseCompareLink(message);

      expect(peer).toBeTruthy();
      expect(peer.name).toBe("Priya");
      expect(peer.monthlySpend).toBe(3800);
      expect(peer.categories.FOOD).toBe(1800);
    });

    test("parses invite code FS-4500-AAR", () => {
      const peer = parseCompareLink("FS-4500-AAR");

      expect(peer).toBeTruthy();
      expect(peer.monthlySpend).toBe(4500);
      expect(peer.name).toBe("Friend (AAR)");
      expect(peer.categories.FOOD).toBeGreaterThan(0);
    });

    test("matches real peer directly from availablePeers pool by name or ID", () => {
      const peersPool = [
        {
          id: "user_live_99",
          userId: "user_live_99",
          name: "Ananya Deshpande",
          email: "ananya@test.com",
          monthlySpend: 2800,
          categories: { FOOD: 1200, SHOPPING: 700, TRAVEL: 500, ENTERTAINMENT: 400 },
          savingsRate: "68%",
        },
      ];

      const byName = parseCompareLink("Ananya", peersPool);
      expect(byName).toBeTruthy();
      expect(byName.userId).toBe("user_live_99");

      const byEmail = parseCompareLink("ananya@test.com", peersPool);
      expect(byEmail).toBeTruthy();
      expect(byEmail.userId).toBe("user_live_99");
    });
  });
});

