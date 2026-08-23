import React from "react";
import { View } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Sparkles } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { redGradient, gradientStart, gradientEnd, palette } from "../../constants/colors";

export interface FloatingAIButtonProps {
  size?: number;
  onPress?: () => void;
}

/**
 * The signature raised AI action. Red→deep-red gradient with a sparkle glyph
 * (intelligence, not "add"). Floats above the dock center with a soft glow
 * and a gentle idle breathing scale.
 */
export function FloatingAIButton({ size = 56, onPress }: FloatingAIButtonProps) {
  return (
    <MotiView
      from={{ scale: 0.96 }}
      animate={{ scale: 1 }}
      transition={{ type: "timing", duration: 1600, loop: true, repeatReverse: true }}
    >
      <View
        width={size}
        height={size}
        borderRadius={size / 2}
        overflow="hidden"
        alignItems="center"
        justifyContent="center"
        shadowColor={palette.redDeep}
        shadowOffset={{ width: 0, height: 10 }}
        shadowOpacity={0.45}
        shadowRadius={16}
        borderWidth={3}
        borderColor="$backgroundStrong"
        pressStyle={{ scale: 0.94 }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress?.();
        }}
      >
        <LinearGradient
          colors={redGradient as unknown as [string, string]}
          start={gradientStart}
          end={gradientEnd}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Sparkles size={24} color="white" strokeWidth={2.2} />
      </View>
    </MotiView>
  );
}
