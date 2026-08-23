import React from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { palette } from "../../constants/colors";

export interface PercentileBarProps {
  name: string;
  percentile: number;
  peerMedian: number;
  currencySymbol: string;
  delay?: number;
}

/** A single cohort category: name, percentile, and a compact position bar. */
export function PercentileBar({ name, percentile, peerMedian, currencySymbol: sym, delay = 0 }: PercentileBarProps) {
  const high = percentile >= 80;
  const fill = high ? palette.red : palette.navy2;

  return (
    <YStack gap={7}>
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize={13.5} fontWeight="700" color="$navy">
          {name}
        </Text>
        <Text fontSize={13} fontWeight="800" color={high ? "$red" : "$navy2"}>
          {percentile}th
        </Text>
      </XStack>
      <View height={7} borderRadius={999} backgroundColor="$surfaceAlt" overflow="hidden">
        <MotiView
          from={{ width: "0%" }}
          animate={{ width: `${percentile}%` }}
          transition={{ type: "timing", duration: 700, delay }}
          style={{ height: "100%", borderRadius: 999, backgroundColor: fill }}
        />
      </View>
      <Text fontSize={11.5} color="$secondary">
        Peer median {sym}
        {peerMedian.toLocaleString("en-IN")} / month
      </Text>
    </YStack>
  );
}
