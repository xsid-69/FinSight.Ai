import React, { useState } from "react";
import { useWindowDimensions } from "react-native";
import { YStack } from "tamagui";
import { IntelligenceHeader } from "./IntelligenceHeader";
import { MAIN_TABS, type MainTab } from "./HeaderNavigation";
import { CurvedContentSurface } from "../banking/CurvedContentSurface";

export interface FinSightShellProps {
  activeTab?: MainTab;
  onChangeTab?: (t: MainTab) => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
}

/**
 * Red intelligence header + curved calm surface. The bottom floating dock is
 * owned by the navigator, so it is intentionally not rendered here.
 */
export function FinSightShell({
  activeTab,
  onChangeTab,
  onProfile,
  onSettings,
  onLogout,
  title,
  subtitle,
  onBack,
  children,
}: FinSightShellProps) {
  const { width } = useWindowDimensions();
  const [centers, setCenters] = useState<number[]>([]);

  const activeIndex = activeTab ? MAIN_TABS.indexOf(activeTab) : -1;
  const bumpX = activeIndex >= 0 && centers[activeIndex] != null ? centers[activeIndex] : width / 2;

  const handleMeasure = (index: number, centerX: number) =>
    setCenters((prev) => {
      if (prev[index] === centerX) return prev;
      const next = [...prev];
      next[index] = centerX;
      return next;
    });

  return (
    <YStack flex={1} backgroundColor="$background">
      <IntelligenceHeader
        activeTab={activeTab}
        onChangeTab={onChangeTab}
        onMeasureTab={handleMeasure}
        onProfile={onProfile}
        onSettings={onSettings}
        onLogout={onLogout}
        title={title}
        subtitle={subtitle}
        onBack={onBack}
      />
      <CurvedContentSurface bumpX={bumpX}>{children}</CurvedContentSurface>
    </YStack>
  );
}
