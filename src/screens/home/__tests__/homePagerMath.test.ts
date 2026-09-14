import fc from "fast-check";

import {
  DISTANCE_COMMIT_RATIO,
  MAX_INDEX_DELTA,
  PROJECTED_COMMIT_RATIO,
  VELOCITY_PROJECTION_SECONDS,
  clampFinite,
  clampPageIndex,
  clampPageProgress,
  clampProgressToAdjacent,
  directDragProgress,
  fallbackHeadingCenters,
  finiteOr,
  headingProximity,
  interpolateHeadingCenter,
  interpolatePageValue,
  isFiniteNumber,
  isValidHeadingCenters,
  projectRelease,
  resolveHeadingCenters,
  settleTarget,
  trackXForProgress,
  type HeadingCenters,
} from "../homePagerMath";

const WIDTH = 390;

function releaseInput(dragPages: number, projectedPages: number, startIndex = 1) {
  const velocityPagesPerSecond = (projectedPages - dragPages) / VELOCITY_PROJECTION_SECONDS;
  return {
    startIndex,
    translationX: -dragPages * WIDTH,
    velocityX: -velocityPagesPerSecond * WIDTH,
    pageWidth: WIDTH,
  };
}

describe("homePagerMath finite guards and clamping", () => {
  test("finite guards reject invalid values and clamp indices/progress", () => {
    expect(isFiniteNumber(12)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(finiteOr(Number.POSITIVE_INFINITY, 7)).toBe(7);
    expect(clampFinite(Number.NaN, -1, 1, 0.25)).toBe(0.25);
    expect(clampPageIndex(-20)).toBe(0);
    expect(clampPageIndex(1.6)).toBe(2);
    expect(clampPageIndex(Number.NaN)).toBe(0);
    expect(clampPageProgress(-0.1)).toBe(0);
    expect(clampPageProgress(2.1)).toBe(2);
    expect(clampProgressToAdjacent(0, 2)).toBe(1);
    expect(clampProgressToAdjacent(2, 0)).toBe(1);
  });

  test("direct drag progress tracks the finger and clamps globally and locally", () => {
    expect(directDragProgress(0, -WIDTH * 0.3, WIDTH)).toBeCloseTo(0.3);
    expect(directDragProgress(1, WIDTH * 0.4, WIDTH)).toBeCloseTo(0.6);
    expect(directDragProgress(0, WIDTH, WIDTH)).toBe(0);
    expect(directDragProgress(2, -WIDTH, WIDTH)).toBe(2);
    expect(directDragProgress(0, -WIDTH * 5, WIDTH)).toBe(1);
  });

  test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "invalid page width %p returns the clamped start",
    (pageWidth) => {
      expect(directDragProgress(1.8, -100, pageWidth)).toBe(2);
      expect(settleTarget(1.8, -100, -1000, pageWidth)).toBe(2);
    },
  );

  test("non-finite gesture samples cannot escape or commit", () => {
    expect(settleTarget(1, Number.NaN, 0, WIDTH)).toBe(1);
    expect(settleTarget(1, 0, Number.NEGATIVE_INFINITY, WIDTH)).toBe(1);
    expect(directDragProgress(1, Number.POSITIVE_INFINITY, WIDTH)).toBe(1);

    const extreme = projectRelease(1, -Number.MAX_VALUE, -Number.MAX_VALUE, Number.MIN_VALUE);
    expect(Number.isFinite(extreme.dragPages)).toBe(true);
    expect(Number.isFinite(extreme.velocityPagesPerSecond)).toBe(true);
    expect(Number.isFinite(extreme.projectedPages)).toBe(true);
    expect(settleTarget(1, -Number.MAX_VALUE, -Number.MAX_VALUE, Number.MIN_VALUE)).toBe(2);
  });
});

describe("homePagerMath release projection and settlement", () => {
  test.each([
    {
      name: "below both thresholds",
      input: releaseInput(DISTANCE_COMMIT_RATIO - 0.001, PROJECTED_COMMIT_RATIO - 0.001),
      expected: 1,
    },
    {
      name: "at distance threshold",
      input: releaseInput(DISTANCE_COMMIT_RATIO, DISTANCE_COMMIT_RATIO),
      expected: 2,
    },
    {
      name: "above distance threshold",
      input: releaseInput(DISTANCE_COMMIT_RATIO + 0.001, DISTANCE_COMMIT_RATIO + 0.001),
      expected: 2,
    },
    {
      name: "at projected threshold",
      input: releaseInput(0.1, PROJECTED_COMMIT_RATIO),
      expected: 2,
    },
    {
      name: "above projected threshold toward previous page",
      input: releaseInput(-0.1, -PROJECTED_COMMIT_RATIO - 0.001),
      expected: 0,
    },
  ])("settles correctly $name", ({ input, expected }) => {
    expect(settleTarget(input.startIndex, input.translationX, input.velocityX, input.pageWidth)).toBe(expected);
  });

  test("projection combines normalized distance and velocity", () => {
    const input = releaseInput(0.18, 0.72);
    const release = projectRelease(
      input.startIndex,
      input.translationX,
      input.velocityX,
      input.pageWidth,
    );

    expect(release.dragPages).toBeCloseTo(0.18);
    expect(release.projectedPages).toBeCloseTo(0.72);
    expect(release.distanceCommit).toBe(false);
    expect(release.projectedCommit).toBe(true);
  });

  test("a projected reversal decides direction when it crosses its threshold", () => {
    const input = releaseInput(0.4, -0.6);
    expect(settleTarget(input.startIndex, input.translationX, input.velocityX, input.pageWidth)).toBe(0);
  });

  test("outward releases clamp to the first and last page", () => {
    expect(settleTarget(0, WIDTH, 2000, WIDTH)).toBe(0);
    expect(settleTarget(2, -WIDTH, -2000, WIDTH)).toBe(2);
  });

  // **Validates: Requirements 2.1, 2.2, 3.10**
  test("property: every finite release settles to the current or one adjacent valid index", () => {
    const finiteGestureValue = fc.oneof(
      fc.integer({ min: -2_000_000_000, max: 2_000_000_000 }),
      fc.constantFrom(Number.MAX_VALUE, -Number.MAX_VALUE, Number.MIN_VALUE, -Number.MIN_VALUE),
    );

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        fc.integer({ min: 1, max: 10_000 }),
        finiteGestureValue,
        finiteGestureValue,
        (startIndex, pageWidth, translationX, velocityX) => {
          const target = settleTarget(startIndex, translationX, velocityX, pageWidth);
          expect(Number.isInteger(target)).toBe(true);
          expect(target).toBeGreaterThanOrEqual(0);
          expect(target).toBeLessThanOrEqual(2);
          expect(Math.abs(target - startIndex)).toBeLessThanOrEqual(MAX_INDEX_DELTA);
        },
      ),
      { seed: 20250316, numRuns: 300 },
    );
  });

  // **Validates: Requirements 2.2, 3.10**
  test("property: releases below both distance and projected thresholds do not commit", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        fc.integer({ min: 1, max: 2_000 }),
        fc.double({ min: -0.328, max: 0.328, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -0.498, max: 0.498, noNaN: true, noDefaultInfinity: true }),
        (startIndex, pageWidth, dragPages, projectedPages) => {
          const velocityPagesPerSecond =
            (projectedPages - dragPages) / VELOCITY_PROJECTION_SECONDS;
          const target = settleTarget(
            startIndex,
            -dragPages * pageWidth,
            -velocityPagesPerSecond * pageWidth,
            pageWidth,
          );
          expect(target).toBe(startIndex);
        },
      ),
      { seed: 20250317, numRuns: 300 },
    );
  });
});

describe("homePagerMath synchronized interpolation", () => {
  test("track translation and heading proximity have exact integer endpoints", () => {
    expect([0, 1, 2].map((progress) => trackXForProgress(progress, WIDTH))).toEqual([0, -390, -780]);
    expect([0, 1, 2].map((index) => headingProximity(1, index))).toEqual([0, 1, 0]);
    expect(headingProximity(0.25, 0)).toBeCloseTo(0.75);
    expect(headingProximity(0.25, 1)).toBeCloseTo(0.25);
  });

  test("measured centers replace equal-slot fallbacks only as a complete valid triple", () => {
    expect(fallbackHeadingCenters(390, 12)).toEqual([77, 207, 337]);
    expect(resolveHeadingCenters(undefined, 390, 12)).toEqual([77, 207, 337]);
    expect(resolveHeadingCenters([40, Number.NaN, 300], 390, 12)).toEqual([77, 207, 337]);
    expect(resolveHeadingCenters([40, 170, 300], 390, 12)).toEqual([52, 182, 312]);
    expect(isValidHeadingCenters([40, 170, 300])).toBe(true);
    expect(isValidHeadingCenters([40, 40, 300])).toBe(false);
  });

  test("center interpolation is exact at page indices and linear between adjacent pages", () => {
    const centers = [52, 182, 312] as const;
    expect(interpolatePageValue(0, centers)).toBe(52);
    expect(interpolatePageValue(1, centers)).toBe(182);
    expect(interpolatePageValue(2, centers)).toBe(312);
    expect(interpolatePageValue(0.25, centers)).toBeCloseTo(84.5);
    expect(interpolateHeadingCenter(1.5, [40, 170, 300], 390, 12)).toBe(247);
  });

  // **Validates: Requirements 2.1, 2.3, 2.4**
  test("property: track and bump interpolation are finite, bounded, continuous, and monotonic", () => {
    const interpolationCase = fc
      .record({
        first: fc.integer({ min: -1_000, max: 1_000 }),
        firstGap: fc.integer({ min: 1, max: 500 }),
        secondGap: fc.integer({ min: 1, max: 500 }),
        pageWidth: fc.integer({ min: 1, max: 2_000 }),
        sampleA: fc.integer({ min: 0, max: 2_000 }),
        sampleB: fc.integer({ min: 0, max: 2_000 }),
      })
      .map(({ first, firstGap, secondGap, pageWidth, sampleA, sampleB }) => ({
        centers: [first, first + firstGap, first + firstGap + secondGap] as HeadingCenters,
        pageWidth,
        progressA: Math.min(sampleA, sampleB) / 1_000,
        progressB: Math.max(sampleA, sampleB) / 1_000,
      }));

    fc.assert(
      fc.property(interpolationCase, ({ centers, pageWidth, progressA, progressB }) => {
        const bumpA = interpolatePageValue(progressA, centers);
        const bumpB = interpolatePageValue(progressB, centers);
        const trackA = trackXForProgress(progressA, pageWidth);
        const trackB = trackXForProgress(progressB, pageWidth);
        const maximumCenterGap = Math.max(centers[1] - centers[0], centers[2] - centers[1]);

        expect(Number.isFinite(bumpA)).toBe(true);
        expect(Number.isFinite(bumpB)).toBe(true);
        expect(bumpA).toBeGreaterThanOrEqual(centers[0]);
        expect(bumpB).toBeLessThanOrEqual(centers[2]);
        expect(bumpA).toBeLessThanOrEqual(bumpB);
        expect(Math.abs(bumpB - bumpA)).toBeLessThanOrEqual(
          maximumCenterGap * (progressB - progressA) + 1e-9,
        );
        expect(trackA).toBeGreaterThanOrEqual(-2 * pageWidth);
        expect(trackB).toBeLessThanOrEqual(0);
        expect(trackA).toBeGreaterThanOrEqual(trackB);
        const expectedTrackA = progressA === 0 ? 0 : -clampPageProgress(progressA) * pageWidth;
        expect(trackXForProgress(progressA, pageWidth)).toBe(expectedTrackA);
      }),
      { seed: 20250318, numRuns: 300 },
    );
  });

  // **Validates: Requirements 2.3**
  test("property: adjacent heading proximity crossfades continuously from exact endpoints", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        fc.integer({ min: 0, max: 1_000 }),
        (lowerIndex, fractionSample) => {
          const fraction = fractionSample / 1_000;
          const progress = lowerIndex + fraction;
          const lower = headingProximity(progress, lowerIndex);
          const upper = headingProximity(progress, lowerIndex + 1);

          expect(lower).toBeCloseTo(1 - fraction, 12);
          expect(upper).toBeCloseTo(fraction, 12);
          expect(lower + upper).toBeCloseTo(1, 12);
        },
      ),
      { seed: 20250319, numRuns: 200 },
    );
  });
});


describe("Property 2 preservation across width changes", () => {
  // **Validates: Requirements 3.7, 3.9, 3.10**
  test("property: a settled page remains exactly aligned for every supported width without changing its index", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        fc.integer({ min: 280, max: 600 }),
        fc.integer({ min: 280, max: 600 }),
        (settledIndex, previousWidth, nextWidth) => {
          const previousTrackX = trackXForProgress(settledIndex, previousWidth);
          const nextTrackX = trackXForProgress(settledIndex, nextWidth);

          expect(previousTrackX).toBe(settledIndex === 0 ? 0 : -settledIndex * previousWidth);
          expect(nextTrackX).toBe(settledIndex === 0 ? 0 : -settledIndex * nextWidth);
          expect(Object.is(previousTrackX, -0)).toBe(false);
          expect(Object.is(nextTrackX, -0)).toBe(false);
        },
      ),
      { seed: 20250322, numRuns: 150 },
    );
  });
});
