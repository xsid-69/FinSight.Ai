import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useSharedValue } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { FinSightShell } from "../components/finsight";
import { useAuth } from "../context/AuthContext";
import {
  loadPrivateStatement,
  loadPrivateStatements,
  loadPrivateTransactions,
  subscribeToPrivateTransactions,
} from "../services/transactionService";
import { buildFinancialInsights } from "../services/financialInsights";
import { checkSmsPermission, requestSmsPermission } from "../services/smsPermissionManager";
import {
  loadLocalSmsTransactions,
  isTestSmsTransaction,
  purgeTestSmsTransactions,
  addManualTransaction,
  removeLocalSmsTransaction,
  deleteSmsTransactionFromDb,
  clearAllSmsTransactions,
} from "../services/smsStorageService";
import { startSmsTracking, stopSmsTracking } from "../services/smsListenerService";
import {
  setNotificationListener,
  startNotificationTracking,
  syncActiveNotifications,
} from "../services/notificationService";
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
import { DemographicPromptModal } from "../components/finsight/DemographicPromptModal";
import { WalkthroughModal } from "../components/finsight/WalkthroughModal";

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
  const [smsPermissionGranted, setSmsPermissionGranted] = useState(false);
  const [persistedSmsTransactions, setPersistedSmsTransactions] = useState<PrivateTransaction[]>([]);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
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
    setPersistedSmsTransactions([]);
  }, [user?.uid]);

  // Manage SMS & UPI transactions: real-time listened notifications & SMS appear instantly.
  useEffect(() => {
    let isMounted = true;
    const uid = user?.uid || "guest";

    void (async () => {
      try {
        const AsyncStorage = require("@react-native-async-storage/async-storage").default;
        await AsyncStorage.setItem("@finsight_active_user_id", uid);
      } catch (_) {}

      // Purge any stale test artifacts
      await purgeTestSmsTransactions(uid);
      const local = await loadLocalSmsTransactions(uid);
      if (isMounted && Array.isArray(local)) {
        setPersistedSmsTransactions(local.filter((t) => !isTestSmsTransaction(t)));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handleIncomingSmsTransaction = useCallback((tx: PrivateTransaction) => {
    if (isTestSmsTransaction(tx)) return;
    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    setPersistedSmsTransactions((prev) => {
      const index = prev.findIndex(
        (t) => t.id === tx.id || (tx.referenceNo && t.referenceNo === tx.referenceNo)
      );
      if (index !== -1) {
        const updated = [...prev];
        updated[index] = tx;
        return updated;
      }
      return [tx, ...prev];
    });
    setTransactionState((prev) => {
      const index = prev.transactions.findIndex(
        (t) => t.id === tx.id || (tx.referenceNo && (t as any).referenceNo === tx.referenceNo)
      );
      if (index !== -1) {
        const updated = [...prev.transactions];
        updated[index] = tx;
        return { ...prev, transactions: updated };
      }
      return { ...prev, transactions: [tx, ...prev.transactions] };
    });
  }, []);

  const handleRequestSmsPermission = useCallback(async () => {
    const granted = await requestSmsPermission();
    setSmsPermissionGranted(Boolean(granted));
    const effectiveUid = user?.uid || "guest";
    if (granted) {
      try {
        startSmsTracking(effectiveUid, handleIncomingSmsTransaction);
      } catch (err) {
        console.warn("Could not start SMS tracking:", err);
      }
    }
    return Boolean(granted);
  }, [handleIncomingSmsTransaction, user?.uid]);

  const handleAddManualTransaction = useCallback(async (txData: any) => {
    const newTx = await addManualTransaction(user?.uid, txData);
    setPersistedSmsTransactions((prev) => [newTx as any, ...prev]);
    void refreshTransactions();
    return newTx;
  }, [refreshTransactions, user?.uid]);


  const handleDeleteTransaction = useCallback(async (txId: string) => {
    await removeLocalSmsTransaction(user?.uid, txId);
    if (user?.uid) {
      void deleteSmsTransactionFromDb(user.uid, txId);
    }
    setPersistedSmsTransactions((prev) => prev.filter((t) => t.id !== txId && (t as any).referenceNo !== txId));
    setTransactionState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== txId && (t as any).referenceNo !== txId),
    }));
    void refreshTransactions();
  }, [refreshTransactions, user?.uid]);

  const handleClearTransactions = useCallback(async () => {
    await clearAllSmsTransactions(user?.uid);
    setPersistedSmsTransactions([]);
    setTransactionState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => !isSmsTransaction(t)),
    }));
    void refreshTransactions();
  }, [refreshTransactions, user?.uid]);

  // Real-time Firestore transaction sync
  useEffect(() => {
    if (!user?.uid || typeof subscribeToPrivateTransactions !== "function") return;
    let unsubscribeFirestore: (() => void) | undefined;
    try {
      unsubscribeFirestore = subscribeToPrivateTransactions(
        user.uid,
        (result: { transactions: PrivateTransaction[]; ignoredCount: number }) => {
          setTransactionState({
            transactions: result.transactions,
            ignoredCount: result.ignoredCount,
            loading: false,
            error: null,
            refreshError: null,
          });
        },
        () => {
          // Gracefully retain existing state on snapshot error
        },
      );
    } catch {
      // Ignored
    }
    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [user?.uid]);

  // Background SMS Listener lifecycle
  useEffect(() => {
    let unsubscribeSms: (() => void) | undefined;
    let isMounted = true;
    const effectiveUid = user?.uid || "guest";

    if (Platform.OS === "android" && typeof checkSmsPermission === "function") {
      void checkSmsPermission().then((granted) => {
        if (!isMounted) return;
        setSmsPermissionGranted(Boolean(granted));
        if (granted) {
          try {
            unsubscribeSms = startSmsTracking(effectiveUid, handleIncomingSmsTransaction);
          } catch (err) {
            console.warn('[HomeScreen] Could not start SMS tracking:', err);
          }
        }
      });
    }
    return () => {
      isMounted = false;
      if (unsubscribeSms) unsubscribeSms();
      try {
        stopSmsTracking();
      } catch {
        // Ignored
      }
    };
  }, [handleIncomingSmsTransaction, user?.uid]);

  // Real-time Notification Tracking lifecycle (PhonePe, Paytm, Super.money, GPay)
  useEffect(() => {
    const uid = user?.uid || "guest";
    const unsubscribe = startNotificationTracking(uid, (tx: PrivateTransaction) => {
      handleIncomingSmsTransaction(tx);
    });
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [handleIncomingSmsTransaction, user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void refreshTransactions();
      void refreshStatements();
      if (Platform.OS === "android") {
        void checkSmsPermission().then((granted) => {
          setSmsPermissionGranted(Boolean(granted));
        });
        const uid = user?.uid || "guest";
        void syncActiveNotifications(uid, (tx: PrivateTransaction) => {
          handleIncomingSmsTransaction(tx);
        });
      }

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

  const isSmsTransaction = (tx: PrivateTransaction): boolean => {
    if (!tx) return false;
    if (isTestSmsTransaction(tx)) return false;
    return (
      (tx as any)?.isManual === true ||
      (tx as any).source === "SMS_AUTO_PARSE" ||
      (tx as any).source === "APP_NOTIFICATION" ||
      (tx as any).source === "sms" ||
      tx.id.startsWith("ref_") ||
      tx.id.startsWith("sms_") ||
      tx.id.startsWith("tx_")
    );
  };

  const allTransactions = useMemo(() => {
    const map = new Map<string, PrivateTransaction>();
    for (const tx of transactionState.transactions) {
      if (tx?.id) {
        map.set(tx.id, tx);
      }
    }
    for (const tx of persistedSmsTransactions) {
      if (tx?.id && !isTestSmsTransaction(tx)) {
        map.set(tx.id, tx);
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [persistedSmsTransactions, transactionState.transactions]);

  const smsTransactions = useMemo(() => {
    return allTransactions.filter((tx) => isSmsTransaction(tx));
  }, [allTransactions]);

  const csvTransactions = useMemo(
    () => allTransactions.filter((tx) => !isSmsTransaction(tx)),
    [allTransactions],
  );

  const transactionInsights = useMemo(
    () => buildFinancialInsights(allTransactions) as FinancialInsights,
    [allTransactions],
  );

  const csvInsights = useMemo(
    () => buildFinancialInsights(csvTransactions) as FinancialInsights,
    [csvTransactions],
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
      onHelp={() => setShowWalkthrough(true)}
      onLogout={handleLogout}
    >
      <HomePager
        settledTab={committedTab}
        onCommitTab={handleCommitTab}
        pageProgress={pageProgress}
        pages={[
          <OverviewContent
            key="Overview"
            navigation={navigation}
            transactions={allTransactions}
            insights={transactionInsights}
            ignoredCount={transactionState.ignoredCount}
            loading={transactionState.loading}
            error={transactionState.error}
            refreshError={transactionState.refreshError}
            onRetry={() => void refreshTransactions()}
            smsPermissionGranted={smsPermissionGranted}
            onRequestSmsPermission={handleRequestSmsPermission}
            onNewTransaction={handleIncomingSmsTransaction}
          />,
          <TransactionsContent
            key="Transactions"
            navigation={navigation}
            transactions={allTransactions}
            smsPermissionGranted={smsPermissionGranted}
            onRequestSmsPermission={handleRequestSmsPermission}
            onAddTransaction={handleAddManualTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onClearTransactions={handleClearTransactions}
            onNewTransaction={handleIncomingSmsTransaction}
          />,

          <InsightsContent
            key="Insights"
            navigation={navigation}
            view={insightsView}
            onChangeView={handleInsightsView}
            transactions={csvTransactions}
            insights={csvInsights}
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
      <DemographicPromptModal onCompleted={() => {}} />
      <WalkthroughModal
        visible={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
      />
    </FinSightShell>
  );
}
