import type { ReactNode } from "react";

interface MockGestureRecord {
  readonly kind: "pan" | "native";
  readonly calls: Record<string, unknown[]>;
  readonly callbacks: Record<string, ((...args: unknown[]) => void) | undefined>;
}

interface MockAnimation {
  readonly kind: "spring" | "timing";
  readonly target: number;
  readonly callback?: (finished?: boolean) => void;
}

const mockGestureRecords: MockGestureRecord[] = [];
const mockAnimations: MockAnimation[] = [];
const mockCancelAnimation = jest.fn();
let mockReducedMotion = false;

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");

  const createGesture = (kind: "pan" | "native") => {
    const record: MockGestureRecord = { kind, calls: {}, callbacks: {} };
    mockGestureRecords.push(record);
    const gesture: Record<string, unknown> = { __kind: kind };
    const configurationMethods = [
      "enabled",
      "activeOffsetX",
      "failOffsetY",
      "minPointers",
      "maxPointers",
      "averageTouches",
    ];
    const callbackMethods = ["onStart", "onUpdate", "onEnd", "onFinalize"];

    configurationMethods.forEach((method) => {
      gesture[method] = (...args: unknown[]) => {
        record.calls[method] = args;
        return gesture;
      };
    });
    callbackMethods.forEach((method) => {
      gesture[method] = (callback: (...args: unknown[]) => void) => {
        record.callbacks[method] = callback;
        return gesture;
      };
    });
    gesture.blocksExternalGesture = () => gesture;
    return gesture;
  };

  return {
    Gesture: {
      Pan: () => createGesture("pan"),
      Native: () => createGesture("native"),
    },
    GestureDetector: ({ children }: { children: ReactNode }) =>
      React.createElement(View, { testID: "gesture-detector" }, children),
  };
});

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (initialValue: number) => {
      const ref = React.useRef({ value: initialValue });
      return ref.current;
    },
    useAnimatedStyle: (updater: () => Record<string, unknown>) => updater(),
    cancelAnimation: (...args: unknown[]) => mockCancelAnimation(...args),
    withSpring: (
      target: number,
      _config?: unknown,
      callback?: (finished?: boolean) => void,
    ) => {
      mockAnimations.push({ kind: "spring", target, callback });
      return target;
    },
    withTiming: (
      target: number,
      _config?: unknown,
      callback?: (finished?: boolean) => void,
    ) => {
      mockAnimations.push({ kind: "timing", target, callback });
      return target;
    },
    Easing: {
      out: (easing: unknown) => easing,
      quad: (value: number) => value,
    },
  };
});

jest.mock("react-native-worklets", () => ({
  scheduleOnRN: <Args extends unknown[]>(
    callback: (...args: Args) => unknown,
    ...args: Args
  ) => callback(...args),
}));

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => mockReducedMotion,
}));

import React from "react";
import { Text } from "react-native";
import { act, render } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import type { SharedValue } from "react-native-reanimated";

import { HomePager } from "../HomePager";
import { HomePagerCoordinatorProvider } from "../HomePagerCoordinator";

const PAGE_WIDTH = 390;

function latestPan(): MockGestureRecord {
  const record = [...mockGestureRecords].reverse().find(({ kind }) => kind === "pan");
  if (!record) throw new Error("Expected HomePager to create a pan gesture");
  return record;
}

function invokeGesture(record: MockGestureRecord, name: string, ...args: unknown[]): void {
  const callback = record.callbacks[name];
  if (!callback) throw new Error(`Expected pan gesture callback ${name}`);
  callback(...args);
}

function pages() {
  return [<Text key="overview">Overview</Text>, <Text key="transactions">Transactions</Text>, <Text key="insights">Insights</Text>] as const;
}

describe("HomePager SDK 57 worklet boundary", () => {
  beforeEach(() => {
    mockGestureRecords.length = 0;
    mockAnimations.length = 0;
    mockCancelAnimation.mockClear();
    mockReducedMotion = false;
    jest.mocked(Haptics.selectionAsync).mockClear();
  });

  test("configures one-pointer Android pan arbitration and writes direct progress on update", async () => {
    const progress = { value: 0 } as SharedValue<number>;
    await render(
      <HomePager
        settledTab="Overview"
        pageProgress={progress}
        pageWidth={PAGE_WIDTH}
        pages={pages()}
      />,
    );

    const pan = latestPan();
    expect(pan.calls.enabled).toEqual([true]);
    expect(pan.calls.activeOffsetX).toEqual([[-12, 12]]);
    expect(pan.calls.failOffsetY).toEqual([[-10, 10]]);
    expect(pan.calls.minPointers).toEqual([1]);
    expect(pan.calls.maxPointers).toEqual([1]);
    expect(pan.calls.averageTouches).toEqual([true]);

    await act(async () => {
      invokeGesture(pan, "onStart", {});
      invokeGesture(pan, "onUpdate", { translationX: -PAGE_WIDTH * 0.3 });
    });

    expect(progress.value).toBeCloseTo(0.3);
  });

  test("uses velocity settlement, a spring, one haptic, and commits only after latest completion", async () => {
    const progress = { value: 1 } as SharedValue<number>;
    const onCommitTab = jest.fn();
    await render(
      <HomePagerCoordinatorProvider initialTab="Transactions">
        <HomePager
          settledTab="Transactions"
          onCommitTab={onCommitTab}
          pageProgress={progress}
          pageWidth={PAGE_WIDTH}
          pages={pages()}
        />
      </HomePagerCoordinatorProvider>,
    );

    const pan = latestPan();
    await act(async () => {
      invokeGesture(pan, "onStart", {});
      invokeGesture(pan, "onUpdate", { translationX: 70 });
      invokeGesture(pan, "onEnd", { translationX: 70, velocityX: 1200 });
      invokeGesture(pan, "onFinalize", {}, false);
    });

    expect(jest.mocked(Haptics.selectionAsync)).toHaveBeenCalledTimes(1);
    expect(mockAnimations).toHaveLength(1);
    expect(mockAnimations[0]).toMatchObject({ kind: "spring", target: 0 });
    expect(onCommitTab).not.toHaveBeenCalled();

    await act(async () => {
      mockAnimations[0].callback?.(true);
    });

    expect(onCommitTab).toHaveBeenCalledTimes(1);
    expect(onCommitTab).toHaveBeenCalledWith("Overview");
  });

  test("returns a canceled gesture to its committed index without haptic or commit", async () => {
    const progress = { value: 1 } as SharedValue<number>;
    const onCommitTab = jest.fn();
    await render(
      <HomePagerCoordinatorProvider initialTab="Transactions">
        <HomePager
          settledTab="Transactions"
          onCommitTab={onCommitTab}
          pageProgress={progress}
          pageWidth={PAGE_WIDTH}
          pages={pages()}
        />
      </HomePagerCoordinatorProvider>,
    );

    const pan = latestPan();
    await act(async () => {
      invokeGesture(pan, "onStart", {});
      invokeGesture(pan, "onUpdate", { translationX: -120 });
      invokeGesture(pan, "onFinalize", {}, false);
    });

    expect(progress.value).toBe(1);
    expect(mockAnimations.at(-1)).toMatchObject({ kind: "spring", target: 1 });
    expect(jest.mocked(Haptics.selectionAsync)).not.toHaveBeenCalled();
    expect(onCommitTab).not.toHaveBeenCalled();
  });
});
