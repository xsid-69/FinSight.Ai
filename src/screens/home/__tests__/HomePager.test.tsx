jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");

  const createGesture = (kind: string) => {
    const gesture: Record<string, unknown> = { __kind: kind };
    const fluent = [
      "enabled",
      "activeOffsetX",
      "failOffsetY",
      "minPointers",
      "maxPointers",
      "averageTouches",
      "onBegin",
      "onStart",
      "onUpdate",
      "onEnd",
      "onFinalize",
    ];
    fluent.forEach((method) => {
      gesture[method] = () => gesture;
    });
    gesture.blocksExternalGesture = () => gesture;
    return gesture;
  };

  return {
    Gesture: {
      Pan: () => createGesture("pan"),
      Native: () => createGesture("native"),
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: "gesture-detector" }, children),
    GestureHandlerRootView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, { ...props, testID: "gesture-handler-root" }, children),
  };
});

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

import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import { render } from "@testing-library/react-native";
import fc from "fast-check";

import {
  HomePager,
  clampMountedTrackProgress,
  pageTraversalState,
  validatedSettledIndex,
} from "../HomePager";
import type { HomePageIndex } from "../homePagerMath";

const PAGE_WIDTH = 390;

function page(label: string) {
  return <Text>{label}</Text>;
}

describe("HomePager mounted track", () => {
  test("mounts all three pages in canonical order with exact width-three geometry", async () => {
    const screen = await render(
      <HomePager
        settledTab="Transactions"
        pageWidth={PAGE_WIDTH}
        pages={[page("Overview page"), page("Transactions page"), page("Insights page")]}
      />,
    );

    expect(screen.getByText("Overview page", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("Transactions page")).toBeTruthy();
    expect(screen.getByText("Insights page", { includeHiddenElements: true })).toBeTruthy();

    const trackStyle = StyleSheet.flatten(screen.getByTestId("home-pager-track").props.style);
    expect(trackStyle.width).toBe(PAGE_WIDTH * 3);
    expect(trackStyle.transform).toEqual([{ translateX: -PAGE_WIDTH }]);

    ["overview", "transactions", "insights"].forEach((tab) => {
      const pageStyle = StyleSheet.flatten(
        screen.getByTestId(`home-pager-page-${tab}`, { includeHiddenElements: true }).props.style,
      );
      expect(pageStyle.width).toBe(PAGE_WIDTH);
    });
  });

  test("keeps page instances mounted when the settled page changes", async () => {
    const mountCounts = new Map<string, number>();
    const unmountCounts = new Map<string, number>();

    function StatefulPage({ label }: { label: string }) {
      useEffect(() => {
        mountCounts.set(label, (mountCounts.get(label) ?? 0) + 1);
        return () => {
          unmountCounts.set(label, (unmountCounts.get(label) ?? 0) + 1);
        };
      }, [label]);
      return <Text>{label}</Text>;
    }

    const pages = [
      <StatefulPage key="Overview" label="Overview state" />,
      <StatefulPage key="Transactions" label="Transactions state" />,
      <StatefulPage key="Insights" label="Insights state" />,
    ] as const;
    const screen = await render(
      <HomePager settledTab="Overview" pageWidth={PAGE_WIDTH} pages={pages} />,
    );

    await screen.rerender(
      <HomePager settledTab="Insights" pageWidth={PAGE_WIDTH} pages={pages} />,
    );

    expect(Object.fromEntries(mountCounts)).toEqual({
      "Overview state": 1,
      "Transactions state": 1,
      "Insights state": 1,
    });
    expect(unmountCounts.size).toBe(0);
  });

  test("exposes pointer and accessibility traversal only for the committed page", async () => {
    const screen = await render(
      <HomePager
        settledTab="Transactions"
        pageWidth={PAGE_WIDTH}
        pages={[page("Overview page"), page("Transactions page"), page("Insights page")]}
      />,
    );

    const overview = screen.getByTestId("home-pager-page-overview", { includeHiddenElements: true });
    const transactions = screen.getByTestId("home-pager-page-transactions");
    const insights = screen.getByTestId("home-pager-page-insights", { includeHiddenElements: true });

    expect(overview.props).toMatchObject({
      pointerEvents: "none",
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    });
    expect(transactions.props).toMatchObject({
      pointerEvents: "auto",
      accessibilityElementsHidden: false,
      importantForAccessibility: "auto",
    });
    expect(insights.props).toMatchObject({
      pointerEvents: "none",
      accessibilityElementsHidden: true,
      importantForAccessibility: "no-hide-descendants",
    });
  });

  test("falls back to the Overview page for an invalid settled tab", async () => {
    const screen = await render(
      <HomePager
        settledTab="Unknown"
        pageWidth={PAGE_WIDTH}
        pages={[page("Overview page"), page("Transactions page"), page("Insights page")]}
      />,
    );

    const trackStyle = StyleSheet.flatten(screen.getByTestId("home-pager-track").props.style);
    expect(validatedSettledIndex("Unknown")).toBe(0);
    expect(trackStyle.transform).toEqual([{ translateX: 0 }]);
    expect(screen.getByTestId("home-pager-page-overview").props.pointerEvents).toBe("auto");
  });

  // **Validates: Requirements 2.1, 3.10**
  test("property: track progress is finite, globally clamped, and at most one adjacent page away", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        fc.oneof(
          fc.double({ noNaN: true, noDefaultInfinity: true }),
          fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY),
        ),
        (generatedStart, progress) => {
          const start = generatedStart as HomePageIndex;
          const clamped = clampMountedTrackProgress(start, progress);

          expect(Number.isFinite(clamped)).toBe(true);
          expect(clamped).toBeGreaterThanOrEqual(0);
          expect(clamped).toBeLessThanOrEqual(2);
          expect(Math.abs(clamped - start)).toBeLessThanOrEqual(1);
        },
      ),
      { seed: 20250320, numRuns: 200 },
    );
  });

  // **Validates: Requirements 3.1, 3.5**
  test("property: exactly one mounted page owns pointer and accessibility traversal", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 }), (generatedSettledIndex) => {
        const settledIndex = generatedSettledIndex as HomePageIndex;
        const states = ([0, 1, 2] as const).map((pageIndex) =>
          pageTraversalState(settledIndex, pageIndex),
        );

        expect(states.filter((state) => state.pointerEvents === "auto")).toHaveLength(1);
        expect(states.filter((state) => !state.accessibilityElementsHidden)).toHaveLength(1);
        expect(states[settledIndex]).toEqual({
          pointerEvents: "auto",
          accessibilityElementsHidden: false,
          importantForAccessibility: "auto",
        });
      }),
      { seed: 20250321, numRuns: 100 },
    );
  });
});
