import React, { useState } from "react";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronDown,
  ChevronUp,
  Fingerprint,
  LockKeyhole,
  MessageSquareText,
  RadioTower,
  Settings2,
} from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { useReducedMotion } from "../../hooks/useReducedMotion";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;

interface TransactionsContentProps {
  navigation?: any;
}

export function TransactionsContent({ navigation }: TransactionsContentProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const togglePrivacy = () => {
    void Haptics.selectionAsync();
    setPrivacyOpen((current) => !current);
  };

  const openSecurity = () => {
    void Haptics.selectionAsync();
    navigation?.navigate?.("Profile", { section: "security" });
  };

  const motion = reducedMotion
    ? { type: "timing" as const, duration: 1 }
    : { type: "timing" as const, duration: 190 };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 17,
        paddingHorizontal: PAGE_H,
        paddingBottom: insets.bottom + DOCK_CLEARANCE,
      }}
    >
      <YStack width="100%" maxWidth={760} alignSelf="center">
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={motion}
        >
          <YStack gap={8} marginBottom={19}>
            <XStack alignItems="center" gap={8}>
              <View width={24} height={2} borderRadius={1} backgroundColor="$red" />
              <Text fontSize={11} fontWeight="800" letterSpacing={1.15} color="$ink2">
                SOURCE STATUS
              </Text>
            </XStack>
            <Text fontSize={29} lineHeight={35} fontWeight="800" color="$navy" letterSpacing={-0.9}>
              Message activity
            </Text>
            <Text maxWidth={570} fontSize={13.5} lineHeight={20} color="$navy2">
              This page is reserved for activity derived from a secure message connection.
            </Text>
          </YStack>
        </MotiView>

        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 45 }}
        >
          <YStack
            minHeight={266}
            borderRadius={27}
            backgroundColor="$navy"
            borderWidth={1}
            borderColor="rgba(255,255,255,0.08)"
            padding={20}
            gap={20}
            overflow="hidden"
          >
            <View
              position="absolute"
              width={210}
              height={210}
              borderRadius={105}
              backgroundColor="rgba(235,0,27,0.16)"
              right={-90}
              top={-116}
            />
            <View
              position="absolute"
              width={104}
              height={104}
              borderRadius={52}
              borderWidth={1}
              borderColor="rgba(255,255,255,0.09)"
              right={22}
              bottom={-56}
            />

            <XStack alignItems="flex-start" justifyContent="space-between" gap={14}>
              <View
                width={58}
                height={58}
                borderRadius={29}
                backgroundColor="rgba(255,255,255,0.10)"
                borderWidth={1}
                borderColor="rgba(255,255,255,0.13)"
                alignItems="center"
                justifyContent="center"
              >
                <View
                  position="absolute"
                  width={42}
                  height={42}
                  borderRadius={21}
                  borderWidth={1}
                  borderColor="rgba(255,255,255,0.10)"
                />
                <MessageSquareText size={24} color="white" strokeWidth={2.05} />
              </View>
              <XStack
                minHeight={36}
                paddingHorizontal={12}
                borderRadius={18}
                backgroundColor="rgba(255,255,255,0.09)"
                borderWidth={1}
                borderColor="rgba(255,255,255,0.10)"
                alignItems="center"
                gap={7}
                accessible
                accessibilityRole="summary"
                accessibilityLabel="Connection status: Not connected"
              >
                <View width={7} height={7} borderRadius={4} backgroundColor="#AEB5C3" />
                <Text fontSize={10.5} fontWeight="800" letterSpacing={0.4} color="#F1F3F6">
                  Not connected
                </Text>
              </XStack>
            </XStack>

            <YStack gap={7}>
              <Text fontSize={22} lineHeight={28} fontWeight="800" color="white" letterSpacing={-0.5}>
                Your inbox remains unread
              </Text>
              <Text maxWidth={560} fontSize={13.5} lineHeight={20} color="#C9CEDA">
                FinSight does not currently read your inbox. A secure message listener is unavailable in this build.
              </Text>
            </YStack>

            <XStack
              minHeight={62}
              paddingHorizontal={14}
              borderRadius={17}
              backgroundColor="rgba(255,255,255,0.08)"
              borderWidth={1}
              borderColor="rgba(255,255,255,0.08)"
              alignItems="center"
              gap={12}
            >
              <View
                width={38}
                height={38}
                borderRadius={19}
                backgroundColor="rgba(235,0,27,0.22)"
                alignItems="center"
                justifyContent="center"
              >
                <RadioTower size={18} color="white" strokeWidth={2.1} />
              </View>
              <YStack flex={1} gap={2}>
                <Text fontSize={12.5} fontWeight="800" color="white">
                  No listener is running
                </Text>
                <Text fontSize={11.5} lineHeight={16} color="#C9CEDA">
                  No real-time monitoring is active on this device.
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </MotiView>

        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 90 }}
        >
          <YStack
            marginTop={16}
            borderRadius={21}
            backgroundColor="$backgroundStrong"
            borderWidth={1}
            borderColor="$borderColor"
            overflow="hidden"
          >
            <XStack
              minHeight={58}
              paddingHorizontal={16}
              alignItems="center"
              gap={12}
              onPress={togglePrivacy}
              pressStyle={{ opacity: 0.72 }}
              accessibilityRole="button"
              accessibilityLabel="How message privacy works"
              accessibilityState={{ expanded: privacyOpen }}
            >
              <View
                width={38}
                height={38}
                borderRadius={13}
                backgroundColor="rgba(99,166,74,0.10)"
                alignItems="center"
                justifyContent="center"
              >
                <Fingerprint size={18} color="$success" strokeWidth={2.1} />
              </View>
              <YStack flex={1} gap={2}>
                <Text fontSize={13.5} fontWeight="800" color="$navy">
                  How message privacy works
                </Text>
                <Text fontSize={11.5} color="$ink2">
                  Review the boundary before any future connection
                </Text>
              </YStack>
              {privacyOpen ? (
                <ChevronUp size={18} color="$navy2" strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} color="$navy2" strokeWidth={2.2} />
              )}
            </XStack>

            {privacyOpen ? (
              <MotiView
                from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : -5 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: reducedMotion ? 1 : 170 }}
              >
                <YStack
                  borderTopWidth={1}
                  borderTopColor="$borderColor"
                  paddingHorizontal={16}
                  paddingTop={15}
                  paddingBottom={17}
                  gap={13}
                >
                  <XStack alignItems="flex-start" gap={11}>
                    <LockKeyhole size={18} color="$navy2" strokeWidth={2.1} />
                    <Text flex={1} fontSize={12.5} lineHeight={18} color="$navy2">
                      FinSight would need an explicit, secure source connection before message-derived activity could appear here. This build has no inbox permission or background listener.
                    </Text>
                  </XStack>
                  <XStack
                    minHeight={50}
                    borderRadius={14}
                    backgroundColor="$navy"
                    alignItems="center"
                    justifyContent="center"
                    gap={8}
                    onPress={openSecurity}
                    pressStyle={{ opacity: 0.82, scale: 0.99 }}
                    accessibilityRole="button"
                    accessibilityLabel="Open profile security settings"
                  >
                    <Settings2 size={17} color="white" strokeWidth={2.2} />
                    <Text color="white" fontSize={13.5} fontWeight="800">
                      Open security settings
                    </Text>
                  </XStack>
                </YStack>
              </MotiView>
            ) : null}
          </YStack>
        </MotiView>

        <Text marginTop={17} fontSize={11.5} lineHeight={17} color="$ink2" textAlign="center">
          Availability is shown plainly so an empty source is never mistaken for monitored activity.
        </Text>
      </YStack>
    </ScrollView>
  );
}
