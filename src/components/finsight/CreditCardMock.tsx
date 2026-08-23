import React from "react";
import { YStack, XStack, Text, View } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { MastercardMark } from "./MastercardMark";

export interface CreditCardMockProps {
  balanceLabel?: string;
  balance?: string;
  last4?: string;
  width?: number;
}

/** Tilted dark card with the FINSIGHT wordmark, Mastercard mark and balance. */
export function CreditCardMock({
  balanceLabel = "CARD BALANCE",
  balance = "₹3,20,000",
  last4 = "7754",
  width = 300,
}: CreditCardMockProps) {
  return (
    <View
      width={width}
      borderRadius={22}
      overflow="hidden"
      padding={22}
      rotate="-7deg"
      shadowColor="#0B1220"
      shadowOffset={{ width: 0, height: 24 }}
      shadowOpacity={0.32}
      shadowRadius={30}
    >
      <LinearGradient
        colors={["#2C2F35", "#131417"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize={15} fontWeight="800" color="rgba(255,255,255,0.86)" letterSpacing={2}>
          FINSIGHT
        </Text>
        <MastercardMark size={24} />
      </XStack>

      <YStack marginTop={40} gap={6}>
        <XStack alignItems="flex-end" justifyContent="space-between">
          <YStack gap={6}>
            <Text fontSize={11} fontWeight="700" color="rgba(255,255,255,0.5)" letterSpacing={1.2}>
              {balanceLabel}
            </Text>
            <Text fontSize={26} fontWeight="800" color="white" letterSpacing={-0.4}>
              {balance}
            </Text>
          </YStack>
          <Text fontSize={13} fontWeight="700" color="rgba(255,255,255,0.55)" letterSpacing={1} marginBottom={4}>
            ···· {last4}
          </Text>
        </XStack>
      </YStack>
    </View>
  );
}
