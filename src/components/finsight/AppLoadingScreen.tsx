import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View as NativeView,
  useWindowDimensions,
} from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { ShieldCheck } from "@tamagui/lucide-icons";

import { Card } from "./Card";
import { Wordmark } from "./Wordmark";
import { brandColors, brandOverlays } from "../../theme/mastercard";
import { redGradient, warmGradient } from "../../constants/colors";

const STATUS_MESSAGES = [
  { title: "Securing session", desc: "Connecting to encrypted financial ledger..." },
  { title: "Checking authenticated account", desc: "Verifying your private access credentials..." },
  { title: "Synchronizing intelligence", desc: "Applying local machine learning models..." },
  { title: "Ready", desc: "Opening your FinSight workspace..." },
];

export interface AppLoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export function AppLoadingScreen({
  message,
  subMessage,
}: AppLoadingScreenProps) {
  const { width } = useWindowDimensions();
  const [statusIndex, setStatusIndex] = useState(0);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for logo
  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Shimmer / runner animation for the progress bar
  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [shimmerAnim]);

  // Progress fill animation
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.92,
      duration: 3500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  // Message cycling timer
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const currentStatus = STATUS_MESSAGES[statusIndex];
  const displayTitle = message || currentStatus.title;
  const displayDesc = subMessage || currentStatus.desc;

  // Interpolated shimmer runner position (moving between 0% and 70%)
  const runnerLeft = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "72%"],
  });

  return (
    <NativeView
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`FinSight AI is loading: ${displayTitle}`}
    >
      {/* Background canvas gradient */}
      <LinearGradient
        colors={["#FAF9F7", "#F3F2EE", "#EBE9E3"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient decorative glow orbs in signature Mastercard colors */}
      <NativeView
        style={[
          styles.glowOrb,
          {
            top: -60,
            right: -60,
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: brandColors.redSoft,
            opacity: 0.65,
          },
        ]}
      />
      <NativeView
        style={[
          styles.glowOrb,
          {
            bottom: -60,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: brandColors.orangeSoft,
            opacity: 0.6,
          },
        ]}
      />
      <NativeView
        style={[
          styles.glowOrb,
          {
            top: "35%",
            left: -100,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: brandColors.goldSoft,
            opacity: 0.35,
          },
        ]}
      />

      {/* Main Content Area */}
      <YStack
        width="100%"
        maxWidth={380}
        paddingHorizontal={26}
        alignItems="center"
        justifyContent="center"
        gap={28}
        zIndex={2}
      >
        {/* Brand Lockup: Logo with animated breathing pulse */}
        <YStack alignItems="center" gap={16}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Ambient soft glow ring behind logo */}
            <NativeView style={styles.logoHalo} />
            <Image
              source={require("../../../assets/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="FinSight AI official logo"
            />
          </Animated.View>

          {/* Typography Lockup */}
          <YStack alignItems="center" gap={6}>
            <Wordmark onDark={false} size={28} />
            <Text
              fontSize={10.5}
              fontWeight="800"
              color="$secondary"
              letterSpacing={1.8}
              textTransform="uppercase"
            >
              Financial Intelligence
            </Text>
          </YStack>
        </YStack>

        {/* Professional Loader Card */}
        <Card
          width="100%"
          padding={20}
          borderRadius={24}
          backgroundColor="$surface"
          borderColor="$borderColor"
          borderWidth={1}
          shadowColor={brandColors.charcoal}
          shadowOffset={{ width: 0, height: 12 }}
          shadowOpacity={0.07}
          shadowRadius={24}
        >
          <YStack gap={14}>
            {/* Animated Status Header */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <XStack alignItems="center" justifyContent="space-between" gap={10}>
                <YStack flex={1} gap={3}>
                  <Text
                    fontSize={14.5}
                    fontWeight="800"
                    color="$navy"
                    lineHeight={20}
                  >
                    {displayTitle}
                  </Text>
                  <Text
                    fontSize={12}
                    color="$secondary"
                    lineHeight={16}
                    numberOfLines={1}
                  >
                    {displayDesc}
                  </Text>
                </YStack>
                {/* Active pulse dot */}
                <NativeView style={styles.pulseIndicator}>
                  <NativeView style={styles.pulseInnerDot} />
                </NativeView>
              </XStack>
            </Animated.View>

            {/* Custom Dual-Tone Animated Progress Track */}
            <NativeView style={styles.trackBackground}>
              <Animated.View
                style={[
                  styles.shimmerRunner,
                  {
                    left: runnerLeft,
                  },
                ]}
              >
                <LinearGradient
                  colors={[brandColors.redIdentity, brandColors.orange, brandColors.gold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </NativeView>

            {/* Micro Brand Accents */}
            <XStack
              alignItems="center"
              justifyContent="space-between"
              paddingTop={2}
              accessible={false}
              importantForAccessibility="no-hide-descendants"
            >
              <Text fontSize={10} fontWeight="700" color="$muted" letterSpacing={0.4}>
                WORKSPACE RESTORATION
              </Text>
              <XStack gap={4} alignItems="center">
                <NativeView style={[styles.microDot, { backgroundColor: brandColors.redIdentity }]} />
                <NativeView style={[styles.microDot, { backgroundColor: brandColors.orange }]} />
                <NativeView style={[styles.microDot, { backgroundColor: brandColors.gold }]} />
              </XStack>
            </XStack>
          </YStack>
        </Card>
      </YStack>

      {/* Security & Privacy Trust Footer */}
      <NativeView style={styles.footer}>
        <XStack alignItems="center" gap={7}>
          <ShieldCheck size={14} color={brandColors.textMuted} strokeWidth={2.2} />
          <Text
            fontSize={11}
            fontWeight="600"
            color="$textMuted"
            letterSpacing={0.3}
          >
            Bank-Grade Encryption · On-Device Privacy
          </Text>
        </XStack>
      </NativeView>
    </NativeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF9F7",
  },
  glowOrb: {
    position: "absolute",
    pointerEvents: "none",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoHalo: {
    position: "absolute",
    width: 114,
    height: 114,
    borderRadius: 34,
    backgroundColor: brandColors.redSoft,
    opacity: 0.8,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 24,
    shadowColor: brandColors.redIdentity,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  pulseIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: brandColors.redSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseInnerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: brandColors.redIdentity,
  },
  trackBackground: {
    height: 6,
    width: "100%",
    borderRadius: 3,
    backgroundColor: "#EFECE6",
    overflow: "hidden",
    position: "relative",
  },
  shimmerRunner: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "38%",
    borderRadius: 3,
    overflow: "hidden",
  },
  microDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
