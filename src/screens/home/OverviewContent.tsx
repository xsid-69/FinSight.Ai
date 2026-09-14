import React from "react";
import { useWindowDimensions } from "react-native";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowRight,
  BrainCircuit,
  Eye,
  Fingerprint,
  MessageSquareText,
} from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../context/AuthContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useOptionalHomePagerCoordinator } from "./HomePagerCoordinator";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;

interface OverviewContentProps {
  navigation?: any;
}

interface WorkspacePathProps {
  icon: typeof MessageSquareText;
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  onPress: () => void;
  emphasis?: boolean;
}

function WorkspacePath({
  icon: Icon,
  eyebrow,
  title,
  body,
  action,
  onPress,
  emphasis = false,
}: WorkspacePathProps) {
  return (
    <YStack
      minHeight={emphasis ? 188 : 166}
      borderRadius={emphasis ? 26 : 20}
      backgroundColor={emphasis ? "$navy" : "$backgroundStrong"}
      borderWidth={emphasis ? 0 : 1}
      borderColor="$borderColor"
      padding={emphasis ? 20 : 18}
      gap={14}
      overflow="hidden"
    >
      {emphasis ? (
        <>
          <View
            position="absolute"
            width={156}
            height={156}
            borderRadius={78}
            backgroundColor="rgba(235,0,27,0.18)"
            right={-66}
            top={-88}
          />
          <View
            position="absolute"
            width={68}
            height={68}
            borderRadius={34}
            borderWidth={1}
            borderColor="rgba(255,255,255,0.10)"
            right={34}
            bottom={-34}
          />
        </>
      ) : null}

      <XStack alignItems="flex-start" justifyContent="space-between" gap={14}>
        <View
          width={44}
          height={44}
          borderRadius={emphasis ? 15 : 13}
          backgroundColor={emphasis ? "rgba(255,255,255,0.11)" : "rgba(235,0,27,0.07)"}
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={20} color={emphasis ? "white" : "$red"} strokeWidth={2.15} />
        </View>
        <Text
          fontSize={10.5}
          fontWeight="800"
          letterSpacing={1.05}
          color={emphasis ? "#C9CEDA" : "$ink2"}
        >
          {eyebrow}
        </Text>
      </XStack>

      <YStack flex={1} gap={5}>
        <Text
          maxWidth={emphasis ? 460 : 360}
          fontSize={emphasis ? 20 : 17}
          lineHeight={emphasis ? 26 : 23}
          fontWeight="800"
          letterSpacing={emphasis ? -0.45 : -0.25}
          color={emphasis ? "white" : "$navy"}
        >
          {title}
        </Text>
        <Text
          maxWidth={emphasis ? 500 : 410}
          fontSize={12.5}
          lineHeight={18}
          color={emphasis ? "#C9CEDA" : "$navy2"}
        >
          {body}
        </Text>
      </YStack>

      <XStack
        minHeight={50}
        paddingHorizontal={14}
        borderRadius={14}
        backgroundColor={emphasis ? "white" : "$surfaceAlt"}
        alignItems="center"
        justifyContent="space-between"
        gap={10}
        onPress={onPress}
        pressStyle={{ opacity: 0.78, scale: 0.985 }}
        accessibilityRole="button"
        accessibilityLabel={action}
      >
        <Text fontSize={13.5} fontWeight="800" color="$navy">
          {action}
        </Text>
        <ArrowRight size={17} color={emphasis ? "$red" : "$navy2"} strokeWidth={2.3} />
      </XStack>
    </YStack>
  );
}

export function OverviewContent({ navigation }: OverviewContentProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const coordinator = useOptionalHomePagerCoordinator();
  const { profile, user } = useAuth();
  const displayName = profile?.fullName || user?.displayName || "";
  const firstName = displayName.trim().split(/\s+/)[0];
  const wide = width >= 720;

  const openHomePage = (tab: "Transactions" | "Insights") => {
    void Haptics.selectionAsync();
    if (tab === "Insights") navigation?.setParams?.({ insightsView: "analysis" });
    if (coordinator) coordinator.requestPage(tab, "in-page", true);
    else navigation?.navigate?.("Home", {
      tab,
      ...(tab === "Insights" ? { insightsView: "analysis" } : {}),
    });
  };

  const openAI = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate?.("AI");
  };

  const motion = reducedMotion
    ? { type: "timing" as const, duration: 1 }
    : { type: "timing" as const, duration: 190 };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 17,
        paddingBottom: insets.bottom + DOCK_CLEARANCE,
      }}
    >
      <YStack width="100%" maxWidth={820} alignSelf="center" paddingHorizontal={PAGE_H}>
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={motion}
        >
          <YStack marginBottom={20} gap={9}>
            <XStack alignItems="center" gap={8}>
              <View width={24} height={2} borderRadius={1} backgroundColor="$red" />
              <Text fontSize={11} fontWeight="800" letterSpacing={1.15} color="$ink2">
                YOUR FINANCIAL SPACE
              </Text>
            </XStack>
            <Text
              maxWidth={610}
              fontSize={31}
              lineHeight={37}
              fontWeight="800"
              letterSpacing={-1.05}
              color="$navy"
            >
              {firstName ? `Clarity starts here, ${firstName}.` : "Clarity starts here."}
            </Text>
            <Text maxWidth={590} fontSize={13.5} lineHeight={20} color="$navy2">
              Move between your source activity, private intelligence, and guided questions without mixing their roles.
            </Text>
          </YStack>
        </MotiView>

        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 45 }}
        >
          <WorkspacePath
            icon={Eye}
            eyebrow="PRIVATE INTELLIGENCE"
            title="A focused place to understand the financial records you choose."
            body="Explore patterns, movement, and categorized activity inside a workspace built to keep scope visible."
            action="Open private Insights workspace"
            onPress={() => openHomePage("Insights")}
            emphasis
          />
        </MotiView>

        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 85 }}
        >
          <YStack
            marginTop={14}
            flexDirection={wide ? "row" : "column"}
            gap={14}
            alignItems="stretch"
          >
            <YStack flex={1.05}>
              <WorkspacePath
                icon={MessageSquareText}
                eyebrow="SOURCE ACTIVITY"
                title="Message activity stays separate and explicit."
                body="See the current connection state without confusing it with privately analyzed records."
                action="View message connection status"
                onPress={() => openHomePage("Transactions")}
              />
            </YStack>
            <YStack flex={0.95}>
              <WorkspacePath
                icon={BrainCircuit}
                eyebrow="GUIDED QUESTIONS"
                title="Ask FinSight with intent."
                body="Open the assistant when you want a focused next step rather than another dashboard."
                action="Open FinSight AI"
                onPress={openAI}
              />
            </YStack>
          </YStack>
        </MotiView>

        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 120 }}
        >
          <XStack
            marginTop={22}
            minHeight={82}
            paddingHorizontal={16}
            paddingVertical={14}
            borderRadius={18}
            backgroundColor="rgba(99,166,74,0.075)"
            alignItems="center"
            gap={13}
          >
            <View
              width={42}
              height={42}
              borderRadius={14}
              backgroundColor="rgba(99,166,74,0.12)"
              alignItems="center"
              justifyContent="center"
            >
              <Fingerprint size={20} color="$success" strokeWidth={2.1} />
            </View>
            <YStack flex={1} gap={3}>
              <Text fontSize={13.5} fontWeight="800" color="$navy">
                Boundaries you can see
              </Text>
              <Text maxWidth={560} fontSize={12} lineHeight={17} color="$navy2">
                Each workspace names its source and availability before it asks you to act.
              </Text>
            </YStack>
          </XStack>
        </MotiView>
      </YStack>
    </ScrollView>
  );
}
