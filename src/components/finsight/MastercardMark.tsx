import React from "react";
import { XStack, View } from "tamagui";

export interface MastercardMarkProps {
  size?: number;
}

/** The two-circle Mastercard-style mark (red + warm orange, overlapping). */
export function MastercardMark({ size = 26 }: MastercardMarkProps) {
  const overlap = size * 0.42;
  return (
    <XStack width={size * 2 - overlap} height={size} alignItems="center">
      <View width={size} height={size} borderRadius={size / 2} backgroundColor="#EB001B" />
      <View
        width={size}
        height={size}
        borderRadius={size / 2}
        backgroundColor="#F79E1B"
        marginLeft={-overlap}
        opacity={0.92}
      />
    </XStack>
  );
}
