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

import { brandColors } from "../../theme/mastercard";

interface FinancialEmptyArtworkProps {
  variant: "home" | "transactions" | "insights";
  width?: number;
}

export function FinancialEmptyArtwork({ variant, width = 220 }: FinancialEmptyArtworkProps) {
  const height = Math.round(width * 0.68);
  const gradientId = `empty-${variant}`;

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 220 150"
      accessible
      accessibilityRole="image"
      accessibilityLabel={
        variant === "home"
          ? "A secure statement ready for analysis"
          : variant === "transactions"
            ? "An empty transaction receipt"
            : "Financial insight signals waiting to activate"
      }
    >
      <Defs>
        <SvgLinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={brandColors.redIdentity} />
          <Stop offset="0.62" stopColor={brandColors.redAction} />
          <Stop offset="1" stopColor={brandColors.redPressed} />
        </SvgLinearGradient>
      </Defs>

      <Circle cx="110" cy="73" r="66" fill={brandColors.redSoft} />
      <Circle cx="176" cy="31" r="8" fill={brandColors.orangeSoft} />
      <Circle cx="36" cy="112" r="5" fill={brandColors.goldSoft} />

      {variant === "home" ? (
        <G>
          <Rect x="52" y="27" width="124" height="92" rx="20" fill={brandColors.orange} opacity="0.16" transform="rotate(7 114 73)" />
          <Rect x="40" y="20" width="128" height="96" rx="20" fill={brandColors.surface} stroke={brandColors.border} strokeWidth="2" />
          <Rect x="57" y="39" width="37" height="11" rx="5.5" fill={brandColors.charcoal} />
          <Rect x="57" y="60" width="86" height="7" rx="3.5" fill={brandColors.border} />
          <Rect x="57" y="76" width="62" height="7" rx="3.5" fill={brandColors.border} />
          <Path d="M59 99 C75 88, 85 104, 101 93 S128 82, 148 72" fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" strokeLinecap="round" />
          <Circle cx="148" cy="72" r="6" fill={brandColors.redIdentity} />
          <Circle cx="169" cy="112" r="22" fill={brandColors.charcoal} />
          <Path d="M169 100 L172 108 L180 111 L172 114 L169 122 L166 114 L158 111 L166 108 Z" fill={brandColors.white} />
        </G>
      ) : null}

      {variant === "transactions" ? (
        <G>
          <Rect x="54" y="18" width="112" height="116" rx="18" fill={brandColors.surface} stroke={brandColors.border} strokeWidth="2" />
          <Path d="M54 119 L66 129 L78 119 L90 129 L102 119 L114 129 L126 119 L138 129 L150 119 L166 132" fill={brandColors.surface} stroke={brandColors.border} strokeWidth="2" strokeLinejoin="round" />
          <Circle cx="76" cy="48" r="11" fill={`url(#${gradientId})`} />
          <Rect x="96" y="42" width="47" height="7" rx="3.5" fill={brandColors.charcoal} />
          <Rect x="96" y="56" width="31" height="6" rx="3" fill={brandColors.border} />
          <Rect x="72" y="80" width="72" height="7" rx="3.5" fill={brandColors.border} />
          <Rect x="72" y="96" width="54" height="7" rx="3.5" fill={brandColors.border} />
          <Circle cx="172" cy="41" r="21" fill={brandColors.charcoal} />
          <Path d="M163 41 L169 47 L181 34" fill="none" stroke={brandColors.white} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      ) : null}

      {variant === "insights" ? (
        <G>
          <Circle cx="110" cy="73" r="42" fill={brandColors.surface} stroke={brandColors.border} strokeWidth="2" />
          <Circle cx="110" cy="73" r="25" fill={brandColors.goldSoft} />
          <Path d="M110 54 L115 67 L128 72 L115 77 L110 91 L105 77 L92 72 L105 67 Z" fill={`url(#${gradientId})`} />
          <Path d="M46 92 C60 57, 79 41, 110 31 C142 21, 169 42, 181 68" fill="none" stroke={brandColors.orange} strokeWidth="3" strokeLinecap="round" strokeDasharray="4 8" />
          <Path d="M51 102 C81 127, 143 131, 177 91" fill="none" stroke={brandColors.redIdentity} strokeWidth="3" strokeLinecap="round" />
          <Circle cx="48" cy="96" r="9" fill={brandColors.charcoal} />
          <Circle cx="180" cy="71" r="9" fill={brandColors.gold} />
          <Circle cx="175" cy="94" r="7" fill={brandColors.redIdentity} />
        </G>
      ) : null}
    </Svg>
  );
}
