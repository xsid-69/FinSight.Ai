import React from "react";
import { XStack, Text, View } from "tamagui";
import { MotiView } from "moti";

export interface LiveDotProps {
  label?: string;
}

/** Subtly pulsing "live ingestion" indicator. */
export function LiveDot({ label = "Live ingestion" }: LiveDotProps) {
  return (
    <XStack alignItems="center" gap={6}>
      <MotiView
        from={{ opacity: 0.55 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 1500, loop: true, repeatReverse: true }}
      >
        <View width={8} height={8} borderRadius={4} backgroundColor="$success" />
      </MotiView>
      <Text fontSize={12} fontWeight="700" color="$success">
        {label}
      </Text>
    </XStack>
  );
}
