import React from "react";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";
import fc from "fast-check";

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: (value: unknown) => ({ value }),
    useAnimatedStyle: (updater: () => unknown) => updater(),
    useAnimatedProps: (updater: () => unknown) => updater(),
  };
});

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    YStack: View,
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

import {
  CurvedContentSurface,
  buildClosedFillPath,
  buildTopBorderPath,
  clampX,
} from "../CurvedContentSurface";

describe("CurvedContentSurface geometry and topology", () => {
  test("renders revision marker and required two-path topology with no circle decorations", async () => {
    const screen = await render(
      <CurvedContentSurface bumpX={195}>
        <Text>Content</Text>
      </CurvedContentSurface>,
    );

    expect(screen.getByTestId("home-content-curve-runtime-swipe-dock-header-curve-v2")).toBeTruthy();

    const fillPath = screen.getByTestId("home-content-curve-fill-path");
    const borderPath = screen.getByTestId("home-content-curve-border-path");

    expect(fillPath.props.d).toMatch(/Z$/);
    expect(borderPath.props.d).not.toMatch(/Z$/);
    expect(borderPath.props.stroke).toBeDefined();
    expect(borderPath.props.stroke).not.toBe("none");

    expect(screen.queryAllByTestId("svg-Circle")).toHaveLength(0);
  });

  test("top border path matches the leading path segment of the closed fill path", () => {
    const width = 390;
    const bumpX = 195;
    const topBorder = buildTopBorderPath(width, bumpX);
    const closedFill = buildClosedFillPath(width, bumpX);

    expect(closedFill.startsWith(topBorder)).toBe(true);
    expect(closedFill).toMatch(/Z$/);
    expect(topBorder).not.toMatch(/Z$/);
  });

  test("property: clampX returns finite coordinates strictly within surface bounds", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 280, max: 800 }),
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (width, x) => {
          const clamped = clampX(width, x);
          expect(Number.isFinite(clamped)).toBe(true);
          expect(clamped).toBeGreaterThanOrEqual(62);
          expect(clamped).toBeLessThanOrEqual(width - 62);
        },
      ),
      { seed: 20250322, numRuns: 200 },
    );
  });

  test("property: path builders produce valid finite SVG paths without NaN or Infinity", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 280, max: 800 }),
        fc.integer({ min: -500, max: 1200 }),
        (width, x) => {
          const topBorder = buildTopBorderPath(width, x);
          const closedFill = buildClosedFillPath(width, x);

          expect(topBorder).not.toMatch(/NaN|Infinity/);
          expect(closedFill).not.toMatch(/NaN|Infinity/);
          expect(closedFill).toMatch(/Z$/);
          expect(topBorder).not.toMatch(/Z$/);
        },
      ),
      { seed: 20250322, numRuns: 200 },
    );
  });
});
