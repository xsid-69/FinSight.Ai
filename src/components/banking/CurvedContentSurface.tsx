import React from "react";
import { useWindowDimensions } from "react-native";
import { YStack } from "tamagui";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  type SharedValue,
} from "react-native-reanimated";

import { palette } from "../../constants/colors";
import { interpolateHeadingCenter } from "../../screens/home/homePagerMath";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CAP_H = 52;
const OVERLAP = 30;

export function clampX(w: number, bx: number): number {
  "worklet";
  const minimum = 62;
  const maximum = w - 62;
  return Math.max(minimum, Math.min(maximum, bx));
}

export function buildTopBorderPath(w: number, x: number): string {
  "worklet";
  const safeX = Math.max(62, Math.min(w - 62, x));
  const halfControl = 16;
  return [
    "M 0 60",
    "Q 0 30 30 30",
    `L ${safeX - 32} 30`,
    `C ${safeX - halfControl} 30 ${safeX - halfControl} 5 ${safeX} 5`,
    `C ${safeX + halfControl} 5 ${safeX + halfControl} 30 ${safeX + 32} 30`,
    `L ${w - 30} 30`,
    `Q ${w} 30 ${w} 60`,
  ].join(" ");
}

export function buildClosedFillPath(w: number, x: number): string {
  "worklet";
  const safeX = Math.max(62, Math.min(w - 62, x));
  const halfControl = 16;
  const border = [
    "M 0 60",
    "Q 0 30 30 30",
    `L ${safeX - 32} 30`,
    `C ${safeX - halfControl} 30 ${safeX - halfControl} 5 ${safeX} 5`,
    `C ${safeX + halfControl} 5 ${safeX + halfControl} 30 ${safeX + 32} 30`,
    `L ${w - 30} 30`,
    `Q ${w} 30 ${w} 60`,
  ].join(" ");
  return `${border} L ${w} 54 L 0 54 Z`;
}

export interface CurvedContentSurfaceProps {
  /** Absolute screen-x where the bump should peak. */
  bumpX?: number;
  /** Shared progress reference. */
  pageProgress?: SharedValue<number>;
  /** Measured heading centers. */
  headingCenters?: readonly number[];
  /** Fill color of the surface. */
  fill?: string;
  children: React.ReactNode;
}

export function CurvedContentSurface({
  bumpX,
  pageProgress,
  headingCenters,
  fill = palette.background,
  children,
}: CurvedContentSurfaceProps) {
  const { width } = useWindowDimensions();
  const staticX = clampX(width, typeof bumpX === "number" && Number.isFinite(bumpX) ? bumpX : width / 2);

  const animatedFillProps = useAnimatedProps(() => {
    if (!pageProgress) return { d: buildClosedFillPath(width, staticX) };
    const currentX = interpolateHeadingCenter(pageProgress.value, headingCenters, width);
    return { d: buildClosedFillPath(width, currentX) };
  }, [width, staticX, pageProgress, headingCenters]);

  const animatedBorderProps = useAnimatedProps(() => {
    if (!pageProgress) return { d: buildTopBorderPath(width, staticX) };
    const currentX = interpolateHeadingCenter(pageProgress.value, headingCenters, width);
    return { d: buildTopBorderPath(width, currentX) };
  }, [width, staticX, pageProgress, headingCenters]);

  return (
    <YStack
      testID="home-content-curve-touch-layer"
      flex={1}
      marginTop={-OVERLAP}
      pointerEvents="box-none"
    >
      <Svg
        testID="home-content-curve-runtime-swipe-dock-header-curve-v2"
        nativeID="home-content-curve-runtime-swipe-dock-header-curve-v2"
        width={width}
        height={CAP_H}
        pointerEvents="none"
      >
        <AnimatedPath
          testID="home-content-curve-fill-path"
          animatedProps={animatedFillProps}
          d={buildClosedFillPath(width, staticX)}
          fill={fill}
        />
        <AnimatedPath
          testID="home-content-curve-border-path"
          animatedProps={animatedBorderProps}
          d={buildTopBorderPath(width, staticX)}
          fill="none"
          stroke={palette.borderStrong}
          strokeWidth={1}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      </Svg>
      <YStack flex={1} backgroundColor={fill as any} marginTop={-1}>
        {children}
      </YStack>
    </YStack>
  );
}
