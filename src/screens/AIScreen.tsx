import React from "react";
import { ScrollView, XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, ArrowRight } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { FinSightShell, CashFlowForecast, GoalSimulator, Card } from "../components/finsight";
import { aiGradient, gradientStart, gradientEnd } from "../constants/colors";
import { AI_PROMPTS } from "../data/intelligence";

const PAGE_H = 20;
const DOCK_CLEARANCE = 140;

/** Prominent "Ask FInsightAI" entry into the assistant. */
function AskCard({ onPress }: { onPress?: () => void }) {
  return (
    <View borderRadius={22} overflow="hidden" pressStyle={{ scale: 0.99, opacity: 0.95 }} onPress={onPress} shadowColor="#6B5AE0" shadowOffset={{ width: 0, height: 12 }} shadowOpacity={0.28} shadowRadius={20}>
      <LinearGradient colors={aiGradient as unknown as [string, string]} start={gradientStart} end={gradientEnd} style={{ padding: 20 }}>
        <XStack alignItems="center" gap={10} marginBottom={10}>
          <View width={30} height={30} borderRadius={10} backgroundColor="rgba(255,255,255,0.22)" alignItems="center" justifyContent="center">
            <Sparkles size={17} color="white" strokeWidth={2.2} />
          </View>
          <Text fontSize={16} fontWeight="800" color="white">
            Ask FInsightAI
          </Text>
        </XStack>
        <Text fontSize={13.5} color="rgba(255,255,255,0.9)" lineHeight={19}>
          {AI_PROMPTS[0]}
        </Text>
        <XStack alignItems="center" gap={6} marginTop={14}>
          <Text fontSize={13.5} fontWeight="800" color="white">
            Start a conversation
          </Text>
          <ArrowRight size={16} color="white" strokeWidth={2.6} />
        </XStack>
      </LinearGradient>
    </View>
  );
}

export function AIScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();

  return (
    <FinSightShell
      subtitle="AI analytics & assistant"
      onProfile={() => navigation?.navigate?.("Profile")}
      onLogout={() => navigation?.getParent?.()?.reset?.({ index: 0, routes: [{ name: "Login" }] })}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + DOCK_CLEARANCE }}>
        <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 300 }}>
          <YStack gap={20}>
            <AskCard onPress={() => navigation?.navigate?.("AIAssistant")} />
            <CashFlowForecast />
            <GoalSimulator />
          </YStack>
        </MotiView>
      </ScrollView>
    </FinSightShell>
  );
}
