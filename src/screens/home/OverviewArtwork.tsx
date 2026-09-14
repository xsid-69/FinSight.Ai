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

export type OverviewArtworkVariant = "hero" | "activity" | "assistant";

interface OverviewArtworkProps {
  variant: OverviewArtworkVariant;
  width?: number;
}

const ACCESSIBILITY_LABELS: Record<OverviewArtworkVariant, string> = {
  hero: "Private financial records becoming a clear visual insight",
  activity: "A message card beside two connection status rows",
  assistant: "A sparkle representing a guided financial question",
};

export function OverviewArtwork({ variant, width = 260 }: OverviewArtworkProps) {
  const safeWidth = Number.isFinite(width) ? Math.max(112, Math.round(width)) : 260;
  const height = Math.round(safeWidth * 0.7);
  const redGradientId = `overview-red-${variant}`;
  const violetGradientId = `overview-violet-${variant}`;

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
          <Stop offset="0" stopColor="#FF5A68" />
          <Stop offset="1" stopColor="#C4001A" />
        </SvgLinearGradient>
        <SvgLinearGradient id={violetGradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#A89BFF" />
          <Stop offset="1" stopColor="#6556D8" />
        </SvgLinearGradient>
      </Defs>

      {variant === "hero" ? (
        <G>
          <Circle cx="244" cy="43" r="38" fill="#EB001B" opacity={0.18} />
          <Circle cx="43" cy="177" r="25" fill="#FFFFFF" opacity={0.07} />
          <Rect x="30" y="31" width="230" height="147" rx="30" fill="#FFFFFF" opacity={0.08} />
          <Rect x="43" y="20" width="218" height="150" rx="28" fill="#FFFFFF" />

          <Circle cx="71" cy="52" r="12" fill={`url(#${redGradientId})`} />
          <Path d="M66 52 L70 56 L77 47" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="94" y="44" width="68" height="8" rx="4" fill="#18233D" />
          <Rect x="94" y="59" width="43" height="6" rx="3" fill="#D7DBE4" />

          <Rect x="63" y="86" width="174" height="1.5" rx="0.75" fill="#ECEEF2" />
          <Path d="M65 135 C84 120, 98 141, 119 119 S154 109, 171 93 S200 103, 227 75" fill="none" stroke={`url(#${redGradientId})`} strokeWidth="6" strokeLinecap="round" />
          <Circle cx="119" cy="119" r="5" fill="#7C6CF2" />
          <Circle cx="171" cy="93" r="5" fill="#18233D" />
          <Circle cx="227" cy="75" r="7" fill="#EB001B" />

          <Circle cx="237" cy="163" r="28" fill="#18233D" />
          <Path d="M237 146 C247 150, 252 150, 252 150 V159 C252 170, 246 178, 237 182 C228 178, 222 170, 222 159 V150 C222 150, 228 150, 237 146 Z" fill="#FFFFFF" opacity={0.96} />
          <Path d="M231 164 L236 169 L244 158" fill="none" stroke="#EB001B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      ) : null}

      {variant === "activity" ? (
        <G>
          <Circle cx="150" cy="105" r="88" fill="#F5F6F9" />
          <Circle cx="238" cy="52" r="16" fill="#FFE4E7" />
          <Circle cx="61" cy="160" r="9" fill="#E8E5FF" />

          <Rect x="57" y="36" width="144" height="132" rx="28" fill="#FFFFFF" stroke="#E5E7EC" strokeWidth="2" />
          <Rect x="76" y="55" width="50" height="8" rx="4" fill="#18233D" />
          <Rect x="76" y="70" width="32" height="6" rx="3" fill="#D7DBE4" />

          <Circle cx="84" cy="101" r="14" fill={`url(#${redGradientId})`} />
          <Rect x="108" y="93" width="61" height="7" rx="3.5" fill="#303A51" />
          <Rect x="108" y="107" width="41" height="6" rx="3" fill="#D7DBE4" />

          <Circle cx="84" cy="138" r="14" fill="#E9E6FF" />
          <Path d="M78 138 L83 143 L91 133" fill="none" stroke="#6556D8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <Rect x="108" y="130" width="73" height="7" rx="3.5" fill="#303A51" />
          <Rect x="108" y="144" width="48" height="6" rx="3" fill="#D7DBE4" />

          <Circle cx="207" cy="73" r="31" fill="#18233D" />
          <Path d="M194 69 C194 62, 200 57, 207 57 H218 C225 57, 230 62, 230 69 V76 C230 83, 225 88, 218 88 H211 L203 95 V88 H207" fill="#FFFFFF" opacity={0.96} />
          <Circle cx="204" cy="73" r="2" fill="#EB001B" />
          <Circle cx="212" cy="73" r="2" fill="#EB001B" />
          <Circle cx="220" cy="73" r="2" fill="#EB001B" />
        </G>
      ) : null}

      {variant === "assistant" ? (
        <G>
          <Circle cx="150" cy="105" r="88" fill="#F4F2FF" />
          <Path d="M57 117 C70 57, 121 23, 178 35 C224 45, 253 83, 246 127" fill="none" stroke="#D8D2FF" strokeWidth="3" strokeDasharray="5 9" strokeLinecap="round" />
          <Path d="M72 150 C112 181, 185 183, 228 142" fill="none" stroke="#FFD5DA" strokeWidth="4" strokeLinecap="round" />

          <Circle cx="150" cy="105" r="61" fill="#FFFFFF" stroke="#E6E2FA" strokeWidth="2" />
          <Circle cx="150" cy="105" r="41" fill={`url(#${violetGradientId})`} />
          <Path d="M150 76 L157 96 L177 104 L157 112 L150 133 L143 112 L123 104 L143 96 Z" fill="#FFFFFF" />
          <Circle cx="213" cy="57" r="17" fill="#18233D" />
          <Path d="M208 57 L212 61 L219 52" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="70" cy="134" r="14" fill={`url(#${redGradientId})`} />
          <Path d="M65 134 H75 M70 129 V139" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
          <Circle cx="229" cy="143" r="8" fill="#EB001B" />
          <Circle cx="87" cy="63" r="7" fill="#7C6CF2" />
        </G>
      ) : null}
    </Svg>
  );
}
