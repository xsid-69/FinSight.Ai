import React, { useMemo, useState } from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { ArrowUpRight, CheckCircle2, CircleAlert, Sparkles } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { Card } from "./Card";
import { AnimatedNumber } from "./AnimatedNumber";
import { currencySymbol } from "../../constants/typography";
import { GOAL, simulateGoal } from "../../data/intelligence";

const TIMELINES = [3, 5, 8];

type GoalSimulatorProps = {
  onOpenSimulator?: () => void;
};

export function GoalSimulator({ onOpenSimulator }: GoalSimulatorProps) {
  const [draftMonths, setDraftMonths] = useState(GOAL.targetMonths);
  const [appliedMonths, setAppliedMonths] = useState(GOAL.targetMonths);
  const [run, setRun] = useState(0);
  const result = useMemo(() => simulateGoal({ ...GOAL, targetMonths: appliedMonths }), [appliedMonths]);
  const progressPercent = Math.min(100, Math.round((result.projectedBalance / GOAL.amount) * 100));
  const StatusIcon = result.affordable ? CheckCircle2 : CircleAlert;

  const simulate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAppliedMonths(draftMonths);
    setRun((current) => current + 1);
  };

  const openSimulator = () => {
    Haptics.selectionAsync();
    onOpenSimulator?.();
  };

  return (
    <Card gap={16}>
      <XStack alignItems="flex-start" justifyContent="space-between" gap={10}>
        <YStack flex={1} gap={3}>
          <Text fontSize={10.5} lineHeight={15} color="$red" fontWeight="800" letterSpacing={0.9}>GOAL SCENARIO</Text>
          <Text fontSize={18} lineHeight={24} color="$navy" fontWeight="800" accessibilityRole="header">Can I buy this?</Text>
        </YStack>
        <View
          backgroundColor={result.affordable ? "$successSoft" : "$warningSoft"}
          borderRadius={999}
          paddingHorizontal={10}
          paddingVertical={6}
          accessibilityLabel={result.affordable ? "Status: You can afford it" : "Status: Not yet"}
        >
          <XStack alignItems="center" gap={5}>
            <StatusIcon size={14} color={result.affordable ? "$success" : "$warning"} strokeWidth={2.4} />
            <Text fontSize={11.5} fontWeight="800" color={result.affordable ? "$success" : "$warning"}>
              {result.affordable ? "You can afford it" : "Not yet"}
            </Text>
          </XStack>
        </View>
      </XStack>

      <Card variant="soft" padding={14} shadowOpacity={0}>
        <XStack alignItems="baseline" gap={8} flexWrap="wrap">
          <Text fontSize={23} lineHeight={29} fontWeight="800" color="$navy" letterSpacing={-0.6}>
            {currencySymbol(GOAL.currency)}{GOAL.amount.toLocaleString("en-IN")}
          </Text>
          <Text fontSize={13.5} lineHeight={19} color="$secondary" fontWeight="700">{GOAL.name} · {appliedMonths} months</Text>
        </XStack>
        <Text fontSize={11.5} lineHeight={17} color="$secondary" marginTop={4}>Built from the app’s sample savings scenario</Text>
      </Card>

      <YStack gap={8}>
        <Text fontSize={12} lineHeight={17} color="$secondary" fontWeight="700">Target timeline</Text>
        <XStack gap={8} accessibilityRole="radiogroup" accessibilityLabel="Target timeline">
          {TIMELINES.map((months) => {
            const selected = months === draftMonths;
            return (
              <View
                key={months}
                flex={1}
                minHeight={48}
                borderRadius={14}
                alignItems="center"
                justifyContent="center"
                backgroundColor={selected ? "$charcoal" : "$surfaceAlt"}
                borderWidth={1}
                borderColor={selected ? "$charcoal" : "$borderColor"}
                onPress={() => {
                  Haptics.selectionAsync();
                  setDraftMonths(months);
                }}
                pressStyle={{ scale: 0.97, opacity: 0.88 }}
                accessibilityRole="radio"
                accessibilityLabel={`${months} months`}
                accessibilityState={{ selected }}
              >
                <Text fontSize={12.5} fontWeight="800" color={selected ? "white" : "$navy2"}>{months} months</Text>
              </View>
            );
          })}
        </XStack>
      </YStack>

      <YStack gap={12}>
        <XStack gap={12}>
          <YStack flex={1} gap={4}>
            <Text fontSize={11.5} lineHeight={17} color="$secondary" fontWeight="600">Projected balance</Text>
            <AnimatedNumber value={result.projectedBalance} currency={GOAL.currency} size={22} triggerKey={run} />
          </YStack>
          <View width={1} backgroundColor="$borderColor" />
          <YStack flex={1} gap={4}>
            <Text fontSize={11.5} lineHeight={17} color="$secondary" fontWeight="600">Success probability</Text>
            <Text fontSize={22} lineHeight={28} fontWeight="800" color={result.affordable ? "$success" : "$warning"} letterSpacing={-0.5}>
              {result.successProbability}%
            </Text>
          </YStack>
        </XStack>

        <View
          height={9}
          borderRadius={999}
          backgroundColor="$surfaceAlt"
          overflow="hidden"
          accessibilityRole="progressbar"
          accessibilityLabel="Projected goal funding"
          accessibilityValue={{ min: 0, max: 100, now: progressPercent, text: `${progressPercent} percent funded` }}
        >
          <View
            height="100%"
            borderRadius={999}
            backgroundColor={result.affordable ? "$success" : "$warning"}
            width={`${progressPercent}%`}
          />
        </View>
        <Text fontSize={11.5} lineHeight={17} color="$secondary">
          Reaches target in ~{result.monthsToReach} months at your current pace
        </Text>
      </YStack>

      <XStack
        minHeight={48}
        backgroundColor="$red"
        borderRadius={14}
        alignItems="center"
        justifyContent="center"
        gap={7}
        pressStyle={{ scale: 0.98, opacity: 0.9 }}
        onPress={simulate}
        accessibilityRole="button"
        accessibilityLabel={`Update projection to ${draftMonths} months`}
      >
        <Sparkles size={16} color="white" strokeWidth={2.2} />
        <Text color="white" fontSize={14} fontWeight="800">Update projection</Text>
      </XStack>

      {onOpenSimulator ? (
        <XStack
          minHeight={48}
          borderWidth={1}
          borderColor="$borderStrong"
          backgroundColor="$surfaceAlt"
          borderRadius={14}
          alignItems="center"
          justifyContent="center"
          gap={7}
          pressStyle={{ scale: 0.98, opacity: 0.84 }}
          onPress={openSimulator}
          accessibilityRole="button"
          accessibilityLabel="Open full what-if simulator"
          accessibilityHint="Build a goal using your real transaction history"
        >
          <Text color="$navy" fontSize={14} fontWeight="800">Open full what-if simulator</Text>
          <ArrowUpRight size={16} color="$navy" strokeWidth={2.4} />
        </XStack>
      ) : null}
    </Card>
  );
}
