import React from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { Sparkles } from "@tamagui/lucide-icons";
import { Card } from "./Card";
import type { AIInsight } from "../../data/intelligence";

export interface AIInsightCardProps {
  insight: AIInsight;
}

/** Premium AI insight surface. Reads as financial intelligence, not chat. */
export function AIInsightCard({ insight }: AIInsightCardProps) {
  return (
    <Card
      borderColor="rgba(124,108,242,0.18)"
      backgroundColor="$backgroundStrong"
    >
      <View
        position="absolute"
        top={0}
        left={0}
        bottom={0}
        width={4}
        borderTopLeftRadius="$lg"
        borderBottomLeftRadius="$lg"
        backgroundColor="$ai"
      />
      <XStack alignItems="center" gap={8} marginBottom={10}>
        <View width={22} height={22} borderRadius={7} backgroundColor="$aiSoft" alignItems="center" justifyContent="center">
          <Sparkles size={13} color="$ai" strokeWidth={2.2} />
        </View>
        <Text fontSize={13} fontWeight="800" color="$ai" letterSpacing={0.2}>
          {insight.headline}
        </Text>
      </XStack>
      <Text fontSize={14} lineHeight={21} color="$navy2" fontWeight="500">
        {insight.body}
      </Text>
    </Card>
  );
}
