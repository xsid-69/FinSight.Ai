import React, { useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput } from "react-native";
import { ScrollView, YStack, XStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { usePreventRemove } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  KeyRound,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  X,
} from "@tamagui/lucide-icons";

import { FinSightShell, StatementUploadCard, Card } from "../components/finsight";
import { Money } from "../components/banking/Money";
import {
  CategoryHistogram,
  MonthlyCashFlowChart,
} from "../components/charts/StatementCharts";
import { useAuth } from "../context/AuthContext";
import {
  importCsvStatement,
  retryImportedStatementCloudSave,
} from "../services/csvService";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { triggerSuccessHaptic } from "../utils/haptics";
import { brandColors } from "../theme/mastercard";
import type { InsightsView } from "./home/InsightsContent";
import type { FinancialInsights } from "../types/transactions";

const PAGE_H = 20;

const BANK_PASSWORD_HINTS = [
  { bank: "SBI", hint: "11-digit CIF number OR DOB (DDMM) + last 5 digits of mobile" },
  { bank: "HDFC", hint: "Customer ID (all digits) OR PAN in uppercase" },
  { bank: "ICICI", hint: "First 4 letters of name (lowercase) + DOB (DDMM)" },
  { bank: "Axis", hint: "First 4 letters of name in caps + last 4 digits of account no." },
  { bank: "Kotak", hint: "CRN (Customer Relationship Number)" },
  { bank: "PNB", hint: "Account number OR Customer ID" },
  { bank: "Other", hint: "Format is usually DOB (DDMMYYYY), PAN, or Account / CIF number" },
];

type Phase = "ready" | "importing" | "done";
type CloudSyncStatus = "synced" | "partial" | "unconfirmed" | "unavailable" | "denied" | "failed";

interface CloudSyncSummary {
  status: CloudSyncStatus;
  requestedCount: number;
  savedCount: number;
  pendingCount: number;
  message: string;
  retryable?: boolean;
  statementPending?: boolean;
  statementCommitted?: boolean;
}

interface ImportSummary {
  fileName?: string;
  statementId?: string;
  statementDisplayName?: string;
  importedCount: number;
  savedCount: number;
  debitCount: number;
  creditCount: number;
  skippedCount: number;
  metadataRowsDiscarded?: number;
  insights?: FinancialInsights;
  cloudSync?: CloudSyncSummary;
  pendingCloudSave?: unknown | null;
}

function cloudStatusTitle(status: CloudSyncStatus) {
  if (status === "denied") return "Private cloud access needs attention";
  if (status === "unavailable") return "Waiting for cloud connection";
  if (status === "unconfirmed") return "Save confirmation is pending";
  if (status === "partial") return "Private save is partly complete";
  return "Private cloud save needs attention";
}

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "The statement could not be imported. Check the file and your connection, then try again.";
}

class SafeChartErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("Chart render failure caught gracefully:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <Card variant="flat" padding={16}>
          <Text fontSize={12} color="$ink2">
            Chart visualization could not be loaded. Your statement was parsed and saved successfully.
          </Text>
        </Card>
      );
    }
    return this.props.children;
  }
}

export function StatementAnalyzerScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const importActive = useRef(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [cloudRetrying, setCloudRetrying] = useState(false);

  // Statement password modal state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [statementPassword, setStatementPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedBankHint, setSelectedBankHint] = useState<string | null>("SBI");

  const openHomeTab = (
    insightsView: InsightsView,
    statementId?: string | null,
  ) => {
    const mainParams = {
      screen: "Home",
      params: {
        tab: "Insights",
        insightsView,
        statementId: statementId ?? null,
      },
    };
    if (typeof navigation?.popTo === "function") {
      navigation.popTo("Main", mainParams);
      return;
    }
    navigation?.reset?.({
      index: 0,
      routes: [{ name: "Main", params: mainParams }],
    });
  };

  const lastPickedFileRef = useRef<any>(null);

  const runImport = async (overridePassword?: string) => {
    if (importActive.current) return;
    if (!user?.uid) {
      setImportError("Sign in before importing a bank statement.");
      setPhase("ready");
      return;
    }

    const passwordToUse = overridePassword !== undefined ? overridePassword : statementPassword.trim();

    importActive.current = true;
    setCloudRetrying(false);
    setImportError(null);
    setSummary(null);
    setPhase("importing");

    try {
      const options: any = {};
      if (passwordToUse) {
        options.password = passwordToUse;
      }
      if (lastPickedFileRef.current) {
        options.picked = lastPickedFileRef.current;
      }

      const hasOptions = Boolean(passwordToUse || lastPickedFileRef.current);
      const result = hasOptions
        ? await importCsvStatement(user.uid, options)
        : await importCsvStatement(user.uid);
      if (result.canceled) {
        setPhase("ready");
        return;
      }
      lastPickedFileRef.current = null;
      setSummary(result as ImportSummary);
      setPhase("done");
      setPasswordModalVisible(false);
      setPasswordError(null);
      void triggerSuccessHaptic();
    } catch (error: any) {
      if (error?.picked) {
        lastPickedFileRef.current = error.picked;
      }
      const msg = errorMessage(error);
      const isPasswordIssue =
        error?.code === "PASSWORD_REQUIRED" ||
        error?.code === "INCORRECT_PASSWORD" ||
        /password/i.test(msg);

      if (isPasswordIssue) {
        if (error?.code === "PASSWORD_REQUIRED") {
          setPasswordError(null);
          setImportError(null);
        } else {
          setPasswordError(msg);
          setImportError(null);
        }
        setPasswordModalVisible(true);
      } else {
        setImportError(msg);
      }
      setPhase("ready");
    } finally {
      importActive.current = false;
    }
  };

  const clearAnalysis = () => {
    setCloudRetrying(false);
    setSummary(null);
    setImportError(null);
    setPhase("ready");
  };

  const confirmDiscardPending = (onDiscard: () => void) => {
    if (!summary?.pendingCloudSave) {
      onDiscard();
      return;
    }
    Alert.alert(
      "Private save is still pending",
      "Leaving now removes the in-memory retry copy. The original CSV is not stored, so keep this analysis open until cloud save succeeds unless you are ready to analyze the file again.",
      [
        { text: "Keep analysis", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: onDiscard },
      ],
    );
  };

  const showImportInProgressAlert = () => {
    Alert.alert(
      "Statement analysis in progress",
      "Keep this screen open until analysis and private save preparation finish. FinSight cannot safely hand off an in-flight import yet.",
      [{ text: "Keep analyzing", style: "cancel" }],
    );
  };

  usePreventRemove(
    phase === "importing" || Boolean(summary?.pendingCloudSave),
    ({ data }) => {
      if (phase === "importing") {
        showImportInProgressAlert();
        return;
      }
      confirmDiscardPending(() => navigation?.dispatch?.(data.action));
    },
  );

  const importAnother = () => confirmDiscardPending(clearAnalysis);
  const handleBack = () => {
    if (phase === "importing") {
      showImportInProgressAlert();
      return;
    }
    navigation?.goBack?.();
  };

  const retryCloudSave = async () => {
    if (!user?.uid || !summary?.pendingCloudSave || cloudRetrying) return;

    setCloudRetrying(true);
    try {
      const result = await retryImportedStatementCloudSave(
        user.uid,
        summary.pendingCloudSave,
      );
      setSummary((current) => current
        ? {
          ...current,
          statementId: result.statementId,
          statementDisplayName: result.statementDisplayName,
          savedCount: result.savedCount,
          cloudSync: result.cloudSync as CloudSyncSummary,
          pendingCloudSave: result.pendingCloudSave,
        }
        : current);
    } catch (error) {
      setSummary((current) => current?.cloudSync
        ? {
          ...current,
          cloudSync: {
            ...current.cloudSync,
            status: "failed",
            retryable: true,
            message: errorMessage(error),
          },
        }
        : current);
    } finally {
      setCloudRetrying(false);
    }
  };

  const insight = summary?.insights;
  const cloudSynced = Boolean(
    summary
      && (summary.cloudSync?.status === "synced"
        || (!summary.cloudSync && summary.savedCount === summary.importedCount)),
  );
  const statementSaved = cloudSynced || Boolean(summary?.cloudSync?.statementCommitted);

  return (
    <FinSightShell title="Import statement" onBack={handleBack}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: insets.bottom + 40 }}
      >
        <YStack width="100%" maxWidth={760} alignSelf="center" paddingHorizontal={PAGE_H}>
          {phase !== "done" || !summary ? (
            <StatementUploadCard
              onUpload={() => void runImport()}
              busy={phase === "importing"}
              errorMessage={importError}
            />
          ) : (
            <MotiView
              from={{ opacity: reducedMotion ? 1 : 0.78, translateY: reducedMotion ? 0 : 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: reducedMotion ? 1 : 220 }}
            >
              <YStack gap={21}>
                <XStack alignItems="center" gap={11} accessibilityRole="summary">
                  <View
                    width={44}
                    height={44}
                    borderRadius={15}
                    backgroundColor="$successSoft"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <CheckCircle2 size={23} color="$success" strokeWidth={2.2} />
                  </View>
                  <YStack flex={1} gap={2}>
                    <Text accessibilityRole="header" fontSize={19} fontWeight="800" color="$navy">
                      Statement analyzed
                    </Text>
                    <Text fontSize={12.5} color="$navy2" lineHeight={18}>
                      Extracted and stored locally on this device · Bank-grade privacy
                    </Text>
                  </YStack>
                </XStack>

                <Card>
                  <YStack gap={14}>
                    <YStack gap={3}>
                      <Text fontSize={13} color="$navy2" fontWeight="700">
                        {summary.statementDisplayName || "Import summary"}
                      </Text>
                      {summary.fileName ? (
                        <YStack gap={2}>
                          <Text fontSize={10.5} color="$ink2">Source file</Text>
                          <Text fontSize={11.5} color="$ink2" numberOfLines={1}>
                            {summary.fileName}
                          </Text>
                        </YStack>
                      ) : null}
                    </YStack>

                    <XStack gap={10} flexWrap="wrap">
                      {([
                        ["Analyzed", summary.importedCount],
                        ["Debits", summary.debitCount],
                        ["Credits", summary.creditCount],
                      ] as const).map(([label, value]) => (
                        <YStack
                          key={label}
                          flex={1}
                          minWidth={86}
                          padding={12}
                          borderRadius={15}
                          backgroundColor="$surfaceAlt"
                          gap={3}
                        >
                          <Text fontSize={10.5} color="$ink2">{label}</Text>
                          <Text fontSize={17} color="$navy" fontWeight="800">
                            {value.toLocaleString("en-IN")}
                          </Text>
                        </YStack>
                      ))}
                    </XStack>

                    <Text fontSize={12} color="$navy2" lineHeight={18}>
                      {summary.skippedCount > 0
                        ? `${summary.skippedCount.toLocaleString("en-IN")} invalid or summary row${summary.skippedCount === 1 ? " was" : "s were"} skipped.`
                        : "Every transaction row passed validation."}
                      {summary.metadataRowsDiscarded
                        ? ` ${summary.metadataRowsDiscarded.toLocaleString("en-IN")} metadata row${summary.metadataRowsDiscarded === 1 ? " was" : "s were"} removed before analysis.`
                        : ""}
                    </Text>
                  </YStack>
                </Card>

                {summary.cloudSync && !cloudSynced ? (
                  <Card variant="flat" backgroundColor="$warningSoft" borderColor="$gold">
                    <YStack gap={11} accessible accessibilityRole="alert" accessibilityLabel="Cloud sync status">
                      <YStack gap={4}>
                        <Text fontSize={14} fontWeight="800" color="$navy">
                          {cloudStatusTitle(summary.cloudSync.status)}
                        </Text>
                        <Text fontSize={12.5} color="$navy2" lineHeight={18}>
                          {summary.cloudSync.message}
                        </Text>
                        <Text fontSize={11.5} color="$navy2" fontWeight="700">
                          Cloud confirmed: {summary.cloudSync.savedCount.toLocaleString("en-IN")} of {summary.cloudSync.requestedCount.toLocaleString("en-IN")} sanitized rows
                        </Text>
                      </YStack>

                      {summary.pendingCloudSave ? (
                        <XStack
                          minHeight={48}
                          borderRadius={14}
                          backgroundColor="$redDeep"
                          alignItems="center"
                          justifyContent="center"
                          gap={8}
                          opacity={cloudRetrying ? 0.68 : 1}
                          onPress={cloudRetrying ? undefined : () => void retryCloudSave()}
                          pressStyle={cloudRetrying ? undefined : { opacity: 0.84, scale: 0.99 }}
                          accessibilityRole="button"
                          accessibilityLabel="Retry private cloud save"
                          accessibilityState={{ busy: cloudRetrying, disabled: cloudRetrying }}
                        >
                          <RefreshCw size={17} color="white" strokeWidth={2.2} />
                          <Text color="white" fontWeight="800" fontSize={13.5}>
                            {cloudRetrying ? "Saving sanitized data…" : "Retry private cloud save"}
                          </Text>
                        </XStack>
                      ) : null}
                    </YStack>
                  </Card>
                ) : null}

                {insight ? (
                  <>
                    <YStack
                      borderRadius={23}
                      backgroundColor="$heroSurface"
                      borderWidth={1}
                      borderColor="$heroSurfaceRaised"
                      padding={18}
                      gap={15}
                      overflow="hidden"
                      accessibilityRole="summary"
                    >
                      <View
                        position="absolute"
                        width={140}
                        height={140}
                        borderRadius={70}
                        right={-50}
                        top={-70}
                        backgroundColor="$red"
                        opacity={0.16}
                      />
                      <View
                        position="absolute"
                        width={68}
                        height={68}
                        borderRadius={34}
                        left={-30}
                        bottom={-42}
                        backgroundColor="$orange"
                        opacity={0.11}
                      />
                      <XStack alignItems="center" gap={8}>
                        <BarChart3 size={18} color="$gold" strokeWidth={2.2} />
                        <YStack flex={1} gap={1}>
                          <Text fontSize={14} fontWeight="800" color="white">Statement snapshot</Text>
                          <Text fontSize={11.5} color="$onBrand" opacity={0.68}>{insight.periodLabel}</Text>
                        </YStack>
                      </XStack>
                      <XStack gap={10} flexWrap="wrap">
                        <YStack flex={1} minWidth={120} gap={4}>
                          <Text fontSize={10.5} color="$onBrand" opacity={0.68}>Money out</Text>
                          <Text color="white" fontSize={16} fontWeight="800">
                            ₹{Math.round(insight.totalSpent).toLocaleString("en-IN")}
                          </Text>
                        </YStack>
                        <YStack flex={1} minWidth={120} gap={4}>
                          <Text fontSize={10.5} color="$onBrand" opacity={0.68}>Money in</Text>
                          <Text color="white" fontSize={16} fontWeight="800">
                            ₹{Math.round(insight.totalIncome).toLocaleString("en-IN")}
                          </Text>
                        </YStack>
                        <YStack flex={1} minWidth={120} gap={4}>
                          <Text fontSize={10.5} color="$onBrand" opacity={0.68}>Net cash flow</Text>
                          <Money
                            amount={Math.abs(insight.netCashFlow)}
                            kind={insight.netCashFlow >= 0 ? "credit" : "debit"}
                            signed
                            size={16}
                            color={brandColors.white}
                            decColor={brandColors.borderStrong}
                          />
                        </YStack>
                      </XStack>
                    </YStack>

                    {insight.monthlyActivity.length > 0 ? (
                      <YStack gap={10}>
                        <Text accessibilityRole="header" fontSize={17} fontWeight="800" color="$navy">Cash-flow timeline</Text>
                        <SafeChartErrorBoundary>
                          <Card variant="flat" padding={16}>
                            <MonthlyCashFlowChart data={insight.monthlyActivity} />
                          </Card>
                        </SafeChartErrorBoundary>
                      </YStack>
                    ) : null}

                    {insight.categoryBreakdown.length > 0 ? (
                      <YStack gap={10}>
                        <Text accessibilityRole="header" fontSize={17} fontWeight="800" color="$navy">Category histogram</Text>
                        <SafeChartErrorBoundary>
                          <Card variant="flat" padding={16}>
                            <CategoryHistogram data={insight.categoryBreakdown} />
                          </Card>
                        </SafeChartErrorBoundary>
                      </YStack>
                    ) : null}

                    {insight.observations.length > 0 ? (
                      <YStack gap={10}>
                        <Text accessibilityRole="header" fontSize={17} fontWeight="800" color="$navy">What stands out</Text>
                        <YStack
                          paddingVertical={15}
                          borderTopWidth={1}
                          borderBottomWidth={1}
                          borderColor="$borderColor"
                          gap={0}
                        >
                          {insight.observations.map((observation, index) => (
                            <YStack
                              key={observation.id}
                              gap={3}
                              paddingBottom={index === insight.observations.length - 1 ? 0 : 13}
                              marginBottom={index === insight.observations.length - 1 ? 0 : 13}
                              borderBottomWidth={index === insight.observations.length - 1 ? 0 : 1}
                              borderBottomColor="$borderColor"
                            >
                              <Text fontSize={12.5} color="$navy" fontWeight="800">{observation.title}</Text>
                              <Text fontSize={12} color="$navy2" lineHeight={17}>{observation.body}</Text>
                            </YStack>
                          ))}
                        </YStack>
                      </YStack>
                    ) : null}
                  </>
                ) : null}

                {statementSaved ? (
                  <>
                    <XStack
                      minHeight={52}
                      backgroundColor="$redDeep"
                      borderRadius={16}
                      alignItems="center"
                      justifyContent="center"
                      gap={9}
                      pressStyle={{ scale: 0.98, opacity: 0.9 }}
                      onPress={() => openHomeTab("analysis", summary.statementId)}
                      accessibilityRole="button"
                      accessibilityLabel="View saved analysis in Insights"
                    >
                      <FileCheck2 size={19} color="white" strokeWidth={2.3} />
                      <Text color="white" fontSize={14.5} fontWeight="800">
                        View saved analysis
                      </Text>
                    </XStack>

                    {cloudSynced ? (
                      <XStack
                        testID="view-imported-transactions"
                        minHeight={50}
                        borderWidth={1}
                        borderColor="$borderColor"
                        backgroundColor="$backgroundStrong"
                        borderRadius={16}
                        alignItems="center"
                        justifyContent="center"
                        gap={8}
                        pressStyle={{ scale: 0.98, opacity: 0.72 }}
                        onPress={() => openHomeTab("transactions", summary.statementId)}
                        accessibilityRole="button"
                        accessibilityLabel="View statement transactions in Insights"
                      >
                        <ListChecks size={17} color="$navy2" strokeWidth={2.3} />
                        <Text color="$navy" fontSize={13} fontWeight="800">
                          View statement transactions
                        </Text>
                      </XStack>
                    ) : null}
                  </>
                ) : null}

                <XStack
                  minHeight={58}
                  alignItems="flex-start"
                  justifyContent="center"
                  gap={8}
                  padding={12}
                  borderRadius={15}
                  backgroundColor="$orangeSoft"
                  borderWidth={1}
                  borderColor="$gold"
                  accessibilityRole="summary"
                >
                  <ShieldCheck size={16} color="$orangeDeep" strokeWidth={2.1} />
                  <Text flex={1} fontSize={11.5} color="$navy2" lineHeight={16} textAlign="center">
                    {statementSaved
                      ? "The original CSV was discarded. Only privacy-safe extracted rows are stored under your signed-in account."
                      : summary.pendingCloudSave
                        ? "The original CSV was released. A privacy-safe in-memory copy remains only on this screen so you can retry cloud save without uploading again."
                        : "The original CSV was released after analysis. Analyze it again only if this screen no longer has a private retry available."}
                  </Text>
                </XStack>

                <View
                  minHeight={48}
                  alignItems="center"
                  justifyContent="center"
                  borderRadius={14}
                  pressStyle={{ opacity: 0.62 }}
                  onPress={importAnother}
                  accessibilityRole="button"
                  accessibilityLabel="Import another CSV statement"
                >
                  <Text fontSize={13} fontWeight="700" color="$navy2">Import another CSV</Text>
                </View>
              </YStack>
            </MotiView>
          )}
        </YStack>
      </ScrollView>

      {/* Statement Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPasswordModalVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close overlay"
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ width: "100%", maxWidth: 420 }}
          >
            <View style={modalStyles.container}>
            {/* Header */}
            <XStack alignItems="center" justifyContent="space-between" marginBottom={14}>
              <XStack alignItems="center" gap={10}>
                <View
                  width={38}
                  height={38}
                  borderRadius={12}
                  backgroundColor="#EB001B"
                  alignItems="center"
                  justifyContent="center"
                >
                  <KeyRound size={20} color="#FFFFFF" strokeWidth={2.4} />
                </View>
                <YStack gap={1} flex={1}>
                  <Text fontSize={16} fontWeight="800" color="$navy">
                    This document is password protected
                  </Text>
                  <Text fontSize={11.5} color="$navy2" numberOfLines={1}>
                    {lastPickedFileRef.current?.fileName
                      ? `"${lastPickedFileRef.current.fileName}"`
                      : "Enter the password required by your bank"}
                  </Text>
                </YStack>
              </XStack>
              <Pressable
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPasswordError(null);
                  lastPickedFileRef.current = null;
                }}
                style={modalStyles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={18} color="#4F4C48" strokeWidth={2.2} />
              </Pressable>
            </XStack>

            {passwordError ? (
              <View style={modalStyles.errorBanner}>
                <Text style={modalStyles.errorText}>{passwordError}</Text>
              </View>
            ) : null}

            {/* Bank format suggestions */}
            <YStack gap={6} marginBottom={14}>
              <Text fontSize={11} fontWeight="700" color="$ink2" textTransform="uppercase" letterSpacing={0.5}>
                Common Bank Password Formats
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
              >
                {BANK_PASSWORD_HINTS.map((item) => (
                  <Pressable
                    key={item.bank}
                    onPress={() => setSelectedBankHint(item.bank === selectedBankHint ? null : item.bank)}
                    style={[
                      modalStyles.bankChip,
                      selectedBankHint === item.bank && modalStyles.bankChipSelected,
                    ]}
                  >
                    <Text
                      fontSize={11.5}
                      fontWeight="800"
                      color={selectedBankHint === item.bank ? "#FFFFFF" : "#1B1B18"}
                    >
                      {item.bank}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {selectedBankHint ? (
                <View style={modalStyles.hintBox}>
                  <Text fontSize={11.5} color="#4F4C48" lineHeight={16}>
                    <Text fontWeight="800" color="#1B1B18">{selectedBankHint}: </Text>
                    {BANK_PASSWORD_HINTS.find((b) => b.bank === selectedBankHint)?.hint}
                  </Text>
                </View>
              ) : null}
            </YStack>

            {/* Password Input */}
            <YStack gap={6} marginBottom={16}>
              <Text fontSize={11.5} fontWeight="700" color="$navy">
                Password / Passcode
              </Text>
              <XStack
                alignItems="center"
                borderWidth={1}
                borderColor="#E3E1DC"
                borderRadius={12}
                backgroundColor="#FFFFFF"
                paddingHorizontal={12}
              >
                <TextInput
                  value={statementPassword}
                  onChangeText={(val) => {
                    setStatementPassword(val);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder="e.g. your CIF, DOB, or PAN"
                  placeholderTextColor="#9A968E"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={modalStyles.input}
                  accessibilityLabel="Statement password input"
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={modalStyles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#4F4C48" strokeWidth={2} />
                  ) : (
                    <Eye size={18} color="#4F4C48" strokeWidth={2} />
                  )}
                </Pressable>
              </XStack>
              <Text fontSize={10.5} color="$ink2">
                Processed locally to decrypt the file; never uploaded or stored.
              </Text>
            </YStack>

            {/* Action buttons */}
            <XStack gap={10} marginTop={4}>
              <Pressable
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPasswordError(null);
                  lastPickedFileRef.current = null;
                }}
                style={modalStyles.cancelBtn}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text fontSize={13} fontWeight="700" color="#4F4C48">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  const cleanPassword = statementPassword.trim();
                  if (!cleanPassword) {
                    setPasswordError("Please enter your statement password.");
                    return;
                  }
                  setPasswordModalVisible(false);
                  setPasswordError(null);
                  if (lastPickedFileRef.current) {
                    setTimeout(() => {
                      void runImport(cleanPassword);
                    }, 50);
                  }
                }}
                style={modalStyles.saveBtn}
                accessibilityRole="button"
                accessibilityLabel="Decrypt & Analyze"
              >
                <Text fontSize={13} fontWeight="800" color="#FFFFFF">
                  Decrypt & Analyze
                </Text>
              </Pressable>
            </XStack>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
    </FinSightShell>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E3E1DC",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F2F1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    backgroundColor: "rgba(235, 0, 27, 0.08)",
    borderWidth: 1,
    borderColor: "#EB001B",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: "#EB001B",
    fontWeight: "600",
    lineHeight: 16,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#F2F1EE",
    borderWidth: 1,
    borderColor: "#E3E1DC",
  },
  bankChipSelected: {
    backgroundColor: "#1B1B18",
    borderColor: "#1B1B18",
  },
  hintBox: {
    marginTop: 4,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: "#1B1B18",
  },
  eyeBtn: {
    padding: 6,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F2F1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EB001B",
    alignItems: "center",
    justifyContent: "center",
  },
});
