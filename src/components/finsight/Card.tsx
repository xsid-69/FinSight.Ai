import React from "react";
import { YStack, type YStackProps } from "tamagui";

export type CardVariant = "surface" | "soft" | "flat" | "charcoal";

export interface CardProps extends YStackProps {
  children: React.ReactNode;
  variant?: CardVariant;
}

const VARIANT_PROPS: Record<CardVariant, Partial<YStackProps>> = {
  surface: {
    backgroundColor: "$backgroundStrong",
    borderColor: "$borderColor",
    shadowColor: "$shadowColor",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  soft: {
    backgroundColor: "$surfaceAlt",
    borderColor: "$borderColor",
    shadowOpacity: 0,
  },
  flat: {
    backgroundColor: "$backgroundStrong",
    borderColor: "$borderColor",
    shadowOpacity: 0,
  },
  charcoal: {
    backgroundColor: "$heroSurface",
    borderColor: "$heroSurfaceRaised",
    shadowColor: "$shadowColor",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
  },
};

export function Card({ children, variant = "surface", ...rest }: CardProps) {
  return (
    <YStack
      borderRadius="$card"
      borderWidth={1}
      padding={18}
      {...VARIANT_PROPS[variant]}
      {...rest}
    >
      {children}
    </YStack>
  );
}
