import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import fc from "fast-check";

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
  const exports = {
    __esModule: true,
    View: MockView,
    XStack: MockView,
    YStack: MockView,
    Text: MockText,
  };
  return new Proxy(exports, {
    get: (target, property) =>
      property in target ? target[property as keyof typeof target] : MockView,
  });
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 47, left: 0, right: 0, bottom: 24 }),
}));

jest.mock("expo-haptics", () => ({
  ImpactFeedbackStyle: { Light: "Light" },
  selectionAsync: jest.fn(),
  impactAsync: jest.fn(),
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
  return {
    __esModule: true,
    default: component("Svg"),
    Path: component("Path"),
    Circle: component("Circle"),
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

import {
  FloatingDock,
  buildClosedFillPath,
  buildTopBorderPath,
  EXPECTED_DOCK_REVISION,
  resolveSideActionStyle,
} from "../FloatingDock";
import {
  HomePagerCoordinatorProvider,
  type HomePagerAnimationRequest,
  useHomePagerCoordinator,
} from "../../../screens/home/HomePagerCoordinator";

const CONTROL_HEIGHT = 84;
const DOCK_SHOULDER_Y = 22;
const TEST_DOCK_WIDTH = 390;

function mockTabBarProps(currentRoute = "Home", homeTab = "Overview") {
  return {
    state: {
      key: "tabs",
      index: currentRoute === "AI" ? 1 : 0,
      routeNames: ["Home", "AI"],
      history: [],
      stale: false,
      type: "tab",
      routes: [
        { key: "Home-key", name: "Home", params: { tab: homeTab } },
        { key: "AI-key", name: "AI" },
      ],
    },
    navigation: { navigate: jest.fn() },
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 24, left: 0 },
  } as any;
}

function viewStyleOf(node: { props: { style?: StyleProp<ViewStyle> } }): ViewStyle {
  return StyleSheet.flatten(node.props.style) ?? {};
}

function CoordinatorRegistration({
  onRequest,
}: {
  onRequest: (request: HomePagerAnimationRequest) => void;
}) {
  const { registerPager } = useHomePagerCoordinator();

  React.useEffect(
    () => registerPager({ onRequest, onCommit: () => undefined }),
    [onRequest, registerPager],
  );

  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("FloatingDock geometry, compact action ownership, and topology", () => {
  test("renders the unchanged revision, safe-area body, and exact two-path notch geometry", async () => {
    const screen = await render(<FloatingDock {...mockTabBarProps()} />);
    const root = screen.getByTestId("floating-dock-runtime-swipe-dock-header-curve-v2");
    const fillPath = screen.getByTestId("floating-dock-fill-path");
    const borderPath = screen.getByTestId("floating-dock-border-path");

    expect(EXPECTED_DOCK_REVISION).toBe("swipe-dock-header-curve-v2");
    expect(root.props.height).toBe(CONTROL_HEIGHT + 24);
    expect(root.props.pointerEvents).toBe("box-none");
    expect(fillPath.props.d).toMatch(/Z$/);
    expect(fillPath.props.stroke).toBeUndefined();
    expect(borderPath.props.d).not.toMatch(/Z$/);
    expect(borderPath.props.stroke).toBeDefined();
    expect(screen.queryAllByTestId("svg-Circle")).toHaveLength(0);

    expect(buildClosedFillPath(TEST_DOCK_WIDTH, 24)).toBe(
      "M 0 22 L 133 22 C 162.76 22 162.76 64 195 64 C 227.24 64 227.24 22 257 22 L 390 22 L 390 128 L 0 128 Z",
    );
    expect(buildTopBorderPath(TEST_DOCK_WIDTH)).toBe(
      "M 0 22 L 133 22 C 162.76 22 162.76 64 195 64 C 227.24 64 227.24 22 257 22 L 390 22",
    );
  });

  test("composes each side icon and label inside a compact non-flexing action owner", async () => {
    const screen = await render(<FloatingDock {...mockTabBarProps()} />);

    for (const name of ["overview", "insights"] as const) {
      const slot = screen.getByTestId(`floating-dock-${name}-slot`);
      const action = screen.getByTestId(`floating-dock-${name}`);
      const icon = screen.getByTestId(`floating-dock-${name}-icon`);
      const label = screen.getByTestId(`floating-dock-${name}-label`);
      const slotStyle = viewStyleOf(slot);
      const actionStyle = viewStyleOf(action);

      expect(slot.props.pointerEvents).toBe("box-none");
      expect(slot.props.onPress).toBeUndefined();
      expect(slotStyle).toMatchObject({
        flex: 1,
        height: CONTROL_HEIGHT,
        alignItems: "center",
        justifyContent: "flex-start",
      });
      expect(actionStyle).toMatchObject({
        marginTop: DOCK_SHOULDER_Y,
        width: 72,
        height: 62,
        minWidth: 48,
        minHeight: 48,
        paddingTop: 5,
        alignItems: "center",
        justifyContent: "flex-start",
      });
      expect(actionStyle.flex).toBeUndefined();
      expect(action.props.hitSlop).toBeUndefined();
      expect(icon.props.pointerEvents).toBe("none");
      expect(icon.props.width).toBe(36);
      expect(icon.props.height).toBe(32);
      expect(icon.props.position).toBeUndefined();
      expect(label.props.pointerEvents).toBe("none");
      expect(label.props.position).toBeUndefined();
      expect(label.props.marginTop).toBe(2);
      expect(label.props.lineHeight).toBe(14);
      expect(label.props.textAlign).toBe("center");
    }

    const ai = screen.getByTestId("floating-dock-ai");
    const aiVisual = screen.getByTestId("floating-dock-ai-visual");
    const aiLabel = screen.getByTestId("floating-dock-ai-label");
    const aiStyle = viewStyleOf(ai);
    expect(aiStyle).toMatchObject({ width: 88, height: CONTROL_HEIGHT, minHeight: 48 });
    expect(aiStyle.marginTop).toBeUndefined();
    expect(aiVisual.props.top).toBe(0);
    expect(aiVisual.props.top + 58 / 2).toBe(29);
    expect(aiLabel.props.top).toBe(66);
    expect(aiLabel.props.lineHeight).toBe(14);
  });

  test("keeps side owners and visual pixels within global Y=22..84 and centered in each side region", async () => {
    const screen = await render(<FloatingDock {...mockTabBarProps()} />);
    const aiWidth = Number(viewStyleOf(screen.getByTestId("floating-dock-ai")).width);
    const sideSlotWidth = (TEST_DOCK_WIDTH - aiWidth) / 2;

    for (const name of ["overview", "insights"] as const) {
      const slotStyle = viewStyleOf(screen.getByTestId(`floating-dock-${name}-slot`));
      const actionStyle = viewStyleOf(screen.getByTestId(`floating-dock-${name}`));
      const icon = screen.getByTestId(`floating-dock-${name}-icon`);
      const label = screen.getByTestId(`floating-dock-${name}-label`);

      const actionTop = Number(actionStyle.marginTop);
      const actionHeight = Number(actionStyle.height);
      const actionWidth = Number(actionStyle.width);
      const iconTop = actionTop + Number(actionStyle.paddingTop);
      const iconBottom = iconTop + Number(icon.props.height);
      const labelTop = iconBottom + Number(label.props.marginTop);
      const labelBottom = labelTop + Number(label.props.lineHeight);
      const actionLeft = (sideSlotWidth - actionWidth) / 2;
      const iconLeft = actionLeft + (actionWidth - Number(icon.props.width)) / 2;

      expect(actionTop).toBeGreaterThanOrEqual(DOCK_SHOULDER_Y);
      expect(actionTop + actionHeight).toBeLessThanOrEqual(CONTROL_HEIGHT);
      expect(iconTop).toBeGreaterThanOrEqual(DOCK_SHOULDER_Y);
      expect(iconBottom).toBeLessThanOrEqual(CONTROL_HEIGHT);
      expect(labelTop).toBe(61);
      expect(labelBottom).toBeLessThanOrEqual(CONTROL_HEIGHT);
      expect((iconTop + labelBottom) / 2).toBeCloseTo(51, 5);
      expect(Math.abs((iconTop + labelBottom) / 2 - (DOCK_SHOULDER_Y + CONTROL_HEIGHT) / 2))
        .toBeLessThanOrEqual(2);

      expect(slotStyle.alignItems).toBe("center");
      expect(actionStyle.alignItems).toBe("center");
      expect(actionLeft + actionWidth / 2).toBe(sideSlotWidth / 2);
      expect(iconLeft + Number(icon.props.width) / 2).toBe(sideSlotWidth / 2);
      expect(label.props.textAlign).toBe("center");
    }
  });

  // **Validates: Requirements 2.5, 2.6, 3.2, 3.4**
  test("property: compact side owners remain body-bound and smaller than each side slot across supported widths", async () => {
    const screen = await render(<FloatingDock {...mockTabBarProps()} />);
    const action = screen.getByTestId("floating-dock-overview");
    const icon = screen.getByTestId("floating-dock-overview-icon");
    const label = screen.getByTestId("floating-dock-overview-label");
    const actionStyle = viewStyleOf(action);
    const actionWidth = Number(actionStyle.width);
    const actionHeight = Number(actionStyle.height);
    const actionTop = Number(actionStyle.marginTop);
    const iconWidth = Number(icon.props.width);
    const iconTop = actionTop + Number(actionStyle.paddingTop);
    const iconBottom = iconTop + Number(icon.props.height);
    const labelTop = iconBottom + Number(label.props.marginTop);
    const labelBottom = labelTop + Number(label.props.lineHeight);
    const aiWidth = Number(viewStyleOf(screen.getByTestId("floating-dock-ai")).width);

    fc.assert(
      fc.property(
        fc.integer({ min: 280, max: 600 }),
        fc.integer({ min: 0, max: 48 }),
        (width, bottomInset) => {
          const sideSlotWidth = (width - aiWidth) / 2;
          const actionLeft = (sideSlotWidth - actionWidth) / 2;
          const iconLeft = actionLeft + (actionWidth - iconWidth) / 2;
          const fill = buildClosedFillPath(width, bottomInset);
          const border = buildTopBorderPath(width);

          expect(actionWidth).toBeGreaterThanOrEqual(48);
          expect(actionHeight).toBeGreaterThanOrEqual(48);
          expect(actionWidth).toBeLessThan(sideSlotWidth);
          expect(actionTop).toBeGreaterThanOrEqual(DOCK_SHOULDER_Y);
          expect(actionTop + actionHeight).toBeLessThanOrEqual(CONTROL_HEIGHT);
          expect(iconTop).toBeGreaterThanOrEqual(DOCK_SHOULDER_Y);
          expect(iconBottom).toBeLessThanOrEqual(CONTROL_HEIGHT);
          expect(labelTop).toBeGreaterThanOrEqual(DOCK_SHOULDER_Y);
          expect(labelBottom).toBeLessThanOrEqual(CONTROL_HEIGHT);
          expect(actionLeft + actionWidth / 2).toBe(sideSlotWidth / 2);
          expect(iconLeft + iconWidth / 2).toBe(sideSlotWidth / 2);
          expect(fill).not.toMatch(/NaN|Infinity/);
          expect(border).not.toMatch(/NaN|Infinity/);
          expect(fill.startsWith(border)).toBe(true);
          expect(fill).toMatch(/Z$/);
          expect(border).not.toMatch(/Z$/);
        },
      ),
      { seed: 20250323, numRuns: 150 },
    );
  });

  test("side gutters, above-shoulder space, root, and SVG decoration own no action", async () => {
    const props = mockTabBarProps();
    const screen = await render(<FloatingDock {...props} />);
    const overviewSlot = screen.getByTestId("floating-dock-overview-slot");
    const insightsSlot = screen.getByTestId("floating-dock-insights-slot");
    const inertRegions = [
      screen.getByTestId("floating-dock-runtime-swipe-dock-header-curve-v2"),
      overviewSlot,
      insightsSlot,
      screen.getByTestId("floating-dock-fill-path"),
      screen.getByTestId("floating-dock-border-path"),
    ];

    for (const region of inertRegions) {
      expect(region.props.onPress).toBeUndefined();
      await fireEvent.press(region);
    }

    for (const name of ["overview", "insights"] as const) {
      const slot = screen.getByTestId(`floating-dock-${name}-slot`);
      const action = screen.getByTestId(`floating-dock-${name}`);
      const slotStyle = viewStyleOf(slot);
      const actionStyle = viewStyleOf(action);

      expect(slot.props.pointerEvents).toBe("box-none");
      expect(slot.props.onPress).toBeUndefined();
      expect(actionStyle.marginTop).toBe(DOCK_SHOULDER_Y);
      expect(actionStyle.width).toBeLessThan((TEST_DOCK_WIDTH - 88) / 2);
      expect(slotStyle.alignItems).toBe("center");
    }

    expect(props.navigation.navigate).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test.each([
    { currentTab: "Overview", target: "Insights" },
    { currentTab: "Insights", target: "Overview" },
  ])("pressing the compact $target owner navigates and haptics exactly once", async ({ currentTab, target }) => {
    const props = mockTabBarProps("Home", currentTab);
    const screen = await render(<FloatingDock {...props} />);

    await fireEvent.press(screen.getByRole("tab", { name: target }));

    expect(props.navigation.navigate).toHaveBeenCalledTimes(1);
    expect(props.navigation.navigate).toHaveBeenCalledWith("Home", { tab: target });
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  test("coordinator committed state and compact owner preserve one dock request", async () => {
    const onRequest = jest.fn<void, [HomePagerAnimationRequest]>();
    const props = mockTabBarProps("Home", "Overview");
    const screen = await render(
      <HomePagerCoordinatorProvider initialTab="Insights">
        <CoordinatorRegistration onRequest={onRequest} />
        <FloatingDock {...props} />
      </HomePagerCoordinatorProvider>,
    );

    expect(screen.getByRole("tab", { name: "Overview" }).props.accessibilityState)
      .toEqual({ selected: false });
    expect(screen.getByRole("tab", { name: "Insights" }).props.accessibilityState)
      .toEqual({ selected: true });

    await fireEvent.press(screen.getByRole("tab", { name: "Overview" }));

    expect(onRequest).toHaveBeenCalledTimes(1);
    expect(onRequest.mock.calls[0]?.[0]).toMatchObject({
      target: "Overview",
      source: "dock",
      hapticHandled: true,
    });
    expect(props.navigation.navigate).not.toHaveBeenCalled();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
  });

  test("side controls expose one owner each with deterministic opacity-only pressed feedback", async () => {
    const screen = await render(<FloatingDock {...mockTabBarProps()} />);

    expect(screen.getAllByRole("tab", { name: "Overview" })).toHaveLength(1);
    expect(screen.getAllByRole("tab", { name: "Insights" })).toHaveLength(1);

    const restingStyle = StyleSheet.flatten(resolveSideActionStyle(false)) ?? {};
    const pressedStyle = StyleSheet.flatten(resolveSideActionStyle(true)) ?? {};

    expect(restingStyle.opacity).toBeUndefined();
    expect(restingStyle.transform).toBeUndefined();
    expect(pressedStyle.opacity).toBe(0.72);
    expect(pressedStyle.transform).toBeUndefined();
    expect(pressedStyle.marginTop).toBe(restingStyle.marginTop);
    expect(pressedStyle.width).toBe(restingStyle.width);
    expect(pressedStyle.height).toBe(restingStyle.height);
    expect(pressedStyle.paddingTop).toBe(restingStyle.paddingTop);
  });

  test("AI remains one unchanged action owner with its existing geometry and semantics", async () => {
    const props = mockTabBarProps();
    const screen = await render(<FloatingDock {...props} />);
    const ai = screen.getByRole("tab", { name: "FinSight AI" });

    expect(screen.getAllByRole("tab", { name: "FinSight AI" })).toHaveLength(1);
    expect(ai.props.accessibilityState).toEqual({ selected: false });
    expect(ai.props.accessibilityHint).toBe("Open AI analytics and assistant");
    expect(ai.props.hitSlop).toBeUndefined();
    expect(viewStyleOf(ai)).toMatchObject({ width: 88, height: CONTROL_HEIGHT, minHeight: 48 });

    await fireEvent.press(ai);

    expect(props.navigation.navigate).toHaveBeenCalledTimes(1);
    expect(props.navigation.navigate).toHaveBeenCalledWith("AI");
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
