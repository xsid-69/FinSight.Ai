import React from "react";
import { useWindowDimensions } from "react-native";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowRight,
  BrainCircuit,
  Fingerprint,
  MessageSquareText,
  ShieldCheck,
} from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { useAuth } from "../../context/AuthContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { OverviewArtwork, type OverviewArtworkVariant } from "./OverviewArtwork";
import { useOptionalHomePagerCoordinator } from "./HomePagerCoordinator";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;

interface OverviewContentProps {
  navigation?: any;
}

interface OverviewActionProps {
  icon: typeof MessageSquareText;
  artwork: OverviewArtworkVariant;
  title: string;
  body: string;
  action: string;
  onPress: () => void;
  tone: "plain" | "tinted";
  wide: boolean;
}

function OverviewAction({
  icon: Icon,
  artwork,
  title,
  body,
  action,
  onPress,
  tone,
  wide,
}: OverviewActionProps) {
  const tinted = tone === "tinted";

  return (
    <YStack
      flex={1}
      minHeight={wide ? 238 : 194}
      borderRadius={22}
      backgroundColor={tinted ? "#F1EFFE" : "$backgroundStrong"}
      padding={18}
      gap={12}
      overflow="hidden"
    >
      <XStack alignItems="center" justifyContent="space-between" gap={12}>
        <View
          width={42}
          height={42}
          borderRadius={14}
          backgroundColor={tinted ? "#E2DEFA" : "#FFE9EB"}
          alignItems="center"
          justifyContent="center"
        >
          <Icon
            size={19}
            color={tinted ? "#5E50C8" : "$red"}
            strokeWidth={2.15}
          />
        </View>
        <OverviewArtwork variant={artwork} width={wide ? 132 : 116} />
      </XStack>

      <YStack flex={1} gap={5}>
        <Text
          maxWidth={360}
          fontSize={18}
          lineHeight={24}
          fontWeight="800"
          letterSpacing={-0.3}
          color="$navy"
        >
          {title}
        </Text>
        <Text maxWidth={420} fontSize={13} lineHeight={19} color="$navy2">
          {body}
        </Text>
      </YStack>

      <XStack
        minHeight={48}
        paddingHorizontal={14}
        borderRadius={14}
        backgroundColor={tinted ? "#E2DEFA" : "$surfaceAlt"}
        alignItems="center"
        justifyContent="space-between"
        gap={10}
        onPress={onPress}
        pressStyle={{ opacity: 0.76, scale: 0.985 }}
        accessibilityRole="button"
        accessibilityLabel={action}
      >
        <Text fontSize={13.5} fontWeight="800" color="$navy">
          {action}
        </Text>
        <ArrowRight
          size={17}
          color={tinted ? "#5E50C8" : "$navy2"}
          strokeWidth={2.3}
        />
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
  const heroArtworkWidth = wide
    ? 298
    : Math.min(278, Math.max(112, width - PAGE_H * 4));

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
          <YStack
            borderRadius={28}
            backgroundColor="$navy"
            padding={wide ? 24 : 20}
            overflow="hidden"
          >
            <View
              position="absolute"
              width={190}
              height={190}
              borderRadius={95}
              backgroundColor="rgba(235,0,27,0.16)"
              right={-84}
              top={-108}
            />
            <XStack
              flexDirection={wide ? "row" : "column"}
              alignItems={wide ? "center" : "stretch"}
              gap={wide ? 24 : 14}
            >
              <YStack flex={1} gap={13}>
                <XStack alignItems="center" gap={8}>
                  <ShieldCheck size={17} color="#A9E2B2" strokeWidth={2.2} />
                  <Text fontSize={12.5} fontWeight="700" color="#DDE2EC">
                    {firstName ? `Private workspace for ${firstName}` : "Your private workspace"}
                  </Text>
                </XStack>

                <YStack gap={7}>
                  <Text
                    maxWidth={460}
                    fontSize={wide ? 32 : 28}
                    lineHeight={wide ? 38 : 34}
                    fontWeight="800"
                    letterSpacing={wide ? -1 : -0.8}
                    color="white"
                  >
                    Your money, easier to read.
                  </Text>
                  <Text maxWidth={470} fontSize={13.5} lineHeight={21} color="#D4D9E3">
                    Bring in a statement when you choose and review patterns from that imported file.
                  </Text>
                </YStack>

                {!wide ? (
                  <XStack justifyContent="center" marginVertical={-4}>
                    <OverviewArtwork variant="hero" width={heroArtworkWidth} />
                  </XStack>
                ) : null}

                <XStack
                  minHeight={50}
                  paddingHorizontal={15}
                  borderRadius={15}
                  backgroundColor="white"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={10}
                  onPress={() => openHomePage("Insights")}
                  pressStyle={{ opacity: 0.82, scale: 0.985 }}
                  accessibilityRole="button"
                  accessibilityLabel="Open private Insights workspace"
                >
                  <Text fontSize={13.5} fontWeight="800" color="$navy">
                    Open private Insights workspace
                  </Text>
                  <ArrowRight size={18} color="$red" strokeWidth={2.4} />
                </XStack>

                <XStack alignItems="center" gap={7}>
                  <Fingerprint size={15} color="#A9E2B2" strokeWidth={2.1} />
                  <Text flex={1} fontSize={11.5} lineHeight={16} color="#C7CEDA">
                    Only the records you choose are analyzed here.
                  </Text>
                </XStack>
              </YStack>

              {wide ? <OverviewArtwork variant="hero" width={heroArtworkWidth} /> : null}
            </XStack>
          </YStack>
        </MotiView>

        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 55 }}
        >
          <YStack marginTop={28} gap={6}>
            <Text fontSize={21} lineHeight={27} fontWeight="800" letterSpacing={-0.45} color="$navy">
              Choose your next step
            </Text>
            <Text maxWidth={570} fontSize={13} lineHeight={19} color="$navy2">
              Pick the workspace that matches what you want to review.
            </Text>
          </YStack>

          <YStack
            marginTop={14}
            flexDirection={wide ? "row" : "column"}
            gap={12}
            alignItems="stretch"
          >
            <OverviewAction
              icon={MessageSquareText}
              artwork="activity"
              title="Check source activity"
              body="See whether a message source is connected without confusing an empty state with monitored activity."
              action="View message connection status"
              onPress={() => openHomePage("Transactions")}
              tone="plain"
              wide={wide}
            />
            <OverviewAction
              icon={BrainCircuit}
              artwork="assistant"
              title="Ask a focused question"
              body="Open FinSight AI when you want help understanding the workspace or deciding what to review next."
              action="Open FinSight AI"
              onPress={openAI}
              tone="tinted"
              wide={wide}
            />
          </YStack>
        </MotiView>

        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 90 }}
        >
          <XStack
            marginTop={20}
            minHeight={82}
            paddingHorizontal={16}
            paddingVertical={14}
            borderRadius={18}
            backgroundColor="#EDF7EF"
            alignItems="center"
            gap={13}
          >
            <View
              width={42}
              height={42}
              borderRadius={14}
              backgroundColor="#DCEFE0"
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
                Imported statements, message connection status, and guided help stay clearly separated.
              </Text>
            </YStack>
          </XStack>
        </MotiView>
      </YStack>
    </ScrollView>
  );
}
