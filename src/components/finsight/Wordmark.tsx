import React from "react";
import { XStack, Text, View } from "tamagui";

export interface WordmarkProps {
  /** Render for a light (red header) or dark surface. */
  onDark?: boolean;
  size?: number;
}

/**
 * "FInsight AI" wordmark. The AI is set in a subtle accent chip to read as
 * financial *intelligence* rather than a bank logo.
 */
export function Wordmark({ onDark = true, size = 19 }: WordmarkProps) {
  const primary = onDark ? "white" : "$navy";
  return (
    <XStack alignItems="center" gap={7}>
      <Text fontSize={size} fontWeight="800" letterSpacing={-0.5} color={primary as any}>
        FInsight
      </Text>
      <View
        borderRadius={8}
        paddingHorizontal={7}
        paddingVertical={2}
        backgroundColor={onDark ? "rgba(255,255,255,0.18)" : "$aiSoft"}
      >
        <Text fontSize={size - 5} fontWeight="800" letterSpacing={0.5} color={onDark ? "white" : "$ai"}>
          AI
        </Text>
      </View>
    </XStack>
  );
}
