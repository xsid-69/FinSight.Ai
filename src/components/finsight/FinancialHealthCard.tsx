import React from "react";
import { XStack, YStack, Text } from "tamagui";
import { Card } from "./Card";
import { RingProgress } from "./RingProgress";
import { Money } from "../banking/Money";
import type { FinancialHealth } from "../../data/intelligence";
import type { CurrencyCode } from "../../constants/typography";

export interface FinancialHealthCardProps {
  health: FinancialHealth;
}

function Metric({ label, amount, currency }: { label: string; amount: number; currency: CurrencyCode }) {
  return (
    <YStack gap={4}>
      <Text fontSize={12} color="$secondary" fontWeight="600">
        {label}
      </Text>
      <Money amount={amount} currency={currency} size={17} weight="800" />
    </YStack>
  );
}

/** Hero: circular health score + monthly spend / projected savings. */
export function FinancialHealthCard({ health }: FinancialHealthCardProps) {
  return (
    <Card padding={20}>
      <Text fontSize={13} color="$secondary" fontWeight="700" marginBottom={16}>
        Financial health
      </Text>
      <XStack alignItems="center" gap={20}>
        <RingProgress value={health.score} label={String(health.score)} sublabel={health.status} />
        <YStack flex={1} gap={16}>
          <Metric label="Monthly spending" amount={health.monthlySpending} currency={health.currency} />
          <Metric label="Projected savings" amount={health.projectedSavings} currency={health.currency} />
        </YStack>
      </XStack>
    </Card>
  );
}
