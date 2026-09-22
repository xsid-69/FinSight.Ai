import React, { useRef } from "react";
import { type Animated as RNAnimated, StyleSheet } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { Swipeable } from "react-native-gesture-handler";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FileEdit, ShieldAlert } from "@tamagui/lucide-icons";
import { brandColors } from "../../theme/mastercard";
import { triggerButtonHaptic, triggerThresholdHaptic } from "../../utils/haptics";
import { SpringPressable } from "./SpringPressable";

interface SwipeableTransactionRowProps {
  children: React.ReactNode;
  index?: number;
  onAddNote?: () => void;
  onExclude?: () => void;
  accessibilityLabel?: string;
}

const SWIPE_THRESHOLD = 70;

export function SwipeableTransactionRow({
  children,
  index = 0,
  onAddNote,
  onExclude,
  accessibilityLabel,
}: SwipeableTransactionRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const thresholdFiredRef = useRef(false);

  const handleSwipeableOpen = (direction: "left" | "right") => {
    void triggerThresholdHaptic();
    if (direction === "left" && onAddNote) {
      onAddNote();
      swipeableRef.current?.close();
    } else if (direction === "right" && onExclude) {
      onExclude();
      swipeableRef.current?.close();
    }
  };

  const renderLeftActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    return (
      <XStack
        flex={1}
        backgroundColor="$warningSoft"
        borderRadius={16}
        marginBottom={2}
        alignItems="center"
        justifyContent="flex-start"
        paddingLeft={20}
        gap={8}
      >
        <FileEdit size={18} color="$goldDeep" strokeWidth={2.2} />
        <Text fontSize={12} fontWeight="800" color="$goldDeep">
          Add Note
        </Text>
      </XStack>
    );
  };

  const renderRightActions = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    _dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    return (
      <XStack
        flex={1}
        backgroundColor="$dangerSoft"
        borderRadius={16}
        marginBottom={2}
        alignItems="center"
        justifyContent="flex-end"
        paddingRight={20}
        gap={8}
      >
        <ShieldAlert size={18} color="$danger" strokeWidth={2.2} />
        <Text fontSize={12} fontWeight="800" color="$danger">
          Exclude
        </Text>
      </XStack>
    );
  };

  return (
    <Animated.View
      entering={
        FadeInDown
          ? FadeInDown.delay(Math.min(index, 12) * 50).springify().damping(12)
          : undefined
      }
    >
      <Swipeable
        ref={swipeableRef}
        friction={1.5}
        overshootLeft={false}
        overshootRight={false}
        leftThreshold={SWIPE_THRESHOLD}
        rightThreshold={SWIPE_THRESHOLD}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeableOpen}
      >
        <View backgroundColor="$cardBg">{children}</View>
      </Swipeable>
    </Animated.View>
  );
}
