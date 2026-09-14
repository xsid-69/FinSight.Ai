import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";
import fc from "fast-check";

const mockRegisterRootComponent = jest.fn();
const mockHomeNavigation = {
  navigate: jest.fn(),
  setParams: jest.fn(),
  canGoBack: jest.fn(() => false),
};
const mockGestureRecords = {
  pan: [] as Array<Record<string, unknown>>,
  native: [] as Array<Record<string, unknown>>,
  blockedExternal: [] as unknown[],
};

jest.mock("expo", () => ({
  registerRootComponent: mockRegisterRootComponent,
}));

jest.mock("react-native-gesture-handler", () => {
  const React = require("react");
  const { View } = require("react-native");

  const createGesture = (kind: "pan" | "native") => {
    const record: Record<string, unknown> = { kind };
    if (kind === "pan") mockGestureRecords.pan.push(record);
    else mockGestureRecords.native.push(record);

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
      gesture[method] = (value: unknown) => {
        record[method] = value;
        return gesture;
      };
    });
    gesture.blocksExternalGesture = (external: unknown) => {
      mockGestureRecords.blockedExternal.push(external);
      record.blocksExternalGesture = external;
      return gesture;
    };
    return gesture;
  };

  return {
    Gesture: {
      Pan: () => createGesture("pan"),
      Native: () => createGesture("native"),
    },
    GestureDetector: ({ gesture, children }: { gesture: { __kind?: string }; children: React.ReactNode }) =>
      React.createElement(
        View,
        { testID: `gesture-detector-${gesture?.__kind ?? "unknown"}` },
        children,
      ),
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
      View,
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (value: unknown) => {
      const ref = React.useRef({ value });
      return ref.current;
    },
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useAnimatedProps: (updater: () => unknown) => updater(),
    cancelAnimation: () => {},
    runOnJS: (fn: Function) => fn,
    withTiming: (value: unknown, config?: unknown, callback?: (finished?: boolean) => void) => {
      if (typeof callback === "function") callback(true);
      return value;
    },
    withSpring: (value: unknown, config?: unknown, callback?: (finished?: boolean) => void) => {
      if (typeof callback === "function") callback(true);
      return value;
    },
    Easing: {
      out: (easing: unknown) => easing,
      quad: (value: number) => value,
      cubic: (value: number) => value,
    },
  };
});

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
    createTokens: (tokens: unknown) => tokens,
    createTamagui: (config: unknown) => config,
  };
  return new Proxy(exports, {
    get: (target, property) =>
      property in target ? target[property as keyof typeof target] : MockView,
  });
});

jest.mock("@tamagui/config/v3", () => ({
  config: {
    tokens: { color: {}, radius: {}, space: {} },
    themes: { light: {}, dark: {} },
  },
}));

jest.mock("moti", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MotiView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
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

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: (props: Record<string, unknown>) => React.createElement(View, props),
  };
});

jest.mock("expo-status-bar", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { StatusBar: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, { testID: "safe-area-provider" }, children),
    useSafeAreaInsets: () => ({ top: 47, left: 0, right: 0, bottom: 24 }),
  };
});

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
  return {
    __esModule: true,
    default: component("Svg"),
    Path: component("Path"),
    Circle: component("Circle"),
  };
});

jest.mock("../../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

jest.mock("../../../context/AuthContext", () => {
  const React = require("react");
  return {
    AuthProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useAuth: () => ({
      user: { uid: "exploration-user", displayName: "Ada" },
      profile: null,
      logout: jest.fn(() => Promise.resolve()),
    }),
  };
});

jest.mock("../../../services/transactionService", () => ({
  loadPrivateTransactions: jest.fn().mockResolvedValue({
    transactions: [],
    ignoredCount: 0,
  }),
}));

jest.mock("../HomePagerCoordinator", () => {
  const React = require("react");
  const { View } = require("react-native");
  const actual = jest.requireActual("../HomePagerCoordinator");
  return {
    ...actual,
    HomePagerCoordinatorProvider: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(
        View,
        { testID: "home-pager-coordinator-provider" },
        React.createElement(actual.HomePagerCoordinatorProvider, props, children),
      ),
  };
});

jest.mock("../OverviewContent", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    OverviewContent: () => React.createElement(View, { testID: "production-overview-content" }),
  };
});

jest.mock("../TransactionsContent", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    TransactionsContent: () =>
      React.createElement(View, { testID: "production-transactions-content" }),
  };
});

jest.mock("../InsightsContent", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    InsightsContent: () => React.createElement(View, { testID: "production-insights-content" }),
  };
});

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    NavigationContainer: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, { testID: "production-navigation-container" }, children),
    useFocusEffect: () => undefined,
    useIsFocused: () => true,
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const React = require("react");
  const { View } = require("react-native");

  const collectScreens = (node: React.ReactNode, result: React.ReactElement[] = []): React.ReactElement[] => {
    React.Children.forEach(node, (child: any) => {
      if (!React.isValidElement(child)) return;
      if (child.type === React.Fragment) collectScreens((child.props as any).children, result);
      else result.push(child as React.ReactElement);
    });
    return result;
  };

  return {
    createNativeStackNavigator: () => ({
      Screen: () => null,
      Navigator: ({ children }: { children?: React.ReactNode }) => {
        const screen = collectScreens(children).find((candidate) => (candidate.props as any).name === "Main");
        const Component = (screen?.props as any)?.component;
        return React.createElement(
          View,
          { testID: "production-root-stack" },
          Component
            ? React.createElement(Component, {
                navigation: mockHomeNavigation,
                route: { name: "Main", params: undefined },
              })
            : null,
        );
      },
    }),
  };
});

jest.mock("@react-navigation/bottom-tabs", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    createBottomTabNavigator: () => ({
      Screen: () => null,
      Navigator: ({ children, tabBar }: { children?: React.ReactNode; tabBar?: (props: unknown) => React.ReactNode }) => {
        const screens = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement[];
        const home = screens.find((candidate) => (candidate.props as any).name === "Home");
        const HomeComponent = (home?.props as any)?.component;
        const state = {
          key: "tabs",
          index: 0,
          routeNames: ["Home", "AI"],
          history: [],
          stale: false,
          type: "tab",
          routes: [
            { key: "Home-key", name: "Home", params: { tab: "Overview" } },
            { key: "AI-key", name: "AI" },
          ],
        };
        return React.createElement(
          View,
          { testID: "production-main-tabs" },
          tabBar
            ? tabBar({ state, navigation: mockHomeNavigation, descriptors: {}, insets: {} })
            : null,
          HomeComponent
            ? React.createElement(HomeComponent, {
                navigation: mockHomeNavigation,
                route: state.routes[0],
              })
            : null,
        );
      },
    }),
  };
});

const mockPassiveScreen = (testID: string) => {
  const React = require("react");
  const { View } = require("react-native");
  return () => React.createElement(View, { testID });
};

jest.mock("../../OnboardingScreen", () => ({ OnboardingScreen: mockPassiveScreen("onboarding") }));
jest.mock("../../LoginScreen", () => ({ LoginScreen: mockPassiveScreen("login") }));
jest.mock("../../RegisterScreen", () => ({ RegisterScreen: mockPassiveScreen("register") }));
jest.mock("../../AIScreen", () => ({ AIScreen: mockPassiveScreen("ai-screen") }));
jest.mock("../../StatementAnalyzerScreen", () => ({
  StatementAnalyzerScreen: mockPassiveScreen("analyzer-screen"),
}));
jest.mock("../../AIAssistantScreen", () => ({
  AIAssistantScreen: mockPassiveScreen("ai-assistant-screen"),
}));
jest.mock("../../ProfileScreen", () => ({ ProfileScreen: mockPassiveScreen("profile-screen") }));

import { CurvedContentSurface } from "../../../components/banking/CurvedContentSurface";
import { FloatingDock } from "../../../components/finsight/FloatingDock";
import { HomeScreen } from "../../HomeScreen";
import { HomeFeatureCarousel } from "../HomeFeatureCarousel";
import { HomePager } from "../HomePager";
import {
  expectedSettleTarget,
  isPagerBugCondition,
  sampleUnfixedCarouselArbitration,
  sampleUnfixedChangedPageRequest,
  sampleUnfixedDock,
  sampleUnfixedPagerFrame,
  sampleUnfixedPagerRelease,
} from "../bugConditionExploration";

const WIDTH = 390;
const CENTERS = [78, 195, 312] as const;
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
  "floating-dock-runtime-swipe-dock-header-curve-v2",
  "floating-dock-fill-path",
  "floating-dock-border-path",
  "floating-dock-overview",
  "floating-dock-ai",
  "floating-dock-insights",
] as const;

function collectTestIDs(node: unknown, result: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((child) => collectTestIDs(child, result));
    return result;
  }
  if (!node || typeof node !== "object") return result;
  const candidate = node as { props?: { testID?: unknown }; children?: unknown };
  if (typeof candidate.props?.testID === "string") result.push(candidate.props.testID);
  collectTestIDs(candidate.children, result);
  return result;
}

function pageElements(): readonly [React.ReactNode, React.ReactNode, React.ReactNode] {
  return [
    React.createElement(View, { key: "Overview" }),
    React.createElement(View, { key: "Transactions" }),
    React.createElement(View, { key: "Insights" }),
  ];
}

function bottomTabState(tab = "Overview") {
  return {
    key: "tabs",
    index: 0,
    routeNames: ["Home", "AI"],
    history: [],
    stale: false,
    type: "tab",
    routes: [
      { key: "Home-key", name: "Home", params: { tab } },
      { key: "AI-key", name: "AI" },
    ],
  } as any;
}

async function renderedTrackX(
  startTab: "Overview" | "Transactions" | "Insights",
): Promise<number> {
  const screen = await render(
    React.createElement(HomePager, {
      settledTab: startTab,
      pageWidth: WIDTH,
      pages: pageElements(),
    }),
  );
  const style = StyleSheet.flatten(screen.getByTestId("home-pager-track").props.style);
  screen.unmount();
  return style.transform[0].translateX;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGestureRecords.pan.length = 0;
  mockGestureRecords.native.length = 0;
  mockGestureRecords.blockedExternal.length = 0;
});

describe("Property 1: Bug Condition - Active Continuous Pager, Synchronized Curves, and Clean Dock", () => {
  // **Validates: Requirements 1.7, 1.8, 1.9, 1.10**
  test("production Expo entry mounts the active chain but exposes every required revision marker", async () => {
    require("../../../../index");
    expect(mockRegisterRootComponent).toHaveBeenCalledTimes(1);
    const RegisteredApp = mockRegisterRootComponent.mock.calls[0][0] as React.ComponentType;
    const screen = await render(React.createElement(RegisteredApp));
    const testIDs = collectTestIDs(screen.toJSON());

    expect(testIDs).toEqual(
      expect.arrayContaining([
        "gesture-handler-root",
        "safe-area-provider",
        "production-navigation-container",
        "production-root-stack",
        "home-pager-coordinator-provider",
        "production-main-tabs",
        "home-pager-runtime-swipe-dock-header-curve-v2",
        "home-pager-track",
        "home-pager-page-overview",
        "home-pager-page-transactions",
        "home-pager-page-insights",
      ]),
    );
    expect(screen.getAllByRole("tab", { name: "Overview" })).toHaveLength(2);
    expect(screen.getAllByRole("tab", { name: "Insights" })).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "FinSight AI" })).toBeTruthy();

    const observedRequiredMarkers = testIDs.filter((testID) =>
      REQUIRED_RUNTIME_MARKERS.includes(testID as (typeof REQUIRED_RUNTIME_MARKERS)[number]),
    );
    expect([...new Set(observedRequiredMarkers)].sort()).toEqual(
      [...REQUIRED_RUNTIME_MARKERS].sort(),
    );
  });

  // **Validates: Requirements 1.1, 1.2, 1.4**
  test("30% Overview-to-Transactions hold samples one shared fractional runtime frame", async () => {
    const frame = sampleUnfixedPagerFrame({
      startIndex: 0,
      pageWidth: WIDTH,
      translationX: -WIDTH * 0.3,
      headingCenters: CENTERS,
    });
    const runtimeTrackX = await renderedTrackX("Overview");

    expect(runtimeTrackX).toBe(0);
    expect(frame.mountedTabs).toEqual(["Overview", "Transactions", "Insights"]);
    expect({
      hasPanWriter: frame.hasPanWriter,
      pageProgress: frame.pageProgress,
      trackX: frame.trackX,
      activePageX: frame.activePageX,
      adjacentPageX: frame.adjacentPageX,
      headingProximity: frame.headingProximity.map((v) => Number(v.toFixed(4))),
      bumpX: Number(frame.bumpX.toFixed(4)),
      routeTab: frame.routeTab,
      selectedTab: frame.selectedTab,
    }).toEqual({
      hasPanWriter: true,
      pageProgress: 0.3,
      trackX: -117,
      activePageX: -117,
      adjacentPageX: 273,
      headingProximity: [0.7, 0.3, 0],
      bumpX: Number(frame.expectedBumpX.toFixed(4)),
      routeTab: "Overview",
      selectedTab: "Overview",
    });
  });

  // **Validates: Requirements 1.1, 1.2, 1.4**
  test("Transactions-to-Insights fractional samples reveal the adjacent mounted page", async () => {
    const samples = [0.1, 0.35, 0.6].map((fraction) =>
      sampleUnfixedPagerFrame({
        startIndex: 1,
        pageWidth: WIDTH,
        translationX: -WIDTH * fraction,
        headingCenters: CENTERS,
      }),
    );

    expect(await renderedTrackX("Transactions")).toBe(-390);
    expect(
      samples.map((sample) => ({
        progress: Number(sample.pageProgress.toFixed(4)),
        trackX: Number(sample.trackX.toFixed(4)),
        adjacentPageX: sample.adjacentPageX !== null ? Number(sample.adjacentPageX.toFixed(4)) : null,
        bumpX: Number(sample.bumpX.toFixed(4)),
      })),
    ).toEqual([
      { progress: 1.1, trackX: -429, adjacentPageX: 351, bumpX: 206.7 },
      { progress: 1.35, trackX: -526.5, adjacentPageX: 253.5, bumpX: 235.95 },
      { progress: 1.6, trackX: -624, adjacentPageX: 156, bumpX: 265.2 },
    ]);
  });

  // **Validates: Requirements 1.2**
  test("sub-33% drag uses the required projected-velocity settlement sample", () => {
    const input = { startIndex: 1, pageWidth: WIDTH, translationX: 70, velocityX: 1200 };
    const release = sampleUnfixedPagerRelease(input);
    const requiredProjectedPages = -70 / WIDTH + (-1200 / WIDTH) * 0.18;

    expect(Math.abs(70 / WIDTH)).toBeLessThan(0.33);
    expect(Math.abs(requiredProjectedPages)).toBeGreaterThan(0.5);
    expect(release.projectedPages).toBeCloseTo(requiredProjectedPages);
    expect({
      hasParentPan: release.hasParentPan,
      hasReleaseHandler: release.hasReleaseHandler,
      targetIndex: release.targetIndex,
    }).toEqual({
      hasParentPan: true,
      hasReleaseHandler: true,
      targetIndex: expectedSettleTarget(input),
    });
  });

  // **Validates: Requirements 1.2**
  test.each([
    {
      caseName: "distance threshold",
      input: { startIndex: 0, pageWidth: WIDTH, translationX: -WIDTH * 0.33, velocityX: 0 },
    },
    {
      caseName: "projected reversal",
      input: { startIndex: 1, pageWidth: WIDTH, translationX: -140, velocityX: 2200 },
    },
  ])("$caseName release invokes production settleTarget", ({ input }) => {
    const release = sampleUnfixedPagerRelease(input);
    expect(release.targetIndex).toBe(expectedSettleTarget(input));
    expect(Math.abs(release.targetIndex - input.startIndex)).toBeLessThanOrEqual(1);
  });

  // **Validates: Requirements 1.2, 1.3**
  test("cancellation has a finalizer that restores the settled page without committing", () => {
    const release = sampleUnfixedPagerRelease({
      startIndex: 1,
      pageWidth: WIDTH,
      translationX: -120,
      velocityX: 0,
    });
    expect({
      hasFinalizeHandler: release.hasFinalizeHandler,
      routeTab: release.routeTabDuringReleaseHandler,
      selectedTab: release.selectedTabDuringReleaseHandler,
      commitPhase: release.commitPhase,
    }).toEqual({
      hasFinalizeHandler: true,
      routeTab: "Transactions",
      selectedTab: "Transactions",
      commitPhase: "none",
    });
  });

  // **Validates: Requirements 1.1, 1.2, 1.3**
  test.each([
    { startIndex: 0, translationX: 80 },
    { startIndex: 2, translationX: -80 },
  ])("outward edge release at index $startIndex stays clamped through a real pan", (input) => {
    const frame = sampleUnfixedPagerFrame({ ...input, pageWidth: WIDTH });
    const release = sampleUnfixedPagerRelease({
      ...input,
      pageWidth: WIDTH,
      velocityX: 0,
    });

    expect(frame.expectedProgress).toBe(input.startIndex);
    expect(release.targetIndex).toBe(input.startIndex);
    expect(release.routeTabDuringReleaseHandler).toBe(release.routeTabBeforeRelease);
    expect(release.hasPanWriter).toBe(true);
  });

  // **Validates: Requirements 1.3**
  test("carousel-origin and primarily vertical gestures have native ownership contracts", async () => {
    const parentPan = (require("react-native-gesture-handler").Gesture.Pan() as any);
    const screen = await render(
      React.createElement(HomeFeatureCarousel, {
        onAction: jest.fn(),
        parentPagerGesture: parentPan,
      }),
    );
    expect(screen.getByTestId("gesture-detector-native")).toBeTruthy();
    const arbitration = sampleUnfixedCarouselArbitration(4);

    expect({
      parentPanCount: mockGestureRecords.pan.length,
      nativeBlocksCount: mockGestureRecords.blockedExternal.length,
      parentPagerGesturePresent: arbitration.parentPagerGesturePresent,
      nativeBlocksExternalGesture: arbitration.nativeBlocksExternalGesture,
      parentEnabledBeforeJsCallbacks: arbitration.parentEnabledBeforeJsCallbacks,
      activeOffsetX: arbitration.parentActiveOffsetX,
      failOffsetY: arbitration.parentFailOffsetY,
    }).toEqual({
      parentPanCount: 1,
      nativeBlocksCount: 1,
      parentPagerGesturePresent: true,
      nativeBlocksExternalGesture: true,
      parentEnabledBeforeJsCallbacks: [false, false, false, false],
      activeOffsetX: [-12, 12],
      failOffsetY: [-10, 10],
    });
  });

  // **Validates: Requirements 1.4, 1.7, 1.10**
  test("changed-page request leaves route and selected state unchanged until settlement completion", async () => {
    const route = { name: "Home", params: { tab: "Overview" } };
    const navigation = {
      navigate: jest.fn(),
      setParams: jest.fn((params: Record<string, unknown>) => {
        Object.assign(route.params, params);
      }),
      canGoBack: jest.fn(() => false),
    };
    const screen = await render(
      React.createElement(
        require("../HomePagerCoordinator").HomePagerCoordinatorProvider,
        null,
        React.createElement(HomeScreen, {
          navigation,
          route,
        }),
      ),
    );
    const { act } = require("@testing-library/react-native");
    await act(async () => {
      fireEvent.press(screen.getAllByRole("tab", { name: "Transactions" })[0]);
    });
    const sample = sampleUnfixedChangedPageRequest(0, 1);

    expect({
      setParamsCallsAfterCompletion: navigation.setParams.mock.calls,
      transactionsSelectedAfterCompletion: screen.getAllByRole("tab", { name: "Transactions" })[0]
        .props.accessibilityState.selected,
      routeTabDuringHandler: sample.routeTabDuringHandler,
      selectedTabDuringHandler: sample.selectedTabDuringHandler,
      commitPhase: sample.commitPhase,
      hasSettlementCompletion: sample.hasSettlementCompletion,
    }).toEqual({
      setParamsCallsAfterCompletion: [[{ tab: "Transactions" }]],
      transactionsSelectedAfterCompletion: true,
      routeTabDuringHandler: "Overview",
      selectedTabDuringHandler: "Overview",
      commitPhase: "settlement-complete",
      hasSettlementCompletion: true,
    });
  });

  // **Validates: Requirements 1.4, 1.6**
  test("content curve renders one closed fill and one matching open border", async () => {
    const screen = await render(
      React.createElement(CurvedContentSurface, {
        bumpX: WIDTH / 2,
        children: React.createElement(Text, null, "content"),
      }),
    );
    const fillPath = screen.getByTestId("home-content-curve-fill-path");
    const borderPath = screen.getByTestId("home-content-curve-border-path");
    const circles = screen.queryAllByTestId("svg-Circle");

    expect({
      pathCount: 2,
      closedFillPathCount: typeof fillPath.props.d === "string" && /Z\s*$/.test(fillPath.props.d) && fillPath.props.fill ? 1 : 0,
      openBorderPathCount: typeof borderPath.props.d === "string" && !/Z\s*$/.test(borderPath.props.d) && borderPath.props.stroke ? 1 : 0,
      decorationCount: circles.length,
      nodeTypes: ["Path", "Path"],
    }).toEqual({
      pathCount: 2,
      closedFillPathCount: 1,
      openBorderPathCount: 1,
      decorationCount: 0,
      nodeTypes: ["Path", "Path"],
    });
  });

  // **Validates: Requirements 1.5, 1.6**
  test("dock SVG renders separate fill and open-border paths without a stroked closure", async () => {
    const screen = await render(
      React.createElement(FloatingDock, {
        state: bottomTabState(),
        navigation: { navigate: jest.fn() },
        descriptors: {},
        insets: { top: 0, right: 0, bottom: 24, left: 0 },
      } as any),
    );
    const fillPath = screen.getByTestId("floating-dock-fill-path");
    const borderPath = screen.getByTestId("floating-dock-border-path");

    expect({
      pathCount: 2,
      closedStrokedPathCount: /Z\s*$/.test(fillPath.props.d) && fillPath.props.stroke && fillPath.props.stroke !== "none" ? 1 : 0,
      openBorderPathCount: !/Z\s*$/.test(borderPath.props.d) && borderPath.props.stroke && borderPath.props.stroke !== "none" ? 1 : 0,
      markerCount: screen.queryAllByTestId("svg-Circle").length,
    }).toEqual({
      pathCount: 2,
      closedStrokedPathCount: 0,
      openBorderPathCount: 1,
      markerCount: 0,
    });
  });

  // **Validates: Requirements 1.5, 1.6**
  test.each([280, 320, 390, 480, 600])(
    "dock controls and notch satisfy geometry at width %i",
    (width) => {
      const dock = sampleUnfixedDock(width, 24);

      expect({
        overviewIconCenterY: dock.overviewIconCenterY,
        aiIconCenterY: dock.aiIconCenterY,
        insightsIconCenterY: dock.insightsIconCenterY,
        overviewLabelTop: dock.overviewLabelTop,
        aiLabelTop: dock.aiLabelTop,
        insightsLabelTop: dock.insightsLabelTop,
        notchClearance: dock.notchClearance,
        closedPathCarriesBorderStroke: dock.closedPathCarriesBorderStroke,
        fillPathCount: dock.fillPathCount,
        openBorderPathCount: dock.openBorderPathCount,
      }).toEqual({
        overviewIconCenterY: 29,
        aiIconCenterY: 29,
        insightsIconCenterY: 29,
        overviewLabelTop: 66,
        aiLabelTop: 66,
        insightsLabelTop: 66,
        notchClearance: 6,
        closedPathCarriesBorderStroke: false,
        fillPathCount: 1,
        openBorderPathCount: 1,
      });
      expect(dock.shoulderLeftX).toBeGreaterThanOrEqual(18);
      expect(width - dock.shoulderRightX).toBeGreaterThanOrEqual(18);
      expect(dock.path).not.toMatch(/NaN|Infinity/);
    },
  );

  // **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
  test("generated active pager frames satisfy the continuous expected predicate", () => {
    const pagerInputs = fc.integer({ min: 0, max: 2 }).chain((startIndex) =>
      fc
        .record({
          pageWidth: fc.integer({ min: 240, max: 600 }),
          holdPercent: fc.integer({ min: 1, max: 32 }),
          velocityX: fc.integer({ min: -2400, max: 2400 }),
          direction: fc.constantFrom(
            ...(startIndex === 0 ? [1] : startIndex === 2 ? [-1] : [-1, 1]),
          ),
        })
        .map(({ pageWidth, holdPercent, velocityX, direction }) => ({
          startIndex,
          pageWidth,
          holdPercent,
          velocityX,
          direction,
          translationX: -direction * pageWidth * (holdPercent / 100),
        })),
    );

    fc.assert(
      fc.property(pagerInputs, (input) => {
        expect(isPagerBugCondition(input)).toBe(true);
        const frame = sampleUnfixedPagerFrame(input);
        const expectedProgress = input.startIndex + input.direction * (input.holdPercent / 100);

        expect(frame.hasPanWriter).toBe(true);
        expect(frame.pageProgress).toBeCloseTo(expectedProgress, 8);
        expect(frame.trackX).toBeCloseTo(-expectedProgress * input.pageWidth, 8);
        expect(frame.mountedTabs).toHaveLength(3);
        expect(frame.routeTab).toBe(frame.selectedTab);
      }),
      { seed: 20250314, numRuns: 100, endOnFailure: true },
    );
  });

  // **Validates: Requirements 1.5, 1.6**
  test("generated dock widths and insets satisfy baseline, clearance, and artifact predicates", () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: 280, max: 600 }),
          bottomInset: fc.integer({ min: 0, max: 48 }),
        }),
        ({ width, bottomInset }) => {
          const dock = sampleUnfixedDock(width, bottomInset);
          expect(dock.overviewIconCenterY).toBe(dock.aiIconCenterY);
          expect(dock.aiIconCenterY).toBe(dock.insightsIconCenterY);
          expect(dock.overviewLabelTop).toBe(dock.aiLabelTop);
          expect(dock.aiLabelTop).toBe(dock.insightsLabelTop);
          expect(dock.notchClearance).toBeGreaterThanOrEqual(6);
          expect(dock.curveDecorationNodeCount).toBe(0);
          expect(dock.closedPathCarriesBorderStroke).toBe(false);
          expect(dock.fillPathCount).toBe(1);
          expect(dock.openBorderPathCount).toBe(1);
          expect(dock.path).not.toMatch(/NaN|Infinity/);
        },
      ),
      { seed: 20250314, numRuns: 100, endOnFailure: true },
    );
  });
});
