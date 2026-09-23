import React, { useState } from "react";
import { Alert, Platform, Pressable, StyleSheet } from "react-native";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Fingerprint,
  LockKeyhole,
  MessageSquareText,
  RadioTower,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { useReducedMotion } from "../../hooks/useReducedMotion";
import { SmsPermissionBanner } from "../../components/SmsPermissionBanner";
import type { PrivateTransaction } from "../../types/transactions";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;

function formatDisplayDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00.000Z`);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

interface TransactionsContentProps {
  navigation?: any;
  transactions?: PrivateTransaction[];
  smsPermissionGranted?: boolean;
  onRequestSmsPermission?: () => void;
  onSimulateSms?: (
    rawBody?: string,
    senderAddress?: string
  ) => Promise<{ success: boolean; reason?: string; transaction?: any }>;
}

function isSmsTransactionRecord(tx: PrivateTransaction) {
  return (
    (tx as any)?.source === "SMS_AUTO_PARSE" ||
    (tx as any)?.source === "sms" ||
    tx.id?.startsWith("ref_") ||
    tx.id?.startsWith("sms_")
  );
}

export function TransactionsContent({
  navigation,
  transactions = [],
  smsPermissionGranted = false,
  onRequestSmsPermission,
  onSimulateSms,
}: TransactionsContentProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Strictly filter to only SMS-captured transactions in the Transactions tab
  const smsTransactions = transactions.filter(isSmsTransactionRecord);

  type SmsFilter = "all" | "debit" | "credit";
  const [smsFilter, setSmsFilter] = useState<SmsFilter>("all");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const debitCount = smsTransactions.filter((tx) => tx.type === "DEBIT").length;
  const creditCount = smsTransactions.filter((tx) => tx.type === "CREDIT").length;

  const filteredTransactions = smsTransactions.filter((tx) => {
    if (smsFilter === "debit") return tx.type === "DEBIT";
    if (smsFilter === "credit") return tx.type === "CREDIT";
    return true;
  });

  const togglePrivacy = () => {
    void Haptics.selectionAsync();
    setPrivacyOpen((current) => !current);
  };

  const motion = reducedMotion
    ? { type: "timing" as const, duration: 1 }
    : { type: "timing" as const, duration: 220 };

  const handleTestValidSbiSms = async () => {
    if (!onSimulateSms) return;
    setSimulating(true);
    try {
      const res = await onSimulateSms(
        "Dear UPI user A/C X1131 debited by 300.00 on date 18Sep26 trf to RIZWAN QURESHI Refno 626127227690 If not u? call-1800111109 for other services-18001234-SBI",
        "VK-SBIINB"
      );
      if (res?.success) {
        Alert.alert(
          "✅ SMS Intercepted & Saved!",
          `Extracted:\n• Amount: ₹300.00 (DEBIT)\n• Merchant: RIZWAN QURESHI\n• Category: TRANSFER\n• Ref: 626127227690\n• Doc: ref_626127227690\n\nCheck the floating Dynamic Island Toast and Overview balance!`,
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Interception Result", res?.reason || "Failed to process SMS.");
      }
    } finally {
      setSimulating(false);
    }
  };

  const handleTestPhishingSms = async () => {
    if (!onSimulateSms) return;
    const res = await onSimulateSms(
      "Dear customer debited by 300.00. Click http://bit.ly/cashback-claim to receive reward -SBI",
      "VK-SBIINB"
    );
    Alert.alert(
      "🛡️ Anti-Fraud Filter Blocked",
      `The parser detected a phishing URL (bit.ly / http).\n\nResult: Transaction dropped. 0 writes to Cloud Firestore.`,
      [{ text: "Understood" }]
    );
  };

  const handleTestMobileSenderSms = async () => {
    if (!onSimulateSms) return;
    const res = await onSimulateSms(
      "A/C X1131 debited by 500 trf to RIZWAN QURESHI Refno 112233445566 -SBI",
      "+919876543210"
    );
    Alert.alert(
      "🛡️ Anti-Fake Filter Blocked",
      `The parser detected sender is a personal 10-digit mobile number (+91XXXXXXXXXX), not a TRAI DLT verified bank code.\n\nResult: Transaction dropped. 0 writes to Cloud Firestore.`,
      [{ text: "Understood" }]
    );
  };

  const handleTestOtpSms = async () => {
    if (!onSimulateSms) return;
    const res = await onSimulateSms(
      "Your OTP for SBI Netbanking transaction of Rs 300.00 is 591024. Valid for 10 mins. -SBI",
      "VK-SBIINB"
    );
    Alert.alert(
      "🛡️ OTP Filter Dropped",
      `The parser detected an OTP alert. Non-financial verification alerts are dropped to prevent false ledger entries.\n\nResult: 0 writes to Cloud Firestore.`,
      [{ text: "Understood" }]
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 17,
        paddingHorizontal: PAGE_H,
        paddingBottom: insets.bottom + DOCK_CLEARANCE,
      }}
    >
      <YStack width="100%" maxWidth={760} alignSelf="center">
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={motion}
        >
          <YStack gap={8} marginBottom={19}>
            <XStack alignItems="center" gap={8}>
              <View
                width={24}
                height={2}
                borderRadius={1}
                backgroundColor={smsPermissionGranted ? "#EB001B" : "$ink2"}
              />
              <Text fontSize={11} fontWeight="800" letterSpacing={1.15} color="$ink2">
                SOURCE STATUS
              </Text>
            </XStack>
            <Text
              accessibilityRole="header"
              fontSize={29}
              lineHeight={35}
              fontWeight="800"
              color="$navy"
              letterSpacing={-0.9}
            >
              Message activity
            </Text>
            <Text maxWidth={570} fontSize={13.5} lineHeight={20} color="$navy2">
              Auto-detects Indian bank and UPI spends in real-time with anti-fake fraud protection.
            </Text>
          </YStack>
        </MotiView>

        {/* Permission Banner if not granted on Android */}
        {Platform.OS === "android" && !smsPermissionGranted && onRequestSmsPermission ? (
          <SmsPermissionBanner onRequestPermission={onRequestSmsPermission} />
        ) : null}

        {/* Live Intercepted Transactions (Mastercard Themed Surface Card) */}
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 30 }}
        >
          <YStack
            marginBottom={18}
            borderRadius={24}
            backgroundColor="$backgroundStrong"
            borderWidth={1}
            borderColor="rgba(235, 0, 27, 0.22)"
            padding={18}
            gap={14}
            overflow="hidden"
            style={styles.cleanCardShadow}
          >
            {/* Background subtle Mastercard red accent glow */}
            <View
              position="absolute"
              width={160}
              height={160}
              borderRadius={80}
              backgroundColor="#EB001B"
              opacity={0.04}
              right={-50}
              top={-50}
            />

            <XStack alignItems="center" justifyContent="space-between">
              <XStack alignItems="center" gap={10}>
                {/* Mastercard Intersecting Circles */}
                <XStack width={34} height={20} alignItems="center">
                  <View
                    width={20}
                    height={20}
                    borderRadius={10}
                    backgroundColor="#EB001B"
                  />
                  <View
                    width={20}
                    height={20}
                    borderRadius={10}
                    backgroundColor="#FF5F00"
                    marginLeft={-8}
                    opacity={0.92}
                  />
                </XStack>
                <YStack gap={1}>
                  <Text fontSize={17} fontWeight="800" color="$navy" letterSpacing={-0.3}>
                    Live Transactions
                  </Text>
                  <Text fontSize={11} color="$navy2">
                    Auto-captured from bank alerts
                  </Text>
                </YStack>
              </XStack>

              <XStack
                paddingHorizontal={10}
                paddingVertical={5}
                borderRadius={12}
                backgroundColor="rgba(235, 0, 27, 0.08)"
                borderWidth={1}
                borderColor="rgba(235, 0, 27, 0.22)"
                alignItems="center"
                gap={6}
              >
                <View width={6} height={6} borderRadius={3} backgroundColor="#EB001B" />
                <Text fontSize={11} fontWeight="800" color="#EB001B">
                  {smsTransactions.length} Records
                </Text>
              </XStack>
            </XStack>

            {/* Interactive Filter Tabs */}
            {smsTransactions.length > 0 ? (
              <XStack
                padding={4}
                borderRadius={14}
                backgroundColor="$surfaceAlt"
                borderWidth={1}
                borderColor="$borderColor"
                gap={6}
              >
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSmsFilter("all");
                  }}
                  style={[
                    styles.tabPill,
                    smsFilter === "all" && styles.tabPillActiveAll,
                  ]}
                >
                  <Text
                    fontSize={11.5}
                    fontWeight="800"
                    color={smsFilter === "all" ? "#EB001B" : "$navy2"}
                  >
                    All ({smsTransactions.length})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSmsFilter("debit");
                  }}
                  style={[
                    styles.tabPill,
                    smsFilter === "debit" && styles.tabPillActiveDebit,
                  ]}
                >
                  <Text
                    fontSize={11.5}
                    fontWeight="800"
                    color={smsFilter === "debit" ? "#FFFFFF" : "$navy2"}
                  >
                    Debits ({debitCount})
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setSmsFilter("credit");
                  }}
                  style={[
                    styles.tabPill,
                    smsFilter === "credit" && styles.tabPillActiveCredit,
                  ]}
                >
                  <Text
                    fontSize={11.5}
                    fontWeight="800"
                    color={smsFilter === "credit" ? "#FFFFFF" : "$navy2"}
                  >
                    Credits ({creditCount})
                  </Text>
                </Pressable>
              </XStack>
            ) : null}

            {filteredTransactions.length > 0 ? (
              <YStack gap={8}>
                {filteredTransactions.slice(0, 20).map((tx, idx) => {
                  const isDebit = tx.type === "DEBIT";
                  const merchantName = tx.sanitizedDescription || (tx as any).merchant || "Bank Transfer";
                  const dateText = formatDisplayDate(tx.date);
                  const isExpanded = expandedTxId === (tx.id || `tx_${idx}`);

                  return (
                    <MotiView
                      key={tx.id || `tx_${idx}`}
                      from={{ opacity: 0, translateY: 6 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: "spring", damping: 15, mass: 0.8, delay: idx * 20 }}
                    >
                      <Pressable
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setExpandedTxId(isExpanded ? null : (tx.id || `tx_${idx}`));
                        }}
                        style={({ pressed }) => [
                          styles.txCardPressable,
                          pressed && styles.txCardPressed,
                        ]}
                      >
                        <XStack
                          alignItems="center"
                          justifyContent="space-between"
                          gap={12}
                        >
                          {/* Transaction Icon */}
                          <View
                            width={38}
                            height={38}
                            borderRadius={12}
                            backgroundColor={isDebit ? "rgba(235, 0, 27, 0.09)" : "rgba(255, 95, 0, 0.09)"}
                            borderWidth={1}
                            borderColor={isDebit ? "rgba(235, 0, 27, 0.22)" : "rgba(255, 95, 0, 0.22)"}
                            alignItems="center"
                            justifyContent="center"
                          >
                            {isDebit ? (
                              <ArrowDownLeft size={18} color="#EB001B" strokeWidth={2.4} />
                            ) : (
                              <ArrowUpRight size={18} color="#FF5F00" strokeWidth={2.4} />
                            )}
                          </View>

                          {/* Merchant / Sender & Metadata */}
                          <YStack flex={1} gap={3}>
                            <Text
                              fontSize={14}
                              fontWeight="800"
                              color="$navy"
                              numberOfLines={1}
                              letterSpacing={-0.2}
                            >
                              {merchantName}
                            </Text>
                            <XStack alignItems="center" gap={6} flexWrap="wrap">
                              <View
                                paddingHorizontal={6}
                                paddingVertical={1.5}
                                borderRadius={5}
                                backgroundColor="rgba(235, 0, 27, 0.08)"
                              >
                                <Text fontSize={9.5} fontWeight="800" color="#EB001B">
                                  {tx.category || "TRANSFER"}
                                </Text>
                              </View>
                              {dateText ? (
                                <Text fontSize={11} color="$navy2">
                                  {dateText}
                                </Text>
                              ) : null}
                            </XStack>
                          </YStack>

                          {/* Amount & Type - Green strictly reserved for credit money */}
                          <YStack alignItems="flex-end" gap={2}>
                            <Text
                              fontSize={15}
                              fontWeight="800"
                              color={isDebit ? "#EB001B" : "#2E7D32"}
                              letterSpacing={-0.3}
                            >
                              {isDebit ? "-" : "+"}₹{Number(tx.amount || 0).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Text>
                            <XStack alignItems="center" gap={3}>
                              <Text fontSize={9.5} fontWeight="700" color="$ink2">
                                {isDebit ? "DEBIT" : "CREDIT"}
                              </Text>
                              {isExpanded ? (
                                <ChevronUp size={11} color="$ink2" />
                              ) : (
                                <ChevronDown size={11} color="$ink2" />
                              )}
                            </XStack>
                          </YStack>
                        </XStack>

                        {/* Smooth Expandable Details Drawer */}
                        {isExpanded ? (
                          <MotiView
                            from={{ opacity: 0, translateY: -4 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", duration: 160 }}
                          >
                            <YStack
                              marginTop={11}
                              paddingTop={11}
                              borderTopWidth={1}
                              borderTopColor="$borderColor"
                              gap={7}
                            >
                              <XStack justifyContent="space-between" alignItems="center">
                                <Text fontSize={11} color="$ink2">Account</Text>
                                <Text fontSize={11.5} fontWeight="700" color="$navy">
                                  {tx.accountMask || "Account"}
                                </Text>
                              </XStack>
                              {tx.referenceNo ? (
                                <XStack justifyContent="space-between" alignItems="center">
                                  <Text fontSize={11} color="$ink2">Ref No / UTR</Text>
                                  <Text fontSize={11.5} fontWeight="800" fontFamily="monospace" color="$navy">
                                    {tx.referenceNo}
                                  </Text>
                                </XStack>
                              ) : null}
                              <XStack justifyContent="space-between" alignItems="center">
                                <Text fontSize={11} color="$ink2">Origin</Text>
                                <XStack alignItems="center" gap={5}>
                                  <View width={6} height={6} borderRadius={3} backgroundColor="#EB001B" />
                                  <Text fontSize={11} fontWeight="800" color="#EB001B">
                                    TRAI DLT Verified
                                  </Text>
                                </XStack>
                              </XStack>
                            </YStack>
                          </MotiView>
                        ) : null}
                      </Pressable>
                    </MotiView>
                  );
                })}
              </YStack>
            ) : (
              <YStack
                padding={22}
                borderRadius={16}
                backgroundColor="$surfaceAlt"
                borderWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                justifyContent="center"
                gap={8}
              >
                <XStack width={40} height={24} alignItems="center" justifyContent="center">
                  <View width={22} height={22} borderRadius={11} backgroundColor="#EB001B" opacity={0.8} />
                  <View width={22} height={22} borderRadius={11} backgroundColor="#FF5F00" opacity={0.8} marginLeft={-10} />
                </XStack>
                <Text fontSize={14.5} fontWeight="800" color="$navy" textAlign="center">
                  {smsTransactions.length > 0
                    ? `No ${smsFilter === "debit" ? "Debit" : "Credit"} Spends Found`
                    : "No Live Transactions Yet"}
                </Text>
                <Text fontSize={12} lineHeight={17} color="$navy2" textAlign="center" maxWidth={360}>
                  {smsTransactions.length > 0
                    ? "Try switching the filter pill above to view your other recorded spends."
                    : "Incoming bank and UPI SMS messages will be parsed in the background and shown here automatically with sender, amount, and category."}
                </Text>
              </YStack>
            )}
          </YStack>
        </MotiView>

        {/* Status Card */}
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 45 }}
        >
          <YStack
            minHeight={250}
            borderRadius={24}
            backgroundColor="$backgroundStrong"
            borderWidth={1}
            borderColor={smsPermissionGranted ? "rgba(235, 0, 27, 0.22)" : "$borderColor"}
            padding={20}
            gap={20}
            overflow="hidden"
            style={styles.cleanCardShadow}
          >
            <View
              position="absolute"
              width={206}
              height={206}
              borderRadius={103}
              backgroundColor="#EB001B"
              opacity={0.03}
              right={-88}
              top={-112}
            />

            <XStack alignItems="flex-start" justifyContent="space-between" gap={14}>
              <View
                width={56}
                height={56}
                borderRadius={28}
                backgroundColor="rgba(235, 0, 27, 0.08)"
                borderWidth={1}
                borderColor="rgba(235, 0, 27, 0.22)"
                alignItems="center"
                justifyContent="center"
              >
                <MessageSquareText
                  size={24}
                  color={smsPermissionGranted ? "#EB001B" : "$navy"}
                  strokeWidth={2.05}
                />
              </View>

              <XStack
                minHeight={44}
                paddingHorizontal={13}
                borderRadius={14}
                backgroundColor="$surfaceAlt"
                borderWidth={1}
                borderColor={smsPermissionGranted ? "rgba(235, 0, 27, 0.25)" : "$borderColor"}
                alignItems="center"
                gap={7}
                accessible
                accessibilityRole="summary"
              >
                <View
                  width={8}
                  height={8}
                  borderRadius={4}
                  backgroundColor={smsPermissionGranted ? "#EB001B" : "$borderStrong"}
                />
                <Text
                  fontSize={11}
                  fontWeight="800"
                  letterSpacing={0.4}
                  color={smsPermissionGranted ? "#EB001B" : "$navy"}
                >
                  {smsPermissionGranted ? "Active & Listening" : "Permission Standby"}
                </Text>
              </XStack>
            </XStack>

            <YStack gap={7}>
              <Text
                accessibilityRole="header"
                fontSize={21}
                lineHeight={27}
                fontWeight="800"
                color="$navy"
                letterSpacing={-0.5}
              >
                {smsPermissionGranted
                  ? "Auto-Spend Tracking Active"
                  : "Smart Bank SMS Ingestion"}
              </Text>
              <Text maxWidth={560} fontSize={13} lineHeight={19} color="$navy2">
                {smsPermissionGranted
                  ? "FinSight is actively monitoring incoming bank SMS in the background. Transactions are parsed, validated, and logged immediately."
                  : "Allow SMS permission to auto-detect bank UPI spends in the background with zero manual typing."}
              </Text>
            </YStack>

            <XStack
              minHeight={60}
              paddingHorizontal={14}
              borderRadius={16}
              backgroundColor="$surfaceAlt"
              borderWidth={1}
              borderColor="$borderColor"
              alignItems="center"
              gap={12}
            >
              <View
                width={38}
                height={38}
                borderRadius={19}
                backgroundColor="rgba(235, 0, 27, 0.08)"
                alignItems="center"
                justifyContent="center"
              >
                <RadioTower
                  size={18}
                  color="#EB001B"
                  strokeWidth={2.1}
                />
              </View>
              <YStack flex={1} gap={2}>
                <Text fontSize={12.5} fontWeight="800" color="$navy">
                  {smsPermissionGranted
                    ? "DLT Bank Header Filter & Anti-Fraud Enabled"
                    : "No carrier listener active yet"}
                </Text>
                <Text fontSize={11.5} lineHeight={16} color="$navy2">
                  {smsPermissionGranted
                    ? "Phishing links and personal numbers are automatically rejected."
                    : "Grant SMS permissions or use the test console below."}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </MotiView>

        {/* Live Test & Verification Console (Clean Light Theme with Mastercard Red CTA) */}
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 60 }}
        >
          <YStack
            marginTop={16}
            borderRadius={24}
            backgroundColor="$backgroundStrong"
            borderWidth={1}
            borderColor="rgba(235, 0, 27, 0.22)"
            padding={18}
            gap={14}
            style={styles.cleanCardShadow}
          >
            <XStack alignItems="center" gap={8}>
              <Zap size={18} color="#FF5F00" strokeWidth={2.4} />
              <Text fontSize={15} fontWeight="800" color="$navy">
                Live Verification & Test Console
              </Text>
            </XStack>
            <Text fontSize={12.5} lineHeight={18} color="$navy2">
              Verify the anti-fake parser, real-time Firestore ingestion, and floating Dynamic Island toast directly inside Expo without sending real carrier SMS.
            </Text>

            {/* Target Test Button */}
            <Pressable
              onPress={handleTestValidSbiSms}
              disabled={simulating}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                simulating && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                ⚡ Simulate Target Bank SMS (SBI - ₹300.00)
              </Text>
            </Pressable>

            {/* Anti-Fraud Negative Tests */}
            <YStack gap={8} marginTop={4}>
              <Text fontSize={11} fontWeight="800" letterSpacing={0.5} color="$ink2">
                TEST ANTI-FRAUD FILTERS
              </Text>

              <XStack gap={8}>
                <Pressable
                  onPress={handleTestPhishingSms}
                  style={({ pressed }) => [
                    styles.filterButton,
                    pressed && styles.filterButtonPressed,
                    { flex: 1 },
                  ]}
                >
                  <Text style={styles.filterButtonText}>🚫 Phishing</Text>
                </Pressable>

                <Pressable
                  onPress={handleTestMobileSenderSms}
                  style={({ pressed }) => [
                    styles.filterButton,
                    pressed && styles.filterButtonPressed,
                    { flex: 1 },
                  ]}
                >
                  <Text style={styles.filterButtonText}>🚫 Mobile No</Text>
                </Pressable>

                <Pressable
                  onPress={handleTestOtpSms}
                  style={({ pressed }) => [
                    styles.filterButton,
                    pressed && styles.filterButtonPressed,
                    { flex: 1 },
                  ]}
                >
                  <Text style={styles.filterButtonText}>🚫 OTP Alert</Text>
                </Pressable>
              </XStack>
            </YStack>
          </YStack>
        </MotiView>

        {/* Privacy Accordion */}
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 90 }}
        >
          <YStack
            marginTop={16}
            borderRadius={21}
            backgroundColor="$backgroundStrong"
            borderWidth={1}
            borderColor="$borderColor"
            overflow="hidden"
            style={styles.cleanCardShadow}
          >
            <XStack
              minHeight={64}
              paddingHorizontal={16}
              alignItems="center"
              gap={12}
              onPress={togglePrivacy}
              pressStyle={{ opacity: 0.72 }}
              accessibilityRole="button"
              accessibilityLabel="How message privacy works"
              accessibilityState={{ expanded: privacyOpen }}
            >
              <View
                width={40}
                height={40}
                borderRadius={13}
                backgroundColor="$orangeSoft"
                alignItems="center"
                justifyContent="center"
              >
                <Fingerprint size={19} color="$orangeDeep" strokeWidth={2.1} />
              </View>
              <YStack flex={1} gap={2}>
                <Text fontSize={13.5} fontWeight="800" color="$navy">
                  How message privacy works
                </Text>
                <Text fontSize={11.5} color="$ink2">
                  Review the boundary before any connection
                </Text>
              </YStack>
              {privacyOpen ? (
                <ChevronUp size={18} color="$navy2" strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} color="$navy2" strokeWidth={2.2} />
              )}
            </XStack>

            {privacyOpen ? (
              <MotiView
                from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : -5 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: reducedMotion ? 1 : 160 }}
              >
                <YStack paddingHorizontal={16} paddingBottom={16} gap={10}>
                  <Text fontSize={12.5} lineHeight={18} color="$navy2">
                    FinSight processes SMS messages entirely on-device. Personal phone numbers and phishing links are automatically dropped. Only sanitized amounts and merchant labels from recognized bank codes reach Cloud Firestore.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open profile security settings"
                    onPress={() => {
                      void Haptics.selectionAsync();
                      navigation?.navigate?.("Profile", { section: "security" });
                    }}
                    style={{
                      marginTop: 4,
                      paddingVertical: 6,
                      alignSelf: "flex-start",
                    }}
                  >
                    <Text fontSize={12} fontWeight="800" color="#EB001B">
                      Open profile security settings
                    </Text>
                  </Pressable>
                </YStack>
              </MotiView>
            ) : null}
          </YStack>
        </MotiView>
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cleanCardShadow: {
    shadowColor: "#171717",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  tabPillActiveAll: {
    backgroundColor: "rgba(235, 0, 27, 0.12)",
  },
  tabPillActiveDebit: {
    backgroundColor: "#EB001B",
  },
  tabPillActiveCredit: {
    backgroundColor: "#FF5F00",
  },
  txCardPressable: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F2F1EE",
    borderWidth: 1,
    borderColor: "#E3E1DC",
  },
  txCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButton: {
    backgroundColor: "#EB001B",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  filterButton: {
    backgroundColor: "#F2F1EE",
    borderWidth: 1,
    borderColor: "#E3E1DC",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  filterButtonText: {
    color: "#4F4C48",
    fontWeight: "700",
    fontSize: 10.5,
  },
});

