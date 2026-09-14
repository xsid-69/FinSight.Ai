import React, { useCallback, useRef, useState } from "react";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, FilePlus2, RefreshCw, ShieldCheck } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { Card, FinSightShell } from "../components/finsight";
import { SavedStatementRow } from "../components/statements/SavedStatementRow";
import { FinancialEmptyArtwork } from "./home/FinancialEmptyArtwork";
import { useAuth } from "../context/AuthContext";
import { loadPrivateStatements } from "../services/transactionService";
import type { SavedStatement } from "../types/transactions";

const PAGE_H = 20;

export function SavedStatementsScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const requestRef = useRef(0);
  const [statements, setStatements] = useState<SavedStatement[]>([]);
  const [ignoredCount, setIgnoredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatements = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!user?.uid) {
      setStatements([]);
      setIgnoredCount(0);
      setLoading(false);
      setError("Sign in to view statements saved to your account.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await loadPrivateStatements(user.uid);
      if (requestRef.current !== requestId) return;
      setStatements(result.statements);
      setIgnoredCount(result.ignoredCount);
      if (result.statements.length === 0 && result.ignoredCount > 0) {
        setError(
          `${result.ignoredCount.toLocaleString("en-IN")} saved cloud record${result.ignoredCount === 1 ? " exists" : "s exist"}, but ${result.ignoredCount === 1 ? "it does" : "they do"} not match the current privacy-safe analysis schema.`,
        );
      }
    } catch (loadError) {
      if (requestRef.current !== requestId) return;
      setError(
        loadError instanceof Error && loadError.message.trim()
          ? loadError.message
          : "Your saved statements could not be loaded.",
      );
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void loadStatements();
      return () => {
        requestRef.current += 1;
      };
    }, [loadStatements]),
  );

  const openAnalyzer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate?.("Analyzer");
  };

  return (
    <FinSightShell title="Saved statements" onBack={() => navigation?.goBack?.()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 18, paddingBottom: insets.bottom + 36 }}
      >
        <YStack width="100%" maxWidth={760} alignSelf="center" paddingHorizontal={PAGE_H} gap={18}>
          <YStack gap={5}>
            <Text fontSize={24} lineHeight={30} fontWeight="800" color="$navy" letterSpacing={-0.6}>
              Your statement library
            </Text>
            <Text maxWidth={590} fontSize={13} lineHeight={19} color="$navy2">
              Reopen any completed analysis without uploading the CSV again. Only sanitized extracted data is stored under your signed-in account.
            </Text>
          </YStack>

          <XStack
            alignItems="center"
            gap={9}
            padding={12}
            borderRadius={15}
            backgroundColor="rgba(99,166,74,0.08)"
            borderWidth={1}
            borderColor="rgba(99,166,74,0.2)"
            accessible
            accessibilityRole="summary"
          >
            <ShieldCheck size={17} color="$success" strokeWidth={2.2} />
            <Text flex={1} fontSize={12} lineHeight={17} color="$navy2">
              Statement rows are private to {user?.email || "your authenticated account"}.
            </Text>
          </XStack>

          {loading ? (
            <YStack gap={10} accessibilityRole="progressbar" accessibilityLabel="Loading saved statements">
              {[0, 1, 2].map((item) => (
                <View key={item} height={92} borderRadius={18} backgroundColor="$surfaceAlt" />
              ))}
            </YStack>
          ) : error ? (
            <Card backgroundColor="rgba(214,69,69,0.05)" borderColor="rgba(214,69,69,0.22)">
              <YStack gap={13}>
                <XStack gap={10} alignItems="flex-start" accessibilityRole="alert">
                  <AlertCircle size={19} color="$danger" strokeWidth={2.2} />
                  <Text flex={1} fontSize={12.5} lineHeight={18} color="$navy2">
                    {error}
                  </Text>
                </XStack>
                <XStack
                  minHeight={46}
                  borderRadius={14}
                  backgroundColor="$navy"
                  alignItems="center"
                  justifyContent="center"
                  gap={8}
                  onPress={() => void loadStatements()}
                  pressStyle={{ opacity: 0.8, scale: 0.99 }}
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading saved statements"
                >
                  <RefreshCw size={17} color="white" />
                  <Text color="white" fontWeight="800" fontSize={13.5}>Try again</Text>
                </XStack>
              </YStack>
            </Card>
          ) : statements.length === 0 ? (
            <Card>
              <YStack alignItems="center" gap={11} paddingVertical={4}>
                <FinancialEmptyArtwork variant="transactions" width={210} />
                <Text fontSize={18} fontWeight="800" color="$navy" textAlign="center">
                  No saved statements yet
                </Text>
                <Text maxWidth={330} fontSize={13} lineHeight={19} color="$navy2" textAlign="center">
                  Analyze your first CSV and FinSight will keep its privacy-safe extracted data here for later viewing.
                </Text>
              </YStack>
            </Card>
          ) : (
            <YStack gap={10}>
              {ignoredCount > 0 ? (
                <XStack
                  minHeight={48}
                  gap={9}
                  alignItems="center"
                  paddingHorizontal={12}
                  borderRadius={14}
                  backgroundColor="rgba(215,154,53,0.09)"
                  accessible
                  accessibilityRole="alert"
                >
                  <AlertCircle size={17} color="$warning" strokeWidth={2.2} />
                  <Text flex={1} fontSize={12} lineHeight={17} color="$navy2">
                    {ignoredCount.toLocaleString("en-IN")} older analysis record{ignoredCount === 1 ? " was" : "s were"} hidden because they do not match the privacy-safe schema.
                  </Text>
                </XStack>
              ) : null}
              {statements.map((statement) => (
                <SavedStatementRow
                  key={statement.id}
                  statement={statement}
                  onPress={() => navigation?.navigate?.("StatementDetail", { statementId: statement.id })}
                />
              ))}
            </YStack>
          )}

          <XStack
            minHeight={50}
            borderRadius={15}
            backgroundColor="$navy"
            alignItems="center"
            justifyContent="center"
            gap={9}
            onPress={openAnalyzer}
            pressStyle={{ opacity: 0.84, scale: 0.99 }}
            accessibilityRole="button"
            accessibilityLabel="Analyze another CSV statement"
          >
            <FilePlus2 size={18} color="white" strokeWidth={2.2} />
            <Text color="white" fontSize={14} fontWeight="800">
              Analyze another statement
            </Text>
          </XStack>
        </YStack>
      </ScrollView>
    </FinSightShell>
  );
}
