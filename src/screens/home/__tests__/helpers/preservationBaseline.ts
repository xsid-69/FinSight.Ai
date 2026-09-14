export const BASELINE_MAIN_TABS = ["Overview", "Transactions", "Insights"] as const;

export type BaselineMainTab = (typeof BASELINE_MAIN_TABS)[number];
export type GestureCompletion = "end" | "cancel" | "fail";

const CONTENT_DOCK_CLEARANCE = 108;
const HEADER_TOP_PADDING = 14;
const DOCK_BODY_TOP = 59;
const DOCK_BAR_HEIGHT = 56;

function indexOfTab(tab: BaselineMainTab): number {
  return BASELINE_MAIN_TABS.indexOf(tab);
}

export interface BaselineGestureInput {
  startTab: BaselineMainTab;
  translationX: number;
  translationY: number;
  velocityX: number;
  completion: GestureCompletion;
  enabled: boolean;
  pointerCount: number;
  startsInCarousel: boolean;
}

/**
 * Observation model for the current partial HomePager. It has no parent pan writer,
 * so non-bug-condition gestures leave every discrete state and haptic count unchanged.
 */
export function observeUnfixedNonBugGesture(input: BaselineGestureInput) {
  return {
    settledTab: input.startTab,
    routeTab: input.startTab,
    selectedTab: input.startTab,
    hapticCount: 0,
    parentPagerActivated: false,
    verticalScrollRetained: Math.abs(input.translationY) > Math.abs(input.translationX),
    carouselRetained: input.startsInCarousel,
  } as const;
}

export type PageOffsetEvent =
  | { type: "visit"; tab: BaselineMainTab }
  | { type: "scroll"; offset: number };

/** Records the mounted width-three baseline, where each page retains its own native offset. */
export function observeUnfixedPageOffsetHistory(
  initialTab: BaselineMainTab,
  events: readonly PageOffsetEvent[],
) {
  let mountedTab = initialTab;
  const offsets = new Map<BaselineMainTab, number>(
    BASELINE_MAIN_TABS.map((tab) => [tab, 0]),
  );
  const samples: Array<{ tab: BaselineMainTab; offset: number }> = [
    { tab: mountedTab, offset: offsets.get(mountedTab)! },
  ];

  for (const event of events) {
    if (event.type === "visit") {
      mountedTab = event.tab;
    } else {
      offsets.set(mountedTab, Math.max(0, event.offset));
    }
    samples.push({ tab: mountedTab, offset: offsets.get(mountedTab)! });
  }

  return samples;
}

export function observeUnfixedRequestSequence(
  initialTab: BaselineMainTab,
  requests: readonly BaselineMainTab[],
) {
  let committedTab = initialTab;
  const commits: BaselineMainTab[] = [];

  for (const request of requests) {
    if (request === committedTab) continue;
    committedTab = request;
    commits.push(request);
  }

  return { committedTab, routeTab: committedTab, selectedTab: committedTab, commits };
}

export function observeUnfixedExternalParam(currentTab: BaselineMainTab, param: unknown) {
  const activeTab = BASELINE_MAIN_TABS.includes(param as BaselineMainTab)
    ? (param as BaselineMainTab)
    : currentTab;

  return {
    activeTab,
    mountedPageCount: BASELINE_MAIN_TABS.length,
    setParamsValue: null,
  };
}

export function observeUnfixedAndroidBack(tab: BaselineMainTab, canGoBack: boolean) {
  const handled = tab !== "Overview" && !canGoBack;
  return {
    handled,
    tabAfter: handled ? ("Overview" as const) : tab,
    hapticCount: handled ? 1 : 0,
  };
}

export function observeUnfixedSafeArea(topInset: number, bottomInset: number) {
  const top = Math.max(0, topInset);
  const bottom = Math.max(0, bottomInset);
  return {
    headerPaddingTop: top + HEADER_TOP_PADDING,
    overviewContentPaddingBottom: bottom + CONTENT_DOCK_CLEARANCE,
    transactionsContentPaddingBottom: bottom + CONTENT_DOCK_CLEARANCE,
    insightsContentPaddingBottom: bottom + CONTENT_DOCK_CLEARANCE,
    dockHeight: DOCK_BODY_TOP + DOCK_BAR_HEIGHT + bottom,
  };
}

export function observeUnfixedReducedMotion(enabled: boolean) {
  return {
    pageInitialOpacity: enabled ? 1 : 0.75,
    pageInitialTranslateMultiplier: enabled ? 0 : 18,
    pageTransitionDurationMs: enabled ? 1 : 210,
    headingTransitionDurationMs: enabled ? 1 : 180,
    headingTranslateYWhenSelected: enabled ? 0 : -5,
    aiScaleWhenActive: enabled ? 1 : 1.025,
    aiTransitionDurationMs: enabled ? 1 : 200,
  };
}

export function observeUnfixedLifecycleAtSettledState(tab: BaselineMainTab) {
  return {
    beforeBlur: tab,
    afterBlur: tab,
    afterResume: tab,
    routeTab: tab,
    selectedTab: tab,
  };
}

export function observeUnfixedWidthChange(
  tab: BaselineMainTab,
  previousWidth: number,
  nextWidth: number,
) {
  const index = indexOfTab(tab);
  const safePreviousWidth = Number.isFinite(previousWidth) && previousWidth > 0 ? previousWidth : 0;
  const safeNextWidth = Number.isFinite(nextWidth) && nextWidth > 0 ? nextWidth : 0;

  return {
    tab,
    routeTab: tab,
    selectedTab: tab,
    previousTrackX: index === 0 ? 0 : -index * safePreviousWidth,
    nextTrackX: index === 0 ? 0 : -index * safeNextWidth,
    mountedPageCount: BASELINE_MAIN_TABS.length,
    hapticCount: 0,
  };
}
