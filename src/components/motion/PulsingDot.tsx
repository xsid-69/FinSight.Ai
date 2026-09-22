import React, { useEffect } from "react";
import { View, Text, XStack } from "tamagui";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { brandColors } from "../../theme/mastercard";
import { useReducedMotion } from "../../hooks/useReducedMotion";

interface PulsingDotProps {
  label?: string;
  dotColor?: string;
  textColor?: string;
  size?: number;
}

export function PulsingDot({
  label = "Live Auto-Sync",
  dotColor = brandColors.success,
  textColor,
  size = 7,
}: PulsingDotProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    if (reducedMotion) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 900 }),
        withTiming(1.0, { duration: 900 }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 900 }),
        withTiming(0.85, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, [opacity, reducedMotion, scale]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <XStack alignItems="center" gap={6}>
      <View width={size + 6} height={size + 6} alignItems="center" justifyContent="center">
        {!reducedMotion && (
          <Animated.View
            style={[
              {
                position: "absolute",
                width: size + 6,
                height: size + 6,
                borderRadius: (size + 6) / 2,
                backgroundColor: dotColor,
              },
              animatedRingStyle,
            ]}
          />
        )}
        <View
          width={size}
          height={size}
          borderRadius={size / 2}
          backgroundColor={dotColor}
        />
      </View>
      {label ? (
        <Text
          fontSize={10.5}
          fontWeight="700"
          letterSpacing={0.4}
          color={textColor ? (textColor as any) : "$onBrand"}
          opacity={0.88}
        >
          {label}
        </Text>
      ) : null}
    </XStack>
  );
}
