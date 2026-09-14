import React from "react";
import { View } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Sparkles } from "@tamagui/lucide-icons";
import { redGradient, gradientStart, gradientEnd, palette } from "../../constants/colors";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export interface FloatingAIButtonProps {
  size?: number;
  active?: boolean;
  onPress?: () => void;
}

/** Signature AI action with state-driven motion rather than an idle loop. */
export function FloatingAIButton({ size = 56, active = false, onPress }: FloatingAIButtonProps) {
  const reducedMotion = useReducedMotion();

  return (
    <MotiView
      animate={{ scale: reducedMotion ? 1 : active ? 1.025 : 1 }}
      transition={{ type: "timing", duration: reducedMotion ? 1 : 200 }}
    >
      <View
        width={size}
        height={size}
        borderRadius={size / 2}
        overflow="hidden"
        alignItems="center"
        justifyContent="center"
        shadowColor={palette.redDeep}
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={active ? 0.38 : 0.26}
        shadowRadius={14}
        borderWidth={3}
        borderColor="$backgroundStrong"
        pressStyle={{ scale: 0.94 }}
        onPress={onPress}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={onPress ? "Open FinSight AI" : undefined}
      >
        <LinearGradient
          colors={redGradient as unknown as [string, string]}
          start={gradientStart}
          end={gradientEnd}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          position="absolute"
          top={8}
          left={11}
          width={22}
          height={8}
          borderRadius={8}
          backgroundColor="rgba(255,255,255,0.20)"
          rotate="-18deg"
        />
        <Sparkles size={24} color="white" strokeWidth={2.2} />
      </View>
    </MotiView>
  );
}
