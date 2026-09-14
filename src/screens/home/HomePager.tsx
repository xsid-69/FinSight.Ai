import React, { type ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";

import {
  HOME_PAGER_TABS,
  homeTabToIndex,
  isMainTab,
  useOptionalHomePagerCoordinator,
  type HomePagerAnimationRequest,
} from "./HomePagerCoordinator";
import {
  directDragProgress,
  settleTarget,
  trackXForProgress,
  type HomePageIndex,
} from "./homePagerMath";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export const EXPECTED_RUNTIME_REVISION = "swipe-dock-header-curve-v2";

export interface HomePagerProps {
  /** The last successfully settled Home tab. Invalid external values fall back to Overview. */
  settledTab: unknown;
  /** Callback when a settlement successfully completes and commits. */
  onCommitTab?: (tab: string) => void;
  /** Shared progress reference. */
  pageProgress?: SharedValue<number>;
  /** Pages in Overview, Transactions, Insights order. */
  pages: readonly [ReactNode, ReactNode, ReactNode];
  /** Optional deterministic width used by focused tests; runtime uses the current window width. */
  pageWidth?: number;
}

export interface HomePagerPageTraversalState {
  readonly pointerEvents: "auto" | "none";
  readonly accessibilityElementsHidden: boolean;
  readonly importantForAccessibility: "auto" | "no-hide-descendants";
}

export function validatedSettledIndex(tab: unknown): HomePageIndex {
  return isMainTab(tab) ? homeTabToIndex(tab) : 0;
}

/**
 * Runtime track clamp. Keeping this worklet local to the pager ensures gesture and style writes
 * can never reveal a blank edge or move more than one page from the captured settled index.
 * Numeric bounds are local literals so the serialized UI function has no module-global dependency.
 */
export function clampMountedTrackProgress(
  settledIndex: HomePageIndex,
  progress: number,
): number {
  "worklet";

  const safeProgress = Number.isFinite(progress) ? progress : settledIndex;
  const globallyClamped = Math.min(2, Math.max(0, safeProgress));
  const localMinimum = Math.max(0, settledIndex - 1);
  const localMaximum = Math.min(2, settledIndex + 1);
  return Math.min(localMaximum, Math.max(localMinimum, globallyClamped));
}

export function pageTraversalState(
  settledIndex: HomePageIndex,
  pageIndex: HomePageIndex,
): HomePagerPageTraversalState {
  const isSettledPage = pageIndex === settledIndex;
  return {
    pointerEvents: isSettledPage ? "auto" : "none",
    accessibilityElementsHidden: !isSettledPage,
    importantForAccessibility: isSettledPage ? "auto" : "no-hide-descendants",
  };
}

/**
 * A width-three Home track with continuous RNGH gesture tracking, distance-and-velocity settlement,
 * and coordinator integration.
 */
export function HomePager({
  settledTab,
  onCommitTab,
  pageProgress: externalProgress,
  pages,
  pageWidth,
}: HomePagerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const settledIndex = validatedSettledIndex(settledTab);
  const resolvedPageWidth =
    typeof pageWidth === "number" && Number.isFinite(pageWidth) && pageWidth > 0
      ? pageWidth
      : windowWidth;

  const localProgress = useSharedValue<number>(settledIndex);
  const pageProgress = externalProgress ?? localProgress;
  const reducedMotion = useReducedMotion();
  const coordinator = useOptionalHomePagerCoordinator();
  const registerPager = coordinator?.registerPager;
  const requestPage = coordinator?.requestPage;

  const startDragIndex = useSharedValue<HomePageIndex>(settledIndex);
  const gestureAccepted = useSharedValue(false);
  const gestureReachedEnd = useSharedValue(false);
  const requestAnimationActive = useSharedValue(false);
  const currentRequestRef = useRef<HomePagerAnimationRequest | null>(null);

  const animateWithoutCommit = useCallback(
    (targetIndex: HomePageIndex) => {
      cancelAnimation(pageProgress);
      pageProgress.value = reducedMotion
        ? withTiming(targetIndex, { duration: 1, easing: Easing.out(Easing.quad) })
        : withSpring(targetIndex, {
            stiffness: 260,
            damping: 28,
            mass: 0.9,
            overshootClamping: true,
          });
    },
    [pageProgress, reducedMotion],
  );

  const handleSwipeRelease = useCallback(
    (targetIndex: HomePageIndex, changed: boolean) => {
      if (changed) {
        void Haptics.selectionAsync();
      }

      const request = requestPage?.(HOME_PAGER_TABS[targetIndex], "swipe", changed);
      if (!request) {
        animateWithoutCommit(targetIndex);
      }
    },
    [animateWithoutCommit, requestPage],
  );

  const finishRegisteredRequest = useCallback(
    (token: number, finished: boolean) => {
      const request = currentRequestRef.current;
      if (!request || request.token !== token) return;

      currentRequestRef.current = null;
      requestAnimationActive.value = false;
      const result = request.complete(finished === true);
      if (finished !== true && result === "canceled") {
        animateWithoutCommit(settledIndex);
      }
    },
    [animateWithoutCommit, requestAnimationActive, settledIndex],
  );

  useEffect(() => {
    if (!registerPager) {
      pageProgress.value = settledIndex;
    }
  }, [pageProgress, registerPager, settledIndex]);

  useEffect(() => {
    if (!registerPager) return;

    const unregister = registerPager({
      onRequest: (request) => {
        currentRequestRef.current = request;
        requestAnimationActive.value = true;
        cancelAnimation(pageProgress);

        const targetIndex = request.targetIndex;
        const requestToken = request.token;
        const completion = (finished?: boolean) => {
          "worklet";
          scheduleOnRN(finishRegisteredRequest, requestToken, finished === true);
        };

        if (reducedMotion) {
          pageProgress.value = withTiming(
            targetIndex,
            { duration: 1, easing: Easing.out(Easing.quad) },
            completion,
          );
        } else if (request.source === "swipe") {
          pageProgress.value = withSpring(
            targetIndex,
            {
              stiffness: 260,
              damping: 28,
              mass: 0.9,
              overshootClamping: true,
            },
            completion,
          );
        } else {
          pageProgress.value = withTiming(
            targetIndex,
            { duration: 280, easing: Easing.out(Easing.quad) },
            completion,
          );
        }
      },
      onCommit: (commit) => {
        onCommitTab?.(commit.target);
      },
    });

    return () => {
      currentRequestRef.current = null;
      requestAnimationActive.value = false;
      gestureAccepted.value = false;
      unregister();
      cancelAnimation(pageProgress);
    };
  }, [
    finishRegisteredRequest,
    gestureAccepted,
    onCommitTab,
    pageProgress,
    reducedMotion,
    registerPager,
    requestAnimationActive,
  ]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(true)
        .activeOffsetX([-12, 12])
        .failOffsetY([-10, 10])
        .minPointers(1)
        .maxPointers(1)
        .averageTouches(true)
        .onStart(() => {
          if (requestAnimationActive.value) {
            gestureAccepted.value = false;
            return;
          }

          gestureAccepted.value = true;
          gestureReachedEnd.value = false;
          cancelAnimation(pageProgress);
          startDragIndex.value = settledIndex;
          pageProgress.value = settledIndex;
        })
        .onUpdate((event) => {
          if (!gestureAccepted.value) return;
          pageProgress.value = directDragProgress(
            startDragIndex.value,
            event.translationX,
            resolvedPageWidth,
          );
        })
        .onEnd((event) => {
          if (!gestureAccepted.value) return;

          // Once onEnd has selected a target, a later finalize caused by React reconciliation or
          // recognizer replacement must never reinterpret the successful release as cancellation.
          gestureReachedEnd.value = true;
          const targetIndex = settleTarget(
            startDragIndex.value,
            event.translationX,
            event.velocityX,
            resolvedPageWidth,
          );
          const changed = targetIndex !== startDragIndex.value;
          scheduleOnRN(handleSwipeRelease, targetIndex, changed);
        })
        .onFinalize((_event, success) => {
          if (!gestureAccepted.value) return;
          gestureAccepted.value = false;
          if (gestureReachedEnd.value || success) return;

          const targetIndex = startDragIndex.value;
          pageProgress.value = reducedMotion
            ? withTiming(targetIndex, { duration: 1, easing: Easing.out(Easing.quad) })
            : withSpring(targetIndex, {
                stiffness: 260,
                damping: 28,
                mass: 0.9,
                overshootClamping: true,
              });
        }),
    [
      gestureAccepted,
      gestureReachedEnd,
      handleSwipeRelease,
      pageProgress,
      reducedMotion,
      requestAnimationActive,
      resolvedPageWidth,
      settledIndex,
      startDragIndex,
    ],
  );

  const trackStyle = useAnimatedStyle<ViewStyle>(() => {
    const progress = clampMountedTrackProgress(settledIndex, pageProgress.value);
    return {
      transform: [{ translateX: trackXForProgress(progress, resolvedPageWidth) }],
    };
  }, [resolvedPageWidth, settledIndex]);

  return (
    <GestureDetector gesture={panGesture}>
      <View
        testID="home-pager-runtime-swipe-dock-header-curve-v2"
        style={styles.viewport}
      >
        <Animated.View
          testID="home-pager-track"
          style={[
            styles.track,
            { width: resolvedPageWidth * HOME_PAGER_TABS.length },
            trackStyle,
          ]}
        >
          {HOME_PAGER_TABS.map((tab, index) => {
            const pageIndex = index as HomePageIndex;
            const traversal = pageTraversalState(settledIndex, pageIndex);

            return (
              <View
                key={tab}
                testID={`home-pager-page-${tab.toLowerCase()}`}
                style={[styles.page, { width: resolvedPageWidth }]}
                pointerEvents={traversal.pointerEvents}
                accessibilityElementsHidden={traversal.accessibilityElementsHidden}
                importantForAccessibility={traversal.importantForAccessibility}
              >
                {React.isValidElement(pages[pageIndex])
                  ? React.cloneElement(pages[pageIndex] as React.ReactElement<any>, {
                      parentPagerGesture: panGesture,
                    })
                  : pages[pageIndex]}
              </View>
            );
          })}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  track: {
    flex: 1,
    flexDirection: "row",
  },
  page: {
    flex: 1,
  },
});
