import React, { useEffect, useState } from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { Check, Loader } from "@tamagui/lucide-icons";
import { useReducedMotion } from "../../hooks/useReducedMotion";

const STAGES = ["Reading transactions", "Recognizing merchants", "Categorizing spending", "Detecting patterns", "Building forecast"];
export interface AnalysisProgressProps { onDone?: () => void; onSkip?: () => void; }

export function AnalysisProgress({ onDone, onSkip }: AnalysisProgressProps) {
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= STAGES.length) {
      const timer = setTimeout(() => onDone?.(), reducedMotion ? 80 : 300);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setStage((current) => current + 1), reducedMotion ? 180 : 480);
    return () => clearTimeout(timer);
  }, [onDone, reducedMotion, stage]);

  return (
    <YStack gap={18} paddingTop={8} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: STAGES.length, now: Math.min(stage, STAGES.length) }}>
      <YStack gap={6}>
        <Text fontSize={20} fontWeight="800" color="$navy" letterSpacing={-0.4}>Analyzing the preview</Text>
        <Text fontSize={13.5} color="$ink2">FInsightAI is organizing representative financial activity.</Text>
      </YStack>
      <YStack gap={14} marginTop={4}>
        {STAGES.map((label, index) => {
          const done = index < stage;
          const active = index === stage;
          const pending = index > stage;
          return (
            <MotiView key={label} animate={{ opacity: pending ? 0.42 : 1 }} transition={{ type: "timing", duration: reducedMotion ? 1 : 180 }}>
              <XStack alignItems="center" gap={12} minHeight={32}>
                <View width={28} height={28} borderRadius={14} alignItems="center" justifyContent="center" backgroundColor={done ? "$success" : active ? "$red" : "$surfaceAlt"}>
                  {done ? <Check size={15} color="white" strokeWidth={3} /> : active ? (
                    <MotiView from={{ rotate: "0deg" }} animate={{ rotate: reducedMotion ? "0deg" : "360deg" }} transition={{ type: "timing", duration: 900, loop: !reducedMotion }}>
                      <Loader size={15} color="white" strokeWidth={2.5} />
                    </MotiView>
                  ) : <Text fontSize={12} fontWeight="800" color="$secondary">{index + 1}</Text>}
                </View>
                <Text fontSize={14.5} fontWeight={active ? "800" : "600"} color={pending ? "$secondary" : "$navy"}>{label}</Text>
              </XStack>
            </MotiView>
          );
        })}
      </YStack>
      <Text fontSize={13} fontWeight="700" color="$secondary" textAlign="center" paddingVertical={12} pressStyle={{ opacity: 0.6 }} onPress={onSkip} accessibilityRole="button">Skip preview</Text>
    </YStack>
  );
}
