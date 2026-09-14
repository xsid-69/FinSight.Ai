import React, { useMemo, useState } from "react";
import { type NativeScrollEvent, type NativeSyntheticEvent, useWindowDimensions } from "react-native";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRight, FileUp, ScanSearch, Sparkles, TrendingUp } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import type { LucideIcon } from "../../components/IconSquare";

const PAGE_H = 20;
const CARD_GAP = 12;
type FeatureAction = "import" | "ai" | "transactions" | "insights";

interface Feature {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  action: FeatureAction;
  icon: LucideIcon;
  colors: [string, string];
  iconBackground: string;
}

const FEATURES: Feature[] = [
  { id: "import", title: "Preview statement analysis", description: "See how FinSight organizes financial activity without using personal data.", actionLabel: "Run preview", action: "import", icon: FileUp, colors: ["#EB001B", "#B00016"], iconBackground: "rgba(255,255,255,0.18)" },
  { id: "ai", title: "Ask your money", description: "Get answers grounded only in the financial data you add.", actionLabel: "Open FinSight AI", action: "ai", icon: Sparkles, colors: ["#7C6CF2", "#5142B8"], iconBackground: "rgba(255,255,255,0.18)" },
  { id: "organize", title: "Understand spending", description: "See merchants and categories become easier to explore.", actionLabel: "View workspace", action: "transactions", icon: ScanSearch, colors: ["#263652", "#111827"], iconBackground: "rgba(255,255,255,0.14)" },
  { id: "signals", title: "Reveal money signals", description: "Surface shifts, unusual activity and future pressure points.", actionLabel: "See insight space", action: "insights", icon: TrendingUp, colors: ["#3F6C57", "#234637"], iconBackground: "rgba(255,255,255,0.16)" },
];

interface HomeFeatureCarouselProps {
  onAction: (action: FeatureAction) => void;
  parentPagerGesture?: ReturnType<typeof Gesture.Pan>;
}

export function HomeFeatureCarousel({
  onAction,
  parentPagerGesture,
}: HomeFeatureCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = Math.min(width - PAGE_H * 2 - 28, 340);
  const snapInterval = cardWidth + CARD_GAP;
  const carouselNativeGesture = useMemo(() => {
    const nativeGesture = Gesture.Native();
    return parentPagerGesture
      ? nativeGesture.blocksExternalGesture(parentPagerGesture)
      : nativeGesture;
  }, [parentPagerGesture]);

  const finishScroll = (event?: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!event) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    setActiveIndex(Math.max(0, Math.min(nextIndex, FEATURES.length - 1)));
  };

  return (
    <YStack gap={13}>
      <XStack alignItems="flex-end" justifyContent="space-between" paddingHorizontal={PAGE_H}>
        <YStack flex={1} gap={3}>
          <Text fontSize={18} fontWeight="800" color="$navy" letterSpacing={-0.35}>Built for what comes next</Text>
          <Text fontSize={13} color="$secondary" lineHeight={18}>Explore the workspace before adding your first statement.</Text>
        </YStack>
        <Text fontSize={12} fontWeight="800" color="$red">{activeIndex + 1}/{FEATURES.length}</Text>
      </XStack>

      <GestureDetector gesture={carouselNativeGesture}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snapInterval}
          decelerationRate="fast"
          disableIntervalMomentum
          onMomentumScrollEnd={finishScroll}
          contentContainerStyle={{ paddingHorizontal: PAGE_H, gap: CARD_GAP }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <YStack
                key={feature.id}
                width={cardWidth}
                height={218}
                borderRadius={24}
                overflow="hidden"
                padding={20}
                justifyContent="space-between"
                pressStyle={{ scale: 0.985, opacity: 0.96 }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onAction(feature.action);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${feature.title}. ${feature.description}`}
              >
                <LinearGradient colors={feature.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: "absolute", inset: 0 }} />
                <View position="absolute" width={150} height={150} borderRadius={75} backgroundColor="rgba(255,255,255,0.07)" top={-70} right={-24} />
                <View position="absolute" width={80} height={80} borderRadius={40} borderWidth={1} borderColor="rgba(255,255,255,0.12)" bottom={-36} right={38} />
                <View width={48} height={48} borderRadius={16} backgroundColor={feature.iconBackground} alignItems="center" justifyContent="center" borderWidth={1} borderColor="rgba(255,255,255,0.16)">
                  <Icon size={23} color="white" strokeWidth={2} />
                </View>
                <YStack gap={7} maxWidth={270}>
                  <Text color="white" fontSize={22} fontWeight="800" letterSpacing={-0.55}>{feature.title}</Text>
                  <Text color="rgba(255,255,255,0.82)" fontSize={13.5} lineHeight={19}>{feature.description}</Text>
                </YStack>
                <XStack alignItems="center" gap={6}>
                  <Text color="white" fontSize={13} fontWeight="800">{feature.actionLabel}</Text>
                  <ArrowUpRight size={16} color="white" strokeWidth={2.4} />
                </XStack>
              </YStack>
            );
          })}
        </ScrollView>
      </GestureDetector>

      <XStack justifyContent="center" gap={6}>
        {FEATURES.map((feature, index) => (
          <View key={feature.id} width={index === activeIndex ? 22 : 6} height={6} borderRadius={3} backgroundColor={index === activeIndex ? "$red" : "$borderColor"} />
        ))}
      </XStack>
    </YStack>
  );
}
