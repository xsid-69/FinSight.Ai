import React from "react";
import { YStack, XStack, Text, View } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";

import { MastercardMark } from "./MastercardMark";
import { brandColors, brandGradients } from "../../theme/mastercard";

export interface CreditCardMockProps {
  balanceLabel?: string;
  balance?: string;
  last4?: string;
  width?: number;
  rotate?: string;
}

/** Realistic miniature EMV Smart Chip */
export function EmvChip() {
  return (
    <View
      width={38}
      height={28}
      borderRadius={6}
      backgroundColor="#E2B149"
      borderWidth={1}
      borderColor="#B8861B"
      overflow="hidden"
      justifyContent="center"
      alignItems="center"
      position="relative"
    >
      <View
        position="absolute"
        width="100%"
        height={1}
        backgroundColor="rgba(138, 97, 12, 0.6)"
      />
      <View
        position="absolute"
        height="100%"
        width={1}
        backgroundColor="rgba(138, 97, 12, 0.6)"
      />
      <View
        width={16}
        height={12}
        borderRadius={3}
        borderWidth={1}
        borderColor="rgba(138, 97, 12, 0.7)"
        backgroundColor="#ECC86E"
      />
    </View>
  );
}

/** Contactless Payment radiating wave icon */
export function ContactlessWave({ size = 18, color = "rgba(255,255,255,0.7)" }: { size?: number; color?: string }) {
  return (
    <View width={size} height={size} justifyContent="center" alignItems="center">
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8.5 16.5C9.5 15.2 10.1 13.7 10.1 12C10.1 10.3 9.5 8.8 8.5 7.5"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <Path
          d="M12.5 19.5C14.3 17.5 15.3 14.9 15.3 12C15.3 9.1 14.3 6.5 12.5 4.5"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <Path
          d="M16.5 22.5C19.1 19.8 20.6 16.1 20.6 12C20.6 7.9 19.1 4.2 16.5 1.5"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

/** Decorative FinSight executive titanium card concept. */
export function CreditCardMock({
  balanceLabel = "FINSIGHT EXECUTIVE",
  balance = "A clearer next move",
  last4 = "2026",
  width = 320,
  rotate = "-4deg",
}: CreditCardMockProps) {
  return (
    <View
      width={width}
      maxWidth="100%"
      minHeight={196}
      borderRadius={26}
      overflow="hidden"
      padding={22}
      rotate={rotate}
      borderWidth={1}
      borderColor="rgba(255, 255, 255, 0.16)"
      shadowColor="#000000"
      shadowOffset={{ width: 0, height: 20 }}
      shadowOpacity={0.45}
      shadowRadius={28}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`FinSight executive card preview. ${balanceLabel}: ${balance}. Reference ${last4}.`}
    >
      {/* Deep Obsidian Titanium Base */}
      <LinearGradient
        colors={["#1E1E22", "#121215", "#09090B"]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Top Hairline Glass Specular Sheen */}
      <View
        position="absolute"
        top={0}
        left={0}
        right={0}
        height={1.5}
        backgroundColor="rgba(255, 255, 255, 0.28)"
      />

      {/* Ambient Red Glow Orb */}
      <View
        position="absolute"
        top={-50}
        right={-30}
        width={160}
        height={160}
        borderRadius={80}
        backgroundColor={brandColors.redAction}
        opacity={0.22}
      />

      {/* Ambient Orange Glow Orb */}
      <View
        position="absolute"
        bottom={-45}
        right={35}
        width={130}
        height={130}
        borderRadius={65}
        backgroundColor={brandColors.orange}
        opacity={0.16}
      />

      {/* Accent Edge Stripe */}
      <View
        position="absolute"
        top={0}
        bottom={0}
        left={0}
        width={4.5}
        backgroundColor={brandColors.redIdentity}
      />

      {/* Header Row: FinSight Wordmark + Contactless + Mastercard */}
      <XStack alignItems="center" justifyContent="space-between">
        <YStack gap={1}>
          <Text fontSize={14.5} fontWeight="900" color="#FFFFFF" letterSpacing={2}>
            FINSIGHT
          </Text>
          <Text fontSize={8.5} fontWeight="800" color="rgba(255,255,255,0.65)" letterSpacing={1.2}>
            TITANIUM SMART LEDGER
          </Text>
        </YStack>
        <XStack alignItems="center" gap={10}>
          <ContactlessWave size={17} color="rgba(255,255,255,0.7)" />
          <MastercardMark size={26} />
        </XStack>
      </XStack>

      {/* EMV Chip */}
      <XStack marginTop={18} alignItems="center" justifyContent="space-between">
        <EmvChip />
        <Text fontSize={11} fontWeight="700" color="rgba(255,255,255,0.48)" letterSpacing={2}>
          •••• {last4}
        </Text>
      </XStack>

      {/* Balance / Projection Section */}
      <YStack marginTop={16} gap={4}>
        <Text fontSize={10} fontWeight="800" color="rgba(255,255,255,0.55)" letterSpacing={1.2}>
          {balanceLabel}
        </Text>
        <Text maxWidth={240} fontSize={22} lineHeight={27} fontWeight="900" color="#FFFFFF" letterSpacing={-0.4}>
          {balance}
        </Text>
      </YStack>

      {/* Bottom Footer Details */}
      <XStack marginTop="auto" paddingTop={12} alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap={6}>
          <View width={18} height={3} borderRadius={2} backgroundColor={brandColors.redIdentity} />
          <View width={10} height={3} borderRadius={2} backgroundColor={brandColors.orange} />
          <View width={6} height={3} borderRadius={2} backgroundColor={brandColors.gold} />
        </XStack>
        <Text fontSize={10} fontWeight="800" color="rgba(255,255,255,0.6)" letterSpacing={1.4}>
          EXP · 10/28
        </Text>
      </XStack>
    </View>
  );
}
