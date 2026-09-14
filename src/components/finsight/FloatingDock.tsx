import React from "react";
import {
  Pressable,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { XStack, YStack, Text, View } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LayoutDashboard, TrendingUp } from "@tamagui/lucide-icons";
import type { LucideIcon } from "../IconSquare";
import { FloatingAIButton } from "./FloatingAIButton";
import { palette } from "../../constants/colors";
import {
  isMainTab,
  useOptionalHomePagerCoordinator,
} from "../../screens/home/HomePagerCoordinator";
import type { MainTab } from "./HeaderNavigation";

export const EXPECTED_DOCK_REVISION = "swipe-dock-header-curve-v2";

const CONTROL_HEIGHT = 84;
const ICON_CENTER_Y = 29;
const LABEL_TOP = 66;

export function buildClosedFillPath(width: number, bottomInset: number): string {
  const center = width / 2;
  const notchHalf = Math.min(62, Math.max(20, (width - 36) / 2));
  const control = notchHalf * 0.52;
  const shoulderY = 22;
  const valleyY = 64;
  const bottomY = CONTROL_HEIGHT + bottomInset + 20;

  return [
    `M 0 ${shoulderY}`,
    `L ${center - notchHalf} ${shoulderY}`,
    `C ${center - control} ${shoulderY} ${center - control} ${valleyY} ${center} ${valleyY}`,
    `C ${center + control} ${valleyY} ${center + control} ${shoulderY} ${center + notchHalf} ${shoulderY}`,
    `L ${width} ${shoulderY}`,
    `L ${width} ${bottomY}`,
    `L 0 ${bottomY}`,
    "Z",
  ].join(" ");
}

export function buildTopBorderPath(width: number): string {
  const center = width / 2;
  const notchHalf = Math.min(62, Math.max(20, (width - 36) / 2));
  const control = notchHalf * 0.52;
  const shoulderY = 22;
  const valleyY = 64;

  return [
    `M 0 ${shoulderY}`,
    `L ${center - notchHalf} ${shoulderY}`,
    `C ${center - control} ${shoulderY} ${center - control} ${valleyY} ${center} ${valleyY}`,
    `C ${center + control} ${valleyY} ${center + control} ${shoulderY} ${center + notchHalf} ${shoulderY}`,
    `L ${width} ${shoulderY}`,
  ].join(" ");
}

const SIDE_ACTION_WIDTH = 72;
const SIDE_ACTION_TOP = 22;
const SIDE_ACTION_HEIGHT = CONTROL_HEIGHT - SIDE_ACTION_TOP;
const SIDE_CONTENT_TOP = 5;
const SIDE_LABEL_GAP = 2;

export function resolveSideActionStyle(pressed: boolean): StyleProp<ViewStyle> {
  return [styles.sideAction, pressed ? styles.pressedSideAction : undefined];
}

function DockItem({
  testID,
  icon: Icon,
  label,
  active,
  onPress,
}: {
  testID: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View
      testID={`${testID}-slot`}
      pointerEvents="box-none"
      style={styles.sideSlot}
    >
      <Pressable
        testID={testID}
        style={({ pressed }) => resolveSideActionStyle(pressed)}
        android_ripple={{ color: "rgba(235,0,27,0.08)", borderless: false }}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: active }}
      >
        <View
          testID={`${testID}-icon`}
          pointerEvents="none"
          width={36}
          height={32}
          borderRadius={12}
          alignItems="center"
          justifyContent="center"
          backgroundColor={active ? "rgba(235,0,27,0.10)" : "transparent"}
        >
          <Icon size={22} color={active ? "$red" : "$secondary"} strokeWidth={active ? 2.4 : 2} />
        </View>
        <Text
          testID={`${testID}-label`}
          pointerEvents="none"
          marginTop={SIDE_LABEL_GAP}
          lineHeight={14}
          fontSize={10.5}
          fontWeight={active ? "800" : "600"}
          color={active ? "$red" : "$secondary"}
          textAlign="center"
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

/** Rebuilt FloatingDock with single baseline, deep notch, and two-path SVG curve. */
export function FloatingDock({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const coordinator = useOptionalHomePagerCoordinator();

  const currentRoute = state.routes[state.index];
  const current = currentRoute?.name ?? "Home";
  const homeRoute = state.routes.find((route) => route.name === "Home");
  const routeHomeTab = (homeRoute?.params as { tab?: unknown } | undefined)?.tab;
  const committedTab: MainTab = coordinator?.committedTab
    ?? (isMainTab(routeHomeTab) ? routeHomeTab : "Overview");
  const overviewActive = current === "Home" && committedTab === "Overview";
  const insightsActive = current === "Home" && committedTab === "Insights";
  const aiActive = current === "AI";

  const fillPath = buildClosedFillPath(width, insets.bottom);
  const borderPath = buildTopBorderPath(width);
  const nav = navigation as any;

  const handleTabPress = (target: MainTab) => () => {
    const isCurrentlyActive = current === "Home" && committedTab === target;
    const isAlreadyPending = current === "Home" && coordinator?.pendingRequest?.target === target;
    if (isCurrentlyActive || isAlreadyPending) return;

    if (coordinator) {
      coordinator.requestPage(target, "dock", true);
      if (current !== "Home") {
        nav.navigate("Home");
      }
    } else {
      nav.navigate("Home", { tab: target });
    }
    void Haptics.selectionAsync();
  };

  const handleAIPress = () => {
    if (aiActive) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nav.navigate("AI");
  };

  return (
    <View
      testID="floating-dock-runtime-swipe-dock-header-curve-v2"
      nativeID="floating-dock-runtime-swipe-dock-header-curve-v2"
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      height={CONTROL_HEIGHT + insets.bottom}
      zIndex={20}
      pointerEvents="box-none"
    >
      <Svg
        width={width}
        height={CONTROL_HEIGHT + insets.bottom + 10}
        style={{ position: "absolute", top: 0, left: 0 }}
        pointerEvents="none"
      >
        <Path testID="floating-dock-fill-path" d={fillPath} fill={palette.surface} />
        <Path
          testID="floating-dock-border-path"
          d={borderPath}
          fill="none"
          stroke={palette.border}
          strokeWidth={1}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      </Svg>

      <XStack
        pointerEvents="box-none"
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={CONTROL_HEIGHT + insets.bottom}
        paddingBottom={insets.bottom}
        alignItems="flex-start"
      >
        <DockItem
          testID="floating-dock-overview"
          icon={LayoutDashboard}
          label="Overview"
          active={overviewActive}
          onPress={handleTabPress("Overview")}
        />

        <Pressable
          testID="floating-dock-ai"
          style={({ pressed }) => [styles.aiSlot, pressed && styles.pressedSlot]}
          android_ripple={{ color: "rgba(124,108,242,0.10)", borderless: false }}
          onPress={handleAIPress}
          accessibilityRole="tab"
          accessibilityLabel="FinSight AI"
          accessibilityHint="Open AI analytics and assistant"
          accessibilityState={{ selected: aiActive }}
        >
          <View
            testID="floating-dock-ai-visual"
            pointerEvents="none"
            position="absolute"
            top={ICON_CENTER_Y - 29}
          >
            <FloatingAIButton size={58} active={aiActive} />
          </View>
          <Text
            testID="floating-dock-ai-label"
            pointerEvents="none"
            position="absolute"
            top={LABEL_TOP}
            lineHeight={14}
            fontSize={10.5}
            fontWeight="800"
            color={aiActive ? "$red" : "$ai"}
          >
            AI
          </Text>
        </Pressable>

        <DockItem
          testID="floating-dock-insights"
          icon={TrendingUp}
          label="Insights"
          active={insightsActive}
          onPress={handleTabPress("Insights")}
        />
      </XStack>
    </View>
  );
}

const styles = StyleSheet.create({
  sideSlot: {
    flex: 1,
    height: CONTROL_HEIGHT,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  sideAction: {
    marginTop: SIDE_ACTION_TOP,
    width: SIDE_ACTION_WIDTH,
    height: SIDE_ACTION_HEIGHT,
    minWidth: 48,
    minHeight: 48,
    paddingTop: SIDE_CONTENT_TOP,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  aiSlot: {
    width: 88,
    height: CONTROL_HEIGHT,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  pressedSideAction: {
    opacity: 0.72,
  },
  pressedSlot: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
