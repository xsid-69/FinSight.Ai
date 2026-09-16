import React from "react";
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

import { palette, redGradient, warmGradient } from "../../constants/colors";

export type OverviewArtworkVariant = "hero" | "activity" | "assistant";

interface OverviewArtworkProps {
  variant: OverviewArtworkVariant;
  width?: number;
}

const ACCESSIBILITY_LABELS: Record<OverviewArtworkVariant, string> = {
  hero: "Warm overlapping circles representing a private financial summary",
  activity: "A message source with neutral activity indicators",
  assistant: "A warm sparkle representing a guided financial question",
};

export function OverviewArtwork({ variant, width = 260 }: OverviewArtworkProps) {
  const safeWidth = Number.isFinite(width) ? Math.max(112, Math.round(width)) : 260;
  const height = Math.round(safeWidth * 0.7);
  const redGradientId = `overview-red-${variant}`;
  const warmGradientId = `overview-warm-${variant}`;

  return (
    <Svg
      width={safeWidth}
      height={height}
      viewBox="0 0 300 210"
      accessible
      accessibilityRole="image"
      accessibilityLabel={ACCESSIBILITY_LABELS[variant]}
    >
      <Defs>
        <SvgLinearGradient id={redGradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={redGradient[0]} />
          <Stop offset="1" stopColor={redGradient[1]} />
        </SvgLinearGradient>
        <SvgLinearGradient id={warmGradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={warmGradient[0]} />
          <Stop offset="1" stopColor={warmGradient[1]} />
        </SvgLinearGradient>
      </Defs>

      {variant === "hero" ? (
        <G>
          <Circle cx="150" cy="105" r="86" fill={palette.surface} opacity={0.05} />
          <Circle cx="119" cy="104" r="65" fill={`url(#${warmGradientId})`} opacity={0.96} />
          <Circle cx="181" cy="104" r="65" fill={palette.gold} opacity={0.88} />
          <Circle cx="150" cy="104" r="42" fill={palette.charcoalRaised} opacity={0.9} />
          <Circle cx="150" cy="104" r="31" fill={palette.charcoal} />
          <Path
            d="M150 79 C161 84 170 84 170 84 V99 C170 115 162 127 150 133 C138 127 130 115 130 99 V84 C130 84 139 84 150 79 Z"
            fill="none"
            stroke={palette.white}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <Path
            d="M141 104 L148 111 L160 96"
            fill="none"
            stroke={palette.orange}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="245" cy="54" r="15" fill={palette.red} opacity={0.72} />
          <Circle cx="60" cy="158" r="10" fill={palette.goldSoft} opacity={0.8} />
          <Path d="M238 151 C251 141 263 142 273 151" fill="none" stroke={palette.orange} strokeWidth="4" strokeLinecap="round" opacity={0.7} />
        </G>
      ) : null}

      {variant === "activity" ? (
        <G>
          <Circle cx="150" cy="105" r="88" fill={palette.surfaceAlt} />
          <Circle cx="238" cy="52" r="17" fill={palette.orangeSoft} />
          <Circle cx="62" cy="160" r="10" fill={palette.goldSoft} />

          <Rect x="54" y="37" width="156" height="136" rx="29" fill={palette.surface} stroke={palette.borderStrong} strokeWidth="2" />
          <Rect x="75" y="57" width="66" height="9" rx="4.5" fill={palette.charcoal} />
          <Rect x="75" y="73" width="43" height="6" rx="3" fill={palette.borderStrong} />

          <Circle cx="86" cy="108" r="15" fill={`url(#${redGradientId})`} />
          <Path d="M79 105 C79 100 83 97 88 97 H94 C99 97 102 100 102 105 V109 C102 114 99 117 94 117 H89 L84 121 V117 C81 116 79 113 79 109 Z" fill={palette.white} />
          <Rect x="112" y="99" width="69" height="8" rx="4" fill={palette.charcoalRaised} />
          <Rect x="112" y="114" width="46" height="6" rx="3" fill={palette.borderStrong} />

          <Circle cx="86" cy="144" r="12" fill={palette.goldSoft} />
          <Path d="M81 144 H91" stroke={palette.goldDeep} strokeWidth="3" strokeLinecap="round" />
          <Rect x="112" y="137" width="57" height="7" rx="3.5" fill={palette.navy2} />
          <Rect x="112" y="151" width="38" height="6" rx="3" fill={palette.borderStrong} />

          <Circle cx="211" cy="76" r="31" fill={palette.charcoal} />
          <Path d="M197 72 C197 64 203 59 211 59 H220 C228 59 233 64 233 72 V77 C233 85 228 90 220 90 H214 L205 97 V90 C200 88 197 83 197 77 Z" fill={palette.white} />
          <Circle cx="207" cy="75" r="2" fill={palette.orange} />
          <Circle cx="215" cy="75" r="2" fill={palette.orange} />
          <Circle cx="223" cy="75" r="2" fill={palette.orange} />
        </G>
      ) : null}

      {variant === "assistant" ? (
        <G>
          <Circle cx="150" cy="105" r="88" fill={palette.goldSoft} />
          <Path d="M57 117 C70 57, 121 23, 178 35 C224 45, 253 83, 246 127" fill="none" stroke={palette.gold} strokeWidth="3" strokeDasharray="5 9" strokeLinecap="round" opacity={0.72} />
          <Path d="M72 150 C112 181, 185 183, 228 142" fill="none" stroke={palette.redSoft} strokeWidth="4" strokeLinecap="round" />

          <Circle cx="150" cy="105" r="61" fill={palette.surface} stroke={palette.borderStrong} strokeWidth="2" />
          <Circle cx="150" cy="105" r="42" fill={`url(#${warmGradientId})`} />
          <Circle cx="150" cy="105" r="31" fill={palette.orange} opacity={0.36} />
          <Path d="M150 76 L157 96 L177 104 L157 112 L150 133 L143 112 L123 104 L143 96 Z" fill={palette.white} />
          <Circle cx="213" cy="57" r="17" fill={palette.charcoal} />
          <Path d="M208 57 L212 61 L219 52" fill="none" stroke={palette.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="70" cy="134" r="14" fill={`url(#${redGradientId})`} />
          <Path d="M65 134 H75 M70 129 V139" stroke={palette.white} strokeWidth="2.8" strokeLinecap="round" />
          <Circle cx="229" cy="143" r="8" fill={palette.red} />
          <Circle cx="87" cy="63" r="7" fill={palette.goldDeep} />
        </G>
      ) : null}
    </Svg>
  );
}
