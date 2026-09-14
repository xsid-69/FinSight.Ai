import React, { useRef, useState } from "react";
import { Linking, ScrollView, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { YStack, XStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, ArrowRight } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { CreditCardMock, RingProgress } from "../components/finsight";
import { redGradient, gradientStart, gradientEnd } from "../constants/colors";
import { LinearGradient } from "expo-linear-gradient";

interface Slide {
  id: string;
  hero: "card" | "ring" | "forecast";
  headline: { text: string; accent?: boolean }[];
  sub: string;
}

const SLIDES: Slide[] = [
  {
    id: "s1",
    hero: "card",
    headline: [{ text: "Smarter banking for " }, { text: "your", accent: true }, { text: " everyday " }, { text: "life.", accent: true }],
    sub: "Send, save, and understand your money with a calmer, intelligent experience.",
  },
  {
    id: "s2",
    hero: "ring",
    headline: [{ text: "Know exactly " }, { text: "where you stand.", accent: true }],
    sub: "Your financial health, scored and explained in real time — no spreadsheets required.",
  },
  {
    id: "s3",
    hero: "forecast",
    headline: [{ text: "See tomorrow's money, " }, { text: "today.", accent: true }],
    sub: "AI forecasts your cash flow, flags anomalies and simulates your goals before you commit.",
  },
];

/** Small decorative upward trend line for the forecast slide. */
function ForecastMock() {
  return (
    <View width={260} height={150} borderRadius={22} backgroundColor="$backgroundStrong" borderWidth={1} borderColor="$borderColor" padding={18} shadowColor="#0B1220" shadowOffset={{ width: 0, height: 18 }} shadowOpacity={0.1} shadowRadius={24}>
      <Text fontSize={12} color="$secondary" fontWeight="700">
        Cash flow · 12M
      </Text>
      <XStack flex={1} alignItems="flex-end" gap={8} marginTop={12}>
        {[34, 46, 40, 58, 70, 66, 84, 96].map((h, i) => (
          <View key={i} flex={1} height={`${h}%`} borderRadius={5} overflow="hidden">
            <LinearGradient colors={redGradient as unknown as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          </View>
        ))}
      </XStack>
    </View>
  );
}

function Hero({ kind }: { kind: Slide["hero"] }) {
  return (
    <View height={300} alignItems="center" justifyContent="center">
      {/* soft pink glow behind the hero */}
      <View position="absolute" width={230} height={230} borderRadius={115} backgroundColor="rgba(235,0,27,0.07)" />
      {kind === "card" ? <CreditCardMock /> : kind === "ring" ? <RingProgress value={82} size={150} strokeWidth={13} label="82" sublabel="Healthy" /> : <ForecastMock />}
    </View>
  );
}

export function OnboardingScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const goLogin = () => navigation?.navigate?.("Login");

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
      setIndex(index + 1);
    } else {
      goLogin();
    }
  };

  return (
    <View flex={1} backgroundColor="#FDF7F8">
      {/* warm pink wash at the top */}
      <View position="absolute" top={-120} left={-40} right={-40} height={420} borderRadius={300} backgroundColor="rgba(235,0,27,0.06)" />

      {/* fixed top bar */}
      <XStack position="absolute" top={insets.top + 6} right={20} zIndex={10} alignItems="center" gap={12}>
        <Text fontSize={14} fontWeight="700" color="$navy2" pressStyle={{ opacity: 0.6 }} onPress={goLogin}>
          Skip
        </Text>
        <View
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor="rgba(24,35,61,0.06)"
          alignItems="center"
          justifyContent="center"
          pressStyle={{ scale: 0.92 }}
          onPress={() => {
            Haptics.selectionAsync();
            Linking.openSettings();
          }}
          accessibilityRole="button"
          accessibilityLabel="Open Android app settings"
        >
          <Settings size={19} color="$navy2" strokeWidth={2} />
        </View>
      </XStack>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s) => (
          <YStack key={s.id} width={width} paddingHorizontal={28} paddingTop={insets.top + 70}>
            <Hero kind={s.hero} />
            <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 400 }}>
              <YStack marginTop={26} gap={14}>
                <Text fontSize={32} lineHeight={39} fontWeight="800" letterSpacing={-0.8}>
                  {s.headline.map((part, i) => (
                    <Text key={i} color={part.accent ? "$red" : "$navy"}>
                      {part.text}
                    </Text>
                  ))}
                </Text>
                <Text fontSize={15} lineHeight={22} color="$secondary">
                  {s.sub}
                </Text>
              </YStack>
            </MotiView>
          </YStack>
        ))}
      </ScrollView>

      {/* fixed bottom controls */}
      <XStack position="absolute" left={28} right={28} bottom={insets.bottom + 24} alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={7}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              height={6}
              width={i === index ? 22 : 6}
              borderRadius={3}
              backgroundColor={i === index ? "$red" : "rgba(235,0,27,0.18)"}
            />
          ))}
        </XStack>

        <View width={58} height={58} borderRadius={29} overflow="hidden" alignItems="center" justifyContent="center" shadowColor="#B00016" shadowOffset={{ width: 0, height: 10 }} shadowOpacity={0.4} shadowRadius={14} pressStyle={{ scale: 0.94 }} onPress={next}>
          <LinearGradient colors={redGradient as unknown as [string, string]} start={gradientStart} end={gradientEnd} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          <ArrowRight size={24} color="white" strokeWidth={2.6} />
        </View>
      </XStack>
    </View>
  );
}
