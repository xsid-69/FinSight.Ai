import React from "react";
import { XStack, View } from "tamagui";

import { brandColors } from "../../theme/mastercard";

export interface MastercardMarkProps {
  size?: number;
}

/** Abstract warm overlap mark used as decorative FinSight artwork. */
export function MastercardMark({ size = 26 }: MastercardMarkProps) {
  const overlap = size * 0.36;

  return (
    <XStack
      width={size * 2 - overlap}
      height={size}
      alignItems="center"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
    >
      <View
        width={size}
        height={size}
        borderRadius={size / 2}
        backgroundColor={brandColors.redIdentity}
      />
      <View
        width={size}
        height={size}
        borderRadius={size / 2}
        backgroundColor={brandColors.orange}
        marginLeft={-overlap}
        opacity={0.94}
      />
      <View
        position="absolute"
        left={size - overlap * 0.58}
        width={Math.max(3, overlap * 0.24)}
        height={size * 0.66}
        borderRadius={999}
        backgroundColor={brandColors.gold}
        opacity={0.82}
      />
    </XStack>
  );
}
