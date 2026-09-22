import React, { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView as RNScrollView,
  useWindowDimensions,
} from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolation,
  type SharedValue,
} from "react-native-reanimated";
import {
  ArrowUpRight,
  Hourglass,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "@tamagui/lucide-icons";
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Rect, Stop } from "react-native-svg";
import { brandColors, brandGradients, brandOverlays } from "../../theme/mastercard";
import { triggerButtonHaptic, triggerSelectionHaptic } from "../../utils/haptics";
import { SpringPressable } from "./SpringPressable";

const PAGE_H = 20;
const CARD_GAP = 14;

const AnimatedScrollView =
  (Animated as any)?.ScrollView ||
  (typeof Animated?.createAnimatedComponent === "function"
    ? Animated.createAnimatedComponent(RNScrollView)
    : RNScrollView);

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  badge?: string;
  colors: readonly [string, string, ...string[]];
  graphicType: "time-machine" | "spending-velocity" | "cohort-mirror";
  onPress: () => void;
}

interface InteractiveBannerCarouselProps {
  navigation?: any;
  onOpenSimulator?: () => void;
  onOpenInsights?: () => void;
}

function TimeMachineGraphic() {
  return (
    <View width={78} height={78} alignItems="center" justifyContent="center">
      <Svg width={74} height={74} viewBox="0 0 74 74" fill="none">
        <Defs>
          <SvgGradient id="tmRing" x1="0" y1="0" x2="74" y2="74">
            <Stop offset="0%" stopColor={brandColors.gold} stopOpacity="0.9" />
            <Stop offset="50%" stopColor={brandColors.orange} stopOpacity="0.75" />
            <Stop offset="100%" stopColor={brandColors.redIdentity} stopOpacity="0.3" />
          </SvgGradient>
          <SvgGradient id="tmCore" x1="10" y1="10" x2="64" y2="64">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </SvgGradient>
        </Defs>
        {/* Outer Orbiting Ring */}
        <Circle cx="37" cy="37" r="32" stroke="url(#tmRing)" strokeWidth="2" strokeDasharray="6 4" opacity={0.85} />
        {/* Core Glass Sphere */}
        <Circle cx="37" cy="37" r="24" fill="url(#tmCore)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {/* Center Hourglass Glyph */}
        <Path
          d="M28 25H46L39 34L46 43H28L35 34L28 25Z"
          fill={brandColors.gold}
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.2"
          opacity={0.95}
        />
        {/* Futuristic Horizon Grid */}
        <Path d="M22 52L52 52" stroke={brandColors.orange} strokeWidth="1.5" opacity={0.6} />
        <Path d="M26 56L48 56" stroke={brandColors.gold} strokeWidth="1" opacity={0.4} />
      </Svg>
    </View>
  );
}

function SpendingVelocityGraphic() {
  return (
    <View width={78} height={78} alignItems="center" justifyContent="center">
      <Svg width={74} height={74} viewBox="0 0 74 74" fill="none">
        <Defs>
          <SvgGradient id="velGrad" x1="0" y1="0" x2="74" y2="74">
            <Stop offset="0%" stopColor={brandColors.redIdentity} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={brandColors.redPressed} stopOpacity="0.8" />
          </SvgGradient>
          <SvgGradient id="coinGrad" x1="0" y1="0" x2="28" y2="28">
            <Stop offset="0%" stopColor={brandColors.gold} />
            <Stop offset="100%" stopColor={brandColors.orangeDeep} />
          </SvgGradient>
        </Defs>
        {/* Glowing Ambient Halo */}
        <Circle cx="37" cy="37" r="30" fill="rgba(235,0,27,0.12)" />
        {/* 3D Isometric Card/Wallet Surface */}
        <Rect
          x="18"
          y="22"
          width="38"
          height="30"
          rx="7"
          fill="url(#velGrad)"
          stroke="rgba(255,255,255,0.24)"
          strokeWidth="1.2"
        />
        <Rect x="23" y="27" width="18" height="4" rx="2" fill="rgba(255,255,255,0.4)" />
        {/* Floating 3D Gold Coins */}
        <Circle cx="47" cy="22" r="10" fill="url(#coinGrad)" stroke="#FFFFFF" strokeWidth="1.2" />
        <Path d="M47 17V27M44 20H50" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
        {/* Speed Arrow / Metric Spark */}
        <Path
          d="M16 52L27 41L34 46L54 28"
          stroke={brandColors.gold}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function CohortMirrorGraphic() {
  return (
    <View width={78} height={78} alignItems="center" justifyContent="center">
      <Svg width={74} height={74} viewBox="0 0 74 74" fill="none">
        <Defs>
          <SvgGradient id="cohortBg" x1="0" y1="0" x2="74" y2="74">
            <Stop offset="0%" stopColor={brandColors.orange} stopOpacity="0.85" />
            <Stop offset="100%" stopColor={brandColors.gold} stopOpacity="0.9" />
          </SvgGradient>
        </Defs>
        {/* Ambient Ring */}
        <Circle cx="37" cy="37" r="32" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
        {/* Stylized Avatar Group Bubble 1 (Center) */}
        <Circle cx="37" cy="33" r="14" fill="url(#cohortBg)" stroke="#FFFFFF" strokeWidth="1.5" />
        <Path d="M30 43C30 39.5 33 37 37 37C41 37 44 39.5 44 43" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Avatar Bubble 2 (Left) */}
        <Circle cx="21" cy="40" r="10" fill={brandColors.charcoalRaised} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {/* Avatar Bubble 3 (Right) */}
        <Circle cx="53" cy="40" r="10" fill={brandColors.charcoalRaised} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        {/* Percentile Sparkle Badge */}
        <Circle cx="48" cy="18" r="7" fill={brandColors.redIdentity} stroke="#FFFFFF" strokeWidth="1" />
        <Path d="M48 15V21M45 18H51" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

interface BannerCardProps {
  banner: BannerItem;
  index: number;
  cardWidth: number;
  scrollX: SharedValue<number>;
}

function BannerCard({ banner, index, cardWidth, scrollX }: BannerCardProps) {
  const snapInterval = cardWidth + CARD_GAP;

  const animatedScaleStyle = useAnimatedStyle(() => {
    if (typeof interpolate !== "function") {
      return {
        transform: [{ scale: 1 }],
        opacity: 1,
      };
    }
    const inputRange = [
      (index - 1) * snapInterval,
      index * snapInterval,
      (index + 1) * snapInterval,
    ];
    const clampMode = Extrapolation?.CLAMP ?? ("clamp" as any);
    // Active center card scales to 1.0, background cards to 0.94
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.94, 1.0, 0.94],
      clampMode,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.86, 1.0, 0.86],
      clampMode,
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const renderGraphic = () => {
    switch (banner.graphicType) {
      case "time-machine":
        return <TimeMachineGraphic />;
      case "spending-velocity":
        return <SpendingVelocityGraphic />;
      case "cohort-mirror":
        return <CohortMirrorGraphic />;
    }
  };

  return (
    <Animated.View style={[{ width: cardWidth }, animatedScaleStyle]}>
      <SpringPressable
        scaleTo={0.97}
        onPress={banner.onPress}
        accessibilityRole="button"
        accessibilityLabel={`${banner.title}. ${banner.subtitle}`}
        style={{ width: "100%" }}
      >
        <YStack
          width="100%"
          minHeight={196}
          borderRadius={24}
          overflow="hidden"
          padding={18}
          justifyContent="space-between"
          borderWidth={1}
          borderColor={brandOverlays.onBrand18}
          shadowColor={brandColors.charcoal}
          shadowOffset={{ width: 0, height: 12 }}
          shadowOpacity={0.22}
          shadowRadius={24}
        >
          {/* Background Gradient */}
          <LinearGradient
            colors={banner.colors as [string, string, ...string[]]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Ambient Lighting Orbs */}
          <View
            position="absolute"
            width={140}
            height={140}
            borderRadius={70}
            backgroundColor={brandOverlays.onBrand08}
            top={-50}
            right={-20}
          />

          {/* Header Row: Badge & Graphic */}
          <XStack alignItems="center" justifyContent="space-between" gap={10}>
            {banner.badge ? (
              <XStack
                paddingHorizontal={10}
                paddingVertical={4.5}
                borderRadius={999}
                backgroundColor={brandOverlays.onBrand18}
                borderWidth={1}
                borderColor={brandOverlays.onBrand24}
                alignItems="center"
                gap={5}
              >
                <Sparkles size={11.5} color={brandColors.white} strokeWidth={2.4} />
                <Text
                  fontSize={10.5}
                  fontWeight="800"
                  color={brandColors.white}
                  letterSpacing={0.3}
                >
                  {banner.badge}
                </Text>
              </XStack>
            ) : (
              <View />
            )}
            {renderGraphic()}
          </XStack>

          {/* Bottom Content Row */}
          <YStack gap={8} marginTop={8}>
            <YStack gap={3}>
              <Text
                fontSize={18.5}
                lineHeight={23}
                fontWeight="800"
                color={brandColors.white}
                letterSpacing={-0.45}
              >
                {banner.title}
              </Text>
              <Text
                fontSize={12.5}
                lineHeight={17}
                color={brandColors.white}
                opacity={0.82}
                maxWidth={240}
              >
                {banner.subtitle}
              </Text>
            </YStack>

            <XStack alignItems="center" justifyContent="space-between" marginTop={4}>
              <XStack alignItems="center" gap={5}>
                <Text fontSize={12} fontWeight="800" color={brandColors.white}>
                  {banner.actionLabel}
                </Text>
                <ArrowUpRight size={15} color={brandColors.white} strokeWidth={2.4} />
              </XStack>
            </XStack>
          </YStack>
        </YStack>
      </SpringPressable>
    </Animated.View>
  );
}

export function InteractiveBannerCarousel({
  navigation,
  onOpenSimulator,
  onOpenInsights,
}: InteractiveBannerCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);

  const cardWidth = Math.min(width - PAGE_H * 2 - 24, 344);
  const snapInterval = cardWidth + CARD_GAP;

  const scrollHandler =
    typeof useAnimatedScrollHandler === "function"
      ? useAnimatedScrollHandler({
          onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
          },
        })
      : undefined;

  const banners: BannerItem[] = [
    {
      id: "simulator",
      title: "Forecast 2027 Wealth",
      subtitle: "Simulate laptop or car purchase impact with deterministic AI",
      actionLabel: "Launch Simulator",
      badge: "What-If Time Machine",
      colors: brandGradients.charcoal,
      graphicType: "time-machine",
      onPress: () => {
        void triggerButtonHaptic();
        if (onOpenSimulator) onOpenSimulator();
        else navigation?.navigate?.("Simulator");
      },
    },
    {
      id: "velocity",
      title: "Weekly Spending Velocity",
      subtitle: "Track momentum, category peaks, and real-time cash burn",
      actionLabel: "Explore Velocity",
      badge: "Active Radar",
      colors: brandGradients.primary,
      graphicType: "spending-velocity",
      onPress: () => {
        void triggerButtonHaptic();
        if (onOpenInsights) onOpenInsights();
        else navigation?.navigate?.("Home", { tab: "Insights", insightsView: "analysis" });
      },
    },
    {
      id: "cohort",
      title: "Cohort Financial Mirror",
      subtitle: "Benchmark your monthly savings against city peer percentiles",
      actionLabel: "Compare Cohort",
      badge: "Top 12% In City",
      colors: brandGradients.warm,
      graphicType: "cohort-mirror",
      onPress: () => {
        void triggerButtonHaptic();
        if (onOpenInsights) onOpenInsights();
        else navigation?.navigate?.("Home", { tab: "Insights", insightsView: "analysis" });
      },
    },
  ];

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    const clampedIndex = Math.max(0, Math.min(nextIndex, banners.length - 1));
    if (clampedIndex !== activeIndex) {
      setActiveIndex(clampedIndex);
      void triggerSelectionHaptic();
    }
  };

  return (
    <YStack gap={13} marginTop={22}>
      {/* Header section label */}
      <XStack alignItems="flex-end" justifyContent="space-between">
        <YStack gap={2}>
          <Text
            fontSize={10.5}
            textTransform="uppercase"
            letterSpacing={1.8}
            fontWeight="700"
            color="$ink2"
          >
            SMART INTELLIGENCE
          </Text>
          <Text fontSize={17} fontWeight="800" color="$charcoal" letterSpacing={-0.3}>
            Explore forward-looking tools
          </Text>
        </YStack>
        <Text fontSize={11.5} fontWeight="800" color="$red">
          {activeIndex + 1}/{banners.length}
        </Text>
      </XStack>

      {/* Snap Paging Carousel */}
      <AnimatedScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        contentContainerStyle={{
          gap: CARD_GAP,
          paddingRight: PAGE_H,
        }}
      >
        {banners.map((banner, index) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            index={index}
            cardWidth={cardWidth}
            scrollX={scrollX}
          />
        ))}
      </AnimatedScrollView>

      {/* Animated Expanding Pill Indicators */}
      <XStack justifyContent="center" alignItems="center" gap={6} marginTop={2}>
        {banners.map((banner, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={banner.id}
              width={isActive ? 22 : 6}
              height={6}
              borderRadius={3}
              backgroundColor={isActive ? "$red" : "$borderColor"}
            />
          );
        })}
      </XStack>
    </YStack>
  );
}
