import React from "react";
import { useWindowDimensions } from "react-native";
import { YStack } from "tamagui";
import Svg, { Path, Circle } from "react-native-svg";
import { palette } from "../../constants/colors";

const CAP_H = 52; // svg cap height (px)
const SHOULDER = 30; // y of the flat shoulder
const PEAK = 5; // y at the top of the bump (rises into red)
const CORNER = 30; // outer rounded-corner radius (rounded white-body corners)
const BUMP_HALF = 32; // half-width of the upward bump
const OVERLAP = 30; // how far the surface pulls up into the red header

function clampX(w: number, bx: number): number {
  const min = CORNER + BUMP_HALF;
  const max = w - CORNER - BUMP_HALF;
  return Math.max(min, Math.min(max, bx));
}

/** Curved cap path with a soft upward bump centered at `x`. */
function buildCapPath(w: number, x: number): string {
  const h = BUMP_HALF * 0.5;
  return [
    `M 0 ${CAP_H}`,
    `L 0 ${SHOULDER + CORNER}`,
    `Q 0 ${SHOULDER} ${CORNER} ${SHOULDER}`,
    `L ${x - BUMP_HALF} ${SHOULDER}`,
    `C ${x - h} ${SHOULDER} ${x - h} ${PEAK} ${x} ${PEAK}`,
    `C ${x + h} ${PEAK} ${x + h} ${SHOULDER} ${x + BUMP_HALF} ${SHOULDER}`,
    `L ${w - CORNER} ${SHOULDER}`,
    `Q ${w} ${SHOULDER} ${w} ${SHOULDER + CORNER}`,
    `L ${w} ${CAP_H}`,
    "Z",
  ].join(" ");
}

export interface CurvedContentSurfaceProps {
  /** Absolute screen-x where the bump should peak (active tab center). */
  bumpX: number;
  /** Fill color of the surface (defaults to the calm page background). */
  fill?: string;
  /** Show a small accent dot at the peak of the bump. */
  showDot?: boolean;
  children: React.ReactNode;
}

/**
 * The signature surface that rises into the red header with a soft central
 * wave beneath the active section, with an optional accent dot at the peak.
 */
export function CurvedContentSurface({ bumpX, fill = palette.background, showDot = true, children }: CurvedContentSurfaceProps) {
  const { width } = useWindowDimensions();
  const x = clampX(width, bumpX);
  const d = buildCapPath(width, x);

  return (
    <YStack flex={1} marginTop={-OVERLAP}>
      <Svg width={width} height={CAP_H} pointerEvents="none">
        <Path d={d} fill={fill} />
        {showDot ? <Circle cx={x} cy={PEAK + 1} r={2.4} fill={palette.red} /> : null}
      </Svg>
      <YStack flex={1} backgroundColor={fill as any} marginTop={-1}>
        {children}
      </YStack>
    </YStack>
  );
}
