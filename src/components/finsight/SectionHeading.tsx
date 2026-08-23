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
    <XStack alignItems="center" justifyContent="space-between">
      <YStack>
        <Text fontSize={20} fontWeight="800" color="$navy" letterSpacing={-0.4}>
          {title}
        </Text>
        {caption ? (
          <Text fontSize={12.5} color="$secondary" marginTop={2}>
            {caption}
          </Text>
        ) : null}
      </YStack>
      {action ? (
        <Text fontSize={13} fontWeight="700" color="$red" pressStyle={{ opacity: 0.6 }} onPress={onAction}>
          {action}
        </Text>
      ) : null}
    </XStack>
  );
}
