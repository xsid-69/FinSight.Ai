import React, { useMemo, useState } from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { CheckCircle2, Sparkles } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { Card } from "./Card";
import { AnimatedNumber } from "./AnimatedNumber";
import { currencySymbol } from "../../constants/typography";
import { GOAL, simulateGoal } from "../../data/intelligence";

/** Goal simulator: "Can I buy this?" with an animated projected balance,
 *  success probability, and a re-run action. */
export function GoalSimulator() {
  const [run, setRun] = useState(0);
  const result = useMemo(() => simulateGoal(GOAL), []);

  return (
    <Card>
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize={13} color="$secondary" fontWeight="700">
          Can I buy this?
        </Text>
        <View backgroundColor="rgba(99,166,74,0.12)" borderRadius={999} paddingHorizontal={10} paddingVertical={4}>
          <XStack alignItems="center" gap={4}>
            <CheckCircle2 size={13} color="$success" strokeWidth={2.4} />
            <Text fontSize={11.5} fontWeight="800" color="$success">
              {result.affordable ? "You can afford it" : "Not yet"}
            </Text>
          </XStack>
        </View>
      </XStack>

      <XStack alignItems="baseline" gap={8} marginTop={10}>
        <Text fontSize={20} fontWeight="800" color="$navy" letterSpacing={-0.5}>
          {currencySymbol(GOAL.currency)}
          {GOAL.amount.toLocaleString("en-IN")}
        </Text>
        <Text fontSize={14} color="$secondary" fontWeight="600">
          {GOAL.name} · {GOAL.targetMonths} months
        </Text>
      </XStack>

      <XStack marginTop={16} gap={12}>
        <YStack flex={1} gap={4}>
          <Text fontSize={11.5} color="$secondary" fontWeight="600">
            Projected balance
          </Text>
          <AnimatedNumber value={result.projectedBalance} currency={GOAL.currency} size={22} triggerKey={run} />
        </YStack>
        <View width={1} backgroundColor="$borderColor" />
        <YStack flex={1} gap={4}>
          <Text fontSize={11.5} color="$secondary" fontWeight="600">
            Success probability
          </Text>
          <Text fontSize={22} fontWeight="800" color="$success" letterSpacing={-0.5}>
            {result.successProbability}%
          </Text>
        </YStack>
      </XStack>

      {/* progress toward goal */}
      <View height={8} borderRadius={999} backgroundColor="$surfaceAlt" marginTop={16} overflow="hidden">
        <View
          height="100%"
          borderRadius={999}
          backgroundColor="$success"
          width={`${Math.min(100, Math.round((result.projectedBalance / GOAL.amount) * 100))}%`}
        />
      </View>
      <Text fontSize={11.5} color="$secondary" marginTop={8}>
        Reaches target in ~{result.monthsToReach} months at your current pace
      </Text>

      <XStack
        marginTop={16}
        backgroundColor="$navy"
        borderRadius={14}
        paddingVertical={12}
        alignItems="center"
        justifyContent="center"
        gap={7}
        pressStyle={{ scale: 0.98, opacity: 0.9 }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setRun((r) => r + 1);
        }}
      >
        <Sparkles size={16} color="white" strokeWidth={2.2} />
        <Text color="white" fontSize={14} fontWeight="800">
          Simulate goal
        </Text>
      </XStack>
    </Card>
  );
}
