import React from "react";
import { ScrollView, XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, ArrowRight } from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";

import { FinSightShell, CashFlowForecast, GoalSimulator } from "../components/finsight";
import { aiGradient, gradientStart, gradientEnd } from "../constants/colors";
import { AI_PROMPTS } from "../data/intelligence";
import { useAuth } from "../context/AuthContext";
import { useReducedMotion } from "../hooks/useReducedMotion";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;

function AskCard({ onPress }: { onPress?: () => void }) {
  return (
    <View
      borderRadius={22}
      overflow="hidden"
      pressStyle={{ scale: 0.99, opacity: 0.95 }}
      onPress={onPress}
      shadowColor="#6B5AE0"
      shadowOffset={{ width: 0, height: 12 }}
      shadowOpacity={0.22}
      shadowRadius={20}
      accessibilityRole="button"
      accessibilityLabel="Ask FinSight AI"
      accessibilityHint="Open the financial assistant"
    >
      <LinearGradient colors={aiGradient as unknown as [string, string]} start={gradientStart} end={gradientEnd} style={{ padding: 20 }}>
        <XStack alignItems="center" gap={10} marginBottom={10}>
          <View width={30} height={30} borderRadius={10} backgroundColor="rgba(255,255,255,0.22)" alignItems="center" justifyContent="center">
            <Sparkles size={17} color="white" strokeWidth={2.2} />
          </View>
          <Text fontSize={16} fontWeight="800" color="white">Ask FInsightAI</Text>
        </XStack>
        <Text fontSize={13.5} color="rgba(255,255,255,0.92)" lineHeight={19}>{AI_PROMPTS[0]}</Text>
        <XStack alignItems="center" gap={6} marginTop={14}>
          <Text fontSize={13.5} fontWeight="800" color="white">Start a conversation</Text>
          <ArrowRight size={16} color="white" strokeWidth={2.6} />
        </XStack>
      </LinearGradient>
    </View>
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
      subtitle="AI analytics & assistant"
      onProfile={() => navigation?.navigate?.("Profile")}
      onSettings={() => navigation?.navigate?.("Profile")}
      onNotifications={() => openProfileSection("notifications")}
      onHelp={() => openProfileSection("help")}
      onLogout={handleLogout}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + DOCK_CLEARANCE }}>
        <MotiView from={{ opacity: reducedMotion ? 1 : 0.8, translateY: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: reducedMotion ? 1 : 220 }}>
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
