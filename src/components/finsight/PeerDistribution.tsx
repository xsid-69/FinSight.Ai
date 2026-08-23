import React, { useMemo, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import { XStack, Text, View } from "tamagui";
import Svg, { Path, Line, Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { smoothPath, areaPath, type Pt } from "./chartPaths";
import { palette } from "../../constants/colors";

export interface PeerDistributionProps {
  distribution: number[];
  /** User position along the x-axis, 0–1. */
  userPosition: number;
}

const H = 84;
const PAD_B = 10;

/** KDE-style peer distribution curve with median + "you" markers. */
export function PeerDistribution({ distribution, userPosition }: PeerDistributionProps) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  const geom = useMemo(() => {
    if (w <= 0) return null;
    const max = Math.max(...distribution);
    const n = distribution.length - 1;
    const pts: Pt[] = distribution.map((v, i) => ({
      x: (i / n) * w,
      y: 4 + (1 - v / max) * (H - PAD_B - 4),
    }));
    const userX = userPosition * w;
    const medianX = 0.5 * w;
    return {
      line: smoothPath(pts),
      area: areaPath(pts, H - PAD_B),
      userX,
      medianX,
      baselineY: H - PAD_B,
    };
  }, [w, distribution, userPosition]);

  return (
    <View>
      <View height={H} onLayout={onLayout}>
        {geom ? (
          <Svg width={w} height={H}>
            <Defs>
              <SvgGradient id="kdeArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={palette.ai} stopOpacity={0.24} />
                <Stop offset="1" stopColor={palette.ai} stopOpacity={0} />
              </SvgGradient>
            </Defs>
            <Path d={geom.area} fill="url(#kdeArea)" />
            <Path d={geom.line} stroke={palette.ai} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            {/* median */}
            <Line x1={geom.medianX} y1={4} x2={geom.medianX} y2={geom.baselineY} stroke={palette.muted} strokeWidth={1} strokeDasharray="4 4" />
            {/* you */}
            <Line x1={geom.userX} y1={0} x2={geom.userX} y2={geom.baselineY} stroke={palette.red} strokeWidth={1.5} />
            <Circle cx={geom.userX} cy={8} r={4} fill={palette.red} stroke="#fff" strokeWidth={1.5} />
          </Svg>
        ) : null}
      </View>
      <XStack justifyContent="space-between" marginTop={4}>
        <Text fontSize={11} color="$secondary" fontWeight="600">
          Peer median
        </Text>
        <Text fontSize={11} color="$red" fontWeight="800">
          You
        </Text>
      </XStack>
    </View>
  );
}
