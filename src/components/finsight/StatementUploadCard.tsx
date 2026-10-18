import React from "react";
import { ActivityIndicator } from "react-native";
import { XStack, YStack, Text, View } from "tamagui";
import { AlertCircle, FileUp, KeyRound, ShieldCheck } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

export interface StatementUploadCardProps {
  onUpload?: () => void;
  onOpenPasswordModal?: () => void;
  hasPassword?: boolean;
  busy?: boolean;
  errorMessage?: string | null;
}

export function StatementUploadCard({
  onUpload,
  onOpenPasswordModal,
  hasPassword = false,
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
        <Text
          accessibilityRole="header"
          fontSize={24}
          lineHeight={30}
          fontWeight="800"
          color="$navy"
          letterSpacing={-0.6}
        >
          Import your bank statement
        </Text>
        <Text fontSize={14} color="$ink2" lineHeight={20}>
          Choose a CSV, Excel sheet (.xlsx, .xls), or PDF statement exported by your bank. FinSight finds the transaction table, removes account metadata, and analyzes clean records on this device.
        </Text>
      </YStack>

      {onOpenPasswordModal ? (
        <XStack
          alignItems="center"
          gap={9}
          paddingVertical={9}
          paddingHorizontal={13}
          borderRadius={13}
          backgroundColor={hasPassword ? "rgba(46, 125, 50, 0.08)" : "$surfaceAlt"}
          borderWidth={1}
          borderColor={hasPassword ? "#2E7D32" : "$borderColor"}
          onPress={() => {
            void Haptics.selectionAsync();
            onOpenPasswordModal();
          }}
          pressStyle={{ opacity: 0.75 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel={hasPassword ? "Statement password configured" : "Configure statement password"}
        >
          <KeyRound size={16} color={hasPassword ? "#2E7D32" : "#EB001B"} strokeWidth={2.4} />
          <Text fontSize={12} fontWeight="800" color={hasPassword ? "#2E7D32" : "$navy"} flexShrink={1}>
            {hasPassword ? "Statement password set (tap to update)" : "Statement password protected? Enter password"}
          </Text>
        </XStack>
      ) : null}

      <XStack
        minHeight={58}
        alignItems="flex-start"
        gap={10}
        borderWidth={1}
        borderColor="$gold"
        backgroundColor="$orangeSoft"
        borderRadius={15}
        padding={12}
        accessible
        accessibilityRole="summary"
      >
        <View
          width={34}
          height={34}
          borderRadius={11}
          backgroundColor="$backgroundStrong"
          alignItems="center"
          justifyContent="center"
        >
          <ShieldCheck size={18} color="$orangeDeep" strokeWidth={2.2} />
        </View>
        <Text flex={1} fontSize={12} color="$navy2" lineHeight={17} fontWeight="700">
          Privacy-safe import: account, phone, email/UPI, IFSC, tax, and transfer identifiers are scrubbed locally
        </Text>
      </XStack>

      {errorMessage ? (
        <XStack
          gap={10}
          alignItems="flex-start"
          borderWidth={1}
          borderColor="$danger"
          backgroundColor="$dangerSoft"
          borderRadius={15}
          padding={13}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <AlertCircle size={19} color="$danger" strokeWidth={2.2} />
          <YStack flex={1} gap={3}>
            <Text accessibilityRole="header" fontSize={13.5} fontWeight="800" color="$navy">
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
        minHeight={200}
        borderRadius="$lg"
        borderWidth={1}
        borderColor="$heroSurfaceRaised"
        backgroundColor="$heroSurface"
        paddingHorizontal={18}
        paddingVertical={24}
        alignItems="center"
        justifyContent="center"
        gap={12}
        overflow="hidden"
        pressStyle={busy ? undefined : { scale: 0.99, opacity: 0.94 }}
        onPress={busy ? undefined : handleUpload}
        pointerEvents={busy ? "none" : "auto"}
        accessibilityRole="button"
        accessibilityLabel={busy ? "Importing bank statement" : errorMessage ? "Retry CSV statement import" : "Choose CSV bank statement"}
        accessibilityHint="Select one CSV file exported by your bank"
        accessibilityState={{ busy, disabled: busy }}
      >
        <View
          position="absolute"
          width={154}
          height={154}
          borderRadius={77}
          backgroundColor="$red"
          opacity={0.14}
          right={-58}
          top={-82}
        />
        <View
          position="absolute"
          width={86}
          height={86}
          borderRadius={43}
          backgroundColor="$orange"
          opacity={0.11}
          left={-34}
          bottom={-48}
        />
        <View
          width={60}
          height={60}
          borderRadius={30}
          backgroundColor="$redDeep"
          borderWidth={1}
          borderColor="$red"
          alignItems="center"
          justifyContent="center"
        >
          {busy ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <FileUp size={26} color="$onBrand" strokeWidth={2.1} />
          )}
        </View>
        <YStack alignItems="center" gap={6} width="100%" maxWidth={320} paddingHorizontal={8}>
          <Text fontSize={16} fontWeight="800" color="$onBrand" textAlign="center">
            {busy ? "Sanitizing and analyzing…" : errorMessage ? "Choose file and try again" : "Choose bank statement"}
          </Text>
          <Text fontSize={12} color="$onBrand" opacity={0.75} lineHeight={17} textAlign="center">
            {busy
              ? "Raw rows stay local while privacy-safe transaction fields are prepared"
              : "CSV, Excel (.xlsx, .xls), or PDF · one file up to 10 MB"}
          </Text>

          {!busy ? (
            <XStack gap={6} marginTop={6} flexWrap="wrap" justifyContent="center">
              <View paddingHorizontal={7} paddingVertical={3} borderRadius={6} backgroundColor="rgba(255,255,255,0.18)">
                <Text fontSize={10} fontWeight="800" color="$onBrand" letterSpacing={0.5}>CSV</Text>
              </View>
              <View paddingHorizontal={7} paddingVertical={3} borderRadius={6} backgroundColor="rgba(255,255,255,0.18)">
                <Text fontSize={10} fontWeight="800" color="$onBrand" letterSpacing={0.5}>EXCEL (.XLSX / .XLS)</Text>
              </View>
              <View paddingHorizontal={7} paddingVertical={3} borderRadius={6} backgroundColor="rgba(255,255,255,0.18)">
                <Text fontSize={10} fontWeight="800" color="$onBrand" letterSpacing={0.5}>PDF</Text>
              </View>
            </XStack>
          ) : null}
        </YStack>
      </View>

      <Text fontSize={12.5} color="$secondary" lineHeight={18} paddingHorizontal={2}>
        The original CSV is never sent to Firestore (neither are Excel or PDF files). Sanitized dates, amounts, debit or credit type, descriptions, categories, and an optional reviewed merchant key are the only saved fields.
      </Text>

    </YStack>
  );
}
