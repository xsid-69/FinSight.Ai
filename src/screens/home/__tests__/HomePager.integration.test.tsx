import type { ReactNode } from "react";

interface MockGestureRecord {
  readonly kind: "pan" | "native";
  readonly gesture: Record<string, unknown>;
  readonly calls: Record<string, unknown[]>;
  readonly callbacks: Record<string, ((...args: unknown[]) => void) | undefined>;
  blockedGesture?: unknown;
}

interface MockAnimation {
  readonly kind: "spring" | "timing";
  readonly target: number;
  readonly callback?: (finished?: boolean) => void;
}

type AnimatedUpdater = (() => Record<string, unknown>) & {
  readonly __closure?: Record<string, unknown>;
};

const mockGestureRecords: MockGestureRecord[] = [];
const mockAnimations: MockAnimation[] = [];
const mockAnimatedStyleUpdaters: AnimatedUpdater[] = [];
const mockAnimatedPropsUpdaters: AnimatedUpdater[] = [];
const mockSharedValues: Array<{ value: unknown }> = [];
const mockEventOrder: string[] = [];
let mockHardwareBackHandler: (() => boolean) | null = null;

const mockHomeNavigation = {
  navigate: jest.fn((route: string) => {
    mockEventOrder.push(`navigate:${route}`);
  }),
  setParams: jest.fn((params: { tab?: string }) => {
    mockEventOrder.push(`setParams:${params.tab ?? ""}`);
  }),
  canGoBack: jest.fn(() => false),
};

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");

  const createGesture = (kind: "pan" | "native") => {
    const gesture: Record<string, unknown> = { __kind: kind };
    const record: MockGestureRecord = { kind, gesture, calls: {}, callbacks: {} };
    mockGestureRecords.push(record);

    const configurationMethods = [
      "enabled",
      "activeOffsetX",
      "failOffsetY",
      "minPointers",
      "maxPointers",
      "averageTouches",
    ];
    const callbackMethods = ["onBegin", "onStart", "onUpdate", "onEnd", "onFinalize"];

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
    gesture.blocksExternalGesture = (external: unknown) => {
      record.blockedGesture = external;
      return gesture;
    };
    return gesture;
  };

  return {
    Gesture: {
      Pan: () => createGesture("pan"),
      Native: () => createGesture("native"),
    },
    GestureDetector: ({ children, gesture }: { children: ReactNode; gesture: unknown }) =>
      React.createElement(View, { testID: "gesture-detector", gesture }, children),
    GestureHandlerRootView: ({ children, ...props }: { children?: ReactNode }) =>
      React.createElement(View, { ...props, testID: "gesture-handler-root" }, children),
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
    useSharedValue: (value: unknown) => {
      const ref = React.useRef({ value });
      if (!mockSharedValues.includes(ref.current)) mockSharedValues.push(ref.current);
      return ref.current;
    },
    useAnimatedStyle: (updater: AnimatedUpdater) => {
      mockAnimatedStyleUpdaters.push(updater);
      return updater();
    },
    useAnimatedProps: (updater: AnimatedUpdater) => {
      mockAnimatedPropsUpdaters.push(updater);
      return updater();
    },
    cancelAnimation: jest.fn(),
    withTiming: (
      target: number,
      _config?: unknown,
      callback?: (finished?: boolean) => void,
    ) => {
      mockAnimations.push({ kind: "timing", target, callback });
      mockEventOrder.push(`animation:${target}`);
      return target;
    },
    withSpring: (
      target: number,
      _config?: unknown,
      callback?: (finished?: boolean) => void,
    ) => {
      mockAnimations.push({ kind: "spring", target, callback });
      mockEventOrder.push(`animation:${target}`);
      return target;
    },
    Easing: {
      out: (easing: unknown) => easing,
      quad: (value: number) => value,
      cubic: (value: number) => value,
    },
  };
});

jest.mock("react-native-worklets", () => ({
  scheduleOnRN: <Args extends unknown[]>(
    callback: (...args: Args) => unknown,
    ...args: Args
  ) => callback(...args),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const ReactNative = require("react-native");
  const normalizeViewProps = (props: Record<string, unknown>) => ({
    ...props,
    accessible:
      props.accessible ?? Boolean(props.accessibilityRole || props.accessibilityLabel || props.onPress),
  });
  const MockView = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.View, { ...normalizeViewProps(props), ref }),
  );
  const MockText = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.Text, { ...props, ref }),
  );
  const MockScrollView = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) =>
      React.createElement(ReactNative.ScrollView, { ...props, ref }),
  );
  const MockProvider = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
  const exports = {
    __esModule: true,
    View: MockView,
    XStack: MockView,
    YStack: MockView,
    Text: MockText,
    ScrollView: MockScrollView,
    TamaguiProvider: MockProvider,
    Theme: MockProvider,
  };
  return new Proxy(exports, {
    get: (target, property) =>
      property in target ? target[property as keyof typeof target] : MockView,
  });
});

jest.mock("@tamagui/lucide-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);
  return new Proxy(
    { __esModule: true },
    { get: (_target, property) => (property === "__esModule" ? true : Icon) },
  );
});

jest.mock("moti", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "Light" },
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, left: 0, right: 0, bottom: 24 }),
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");
  const component = (nodeType: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
      React.createElement(
        View,
        { ...props, ref, testID: props.testID ?? `svg-${nodeType}`, svgNodeType: nodeType },
        props.children,
      ),
    );
  const defaultSvg = component("Svg");
  return new Proxy(
    {
      __esModule: true,
      default: defaultSvg,
      Svg: defaultSvg,
    },
    {
      get: (target, property) => {
        if (property in target) return target[property as keyof typeof target];
        return component(String(property));
      },
    },
  );
});

jest.mock("../../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "integration-user", displayName: "Ada" },
    profile: null,
    logout: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock("../../../services/transactionService", () => ({
  loadPrivateTransactions: jest.fn().mockResolvedValue({
    transactions: [],
    ignoredCount: 0,
  }),
}));

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(callback, [callback]);
    },
    useIsFocused: () => true,
  };
});

import React from "react";
import { BackHandler, StyleSheet } from "react-native";
import { act, fireEvent, render } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { CurvedContentSurface, buildClosedFillPath, buildTopBorderPath } from "../../../components/banking/CurvedContentSurface";
import { FloatingDock } from "../../../components/finsight/FloatingDock";
import { HomeScreen } from "../../HomeScreen";
import { HomePagerCoordinatorProvider } from "../HomePagerCoordinator";
import { interpolateHeadingCenter } from "../homePagerMath";

const REQUIRED_RUNTIME_MARKERS = [
  "home-pager-runtime-swipe-dock-header-curve-v2",
  "home-pager-track",
  "home-pager-page-overview",
  "home-pager-page-transactions",
  "home-pager-page-insights",
  "home-header-runtime-swipe-dock-header-curve-v2",
  "home-content-curve-runtime-swipe-dock-header-curve-v2",
  "home-content-curve-fill-path",
  "home-content-curve-border-path",
] as const;

function bottomTabState(current: "Home" | "AI", homeTab = "Overview") {
  return {
    key: "tabs",
    index: current === "Home" ? 0 : 1,
    routeNames: ["Home", "AI"],
    history: [],
    stale: false,
    type: "tab",
    routes: [
      { key: "Home-key", name: "Home", params: { tab: homeTab } },
      { key: "AI-key", name: "AI" },
    ],
  } as any;
}

function latestPan(): MockGestureRecord {
  const pan = [...mockGestureRecords].reverse().find(({ kind }) => kind === "pan");
  if (!pan) throw new Error("Expected production HomePager pan gesture");
  return pan;
}

function invokeGesture(record: MockGestureRecord, callback: string, ...args: unknown[]): void {
  const handler = record.callbacks[callback];
  if (!handler) throw new Error(`Expected gesture callback ${callback}`);
  handler(...args);
}

function animationAt(index = mockAnimations.length - 1): MockAnimation {
  const animation = mockAnimations[index];
  if (!animation) throw new Error(`Expected animation at index ${index}`);
  return animation;
}

async function completeAnimation(animation: MockAnimation, finished = true): Promise<void> {
  await act(async () => {
    animation.callback?.(finished);
  });
}

async function renderHome(initialTab: "Overview" | "Transactions" | "Insights" = "Overview") {
  return render(
    <HomePagerCoordinatorProvider initialTab={initialTab}>
      <HomeScreen
        navigation={mockHomeNavigation}
        route={{ name: "Home", params: { tab: initialTab } }}
      />
    </HomePagerCoordinatorProvider>,
  );
}

function pagerWidth(screen: Awaited<ReturnType<typeof renderHome>>): number {
  const track = StyleSheet.flatten(screen.getByTestId("home-pager-track").props.style);
  return Number(track.width) / 3;
}

function sampledAnimatedStyles() {
  return mockAnimatedStyleUpdaters.map((updater) => ({ updater, value: updater() }));
}

function headingSamples() {
  return sampledAnimatedStyles().filter(
    ({ value }) => typeof value.opacity === "number" && Array.isArray(value.transform),
  );
}

function trackSample() {
  const sample = sampledAnimatedStyles().find(
    ({ value }) => value.opacity === undefined
      && Array.isArray(value.transform)
      && typeof (value.transform as Array<{ translateX?: unknown }>)[0]?.translateX === "number",
  );
  if (!sample) throw new Error("Expected animated pager track sample");
  return sample;
}

function curveSamples() {
  return mockAnimatedPropsUpdaters
    .map((updater) => ({ updater, value: updater() }))
    .filter(({ value }) => typeof value.d === "string");
}

describe("HomePager integration with production composition", () => {
  beforeEach(() => {
    mockGestureRecords.length = 0;
    mockAnimations.length = 0;
    mockAnimatedStyleUpdaters.length = 0;
    mockAnimatedPropsUpdaters.length = 0;
    mockSharedValues.length = 0;
    mockEventOrder.length = 0;
    mockHardwareBackHandler = null;
    jest.clearAllMocks();
    mockHomeNavigation.navigate.mockImplementation((route: string) => {
      mockEventOrder.push(`navigate:${route}`);
    });
    mockHomeNavigation.setParams.mockImplementation((params: { tab?: string }) => {
      mockEventOrder.push(`setParams:${params.tab ?? ""}`);
    });
    mockHomeNavigation.canGoBack.mockReturnValue(false);
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, handler) => {
      mockHardwareBackHandler = () => handler({} as never) ?? false;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("mounts the real Home composition and every active runtime marker", async () => {
    const screen = await renderHome();

    REQUIRED_RUNTIME_MARKERS.forEach((testID) => {
      expect(screen.getByTestId(testID, { includeHiddenElements: true })).toBeTruthy();
    });
  });

  test("uses one exact shared-value reference for track, all headings, and both curve paths", async () => {
    const screen = await renderHome();
    const width = pagerWidth(screen);
    const sharedProgress = mockSharedValues[0];
    expect(sharedProgress).toBeDefined();

    const pan = latestPan();
    for (const fraction of [0.25, 0.5, 0.8]) {
      await act(async () => {
        invokeGesture(pan, "onStart", {});
        invokeGesture(pan, "onUpdate", { translationX: -width * fraction });
      });

      expect(sharedProgress.value).toBeCloseTo(fraction, 8);
      const track = trackSample();
      const headings = headingSamples().slice(0, 3);
      const curves = curveSamples().slice(0, 2);
      const expectedCenter = interpolateHeadingCenter(fraction, undefined, width);

      expect((track.value.transform as Array<{ translateX: number }>)[0].translateX)
        .toBeCloseTo(-width * fraction, 8);
      expect(headings.map(({ value }) => Number(value.opacity))).toEqual([
        0.72 + 0.28 * (1 - fraction),
        0.72 + 0.28 * fraction,
        0.72,
      ]);
      expect(curves.map(({ value }) => value.d)).toEqual(expect.arrayContaining([
        buildClosedFillPath(width, expectedCenter),
        buildTopBorderPath(width, expectedCenter),
      ]));

      const progressReferences = [track, ...headings, ...curves]
        .map(({ updater }) => updater.__closure?.pageProgress)
        .filter((value) => value !== undefined);
      expect(progressReferences).toHaveLength(6);
      progressReferences.forEach((reference) => expect(reference).toBe(sharedProgress));
    }
  });

  test.each([
    { fraction: 0.25, target: 0, commits: false },
    { fraction: 0.5, target: 1, commits: true },
    { fraction: 0.8, target: 1, commits: true },
  ])("samples a $fraction drag and settles to page $target", async ({ fraction, target, commits }) => {
    const screen = await renderHome();
    const width = pagerWidth(screen);
    const pan = latestPan();

    await act(async () => {
      invokeGesture(pan, "onStart", {});
      invokeGesture(pan, "onUpdate", { translationX: -width * fraction });
      invokeGesture(pan, "onEnd", { translationX: -width * fraction, velocityX: 0 });
      invokeGesture(pan, "onFinalize", {}, false);
    });

    expect(animationAt()).toMatchObject({ kind: "spring", target });
    expect(mockHomeNavigation.setParams).not.toHaveBeenCalled();
    if (!commits) {
      expect(animationAt().callback).toBeUndefined();
      expect(Haptics.selectionAsync).not.toHaveBeenCalled();
      return;
    }

    expect(animationAt().callback).toEqual(expect.any(Function));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    await completeAnimation(animationAt());
    expect(mockHomeNavigation.setParams).toHaveBeenCalledWith({ tab: "Transactions" });
    expect(screen.getByTestId("home-pager-page-transactions").props.pointerEvents).toBe("auto");
  });

  test("a successful 80% onEnd remains authoritative when followed by a false finalize", async () => {
    const screen = await renderHome();
    const width = pagerWidth(screen);
    const pan = latestPan();

    await act(async () => {
      invokeGesture(pan, "onStart", {});
      invokeGesture(pan, "onUpdate", { translationX: -width * 0.8 });
      invokeGesture(pan, "onEnd", { translationX: -width * 0.8, velocityX: 0 });
      invokeGesture(pan, "onFinalize", {}, false);
    });

    expect(mockAnimations).toHaveLength(1);
    expect(animationAt()).toMatchObject({ kind: "spring", target: 1 });
    expect(mockGestureRecords.filter(({ kind }) => kind === "pan")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Overview" }).props.accessibilityState)
      .toEqual({ selected: true });
    expect(mockHomeNavigation.setParams).not.toHaveBeenCalled();

    await completeAnimation(animationAt());
    expect(screen.getByRole("tab", { name: "Transactions" }).props.accessibilityState)
      .toEqual({ selected: true });
    expect(mockHomeNavigation.setParams).toHaveBeenCalledTimes(1);
  });

  test("a short valid velocity flick settles to the adjacent page", async () => {
    const screen = await renderHome();
    const width = pagerWidth(screen);
    const pan = latestPan();

    await act(async () => {
      invokeGesture(pan, "onStart", {});
      invokeGesture(pan, "onUpdate", { translationX: -40 });
      invokeGesture(pan, "onEnd", { translationX: -40, velocityX: -width * 3 });
      invokeGesture(pan, "onFinalize", {}, true);
    });

    expect(animationAt()).toMatchObject({ kind: "spring", target: 1 });
  });

  test("header requests stay pending, keep the recognizer stable, and commit only on explicit completion", async () => {
    const screen = await renderHome();
    const initialPan = latestPan().gesture;

    await fireEvent.press(screen.getByRole("tab", { name: "Transactions" }));
    await fireEvent.press(screen.getByRole("tab", { name: "Transactions" }));

    expect(mockAnimations).toHaveLength(1);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(animationAt()).toMatchObject({ kind: "timing", target: 1 });
    expect(latestPan().gesture).toBe(initialPan);
    expect(screen.getByRole("tab", { name: "Overview" }).props.accessibilityState)
      .toEqual({ selected: true });
    expect(mockHomeNavigation.setParams).not.toHaveBeenCalled();

    await completeAnimation(animationAt());
    expect(mockHomeNavigation.setParams).toHaveBeenCalledWith({ tab: "Transactions" });
    expect(screen.getByRole("tab", { name: "Transactions" }).props.accessibilityState)
      .toEqual({ selected: true });
  });

  test("dock Home targets and AI each have one action owner and preserve navigation semantics", async () => {
    const screen = await render(
      <HomePagerCoordinatorProvider initialTab="Overview">
        <HomeScreen
          navigation={mockHomeNavigation}
          route={{ name: "Home", params: { tab: "Overview" } }}
        />
        <FloatingDock
          state={bottomTabState("Home")}
          navigation={mockHomeNavigation as any}
          descriptors={{} as any}
          insets={{ top: 0, right: 0, bottom: 24, left: 0 }}
        />
      </HomePagerCoordinatorProvider>,
    );

    expect(screen.getAllByRole("tab", { name: "FinSight AI" })).toHaveLength(1);
    expect(screen.getAllByTestId("floating-dock-ai")).toHaveLength(1);
    expect(screen.getByTestId("floating-dock-runtime-swipe-dock-header-curve-v2").props.pointerEvents)
      .toBe("box-none");

    await fireEvent.press(screen.getByTestId("floating-dock-insights"));
    expect(animationAt()).toMatchObject({ kind: "timing", target: 2 });
    expect(mockHomeNavigation.setParams).not.toHaveBeenCalled();

    await completeAnimation(animationAt());
    expect(mockHomeNavigation.setParams).toHaveBeenCalledWith({ tab: "Insights" });

    await fireEvent.press(screen.getByTestId("floating-dock-ai"));
    expect(mockHomeNavigation.navigate).toHaveBeenCalledWith("AI");
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  test("a Home target requested from AI starts settlement before navigating Home", async () => {
    const screen = await render(
      <HomePagerCoordinatorProvider initialTab="Overview">
        <HomeScreen
          navigation={mockHomeNavigation}
          route={{ name: "Home", params: { tab: "Overview" } }}
        />
        <FloatingDock
          state={bottomTabState("AI")}
          navigation={mockHomeNavigation as any}
          descriptors={{} as any}
          insets={{ top: 0, right: 0, bottom: 24, left: 0 }}
        />
      </HomePagerCoordinatorProvider>,
    );

    mockEventOrder.length = 0;
    await fireEvent.press(screen.getByTestId("floating-dock-insights"));

    expect(mockEventOrder.slice(0, 2)).toEqual(["animation:2", "navigate:Home"]);
    expect(mockAnimations).toHaveLength(1);
    expect(mockHomeNavigation.setParams).not.toHaveBeenCalled();
  });

  test("in-page Home destinations use the same pending settlement instead of early route params", async () => {
    const screen = await renderHome();

    await fireEvent.press(screen.getByRole("button", {
      name: "View message connection status",
    }));

    expect(animationAt()).toMatchObject({ kind: "timing", target: 1 });
    expect(mockHomeNavigation.navigate).not.toHaveBeenCalledWith("Home", expect.anything());
    expect(mockHomeNavigation.setParams).not.toHaveBeenCalled();

    await completeAnimation(animationAt());
    expect(mockHomeNavigation.setParams).toHaveBeenCalledWith({ tab: "Transactions" });
  });

  test("Android back requests Overview through the same post-settlement pipeline", async () => {
    const screen = await renderHome("Transactions");
    expect(mockHardwareBackHandler).toEqual(expect.any(Function));

    let owned = false;
    await act(async () => {
      owned = mockHardwareBackHandler?.() ?? false;
    });

    expect(owned).toBe(true);
    expect(animationAt()).toMatchObject({ kind: "timing", target: 0 });
    expect(mockHomeNavigation.setParams).not.toHaveBeenCalled();
    await completeAnimation(animationAt());
    expect(mockHomeNavigation.setParams).toHaveBeenCalledWith({ tab: "Overview" });
    expect(screen.getByTestId("home-pager-page-overview").props.pointerEvents).toBe("auto");
  });

  test("curve and dock decorative layers cannot own presses", async () => {
    const screen = await render(
      <>
        <CurvedContentSurface bumpX={195}>
          <></>
        </CurvedContentSurface>
        <FloatingDock
          state={bottomTabState("Home")}
          navigation={mockHomeNavigation as any}
          descriptors={{} as any}
          insets={{ top: 0, right: 0, bottom: 24, left: 0 }}
        />
      </>,
    );

    expect(screen.getByTestId("home-content-curve-touch-layer").props.pointerEvents)
      .toBe("box-none");
    expect(screen.getByTestId("home-content-curve-runtime-swipe-dock-header-curve-v2").props.pointerEvents)
      .toBe("none");
    expect(screen.getByTestId("floating-dock-fill-path").parent?.props.pointerEvents)
      .toBe("none");
    expect(screen.getAllByRole("tab", { name: "Overview" })).toHaveLength(1);
    expect(screen.getAllByRole("tab", { name: "Insights" })).toHaveLength(1);
    expect(screen.getAllByRole("tab", { name: "FinSight AI" })).toHaveLength(1);
  });
});
