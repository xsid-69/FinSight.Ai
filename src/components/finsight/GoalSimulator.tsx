import React, { useMemo, useState } from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { CheckCircle2, Sparkles } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { Card } from "./Card";
import { AnimatedNumber } from "./AnimatedNumber";
import { currencySymbol } from "../../constants/typography";
import { GOAL, simulateGoal } from "../../data/intelligence";

const TIMELINES = [3, 5, 8];

export function GoalSimulator() {
  const [draftMonths, setDraftMonths] = useState(GOAL.targetMonths);
  const [appliedMonths, setAppliedMonths] = useState(GOAL.targetMonths);
  const [run, setRun] = useState(0);
  const result = useMemo(() => simulateGoal({ ...GOAL, targetMonths: appliedMonths }), [appliedMonths]);

  const simulate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppliedMonths(draftMonths);
    setRun((current) => current + 1);
  };

  return (
    <Card>
      <XStack alignItems="center" justifyContent="space-between" gap={10}>
        <Text fontSize={13} color="$secondary" fontWeight="700">Can I buy this?</Text>
        <View backgroundColor={result.affordable ? "rgba(99,166,74,0.12)" : "rgba(215,154,53,0.12)"} borderRadius={999} paddingHorizontal={10} paddingVertical={4}>
          <XStack alignItems="center" gap={4}>
            <CheckCircle2 size={13} color={result.affordable ? "$success" : "$warning"} strokeWidth={2.4} />
            <Text fontSize={11.5} fontWeight="800" color={result.affordable ? "$success" : "$warning"}>{result.affordable ? "You can afford it" : "Not yet"}</Text>
          </XStack>
        </View>
      </XStack>

      <XStack alignItems="baseline" gap={8} marginTop={10} flexWrap="wrap">
        <Text fontSize={20} fontWeight="800" color="$navy" letterSpacing={-0.5}>{currencySymbol(GOAL.currency)}{GOAL.amount.toLocaleString("en-IN")}</Text>
        <Text fontSize={14} color="$secondary" fontWeight="600">{GOAL.name} · {appliedMonths} months</Text>
      </XStack>

      <Text fontSize={11.5} color="$secondary" fontWeight="700" marginTop={16}>Target timeline</Text>
      <XStack gap={8} marginTop={8} accessibilityRole="radiogroup">
        {TIMELINES.map((months) => {
          const selected = months === draftMonths;
          return (
            <View key={months} flex={1} minHeight={42} borderRadius={13} alignItems="center" justifyContent="center" backgroundColor={selected ? "$navy" : "$surfaceAlt"} onPress={() => { Haptics.selectionAsync(); setDraftMonths(months); }} pressStyle={{ scale: 0.97 }} accessibilityRole="radio" accessibilityState={{ selected }}>
              <Text fontSize={12.5} fontWeight="800" color={selected ? "white" : "$navy2"}>{months} months</Text>
            </View>
          );
        })}
      </XStack>

      <XStack marginTop={16} gap={12}>
        <YStack flex={1} gap={4}>
          <Text fontSize={11.5} color="$secondary" fontWeight="600">Projected balance</Text>
          <AnimatedNumber value={result.projectedBalance} currency={GOAL.currency} size={22} triggerKey={run} />
        </YStack>
        <View width={1} backgroundColor="$borderColor" />
        <YStack flex={1} gap={4}>
          <Text fontSize={11.5} color="$secondary" fontWeight="600">Success probability</Text>
          <Text fontSize={22} fontWeight="800" color={result.affordable ? "$success" : "$warning"} letterSpacing={-0.5}>{result.successProbability}%</Text>
        </YStack>
      </XStack>

      <View height={8} borderRadius={999} backgroundColor="$surfaceAlt" marginTop={16} overflow="hidden">
        <View height="100%" borderRadius={999} backgroundColor={result.affordable ? "$success" : "$warning"} width={`${Math.min(100, Math.round((result.projectedBalance / GOAL.amount) * 100))}%`} />
      </View>
      <Text fontSize={11.5} color="$secondary" marginTop={8}>Reaches target in ~{result.monthsToReach} months at your current pace</Text>

      <XStack minHeight={48} marginTop={16} backgroundColor="$navy" borderRadius={14} alignItems="center" justifyContent="center" gap={7} pressStyle={{ scale: 0.98, opacity: 0.9 }} onPress={simulate} accessibilityRole="button" accessibilityLabel={`Update projection to ${draftMonths} months`}>
        <Sparkles size={16} color="white" strokeWidth={2.2} />
        <Text color="white" fontSize={14} fontWeight="800">Update projection</Text>
      </XStack>
    </Card>
  );
}
