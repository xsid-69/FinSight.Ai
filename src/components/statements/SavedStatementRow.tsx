import React from "react";
import { Text, View, XStack, YStack } from "tamagui";
import { BarChart3, ChevronRight, FileCheck2 } from "@tamagui/lucide-icons";

import { Money } from "../banking/Money";
import type { SavedStatement } from "../../types/transactions";

interface SavedStatementRowProps {
  statement: SavedStatement;
  onPress: () => void;
}

const IMPORTED_AT_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function importedLabel(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Saved to your account" : `Saved ${IMPORTED_AT_FORMATTER.format(parsed)}`;
}

export function SavedStatementRow({ statement, onPress }: SavedStatementRowProps) {
  return (
    <XStack
      minHeight={92}
      padding={14}
      gap={13}
      alignItems="center"
      borderRadius={18}
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$backgroundStrong"
      onPress={onPress}
      pressStyle={{ opacity: 0.78, scale: 0.992 }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${statement.displayName}, ${statement.transactionCount} transactions`}
    >
      <View
        width={48}
        height={58}
        borderRadius={14}
        backgroundColor="rgba(235,0,27,0.075)"
        alignItems="center"
        justifyContent="center"
      >
        <FileCheck2 size={21} color="$red" strokeWidth={2.1} />
        <XStack gap={2} alignItems="flex-end" marginTop={5} height={12}>
          <View width={3} height={6} borderRadius={2} backgroundColor="$navy2" opacity={0.45} />
          <View width={3} height={10} borderRadius={2} backgroundColor="$navy2" opacity={0.65} />
          <View width={3} height={8} borderRadius={2} backgroundColor="$red" />
        </XStack>
      </View>

      <YStack flex={1} gap={4}>
        <Text numberOfLines={1} fontSize={14} fontWeight="800" color="$navy">
          {statement.displayName}
        </Text>
        <Text numberOfLines={1} fontSize={11.5} color="$ink2">
          {statement.transactionCount.toLocaleString("en-IN")} transactions · {importedLabel(statement.importedAt)}
        </Text>
        <XStack alignItems="center" gap={6}>
          <BarChart3 size={13} color="$ai" strokeWidth={2.2} />
          <Text fontSize={11.5} fontWeight="700" color="$navy2">
            Money out
          </Text>
          <Money amount={statement.totalSpent} kind="debit" size={12.5} />
        </XStack>
      </YStack>

      <ChevronRight size={18} color="$muted" strokeWidth={2.2} />
    </XStack>
  );
}
