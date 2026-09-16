import React from "react";
import { XStack, Text, View } from "tamagui";

export interface WordmarkProps {
  /** Render for a light (red header) or dark surface. */
  onDark?: boolean;
  size?: number;
}

/**
 * "FInsight AI" wordmark. The warm AI marker reads as financial
 * intelligence while keeping the brand lockup on one line.
 */
export function Wordmark({ onDark = true, size = 19 }: WordmarkProps) {
  const primary = onDark ? "white" : "$charcoal";
  return (
    <XStack alignItems="center" gap={7}>
      <Text fontSize={size} fontWeight="800" letterSpacing={-0.5} color={primary as any}>
        FInsight
      </Text>
      <View
        borderRadius={8}
        paddingHorizontal={7}
        paddingVertical={2}
        backgroundColor={onDark ? "$gold" : "$orangeSoft"}
        borderWidth={1}
        borderColor={onDark ? "$gold" : "$gold"}
        overflow="hidden"
      >
        <View
          position="absolute"
          right={-5}
          bottom={-6}
          width={18}
          height={18}
          borderRadius={9}
          backgroundColor="$orange"
          opacity={0.6}
        />
        <Text fontSize={size - 5} fontWeight="900" letterSpacing={0.5} color="$charcoal">
          AI
        </Text>
      </View>
    </XStack>
  );
}
