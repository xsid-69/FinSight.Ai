import React, { type ReactNode } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { triggerButtonHaptic } from "../../utils/haptics";

export interface SpringPressableProps {
  children: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  scaleTo?: number;
  haptic?: boolean;
  accessibilityRole?: "button" | "tab" | "link" | "header" | "none";
  accessibilityLabel?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    expanded?: boolean;
    busy?: boolean;
  };
  testID?: string;
}

// Spring parameters calibrated for Tier-1 app tactile response (damping: 12, stiffness: 200, mass: 0.8)
const PRESS_SPRING_CONFIG = {
  damping: 12,
  stiffness: 200,
  mass: 0.8,
};

export function SpringPressable({
  children,
  onPress,
  onLongPress,
  style,
  disabled = false,
  scaleTo = 0.96,
  haptic = true,
  accessibilityRole = "button",
  accessibilityLabel,
  accessibilityState,
  testID,
}: SpringPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(scaleTo, PRESS_SPRING_CONFIG);
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, PRESS_SPRING_CONFIG);
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (disabled) return;
    if (haptic) {
      void triggerButtonHaptic();
    }
    onPress?.(event);
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      testID={testID}
      style={({ pressed }) => [
        style,
        { opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
