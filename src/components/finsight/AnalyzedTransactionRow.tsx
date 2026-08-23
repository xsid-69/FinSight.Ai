import React from "react";
import { XStack, YStack, Text } from "tamagui";
import * as Haptics from "expo-haptics";
import { IconSquare } from "../IconSquare";
import { Money } from "../banking/Money";
import { ClassificationBadge } from "./ClassificationBadge";
import type { AnalyzedTransaction } from "../../data/intelligence";

export interface AnalyzedTransactionRowProps {
  txn: AnalyzedTransaction;
  showSeparator?: boolean;
  onPress?: () => void;
}

/** merchant icon · name + category/classification · amount. */
export function AnalyzedTransactionRow({ txn, showSeparator = true, onPress }: AnalyzedTransactionRowProps) {
  const iconBg = txn.type === "credit" ? "$success" : "$surfaceAlt";
  const iconColor = txn.type === "credit" ? "white" : "$navy2";

  return (
    <XStack
      alignItems="center"
      gap={13}
      paddingVertical={12}
      borderBottomWidth={showSeparator ? 1 : 0}
      borderBottomColor="$borderColor"
      pressStyle={{ opacity: 0.6 }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <IconSquare icon={txn.categoryIcon} color={iconBg} iconColor={iconColor} size={44} radius={13} iconStrokeWidth={2} />

      <YStack flex={1} gap={4}>
        <Text fontSize={14.5} fontWeight="700" color="$navy" numberOfLines={1}>
          {txn.merchant}
        </Text>
        <XStack alignItems="center" gap={7}>
          <Text fontSize={12} color="$secondary">
            {txn.category} · {txn.date}
          </Text>
          <ClassificationBadge tier={txn.classification} />
        </XStack>
      </YStack>

      <Money
        amount={txn.amount}
        currency={txn.currency}
        size={14.5}
        weight="800"
        kind={txn.type === "credit" ? "credit" : "debit"}
        signed
      />
    </XStack>
  );
}
