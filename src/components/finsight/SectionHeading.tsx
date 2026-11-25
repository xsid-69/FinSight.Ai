import React from "react";
import { XStack, YStack, Text } from "tamagui";

export interface SectionHeadingProps {
  title: string;
  caption?: string;
  action?: string;
  onAction?: () => void;
}

/** Consistent section title + optional caption / trailing action. */
export function SectionHeading({ title, caption, action, onAction }: SectionHeadingProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between" gap={12}>
      <YStack flex={1}>
        <Text fontSize={20} fontWeight="800" color="$navy" letterSpacing={-0.4}>
          {title}
        </Text>
        {caption ? (
          <Text fontSize={12.5} color="$secondary" marginTop={4}>
            {caption}
          </Text>
        ) : null}
      </YStack>
      {action ? (
        <Text
          fontSize={13}
          fontWeight="700"
          color="$red"
          paddingVertical={4}
          paddingHorizontal={8}
          borderRadius={8}
          hitSlop={8}
          accessibilityRole="button"
          pressStyle={{ opacity: 0.6, scale: 0.98 }}
          onPress={onAction}
        >
          {action}
        </Text>
      ) : null}
    </XStack>
  );
}
