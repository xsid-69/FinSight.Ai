import React from "react";
import { YStack, XStack, Text, View } from "tamagui";
import { ArrowDownRight, ArrowUpRight, TriangleAlert, Minus } from "@tamagui/lucide-icons";
import { Money } from "../banking/Money";
import type { SummaryStat } from "../../data/intelligence";

export interface SummaryStatCardProps {
  stat: SummaryStat;
  width?: number;
}

const TREND: Record<SummaryStat["trend"], { color: string; Icon: any }> = {
  down: { color: "$success", Icon: ArrowDownRight },
  up: { color: "$success", Icon: ArrowUpRight },
  flat: { color: "$secondary", Icon: Minus },
  alert: { color: "$warning", Icon: TriangleAlert },
};

/** Compact stat card for the horizontal peek carousel. */
export function SummaryStatCard({ stat, width = 236 }: SummaryStatCardProps) {
  const t = TREND[stat.trend];
  const Icon = t.Icon;

  return (
    <YStack
      width={width}
      height={128}
      marginRight={16}
      backgroundColor="$backgroundStrong"
      borderRadius="$lg"
      borderWidth={1}
      borderColor="rgba(24,35,61,0.05)"
      padding={16}
      justifyContent="space-between"
      shadowColor="#0B1220"
      shadowOffset={{ width: 0, height: 8 }}
      shadowOpacity={0.05}
      shadowRadius={16}
    >
      <Text fontSize={12.5} color="$secondary" fontWeight="600">
        {stat.title}
      </Text>

      {stat.isCount ? (
        <Text fontSize={26} fontWeight="800" color="$navy" letterSpacing={-0.6} fontVariant={["tabular-nums"]}>
          {stat.value}
        </Text>
      ) : (
        <Money amount={stat.value} currency={stat.currency} size={22} weight="800" />
      )}

      <XStack alignItems="center" gap={8}>
        <View
          width={18}
          height={18}
          borderRadius={9}
          alignItems="center"
          justifyContent="center"
          backgroundColor={stat.trend === "alert" ? "rgba(215,154,53,0.14)" : "rgba(99,166,74,0.14)"}
        >
          <Icon size={12} color={t.color} strokeWidth={2.4} />
        </View>
        <Text fontSize={12} color={t.color as any} fontWeight="700">
          {stat.caption}
        </Text>
      </XStack>
    </YStack>
  );
}
