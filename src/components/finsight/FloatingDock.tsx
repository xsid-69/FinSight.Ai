import React from "react";
import { useWindowDimensions } from "react-native";
import { XStack, YStack, Text, View } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { LayoutDashboard, TrendingUp } from "@tamagui/lucide-icons";
import type { LucideIcon } from "../IconSquare";
import { FloatingAIButton } from "./FloatingAIButton";
import { palette } from "../../constants/colors";

/* curved top edge — a shallow DOWNWARD scoop directly beneath the AI action */
const CURVE_H = 26;
const SHOULDER = 6; // sides sit near the top edge
const DIP = 16; // depth of the downward scoop
const VALLEY_Y = SHOULDER + DIP;
const CORNER = 18;
const BUMP_HALF = 52;

function buildCenterCurve(w: number): string {
  const x = w / 2;
  const h = BUMP_HALF * 0.55;
  return [
    `M 0 ${CURVE_H}`,
    `L 0 ${SHOULDER + CORNER}`,
    `Q 0 ${SHOULDER} ${CORNER} ${SHOULDER}`,
    `L ${x - BUMP_HALF} ${SHOULDER}`,
    `C ${x - h} ${SHOULDER} ${x - h} ${VALLEY_Y} ${x} ${VALLEY_Y}`,
    `C ${x + h} ${VALLEY_Y} ${x + h} ${SHOULDER} ${x + BUMP_HALF} ${SHOULDER}`,
    `L ${w - CORNER} ${SHOULDER}`,
    `Q ${w} ${SHOULDER} ${w} ${SHOULDER + CORNER}`,
    `L ${w} ${CURVE_H}`,
    "Z",
  ].join(" ");
}

function DockItem({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap={5} onPress={onPress} pressStyle={{ opacity: 0.55 }}>
      <View width={40} height={40} borderRadius={13} alignItems="center" justifyContent="center" backgroundColor={active ? "rgba(235,0,27,0.10)" : "transparent"}>
        <Icon size={23} color={active ? "$red" : "$secondary"} strokeWidth={active ? 2.4 : 2} />
      </View>
      <Text fontSize={11} fontWeight={active ? "800" : "600"} color={active ? "$red" : "$secondary"} letterSpacing={-0.1}>
        {label}
      </Text>
    </YStack>
  );
}

/**
 * Grounded, full-width bottom navigation with a permanent center curve that
 * cradles the AI action. Three destinations: Overview · AI · Insights.
 * Overview/Insights drive the Home header tab; AI is the analytics page.
 */
export function FloatingDock({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const current = state.routes[state.index]?.name ?? "Home";

  const overviewActive = current === "Home";
  const aiActive = current === "AI";

  const bodyHeight = Math.max(78, Math.min(104, Math.round(height * 0.1)));
  const path = buildCenterCurve(width);

  const nav = navigation as any;
  const goHome = (tab: string) => () => {
    Haptics.selectionAsync();
    nav.navigate("Home", { tab });
  };
  const goAI = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    nav.navigate("AI");
  };
  const openImport = () => {
    Haptics.selectionAsync();
    (nav.getParent?.() ?? nav).navigate("Analyzer");
  };

  return (
    <View position="absolute" left={0} right={0} bottom={0} pointerEvents="box-none">
      <Svg width={width} height={CURVE_H} pointerEvents="none">
        <Path d={path} fill={palette.surface} stroke={palette.border} strokeWidth={1} />
      </Svg>

      <XStack backgroundColor="$backgroundStrong" marginTop={-1} height={bodyHeight} paddingBottom={insets.bottom} alignItems="center">
        <DockItem icon={LayoutDashboard} label="Overview" active={overviewActive} onPress={goHome("Overview")} />

        {/* center AI slot nestled into the downward scoop */}
        <View width={86} alignItems="center" justifyContent="flex-start" alignSelf="stretch">
          <View position="absolute" top={-26}>
            <FloatingAIButton size={58} onPress={goAI} />
          </View>
          <Text fontSize={11} fontWeight="800" color={aiActive ? "$red" : "$ai"} marginTop={38}>
            AI
          </Text>
        </View>

        <DockItem icon={TrendingUp} label="Insights" active={false} onPress={openImport} />
      </XStack>
    </View>
  );
}
