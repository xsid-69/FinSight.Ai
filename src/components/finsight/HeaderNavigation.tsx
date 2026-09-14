import React from "react";
import { Pressable, StyleSheet, type LayoutChangeEvent, type ViewStyle } from "react-native";
import { XStack, Text } from "tamagui";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useReducedMotion } from "../../hooks/useReducedMotion";
import { headingProximity } from "../../screens/home/homePagerMath";

export type MainTab = "Overview" | "Transactions" | "Insights";
export const MAIN_TABS: MainTab[] = ["Overview", "Transactions", "Insights"];

export interface HeaderNavigationProps {
  active: MainTab;
  onChange: (t: MainTab) => boolean | void;
  pageProgress?: SharedValue<number>;
  rowOffsetX?: number;
  onMeasure?: (index: number, centerX: number) => void;
}

function HeaderTabItem({
  tab,
  index,
  active,
  pageProgress,
  reducedMotion,
  onLayout,
  onPress,
}: {
  tab: MainTab;
  index: number;
  active: MainTab;
  pageProgress?: SharedValue<number>;
  reducedMotion: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  onPress: () => void;
}) {
  const isCommitted = tab === active;

  const animatedContainerStyle = useAnimatedStyle<ViewStyle>(() => {
    const proximity = pageProgress
      ? headingProximity(pageProgress.value, index)
      : isCommitted
        ? 1
        : 0;
    const maxLift = reducedMotion ? 2 : 5;
    return {
      opacity: 0.72 + 0.28 * proximity,
      transform: [
        { translateY: -maxLift * proximity },
        { scale: reducedMotion ? 1 : 1 + 0.04 * proximity },
      ],
    };
  }, [isCommitted, pageProgress, index, reducedMotion]);

  return (
    <Animated.View style={animatedContainerStyle}>
      <Pressable
        testID={`home-header-tab-${tab.toLowerCase()}`}
        style={({ pressed }) => [styles.tabTarget, pressed && styles.tabPressed]}
        android_ripple={{ color: "rgba(255,255,255,0.16)", borderless: false }}
        onLayout={onLayout}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={tab}
        accessibilityState={{ selected: isCommitted }}
      >
        <Text
          pointerEvents="none"
          color="white"
          fontSize={isCommitted ? 16 : 14}
          fontWeight={isCommitted ? "800" : "600"}
          letterSpacing={-0.2}
        >
          {tab}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function HeaderNavigation({
  active,
  onChange,
  pageProgress,
  rowOffsetX = 0,
  onMeasure,
}: HeaderNavigationProps) {
  const reducedMotion = useReducedMotion();
  const handleLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    onMeasure?.(index, rowOffsetX + x + width / 2);
  };

  return (
    <XStack
      testID="home-header-runtime-swipe-dock-header-curve-v2"
      nativeID="home-header-runtime-swipe-dock-header-curve-v2"
      gap={16}
      alignItems="flex-end"
      justifyContent="center"
      width="100%"
    >
      {MAIN_TABS.map((tab, index) => (
        <HeaderTabItem
          key={tab}
          tab={tab}
          index={index}
          active={active}
          pageProgress={pageProgress}
          reducedMotion={reducedMotion}
          onLayout={handleLayout(index)}
          onPress={() => {
            if (tab === active) return;
            const accepted = onChange(tab);
            if (accepted === false) return;
            void Haptics.selectionAsync();
          }}
        />
      ))}
    </XStack>
  );
}

const styles = StyleSheet.create({
  tabTarget: {
    minWidth: 88,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  tabPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
});
