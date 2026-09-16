import React, { useRef, useState } from "react";
import { Linking, ScrollView, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import { YStack, XStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Settings, ArrowRight } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { Card, CreditCardMock, RingProgress } from "../components/finsight";
import { redGradient, warmGradient, gradientStart, gradientEnd } from "../constants/colors";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { brandColors, brandOverlays } from "../theme/mastercard";

interface Slide {
  id: string;
  eyebrow: string;
  hero: "card" | "ring" | "forecast";
  headline: { text: string; accent?: boolean }[];
  sub: string;
}

const SLIDES: Slide[] = [
  {
    id: "s1",
    eyebrow: "ONE CLEAR MONEY VIEW",
    hero: "card",
    headline: [{ text: "See your everyday money " }, { text: "more clearly.", accent: true }],
    sub: "Review, understand, and plan your money in a calmer financial workspace.",
  },
  {
    id: "s2",
    eyebrow: "FINANCIAL HEALTH",
    hero: "ring",
    headline: [{ text: "Know exactly " }, { text: "where you stand.", accent: true }],
    sub: "See a simple financial-health snapshot with the context behind the score.",
  },
  {
    id: "s3",
    eyebrow: "MODELLED OUTLOOK",
    hero: "forecast",
    headline: [{ text: "See tomorrow's money, " }, { text: "today.", accent: true }],
    sub: "Explore illustrative cash-flow forecasts, anomaly signals, and goal scenarios before you decide.",
  },
];

/** Small decorative trend preview for the forecast slide. */
function ForecastMock() {
  return (
    <Card
      width={268}
      height={164}
      padding={18}
      shadowOffset={{ width: 0, height: 18 }}
      shadowOpacity={0.12}
      shadowRadius={24}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Illustrative twelve month cash flow trend rising over time"
    >
      <XStack alignItems="center" justifyContent="space-between" gap={10}>
        <YStack gap={2}>
          <Text fontSize={12} color="$navy" fontWeight="800">Cash flow outlook</Text>
          <Text fontSize={10.5} color="$secondary" fontWeight="600">Illustrative · 12 months</Text>
        </YStack>
        <View borderRadius={999} backgroundColor="$orangeSoft" paddingHorizontal={8} paddingVertical={4}>
          <Text fontSize={9.5} fontWeight="800" color="$orangeDeep">MODELLED</Text>
        </View>
      </XStack>
      <XStack flex={1} alignItems="flex-end" gap={7} marginTop={14} accessible={false} importantForAccessibility="no-hide-descendants">
        {[34, 46, 40, 58, 70, 66, 84, 96].map((height, index) => (
          <View key={index} flex={1} height={`${height}%`} borderRadius={5} overflow="hidden">
            <LinearGradient
              colors={(index < 5 ? redGradient : warmGradient) as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
          </View>
        ))}
      </XStack>
    </Card>
  );
}

function Hero({ kind }: { kind: Slide["hero"] }) {
  return (
    <View height={290} alignItems="center" justifyContent="center">
      <View
        position="absolute"
        width={238}
        height={238}
        borderRadius={119}
        backgroundColor={brandOverlays.red08}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
      <View
        position="absolute"
        width={152}
        height={152}
        borderRadius={76}
        right={4}
        bottom={28}
        backgroundColor={brandOverlays.orange14}
        opacity={0.52}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
      {kind === "card" ? (
        <CreditCardMock />
      ) : kind === "ring" ? (
        <YStack alignItems="center" gap={14}>
          <RingProgress value={82} size={150} strokeWidth={13} label="82" sublabel="Healthy" />
          <Text fontSize={11.5} color="$secondary" fontWeight="700">Illustrative health snapshot</Text>
        </YStack>
      ) : (
        <ForecastMock />
      )}
    </View>
  );
}

export function OnboardingScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const goLogin = () => navigation?.navigate?.("Login");

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / width);
    if (nextIndex !== index) setIndex(nextIndex);
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
    <View flex={1} backgroundColor="$background">
      <View
        position="absolute"
        top={-170}
        left={-70}
        width={360}
        height={360}
        borderRadius={180}
        backgroundColor="$redSoft"
        opacity={0.72}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
      <View
        position="absolute"
        top={30}
        right={-90}
        width={250}
        height={250}
        borderRadius={125}
        backgroundColor="$orangeSoft"
        opacity={0.68}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />

      <XStack position="absolute" top={insets.top + 6} left={20} right={20} zIndex={10} alignItems="center" justifyContent="space-between" gap={12}>
        <XStack alignItems="center" gap={7} accessible accessibilityLabel="FinSight onboarding">
          <View width={5} height={22} borderRadius={3} backgroundColor="$red" />
          <Text fontSize={14} fontWeight="800" color="$charcoal" letterSpacing={0.3}>FINSIGHT</Text>
        </XStack>
        <XStack alignItems="center" gap={6}>
          <XStack
            minHeight={48}
            paddingHorizontal={12}
            alignItems="center"
            justifyContent="center"
            borderRadius={14}
            pressStyle={{ opacity: 0.62 }}
            onPress={goLogin}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text fontSize={14} fontWeight="800" color="$navy2">Skip</Text>
          </XStack>
          <View
            width={48}
            height={48}
            borderRadius={16}
            backgroundColor="$backgroundStrong"
            borderWidth={1}
            borderColor="$borderColor"
            alignItems="center"
            justifyContent="center"
            pressStyle={{ scale: 0.94, opacity: 0.82 }}
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
      </XStack>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, slideIndex) => (
          <YStack key={slide.id} width={width} paddingHorizontal={28} paddingTop={insets.top + 74}>
            <Hero kind={slide.hero} />
            <MotiView
              from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: reducedMotion ? 1 : 400 }}
            >
              <YStack marginTop={18} gap={13}>
                <Text fontSize={10.5} lineHeight={15} fontWeight="800" color="$red" letterSpacing={1.15}>
                  {String(slideIndex + 1).padStart(2, "0")} · {slide.eyebrow}
                </Text>
                <Text fontSize={31} lineHeight={38} fontWeight="800" letterSpacing={-0.8} accessibilityRole="header">
                  {slide.headline.map((part, partIndex) => (
                    <Text key={partIndex} color={part.accent ? "$red" : "$navy"}>
                      {part.text}
                    </Text>
                  ))}
                </Text>
                <Text fontSize={15} lineHeight={22} color="$secondary">{slide.sub}</Text>
              </YStack>
            </MotiView>
          </YStack>
        ))}
      </ScrollView>

      <XStack position="absolute" left={28} right={28} bottom={insets.bottom + 24} alignItems="center" justifyContent="space-between">
        <YStack gap={7}>
          <Text fontSize={10.5} lineHeight={15} color="$secondary" fontWeight="700">Slide {index + 1} of {SLIDES.length}</Text>
          <XStack alignItems="center" gap={7} accessible={false} importantForAccessibility="no-hide-descendants">
            {SLIDES.map((_, dotIndex) => (
              <View
                key={dotIndex}
                height={6}
                width={dotIndex === index ? 24 : 6}
                borderRadius={3}
                backgroundColor={dotIndex === index ? "$red" : "$borderStrong"}
              />
            ))}
          </XStack>
        </YStack>

        <View
          width={58}
          height={58}
          borderRadius={20}
          overflow="hidden"
          alignItems="center"
          justifyContent="center"
          shadowColor={brandColors.redPressed}
          shadowOffset={{ width: 0, height: 10 }}
          shadowOpacity={0.32}
          shadowRadius={14}
          pressStyle={{ scale: 0.94 }}
          onPress={next}
          accessibilityRole="button"
          accessibilityLabel={index === SLIDES.length - 1 ? "Continue to sign in" : "Next onboarding slide"}
          accessibilityHint={index === SLIDES.length - 1 ? "Opens secure sign in" : `Shows slide ${index + 2} of ${SLIDES.length}`}
        >
          <LinearGradient
            colors={redGradient as unknown as [string, string]}
            start={gradientStart}
            end={gradientEnd}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <ArrowRight size={24} color="white" strokeWidth={2.6} />
        </View>
      </XStack>
    </View>
  );
}
