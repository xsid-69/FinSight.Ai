import React from "react";
import { ScrollView, XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, ArrowRight } from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";

import { FinSightShell, CashFlowForecast, GoalSimulator, Card } from "../components/finsight";
import { aiGradient, gradientStart, gradientEnd } from "../constants/colors";
import { AI_PROMPTS } from "../data/intelligence";
import { useAuth } from "../context/AuthContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { brandColors, brandOverlays } from "../theme/mastercard";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;

function AskCard({ onPress }: { onPress?: () => void }) {
  return (
    <Card
      variant="charcoal"
      padding={0}
      overflow="hidden"
      pressStyle={{ scale: 0.99, opacity: 0.96 }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ask FinSight AI"
      accessibilityHint="Open the financial assistant"
    >
      <LinearGradient
        colors={aiGradient as unknown as [string, string]}
        start={gradientStart}
        end={gradientEnd}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        position="absolute"
        top={-54}
        right={-30}
        width={154}
        height={154}
        borderRadius={77}
        backgroundColor={brandColors.orange}
        opacity={0.14}
      />
      <View
        position="absolute"
        bottom={-40}
        right={54}
        width={108}
        height={108}
        borderRadius={54}
        backgroundColor={brandColors.gold}
        opacity={0.1}
      />

      <YStack padding={20} gap={16}>
        <XStack alignItems="center" justifyContent="space-between" gap={12}>
          <XStack alignItems="center" gap={10} flex={1}>
            <View
              width={38}
              height={38}
              borderRadius={13}
              backgroundColor={brandOverlays.onBrand18}
              borderWidth={1}
              borderColor={brandOverlays.onBrand24}
              alignItems="center"
              justifyContent="center"
            >
              <Sparkles size={19} color={brandColors.gold} strokeWidth={2.2} />
            </View>
            <YStack flex={1} gap={1}>
              <Text fontSize={11} lineHeight={16} fontWeight="800" color="rgba(255,255,255,0.68)" letterSpacing={1.1}>
                FINANCIAL ASSISTANT
              </Text>
              <Text fontSize={18} lineHeight={24} fontWeight="800" color="white" accessibilityRole="header">
                Ask a money question
              </Text>
            </YStack>
          </XStack>
          <View borderRadius={999} backgroundColor={brandOverlays.onBrand12} paddingHorizontal={9} paddingVertical={5}>
            <Text fontSize={10.5} fontWeight="800" color="white" letterSpacing={0.5}>GUIDED</Text>
          </View>
        </XStack>

        <View
          borderRadius={16}
          backgroundColor={brandOverlays.onBrand08}
          borderWidth={1}
          borderColor={brandOverlays.onBrand12}
          padding={14}
        >
          <Text fontSize={14} color="rgba(255,255,255,0.9)" lineHeight={21} fontWeight="600">
            {AI_PROMPTS[0]}
          </Text>
        </View>

        <XStack minHeight={48} alignItems="center" justifyContent="space-between" gap={12}>
          <YStack flex={1} gap={2}>
            <Text fontSize={13.5} fontWeight="800" color="white">Open guided assistant</Text>
            <Text fontSize={11.5} color="rgba(255,255,255,0.66)">Uses built-in sample planning data</Text>
          </YStack>
          <View width={40} height={40} borderRadius={20} backgroundColor={brandColors.redIdentity} alignItems="center" justifyContent="center">
            <ArrowRight size={18} color="white" strokeWidth={2.6} />
          </View>
        </XStack>
      </YStack>
    </Card>
  );
}

export function AIScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // AuthContext keeps the user signed in and exposes the safe error.
    }
  };
  const openProfileSection = (section: string) => navigation?.navigate?.("Profile", { section });

  return (
    <FinSightShell
      subtitle="Forecasts, goals & guided assistant"
      onProfile={() => navigation?.navigate?.("Profile")}
      onSettings={() => navigation?.navigate?.("Profile")}
      onNotifications={() => openProfileSection("notifications")}
      onHelp={() => openProfileSection("help")}
      onLogout={handleLogout}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + DOCK_CLEARANCE }}
      >
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0.8, translateY: reducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: reducedMotion ? 1 : 220 }}
        >
          <YStack gap={20}>
            <AskCard onPress={() => navigation?.navigate?.("AIAssistant")} />
            <YStack gap={4} paddingHorizontal={2}>
              <Text fontSize={18} lineHeight={24} fontWeight="800" color="$navy" accessibilityRole="header">Planning tools</Text>
              <Text fontSize={13} lineHeight={19} color="$secondary">Explore the modelled trend, then test a goal timeline.</Text>
            </YStack>
            <CashFlowForecast />
            <GoalSimulator onOpenSimulator={() => navigation?.navigate?.("Simulator")} />
          </YStack>
        </MotiView>
      </ScrollView>
    </FinSightShell>
  );
}
