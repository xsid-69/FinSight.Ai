import React from "react";
import { useWindowDimensions } from "react-native";
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
export function Wordmark({ onDark = true, size }: WordmarkProps) {
  const { width } = useWindowDimensions();
  const scale = width < 360 ? 0.85 : 1;
  const baseSize = size ?? 19;
  const effectiveSize = Math.round(baseSize * scale);
  const primary = onDark ? "white" : "$charcoal";

  return (
    <XStack alignItems="center" gap={Math.round(7 * scale)} flexShrink={0}>
      <Text fontSize={effectiveSize} fontWeight="800" letterSpacing={-0.5} color={primary as any}>
        FInsight
      </Text>
      <View
        borderRadius={Math.round(8 * scale)}
        paddingHorizontal={Math.round(7 * scale)}
        paddingVertical={Math.round(2 * scale)}
        backgroundColor={onDark ? "$gold" : "$orangeSoft"}
        borderWidth={1}
        borderColor={onDark ? "$gold" : "$gold"}
        overflow="hidden"
      >
        <View
          position="absolute"
          right={-5}
          bottom={-6}
          width={Math.round(18 * scale)}
          height={Math.round(18 * scale)}
          borderRadius={Math.round(9 * scale)}
          backgroundColor="$orange"
          opacity={0.6}
        />
        <Text fontSize={Math.max(10, effectiveSize - 5)} fontWeight="900" letterSpacing={0.5} color="$charcoal">
          AI
        </Text>
      </View>
    </XStack>
  );
}
