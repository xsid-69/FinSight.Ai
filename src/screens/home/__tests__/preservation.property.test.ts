jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: {
      View: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement(View, props, children),
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (initialValue: number) => ({ value: initialValue }),
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
  };
});

import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";

import { pageTraversalState } from "../HomePager";
import type { HomePageIndex } from "../homePagerMath";
import {
  BASELINE_MAIN_TABS,
  observeUnfixedAndroidBack,
  observeUnfixedExternalParam,
  observeUnfixedLifecycleAtSettledState,
  observeUnfixedNonBugGesture,
  observeUnfixedPageOffsetHistory,
  observeUnfixedReducedMotion,
  observeUnfixedRequestSequence,
  observeUnfixedSafeArea,
  observeUnfixedWidthChange,
  type BaselineGestureInput,
  type BaselineMainTab,
} from "./helpers/preservationBaseline";

const tabArbitrary = fc.constantFrom<BaselineMainTab>(...BASELINE_MAIN_TABS);

function expectSelectionUnchanged(input: BaselineGestureInput) {
  const result = observeUnfixedNonBugGesture(input);
  expect(result.settledTab).toBe(input.startTab);
  expect(result.routeTab).toBe(input.startTab);
  expect(result.selectedTab).toBe(input.startTab);
  expect(result.hapticCount).toBe(0);
  expect(result.parentPagerActivated).toBe(false);
}

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Property 2: Preservation - unfixed observation baseline", () => {
  // **Validates: Requirements 3.1, 3.6, 3.10**
  test("retains the production root, stack, tab-history, dock, and coordinator topology", () => {
    const app = source("App.tsx");
    const navigator = source("src/navigation/AppNavigator.tsx");

    expect(app).toContain("<GestureHandlerRootView");
    expect(app).toContain("<SafeAreaProvider>");
    expect(app).toContain("<AppNavigator />");
    expect(navigator).toContain("<HomePagerCoordinatorProvider>");
    expect(navigator).toContain('backBehavior="history"');
    expect(navigator).toContain('tabBar={(props) => <FloatingDock {...props} />}');
    expect(navigator).toContain('name="AIAssistant"');
    expect(navigator).toContain('name="Analyzer"');
    expect(navigator).toContain('presentation: "modal"');
    expect(navigator).toContain('name="Profile"');
    expect(navigator).toContain('presentation: "card"');
  });

  // **Validates: Requirements 3.7**
  test("primarily vertical gestures leave the Home selection unchanged", () => {
    for (const startTab of BASELINE_MAIN_TABS) {
      const input: BaselineGestureInput = {
        startTab,
        translationX: 8,
        translationY: 48,
        velocityX: 0,
        completion: "fail",
        enabled: true,
        pointerCount: 1,
        startsInCarousel: false,
      };
      expectSelectionUnchanged(input);
      expect(observeUnfixedNonBugGesture(input).verticalScrollRetained).toBe(true);
    }
  });

  // **Validates: Requirements 3.7, 3.10**
  test("all mounted Home pages retain independent offsets when revisited", () => {
    const samples = observeUnfixedPageOffsetHistory("Overview", [
      { type: "scroll", offset: 180 },
      { type: "visit", tab: "Transactions" },
      { type: "scroll", offset: 75 },
      { type: "visit", tab: "Overview" },
    ]);

    expect(samples).toEqual([
      { tab: "Overview", offset: 0 },
      { tab: "Overview", offset: 180 },
      { tab: "Transactions", offset: 0 },
      { tab: "Transactions", offset: 75 },
      { tab: "Overview", offset: 180 },
    ]);
  });

  // **Validates: Requirements 3.7**
  test("generated page visits retain each page's last native offset", () => {
    fc.assert(
      fc.property(
        tabArbitrary,
        fc.nat({ max: 2_000 }),
        tabArbitrary,
        fc.nat({ max: 2_000 }),
        (initialTab, initialOffset, otherTab, otherOffset) => {
          fc.pre(otherTab !== initialTab);
          const samples = observeUnfixedPageOffsetHistory(initialTab, [
            { type: "scroll", offset: initialOffset },
            { type: "visit", tab: otherTab },
            { type: "scroll", offset: otherOffset },
            { type: "visit", tab: initialTab },
          ]);
          expect(samples.at(-1)).toEqual({ tab: initialTab, offset: initialOffset });
        },
      ),
      { seed: 20250315, numRuns: 100 },
    );
  });

  // **Validates: Requirements 3.8**
  test("carousel-origin gestures preserve parent pager inactivity", () => {
    const input: BaselineGestureInput = {
      startTab: "Overview",
      translationX: -240,
      translationY: 0,
      velocityX: -1800,
      completion: "end",
      enabled: true,
      pointerCount: 1,
      startsInCarousel: true,
    };
    expectSelectionUnchanged(input);
    expect(observeUnfixedNonBugGesture(input).carouselRetained).toBe(true);
  });

  // **Validates: Requirements 3.6**
  test.each([
    { tab: "Overview" as const, canGoBack: false, handled: false, tabAfter: "Overview", hapticCount: 0 },
    { tab: "Transactions" as const, canGoBack: true, handled: false, tabAfter: "Transactions", hapticCount: 0 },
    { tab: "Insights" as const, canGoBack: false, handled: true, tabAfter: "Overview", hapticCount: 1 },
  ])("records Android back behavior for $tab with history=$canGoBack", (sample) => {
    expect(observeUnfixedAndroidBack(sample.tab, sample.canGoBack)).toEqual({
      handled: sample.handled,
      tabAfter: sample.tabAfter,
      hapticCount: sample.hapticCount,
    });
  });

  // **Validates: Requirements 3.6**
  test("generated Android back inputs defer to history and reset only an owned non-Overview Home page", () => {
    fc.assert(
      fc.property(tabArbitrary, fc.boolean(), (tab, canGoBack) => {
        const result = observeUnfixedAndroidBack(tab, canGoBack);
        const shouldHandle = tab !== "Overview" && !canGoBack;
        expect(result.handled).toBe(shouldHandle);
        expect(result.tabAfter).toBe(shouldHandle ? "Overview" : tab);
        expect(result.hapticCount).toBe(shouldHandle ? 1 : 0);
      }),
      { seed: 20250315, numRuns: 100 },
    );
  });

  // **Validates: Requirements 3.2**
  test.each([
    { top: 0, bottom: 0 },
    { top: 24, bottom: 16 },
    { top: 47, bottom: 34 },
    { top: 60, bottom: 48 },
  ])("records safe-area geometry for top=$top and bottom=$bottom", ({ top, bottom }) => {
    expect(observeUnfixedSafeArea(top, bottom)).toEqual({
      headerPaddingTop: top + 14,
      overviewContentPaddingBottom: bottom + 108,
      transactionsContentPaddingBottom: bottom + 108,
      insightsContentPaddingBottom: bottom + 108,
      dockHeight: bottom + 115,
    });
  });

  // **Validates: Requirements 3.2**
  test("generated safe areas preserve header and page/dock clearance", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -48, max: 96 }),
        fc.integer({ min: -48, max: 96 }),
        (top, bottom) => {
          const result = observeUnfixedSafeArea(top, bottom);
          const clampedTop = Math.max(0, top);
          const clampedBottom = Math.max(0, bottom);
          expect(result.headerPaddingTop).toBe(clampedTop + 14);
          expect(result.overviewContentPaddingBottom).toBe(clampedBottom + 108);
          expect(result.transactionsContentPaddingBottom).toBe(clampedBottom + 108);
          expect(result.insightsContentPaddingBottom).toBe(clampedBottom + 108);
          expect(result.dockHeight).toBe(clampedBottom + 115);
        },
      ),
      { seed: 20250315, numRuns: 150 },
    );
  });

  // **Validates: Requirements 3.3**
  test("reduced motion keeps near-immediate, non-offset outcomes", () => {
    expect(observeUnfixedReducedMotion(true)).toEqual({
      pageInitialOpacity: 1,
      pageInitialTranslateMultiplier: 0,
      pageTransitionDurationMs: 1,
      headingTransitionDurationMs: 1,
      headingTranslateYWhenSelected: 0,
      aiScaleWhenActive: 1,
      aiTransitionDurationMs: 1,
    });
    expect(observeUnfixedReducedMotion(false).pageTransitionDurationMs).toBe(210);
  });

  // **Validates: Requirements 3.3**
  test("generated motion preferences preserve understandable final state", () => {
    fc.assert(
      fc.property(fc.boolean(), (enabled) => {
        const result = observeUnfixedReducedMotion(enabled);
        expect(result.pageTransitionDurationMs).toBe(enabled ? 1 : 210);
        expect(result.headingTransitionDurationMs).toBe(enabled ? 1 : 180);
        expect(result.aiTransitionDurationMs).toBe(enabled ? 1 : 200);
        if (enabled) {
          expect(result.pageInitialOpacity).toBe(1);
          expect(result.headingTranslateYWhenSelected).toBe(0);
          expect(result.aiScaleWhenActive).toBe(1);
        }
      }),
      { seed: 20250315, numRuns: 50 },
    );
  });

  // **Validates: Requirements 3.1, 3.5, 3.9**
  test("valid requests commit immediately in the observed baseline, same-target requests no-op, and last wins", () => {
    expect(
      observeUnfixedRequestSequence("Overview", [
        "Overview",
        "Transactions",
        "Transactions",
        "Insights",
      ]),
    ).toEqual({
      committedTab: "Insights",
      routeTab: "Insights",
      selectedTab: "Insights",
      commits: ["Transactions", "Insights"],
    });
  });

  // **Validates: Requirements 3.9, 3.10**
  test("records valid and invalid external route-param behavior without redefining it", () => {
    expect(observeUnfixedExternalParam("Overview", "Transactions")).toEqual({
      activeTab: "Transactions",
      mountedPageCount: 3,
      setParamsValue: null,
    });
    expect(observeUnfixedExternalParam("Overview", "Unknown")).toEqual({
      activeTab: "Overview",
      mountedPageCount: 3,
      setParamsValue: null,
    });
  });

  // **Validates: Requirements 3.9, 3.10**
  test("generated invalid params preserve the settled page without route mutation", () => {
    fc.assert(
      fc.property(
        tabArbitrary,
        fc.oneof(fc.string(), fc.integer(), fc.constant(null), fc.constant(undefined)),
        (currentTab, param) => {
          fc.pre(!BASELINE_MAIN_TABS.includes(param as BaselineMainTab));
          expect(observeUnfixedExternalParam(currentTab, param)).toEqual({
            activeTab: currentTab,
            mountedPageCount: 3,
            setParamsValue: null,
          });
        },
      ),
      { seed: 20250315, numRuns: 150 },
    );
  });

  // **Validates: Requirements 3.4**
  test("generated committed indices expose exactly one page to touch and screen-reader traversal", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 }), (generatedIndex) => {
        const settledIndex = generatedIndex as HomePageIndex;
        const states = ([0, 1, 2] as const).map((pageIndex) =>
          pageTraversalState(settledIndex, pageIndex),
        );
        expect(states.filter((state) => state.pointerEvents === "auto")).toHaveLength(1);
        expect(states.filter((state) => !state.accessibilityElementsHidden)).toHaveLength(1);
        expect(states.filter((state) => state.importantForAccessibility === "auto")).toHaveLength(1);
      }),
      { seed: 20250315, numRuns: 100 },
    );
  });

  // **Validates: Requirements 3.9, 3.10**
  test("a settled page remains canonical across blur and resume", () => {
    fc.assert(
      fc.property(tabArbitrary, (tab) => {
        expect(observeUnfixedLifecycleAtSettledState(tab)).toEqual({
          beforeBlur: tab,
          afterBlur: tab,
          afterResume: tab,
          routeTab: tab,
          selectedTab: tab,
        });
      }),
      { seed: 20250315, numRuns: 50 },
    );
  });

  // **Validates: Requirements 3.7, 3.9, 3.10**
  test("generated width changes realign all mounted pages without changing state or haptics", () => {
    fc.assert(
      fc.property(
        tabArbitrary,
        fc.integer({ min: 280, max: 600 }),
        fc.integer({ min: 280, max: 600 }),
        (tab, previousWidth, nextWidth) => {
          const result = observeUnfixedWidthChange(tab, previousWidth, nextWidth);
          const index = BASELINE_MAIN_TABS.indexOf(tab);
          expect(result.tab).toBe(tab);
          expect(result.routeTab).toBe(tab);
          expect(result.selectedTab).toBe(tab);
          expect(result.previousTrackX).toBe(index === 0 ? 0 : -index * previousWidth);
          expect(result.nextTrackX).toBe(index === 0 ? 0 : -index * nextWidth);
          expect(result.mountedPageCount).toBe(3);
          expect(result.hapticCount).toBe(0);
        },
      ),
      { seed: 20250315, numRuns: 150 },
    );
  });

  // **Validates: Requirements 3.5, 3.7, 3.8, 3.9, 3.10**
  test("generated non-bug gestures never change settled, route, selected, history, or haptic state", () => {
    const vertical = fc.record({
      startTab: tabArbitrary,
      translationX: fc.integer({ min: -24, max: 24 }),
      translationY: fc.oneof(fc.integer({ min: -500, max: -15 }), fc.integer({ min: 15, max: 500 })),
      velocityX: fc.integer({ min: -3000, max: 3000 }),
      completion: fc.constant<"fail">("fail"),
      enabled: fc.constant(true),
      pointerCount: fc.constant(1),
      startsInCarousel: fc.constant(false),
    });
    const canceledOrFailed = fc.record({
      startTab: tabArbitrary,
      translationX: fc.integer({ min: -600, max: 600 }),
      translationY: fc.integer({ min: -14, max: 14 }),
      velocityX: fc.integer({ min: -3000, max: 3000 }),
      completion: fc.constantFrom<"cancel" | "fail">("cancel", "fail"),
      enabled: fc.boolean(),
      pointerCount: fc.integer({ min: 1, max: 2 }),
      startsInCarousel: fc.boolean(),
    });
    const disabledOrMultiTouch = fc.record({
      startTab: tabArbitrary,
      translationX: fc.integer({ min: -600, max: 600 }),
      translationY: fc.integer({ min: -14, max: 14 }),
      velocityX: fc.integer({ min: -3000, max: 3000 }),
      completion: fc.constant<"end">("end"),
      enabled: fc.boolean(),
      pointerCount: fc.integer({ min: 1, max: 3 }),
      startsInCarousel: fc.boolean(),
    }).filter(({ enabled, pointerCount, startsInCarousel }) => !enabled || pointerCount !== 1 || startsInCarousel);
    const sameTargetOrOutwardEdge = fc.oneof(
      fc.record({
        startTab: tabArbitrary,
        translationX: fc.integer({ min: -55, max: 55 }),
        translationY: fc.integer({ min: -14, max: 14 }),
        velocityX: fc.constant(0),
        completion: fc.constant<"end">("end"),
        enabled: fc.constant(true),
        pointerCount: fc.constant(1),
        startsInCarousel: fc.constant(false),
      }),
      fc.record({
        startTab: fc.constant<BaselineMainTab>("Overview"),
        translationX: fc.integer({ min: 56, max: 800 }),
        translationY: fc.integer({ min: -14, max: 14 }),
        velocityX: fc.integer({ min: 0, max: 3000 }),
        completion: fc.constant<"end">("end"),
        enabled: fc.constant(true),
        pointerCount: fc.constant(1),
        startsInCarousel: fc.constant(false),
      }),
      fc.record({
        startTab: fc.constant<BaselineMainTab>("Insights"),
        translationX: fc.integer({ min: -800, max: -56 }),
        translationY: fc.integer({ min: -14, max: 14 }),
        velocityX: fc.integer({ min: -3000, max: 0 }),
        completion: fc.constant<"end">("end"),
        enabled: fc.constant(true),
        pointerCount: fc.constant(1),
        startsInCarousel: fc.constant(false),
      }),
    );

    fc.assert(
      fc.property(
        fc.oneof(vertical, canceledOrFailed, disabledOrMultiTouch, sameTargetOrOutwardEdge),
        (input) => expectSelectionUnchanged(input),
      ),
      { seed: 20250315, numRuns: 250 },
    );
  });

  // **Validates: Requirements 3.5, 3.9, 3.10**
  test("generated request sequences keep route and accessibility selection synchronized", () => {
    fc.assert(
      fc.property(
        tabArbitrary,
        fc.array(tabArbitrary, { maxLength: 30 }),
        (initialTab, requests) => {
          const result = observeUnfixedRequestSequence(initialTab, requests);
          const expected = requests.at(-1) ?? initialTab;
          expect(result.committedTab).toBe(expected);
          expect(result.routeTab).toBe(expected);
          expect(result.selectedTab).toBe(expected);
          expect(result.commits.every((tab, index) => index === 0 || tab !== result.commits[index - 1])).toBe(true);
        },
      ),
      { seed: 20250315, numRuns: 200 },
    );
  });
});
