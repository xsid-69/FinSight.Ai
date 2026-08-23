import React, { useEffect, useState } from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { Check, Loader } from "@tamagui/lucide-icons";

const STAGES = [
  "Reading transactions",
  "Recognizing merchants",
  "Categorizing spending",
  "Detecting patterns",
  "Building forecast",
];

export interface AnalysisProgressProps {
  onDone?: () => void;
  onSkip?: () => void;
}

/** Animated multi-stage analysis sequence (skippable). */
export function AnalysisProgress({ onDone, onSkip }: AnalysisProgressProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= STAGES.length) {
      const t = setTimeout(() => onDone?.(), 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage((s) => s + 1), 520);
    return () => clearTimeout(t);
  }, [stage, onDone]);

  return (
    <YStack gap={18} paddingTop={8}>
      <YStack gap={6}>
        <Text fontSize={20} fontWeight="800" color="$navy" letterSpacing={-0.4}>
          Analyzing your statement
        </Text>
        <Text fontSize={13.5} color="$ink2">
          FInsightAI is understanding your financial history.
        </Text>
      </YStack>

      <YStack gap={14} marginTop={4}>
        {STAGES.map((label, i) => {
          const done = i < stage;
          const active = i === stage;
          const pending = i > stage;
          return (
            <MotiView
              key={label}
              animate={{ opacity: pending ? 0.4 : 1 }}
              transition={{ type: "timing", duration: 250 }}
            >
              <XStack alignItems="center" gap={12}>
                <View
                  width={28}
                  height={28}
                  borderRadius={14}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor={done ? "$success" : active ? "$red" : "$surfaceAlt"}
                >
                  {done ? (
                    <Check size={15} color="white" strokeWidth={3} />
                  ) : active ? (
                    <MotiView
                      from={{ rotate: "0deg" }}
                      animate={{ rotate: "360deg" }}
                      transition={{ type: "timing", duration: 900, loop: true }}
                    >
                      <Loader size={15} color="white" strokeWidth={2.5} />
                    </MotiView>
                  ) : (
                    <Text fontSize={12} fontWeight="800" color="$secondary">
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text fontSize={14.5} fontWeight={active ? "800" : "600"} color={pending ? "$secondary" : "$navy"}>
                  {label}
                </Text>
              </XStack>
            </MotiView>
          );
        })}
      </YStack>

      <Text
        fontSize={13}
        fontWeight="700"
        color="$secondary"
        textAlign="center"
        marginTop={8}
        pressStyle={{ opacity: 0.6 }}
        onPress={onSkip}
      >
        Skip
      </Text>
    </YStack>
  );
}
