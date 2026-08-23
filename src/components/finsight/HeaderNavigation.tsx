import React from "react";
import { XStack, Text } from "tamagui";
import type { LayoutChangeEvent } from "react-native";
import * as Haptics from "expo-haptics";

export type MainTab = "Overview" | "Transactions" | "Insights";

export const MAIN_TABS: MainTab[] = ["Overview", "Transactions", "Insights"];

export interface HeaderNavigationProps {
  active: MainTab;
  onChange: (t: MainTab) => void;
  /** Horizontal offset of this row from the screen's left edge (px). */
  rowOffsetX?: number;
  /** Reports the absolute screen-x center of each tab (for the curve bump). */
  onMeasure?: (index: number, centerX: number) => void;
}

/**
 * Compact section control inside the red header. No underline, no pill —
 * the active tab is brighter/heavier and the curved surface rises beneath it.
 */
export function HeaderNavigation({ active, onChange, rowOffsetX = 0, onMeasure }: HeaderNavigationProps) {
  const handleLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    onMeasure?.(index, rowOffsetX + x + width / 2);
  };

  return (
    <XStack gap={28} alignItems="flex-end" justifyContent="center" width="100%">
      {MAIN_TABS.map((t, i) => {
        const isActive = t === active;
        return (
          <Text
            key={t}
            onLayout={handleLayout(i)}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(t);
            }}
            pressStyle={{ opacity: 0.7 }}
            color={isActive ? "white" : "rgba(255,255,255,0.6)"}
            fontSize={isActive ? 18 : 14}
            fontWeight={isActive ? "800" : "600"}
            letterSpacing={-0.2}
            y={isActive ? -8 : 0}
          >
            {t}
          </Text>
        );
      })}
    </XStack>
  );
}
