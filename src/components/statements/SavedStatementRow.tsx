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
      minHeight={100}
      padding={15}
      gap={14}
      alignItems="center"
      borderRadius={20}
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$backgroundStrong"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 7 }}
      shadowOpacity={0.05}
      shadowRadius={16}
      onPress={onPress}
      pressStyle={{ opacity: 0.78, scale: 0.992 }}
      accessibilityRole="button"
      accessibilityLabel={`Open ${statement.displayName}, ${statement.transactionCount} transactions`}
    >
      <View
        width={50}
        height={62}
        borderRadius={15}
        backgroundColor="$heroSurface"
        borderWidth={1}
        borderColor="$heroSurfaceRaised"
        alignItems="center"
        justifyContent="center"
      >
        <FileCheck2 size={21} color="$onBrand" strokeWidth={2.1} />
        <XStack gap={3} alignItems="flex-end" marginTop={6} height={12}>
          <View width={3} height={6} borderRadius={2} backgroundColor="$gold" />
          <View width={3} height={10} borderRadius={2} backgroundColor="$orange" />
          <View width={3} height={8} borderRadius={2} backgroundColor="$red" />
        </XStack>
      </View>

      <YStack flex={1} gap={5}>
        <Text numberOfLines={1} fontSize={14} fontWeight="800" color="$navy">
          {statement.displayName}
        </Text>
        <Text numberOfLines={1} fontSize={11.5} color="$ink2">
          {statement.transactionCount.toLocaleString("en-IN")} transactions · {importedLabel(statement.importedAt)}
        </Text>
        <XStack alignItems="center" gap={6}>
          <BarChart3 size={13} color="$orangeDeep" strokeWidth={2.2} />
          <Text fontSize={11.5} fontWeight="700" color="$navy2">
            Money out
          </Text>
          <Money amount={statement.totalSpent} kind="debit" size={12.5} />
        </XStack>
      </YStack>

      <View
        width={48}
        height={48}
        borderRadius={15}
        backgroundColor="$surfaceAlt"
        alignItems="center"
        justifyContent="center"
      >
        <ChevronRight size={18} color="$navy2" strokeWidth={2.2} />
      </View>
    </XStack>
  );
}
