import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useSharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { FinSightShell } from "../components/finsight";
import { useAuth } from "../context/AuthContext";
import {
  loadPrivateStatement,
  loadPrivateStatements,
  loadPrivateTransactions,
} from "../services/transactionService";
import { buildFinancialInsights } from "../services/financialInsights";
import type {
  FinancialInsights,
  PrivateTransaction,
  SavedStatement,
  SavedStatementDetail,
} from "../types/transactions";
import { HomePager } from "./home/HomePager";
import { isMainTab, useHomePagerCoordinator } from "./home/HomePagerCoordinator";
import { OverviewContent } from "./home/OverviewContent";
import { TransactionsContent } from "./home/TransactionsContent";
import {
  InsightsContent,
  type InsightsView,
} from "./home/InsightsContent";

interface TransactionState {
  transactions: PrivateTransaction[];
  ignoredCount: number;
  loading: boolean;
  error: string | null;
  refreshError: string | null;
}

interface StatementState {
  statements: SavedStatement[];
  ignoredCount: number;
  loading: boolean;
  error: string | null;
  refreshError: string | null;
}

interface SelectedStatementState {
  statementId: string | null;
  detail: SavedStatementDetail | null;
  loading: boolean;
  error: string | null;
  refreshError: string | null;
}

const EMPTY_TRANSACTION_STATE: TransactionState = {
  transactions: [],
  ignoredCount: 0,
  loading: false,
  error: null,
  refreshError: null,
};

const EMPTY_STATEMENT_STATE: StatementState = {
  statements: [],
  ignoredCount: 0,
  loading: false,
  error: null,
  refreshError: null,
};

const EMPTY_SELECTED_STATEMENT_STATE: SelectedStatementState = {
  statementId: null,
  detail: null,
  loading: false,
  error: null,
  refreshError: null,
};

const STATEMENT_ID_PATTERN = /^stmt_[a-f0-9]{16}$/;

function isInsightsView(value: unknown): value is InsightsView {
  return value === "analysis" || value === "transactions" || value === "statements";
}

export function HomeScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const { logout, user } = useAuth();
  const coordinator = useHomePagerCoordinator();
  const {
    committedIndex,
    committedTab,
    pendingRequest,
    requestExternalPage,
    requestPage,
  } = coordinator;
  const isFocused = useIsFocused();
  const paramTab: unknown = route?.params?.tab;
  const paramStatementId: unknown = route?.params?.statementId;
  const paramInsightsView: unknown = route?.params?.insightsView;
  const [insightsView, setInsightsView] = useState<InsightsView>(
    isInsightsView(paramInsightsView) ? paramInsightsView : "analysis",
  );
  const [transactionState, setTransactionState] = useState<TransactionState>({
    ...EMPTY_TRANSACTION_STATE,
    loading: Boolean(user?.uid),
  });
  const [statementState, setStatementState] = useState<StatementState>({
    ...EMPTY_STATEMENT_STATE,
    loading: Boolean(user?.uid),
  });
  const [selectedStatementState, setSelectedStatementState] =
    useState<SelectedStatementState>(EMPTY_SELECTED_STATEMENT_STATE);
  const selectedStatementId = selectedStatementState.statementId;
  const transactionRequestRef = useRef(0);
  const statementRequestRef = useRef(0);
  const selectedStatementRequestRef = useRef(0);
  const activeUserUidRef = useRef<string | null>(user?.uid ?? null);
  activeUserUidRef.current = user?.uid ?? null;
  const selectedStatementIdRef = useRef<string | null>(null);
  const selectedStatementCacheRef = useRef(new Map<string, SavedStatementDetail>());

  const pageProgress = useSharedValue<number>(committedIndex);
  const observedRouteTabRef = useRef<{ initialized: boolean; value: unknown }>({
    initialized: false,
    value: undefined,
  });
  const observedStatementParamRef = useRef<unknown>(undefined);
  const observedInsightsViewParamRef = useRef<unknown>(paramInsightsView);

  const refreshTransactions = useCallback(async () => {
    const requestId = transactionRequestRef.current + 1;
    transactionRequestRef.current = requestId;

    if (!user?.uid) {
      setTransactionState(EMPTY_TRANSACTION_STATE);
      return;
    }

    const requestUid = user.uid;
    setTransactionState((current) => ({
      ...current,
      loading: current.transactions.length === 0,
      error: null,
      refreshError: null,
    }));
    try {
      const result = await loadPrivateTransactions(requestUid);
      if (
        transactionRequestRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      setTransactionState({
        transactions: result.transactions,
        ignoredCount: result.ignoredCount,
        loading: false,
        error: null,
        refreshError: null,
      });
    } catch (error) {
      if (
        transactionRequestRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Your private transactions could not be loaded. Try again.";
      setTransactionState((current) => current.transactions.length > 0
        ? {
          ...current,
          loading: false,
          error: null,
          refreshError: message,
        }
        : {
          ...current,
          loading: false,
          error: message,
          refreshError: null,
        });
    }
  }, [user?.uid]);

  const refreshStatements = useCallback(async () => {
    const requestId = statementRequestRef.current + 1;
    statementRequestRef.current = requestId;

    if (!user?.uid) {
      setStatementState(EMPTY_STATEMENT_STATE);
      return;
    }
    if (typeof loadPrivateStatements !== "function") {
      setStatementState(EMPTY_STATEMENT_STATE);
      return;
    }

    const requestUid = user.uid;
    setStatementState((current) => ({
      ...current,
      loading: current.statements.length === 0,
      error: null,
      refreshError: null,
    }));
    try {
      const result = await loadPrivateStatements(requestUid);
      if (
        statementRequestRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      setStatementState({
        statements: result.statements,
        ignoredCount: result.ignoredCount,
        loading: false,
        error: result.statements.length === 0 && result.ignoredCount > 0
          ? `${result.ignoredCount.toLocaleString("en-IN")} saved cloud record${result.ignoredCount === 1 ? " exists" : "s exist"}, but ${result.ignoredCount === 1 ? "it does" : "they do"} not match the current privacy-safe analysis schema.`
          : null,
        refreshError: null,
      });
    } catch (error) {
      if (
        statementRequestRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Your saved analyses could not be loaded. Try again.";
      setStatementState((current) => current.statements.length > 0
        ? {
          ...current,
          loading: false,
          error: null,
          refreshError: message,
        }
        : {
          ...current,
          loading: false,
          error: message,
          refreshError: null,
        });
    }
  }, [user?.uid]);

  const loadInsightStatement = useCallback(async (
    statementId: string | null,
    force = false,
  ) => {
    const requestId = selectedStatementRequestRef.current + 1;
    selectedStatementRequestRef.current = requestId;

    if (!statementId) {
      selectedStatementIdRef.current = null;
      setSelectedStatementState(EMPTY_SELECTED_STATEMENT_STATE);
      return;
    }
    if (!STATEMENT_ID_PATTERN.test(statementId)) return;

    selectedStatementIdRef.current = statementId;
    const cachedEntry = selectedStatementCacheRef.current.get(statementId) ?? null;
    const cached = cachedEntry?.statement.id === statementId ? cachedEntry : null;
    if (cachedEntry && !cached) selectedStatementCacheRef.current.delete(statementId);

    if (cached && !force) {
      setSelectedStatementState({
        statementId,
        detail: cached,
        loading: false,
        error: null,
        refreshError: null,
      });
      return;
    }

    const requestUid = user?.uid ?? null;
    if (!requestUid || typeof loadPrivateStatement !== "function") {
      setSelectedStatementState({
        statementId,
        detail: cached,
        loading: false,
        error: cached ? null : "Sign in to open this saved analysis.",
        refreshError: cached ? "The saved analysis could not be refreshed." : null,
      });
      return;
    }

    setSelectedStatementState({
      statementId,
      detail: cached,
      loading: !cached,
      error: null,
      refreshError: null,
    });
    try {
      const detail = await loadPrivateStatement(requestUid, statementId);
      if (
        selectedStatementRequestRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      if (detail.statement.id !== statementId) {
        throw new Error("The saved analysis response did not match the selected statement.");
      }
      selectedStatementCacheRef.current.set(statementId, detail);
      setSelectedStatementState({
        statementId,
        detail,
        loading: false,
        error: null,
        refreshError: null,
      });
    } catch (error) {
      if (
        selectedStatementRequestRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      const message = error instanceof Error && error.message.trim()
        ? error.message
        : "This saved analysis could not be opened. Try again.";
      setSelectedStatementState({
        statementId,
        detail: cached,
        loading: false,
        error: cached ? null : message,
        refreshError: cached ? message : null,
      });
    }
  }, [user?.uid]);

  useEffect(() => {
    transactionRequestRef.current += 1;
    statementRequestRef.current += 1;
    selectedStatementRequestRef.current += 1;
    selectedStatementIdRef.current = null;
    selectedStatementCacheRef.current.clear();
    setTransactionState({
      ...EMPTY_TRANSACTION_STATE,
      loading: Boolean(user?.uid),
    });
    setStatementState({
      ...EMPTY_STATEMENT_STATE,
      loading: Boolean(user?.uid),
    });
    setSelectedStatementState(EMPTY_SELECTED_STATEMENT_STATE);
    observedStatementParamRef.current = undefined;
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void refreshTransactions();
      void refreshStatements();
      const activeStatementId = selectedStatementIdRef.current;
      if (activeStatementId) void loadInsightStatement(activeStatementId);
      return () => {
        transactionRequestRef.current += 1;
        statementRequestRef.current += 1;
        selectedStatementRequestRef.current += 1;
      };
    }, [loadInsightStatement, refreshStatements, refreshTransactions]),
  );

  useEffect(() => {
    if (!isFocused || !isMainTab(paramTab)) return;

    const observation = observedRouteTabRef.current;
    if (observation.initialized && observation.value === paramTab) return;

    const isFirstObservation = !observation.initialized;
    observation.initialized = true;
    observation.value = paramTab;

    if (isFirstObservation && pendingRequest) return;
    requestExternalPage(paramTab, true);
  }, [isFocused, paramTab, pendingRequest, requestExternalPage]);

  useEffect(() => {
    if (!isFocused || paramStatementId === observedStatementParamRef.current) return;
    observedStatementParamRef.current = paramStatementId;
    if (typeof paramStatementId === "string" && STATEMENT_ID_PATTERN.test(paramStatementId)) {
      void loadInsightStatement(paramStatementId);
    } else if (paramStatementId === null) {
      void loadInsightStatement(null);
    }
  }, [isFocused, loadInsightStatement, paramStatementId]);

  useEffect(() => {
    if (!isFocused || paramInsightsView === observedInsightsViewParamRef.current) return;
    observedInsightsViewParamRef.current = paramInsightsView;
    if (isInsightsView(paramInsightsView)) setInsightsView(paramInsightsView);
  }, [isFocused, paramInsightsView]);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (committedTab === "Overview" || navigation?.canGoBack?.()) return false;

        const request = requestPage("Overview", "android-back", true);
        if (request) void Haptics.selectionAsync();
        return true;
      };
      const subscription = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => subscription.remove();
    }, [committedTab, navigation, requestPage]),
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // AuthContext retains the user-safe error while the session remains active.
    }
  };

  const openProfileSection = (section: string) => navigation?.navigate?.("Profile", { section });

  const handleCommitTab = useCallback(
    (tab: string) => {
      navigation?.setParams?.({ tab });
    },
    [navigation],
  );

  const handleHeaderTab = useCallback(
    (tab: "Overview" | "Transactions" | "Insights") =>
      requestPage(tab, "header", true) !== null,
    [requestPage],
  );

  const handleInsightsView = useCallback(
    (nextView: InsightsView) => {
      setInsightsView(nextView);
      navigation?.setParams?.({ insightsView: nextView });
    },
    [navigation],
  );

  const handleOpenCsvWorkspace = useCallback(() => {
    const changedSubview = insightsView !== "statements";
    if (changedSubview) handleInsightsView("statements");

    if (committedTab === "Insights") return changedSubview;
    const request = requestPage("Insights", "header", true);
    return changedSubview || request !== null;
  }, [committedTab, handleInsightsView, insightsView, requestPage]);

  const handleSelectStatement = useCallback(
    (statementId: string | null) => {
      if (typeof navigation?.setParams === "function") {
        navigation.setParams({ statementId });
        return;
      }
      void loadInsightStatement(statementId);
    },
    [loadInsightStatement, navigation],
  );

  const transactionInsights = useMemo(
    () => buildFinancialInsights(transactionState.transactions) as FinancialInsights,
    [transactionState.transactions],
  );

  return (
    <FinSightShell
      curved
      activeTab={committedTab}
      onChangeTab={handleHeaderTab}
      pageProgress={pageProgress}
      onOpenCsvWorkspace={handleOpenCsvWorkspace}
      csvWorkspaceSelected={committedTab === "Insights" && insightsView === "statements"}
      onProfile={() => navigation?.navigate?.("Profile")}
      onSettings={() => navigation?.navigate?.("Profile")}
      onNotifications={() => openProfileSection("notifications")}
      onHelp={() => openProfileSection("help")}
      onLogout={handleLogout}
    >
      <HomePager
        settledTab={committedTab}
        onCommitTab={handleCommitTab}
        pageProgress={pageProgress}
        pages={[
          <OverviewContent key="Overview" navigation={navigation} />,
          <TransactionsContent key="Transactions" navigation={navigation} />,
          <InsightsContent
            key="Insights"
            navigation={navigation}
            view={insightsView}
            onChangeView={handleInsightsView}
            transactions={transactionState.transactions}
            insights={transactionInsights}
            ignoredCount={transactionState.ignoredCount}
            loading={transactionState.loading}
            error={transactionState.error}
            refreshError={transactionState.refreshError}
            onRetry={() => void refreshTransactions()}
            statements={statementState.statements}
            statementsLoading={statementState.loading}
            statementsError={statementState.error}
            statementsRefreshError={statementState.refreshError}
            statementsIgnoredCount={statementState.ignoredCount}
            onRetryStatements={() => void refreshStatements()}
            selectedStatementId={selectedStatementId}
            selectedStatementDetail={selectedStatementState.detail}
            selectedStatementLoading={selectedStatementState.loading}
            selectedStatementError={selectedStatementState.error}
            selectedStatementRefreshError={selectedStatementState.refreshError}
            onSelectStatement={handleSelectStatement}
            onRetrySelectedStatement={() => void loadInsightStatement(selectedStatementId, true)}
          />,
        ]}
      />
    </FinSightShell>
  );
}
