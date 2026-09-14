import {
  directDragProgress,
  headingProximity,
  interpolateHeadingCenter,
  projectRelease,
  settleTarget,
  trackXForProgress,
} from "./homePagerMath";
import { buildClosedFillPath, buildTopBorderPath } from "../../components/finsight/FloatingDock";

export const EXPLORATION_MAIN_TABS = ["Overview", "Transactions", "Insights"] as const;

export type ExplorationMainTab = (typeof EXPLORATION_MAIN_TABS)[number];

const AI_BUTTON_SIZE = 58;
const CONTROL_HEIGHT = 84;
const ICON_CENTER_Y = 29;
const LABEL_TOP = 66;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function tabAt(index: number): ExplorationMainTab {
  return EXPLORATION_MAIN_TABS[clamp(Math.round(index), 0, EXPLORATION_MAIN_TABS.length - 1)];
}

export interface PagerFrameInput {
  startIndex: number;
  pageWidth: number;
  translationX: number;
  headingCenters?: readonly [number, number, number];
}

/**
 * Samples the geometry exposed by the mounted HomePager while a drag is held.
 */
export function sampleUnfixedPagerFrame(input: PagerFrameInput) {
  const startIndex = clamp(Math.round(input.startIndex), 0, EXPLORATION_MAIN_TABS.length - 1);
  const centers = input.headingCenters
    ?? ([input.pageWidth * 0.2, input.pageWidth * 0.5, input.pageWidth * 0.8] as const);
  const expectedProgress = directDragProgress(
    startIndex,
    input.translationX,
    input.pageWidth,
  );
  const pageProgress = expectedProgress;
  const trackX = trackXForProgress(pageProgress, input.pageWidth);
  const direction = Math.sign(expectedProgress - startIndex);
  const adjacentIndex = startIndex + direction;

  return {
    hasPanWriter: true,
    progressAuthority: "direct-drag" as const,
    pageProgress,
    expectedProgress,
    trackX,
    expectedTrackX: trackX,
    activePageX: trackX + startIndex * input.pageWidth,
    adjacentPageX:
      direction !== 0 && adjacentIndex >= 0 && adjacentIndex < EXPLORATION_MAIN_TABS.length
        ? trackX + adjacentIndex * input.pageWidth
        : null,
    expectedAdjacentPageX:
      direction !== 0 && adjacentIndex >= 0 && adjacentIndex < EXPLORATION_MAIN_TABS.length
        ? trackX + adjacentIndex * input.pageWidth
        : null,
    mountedTabs: [...EXPLORATION_MAIN_TABS] as ExplorationMainTab[],
    routeTab: tabAt(startIndex),
    selectedTab: tabAt(startIndex),
    headingProximity: EXPLORATION_MAIN_TABS.map((_, index) =>
      headingProximity(pageProgress, index),
    ),
    expectedHeadingProximity: EXPLORATION_MAIN_TABS.map((_, index) =>
      headingProximity(expectedProgress, index),
    ),
    bumpX: interpolateHeadingCenter(pageProgress, centers, input.pageWidth),
    expectedBumpX: interpolateHeadingCenter(expectedProgress, centers, input.pageWidth),
  };
}

export interface PagerReleaseInput extends PagerFrameInput {
  velocityX: number;
}

export function expectedSettleTarget(input: PagerReleaseInput): number {
  return settleTarget(
    input.startIndex,
    input.translationX,
    input.velocityX,
    input.pageWidth,
  );
}

/**
 * Samples the active pager's release capability.
 */
export function sampleUnfixedPagerRelease(input: PagerReleaseInput) {
  const startIndex = clamp(Math.round(input.startIndex), 0, 2);
  const requiredRelease = projectRelease(
    startIndex,
    input.translationX,
    input.velocityX,
    input.pageWidth,
  );

  return {
    hasParentPan: true,
    hasPanWriter: true,
    hasReleaseHandler: true,
    hasFinalizeHandler: true,
    targetIndex: expectedSettleTarget(input),
    requiredTargetIndex: expectedSettleTarget(input),
    projectedPages: requiredRelease.projectedPages,
    routeTabBeforeRelease: tabAt(startIndex),
    routeTabDuringReleaseHandler: tabAt(startIndex),
    selectedTabDuringReleaseHandler: tabAt(startIndex),
    commitPhase: "none" as const,
  };
}

export function sampleUnfixedChangedPageRequest(
  startIndex: number,
  targetIndex: number,
) {
  const start = clamp(Math.round(startIndex), 0, 2);
  return {
    pageProgressDuringHandler: start,
    routeTabBeforeHandler: tabAt(start),
    routeTabDuringHandler: tabAt(start),
    selectedTabDuringHandler: tabAt(start),
    commitPhase: "settlement-complete",
    hasSettlementCompletion: true,
  } as const;
}

/** Reports the geometry declared by FloatingDock. */
export function sampleUnfixedDock(width: number, bottomInset = 0) {
  const notchValleyY = 64;
  const notchHalf = Math.min(62, Math.max(20, (width - 36) / 2));
  const fillPath = buildClosedFillPath(width, bottomInset);

  return {
    width,
    bottomInset,
    overviewIconCenterY: ICON_CENTER_Y,
    aiIconCenterY: ICON_CENTER_Y,
    insightsIconCenterY: ICON_CENTER_Y,
    overviewLabelTop: LABEL_TOP,
    aiLabelTop: LABEL_TOP,
    insightsLabelTop: LABEL_TOP,
    aiButtonBottomY: AI_BUTTON_SIZE,
    notchValleyY,
    notchClearance: notchValleyY - AI_BUTTON_SIZE,
    shoulderLeftX: width / 2 - notchHalf,
    shoulderRightX: width / 2 + notchHalf,
    path: fillPath,
    svgNodeTypes: ["Svg", "Path", "Path"] as const,
    curveDecorationNodeCount: 0,
    closedPathCarriesBorderStroke: false,
    fillPathCount: 1,
    openBorderPathCount: 1,
  };
}

/** Samples the Overview-to-carousel contract. */
export function sampleUnfixedCarouselArbitration(repeatedDragsBeforeJsCallback: number) {
  return {
    parentPagerGesturePresent: true,
    nativeBlocksExternalGesture: true,
    parentEnabledBeforeJsCallbacks: Array.from(
      { length: Math.max(0, repeatedDragsBeforeJsCallback) },
      () => false,
    ),
    jsSuppressionBeginsAt: "gesture-blocks",
    parentActiveOffsetX: [-12, 12],
    parentFailOffsetY: [-10, 10],
  } as const;
}

export function isPagerBugCondition(input: PagerFrameInput): boolean {
  if (!Number.isFinite(input.pageWidth) || input.pageWidth <= 0) return false;
  const startIndex = clamp(Math.round(input.startIndex), 0, 2);
  const direction = Math.sign(-input.translationX);
  const pointsToAdjacent = (direction > 0 && startIndex < 2) || (direction < 0 && startIndex > 0);
  return input.translationX !== 0 && pointsToAdjacent;
}
