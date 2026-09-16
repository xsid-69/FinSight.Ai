import React, { useEffect, useRef } from "react";
import { View, Text, YStack } from "tamagui";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from "react-native-reanimated";

import { palette } from "../../constants/colors";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RingProgressProps {
  /** 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Large center number. */
  label?: string;
  sublabel?: string;
}

/** Circular score indicator with a warm red→orange arc. */
export function RingProgress({ value, size = 96, strokeWidth = 9, label, sublabel }: RingProgressProps) {
  const reducedMotion = useReducedMotion();
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(clampedValue / 100);
  const previousValue = useRef(clampedValue);
  const previousReducedMotion = useRef(reducedMotion);
  const statusColor = clampedValue >= 70 ? "$success" : clampedValue >= 45 ? "$warning" : "$danger";

  useEffect(() => {
    const valueChanged = previousValue.current !== clampedValue;
    const motionBecameAvailable = previousReducedMotion.current && !reducedMotion;
    previousValue.current = clampedValue;
    previousReducedMotion.current = reducedMotion;

    if (reducedMotion) {
      progress.value = clampedValue / 100;
      return;
    }

    if (valueChanged || motionBecameAvailable) {
      if (motionBecameAvailable) progress.value = 0;
      progress.value = withTiming(clampedValue / 100, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [clampedValue, progress, reducedMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      width={size}
      height={size}
      alignItems="center"
      justifyContent="center"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={sublabel ? `Progress: ${sublabel}` : "Progress"}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedValue), text: `${Math.round(clampedValue)} percent` }}
    >
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.red} />
            <Stop offset="0.58" stopColor={palette.orange} />
            <Stop offset="1" stopColor={palette.gold} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={palette.border} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>
      <YStack position="absolute" alignItems="center" accessible={false} importantForAccessibility="no-hide-descendants">
        {label ? (
          <Text fontSize={26} fontWeight="800" color="$navy" letterSpacing={-0.6}>
            {label}
          </Text>
        ) : null}
        {sublabel ? (
          <Text fontSize={11} fontWeight="700" color={statusColor} letterSpacing={0.2}>
            {sublabel}
          </Text>
        ) : null}
      </YStack>
    </View>
  );
}
