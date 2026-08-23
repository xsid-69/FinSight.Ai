import React from "react";
import { Square } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import type { IconProps } from "@tamagui/helpers-icon";
import { redGradient, gradientStart, gradientEnd } from "../constants/colors";

export type LucideIcon = (props: IconProps) => React.ReactElement;

export interface IconSquareProps {
  icon: LucideIcon;
  /** Background color token or raw color (e.g. "$accentPink"). Ignored if `gradient`. */
  color?: string;
  /** Render a gradient fill. `true` uses the brand pink gradient. */
  gradient?: boolean | readonly [string, string];
  /** Square edge size in px. small=32, medium=40, large=48. */
  size?: number;
  iconColor?: string;
  radius?: number | string;
  iconStrokeWidth?: number;
}

/**
 * Colored rounded square with a Lucide icon centered inside.
 * The signature "category chip" used across accounts, payments, budget.
 * Supports the brand pink gradient fill (matching the reference).
 */
export function IconSquare({
  icon: Icon,
  color = "$brandRed",
  gradient,
  size = 40,
  iconColor = "white",
  radius = "$icon",
  iconStrokeWidth = 1.9,
}: IconSquareProps) {
  const iconSize = Math.round(size * 0.5);
  const gradientColors = gradient === true ? redGradient : gradient || undefined;

  return (
    <Square
      size={size}
      borderRadius={radius as any}
      backgroundColor={gradientColors ? "transparent" : (color as any)}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors as unknown as [string, string]}
          start={gradientStart}
          end={gradientEnd}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      <Icon size={iconSize} color={iconColor as any} strokeWidth={iconStrokeWidth} />
    </Square>
  );
}
