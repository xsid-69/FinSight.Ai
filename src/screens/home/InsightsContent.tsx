import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { MotiView } from "moti";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  FileCheck2,
  FileSpreadsheet,
  FileUp,
  Landmark,
  Link2,
  ReceiptText,
  RefreshCw,
  Rows3,
  ScanSearch,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  TrendingDown,
  TrendingUp,
  Unlink2,
  WalletCards,
  X,
} from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { Card } from "../../components/finsight";
import { Money } from "../../components/banking/Money";
import MerchantAvatar from "../../components/MerchantAvatar";
import {
  CategoryHistogram,
  MonthlyCashFlowChart,
} from "../../components/charts/StatementCharts";
import { useAuth } from "../../context/AuthContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { brandColors } from "../../theme/mastercard";
import {
  buildFinancialInsights,
  categoryLabel,
  transactionMerchantLabel,
} from "../../services/financialInsights";
import type {
  FinancialInsights,
  InsightObservation,
  PrivateTransaction,
  SavedStatement,
  SavedStatementDetail,
} from "../../types/transactions";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;

export type InsightsView = "analysis" | "transactions" | "statements";

type LedgerFilter = "all" | "credit" | "debit";

interface InsightsContentProps {
  navigation?: any;
  view?: InsightsView;
  onChangeView?: (view: InsightsView) => void;
  transactions?: PrivateTransaction[];
  insights?: FinancialInsights;
  ignoredCount?: number;
  loading?: boolean;
  error?: string | null;
  refreshError?: string | null;
  onRetry?: () => void;
  statements?: SavedStatement[];
  statementsLoading?: boolean;
  statementsError?: string | null;
  statementsRefreshError?: string | null;
  statementsIgnoredCount?: number;
  onRetryStatements?: () => void;
  selectedStatementId?: string | null;
  selectedStatementDetail?: SavedStatementDetail | null;
  selectedStatementLoading?: boolean;
  selectedStatementError?: string | null;
  selectedStatementRefreshError?: string | null;
  onSelectStatement?: (statementId: string | null) => void;
  onRetrySelectedStatement?: () => void;
  parentPagerGesture?: ReturnType<typeof Gesture.Pan>;
}

interface InsightsViewSelectorProps {
  activeView: InsightsView;
  onSelect: (view: InsightsView) => void;
}

const INSIGHTS_VIEWS: ReadonlyArray<{
  id: InsightsView;
  label: string;
  icon: typeof BarChart3;
}> = [
  { id: "analysis", label: "Analysis", icon: BarChart3 },
  { id: "transactions", label: "Transactions", icon: Rows3 },
  { id: "statements", label: "Statements", icon: FileSpreadsheet },
];

const LEDGER_BATCH_SIZE = 20;
const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function displayDate(value: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? value : DATE_FORMATTER.format(parsed);
}

function InsightsViewSelector({ activeView, onSelect }: InsightsViewSelectorProps) {
  return (
    <XStack
      gap={6}
      padding={4}
      borderRadius={18}
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$backgroundStrong"
      accessibilityRole="tablist"
      accessibilityLabel="Insights workspace view"
    >
      {INSIGHTS_VIEWS.map(({ id, label, icon: Icon }) => {
        const selected = activeView === id;
        return (
          <XStack
            key={id}
            flex={1}
            minWidth={48}
            minHeight={50}
            paddingHorizontal={7}
            borderRadius={14}
            backgroundColor={selected ? "$navy" : "transparent"}
            alignItems="center"
            justifyContent="center"
            gap={6}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onSelect(id);
            }}
            pressStyle={{ opacity: 0.78, scale: 0.985 }}
            accessibilityRole="tab"
            accessibilityLabel={`${label} Insights view`}
            accessibilityState={{ selected }}
          >
            <Icon size={16} color={selected ? "white" : "$navy2"} strokeWidth={2.15} />
            <Text
              flexShrink={1}
              fontSize={11.5}
              fontWeight="800"
              color={selected ? "white" : "$navy2"}
              numberOfLines={1}
            >
              {label}
            </Text>
          </XStack>
        );
      })}
    </XStack>
  );
}

function LoadingState() {
  const reducedMotion = useReducedMotion();
  return (
    <YStack
      gap={12}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading private financial insights"
      accessibilityState={{ busy: true }}
    >
      {[132, 246, 212].map((height, index) => (
        <MotiView
          key={index}
          from={{ opacity: reducedMotion ? 1 : 0.7 }}
          animate={{ opacity: 1 }}
          transition={{
            type: "timing",
            duration: reducedMotion ? 1 : 880,
            delay: reducedMotion ? 0 : index * 90,
            loop: !reducedMotion,
          }}
          style={{ minHeight: height }}
        >
          <View
            flex={1}
            minHeight={height}
            borderRadius={20}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$backgroundStrong"
            padding={17}
          >
            <View width="38%" height={11} borderRadius={6} backgroundColor="$surfaceAlt" />
            <View width="72%" height={10} marginTop={13} borderRadius={6} backgroundColor="$surfaceAlt" />
            <View width="54%" height={10} marginTop={9} borderRadius={6} backgroundColor="$surfaceAlt" />
          </View>
        </MotiView>
      ))}
    </YStack>
  );
}

function ErrorState({
  message,
  onRetry,
  onShowAll,
}: {
  message: string;
  onRetry?: () => void;
  onShowAll?: () => void;
}) {
  return (
    <Card variant="flat" borderColor="$danger" backgroundColor="$dangerSoft">
      <YStack gap={14}>
        <XStack alignItems="flex-start" gap={11} accessibilityRole="alert">
          <AlertCircle size={20} color="$danger" strokeWidth={2.2} />
          <YStack flex={1} gap={4}>
            <Text accessibilityRole="header" fontSize={15} fontWeight="800" color="$navy">
              Insights couldn’t load
            </Text>
            <Text fontSize={13} lineHeight={19} color="$navy2">
              {message}
            </Text>
          </YStack>
        </XStack>
        <XStack gap={9} flexWrap="wrap">
          <XStack
            flex={1}
            minWidth={150}
            minHeight={48}
            borderRadius={14}
            backgroundColor="$redDeep"
            alignItems="center"
            justifyContent="center"
            gap={8}
            onPress={onRetry}
            pressStyle={{ opacity: 0.82, scale: 0.99 }}
            accessibilityRole="button"
            accessibilityLabel="Retry loading insights"
          >
            <RefreshCw size={17} color="$onBrand" strokeWidth={2.2} />
            <Text color="$onBrand" fontWeight="800" fontSize={13.5}>
              Try again
            </Text>
          </XStack>
          {onShowAll ? (
            <XStack
              flex={1}
              minWidth={150}
              minHeight={48}
              borderRadius={14}
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$backgroundStrong"
              alignItems="center"
              justifyContent="center"
              onPress={onShowAll}
              pressStyle={{ opacity: 0.72, scale: 0.99 }}
              accessibilityRole="button"
              accessibilityLabel="Show all imported activity"
            >
              <Text color="$navy" fontWeight="800" fontSize={13.5}>
                Show all activity
              </Text>
            </XStack>
          ) : null}
        </XStack>
      </YStack>
    </Card>
  );
}

function RefreshWarning({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <XStack
      minHeight={56}
      alignItems="center"
      gap={10}
      paddingLeft={13}
      paddingRight={4}
      borderRadius={15}
      borderWidth={1}
      borderColor="$gold"
      backgroundColor="$warningSoft"
    >
      <XStack
        flex={1}
        alignItems="center"
        gap={10}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`Showing the last verified snapshot. ${message}`}
      >
        <AlertCircle size={18} color="$warning" strokeWidth={2.2} />
        <Text flex={1} fontSize={12.5} lineHeight={18} color="$navy2" numberOfLines={3}>
          Showing the last verified snapshot. {message}
        </Text>
      </XStack>
      <View
        width={48}
        height={48}
        borderRadius={12}
        alignItems="center"
        justifyContent="center"
        onPress={onRetry}
        pressStyle={{ opacity: 0.7, scale: 0.97 }}
        accessibilityRole="button"
        accessibilityLabel="Retry refreshing insights"
      >
        <RefreshCw size={18} color="$navy2" strokeWidth={2.2} />
      </View>
    </XStack>
  );
}

function ObservationRow({ observation, last }: { observation: InsightObservation; last: boolean }) {
  const Icon = observation.tone === "positive"
    ? TrendingUp
    : observation.tone === "warning"
      ? ShieldAlert
      : ScanSearch;
  const color = observation.tone === "positive"
    ? "$success"
    : observation.tone === "warning"
      ? "$warning"
      : "$red";
  const background = observation.tone === "positive"
    ? "$successSoft"
    : observation.tone === "warning"
      ? "$warningSoft"
      : "$redSoft";

  return (
    <XStack
      alignItems="flex-start"
      gap={12}
      paddingBottom={last ? 0 : 16}
      marginBottom={last ? 0 : 16}
      borderBottomWidth={last ? 0 : 1}
      borderBottomColor="$borderColor"
    >
      <View
        width={40}
        height={40}
        borderRadius={13}
        backgroundColor={background}
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={19} color={color} strokeWidth={2.1} />
      </View>
      <YStack flex={1} gap={4}>
        <Text fontSize={14} fontWeight="800" color="$navy">
          {observation.title}
        </Text>
        <Text fontSize={13} lineHeight={19} color="$navy2">
          {observation.body}
        </Text>
      </YStack>
    </XStack>
  );
}

function StatementScopePicker({
  statements,
  selectedStatementId,
  loading,
  onSelect,
  onOpenLibrary,
  parentPagerGesture,
}: {
  statements: SavedStatement[];
  selectedStatementId: string | null;
  loading: boolean;
  onSelect?: (statementId: string | null) => void;
  onOpenLibrary: () => void;
  parentPagerGesture?: ReturnType<typeof Gesture.Pan>;
}) {
  const visibleStatements = statements.slice(0, 5);
  const scopeGesture = useMemo(() => {
    const nativeGesture = Gesture.Native();
    return parentPagerGesture
      ? nativeGesture.blocksExternalGesture(parentPagerGesture)
      : nativeGesture;
  }, [parentPagerGesture]);

  if (loading && statements.length === 0) {
    return (
      <XStack gap={8} accessibilityRole="progressbar" accessibilityLabel="Loading saved statement scopes">
        {[92, 148, 132].map((width) => (
          <View key={width} width={width} height={48} borderRadius={14} backgroundColor="$surfaceAlt" />
        ))}
      </XStack>
    );
  }

  return (
    <GestureDetector gesture={scopeGesture}>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 10 }}
        accessibilityRole="tablist"
        accessibilityLabel="Insight data scope"
      >
        <XStack
          minHeight={48}
          paddingHorizontal={14}
          borderRadius={14}
          borderWidth={1}
          borderColor={selectedStatementId === null ? "$navy" : "$borderColor"}
          backgroundColor={selectedStatementId === null ? "$navy" : "$backgroundStrong"}
          alignItems="center"
          gap={8}
          onPress={() => {
            void Haptics.selectionAsync();
            onSelect?.(null);
          }}
          pressStyle={{ opacity: 0.78, scale: 0.985 }}
          accessibilityRole="tab"
          accessibilityState={{ selected: selectedStatementId === null }}
          accessibilityLabel="All imported activity"
        >
          <WalletCards
            size={17}
            color={selectedStatementId === null ? "white" : "$navy2"}
            strokeWidth={2.2}
          />
          <Text
            fontSize={12.5}
            fontWeight="800"
            color={selectedStatementId === null ? "white" : "$navy"}
          >
            All activity
          </Text>
        </XStack>

        {visibleStatements.map((statement) => {
          const selected = selectedStatementId === statement.id;
          return (
            <XStack
              key={statement.id}
              minHeight={48}
              maxWidth={210}
              paddingHorizontal={13}
              borderRadius={14}
              borderWidth={1}
              borderColor={selected ? "$navy" : "$borderColor"}
              backgroundColor={selected ? "$navy" : "$backgroundStrong"}
              alignItems="center"
              gap={8}
              onPress={() => {
                if (!selected) void Haptics.selectionAsync();
                onSelect?.(statement.id);
              }}
              pressStyle={{ opacity: 0.78, scale: 0.985 }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`Show ${statement.displayName}`}
            >
              <FileCheck2 size={17} color={selected ? "$onBrand" : "$red"} strokeWidth={2.2} />
              <Text
                flexShrink={1}
                numberOfLines={1}
                fontSize={12.5}
                fontWeight="800"
                color={selected ? "white" : "$navy"}
              >
                {statement.displayName}
              </Text>
            </XStack>
          );
        })}

        {statements.length > visibleStatements.length ? (
          <XStack
            minHeight={48}
            paddingHorizontal={13}
            borderRadius={14}
            borderWidth={1}
            borderColor="$borderColor"
            alignItems="center"
            gap={7}
            onPress={onOpenLibrary}
            pressStyle={{ opacity: 0.72, scale: 0.985 }}
            accessibilityRole="button"
            accessibilityLabel="Open all saved statements"
          >
            <Text fontSize={12.5} fontWeight="800" color="$navy2">More</Text>
            <ArrowRight size={16} color="$navy2" strokeWidth={2.2} />
          </XStack>
        ) : null}
      </ScrollView>
    </GestureDetector>
  );
}

function LedgerRow({ transaction }: { transaction: PrivateTransaction }) {
  const credit = transaction.type === "CREDIT";
  const merchant = transactionMerchantLabel(transaction);
  return (
    <XStack
      minHeight={76}
      paddingVertical={13}
      paddingHorizontal={4}
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      alignItems="center"
      gap={12}
      accessible
      accessibilityLabel={`${credit ? "Credit" : "Debit"}, ${merchant}, ${transaction.amount} rupees, ${categoryLabel(transaction.category)}, ${displayDate(transaction.date)}`}
    >
      <MerchantAvatar
        merchantName={merchant}
        merchantKey={transaction.merchantKey}
        category={transaction.category}
        size={42}
      />
      <YStack flex={1} gap={4}>
        <Text fontSize={13.5} fontWeight="800" color="$navy" numberOfLines={1}>
          {merchant}
        </Text>
        <Text fontSize={11.5} color="$ink2" numberOfLines={1}>
          {categoryLabel(transaction.category)} · {displayDate(transaction.date)}
        </Text>
      </YStack>
      <Money
        amount={transaction.amount}
        kind={credit ? "credit" : "debit"}
        signed
        size={13.5}
      />
    </XStack>
  );
}

interface ScopedTransactionsWorkspaceProps {
  activeView: InsightsView;
  onChangeView: (view: InsightsView) => void;
  navigation?: any;
  scopeTitle: string;
  scopeKey: string;
  selectedManifest: SavedStatement | null;
  selectedStatementId: string | null;
  statements: SavedStatement[];
  statementsLoading: boolean;
  transactions: PrivateTransaction[];
  loading: boolean;
  error: string | null;
  refreshError: string | null;
  ignoredCount: number;
  onRetry?: () => void;
  onSelectStatement?: (statementId: string | null) => void;
  parentPagerGesture?: ReturnType<typeof Gesture.Pan>;
}

function ScopedTransactionsWorkspace({
  activeView,
  onChangeView,
  navigation,
  scopeTitle,
  scopeKey,
  selectedManifest,
  selectedStatementId,
  statements,
  statementsLoading,
  transactions,
  loading,
  error,
  refreshError,
  ignoredCount,
  onRetry,
  onSelectStatement,
  parentPagerGesture,
}: ScopedTransactionsWorkspaceProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LedgerFilter>("all");
  const [visibleCount, setVisibleCount] = useState(LEDGER_BATCH_SIZE);
  const normalizedQuery = query.trim().toLocaleLowerCase("en-IN");

  const matchingTransactions = useMemo(() => transactions.filter((transaction) => {
    if (filter === "credit" && transaction.type !== "CREDIT") return false;
    if (filter === "debit" && transaction.type !== "DEBIT") return false;
    if (!normalizedQuery) return true;
    return [
      transactionMerchantLabel(transaction),
      transaction.sanitizedDescription,
      categoryLabel(transaction.category),
      transaction.date,
      displayDate(transaction.date),
      transaction.amount.toString(),
      transaction.type,
    ].join(" ").toLocaleLowerCase("en-IN").includes(normalizedQuery);
  }), [filter, normalizedQuery, transactions]);

  useEffect(() => {
    setVisibleCount(LEDGER_BATCH_SIZE);
  }, [filter, query, scopeKey, transactions]);

  const visibleTransactions = matchingTransactions.slice(0, visibleCount);
  const hasMore = visibleTransactions.length < matchingTransactions.length;
  const sourceLabel = selectedManifest
    ? `${selectedManifest.displayName} · ${selectedManifest.transactionCount.toLocaleString("en-IN")} verified rows`
    : `${transactions.length.toLocaleString("en-IN")} verified rows across all available activity`;

  const resetBrowseControls = () => {
    void Haptics.selectionAsync();
    setFilter("all");
    setQuery("");
    setVisibleCount(LEDGER_BATCH_SIZE);
  };

  const openAnalyzer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate?.("Analyzer");
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingTop: 15,
        paddingBottom: insets.bottom + DOCK_CLEARANCE,
      }}
    >
      <YStack width="100%" maxWidth={780} alignSelf="center" paddingHorizontal={PAGE_H}>
        <InsightsViewSelector activeView={activeView} onSelect={onChangeView} />

        <YStack marginTop={21} marginBottom={16} gap={7}>
          <XStack alignItems="center" gap={7}>
            <FileSpreadsheet size={15} color="$red" strokeWidth={2.2} />
            <Text fontSize={11.5} fontWeight="800" letterSpacing={0.75} color="$ink2">
              CSV INSIGHTS WORKSPACE
            </Text>
          </XStack>
          <Text accessibilityRole="header" fontSize={27} lineHeight={33} fontWeight="800" color="$navy" letterSpacing={-0.75}>
            Transaction ledger
          </Text>
          <Text maxWidth={620} fontSize={13} lineHeight={19} color="$navy2">
            Browse only the privacy-safe fields available inside the active Insights scope. Source order is preserved.
          </Text>
        </YStack>

        <YStack gap={8} marginBottom={18}>
          <Text fontSize={12} fontWeight="800" color="$ink2">Ledger scope</Text>
          <StatementScopePicker
            statements={statements}
            selectedStatementId={selectedStatementId}
            loading={statementsLoading}
            onSelect={onSelectStatement}
            onOpenLibrary={() => onChangeView("statements")}
            parentPagerGesture={parentPagerGesture}
          />
        </YStack>

        <YStack
          borderRadius={20}
          backgroundColor="$heroSurface"
          borderWidth={1}
          borderColor="$heroSurfaceRaised"
          padding={16}
          gap={5}
          overflow="hidden"
          marginBottom={18}
          accessible
          accessibilityRole="summary"
          accessibilityLabel={`Ledger source: ${sourceLabel}`}
        >
          <View
            position="absolute"
            width={112}
            height={112}
            borderRadius={56}
            backgroundColor="$red"
            opacity={0.15}
            right={-46}
            top={-58}
          />
          <View
            position="absolute"
            width={62}
            height={62}
            borderRadius={31}
            backgroundColor="$orange"
            opacity={0.12}
            right={36}
            bottom={-36}
          />
          <Text fontSize={10.5} fontWeight="800" letterSpacing={0.9} color="$onBrand" opacity={0.66}>
            ACTIVE PROVENANCE
          </Text>
          <Text fontSize={15} fontWeight="800" color="$onBrand">{scopeTitle}</Text>
          <Text maxWidth={570} fontSize={11.5} lineHeight={17} color="$onBrand" opacity={0.7}>
            {sourceLabel}
          </Text>
        </YStack>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={onRetry}
            onShowAll={selectedStatementId ? () => onSelectStatement?.(null) : undefined}
          />
        ) : transactions.length === 0 ? (
          <YStack
            borderRadius={22}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$backgroundStrong"
            padding={20}
            alignItems="center"
            gap={10}
          >
            <View width={54} height={54} borderRadius={18} backgroundColor="$surfaceAlt" alignItems="center" justifyContent="center">
              <Rows3 size={23} color="$navy2" strokeWidth={2.1} />
            </View>
            <Text fontSize={17} fontWeight="800" color="$navy" textAlign="center">
              No transactions in this scope
            </Text>
            <Text maxWidth={360} fontSize={12.5} lineHeight={18} color="$navy2" textAlign="center">
              Choose another scope or add a bank CSV to make privacy-safe rows available here.
            </Text>
            <XStack
              width="100%"
              minHeight={50}
              marginTop={5}
              borderRadius={15}
              backgroundColor="$navy"
              alignItems="center"
              justifyContent="center"
              gap={8}
              onPress={openAnalyzer}
              pressStyle={{ opacity: 0.82, scale: 0.99 }}
              accessibilityRole="button"
              accessibilityLabel="Import CSV for Insights transactions"
            >
              <FileUp size={18} color="white" strokeWidth={2.2} />
              <Text color="white" fontSize={13.5} fontWeight="800">Import a CSV</Text>
            </XStack>
          </YStack>
        ) : (
          <YStack gap={14}>
            {refreshError ? <RefreshWarning message={refreshError} onRetry={onRetry} /> : null}

            {ignoredCount > 0 && !selectedStatementId ? (
              <XStack
                padding={13}
                borderRadius={15}
                backgroundColor="$warningSoft"
                alignItems="flex-start"
                gap={9}
                accessible
                accessibilityRole="alert"
              >
                <AlertCircle size={17} color="$warning" strokeWidth={2.2} />
                <Text flex={1} fontSize={12} lineHeight={17} color="$navy2">
                  {ignoredCount.toLocaleString("en-IN")} legacy row{ignoredCount === 1 ? " was" : "s were"} excluded because the privacy-safe schema could not verify {ignoredCount === 1 ? "it" : "them"}.
                </Text>
              </XStack>
            ) : null}

            <XStack
              minHeight={50}
              borderRadius={15}
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$backgroundStrong"
              alignItems="center"
              paddingLeft={14}
              paddingRight={query ? 3 : 13}
              gap={9}
            >
              <Search size={18} color="$ink2" strokeWidth={2.1} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search safe description, category, date or amount"
                placeholderTextColor={brandColors.textMuted}
                selectionColor={brandColors.redIdentity}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Search Insights transaction ledger"
                style={styles.searchInput}
              />
              {query ? (
                <View
                  width={48}
                  height={48}
                  borderRadius={12}
                  alignItems="center"
                  justifyContent="center"
                  onPress={() => setQuery("")}
                  pressStyle={{ opacity: 0.68, scale: 0.96 }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear ledger search"
                >
                  <X size={17} color="$navy2" strokeWidth={2.2} />
                </View>
              ) : null}
            </XStack>

            <XStack gap={8} accessibilityRole="tablist" accessibilityLabel="Ledger direction filter">
              {([
                ["all", "All"],
                ["credit", "Money in"],
                ["debit", "Money out"],
              ] as const).map(([id, label]) => {
                const selected = filter === id;
                return (
                  <XStack
                    key={id}
                    flex={1}
                    minWidth={48}
                    minHeight={48}
                    paddingHorizontal={8}
                    borderRadius={14}
                    borderWidth={1}
                    borderColor={selected ? "$navy" : "$borderColor"}
                    backgroundColor={selected ? "$navy" : "$backgroundStrong"}
                    alignItems="center"
                    justifyContent="center"
                    onPress={() => {
                      if (selected) return;
                      void Haptics.selectionAsync();
                      setFilter(id);
                    }}
                    pressStyle={{ opacity: 0.78, scale: 0.985 }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                  >
                    <Text fontSize={11.5} fontWeight="800" color={selected ? "white" : "$navy2"}>
                      {label}
                    </Text>
                  </XStack>
                );
              })}
            </XStack>

            <XStack alignItems="center" justifyContent="space-between" gap={10}>
              <YStack flex={1} gap={2}>
                <Text fontSize={11.5} color="$ink2">
                  {matchingTransactions.length.toLocaleString("en-IN")} matching row{matchingTransactions.length === 1 ? "" : "s"}
                </Text>
                <Text fontSize={10.5} fontWeight="700" color="$navy2">Privacy-safe fields only</Text>
              </YStack>
              {query || filter !== "all" ? (
                <XStack
                  minHeight={48}
                  paddingHorizontal={14}
                  borderRadius={13}
                  backgroundColor="$surfaceAlt"
                  alignItems="center"
                  justifyContent="center"
                  onPress={resetBrowseControls}
                  pressStyle={{ opacity: 0.72, scale: 0.98 }}
                  accessibilityRole="button"
                  accessibilityLabel="Reset ledger search and filters"
                >
                  <Text fontSize={12} fontWeight="800" color="$navy2">Reset</Text>
                </XStack>
              ) : null}
            </XStack>

            {visibleTransactions.length > 0 ? (
              <YStack gap={8}>
                {visibleTransactions.map((transaction) => (
                  <LedgerRow
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </YStack>
            ) : (
              <YStack
                borderRadius={20}
                backgroundColor="$surfaceAlt"
                padding={20}
                alignItems="center"
                gap={9}
              >
                <Search size={22} color="$navy2" strokeWidth={2.1} />
                <Text fontSize={15} fontWeight="800" color="$navy">No matching rows</Text>
                <Text maxWidth={300} fontSize={12} lineHeight={17} color="$ink2" textAlign="center">
                  Change the search or direction filter to continue browsing this scope.
                </Text>
                <XStack
                  minHeight={48}
                  paddingHorizontal={18}
                  borderRadius={14}
                  backgroundColor="$navy"
                  alignItems="center"
                  justifyContent="center"
                  onPress={resetBrowseControls}
                  pressStyle={{ opacity: 0.8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Reset ledger search and filters"
                >
                  <Text fontSize={12.5} fontWeight="800" color="white">Reset ledger</Text>
                </XStack>
              </YStack>
            )}

            <Text fontSize={11.5} lineHeight={17} color="$ink2" textAlign="center">
              Showing {visibleTransactions.length.toLocaleString("en-IN")} of {matchingTransactions.length.toLocaleString("en-IN")} matching rows in screen-rendering batches of {LEDGER_BATCH_SIZE}. This is not network pagination.
            </Text>

            {hasMore ? (
              <XStack
                minHeight={50}
                borderRadius={15}
                backgroundColor="$navy"
                alignItems="center"
                justifyContent="center"
                gap={8}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setVisibleCount((current) => current + LEDGER_BATCH_SIZE);
                }}
                pressStyle={{ opacity: 0.82, scale: 0.99 }}
                accessibilityRole="button"
                accessibilityLabel={`Reveal ${Math.min(LEDGER_BATCH_SIZE, matchingTransactions.length - visibleTransactions.length)} more transaction rows`}
              >
                <Rows3 size={17} color="white" strokeWidth={2.2} />
                <Text color="white" fontSize={13.5} fontWeight="800">
                  Reveal {Math.min(LEDGER_BATCH_SIZE, matchingTransactions.length - visibleTransactions.length)} more
                </Text>
              </XStack>
            ) : null}
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
}

function StatementManifestCard({
  statement,
  linked,
  onLink,
  onUnlink,
  onViewAnalysis,
}: {
  statement: SavedStatement;
  linked: boolean;
  onLink: () => void;
  onUnlink: () => void;
  onViewAnalysis: () => void;
}) {
  return (
    <YStack
      borderRadius={21}
      borderWidth={1}
      borderColor={linked ? "$red" : "$borderColor"}
      backgroundColor={linked ? "$redSoft" : "$backgroundStrong"}
      padding={16}
      gap={14}
    >
      <XStack alignItems="flex-start" gap={12}>
        <View
          width={46}
          height={52}
          borderRadius={14}
          backgroundColor="$redSoft"
          alignItems="center"
          justifyContent="center"
        >
          <FileCheck2 size={21} color="$red" strokeWidth={2.1} />
        </View>
        <YStack flex={1} gap={4}>
          <XStack alignItems="center" gap={7} flexWrap="wrap">
            <Text flexShrink={1} fontSize={14.5} fontWeight="800" color="$navy" numberOfLines={1}>
              {statement.displayName}
            </Text>
            {linked ? (
              <Text fontSize={9.5} fontWeight="800" letterSpacing={0.55} color="$redDeep">
                LINKED SCOPE
              </Text>
            ) : null}
          </XStack>
          <Text fontSize={11.5} lineHeight={16} color="$ink2">
            {statement.transactionCount.toLocaleString("en-IN")} transactions · {statement.periodStart === statement.periodEnd ? statement.periodStart : `${statement.periodStart} – ${statement.periodEnd}`}
          </Text>
          <XStack alignItems="center" gap={7}>
            <Text fontSize={11.5} color="$ink2">Money out</Text>
            <Money amount={statement.totalSpent} kind="debit" size={12.5} />
          </XStack>
        </YStack>
      </XStack>

      <XStack gap={9} flexWrap="wrap">
        <XStack
          flex={1}
          minWidth={150}
          minHeight={48}
          borderRadius={14}
          backgroundColor={linked ? "$backgroundStrong" : "$redDeep"}
          alignItems="center"
          justifyContent="center"
          gap={7}
          onPress={linked ? onUnlink : onLink}
          pressStyle={{ opacity: 0.8, scale: 0.99 }}
          accessibilityRole="button"
          accessibilityLabel={linked
            ? `Unlink ${statement.displayName} from analysis`
            : `Link ${statement.displayName} to analysis`}
        >
          {linked ? (
            <Unlink2 size={17} color="$navy2" strokeWidth={2.2} />
          ) : (
            <Link2 size={17} color="white" strokeWidth={2.2} />
          )}
          <Text fontSize={12.5} fontWeight="800" color={linked ? "$navy" : "white"}>
            {linked ? "Unlink from analysis" : "Link to analysis"}
          </Text>
        </XStack>

        {linked ? (
          <XStack
            flex={1}
            minWidth={150}
            minHeight={48}
            borderRadius={14}
            borderWidth={1}
            borderColor="$borderColor"
            alignItems="center"
            justifyContent="center"
            gap={7}
            onPress={onViewAnalysis}
            pressStyle={{ opacity: 0.74, scale: 0.99 }}
            accessibilityRole="button"
            accessibilityLabel={`View linked analysis for ${statement.displayName}`}
          >
            <BarChart3 size={17} color="$red" strokeWidth={2.2} />
            <Text fontSize={12.5} fontWeight="800" color="$navy">View linked analysis</Text>
          </XStack>
        ) : null}
      </XStack>
    </YStack>
  );
}

interface StatementsWorkspaceProps {
  activeView: InsightsView;
  onChangeView: (view: InsightsView) => void;
  navigation?: any;
  statements: SavedStatement[];
  loading: boolean;
  error: string | null;
  refreshError: string | null;
  ignoredCount: number;
  selectedStatementId: string | null;
  onRetry?: () => void;
  onSelectStatement?: (statementId: string | null) => void;
}

function StatementsWorkspace({
  activeView,
  onChangeView,
  navigation,
  statements,
  loading,
  error,
  refreshError,
  ignoredCount,
  selectedStatementId,
  onRetry,
  onSelectStatement,
}: StatementsWorkspaceProps) {
  const insets = useSafeAreaInsets();

  const openAnalyzer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate?.("Analyzer");
  };

  const selectStatement = (statementId: string | null) => {
    void Haptics.selectionAsync();
    onSelectStatement?.(statementId);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 15, paddingBottom: insets.bottom + DOCK_CLEARANCE }}
    >
      <YStack width="100%" maxWidth={780} alignSelf="center" paddingHorizontal={PAGE_H}>
        <InsightsViewSelector activeView={activeView} onSelect={onChangeView} />

        <YStack marginTop={21} marginBottom={16} gap={7}>
          <XStack alignItems="center" gap={7}>
            <FileSpreadsheet size={15} color="$red" strokeWidth={2.2} />
            <Text fontSize={11.5} fontWeight="800" letterSpacing={0.75} color="$ink2">
              CSV INSIGHTS WORKSPACE
            </Text>
          </XStack>
          <Text accessibilityRole="header" fontSize={27} lineHeight={33} fontWeight="800" color="$navy" letterSpacing={-0.75}>
            Saved statements
          </Text>
          <Text maxWidth={630} fontSize={13} lineHeight={19} color="$navy2">
            Link one saved manifest to set the active Analysis and Transactions scope. Linking never uploads, edits, or deletes a record.
          </Text>
        </YStack>

        {loading && statements.length === 0 ? (
          <YStack gap={10} accessibilityRole="progressbar" accessibilityLabel="Loading saved statements">
            {[0, 1, 2].map((item) => (
              <View key={item} height={128} borderRadius={21} backgroundColor="$surfaceAlt" />
            ))}
          </YStack>
        ) : error && statements.length === 0 ? (
          <YStack gap={12}>
            <XStack
              padding={14}
              borderRadius={16}
              backgroundColor="$dangerSoft"
              alignItems="flex-start"
              gap={10}
              accessible
              accessibilityRole="alert"
            >
              <AlertCircle size={19} color="$danger" strokeWidth={2.2} />
              <YStack flex={1} gap={3}>
                <Text fontSize={14} fontWeight="800" color="$navy">Saved statements couldn’t load</Text>
                <Text fontSize={12.5} lineHeight={18} color="$navy2">{error}</Text>
              </YStack>
            </XStack>
            <XStack
              minHeight={50}
              borderRadius={15}
              backgroundColor="$navy"
              alignItems="center"
              justifyContent="center"
              gap={8}
              onPress={onRetry}
              pressStyle={{ opacity: 0.82 }}
              accessibilityRole="button"
              accessibilityLabel="Retry loading saved statements"
            >
              <RefreshCw size={17} color="white" strokeWidth={2.2} />
              <Text color="white" fontSize={13.5} fontWeight="800">Try again</Text>
            </XStack>
          </YStack>
        ) : statements.length === 0 ? (
          <YStack
            borderRadius={23}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$backgroundStrong"
            padding={20}
            alignItems="center"
            gap={10}
          >
            <View width={56} height={56} borderRadius={18} backgroundColor="$redSoft" alignItems="center" justifyContent="center">
              <FileSpreadsheet size={24} color="$red" strokeWidth={2.1} />
            </View>
            <Text fontSize={18} fontWeight="800" color="$navy" textAlign="center">No saved statements yet</Text>
            <Text maxWidth={350} fontSize={12.5} lineHeight={18} color="$navy2" textAlign="center">
              Import a bank CSV to create a privacy-safe manifest and make it available for linking here.
            </Text>
            <XStack
              width="100%"
              minHeight={50}
              marginTop={5}
              borderRadius={15}
              backgroundColor="$navy"
              alignItems="center"
              justifyContent="center"
              gap={8}
              onPress={openAnalyzer}
              pressStyle={{ opacity: 0.82, scale: 0.99 }}
              accessibilityRole="button"
              accessibilityLabel="Import CSV to saved statements"
            >
              <FileUp size={18} color="white" strokeWidth={2.2} />
              <Text color="white" fontSize={13.5} fontWeight="800">Import a CSV</Text>
            </XStack>
          </YStack>
        ) : (
          <YStack gap={12}>
            {refreshError ? <RefreshWarning message={refreshError} onRetry={onRetry} /> : null}
            {ignoredCount > 0 ? (
              <XStack
                padding={13}
                borderRadius={15}
                backgroundColor="$warningSoft"
                alignItems="flex-start"
                gap={9}
                accessible
                accessibilityRole="alert"
              >
                <AlertCircle size={17} color="$warning" strokeWidth={2.2} />
                <Text flex={1} fontSize={12} lineHeight={17} color="$navy2">
                  {ignoredCount.toLocaleString("en-IN")} saved record{ignoredCount === 1 ? " was" : "s were"} hidden because {ignoredCount === 1 ? "it does" : "they do"} not match the privacy-safe manifest schema.
                </Text>
              </XStack>
            ) : null}

            {statements.map((statement) => {
              const linked = statement.id === selectedStatementId;
              return (
                <StatementManifestCard
                  key={statement.id}
                  statement={statement}
                  linked={linked}
                  onLink={() => selectStatement(statement.id)}
                  onUnlink={() => selectStatement(null)}
                  onViewAnalysis={() => onChangeView("analysis")}
                />
              );
            })}

            <XStack
              minHeight={50}
              marginTop={3}
              borderRadius={15}
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$backgroundStrong"
              alignItems="center"
              justifyContent="center"
              gap={8}
              onPress={openAnalyzer}
              pressStyle={{ opacity: 0.72, scale: 0.99 }}
              accessibilityRole="button"
              accessibilityLabel="Import another CSV statement"
            >
              <FileUp size={18} color="$navy2" strokeWidth={2.2} />
              <Text color="$navy" fontSize={13.5} fontWeight="800">Import another CSV</Text>
            </XStack>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  );
}

function SignalRow({
  icon: Icon,
  label,
  value,
  detail,
  last,
}: {
  icon: typeof Store;
  label: string;
  value: string;
  detail: string;
  last: boolean;
}) {
  return (
    <XStack
      alignItems="center"
      gap={12}
      paddingBottom={last ? 0 : 15}
      marginBottom={last ? 0 : 15}
      borderBottomWidth={last ? 0 : 1}
      borderBottomColor="$borderColor"
    >
      <View
        width={40}
        height={40}
        borderRadius={13}
        backgroundColor="$surfaceAlt"
        alignItems="center"
        justifyContent="center"
      >
        <Icon size={18} color="$navy2" strokeWidth={2.1} />
      </View>
      <YStack flex={1} gap={2}>
        <Text fontSize={12} color="$ink2">{label}</Text>
        <Text fontSize={14} fontWeight="800" color="$navy" numberOfLines={1}>{value}</Text>
      </YStack>
      <Text maxWidth={104} textAlign="right" fontSize={12} lineHeight={17} color="$navy2">
        {detail}
      </Text>
    </XStack>
  );
}

export function InsightsContent({
  navigation,
  view,
  onChangeView,
  transactions = [],
  insights: providedInsights,
  ignoredCount = 0,
  loading = false,
  error = null,
  refreshError = null,
  onRetry,
  statements = [],
  statementsLoading = false,
  statementsError = null,
  statementsRefreshError = null,
  statementsIgnoredCount = 0,
  onRetryStatements,
  selectedStatementId = null,
  selectedStatementDetail = null,
  selectedStatementLoading = false,
  selectedStatementError = null,
  selectedStatementRefreshError = null,
  onSelectStatement,
  onRetrySelectedStatement,
  parentPagerGesture,
}: InsightsContentProps) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [internalView, setInternalView] = useState<InsightsView>("analysis");
  const activeView = view ?? internalView;
  const { profile, user } = useAuth();
  const accountName = (profile?.fullName || user?.displayName || "Your").trim();
  const aggregateInsights = providedInsights
    ?? buildFinancialInsights(transactions) as FinancialInsights;
  const matchingSelectedDetail = selectedStatementDetail?.statement.id === selectedStatementId
    ? selectedStatementDetail
    : null;
  const selectedManifest = matchingSelectedDetail?.statement
    ?? statements.find((statement) => statement.id === selectedStatementId)
    ?? null;
  const scopedTransactions = selectedStatementId
    ? matchingSelectedDetail?.transactions ?? []
    : transactions;
  const scopedInsights = selectedStatementId
    ? matchingSelectedDetail?.insights
      ?? buildFinancialInsights(scopedTransactions) as FinancialInsights
    : aggregateInsights;
  const scopedLoading = selectedStatementId ? selectedStatementLoading : loading;
  const scopedError = selectedStatementId ? selectedStatementError : error;
  const scopedRefreshError = selectedStatementId
    ? selectedStatementRefreshError
    : refreshError;
  const scopeTitle = selectedStatementId
    ? selectedManifest?.displayName ?? "Saved statement"
    : "All imported activity";

  const changeView = (nextView: InsightsView) => {
    if (nextView === activeView) return;
    if (view === undefined) setInternalView(nextView);
    onChangeView?.(nextView);
  };

  const openAnalyzer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate?.("Analyzer");
  };

  const openLibrary = () => {
    void Haptics.selectionAsync();
    changeView("statements");
  };

  if (activeView === "transactions") {
    return (
      <ScopedTransactionsWorkspace
        activeView={activeView}
        onChangeView={changeView}
        navigation={navigation}
        scopeTitle={scopeTitle}
        scopeKey={selectedStatementId ?? "all-activity"}
        selectedManifest={selectedManifest}
        selectedStatementId={selectedStatementId}
        statements={statements}
        statementsLoading={statementsLoading}
        transactions={scopedTransactions}
        loading={scopedLoading}
        error={scopedError}
        refreshError={scopedRefreshError}
        ignoredCount={ignoredCount}
        onRetry={selectedStatementId ? onRetrySelectedStatement : onRetry}
        onSelectStatement={onSelectStatement}
        parentPagerGesture={parentPagerGesture}
      />
    );
  }

  if (activeView === "statements") {
    return (
      <StatementsWorkspace
        activeView={activeView}
        onChangeView={changeView}
        navigation={navigation}
        statements={statements}
        loading={statementsLoading}
        error={statementsError}
        refreshError={statementsRefreshError}
        ignoredCount={statementsIgnoredCount}
        selectedStatementId={selectedStatementId}
        onRetry={onRetryStatements}
        onSelectStatement={onSelectStatement}
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + DOCK_CLEARANCE }}
    >
      <YStack width="100%" maxWidth={780} alignSelf="center" paddingHorizontal={PAGE_H}>
        <InsightsViewSelector activeView={activeView} onSelect={changeView} />

        <YStack gap={7} marginTop={21} marginBottom={15}>
          <XStack alignItems="center" gap={7}>
            <Landmark size={15} color="$orangeDeep" strokeWidth={2.2} />
            <Text fontSize={12.5} color="$navy2" fontWeight="700">
              {accountName === "Your" ? "Your private account" : `${accountName}’s private account`}
            </Text>
          </XStack>
          <Text accessibilityRole="header" fontSize={26} lineHeight={32} fontWeight="800" color="$navy" letterSpacing={-0.7}>
            {scopeTitle}
          </Text>
          <Text maxWidth={650} fontSize={13.5} color="$navy2" lineHeight={20}>
            {selectedStatementId
              ? matchingSelectedDetail
                ? `${scopedTransactions.length.toLocaleString("en-IN")} privacy-safe transactions in this saved statement · ${scopedInsights.periodLabel}`
                : selectedStatementLoading
                  ? "Opening this saved statement analysis."
                  : selectedManifest
                    ? `${selectedManifest.transactionCount.toLocaleString("en-IN")} transactions are listed for this saved statement.`
                    : "This saved statement analysis is not available right now."
              : transactions.length > 0
                ? `${transactions.length.toLocaleString("en-IN")} privacy-safe account transactions · ${scopedInsights.periodLabel}`
                : "Choose a saved statement or import one once to keep its privacy-safe analysis available here."}
          </Text>
        </YStack>

        <YStack gap={8} marginBottom={19}>
          <Text fontSize={12} fontWeight="800" color="$ink2">Insight scope</Text>
          <StatementScopePicker
            statements={statements}
            selectedStatementId={selectedStatementId}
            loading={statementsLoading}
            onSelect={onSelectStatement}
            onOpenLibrary={openLibrary}
            parentPagerGesture={parentPagerGesture}
          />
          {statementsError ? (
            <Text fontSize={12} lineHeight={17} color="$danger" accessibilityRole="alert">
              Saved statement names could not be refreshed. {statementsError}
            </Text>
          ) : null}
        </YStack>

        {scopedLoading ? (
          <LoadingState />
        ) : scopedError ? (
          <ErrorState
            message={scopedError}
            onRetry={selectedStatementId ? onRetrySelectedStatement : onRetry}
            onShowAll={selectedStatementId ? () => onSelectStatement?.(null) : undefined}
          />
        ) : scopedTransactions.length === 0 && !selectedStatementId && ignoredCount > 0 ? (
          <ErrorState
            message={`${ignoredCount.toLocaleString("en-IN")} cloud record${ignoredCount === 1 ? " exists" : "s exist"}, but ${ignoredCount === 1 ? "it does" : "they do"} not match the current privacy-safe schema, so verified insights cannot be calculated yet.`}
            onRetry={onRetry}
          />
        ) : scopedTransactions.length === 0 ? (
          <Card>
            <YStack alignItems="center" gap={11} paddingVertical={9}>
              <View
                width={56}
                height={56}
                borderRadius={18}
                backgroundColor="$redSoft"
                alignItems="center"
                justifyContent="center"
              >
                <ScanSearch size={26} color="$red" strokeWidth={2} />
              </View>
              <Text fontSize={18} fontWeight="800" color="$navy" textAlign="center">
                No activity available yet
              </Text>
              <Text maxWidth={340} fontSize={13.5} lineHeight={20} color="$navy2" textAlign="center">
                Insights appear whenever privacy-safe transactions are available. You can import a bank CSV now; message-derived analysis stays off until a secure source is connected with explicit permission.
              </Text>
              <XStack
                width="100%"
                minHeight={50}
                marginTop={5}
                borderRadius={15}
                backgroundColor="$navy"
                alignItems="center"
                justifyContent="center"
                gap={8}
                onPress={openAnalyzer}
                pressStyle={{ opacity: 0.84, scale: 0.99 }}
                accessibilityRole="button"
                accessibilityLabel="Import CSV for insights"
              >
                <FileUp size={18} color="white" strokeWidth={2.2} />
                <Text color="white" fontSize={14} fontWeight="800">
                  Import a statement once
                </Text>
              </XStack>
            </YStack>
          </Card>
        ) : (
          <MotiView
            key={selectedStatementId ?? "all-activity"}
            from={{ opacity: reducedMotion ? 1 : 0.78, translateY: reducedMotion ? 0 : 7 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: reducedMotion ? 1 : 190 }}
          >
            <YStack gap={24}>
              {scopedRefreshError ? (
                <RefreshWarning
                  message={scopedRefreshError}
                  onRetry={selectedStatementId ? onRetrySelectedStatement : onRetry}
                />
              ) : null}

              <YStack
                borderRadius={24}
                backgroundColor="$heroSurface"
                borderWidth={1}
                borderColor="$heroSurfaceRaised"
                padding={18}
                gap={17}
                overflow="hidden"
                accessible
                accessibilityRole="summary"
                accessibilityLabel={`Net cash flow ${scopedInsights.netCashFlow} rupees. Money in ${scopedInsights.totalIncome} rupees. Money out ${scopedInsights.totalSpent} rupees.`}
              >
                <View
                  position="absolute"
                  width={170}
                  height={170}
                  borderRadius={85}
                  backgroundColor="$red"
                  opacity={0.14}
                  right={-72}
                  top={-92}
                />
                <View
                  position="absolute"
                  width={74}
                  height={74}
                  borderRadius={37}
                  backgroundColor="$orange"
                  opacity={0.1}
                  right={46}
                  bottom={-42}
                />
                <XStack alignItems="flex-start" justifyContent="space-between" gap={14}>
                  <YStack flex={1} gap={4}>
                    <Text fontSize={12.5} color="$onBrand" opacity={0.68}>Financial position</Text>
                    <Text fontSize={17} lineHeight={23} fontWeight="800" color="$onBrand">
                      {scopedInsights.netCashFlow >= 0
                        ? "Money in stayed ahead of spending"
                        : "Spending ran ahead of money in"}
                    </Text>
                  </YStack>
                  <Money
                    amount={Math.abs(scopedInsights.netCashFlow)}
                    kind={scopedInsights.netCashFlow >= 0 ? "credit" : "debit"}
                    signed
                    size={18}
                    color={brandColors.white}
                    decColor={brandColors.borderStrong}
                  />
                </XStack>

                <XStack gap={10} flexWrap="wrap">
                  <YStack
                    flex={1}
                    minWidth={124}
                    padding={12}
                    borderRadius={14}
                    backgroundColor="$heroSurfaceRaised"
                    gap={5}
                  >
                    <Text fontSize={12} color="$onBrand" opacity={0.66}>Money in</Text>
                    <Money
                      amount={scopedInsights.totalIncome}
                      kind="credit"
                      size={15.5}
                      color={brandColors.white}
                      decColor={brandColors.borderStrong}
                    />
                  </YStack>
                  <YStack
                    flex={1}
                    minWidth={124}
                    padding={12}
                    borderRadius={14}
                    backgroundColor="$heroSurfaceRaised"
                    gap={5}
                  >
                    <Text fontSize={12} color="$onBrand" opacity={0.66}>Money out</Text>
                    <Money
                      amount={scopedInsights.totalSpent}
                      kind="none"
                      size={15.5}
                      color={brandColors.white}
                      decColor={brandColors.borderStrong}
                    />
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap={8}>
                  {scopedInsights.savingsRate !== null && scopedInsights.savingsRate >= 0 ? (
                    <TrendingUp size={16} color="$success" strokeWidth={2.2} />
                  ) : (
                    <TrendingDown size={16} color="$danger" strokeWidth={2.2} />
                  )}
                  <Text flex={1} fontSize={12.5} lineHeight={18} color="$onBrand" opacity={0.76}>
                    {scopedInsights.savingsRate === null
                      ? "No money-in records were available for a cash-flow rate."
                      : `${Math.abs(Math.round(scopedInsights.savingsRate))}% ${scopedInsights.savingsRate >= 0 ? "of money in remained after spending" : "more was spent than came in"}.`}
                  </Text>
                </XStack>
              </YStack>

              {scopedInsights.monthlyActivity.length > 0 ? (
                <YStack gap={11}>
                  <YStack gap={3}>
                    <Text accessibilityRole="header" fontSize={18} fontWeight="800" color="$navy" letterSpacing={-0.35}>
                      Cash-flow movement
                    </Text>
                    <Text fontSize={12.5} lineHeight={18} color="$ink2">
                      Compare months without losing the original scale.
                    </Text>
                  </YStack>
                  <Card padding={17}>
                    <MonthlyCashFlowChart
                      data={scopedInsights.monthlyActivity}
                      parentPagerGesture={parentPagerGesture}
                    />
                  </Card>
                </YStack>
              ) : null}

              {scopedInsights.categoryBreakdown.length > 0 ? (
                <YStack gap={11}>
                  <YStack gap={3}>
                    <Text accessibilityRole="header" fontSize={18} fontWeight="800" color="$navy" letterSpacing={-0.35}>
                      Where spending went
                    </Text>
                    <Text fontSize={12.5} lineHeight={18} color="$ink2">
                      Tap a category to inspect its share and activity.
                    </Text>
                  </YStack>
                  <Card padding={17}>
                    <CategoryHistogram data={scopedInsights.categoryBreakdown} maxItems={10} />
                  </Card>
                </YStack>
              ) : null}

              <YStack gap={11}>
                <Text accessibilityRole="header" fontSize={18} fontWeight="800" color="$navy" letterSpacing={-0.35}>
                  Signals worth reviewing
                </Text>
                <YStack
                  paddingVertical={16}
                  borderTopWidth={1}
                  borderBottomWidth={1}
                  borderColor="$borderColor"
                >
                  <SignalRow
                    icon={Store}
                    label="Top merchant"
                    value={scopedInsights.topMerchant?.merchant ?? "No merchant pattern"}
                    detail={scopedInsights.topMerchant
                      ? `₹${Math.round(scopedInsights.topMerchant.amount).toLocaleString("en-IN")} · ${scopedInsights.topMerchant.count} debit${scopedInsights.topMerchant.count === 1 ? "" : "s"}`
                      : "Not enough activity"}
                    last={false}
                  />
                  <SignalRow
                    icon={ReceiptText}
                    label="Largest debit"
                    value={scopedInsights.largestDebit
                      ? transactionMerchantLabel(scopedInsights.largestDebit)
                      : "No debit found"}
                    detail={scopedInsights.largestDebit
                      ? `₹${Math.round(scopedInsights.largestDebit.amount).toLocaleString("en-IN")}`
                      : "—"}
                    last={false}
                  />
                  <SignalRow
                    icon={CalendarDays}
                    label="Average debit"
                    value={`₹${Math.round(scopedInsights.averageDebit).toLocaleString("en-IN")}`}
                    detail={`${scopedInsights.recurringMerchants.length} recurring merchant${scopedInsights.recurringMerchants.length === 1 ? "" : "s"}`}
                    last
                  />
                </YStack>
              </YStack>

              <YStack gap={11}>
                <Text accessibilityRole="header" fontSize={18} fontWeight="800" color="$navy" letterSpacing={-0.35}>
                  What this activity shows
                </Text>
                <YStack
                  paddingVertical={16}
                  borderTopWidth={1}
                  borderBottomWidth={1}
                  borderColor="$borderColor"
                >
                  {scopedInsights.observations.map((observation, index) => (
                    <ObservationRow
                      key={observation.id}
                      observation={observation}
                      last={index === scopedInsights.observations.length - 1}
                    />
                  ))}
                </YStack>
                <Text fontSize={12} lineHeight={17} color="$ink2">
                  Based on {scopedTransactions.length.toLocaleString("en-IN")} privacy-safe transaction{scopedTransactions.length === 1 ? "" : "s"} from {scopedInsights.periodLabel}. These are deterministic patterns, not financial advice.
                </Text>
              </YStack>

              <XStack
                alignItems="flex-start"
                gap={10}
                padding={14}
                borderRadius={16}
                borderWidth={1}
                borderColor="$gold"
                backgroundColor="$orangeSoft"
                accessible
                accessibilityRole="summary"
              >
                <ShieldCheck size={18} color="$orangeDeep" strokeWidth={2.2} />
                <Text flex={1} fontSize={12.5} lineHeight={18} color="$navy2">
                  Stored under this signed-in account: sanitized dates, amounts, directions, categories, and masked descriptions. The original CSV and account identifiers are not stored.
                </Text>
              </XStack>

              {ignoredCount > 0 && !selectedStatementId ? (
                <Text fontSize={12} color="$navy2" lineHeight={17} textAlign="center">
                  {ignoredCount.toLocaleString("en-IN")} legacy record{ignoredCount === 1 ? " was" : "s were"} excluded because they did not meet the privacy-safe schema.
                </Text>
              ) : null}

              <XStack
                minHeight={58}
                paddingHorizontal={14}
                borderRadius={17}
                backgroundColor="$surfaceAlt"
                alignItems="center"
                gap={12}
                onPress={openLibrary}
                pressStyle={{ opacity: 0.76, scale: 0.99 }}
                accessibilityRole="button"
                accessibilityLabel="Manage saved statements"
              >
                <View
                  width={40}
                  height={40}
                  borderRadius={13}
                  backgroundColor="$redSoft"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FileSpreadsheet size={19} color="$red" strokeWidth={2.15} />
                </View>
                <YStack flex={1} gap={2}>
                  <Text fontSize={13.5} fontWeight="800" color="$navy">Saved statements</Text>
                  <Text fontSize={11.5} color="$ink2">Manage links and active Insights scope</Text>
                </YStack>
                <ArrowRight size={17} color="$navy2" strokeWidth={2.2} />
              </XStack>

              <XStack
                minHeight={50}
                borderRadius={15}
                borderWidth={1}
                borderColor="$borderColor"
                backgroundColor="$backgroundStrong"
                alignItems="center"
                justifyContent="center"
                gap={8}
                onPress={openAnalyzer}
                pressStyle={{ opacity: 0.72, scale: 0.99 }}
                accessibilityRole="button"
                accessibilityLabel="Import another CSV statement for analysis"
              >
                <FileUp size={18} color="$navy2" strokeWidth={2.2} />
                <Text color="$navy" fontSize={13.5} fontWeight="800">
                  Add another statement
                </Text>
              </XStack>
            </YStack>
          </MotiView>
        )}
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 0,
    paddingVertical: 0,
    color: brandColors.charcoal,
    fontSize: 13,
    fontWeight: "600",
  },
});
