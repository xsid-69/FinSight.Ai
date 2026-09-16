import React from "react";
import { YStack, XStack, Text, View } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";

import { MastercardMark } from "./MastercardMark";
import { brandColors, brandGradients } from "../../theme/mastercard";

export interface CreditCardMockProps {
  balanceLabel?: string;
  balance?: string;
  last4?: string;
  width?: number;
}

/** Decorative FinSight planning-card concept. It does not represent an issued payment card. */
export function CreditCardMock({
  balanceLabel = "MONEY PLAN PREVIEW",
  balance = "A clearer next move",
  last4 = "DEMO",
  width = 300,
}: CreditCardMockProps) {
  return (
    <View
      width={width}
      maxWidth="100%"
      minHeight={190}
      borderRadius={24}
      overflow="hidden"
      padding={22}
      rotate="-6deg"
      shadowColor={brandColors.charcoal}
      shadowOffset={{ width: 0, height: 24 }}
      shadowOpacity={0.3}
      shadowRadius={30}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`FinSight planning preview. ${balanceLabel}: ${balance}. Reference ${last4}.`}
    >
      <LinearGradient
        colors={brandGradients.charcoal as unknown as [string, string]}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.94, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View
        position="absolute"
        top={-54}
        right={-34}
        width={154}
        height={154}
        borderRadius={77}
        backgroundColor={brandColors.redAction}
        opacity={0.2}
      />
      <View
        position="absolute"
        bottom={-48}
        right={28}
        width={122}
        height={122}
        borderRadius={61}
        backgroundColor={brandColors.orange}
        opacity={0.13}
      />
      <View
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        width={5}
        backgroundColor={brandColors.redIdentity}
      />

      <XStack alignItems="center" justifyContent="space-between">
        <YStack gap={2}>
          <Text fontSize={15} fontWeight="800" color={brandColors.white} letterSpacing={1.8}>
            FINSIGHT
          </Text>
          <Text fontSize={9.5} fontWeight="700" color="rgba(255,255,255,0.72)" letterSpacing={1.1}>
            PLANNING VIEW
          </Text>
        </YStack>
        <MastercardMark size={24} />
      </XStack>

      <YStack marginTop={38} gap={7}>
        <Text fontSize={10.5} fontWeight="700" color="rgba(255,255,255,0.58)" letterSpacing={1.15}>
          {balanceLabel}
        </Text>
        <Text maxWidth={220} fontSize={24} lineHeight={29} fontWeight="800" color={brandColors.white} letterSpacing={-0.5}>
          {balance}
        </Text>
      </YStack>

      <XStack marginTop="auto" paddingTop={16} alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={6}>
          <View width={18} height={3} borderRadius={2} backgroundColor={brandColors.redIdentity} />
          <View width={10} height={3} borderRadius={2} backgroundColor={brandColors.orange} />
          <View width={6} height={3} borderRadius={2} backgroundColor={brandColors.gold} />
        </XStack>
        <Text fontSize={10.5} fontWeight="700" color="rgba(255,255,255,0.56)" letterSpacing={1.1}>
          REF · {last4}
        </Text>
      </XStack>
    </View>
  );
}
