import React, { useCallback, useEffect, useRef, useState } from "react";
import { useWindowDimensions } from "react-native";
import { YStack } from "tamagui";
import type { SharedValue } from "react-native-reanimated";
import { IntelligenceHeader } from "./IntelligenceHeader";
import { MAIN_TABS, type MainTab } from "./HeaderNavigation";
import { CurvedContentSurface } from "../banking/CurvedContentSurface";
import {
  isValidHeadingCenters,
  type HeadingCenters,
} from "../../screens/home/homePagerMath";

export interface FinSightShellProps {
  activeTab?: MainTab;
  onChangeTab?: (t: MainTab) => boolean | void;
  pageProgress?: SharedValue<number>;
  onOpenCsvWorkspace?: () => boolean | void;
  csvWorkspaceSelected?: boolean;
  onProfile?: () => void;
  onSettings?: () => void;
  onNotifications?: () => void;
  onHelp?: () => void;
  onLogout?: () => void;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  /** The animated header curve belongs only to the primary Home pager. */
  curved?: boolean;
  children: React.ReactNode;
}

export function FinSightShell({
  activeTab,
  onChangeTab,
  pageProgress,
  onOpenCsvWorkspace,
  csvWorkspaceSelected,
  onProfile,
  onSettings,
  onNotifications,
  onHelp,
  onLogout,
  title,
  subtitle,
  onBack,
  curved = false,
  children,
}: FinSightShellProps) {
  const { width } = useWindowDimensions();
  const pendingCentersRef = useRef<Array<number | undefined>>([]);
  const [centers, setCenters] = useState<HeadingCenters | null>(null);
  const activeIndex = activeTab ? MAIN_TABS.indexOf(activeTab) : -1;
  const bumpX = activeIndex >= 0 && centers?.[activeIndex] != null
    ? centers[activeIndex]
    : width / 2;

  useEffect(() => {
    pendingCentersRef.current = [];
    setCenters(null);
  }, [width]);

  const handleMeasure = useCallback((index: number, centerX: number) => {
    if (index < 0 || index > 2 || !Number.isFinite(centerX)) return;

    pendingCentersRef.current[index] = centerX;
    const first = pendingCentersRef.current[0];
    const second = pendingCentersRef.current[1];
    const third = pendingCentersRef.current[2];
    if (
      typeof first !== "number"
      || typeof second !== "number"
      || typeof third !== "number"
    ) {
      return;
    }

    const candidate = [first, second, third] as const;
    if (isValidHeadingCenters(candidate)) {
      setCenters((previous) =>
        previous
        && previous[0] === candidate[0]
        && previous[1] === candidate[1]
        && previous[2] === candidate[2]
          ? previous
          : candidate,
      );
    }
  }, []);

  return (
    <YStack flex={1} backgroundColor="$background">
      <IntelligenceHeader
        activeTab={activeTab}
        onChangeTab={onChangeTab}
        onMeasureTab={curved ? handleMeasure : undefined}
        pageProgress={pageProgress}
        onOpenCsvWorkspace={onOpenCsvWorkspace}
        csvWorkspaceSelected={csvWorkspaceSelected}
        onProfile={onProfile}
        onSettings={onSettings}
        onNotifications={onNotifications}
        onHelp={onHelp}
        onLogout={onLogout}
        title={title}
        subtitle={subtitle}
        onBack={onBack}
      />
      {curved ? (
        <CurvedContentSurface
          bumpX={bumpX}
          pageProgress={pageProgress}
          headingCenters={centers ?? undefined}
        >
          {children}
        </CurvedContentSurface>
      ) : (
        <YStack testID="plain-content-surface" flex={1} backgroundColor="$background">
          {children}
        </YStack>
      )}
    </YStack>
  );
}
