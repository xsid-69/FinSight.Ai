import React, { useCallback, useRef, useState } from "react";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  FilePlus2,
  RefreshCw,
  ShieldCheck,
} from "@tamagui/lucide-icons";

import { Card, FinSightShell } from "../components/finsight";
import { Money } from "../components/banking/Money";
import MerchantAvatar from "../components/MerchantAvatar";
import {
  CategoryHistogram,
  MonthlyCashFlowChart,
} from "../components/charts/StatementCharts";
import { useAuth } from "../context/AuthContext";
import { categoryLabel, transactionMerchantLabel } from "../services/financialInsights";
import { loadPrivateStatement } from "../services/transactionService";
import type { SavedStatementDetail } from "../types/transactions";

const PAGE_H = 20;
const IMPORTED_AT_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const TRANSACTION_DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function importedAtLabel(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Saved to your account" : `Saved ${IMPORTED_AT_FORMATTER.format(parsed)}`;
}

function transactionDateLabel(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? value : TRANSACTION_DATE_FORMATTER.format(parsed);
}

export function StatementDetailScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const statementId = typeof route?.params?.statementId === "string" ? route.params.statementId : "";
  const requestRef = useRef(0);
  const [detail, setDetail] = useState<SavedStatementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatement = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!user?.uid) {
      setDetail(null);
      setLoading(false);
      setError("Sign in to view this saved statement.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await loadPrivateStatement(user.uid, statementId);
      if (requestRef.current !== requestId) return;
      setDetail(result);
    } catch (loadError) {
      if (requestRef.current !== requestId) return;
      setError(
        loadError instanceof Error && loadError.message.trim()
          ? loadError.message
          : "This statement could not be opened.",
      );
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [statementId, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void loadStatement();
      return () => {
        requestRef.current += 1;
      };
    }, [loadStatement]),
  );

  const insights = detail?.insights;

  return (
    <FinSightShell title="Statement analysis" onBack={() => navigation?.goBack?.()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 18, paddingBottom: insets.bottom + 40 }}
      >
        <YStack width="100%" maxWidth={760} alignSelf="center" paddingHorizontal={PAGE_H} gap={22}>
          {loading ? (
            <YStack gap={14} accessibilityRole="progressbar" accessibilityLabel="Loading saved statement">
              <View height={116} borderRadius={22} backgroundColor="$surfaceAlt" />
              <View height={248} borderRadius={22} backgroundColor="$surfaceAlt" />
              <View height={210} borderRadius={22} backgroundColor="$surfaceAlt" />
            </YStack>
          ) : error || !detail || !insights ? (
            <Card backgroundColor="rgba(214,69,69,0.05)" borderColor="rgba(214,69,69,0.22)">
              <YStack gap={14}>
                <XStack gap={10} alignItems="flex-start" accessibilityRole="alert">
                  <AlertCircle size={20} color="$danger" strokeWidth={2.2} />
                  <YStack flex={1} gap={3}>
                    <Text fontSize={14} fontWeight="800" color="$navy">Statement unavailable</Text>
                    <Text fontSize={12.5} lineHeight={18} color="$navy2">
                      {error || "This statement could not be opened."}
                    </Text>
                  </YStack>
                </XStack>
                <XStack
                  minHeight={46}
                  borderRadius={14}
                  backgroundColor="$navy"
                  alignItems="center"
                  justifyContent="center"
                  gap={8}
                  onPress={() => void loadStatement()}
                  pressStyle={{ opacity: 0.8, scale: 0.99 }}
                  accessibilityRole="button"
                  accessibilityLabel="Retry opening saved statement"
                >
                  <RefreshCw size={17} color="white" />
                  <Text color="white" fontSize={13.5} fontWeight="800">Try again</Text>
                </XStack>
              </YStack>
            </Card>
          ) : (
            <>
              <YStack gap={10}>
                <XStack alignItems="center" gap={8}>
                  <CheckCircle2 size={16} color="$success" strokeWidth={2.3} />
                  <Text fontSize={12.5} fontWeight="800" color="$navy2">
                    Saved to your private account
                  </Text>
                </XStack>
                <Text fontSize={25} lineHeight={31} fontWeight="800" color="$navy" letterSpacing={-0.65}>
                  {detail.statement.displayName}
                </Text>
                <XStack alignItems="center" gap={7}>
                  <CalendarDays size={14} color="$ink2" strokeWidth={2.1} />
                  <Text fontSize={12} color="$ink2">
                    {importedAtLabel(detail.statement.importedAt)}
                  </Text>
                </XStack>
              </YStack>

              <YStack
                backgroundColor="$navy"
                borderRadius={24}
                padding={19}
                gap={18}
                overflow="hidden"
                accessible
                accessibilityRole="summary"
              >
                <View
                  position="absolute"
                  width={150}
                  height={150}
                  borderRadius={75}
                  backgroundColor="rgba(235,0,27,0.18)"
                  right={-55}
                  top={-72}
                />
                <YStack gap={4}>
                  <Text fontSize={11.5} color="#C9CEDA" fontWeight="700">Net cash flow</Text>
                  <Money
                    amount={Math.abs(insights.netCashFlow)}
                    kind={insights.netCashFlow >= 0 ? "credit" : "debit"}
                    signed
                    size={28}
                    color="white"
                    decColor="#C9CEDA"
                  />
                  <Text fontSize={11.5} color="#C9CEDA">
                    {insights.netCashFlow >= 0 ? "Surplus across this statement" : "Spending exceeded money in"}
                  </Text>
                </YStack>
                <XStack gap={10}>
                  <YStack flex={1} padding={12} borderRadius={15} backgroundColor="rgba(255,255,255,0.09)" gap={4}>
                    <Text fontSize={10.5} color="#C9CEDA">Money in</Text>
                    <Text fontSize={14} fontWeight="800" color="white">
                      ₹{Math.round(insights.totalIncome).toLocaleString("en-IN")}
                    </Text>
                  </YStack>
                  <YStack flex={1} padding={12} borderRadius={15} backgroundColor="rgba(255,255,255,0.09)" gap={4}>
                    <Text fontSize={10.5} color="#C9CEDA">Money out</Text>
                    <Text fontSize={14} fontWeight="800" color="white">
                      ₹{Math.round(insights.totalSpent).toLocaleString("en-IN")}
                    </Text>
                  </YStack>
                  <YStack flex={1} padding={12} borderRadius={15} backgroundColor="rgba(255,255,255,0.09)" gap={4}>
                    <Text fontSize={10.5} color="#C9CEDA">Transactions</Text>
                    <Text fontSize={14} fontWeight="800" color="white">
                      {insights.transactionCount.toLocaleString("en-IN")}
                    </Text>
                  </YStack>
                </XStack>
              </YStack>

              {insights.monthlyActivity.length > 0 ? (
                <YStack gap={10}>
                  <Text fontSize={17} fontWeight="800" color="$navy">Cash-flow timeline</Text>
                  <Card padding={16}>
                    <MonthlyCashFlowChart data={insights.monthlyActivity} />
                  </Card>
                </YStack>
              ) : null}

              {insights.categoryBreakdown.length > 0 ? (
                <YStack gap={10}>
                  <Text fontSize={17} fontWeight="800" color="$navy">Category histogram</Text>
                  <Card padding={16}>
                    <CategoryHistogram data={insights.categoryBreakdown} />
                  </Card>
                </YStack>
              ) : null}

              {insights.observations.length > 0 ? (
                <YStack gap={10}>
                  <Text fontSize={17} fontWeight="800" color="$navy">Notable patterns</Text>
                  <Card>
                    <YStack gap={0}>
                      {insights.observations.map((observation, index) => (
                        <YStack
                          key={observation.id}
                          gap={3}
                          paddingBottom={index === insights.observations.length - 1 ? 0 : 14}
                          marginBottom={index === insights.observations.length - 1 ? 0 : 14}
                          borderBottomWidth={index === insights.observations.length - 1 ? 0 : 1}
                          borderBottomColor="$borderColor"
                        >
                          <Text fontSize={13} fontWeight="800" color="$navy">{observation.title}</Text>
                          <Text fontSize={12} lineHeight={17} color="$navy2">{observation.body}</Text>
                        </YStack>
                      ))}
                    </YStack>
                  </Card>
                </YStack>
              ) : null}

              <YStack gap={10}>
                <XStack alignItems="flex-end" justifyContent="space-between" gap={12}>
                  <YStack gap={2} flex={1}>
                    <Text fontSize={17} fontWeight="800" color="$navy">Extracted transactions</Text>
                    <Text fontSize={11.5} color="$ink2">Newest first · privacy-safe descriptions</Text>
                  </YStack>
                  <Text fontSize={11.5} fontWeight="800" color="$navy2">
                    {detail.transactions.length.toLocaleString("en-IN")}
                  </Text>
                </XStack>
                <YStack gap={8}>
                  {detail.transactions.slice(0, 20).map((transaction) => {
                    const merchant = transactionMerchantLabel(transaction);
                    const credit = transaction.type === "CREDIT";
                    return (
                      <XStack
                        key={transaction.id}
                        minHeight={72}
                        paddingVertical={12}
                        paddingHorizontal={14}
                        borderRadius={16}
                        backgroundColor="$backgroundStrong"
                        alignItems="center"
                        gap={12}
                        accessible
                        accessibilityLabel={`${credit ? "Credit" : "Debit"}, ${merchant}, ${transaction.amount} rupees, ${categoryLabel(transaction.category)}, ${transactionDateLabel(transaction.date)}`}
                      >
                        <MerchantAvatar
                          merchantName={merchant}
                          merchantKey={transaction.merchantKey}
                          category={transaction.category}
                          size={42}
                        />
                        <YStack flex={1} gap={3}>
                          <Text numberOfLines={1} fontSize={13} fontWeight="750" color="$navy">
                            {merchant}
                          </Text>
                          <Text fontSize={11} color="$ink2">
                            {transactionDateLabel(transaction.date)} · {categoryLabel(transaction.category)}
                          </Text>
                        </YStack>
                        <Money
                          amount={transaction.amount}
                          kind={credit ? "credit" : "debit"}
                          signed={credit}
                          size={13.5}
                        />
                      </XStack>
                    );
                  })}
                </YStack>
                {detail.transactions.length > 20 ? (
                  <Text textAlign="center" fontSize={11.5} lineHeight={17} color="$ink2">
                    Showing the newest 20 of {detail.transactions.length.toLocaleString("en-IN")} extracted transactions.
                  </Text>
                ) : null}
              </YStack>

              {detail.ignoredCount > 0 ? (
                <Text textAlign="center" fontSize={11.5} lineHeight={17} color="$ink2">
                  {detail.ignoredCount.toLocaleString("en-IN")} record{detail.ignoredCount === 1 ? " was" : "s were"} excluded because they did not match the privacy-safe schema.
                </Text>
              ) : null}

              <XStack
                padding={12}
                borderRadius={15}
                gap={9}
                alignItems="flex-start"
                backgroundColor="rgba(99,166,74,0.08)"
                borderWidth={1}
                borderColor="rgba(99,166,74,0.2)"
                accessibilityRole="summary"
              >
                <ShieldCheck size={17} color="$success" strokeWidth={2.2} />
                <Text flex={1} fontSize={12} lineHeight={17} color="$navy2">
                  This view was rebuilt from saved sanitized fields. You do not need the original CSV to return here.
                </Text>
              </XStack>

              <XStack
                minHeight={50}
                borderRadius={15}
                backgroundColor="$navy"
                alignItems="center"
                justifyContent="center"
                gap={9}
                onPress={() => navigation?.navigate?.("Analyzer")}
                pressStyle={{ opacity: 0.84, scale: 0.99 }}
                accessibilityRole="button"
                accessibilityLabel="Analyze another statement"
              >
                <FilePlus2 size={18} color="white" strokeWidth={2.2} />
                <Text color="white" fontSize={14} fontWeight="800">Analyze another statement</Text>
              </XStack>
            </>
          )}
        </YStack>
      </ScrollView>
    </FinSightShell>
  );
}
