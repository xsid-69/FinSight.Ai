import React from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { TriangleAlert } from "@tamagui/lucide-icons";
import { Card } from "./Card";
import { Money } from "../banking/Money";
import { palette } from "../../constants/colors";
import type { Anomaly } from "../../data/intelligence";

export interface AnomalyCardProps {
  anomaly: Anomaly;
  onDetails?: () => void;
}

const CHART_H = 62;

/** Anomaly: headline + amount, a mini bar chart with the flagged spike, and
 *  a subtle "normal range" band. Math (Z-score) is a secondary detail. */
export function AnomalyCard({ anomaly, onDetails }: AnomalyCardProps) {
  const max = Math.max(...anomaly.series);
  const bandTop = CHART_H * (1 - anomaly.normalMax / max);

  return (
    <Card>
      <XStack justifyContent="space-between" alignItems="flex-start">
        <XStack gap={9} flex={1}>
          <View width={30} height={30} borderRadius={9} backgroundColor="rgba(214,69,69,0.12)" alignItems="center" justifyContent="center">
            <TriangleAlert size={16} color="$danger" strokeWidth={2.2} />
          </View>
          <YStack flex={1}>
            <Text fontSize={14} fontWeight="800" color="$navy">
              {anomaly.title}
            </Text>
            <Text fontSize={12} color="$secondary" marginTop={2}>
              {anomaly.note}
            </Text>
          </YStack>
        </XStack>
        <View backgroundColor="$surfaceAlt" borderRadius={8} paddingHorizontal={8} paddingVertical={4}>
          <Text fontSize={11} fontWeight="700" color="$navy2">
            Z {anomaly.zScore.toFixed(1)}
          </Text>
        </View>
      </XStack>

      <XStack alignItems="flex-end" gap={6} marginTop={14}>
        <Money amount={anomaly.amount} currency={anomaly.currency} size={22} weight="800" kind="none" />
        <Text fontSize={12} color="$secondary" fontWeight="600" marginBottom={3}>
          spent unusually fast
        </Text>
      </XStack>

      {/* mini bar chart */}
      <View height={CHART_H} marginTop={14}>
        {/* normal-range band */}
        <View
          position="absolute"
          left={0}
          right={0}
          top={bandTop}
          bottom={0}
          backgroundColor="rgba(99,166,74,0.08)"
          borderTopWidth={1}
          borderTopColor="rgba(99,166,74,0.35)"
          borderStyle="dashed"
          borderRadius={4}
        />
        <XStack height={CHART_H} alignItems="flex-end" gap={7}>
          {anomaly.series.map((v, i) => {
            const isSpike = i === anomaly.series.length - 1;
            const h = Math.max(4, (v / max) * CHART_H);
            return (
              <MotiView
                key={i}
                from={{ height: 4 }}
                animate={{ height: h }}
                transition={{ type: "timing", duration: 500, delay: i * 55 }}
                style={{
                  flex: 1,
                  borderRadius: 4,
                  backgroundColor: isSpike ? palette.danger : "rgba(57,67,92,0.22)",
                }}
              />
            );
          })}
        </XStack>
      </View>

      <Text
        fontSize={12.5}
        fontWeight="700"
        color="$red"
        marginTop={14}
        pressStyle={{ opacity: 0.6 }}
        onPress={onDetails}
      >
        Why this was flagged →
      </Text>
    </Card>
  );
}
