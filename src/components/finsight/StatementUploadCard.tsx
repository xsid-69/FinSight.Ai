import React from "react";
import { ActivityIndicator } from "react-native";
import { XStack, YStack, Text, View } from "tamagui";
import { AlertCircle, FileUp } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

const OBSIDIAN = "#050706";
const EMERALD = "#34E0A1";

export interface StatementUploadCardProps {
  onUpload?: () => void;
  busy?: boolean;
  errorMessage?: string | null;
}

export function StatementUploadCard({
  onUpload,
  busy = false,
  errorMessage,
}: StatementUploadCardProps) {
  const handleUpload = () => {
    if (busy) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpload?.();
  };

  return (
    <YStack gap={18}>
      <YStack gap={7}>
        <Text fontSize={22} fontWeight="800" color="$navy" letterSpacing={-0.5}>
          Import your bank statement
        </Text>
        <Text fontSize={14} color="$ink2" lineHeight={20}>
          Choose a CSV exported by your bank. FinSight finds the transaction table, removes account metadata, and analyzes clean records on this device.
        </Text>
      </YStack>

      <XStack
        alignItems="flex-start"
        borderWidth={1}
        borderColor="rgba(99,166,74,0.24)"
        backgroundColor="rgba(99,166,74,0.08)"
        borderRadius={14}
        paddingHorizontal={12}
        paddingVertical={9}
        accessible
        accessibilityRole="summary"
      >
        <Text flex={1} fontSize={12} color="$navy2" lineHeight={17} fontWeight="700">
          🛡️ Privacy-safe import: account, phone, email/UPI, IFSC, tax, and transfer identifiers are scrubbed locally
        </Text>
      </XStack>

      {errorMessage ? (
        <XStack
          gap={10}
          alignItems="flex-start"
          borderWidth={1}
          borderColor="rgba(214,69,69,0.28)"
          backgroundColor="rgba(214,69,69,0.07)"
          borderRadius={14}
          padding={13}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <AlertCircle size={19} color="$danger" strokeWidth={2.2} />
          <YStack flex={1} gap={3}>
            <Text fontSize={13.5} fontWeight="800" color="$navy">
              Import didn’t finish
            </Text>
            <Text fontSize={13} color="$ink2" lineHeight={18}>
              {errorMessage}
            </Text>
          </YStack>
        </XStack>
      ) : null}

      <View
        testID="statement-csv-upload"
        minHeight={178}
        borderRadius="$lg"
        backgroundColor={OBSIDIAN}
        paddingHorizontal={22}
        paddingVertical={26}
        alignItems="center"
        justifyContent="center"
        gap={13}
        pressStyle={busy ? undefined : { scale: 0.99, opacity: 0.94 }}
        onPress={busy ? undefined : handleUpload}
        pointerEvents={busy ? "none" : "auto"}
        accessibilityRole="button"
        accessibilityLabel={busy ? "Importing bank statement" : errorMessage ? "Retry CSV statement import" : "Choose CSV bank statement"}
        accessibilityHint="Select one CSV file exported by your bank"
        accessibilityState={{ busy, disabled: busy }}
      >
        <View
          width={58}
          height={58}
          borderRadius={29}
          backgroundColor="rgba(52,224,161,0.12)"
          alignItems="center"
          justifyContent="center"
        >
          {busy ? (
            <ActivityIndicator color={EMERALD} size="small" />
          ) : (
            <FileUp size={27} color={EMERALD} strokeWidth={2.1} />
          )}
        </View>
        <YStack alignItems="center" gap={4} maxWidth={286}>
          <Text fontSize={15.5} fontWeight="800" color="white" textAlign="center">
            {busy ? "Sanitizing and analyzing…" : errorMessage ? "Choose CSV and try again" : "Choose CSV statement"}
          </Text>
          <Text fontSize={12.5} color="rgba(255,255,255,0.72)" lineHeight={18} textAlign="center">
            {busy
              ? "Raw rows stay local; only five privacy-safe transaction fields are saved"
              : "Common bank CSV exports · one file up to 10 MB"}
          </Text>
        </YStack>
      </View>

      <Text fontSize={12.5} color="$secondary" lineHeight={18} paddingHorizontal={2}>
        The original CSV is never sent to Firestore. Dates, amounts, debit or credit type, sanitized descriptions, and categories are the only saved fields.
      </Text>
    </YStack>
  );
}
