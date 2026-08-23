import React, { useState } from "react";
import { XStack, YStack, Text, View } from "tamagui";
import { UploadCloud } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

const PERIODS = ["6 months", "12 months", "Custom"];

export interface StatementUploadCardProps {
  onUpload?: (period: string) => void;
}

/** Premium import experience: hero + dashed drop zone + period selector. */
export function StatementUploadCard({ onUpload }: StatementUploadCardProps) {
  const [period, setPeriod] = useState(PERIODS[1]);

  return (
    <YStack gap={18}>
      <YStack gap={6}>
        <Text fontSize={22} fontWeight="800" color="$navy" letterSpacing={-0.5}>
          Understand your last year
        </Text>
        <Text fontSize={14} color="$ink2" lineHeight={20}>
          Import a bank statement and uncover spending patterns, recurring expenses, and future trends.
        </Text>
      </YStack>

      {/* drop zone */}
      <View
        borderRadius="$lg"
        borderWidth={1.5}
        borderColor="rgba(225,29,58,0.35)"
        borderStyle="dashed"
        backgroundColor="rgba(225,29,58,0.03)"
        paddingVertical={34}
        alignItems="center"
        gap={12}
        pressStyle={{ scale: 0.99, opacity: 0.9 }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onUpload?.(period);
        }}
      >
        <View width={56} height={56} borderRadius={28} backgroundColor="rgba(225,29,58,0.10)" alignItems="center" justifyContent="center">
          <UploadCloud size={26} color="$red" strokeWidth={2} />
        </View>
        <YStack alignItems="center" gap={2}>
          <Text fontSize={15} fontWeight="800" color="$navy">
            Upload CSV statement
          </Text>
          <Text fontSize={12.5} color="$secondary">
            Drop a file or tap to browse
          </Text>
        </YStack>
      </View>

      {/* period selector */}
      <XStack gap={10}>
        {PERIODS.map((p) => {
          const on = p === period;
          return (
            <View
              key={p}
              flex={1}
              alignItems="center"
              paddingVertical={12}
              borderRadius={14}
              backgroundColor={on ? "$navy" : "$backgroundStrong"}
              borderWidth={1}
              borderColor={on ? "$navy" : "$borderColor"}
              pressStyle={{ scale: 0.97 }}
              onPress={() => {
                Haptics.selectionAsync();
                setPeriod(p);
              }}
            >
              <Text fontSize={13} fontWeight={on ? "800" : "600"} color={on ? "white" : "$navy2"}>
                {p}
              </Text>
            </View>
          );
        })}
      </XStack>
    </YStack>
  );
}
