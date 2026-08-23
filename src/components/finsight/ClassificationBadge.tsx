import React from "react";
import { XStack, Text, View } from "tamagui";
import { Zap, GraduationCap, Sparkles } from "@tamagui/lucide-icons";
import type { ClassificationTier } from "../../data/intelligence";

const MAP: Record<ClassificationTier, { label: string; color: string; bg: string; Icon: any }> = {
  instant: { label: "Instant", color: "$success", bg: "rgba(99,166,74,0.12)", Icon: Zap },
  learned: { label: "Learned", color: "$navy2", bg: "rgba(57,67,92,0.10)", Icon: GraduationCap },
  ai: { label: "AI classified", color: "$ai", bg: "$aiSoft", Icon: Sparkles },
};

/** Tiny badge translating the 3-tier classifier into human microcopy. */
export function ClassificationBadge({ tier }: { tier: ClassificationTier }) {
  const c = MAP[tier];
  const Icon = c.Icon;
  return (
    <XStack alignItems="center" gap={4} backgroundColor={c.bg as any} borderRadius={999} paddingHorizontal={7} paddingVertical={3}>
      <Icon size={10} color={c.color} strokeWidth={2.6} />
      <Text fontSize={10} fontWeight="800" color={c.color as any} letterSpacing={0.1}>
        {c.label}
      </Text>
    </XStack>
  );
}
