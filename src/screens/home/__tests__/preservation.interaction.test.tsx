import React from "react";
import { StyleSheet, Text as NativeText } from "react-native";
import { cleanup, fireEvent, render } from "@testing-library/react-native";

import { FloatingDock } from "../../../components/finsight/FloatingDock";
import { HeaderNavigation } from "../../../components/finsight/HeaderNavigation";
import { IntelligenceHeader } from "../../../components/finsight/IntelligenceHeader";
import { HomeFeatureCarousel } from "../HomeFeatureCarousel";
import { HomePager } from "../HomePager";
import { InsightsContent } from "../InsightsContent";
import { OverviewContent } from "../OverviewContent";
import { TransactionsContent } from "../TransactionsContent";
import * as Haptics from "expo-haptics";

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
    useEvent: (callback: (...args: unknown[]) => unknown) => callback,
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
  const view = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.View, { ...normalizeViewProps(props), ref }),
  );
  const text = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.Text, { ...props, ref }),
  );
  const scrollView = React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) =>
    React.createElement(ReactNative.ScrollView, {
      ...props,
      ref,
      testID: props.testID ?? "mock-scroll-view",
    }),
  );
  return {
    View: view,
    XStack: view,
    YStack: view,
    Text: text,
    ScrollView: scrollView,
  };
});

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
  return new Proxy({ __esModule: true }, { get: (_target, property) => property === "__esModule" ? true : Icon });
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { LinearGradient: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Component = (props: Record<string, unknown>) => React.createElement(View, props);
  return {
    __esModule: true,
    default: Component,
    Svg: Component,
    Circle: Component,
    Defs: Component,
    G: Component,
    LinearGradient: Component,
    Path: Component,
    Rect: Component,
    Stop: Component,
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, left: 0, right: 0, bottom: 34 }),
}));

jest.mock("../FinancialEmptyArtwork", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { FinancialEmptyArtwork: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock("../../../components/IconSquare", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { IconSquare: (props: Record<string, unknown>) => React.createElement(View, props) };
});

jest.mock("../../../components/finsight", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { Card: ({ children, ...props }: { children?: React.ReactNode }) => React.createElement(View, props, children) };
});

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium", Heavy: "Heavy" },
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("../../../hooks/useReducedMotion", () => ({
  useReducedMotion: () => false,
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { displayName: "Ada Lovelace" },
    profile: null,
    logout: jest.fn(() => Promise.resolve()),
  }),
}));

function renderApp(ui: React.ReactElement) {
  return render(ui);
}

function bottomTabState(name: "Home" | "AI", tab?: string) {
  return {
    key: "tabs",
    index: name === "Home" ? 0 : 1,
    routeNames: ["Home", "AI"],
    history: [],
    stale: false,
    type: "tab",
    routes: [
      { key: "Home-key", name: "Home", params: tab ? { tab } : undefined },
      { key: "AI-key", name: "AI" },
    ],
  } as any;
}

describe("Property 2 preservation interaction baseline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // **Validates: Requirements 3.4, 3.5, 3.9**
  test("header tabs retain one discoverable owner, 48dp targets, selected semantics, same-target no-op, and activation haptics", async () => {
    const onChange = jest.fn();
    const screen = await renderApp(<HeaderNavigation active="Overview" onChange={onChange} />);

    const overview = screen.getByRole("tab", { name: "Overview" });
    const transactions = screen.getByRole("tab", { name: "Transactions" });
    const insights = screen.getByRole("tab", { name: "Insights" });

    for (const label of ["Overview", "Transactions", "Insights"]) {
      expect(screen.getAllByRole("tab", { name: label })).toHaveLength(1);
    }
    for (const tab of [overview, transactions, insights]) {
      const targetStyle = StyleSheet.flatten(tab.props.style);
      expect(targetStyle.minHeight).toBeGreaterThanOrEqual(48);
      expect(targetStyle.minWidth).toBeGreaterThanOrEqual(48);
    }
    expect(overview.props.accessibilityState).toEqual({ selected: true });
    expect(transactions.props.accessibilityState).toEqual({ selected: false });
    expect(insights.props.accessibilityState).toEqual({ selected: false });

    await fireEvent.press(overview);
    expect(onChange).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();

    await fireEvent.press(transactions);
    expect(onChange).toHaveBeenCalledWith("Transactions");
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  // **Validates: Requirements 3.1, 3.4, 3.5**
  test.each([
    { label: "Profile", callback: "onProfile" },
    { label: "Settings", callback: "onSettings" },
    { label: "Notifications", callback: "onNotifications" },
    { label: "Help & Support", callback: "onHelp" },
    { label: "Log out", callback: "onLogout" },
  ] as const)("account menu preserves the $label action and activation haptic", async ({ label, callback }) => {
    const actions = {
      onProfile: jest.fn(),
      onSettings: jest.fn(),
      onNotifications: jest.fn(),
      onHelp: jest.fn(),
      onLogout: jest.fn(),
    };
    const screen = await renderApp(
      <IntelligenceHeader activeTab="Overview" onChangeTab={jest.fn()} {...actions} />,
    );

    expect(screen.getAllByRole("button", { name: "Open account menu" })).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: "Open account menu" }));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Open account menu" }).props.accessibilityState).toEqual({
      expanded: true,
    });

    expect(screen.getAllByRole("button", { name: label })).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: label }));
    expect(actions[callback]).toHaveBeenCalledTimes(1);
  });

  // **Validates: Requirements 3.1, 3.2, 3.4, 3.5, 3.9**
  test("dock controls preserve routes, params, selected state, safe-area target geometry, and haptic types", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = await renderApp(
      <FloatingDock state={bottomTabState("Home", "Overview")} navigation={navigation as any} descriptors={{} as any} insets={{ top: 0, right: 0, bottom: 34, left: 0 }} />,
    );

    const overview = screen.getByRole("tab", { name: "Overview" });
    const insights = screen.getByRole("tab", { name: "Insights" });
    const ai = screen.getByRole("tab", { name: "FinSight AI" });

    expect(screen.getAllByRole("tab", { name: "Overview" })).toHaveLength(1);
    expect(screen.getAllByRole("tab", { name: "Insights" })).toHaveLength(1);
    expect(screen.getAllByRole("tab", { name: "FinSight AI" })).toHaveLength(1);
    expect(StyleSheet.flatten(overview.props.style).minHeight).toBeGreaterThanOrEqual(48);
    expect(StyleSheet.flatten(insights.props.style).minHeight).toBeGreaterThanOrEqual(48);
    expect(StyleSheet.flatten(ai.props.style).width).toBeGreaterThanOrEqual(48);
    expect(overview.props.accessibilityState).toEqual({ selected: true });
    expect(insights.props.accessibilityState).toEqual({ selected: false });
    expect(ai.props.accessibilityState).toEqual({ selected: false });
    expect(ai.props.accessibilityHint).toBe("Open AI analytics and assistant");

    await fireEvent.press(insights);
    await fireEvent.press(ai);

    expect(navigation.navigate.mock.calls).toEqual([
      ["Home", { tab: "Insights" }],
      ["AI"],
    ]);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  // **Validates: Requirements 3.2, 3.5, 3.8**
  test("feature carousel preserves native scroll settings, repeated drags, pagination edges, and card actions", async () => {
    const onAction = jest.fn();
    const parentPagerGesture = { id: "parent-pager" } as any;
    const screen = await renderApp(
      <HomeFeatureCarousel
        onAction={onAction}
        parentPagerGesture={parentPagerGesture}
      />,
    );

    const scrollView = screen.getByTestId("mock-scroll-view");
    expect(scrollView.props.horizontal).toBe(true);
    expect(scrollView.props.snapToInterval).toBeGreaterThan(0);
    expect(scrollView.props.disableIntervalMomentum).toBe(true);
    expect(scrollView.props.decelerationRate).toBe("fast");

    await fireEvent(scrollView, "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: 9999, y: 0 } },
    });
    await fireEvent(scrollView, "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: 9999, y: 0 } },
    });
    expect(screen.getByText("4/4")).toBeTruthy();

    await fireEvent(scrollView, "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: -9999, y: 0 } },
    });
    expect(screen.getByText("1/4")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", {
        name: "Preview statement analysis. See how FinSight organizes financial activity without using personal data.",
      }),
    );
    expect(onAction).toHaveBeenCalledWith("import");
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  // **Validates: Requirements 3.4, 3.7, 3.8, 3.9, 3.10**
  test("the mounted pager keeps three native vertical ScrollViews, independent page instances, and one traversal owner across width and selection changes", async () => {
    const navigation = { navigate: jest.fn() };
    const pages = [
      <OverviewContent key="Overview" navigation={navigation} />,
      <TransactionsContent key="Transactions" navigation={navigation} />,
      <InsightsContent key="Insights" navigation={navigation} />,
    ] as const;
    const screen = await renderApp(
      <HomePager settledTab="Transactions" pageWidth={390} pages={pages} />,
    );
    const hiddenQuery = { includeHiddenElements: true };
    const pageIds = [
      "home-pager-page-overview",
      "home-pager-page-transactions",
      "home-pager-page-insights",
    ];
    const pageWrappers = pageIds.map((testID) => screen.getByTestId(testID, hiddenQuery));
    const verticalScrollsBefore = screen
      .getAllByTestId("mock-scroll-view", hiddenQuery)
      .filter((node) => node.props.horizontal !== true);

    expect(pageWrappers).toHaveLength(3);
    expect(verticalScrollsBefore).toHaveLength(3);
    expect(pageWrappers.filter((page) => page.props.pointerEvents === "auto")).toHaveLength(1);
    expect(pageWrappers.filter((page) => !page.props.accessibilityElementsHidden)).toHaveLength(1);
    expect(pageWrappers[1].props).toMatchObject({
      pointerEvents: "auto",
      accessibilityElementsHidden: false,
      importantForAccessibility: "auto",
    });

    const initialTrack = StyleSheet.flatten(screen.getByTestId("home-pager-track").props.style);
    expect(initialTrack.width).toBe(390 * 3);
    expect(initialTrack.transform).toEqual([{ translateX: -390 }]);

    await screen.rerender(
      <HomePager settledTab="Transactions" pageWidth={600} pages={pages} />,
    );
    const resizedTrack = StyleSheet.flatten(screen.getByTestId("home-pager-track").props.style);
    const verticalScrollsAfterResize = screen
      .getAllByTestId("mock-scroll-view", hiddenQuery)
      .filter((node) => node.props.horizontal !== true);
    expect(resizedTrack.width).toBe(600 * 3);
    expect(resizedTrack.transform).toEqual([{ translateX: -600 }]);
    expect(verticalScrollsAfterResize).toHaveLength(3);
    expect(verticalScrollsAfterResize).toEqual(verticalScrollsBefore);

    await screen.rerender(
      <HomePager settledTab="Insights" pageWidth={600} pages={pages} />,
    );
    const wrappersAfterSelection = pageIds.map((testID) => screen.getByTestId(testID, hiddenQuery));
    expect(wrappersAfterSelection.filter((page) => page.props.pointerEvents === "auto")).toHaveLength(1);
    expect(wrappersAfterSelection.filter((page) => !page.props.accessibilityElementsHidden)).toHaveLength(1);
    expect(wrappersAfterSelection[2].props.pointerEvents).toBe("auto");
    expect(screen.getAllByTestId("mock-scroll-view", hiddenQuery).filter((node) => node.props.horizontal !== true)).toHaveLength(3);
  });

  // **Validates: Requirements 3.1, 3.4, 3.5, 3.9**
  test("Overview preserves message activity, private Insights, and AI destinations with feedback", async () => {
    const navigation = { navigate: jest.fn(), setParams: jest.fn() };
    const screen = await renderApp(<OverviewContent navigation={navigation} />);

    await fireEvent.press(screen.getByRole("button", { name: "View message connection status" }));
    await fireEvent.press(screen.getByRole("button", { name: "Open private Insights workspace" }));
    await fireEvent.press(screen.getByRole("button", { name: "Open FinSight AI" }));

    expect(navigation.navigate.mock.calls).toEqual([
      ["Home", { tab: "Transactions" }],
      ["Home", { tab: "Insights", insightsView: "analysis" }],
      ["AI"],
    ]);
    expect(navigation.setParams).toHaveBeenCalledWith({ insightsView: "analysis" });
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  // **Validates: Requirements 3.1, 3.4, 3.5, 3.9**
  test("message privacy settings and Insights import preserve their destinations and feedback", async () => {
    const navigation = { navigate: jest.fn() };
    const transactions = await renderApp(<TransactionsContent navigation={navigation} />);
    expect(transactions.queryByText(/CSV|statement|imported/i)).toBeNull();
    await fireEvent.press(transactions.getByRole("button", { name: "How message privacy works" }));
    await fireEvent.press(transactions.getByRole("button", { name: "Open profile security settings" }));

    const insights = await renderApp(<InsightsContent navigation={navigation} />);
    await fireEvent.press(insights.getByRole("button", { name: "Import CSV for insights" }));

    expect(navigation.navigate.mock.calls).toEqual([
      ["Profile", { section: "security" }],
      ["Analyzer"],
    ]);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  // **Validates: Requirements 3.4, 3.10**
  test("message activity action labels remain uniquely discoverable to screen readers", async () => {
    const navigation = { navigate: jest.fn() };
    const screen = await renderApp(
      <TransactionsContent navigation={navigation} />,
    );
    expect(screen.getByRole("button", { name: "How message privacy works" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Import CSV/i })).toBeNull();
  });
});
