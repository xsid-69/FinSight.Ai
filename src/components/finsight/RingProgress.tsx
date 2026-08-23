import React, { useEffect } from "react";
import { View, Text, YStack } from "tamagui";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { palette } from "../../constants/colors";

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

/** Circular score indicator with a red→accent gradient arc that sweeps in. */
export function RingProgress({ value, size = 96, strokeWidth = 9, label, sublabel }: RingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(Math.max(0, Math.min(100, value)) / 100, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View width={size} height={size} alignItems="center" justifyContent="center">
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={palette.accent} />
            <Stop offset="1" stopColor={palette.redDeep} />
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
      <YStack position="absolute" alignItems="center">
        {label ? (
          <Text fontSize={26} fontWeight="800" color="$navy" letterSpacing={-0.6}>
            {label}
          </Text>
        ) : null}
        {sublabel ? (
          <Text fontSize={11} fontWeight="700" color="$success" letterSpacing={0.2}>
            {sublabel}
          </Text>
        ) : null}
      </YStack>
    </View>
  );
}
