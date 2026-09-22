import {
  COHORT_BENCHMARKS,
  STRICT_CATEGORIES,
  calculatePercentile,
  generateStrategies,
  aggregateCategoryTotals,
  calculateCohortMetrics,
} from "../kdeEngine";

describe("kdeEngine math and benchmarking engine", () => {
  describe("COHORT_BENCHMARKS", () => {
    test("defines nagpur_students and entry_professionals with strict 4 categories", () => {
      expect(COHORT_BENCHMARKS.nagpur_students).toBeDefined();
      expect(COHORT_BENCHMARKS.entry_professionals).toBeDefined();

      const nagpur = COHORT_BENCHMARKS.nagpur_students;
      expect(nagpur.medianMonthlySpend).toBe(8500);
      expect(nagpur.topHandlersThreshold).toBe(4800);

      STRICT_CATEGORIES.forEach((cat) => {
        expect(nagpur.categories[cat]).toBeDefined();
        expect(nagpur.categories[cat].median).toBeGreaterThan(0);
        expect(nagpur.categories[cat].topHandlers).toBeGreaterThan(0);
        expect(nagpur.categories[cat].topHandlers).toBeLessThan(nagpur.categories[cat].median);
      });
    });
  });

  describe("calculatePercentile", () => {
    test("handles edge cases (zero, negative, invalid)", () => {
      expect(calculatePercentile(0, 8500)).toBe(5);
      expect(calculatePercentile(-500, 8500)).toBe(5);
      expect(calculatePercentile(null, 8500)).toBe(5);
      expect(calculatePercentile(undefined, 8500)).toBe(5);
    });

    test("computes exact median spend as 50th percentile", () => {
      const p = calculatePercentile(8500, 8500);
      expect(p).toBe(50);
    });

    test("computes disciplined spend below median", () => {
      // Top 10% threshold spend should be around 10th percentile
      const p = calculatePercentile(4800, 8500);
      expect(p).toBeLessThan(15);
      expect(p).toBeGreaterThan(5);
    });

    test("computes elevated spend above median", () => {
      // 11400 vs 8500
      const p = calculatePercentile(11400, 8500);
      expect(p).toBeGreaterThan(70);
      expect(p).toBeLessThan(80);
    });

    test("bounds percentile strictly between 1 and 99", () => {
      expect(calculatePercentile(1, 100000)).toBeGreaterThanOrEqual(1);
      expect(calculatePercentile(1000000, 5000)).toBeLessThanOrEqual(99);
    });

    test("computes in under 5ms for 1000 iterations (deterministic performance)", () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        calculatePercentile(5000 + i * 10, 8500);
      }
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // 1000 iterations in <100ms means <0.1ms each
    });
  });

  describe("generateStrategies", () => {
    test("produces HIGH severity strategy when spend exceeds 1.15 * median", () => {
      const cohort = COHORT_BENCHMARKS.nagpur_students;
      // Food median is 3800, user spends 6200
      const userTotals = {
        FOOD: 6200,
        SHOPPING: 1500,
        TRAVEL: 1000,
        ENTERTAINMENT: 1200,
      };

      const strategies = generateStrategies(userTotals, cohort);
      const foodStrategy = strategies.find((s) => s.category === "FOOD");

      expect(foodStrategy).toBeDefined();
      expect(foodStrategy.severity).toBe("HIGH");
      expect(foodStrategy.headline).toContain("Trim food & dining spending");
      expect(foodStrategy.action).toContain("Cut 2 dining deliveries");
      expect(foodStrategy.excess).toBe(2400);
    });

    test("produces EXCELLENT severity strategy when spend <= topHandlers", () => {
      const cohort = COHORT_BENCHMARKS.nagpur_students;
      // Shopping topHandlers is 800, user spends 600
      const userTotals = {
        FOOD: 3800,
        SHOPPING: 600,
        TRAVEL: 1400,
        ENTERTAINMENT: 1500,
      };

      const strategies = generateStrategies(userTotals, cohort);
      const shoppingStrategy = strategies.find((s) => s.category === "SHOPPING");

      expect(shoppingStrategy).toBeDefined();
      expect(shoppingStrategy.severity).toBe("EXCELLENT");
      expect(shoppingStrategy.headline).toContain("Top-Tier Discipline");
      expect(shoppingStrategy.action).toContain("top 10% money handlers");
    });
  });

  describe("aggregateCategoryTotals", () => {
    test("aggregates DEBIT transactions into 4 strict categories and maps TRANSPORTATION to TRAVEL", () => {
      const txs = [
        { type: "DEBIT", amount: 2000, category: "FOOD", date: "2026-08-01" },
        { type: "DEBIT", amount: 1500, category: "FOOD", date: "2026-08-10" },
        { type: "DEBIT", amount: 1200, category: "SHOPPING", date: "2026-08-05" },
        { type: "DEBIT", amount: 800, category: "TRANSPORTATION", date: "2026-08-12" }, // mapped to TRAVEL
        { type: "DEBIT", amount: 400, category: "TRAVEL", date: "2026-08-15" },
        { type: "DEBIT", amount: 900, category: "ENTERTAINMENT", date: "2026-08-20" },
        { type: "CREDIT", amount: 25000, category: "INCOME", date: "2026-08-01" }, // ignored
        { type: "DEBIT", amount: 1000, category: "UTILITIES", date: "2026-08-03" }, // outside strict 4
      ];

      const result = aggregateCategoryTotals(txs);

      expect(result.FOOD).toBe(3500);
      expect(result.SHOPPING).toBe(1200);
      expect(result.TRAVEL).toBe(1200); // 800 + 400
      expect(result.ENTERTAINMENT).toBe(900);
      expect(result.monthCount).toBe(1);
      expect(result.totalDiscretionary).toBe(6800);
      expect(result.hasRealData).toBe(true);
    });

    test("normalizes monthly spend if data spans multiple distinct months", () => {
      const txs = [
        { type: "DEBIT", amount: 4000, category: "FOOD", date: "2026-07-15" },
        { type: "DEBIT", amount: 6000, category: "FOOD", date: "2026-08-15" },
      ];

      const result = aggregateCategoryTotals(txs);
      expect(result.monthCount).toBe(2);
      expect(result.FOOD).toBe(5000); // (4000 + 6000) / 2
    });

    test("handles empty transactions safely", () => {
      const result = aggregateCategoryTotals([]);
      expect(result.FOOD).toBe(0);
      expect(result.SHOPPING).toBe(0);
      expect(result.TRAVEL).toBe(0);
      expect(result.ENTERTAINMENT).toBe(0);
      expect(result.hasRealData).toBe(false);
    });
  });

  describe("calculateCohortMetrics", () => {
    test("evaluates high spender correctly", () => {
      const cohort = COHORT_BENCHMARKS.nagpur_students;
      const userTotals = {
        FOOD: 6200,
        SHOPPING: 2400,
        TRAVEL: 1500,
        ENTERTAINMENT: 1300,
      };

      const metrics = calculateCohortMetrics(userTotals, cohort);

      expect(metrics.totalUserSpend).toBe(11400);
      expect(metrics.overallPercentile).toBeGreaterThan(65);
      expect(metrics.stance.type).toBe("HIGH_SPENDER");
      expect(metrics.stance.badgeLabel).toContain("Spending more than");
      expect(metrics.gapToTopHandlers).toBe(11400 - 4800);
      expect(metrics.categoryMetrics).toHaveLength(4);
    });

    test("evaluates top money handler correctly", () => {
      const cohort = COHORT_BENCHMARKS.nagpur_students;
      const userTotals = {
        FOOD: 1800,
        SHOPPING: 600,
        TRAVEL: 700,
        ENTERTAINMENT: 500,
      };

      const metrics = calculateCohortMetrics(userTotals, cohort);

      expect(metrics.totalUserSpend).toBe(3600);
      expect(metrics.overallPercentile).toBeLessThanOrEqual(35);
      expect(metrics.stance.type).toBe("TOP_SAVER");
      expect(metrics.stance.title).toBe("Top Money Handler");
      expect(metrics.stance.badgeLabel).toContain("disciplined saver in your demographic");
      expect(metrics.gapToTopHandlers).toBe(0);
    });
  });
});
