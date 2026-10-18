import React from "react";
import { View } from "tamagui";
import Svg, { Circle } from "react-native-svg";

import { brandColors } from "../../theme/mastercard";

export interface MastercardMarkProps {
  size?: number;
}

/** Authentic Mastercard overlap mark with precision SVG geometry. */
export function MastercardMark({ size = 28 }: MastercardMarkProps) {
  const height = size;
  const width = Math.round(size * 1.6);
  const r = Math.round(size * 0.48);
  const cy = Math.round(size * 0.5);
  const cx1 = Math.round(size * 0.48);
  const cx2 = Math.round(width - size * 0.48);

  return (
    <View
      width={width}
      height={height}
      alignItems="center"
      justifyContent="center"
      accessible={false}
      pointerEvents="none"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Red Left Circle */}
        <Circle cx={cx1} cy={cy} r={r} fill={brandColors.redIdentity} />
        {/* Yellow-Orange Right Circle */}
        <Circle cx={cx2} cy={cy} r={r} fill={brandColors.orange} opacity={0.95} />
        {/* Center Interlocking Warm Overlap */}
        <Circle
          cx={(cx1 + cx2) / 2}
          cy={cy}
          r={r * 0.65}
          fill={brandColors.gold}
          opacity={0.85}
        />
      </Svg>
    </View>
  );
}

