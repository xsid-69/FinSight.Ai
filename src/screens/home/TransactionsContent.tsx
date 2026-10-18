import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
} from "react-native";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Fingerprint,
  LockKeyhole,
  MessageSquareText,
  Plus,
  RadioTower,
  Search,
  ShieldCheck,
  Trash2,
  X,
  Zap,
} from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { useReducedMotion } from "../../hooks/useReducedMotion";
import { SmsPermissionBanner } from "../../components/SmsPermissionBanner";
import { NotificationAccessCard } from "../../components/NotificationAccessCard";
import MerchantAvatar from "../../components/MerchantAvatar";
import { isTestSmsTransaction } from "../../services/smsStorageService";
import type { PrivateTransaction } from "../../types/transactions";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;
const CATEGORIES = [
  "TRANSFER",
  "FOOD",
  "SHOPPING",
  "UTILITIES",
  "TRANSPORTATION",
  "HEALTHCARE",
  "ENTERTAINMENT",
  "INCOME",
  "CASH",
  "OTHER",
];

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

interface MerchantStyle {
  bg: string;
  color: string;
  border: string;
  initials: string;
}

function getMerchantIdentity(merchantName: string = ""): MerchantStyle {
  const norm = merchantName.trim().toUpperCase();
  if (norm.includes("ZOMATO")) {
    return { bg: "rgba(226, 55, 68, 0.12)", color: "#E23744", border: "rgba(226, 55, 68, 0.28)", initials: "ZO" };
  }
  if (norm.includes("SWIGGY")) {
    return { bg: "rgba(252, 128, 25, 0.12)", color: "#FC8019", border: "rgba(252, 128, 25, 0.28)", initials: "SW" };
  }
  if (norm.includes("UBER")) {
    return { bg: "rgba(15, 23, 42, 0.12)", color: "#0F172A", border: "rgba(15, 23, 42, 0.25)", initials: "UB" };
  }
  if (norm.includes("OLA")) {
    return { bg: "rgba(0, 168, 89, 0.12)", color: "#00A859", border: "rgba(0, 168, 89, 0.28)", initials: "OL" };
  }
  if (norm.includes("AMAZON")) {
    return { bg: "rgba(245, 158, 11, 0.12)", color: "#D97706", border: "rgba(245, 158, 11, 0.28)", initials: "AZ" };
  }
  if (norm.includes("FLIPKART")) {
    return { bg: "rgba(37, 99, 235, 0.12)", color: "#2563EB", border: "rgba(37, 99, 235, 0.28)", initials: "FK" };
  }
  if (norm.includes("NETFLIX")) {
    return { bg: "rgba(229, 9, 20, 0.12)", color: "#E50914", border: "rgba(229, 9, 20, 0.28)", initials: "NF" };
  }
  if (norm.includes("STARBUCKS")) {
    return { bg: "rgba(0, 112, 74, 0.12)", color: "#00704A", border: "rgba(0, 112, 74, 0.28)", initials: "SB" };
  }
  if (norm.includes("BLINKIT")) {
    return { bg: "rgba(245, 158, 11, 0.14)", color: "#B45309", border: "rgba(245, 158, 11, 0.28)", initials: "BK" };
  }
  if (norm.includes("ZEPTO")) {
    return { bg: "rgba(124, 58, 237, 0.12)", color: "#7C3AED", border: "rgba(124, 58, 237, 0.28)", initials: "ZP" };
  }
  if (norm.includes("ICICI")) {
    return { bg: "rgba(190, 24, 24, 0.12)", color: "#B91C1C", border: "rgba(190, 24, 24, 0.28)", initials: "IC" };
  }
  if (norm.includes("HDFC")) {
    return { bg: "rgba(2, 65, 137, 0.12)", color: "#004B8D", border: "rgba(2, 65, 137, 0.28)", initials: "HD" };
  }
  if (norm.includes("SBI")) {
    return { bg: "rgba(14, 116, 144, 0.12)", color: "#0E7490", border: "rgba(14, 116, 144, 0.28)", initials: "SB" };
  }
  if (norm.includes("SUPER.MONEY") || norm.includes("SUPER MONEY") || norm.includes("SUPERMONEY")) {
    return { bg: "rgba(235, 0, 27, 0.12)", color: "#EB001B", border: "rgba(235, 0, 27, 0.32)", initials: "SM" };
  }
  if (norm.includes("PHONEPE")) {
    return { bg: "rgba(95, 37, 159, 0.12)", color: "#5F259F", border: "rgba(95, 37, 159, 0.28)", initials: "PE" };
  }
  if (norm.includes("PAYTM")) {
    return { bg: "rgba(0, 185, 245, 0.12)", color: "#00B9F5", border: "rgba(0, 185, 245, 0.28)", initials: "PT" };
  }
  if (norm.includes("CRED")) {
    return { bg: "rgba(15, 23, 42, 0.12)", color: "#1E293B", border: "rgba(15, 23, 42, 0.28)", initials: "CR" };
  }
  if (norm.includes("GOOGLE PAY") || norm.includes("GPAY")) {
    return { bg: "rgba(66, 133, 244, 0.12)", color: "#4285F4", border: "rgba(66, 133, 244, 0.28)", initials: "GP" };
  }
  if (norm.includes("AMAZON PAY")) {
    return { bg: "rgba(255, 153, 0, 0.12)", color: "#FF9900", border: "rgba(255, 153, 0, 0.28)", initials: "AP" };
  }
  if (norm.includes("BHIM")) {
    return { bg: "rgba(0, 175, 102, 0.12)", color: "#00AF66", border: "rgba(0, 175, 102, 0.28)", initials: "BH" };
  }
  if (norm.includes("AXIS")) {
    return { bg: "rgba(159, 18, 57, 0.12)", color: "#9F1239", border: "rgba(159, 18, 57, 0.28)", initials: "AX" };
  }

  const clean = norm.replace(/[^A-Z0-9]/g, "");
  const initials = clean.length >= 2 ? clean.slice(0, 2) : (clean || "TX");
  return {
    bg: "rgba(235, 0, 27, 0.08)",
    color: "#EB001B",
    border: "rgba(235, 0, 27, 0.20)",
    initials,
  };
}

interface TransactionsContentProps {
  navigation?: any;
  transactions?: PrivateTransaction[];
  smsPermissionGranted?: boolean;
  onRequestSmsPermission?: () => void;
  onAddTransaction?: (txData: any) => Promise<any>;
  onDeleteTransaction?: (txId: string) => Promise<any>;
  onClearTransactions?: () => Promise<any>;
  onNewTransaction?: (tx: PrivateTransaction) => void;
}

function isSmsTransactionRecord(tx: PrivateTransaction) {
  if (!tx) return false;
  if (isTestSmsTransaction(tx)) return false;
  return (
    (tx as any)?.isManual === true ||
    (tx as any)?.source === "SMS_AUTO_PARSE" ||
    (tx as any)?.source === "APP_NOTIFICATION" ||
    (tx as any)?.source === "sms" ||
    tx.id?.startsWith("ref_") ||
    tx.id?.startsWith("sms_") ||
    tx.id?.startsWith("tx_")
  );
}

export function TransactionsContent({
  navigation,
  transactions = [],
  smsPermissionGranted = false,
  onRequestSmsPermission,
  onAddTransaction,
  onDeleteTransaction,
  onClearTransactions,
  onNewTransaction,
}: TransactionsContentProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Manual Add Transaction Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [manualType, setManualType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [manualAmount, setManualAmount] = useState("");
  const [manualMerchant, setManualMerchant] = useState("");
  const [manualCategory, setManualCategory] = useState("TRANSFER");
  const [manualAccount, setManualAccount] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const handleSaveManualTransaction = async () => {
    const rawVal = manualAmount.replace(/[^0-9.]/g, "");
    const amt = parseFloat(rawVal);
    if (!amt || isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount greater than ₹0.");
      return;
    }
    const cleanMerchant = manualMerchant.trim();
    if (!cleanMerchant) {
      Alert.alert("Merchant Required", "Please enter a merchant or transaction title.");
      return;
    }
    setIsSubmittingManual(true);
    try {
      if (onAddTransaction) {
        await onAddTransaction({
          amount: amt,
          merchant: cleanMerchant,
          type: manualType,
          category: manualCategory,
          accountMask: manualAccount.trim() || "Manual Entry",
          date: new Date().toISOString().split("T")[0],
        });
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddModalVisible(false);
      setManualAmount("");
      setManualMerchant("");
      setManualCategory("TRANSFER");
      setManualType("DEBIT");
      setManualAccount("");
    } catch {
      Alert.alert("Error", "Could not save transaction. Please try again.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Search & Category Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);

  // Strictly filter to only SMS-captured transactions in the Transactions tab
  const smsTransactions = transactions.filter(isSmsTransactionRecord);

  type SmsFilter = "all" | "debit" | "credit";
  const [smsFilter, setSmsFilter] = useState<SmsFilter>("all");
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const debitCount = smsTransactions.filter((tx) => tx.type === "DEBIT").length;
  const creditCount = smsTransactions.filter((tx) => tx.type === "CREDIT").length;

  const totalDebits = useMemo(
    () =>
      smsTransactions
        .filter((tx) => tx.type === "DEBIT")
        .reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0),
    [smsTransactions],
  );
  const totalCredits = useMemo(
    () =>
      smsTransactions
        .filter((tx) => tx.type === "CREDIT")
        .reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0),
    [smsTransactions],
  );

  const filteredTransactions = useMemo(() => {
    return smsTransactions.filter((tx) => {
      if (smsFilter === "debit" && tx.type !== "DEBIT") return false;
      if (smsFilter === "credit" && tx.type !== "CREDIT") return false;
      if (
        selectedCategory !== "ALL" &&
        (tx.category || "TRANSFER").toUpperCase() !== selectedCategory
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const merchant = (
          tx.sanitizedDescription ||
          (tx as any).merchant ||
          ""
        ).toLowerCase();
        const cat = (tx.category || "").toLowerCase();
        const ref = (tx.referenceNo || "").toLowerCase();
        const amountStr = String(tx.amount || "");
        if (
          !merchant.includes(q) &&
          !cat.includes(q) &&
          !ref.includes(q) &&
          !amountStr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [smsTransactions, smsFilter, selectedCategory, searchQuery]);

  const handleCopyOrShareRef = async (refNo: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopiedRefId(refNo);
    setTimeout(() => setCopiedRefId(null), 2500);
    try {
      await Share.share({
        message: refNo,
        title: "Transaction Reference (UTR)",
      });
    } catch {
      // Handled
    }
  };

  const togglePrivacy = () => {
    void Haptics.selectionAsync();
    setPrivacyOpen((current) => !current);
  };

  const confirmDeleteTransaction = (txId: string, merchantLabel: string) => {
    Alert.alert(
      "Remove Transaction",
      `Are you sure you want to remove "${merchantLabel}" from your records?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (onDeleteTransaction) {
              await onDeleteTransaction(txId);
            }
          },
        },
      ]
    );
  };

  const confirmClearAll = () => {
    Alert.alert(
      "Clear All Live Transactions",
      "Are you sure you want to remove all recorded message transactions? Only newly listened SMS transactions will appear.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (onClearTransactions) {
              await onClearTransactions();
            }
          },
        },
      ]
    );
  };

  const motion = reducedMotion
    ? { type: "timing" as const, duration: 1 }
    : { type: "timing" as const, duration: 220 };

  const totalVolume = totalDebits + totalCredits;
  const debitRatio = totalVolume > 0 ? (totalDebits / totalVolume) * 100 : 50;

  return (
    <>
      <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 16,
        paddingHorizontal: PAGE_H,
        paddingBottom: insets.bottom + DOCK_CLEARANCE,
      }}
    >
      <YStack width="100%" maxWidth={760} alignSelf="center">
        {/* Editorial Real-Time Header */}
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={motion}
        >
          <YStack gap={10} marginBottom={18}>
            {/* Live Telemetry & Device Isolation Status Badges */}
            <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={8}>
              <XStack
                alignItems="center"
                gap={6}
                backgroundColor="rgba(235, 0, 27, 0.08)"
                paddingHorizontal={10}
                paddingVertical={5}
                borderRadius={20}
                borderWidth={1}
                borderColor="rgba(235, 0, 27, 0.22)"
              >
                <View
                  width={7}
                  height={7}
                  borderRadius={3.5}
                  backgroundColor={smsPermissionGranted ? "#10B981" : "#EB001B"}
                />
                <Text fontSize={10.5} fontWeight="800" letterSpacing={0.8} color="#EB001B">
                  {smsPermissionGranted ? "LIVE RADAR ACTIVE" : "RADAR STANDBY"}
                </Text>
              </XStack>

              <XStack
                alignItems="center"
                gap={5}
                backgroundColor="$surfaceAlt"
                paddingHorizontal={9}
                paddingVertical={5}
                borderRadius={20}
                borderWidth={1}
                borderColor="$borderColor"
              >
                <LockKeyhole size={11} color="$ink2" strokeWidth={2.4} />
                <Text fontSize={10} fontWeight="700" letterSpacing={0.4} color="$ink2">
                  AIR-GAPPED ENGINE
                </Text>
              </XStack>
            </XStack>

            <Text
              accessibilityRole="header"
              fontSize={28}
              lineHeight={34}
              fontWeight="800"
              color="$navy"
              letterSpacing={-0.8}
            >
              Live Transactions
            </Text>
            <Text maxWidth={600} fontSize={13} lineHeight={19} color="$navy2">
              Continuous on-device ledger parsing verified UPI payment notifications (Super.money, Paytm, PhonePe, GPay) and bank SMS.
            </Text>
          </YStack>
        </MotiView>

        {/* Permission Banner if not granted on Android */}
        {Platform.OS === "android" && !smsPermissionGranted && onRequestSmsPermission ? (
          <SmsPermissionBanner onRequestPermission={onRequestSmsPermission} />
        ) : null}

        {/* Notification UPI Access Banner */}
        {Platform.OS === "android" ? (
          <NotificationAccessCard onScanComplete={onNewTransaction} />
        ) : null}

        {/* Executive Telemetry Dashboard Card */}
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 25 }}
        >
          <YStack
            marginBottom={18}
            borderRadius={22}
            backgroundColor="$backgroundStrong"
            borderWidth={1}
            borderColor="rgba(235, 0, 27, 0.22)"
            padding={18}
            gap={15}
            overflow="hidden"
            style={styles.cleanCardShadow}
          >
            {/* Background subtle Mastercard brand radial wash */}
            <View
              position="absolute"
              width={180}
              height={180}
              borderRadius={90}
              backgroundColor="#EB001B"
              opacity={0.035}
              right={-55}
              top={-55}
            />

            {/* Header: Mastercard Circles + Feed Title + Clear & Count Badges */}
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
                  <Text fontSize={16} fontWeight="800" color="$navy" letterSpacing={-0.3}>
                    Settlement Stream
                  </Text>
                  <Text fontSize={10.5} color="$navy2">
                    Verified bank & UPI telemetry
                  </Text>
                </YStack>
              </XStack>

              <XStack alignItems="center" gap={7}>
                <Pressable
                  testID="add-manual-tx-btn"
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setAddModalVisible(true);
                  }}
                  style={({ pressed }) => [
                    styles.addTxButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add transaction manually"
                >
                  <Plus size={13} color="#FFFFFF" strokeWidth={2.6} />
                  <Text fontSize={11} fontWeight="800" color="#FFFFFF">
                    Add
                  </Text>
                </Pressable>

                <XStack
                  paddingHorizontal={9}
                  paddingVertical={4}
                  borderRadius={12}
                  backgroundColor="rgba(235, 0, 27, 0.08)"
                  borderWidth={1}
                  borderColor="rgba(235, 0, 27, 0.22)"
                  alignItems="center"
                  gap={5}
                >
                  <View width={6} height={6} borderRadius={3} backgroundColor="#EB001B" />
                  <Text fontSize={11} fontWeight="800" color="#EB001B">
                    {smsTransactions.length}
                  </Text>
                </XStack>
              </XStack>
            </XStack>

            {/* Financial Telemetry Matrix */}
            {smsTransactions.length > 0 ? (
              <YStack gap={10}>
                {/* Dual Telemetry Stat Panels */}
                <XStack gap={10}>
                  {/* Total Outflow (Debits) */}
                  <YStack
                    flex={1}
                    padding={13}
                    borderRadius={16}
                    backgroundColor="rgba(235, 0, 27, 0.04)"
                    borderWidth={1}
                    borderColor="rgba(235, 0, 27, 0.16)"
                    gap={5}
                  >
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap={5}>
                        <View
                          width={18}
                          height={18}
                          borderRadius={9}
                          backgroundColor="rgba(235, 0, 27, 0.12)"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <ArrowDownLeft size={11} color="#EB001B" strokeWidth={2.6} />
                        </View>
                        <Text fontSize={10} fontWeight="800" letterSpacing={0.6} color="#EB001B">
                          OUTFLOW
                        </Text>
                      </XStack>
                      <Text fontSize={9.5} fontWeight="700" color="$ink2">
                        {debitCount} alert{debitCount === 1 ? "" : "s"}
                      </Text>
                    </XStack>

                    <Text
                      fontSize={17}
                      fontWeight="800"
                      color="#EB001B"
                      letterSpacing={-0.4}
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      ₹{totalDebits.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </YStack>

                  {/* Total Inflow (Credits) */}
                  <YStack
                    flex={1}
                    padding={13}
                    borderRadius={16}
                    backgroundColor="rgba(16, 185, 129, 0.05)"
                    borderWidth={1}
                    borderColor="rgba(16, 185, 129, 0.18)"
                    gap={5}
                  >
                    <XStack alignItems="center" justifyContent="space-between">
                      <XStack alignItems="center" gap={5}>
                        <View
                          width={18}
                          height={18}
                          borderRadius={9}
                          backgroundColor="rgba(16, 185, 129, 0.14)"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <ArrowUpRight size={11} color="#10B981" strokeWidth={2.6} />
                        </View>
                        <Text fontSize={10} fontWeight="800" letterSpacing={0.6} color="#10B981">
                          INFLOW
                        </Text>
                      </XStack>
                      <Text fontSize={9.5} fontWeight="700" color="$ink2">
                        {creditCount} alert{creditCount === 1 ? "" : "s"}
                      </Text>
                    </XStack>

                    <Text
                      fontSize={17}
                      fontWeight="800"
                      color="#10B981"
                      letterSpacing={-0.4}
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      ₹{totalCredits.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                  </YStack>
                </XStack>

                {/* Micro Flow Balance Meter */}
                {totalVolume > 0 ? (
                  <YStack gap={4}>
                    <View
                      width="100%"
                      height={4}
                      borderRadius={2}
                      backgroundColor="rgba(16, 185, 129, 0.25)"
                      overflow="hidden"
                    >
                      <View
                        width={`${Math.min(Math.max(debitRatio, 5), 95)}%`}
                        height="100%"
                        backgroundColor="#EB001B"
                        borderRadius={2}
                      />
                    </View>
                    <XStack justifyContent="space-between">
                      <Text fontSize={9.5} color="$ink2">
                        {Math.round(debitRatio)}% debits
                      </Text>
                      <Text fontSize={9.5} color="$ink2">
                        {Math.round(100 - debitRatio)}% credits
                      </Text>
                    </XStack>
                  </YStack>
                ) : null}
              </YStack>
            ) : null}

            {/* Interactive Search Bar */}
            {smsTransactions.length > 0 ? (
              <XStack
                alignItems="center"
                backgroundColor="$surfaceAlt"
                borderRadius={13}
                borderWidth={1}
                borderColor="$borderColor"
                paddingHorizontal={12}
                height={40}
                gap={8}
              >
                <Search size={14} color="#8C8881" strokeWidth={2.2} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search merchant, UTR, category, or amount..."
                  placeholderTextColor="#8C8881"
                  style={styles.searchTextInput}
                  accessibilityLabel="Search transactions"
                />
                {searchQuery ? (
                  <Pressable
                    onPress={() => setSearchQuery("")}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search text"
                  >
                    <X size={14} color="#8C8881" strokeWidth={2.2} />
                  </Pressable>
                ) : null}
              </XStack>
            ) : null}

            {/* Category Filter Chips Strip */}
            {smsTransactions.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
              >
                {["ALL", ...CATEGORIES].map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedCategory(cat);
                      }}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${cat}`}
                    >
                      <Text
                        fontSize={10.5}
                        fontWeight="700"
                        color={isSelected ? "#FFFFFF" : "$navy2"}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Type Segmented Pill Tabs */}
            {smsTransactions.length > 0 ? (
              <XStack
                padding={3}
                borderRadius={12}
                backgroundColor="$surfaceAlt"
                borderWidth={1}
                borderColor="$borderColor"
                gap={4}
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
                    fontSize={11}
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
                    fontSize={11}
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
                    fontSize={11}
                    fontWeight="800"
                    color={smsFilter === "credit" ? "#FFFFFF" : "$navy2"}
                  >
                    Credits ({creditCount})
                  </Text>
                </Pressable>
              </XStack>
            ) : null}

            {/* Filter Count Indicator */}
            {searchQuery || selectedCategory !== "ALL" ? (
              <XStack alignItems="center" justifyContent="space-between" paddingHorizontal={2}>
                <Text fontSize={11} color="$ink2">
                  Showing {filteredTransactions.length} of {smsTransactions.length}
                </Text>
                <Pressable
                  onPress={() => {
                    setSearchQuery("");
                    setSelectedCategory("ALL");
                  }}
                >
                  <Text fontSize={11} fontWeight="700" color="#EB001B">
                    Reset filters
                  </Text>
                </Pressable>
              </XStack>
            ) : null}

            {/* Transaction Item Feed */}
            {filteredTransactions.length > 0 ? (
              <YStack gap={8}>
                {filteredTransactions.slice(0, 30).map((tx, idx) => {
                  const isDebit = tx.type === "DEBIT";
                  const merchantName = tx.sanitizedDescription || (tx as any).merchant || "Bank Transfer";
                  const dateText = formatDisplayDate(tx.date);
                  const isExpanded = expandedTxId === (tx.id || `tx_${idx}`);
                  const brand = getMerchantIdentity(merchantName);
                  const sourceLabel = (tx as any).sourceApp
                    ? `UPI · ${(tx as any).sourceApp}`
                    : (tx as any).source === "APP_NOTIFICATION"
                      ? "UPI Alert"
                      : (tx as any).isManual
                        ? "Manual"
                        : "SMS Alert";

                  return (
                    <MotiView
                      key={tx.id || `tx_${idx}`}
                      from={{ opacity: 0, translateY: 6 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: "spring", damping: 16, mass: 0.8, delay: idx * 12 }}
                    >
                      <Pressable
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setExpandedTxId(isExpanded ? null : (tx.id || `tx_${idx}`));
                        }}
                        style={({ pressed }) => [
                          styles.txCardPressable,
                          isExpanded && styles.txCardExpanded,
                          pressed && styles.txCardPressed,
                        ]}
                      >
                        <XStack
                          alignItems="center"
                          justifyContent="space-between"
                          gap={12}
                        >
                          {/* Branded Official Logo / Category Avatar */}
                          <MerchantAvatar
                            merchantName={merchantName}
                            merchantKey={tx.merchantKey}
                            category={tx.category}
                            size={42}
                          />

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
                              <View
                                paddingHorizontal={6}
                                paddingVertical={1.5}
                                borderRadius={5}
                                backgroundColor="rgba(23, 23, 23, 0.06)"
                                borderWidth={1}
                                borderColor="rgba(23, 23, 23, 0.10)"
                              >
                                <Text fontSize={9} fontWeight="700" color="$charcoal">
                                  {sourceLabel}
                                </Text>
                              </View>
                              {dateText ? (
                                <Text fontSize={11} color="$navy2">
                                  {dateText}
                                </Text>
                              ) : null}
                            </XStack>
                          </YStack>

                          {/* Amount & Type with Tabular Numerals */}
                          <YStack alignItems="flex-end" gap={2}>
                            <Text
                              fontSize={15}
                              fontWeight="800"
                              color={isDebit ? "#EB001B" : "#10B981"}
                              letterSpacing={-0.3}
                              style={{ fontVariant: ["tabular-nums"] }}
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

                        {/* Smooth Expandable Audit Drawer */}
                        {isExpanded ? (
                          <MotiView
                            from={{ opacity: 0, translateY: -4 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", duration: 150 }}
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
                                  <Pressable
                                    onPress={() => handleCopyOrShareRef(tx.referenceNo!)}
                                    style={styles.copyRefBtn}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Reference number ${tx.referenceNo}`}
                                  >
                                    <Text fontSize={11} fontWeight="800" fontFamily="monospace" color="$navy">
                                      {tx.referenceNo}
                                    </Text>
                                    {copiedRefId === tx.referenceNo ? (
                                      <XStack alignItems="center" gap={3}>
                                        <Check size={11} color="#10B981" strokeWidth={2.5} />
                                        <Text fontSize={9.5} fontWeight="800" color="#10B981">Copied</Text>
                                      </XStack>
                                    ) : (
                                      <Copy size={11} color="#EB001B" strokeWidth={2.2} />
                                    )}
                                  </Pressable>
                                </XStack>
                              ) : null}

                              <XStack justifyContent="space-between" alignItems="center">
                                <Text fontSize={11} color="$ink2">Channel</Text>
                                <XStack alignItems="center" gap={5}>
                                  <View width={6} height={6} borderRadius={3} backgroundColor="#EB001B" />
                                  <Text fontSize={11} fontWeight="800" color="#EB001B">
                                    TRAI DLT Verified Bank SMS
                                  </Text>
                                </XStack>
                              </XStack>

                              <XStack justifyContent="flex-end" alignItems="center" marginTop={6}>
                                <Pressable
                                  testID={`delete-tx-${tx.id || idx}`}
                                  onPress={() => confirmDeleteTransaction(tx.id || `tx_${idx}`, merchantName)}
                                  style={styles.deleteTxButton}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Remove ${merchantName} transaction`}
                                >
                                  <Trash2 size={12} color="#EB001B" strokeWidth={2.4} />
                                  <Text fontSize={11} fontWeight="700" color="#EB001B">
                                    Remove record
                                  </Text>
                                </Pressable>
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
                padding={24}
                borderRadius={16}
                backgroundColor="$surfaceAlt"
                borderWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                justifyContent="center"
                gap={9}
              >
                <XStack width={44} height={26} alignItems="center" justifyContent="center">
                  <View width={24} height={24} borderRadius={12} backgroundColor="#EB001B" opacity={0.8} />
                  <View width={24} height={24} borderRadius={12} backgroundColor="#FF5F00" opacity={0.8} marginLeft={-11} />
                </XStack>

                <Text fontSize={14.5} fontWeight="800" color="$navy" textAlign="center">
                  {searchQuery || selectedCategory !== "ALL"
                    ? "No Matching Spends Found"
                    : smsTransactions.length > 0
                    ? `No ${smsFilter === "debit" ? "Debit" : "Credit"} Spends Found`
                    : "Awaiting Live Bank SMS"}
                </Text>

                <Text fontSize={12} lineHeight={17} color="$navy2" textAlign="center" maxWidth={360}>
                  {searchQuery || selectedCategory !== "ALL"
                    ? "No records matched your search filters. Try changing or resetting your search."
                    : smsTransactions.length > 0
                    ? "Try switching the filter pill above to view your other recorded spends."
                    : "Real-time engine is listening for bank debits & credits in the background. Zero manual entry needed."}
                </Text>

                {searchQuery || selectedCategory !== "ALL" ? (
                  <Pressable
                    onPress={() => {
                      setSearchQuery("");
                      setSelectedCategory("ALL");
                    }}
                    style={[styles.filterChip, { marginTop: 6, backgroundColor: "#EB001B", borderColor: "#EB001B" }]}
                  >
                    <Text fontSize={11} fontWeight="800" color="#FFFFFF">
                      Clear Search & Filters
                    </Text>
                  </Pressable>
                ) : null}
              </YStack>
            )}
          </YStack>
        </MotiView>

        {/* Security & Listening Engine Status Card */}
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 45 }}
        >
          <YStack
            minHeight={250}
            borderRadius={22}
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
                width={52}
                height={52}
                borderRadius={26}
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
                minHeight={40}
                paddingHorizontal={12}
                borderRadius={13}
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
                  backgroundColor={smsPermissionGranted ? "#10B981" : "$borderStrong"}
                />
                <Text
                  fontSize={11}
                  fontWeight="800"
                  letterSpacing={0.4}
                  color={smsPermissionGranted ? "#10B981" : "$navy"}
                >
                  {smsPermissionGranted ? "Active & Listening" : "Permission Standby"}
                </Text>
              </XStack>
            </XStack>

            <YStack gap={6}>
              <Text
                accessibilityRole="header"
                fontSize={20}
                lineHeight={26}
                fontWeight="800"
                color="$navy"
                letterSpacing={-0.4}
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
              minHeight={58}
              paddingHorizontal={14}
              borderRadius={15}
              backgroundColor="$surfaceAlt"
              borderWidth={1}
              borderColor="$borderColor"
              alignItems="center"
              gap={12}
            >
              <View
                width={36}
                height={36}
                borderRadius={18}
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
                <Text fontSize={12} fontWeight="800" color="$navy">
                  {smsPermissionGranted
                    ? "DLT Bank Header Filter & Anti-Fraud Enabled"
                    : "No carrier listener active yet"}
                </Text>
                <Text fontSize={11} lineHeight={16} color="$navy2">
                  {smsPermissionGranted
                    ? "Phishing links and personal numbers are automatically rejected."
                    : "Grant SMS permission to automatically log your bank UPI spends."}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </MotiView>

        {/* On-Device Privacy Accordion */}
        <MotiView
          from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={reducedMotion ? motion : { ...motion, delay: 60 }}
        >
          <YStack
            marginTop={16}
            borderRadius={20}
            backgroundColor="$backgroundStrong"
            borderWidth={1}
            borderColor="$borderColor"
            overflow="hidden"
            style={styles.cleanCardShadow}
          >
            <XStack
              minHeight={62}
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
                width={38}
                height={38}
                borderRadius={12}
                backgroundColor="$orangeSoft"
                alignItems="center"
                justifyContent="center"
              >
                <Fingerprint size={19} color="$orangeDeep" strokeWidth={2.1} />
              </View>
              <YStack flex={1} gap={2}>
                <Text fontSize={13} fontWeight="800" color="$navy">
                  How message privacy works
                </Text>
                <Text fontSize={11} color="$ink2">
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

    {/* Manual Add Transaction Modal Sheet */}
    <Modal
      visible={addModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setAddModalVisible(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalBackdrop}
      >
        <Pressable
          style={styles.modalDismissArea}
          onPress={() => setAddModalVisible(false)}
        />
        <View style={styles.modalSheetContainer}>
          <View style={styles.dragHandle} />

          {/* Header */}
          <XStack alignItems="center" justifyContent="space-between" marginBottom={14}>
            <YStack gap={2}>
              <Text fontSize={17} fontWeight="800" color="$navy" letterSpacing={-0.3}>
                Add Transaction
              </Text>
              <Text fontSize={11.5} color="$navy2">
                Manually log missed payments or cash
              </Text>
            </YStack>
            <Pressable
              testID="manual-tx-cancel-btn"
              onPress={() => setAddModalVisible(false)}
              style={({ pressed }) => [styles.modalCloseBtn, pressed && styles.buttonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Close add transaction modal"
            >
              <X size={16} color="$ink2" />
            </Pressable>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <YStack gap={14} paddingBottom={10}>
              {/* Type Segmented Toggle */}
              <XStack
                padding={3}
                borderRadius={12}
                backgroundColor="$surfaceAlt"
                borderWidth={1}
                borderColor="$borderColor"
                gap={4}
              >
                <Pressable
                  testID="manual-tx-debit-toggle"
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setManualType("DEBIT");
                  }}
                  style={[
                    styles.modalTypePill,
                    manualType === "DEBIT" && styles.modalTypePillActiveDebit,
                  ]}
                >
                  <ArrowDownLeft
                    size={13}
                    color={manualType === "DEBIT" ? "#FFFFFF" : "$navy2"}
                    strokeWidth={2.4}
                  />
                  <Text
                    fontSize={12}
                    fontWeight="800"
                    color={manualType === "DEBIT" ? "#FFFFFF" : "$navy2"}
                  >
                    Debit (Spent)
                  </Text>
                </Pressable>

                <Pressable
                  testID="manual-tx-credit-toggle"
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setManualType("CREDIT");
                  }}
                  style={[
                    styles.modalTypePill,
                    manualType === "CREDIT" && styles.modalTypePillActiveCredit,
                  ]}
                >
                  <ArrowUpRight
                    size={13}
                    color={manualType === "CREDIT" ? "#FFFFFF" : "$navy2"}
                    strokeWidth={2.4}
                  />
                  <Text
                    fontSize={12}
                    fontWeight="800"
                    color={manualType === "CREDIT" ? "#FFFFFF" : "$navy2"}
                  >
                    Credit (Received)
                  </Text>
                </Pressable>
              </XStack>

              {/* Amount Input */}
              <YStack gap={5}>
                <Text fontSize={11} fontWeight="800" letterSpacing={0.5} color="$ink2">
                  AMOUNT (INR)
                </Text>
                <XStack
                  style={styles.modalInputWrapper}
                  alignItems="center"
                  gap={8}
                >
                  <Text fontSize={18} fontWeight="800" color="#EB001B">
                    ₹
                  </Text>
                  <TextInput
                    testID="manual-tx-amount-input"
                    value={manualAmount}
                    onChangeText={setManualAmount}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    style={[styles.modalInput, { fontSize: 18, fontWeight: "800" }]}
                  />
                </XStack>
              </YStack>

              {/* Merchant / Title Input */}
              <YStack gap={5}>
                <Text fontSize={11} fontWeight="800" letterSpacing={0.5} color="$ink2">
                  MERCHANT / TITLE
                </Text>
                <XStack style={styles.modalInputWrapper} alignItems="center" gap={8}>
                  <TextInput
                    testID="manual-tx-merchant-input"
                    value={manualMerchant}
                    onChangeText={setManualMerchant}
                    placeholder="e.g. Swiggy, Zomato, Rent, Chai Point"
                    placeholderTextColor="#9CA3AF"
                    style={styles.modalInput}
                  />
                </XStack>
              </YStack>

              {/* Category Picker Chips */}
              <YStack gap={5}>
                <Text fontSize={11} fontWeight="800" letterSpacing={0.5} color="$ink2">
                  CATEGORY
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
                >
                  {CATEGORIES.map((cat) => {
                    const isSelected = manualCategory === cat;
                    return (
                      <Pressable
                        key={`manual_cat_${cat}`}
                        onPress={() => {
                          void Haptics.selectionAsync();
                          setManualCategory(cat);
                        }}
                        style={[
                          styles.filterChip,
                          isSelected && styles.filterChipActive,
                        ]}
                      >
                        <Text
                          fontSize={10.5}
                          fontWeight="700"
                          color={isSelected ? "#FFFFFF" : "$navy2"}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </YStack>

              {/* Account / Note Input */}
              <YStack gap={5}>
                <Text fontSize={11} fontWeight="800" letterSpacing={0.5} color="$ink2">
                  ACCOUNT / NOTE (OPTIONAL)
                </Text>
                <XStack style={styles.modalInputWrapper} alignItems="center" gap={8}>
                  <TextInput
                    value={manualAccount}
                    onChangeText={setManualAccount}
                    placeholder="e.g. HDFC Bank, Cash, Personal"
                    placeholderTextColor="#9CA3AF"
                    style={styles.modalInput}
                  />
                </XStack>
              </YStack>

              {/* Submit / Cancel Buttons */}
              <XStack gap={10} marginTop={8}>
                <Pressable
                  onPress={() => setAddModalVisible(false)}
                  style={[styles.cancelButton, { flex: 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                >
                  <Text fontSize={13} fontWeight="800" color="$navy2">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  testID="manual-tx-submit-btn"
                  onPress={handleSaveManualTransaction}
                  disabled={isSubmittingManual}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { flex: 2 },
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Save transaction"
                >
                  <Text fontSize={13} fontWeight="800" color="#FFFFFF">
                    {isSubmittingManual ? "Saving..." : "Save Transaction"}
                  </Text>
                </Pressable>
              </XStack>
            </YStack>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    </>
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 9,
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
    backgroundColor: "#10B981",
  },
  txCardPressable: {
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: "#F8F8F6",
    borderWidth: 1,
    borderColor: "#E3E1DC",
  },
  txCardExpanded: {
    borderColor: "rgba(235, 0, 27, 0.35)",
    backgroundColor: "#FFFFFF",
  },
  txCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  clearTxButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(235, 0, 27, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(235, 0, 27, 0.22)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 9,
  },
  deleteTxButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: "rgba(235, 0, 27, 0.08)",
  },
  searchTextInput: {
    flex: 1,
    fontSize: 12.5,
    color: "#171717",
    padding: 0,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F2F1EE",
    borderWidth: 1,
    borderColor: "#E3E1DC",
  },
  filterChipActive: {
    backgroundColor: "#EB001B",
    borderColor: "#EB001B",
  },
  copyRefBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(235, 0, 27, 0.06)",
  },
  addTxButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EB001B",
    paddingVertical: 4.5,
    paddingHorizontal: 9.5,
    borderRadius: 9,
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3,
    elevation: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalDismissArea: {
    flex: 1,
  },
  modalSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "#E3E1DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTypePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  modalTypePillActiveDebit: {
    backgroundColor: "#EB001B",
  },
  modalTypePillActiveCredit: {
    backgroundColor: "#10B981",
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  saveButton: {
    backgroundColor: "#EB001B",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EB001B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
