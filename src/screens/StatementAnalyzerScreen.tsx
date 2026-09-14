import React, { useRef, useState } from "react";
import { Alert } from "react-native";
import { ScrollView, YStack, XStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { usePreventRemove } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BarChart3,
  CheckCircle2,
  FileCheck2,
  ListChecks,
  RefreshCw,
  ShieldCheck,
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
import type { InsightsView } from "./home/InsightsContent";
import type { FinancialInsights } from "../types/transactions";

const PAGE_H = 20;

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

export function StatementAnalyzerScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const importActive = useRef(false);
  const [phase, setPhase] = useState<Phase>("ready");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [cloudRetrying, setCloudRetrying] = useState(false);

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

  const runImport = async () => {
    if (importActive.current) return;
    if (!user?.uid) {
      setImportError("Sign in before importing a bank statement.");
      setPhase("ready");
      return;
    }

    importActive.current = true;
    setCloudRetrying(false);
    setImportError(null);
    setSummary(null);
    setPhase("importing");

    try {
      const result = await importCsvStatement(user.uid);
      if (result.canceled) {
        setPhase("ready");
        return;
      }
      setSummary(result as ImportSummary);
      setPhase("done");
    } catch (error) {
      setImportError(errorMessage(error));
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
                    backgroundColor="rgba(99,166,74,0.12)"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <CheckCircle2 size={23} color="$success" strokeWidth={2.2} />
                  </View>
                  <YStack flex={1} gap={2}>
                    <Text fontSize={19} fontWeight="800" color="$navy">
                      Statement analyzed
                    </Text>
                    <Text fontSize={12.5} color="$navy2" lineHeight={18}>
                      {statementSaved
                        ? "Only sanitized extracted data is saved privately to your account"
                        : "Analysis complete; the private cloud save is still pending"}
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
                  <Card backgroundColor="rgba(215,154,53,0.07)" borderColor="rgba(215,154,53,0.24)">
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
                          backgroundColor="$navy"
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
                      backgroundColor="$navy"
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
                        backgroundColor="rgba(235,0,27,0.18)"
                      />
                      <XStack alignItems="center" gap={8}>
                        <BarChart3 size={18} color="#FFABB3" strokeWidth={2.2} />
                        <YStack flex={1} gap={1}>
                          <Text fontSize={14} fontWeight="800" color="white">Statement snapshot</Text>
                          <Text fontSize={11.5} color="#C9CEDA">{insight.periodLabel}</Text>
                        </YStack>
                      </XStack>
                      <XStack gap={10} flexWrap="wrap">
                        <YStack flex={1} minWidth={120} gap={4}>
                          <Text fontSize={10.5} color="#C9CEDA">Money out</Text>
                          <Text color="white" fontSize={16} fontWeight="800">
                            ₹{Math.round(insight.totalSpent).toLocaleString("en-IN")}
                          </Text>
                        </YStack>
                        <YStack flex={1} minWidth={120} gap={4}>
                          <Text fontSize={10.5} color="#C9CEDA">Money in</Text>
                          <Text color="white" fontSize={16} fontWeight="800">
                            ₹{Math.round(insight.totalIncome).toLocaleString("en-IN")}
                          </Text>
                        </YStack>
                        <YStack flex={1} minWidth={120} gap={4}>
                          <Text fontSize={10.5} color="#C9CEDA">Net cash flow</Text>
                          <Money
                            amount={Math.abs(insight.netCashFlow)}
                            kind={insight.netCashFlow >= 0 ? "credit" : "debit"}
                            signed
                            size={16}
                            color="white"
                            decColor="#C9CEDA"
                          />
                        </YStack>
                      </XStack>
                    </YStack>

                    {insight.monthlyActivity.length > 0 ? (
                      <YStack gap={10}>
                        <Text fontSize={17} fontWeight="800" color="$navy">Cash-flow timeline</Text>
                        <Card padding={16}>
                          <MonthlyCashFlowChart data={insight.monthlyActivity} />
                        </Card>
                      </YStack>
                    ) : null}

                    {insight.categoryBreakdown.length > 0 ? (
                      <YStack gap={10}>
                        <Text fontSize={17} fontWeight="800" color="$navy">Category histogram</Text>
                        <Card padding={16}>
                          <CategoryHistogram data={insight.categoryBreakdown} />
                        </Card>
                      </YStack>
                    ) : null}

                    {insight.observations.length > 0 ? (
                      <YStack gap={10}>
                        <Text fontSize={17} fontWeight="800" color="$navy">What stands out</Text>
                        <Card>
                          <YStack gap={0}>
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
                        </Card>
                      </YStack>
                    ) : null}
                  </>
                ) : null}

                {statementSaved ? (
                  <>
                    <XStack
                      minHeight={52}
                      backgroundColor="$navy"
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

                <XStack alignItems="flex-start" justifyContent="center" gap={7} accessibilityRole="summary">
                  <ShieldCheck size={15} color="$success" strokeWidth={2.1} />
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
    </FinSightShell>
  );
}
