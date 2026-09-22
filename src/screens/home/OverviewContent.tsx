import React from "react";
import { Image, StyleSheet, useWindowDimensions } from "react-native";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  FileSpreadsheet,
  FileUp,
  Fingerprint,
  ListChecks,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Target,
  Trophy,
} from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { Money } from "../../components/banking/Money";
import { Card } from "../../components/finsight";
import { SpringPressable } from "../../components/motion/SpringPressable";
import { PulsingDot } from "../../components/motion/PulsingDot";
import { InteractiveBannerCarousel } from "../../components/motion/InteractiveBannerCarousel";
import {
  gradientEnd,
  gradientStart,
  overlays,
  palette,
  redGradient,
} from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { FinancialInsights, PrivateTransaction } from "../../types/transactions";
import { useOptionalHomePagerCoordinator } from "./HomePagerCoordinator";

const PAGE_H = 20;
const DOCK_CLEARANCE = 108;

type SummaryState = "loading" | "error" | "empty" | "ready";
type InsightsDestination = "analysis" | "transactions" | "statements";

interface OverviewContentProps {
  navigation?: any;
  insights?: FinancialInsights;
  transactions?: PrivateTransaction[];
  ignoredCount?: number;
  loading?: boolean;
  error?: string | null;
  refreshError?: string | null;
  onRetry?: () => void;
}

function formatInrLabel(amount: number) {
  const sign = amount < 0 ? "minus " : amount > 0 ? "plus " : "";
  return `${sign}₹${Math.abs(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function SnapshotMetric({ label, amount }: { label: string; amount: number }) {
  return (
    <YStack
      flex={1}
      minWidth={116}
      minHeight={68}
      paddingHorizontal={13}
      paddingVertical={11}
      borderRadius={16}
      backgroundColor={overlays.onBrand08}
      borderWidth={1}
      borderColor={overlays.onBrand12}
      justifyContent="center"
      gap={4}
      accessible
      accessibilityLabel={`${label}, ${formatInrLabel(amount)}`}
    >
      <Text fontSize={11.5} lineHeight={16} fontWeight="700" color="white" opacity={0.68}>
        {label}
      </Text>
      <Money
        amount={Math.abs(amount)}
        kind="none"
        size={17}
        weight="800"
        color={palette.white}
        decColor={palette.goldSoft}
      />
    </YStack>
  );
}

function CompactAction({
  icon: Icon,
  title,
  body,
  onPress,
  tone,
  accessibilityLabel,
  bgImage,
}: {
  icon: typeof Target;
  title: string;
  body: string;
  onPress: () => void;
  tone: "warm" | "charcoal";
  accessibilityLabel: string;
  bgImage?: string;
}) {
  const charcoal = tone === "charcoal";
  return (
    <SpringPressable
      scaleTo={0.96}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{ flex: 1, minWidth: 150 }}
    >
      <YStack
        width="100%"
        minHeight={170}
        borderRadius={22}
        backgroundColor={charcoal ? "$heroSurface" : "$orangeSoft"}
        borderWidth={1}
        borderColor={charcoal ? "$heroSurfaceRaised" : "$gold"}
        padding={17}
        justifyContent="space-between"
        overflow="hidden"
      >
        {bgImage ? (
          <Image
            source={{ uri: bgImage }}
            style={[StyleSheet.absoluteFill, { opacity: charcoal ? 0.14 : 0.08 }]}
            resizeMode="cover"
          />
        ) : null}
        <View
          position="absolute"
          width={112}
          height={112}
          borderRadius={56}
          backgroundColor={charcoal ? "$red" : "$gold"}
          opacity={charcoal ? 0.17 : 0.24}
          right={-42}
          top={-52}
        />
        <View
          width={42}
          height={42}
          borderRadius={14}
          backgroundColor={charcoal ? "$red" : "$backgroundStrong"}
          alignItems="center"
          justifyContent="center"
        >
          <Icon
            size={20}
            color={charcoal ? "$onBrand" : "$orangeDeep"}
            strokeWidth={2.2}
          />
        </View>
        <YStack gap={5} marginTop={18}>
          <Text
            accessibilityRole="header"
            fontSize={17}
            lineHeight={22}
            fontWeight="800"
            color={charcoal ? "$onBrand" : "$charcoal"}
          >
            {title}
          </Text>
          <Text
            fontSize={12.5}
            lineHeight={18}
            color={charcoal ? "$onBrand" : "$secondary"}
            opacity={charcoal ? 0.72 : 1}
          >
            {body}
          </Text>
        </YStack>
        <XStack marginTop={14} alignItems="center" justifyContent="space-between">
          <Text
            fontSize={12.5}
            fontWeight="800"
            color={charcoal ? "$gold" : "$orangeDeep"}
          >
            Open
          </Text>
          <ChevronRight
            size={17}
            color={charcoal ? "$gold" : "$orangeDeep"}
            strokeWidth={2.4}
          />
        </XStack>
      </YStack>
    </SpringPressable>
  );
}

function FeatureRow({
  icon: Icon,
  title,
  description,
  onPress,
  accessibilityLabel,
  tone = "neutral",
  last = false,
}: {
  icon: typeof BarChart3;
  title: string;
  description: string;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: "neutral" | "red" | "warm";
  last?: boolean;
}) {
  const iconBackground = tone === "red"
    ? "$redSoft"
    : tone === "warm"
      ? "$orangeSoft"
      : "$surfaceAlt";
  const iconColor = tone === "red"
    ? "$red"
    : tone === "warm"
      ? "$orangeDeep"
      : "$charcoal";

  return (
    <SpringPressable
      scaleTo={0.97}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <XStack
        minHeight={76}
        paddingVertical={12}
        alignItems="center"
        gap={13}
        borderBottomWidth={last ? 0 : 1}
        borderBottomColor="$borderColor"
      >
        <View
          width={44}
          height={44}
          borderRadius={15}
          backgroundColor={iconBackground}
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={20} color={iconColor} strokeWidth={2.15} />
        </View>
        <YStack flex={1} gap={3}>
          <Text fontSize={14.5} lineHeight={20} fontWeight="800" color="$charcoal">
            {title}
          </Text>
          <Text fontSize={12} lineHeight={17} color="$secondary">
            {description}
          </Text>
        </YStack>
        <View
          width={40}
          height={40}
          borderRadius={14}
          backgroundColor="$surfaceAlt"
          alignItems="center"
          justifyContent="center"
        >
          <ChevronRight size={18} color="$secondary" strokeWidth={2.2} />
        </View>
      </XStack>
    </SpringPressable>
  );
}

export function OverviewContent({
  navigation,
  insights,
  transactions = [],
  ignoredCount = 0,
  loading = false,
  error = null,
  refreshError = null,
  onRetry,
}: OverviewContentProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const coordinator = useOptionalHomePagerCoordinator();
  const { profile, user } = useAuth();
  const displayName = profile?.fullName || user?.displayName || "";
  const firstName = displayName.trim().split(/\s+/)[0];
  const twoColumnActions = width >= 390;
  const transactionCount = insights?.transactionCount ?? transactions.length;
  const hasSummary = Boolean(insights && transactionCount > 0);
  const summaryState: SummaryState = loading
    ? "loading"
    : error
      ? "error"
      : hasSummary
        ? "ready"
        : "empty";

  const requestHomePage = (tab: "Transactions" | "Insights") => {
    if (coordinator) coordinator.requestPage(tab, "in-page", true);
    else navigation?.navigate?.("Home", { tab });
  };

  const openInsights = (view: InsightsDestination) => {
    void Haptics.selectionAsync();
    navigation?.setParams?.({ insightsView: view });
    if (coordinator) coordinator.requestPage("Insights", "in-page", true);
    else navigation?.navigate?.("Home", { tab: "Insights", insightsView: view });
  };

  const openSourceStatus = () => {
    void Haptics.selectionAsync();
    requestHomePage("Transactions");
  };

  const openAI = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate?.("AI");
  };

  const openAnalyzer = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation?.navigate?.("Analyzer");
  };

  const openPlanner = () => {
    void Haptics.selectionAsync();
    navigation?.navigate?.("Simulator");
  };

  const openSecurity = () => {
    void Haptics.selectionAsync();
    navigation?.navigate?.("Profile", { section: "security" });
  };

  const renderSnapshot = () => {
    if (summaryState === "loading") {
      return (
        <YStack
          gap={11}
          accessibilityRole="progressbar"
          accessibilityLabel="Loading private financial snapshot"
        >
          <View width="64%" height={34} borderRadius={10} backgroundColor={overlays.onBrand12} />
          <XStack gap={10}>
            <View flex={1} height={68} borderRadius={16} backgroundColor={overlays.onBrand08} />
            <View flex={1} height={68} borderRadius={16} backgroundColor={overlays.onBrand08} />
          </XStack>
        </YStack>
      );
    }

    if (summaryState === "error") {
      return (
        <YStack gap={12} accessibilityLiveRegion="polite">
          <XStack alignItems="flex-start" gap={10}>
            <AlertCircle size={20} color="$gold" strokeWidth={2.2} />
            <YStack flex={1} gap={4}>
              <Text fontSize={16} lineHeight={22} fontWeight="800" color="$onBrand">
                Snapshot unavailable
              </Text>
              <Text fontSize={12.5} lineHeight={18} color="$onBrand" opacity={0.72}>
                {error}
              </Text>
            </YStack>
          </XStack>
          {onRetry ? (
            <XStack
              alignSelf="flex-start"
              minHeight={48}
              paddingHorizontal={16}
              borderRadius={14}
              backgroundColor="$backgroundStrong"
              alignItems="center"
              gap={8}
              onPress={onRetry}
              pressStyle={{ opacity: 0.78, scale: 0.98 }}
              accessibilityRole="button"
              accessibilityLabel="Retry loading financial snapshot"
            >
              <RefreshCw size={17} color="$red" strokeWidth={2.2} />
              <Text fontSize={13} fontWeight="800" color="$charcoal">Try again</Text>
            </XStack>
          ) : null}
        </YStack>
      );
    }

    if (summaryState === "empty" || !insights) {
      return (
        <YStack gap={12}>
          <YStack gap={4}>
            <Text fontSize={18} lineHeight={24} fontWeight="800" color="$onBrand">
              Add your first statement
            </Text>
            <Text maxWidth={440} fontSize={12.5} lineHeight={18} color="$onBrand" opacity={0.72}>
              Import a bank CSV to unlock the private financial snapshot, transaction ledger, charts, and purchase planning.
            </Text>
          </YStack>
          <XStack
            minHeight={48}
            alignSelf="flex-start"
            paddingHorizontal={16}
            borderRadius={14}
            backgroundColor="$backgroundStrong"
            alignItems="center"
            gap={8}
            onPress={() => openInsights("analysis")}
            pressStyle={{ opacity: 0.8, scale: 0.98 }}
            accessibilityRole="button"
            accessibilityLabel="Open private Insights workspace"
          >
            <BarChart3 size={18} color="$red" strokeWidth={2.2} />
            <Text fontSize={13.5} fontWeight="800" color="$charcoal">Open Insights workspace</Text>
          </XStack>
        </YStack>
      );
    }

    const netKind = insights.netCashFlow > 0
      ? "credit" as const
      : insights.netCashFlow < 0
        ? "debit" as const
        : "none" as const;

    return (
      <YStack gap={13}>
        <YStack
          gap={3}
          accessible
          accessibilityLabel={`Net cash flow, ${formatInrLabel(insights.netCashFlow)}`}
        >
          <Text fontSize={11.5} lineHeight={16} fontWeight="700" color="$onBrand" opacity={0.68}>
            Net cash flow
          </Text>
          <Money
            amount={Math.abs(insights.netCashFlow)}
            kind={netKind}
            signed={insights.netCashFlow < 0}
            size={30}
            weight="800"
            color={palette.white}
            decColor={palette.goldSoft}
          />
        </YStack>
        <XStack gap={10} flexWrap="wrap">
          <SnapshotMetric label="Money in" amount={insights.totalIncome} />
          <SnapshotMetric label="Money out" amount={insights.totalSpent} />
        </XStack>
        <XStack alignItems="center" gap={9}>
          <Text fontSize={12} fontWeight="800" color="$onBrand">
            {insights.transactionCount.toLocaleString("en-IN")} transactions
          </Text>
          <View width={4} height={4} borderRadius={2} backgroundColor="$orange" />
          <Text flex={1} fontSize={11.5} lineHeight={16} color="$onBrand" opacity={0.68}>
            {insights.periodLabel}
          </Text>
        </XStack>
      </YStack>
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 18,
        paddingBottom: insets.bottom + DOCK_CLEARANCE,
      }}
    >
      <MotiView
        from={{ opacity: reducedMotion ? 1 : 0.8, translateY: reducedMotion ? 0 : 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: reducedMotion ? 1 : 200 }}
      >
        <YStack width="100%" maxWidth={820} alignSelf="center" paddingHorizontal={PAGE_H}>
          <YStack marginBottom={16} gap={3}>
            <Text fontSize={13} lineHeight={18} color="$secondary" fontWeight="600">
              {firstName ? `Welcome back, ${firstName}` : "Your private workspace"}
            </Text>
            <Text
              accessibilityRole="header"
              fontSize={27}
              lineHeight={33}
              fontWeight="800"
              color="$charcoal"
              letterSpacing={-0.7}
            >
              Financial home
            </Text>
          </YStack>

          <YStack
            borderRadius={28}
            backgroundColor="$heroSurface"
            borderWidth={1}
            borderColor="$heroSurfaceRaised"
            padding={20}
            overflow="hidden"
            shadowColor={palette.charcoal}
            shadowOffset={{ width: 0, height: 18 }}
            shadowOpacity={0.28}
            shadowRadius={32}
          >
            {/* Subtle Inset Glass Highlight Hairline */}
            <View
              position="absolute"
              top={0}
              left={0}
              right={0}
              height={1}
              backgroundColor={overlays.onBrand12}
            />
            <View
              position="absolute"
              width={184}
              height={184}
              borderRadius={92}
              backgroundColor="$red"
              opacity={0.23}
              right={-68}
              top={-98}
            />
            <View
              position="absolute"
              width={130}
              height={130}
              borderRadius={65}
              backgroundColor="$orange"
              opacity={0.17}
              right={45}
              top={-50}
            />
            <XStack alignItems="center" justifyContent="space-between" gap={12} marginBottom={17}>
              <XStack alignItems="center" gap={8} flex={1}>
                <ShieldCheck size={16} color="$gold" strokeWidth={2.2} />
                <Text
                  fontSize={10.5}
                  textTransform="uppercase"
                  letterSpacing={1.8}
                  color="$onBrand"
                  fontWeight="700"
                  opacity={0.78}
                >
                  Private financial snapshot
                </Text>
              </XStack>
              <XStack alignItems="center" gap={8}>
                {summaryState === "ready" ? (
                  <PulsingDot label="Live Auto-Sync" />
                ) : null}
                {summaryState === "ready" && insights ? (
                  <View
                    borderRadius={999}
                    paddingHorizontal={9}
                    paddingVertical={4.5}
                    backgroundColor={overlays.onBrand12}
                  >
                    <Text fontSize={10.5} fontWeight="800" color="$onBrand">
                      {insights.transactionCount.toLocaleString("en-IN")} records
                    </Text>
                  </View>
                ) : null}
              </XStack>
            </XStack>

            {renderSnapshot()}

            {summaryState === "ready" ? (
              <XStack
                minHeight={50}
                marginTop={16}
                paddingHorizontal={15}
                borderRadius={15}
                backgroundColor="$backgroundStrong"
                alignItems="center"
                justifyContent="space-between"
                gap={10}
                onPress={() => openInsights("analysis")}
                pressStyle={{ opacity: 0.82, scale: 0.985 }}
                accessibilityRole="button"
                accessibilityLabel="Open private Insights workspace"
              >
                <Text flex={1} fontSize={13.5} fontWeight="800" color="$charcoal">
                  Review full financial analysis
                </Text>
                <ArrowRight size={18} color="$red" strokeWidth={2.4} />
              </XStack>
            ) : null}
          </YStack>

          {/* Interactive Snapping Carousel with 3D Banners */}
          <InteractiveBannerCarousel
            navigation={navigation}
            onOpenSimulator={openPlanner}
            onOpenInsights={() => openInsights("analysis")}
          />

          {refreshError ? (
            <XStack
              marginTop={12}
              minHeight={58}
              paddingLeft={13}
              paddingRight={5}
              borderRadius={16}
              borderWidth={1}
              borderColor="$gold"
              backgroundColor="$goldSoft"
              alignItems="center"
              gap={9}
              accessibilityRole="alert"
            >
              <AlertCircle size={18} color="$warning" strokeWidth={2.2} />
              <Text flex={1} fontSize={11.5} lineHeight={16} color="$secondary">
                Showing the previous snapshot. {refreshError}
              </Text>
              {onRetry ? (
                <View
                  width={48}
                  height={48}
                  borderRadius={14}
                  alignItems="center"
                  justifyContent="center"
                  onPress={onRetry}
                  pressStyle={{ opacity: 0.72 }}
                  accessibilityRole="button"
                  accessibilityLabel="Retry refreshing financial snapshot"
                >
                  <RefreshCw size={17} color="$charcoal" strokeWidth={2.2} />
                </View>
              ) : null}
            </XStack>
          ) : null}

          {ignoredCount > 0 ? (
            <XStack
              marginTop={12}
              minHeight={54}
              padding={12}
              borderRadius={15}
              backgroundColor="$warningSoft"
              alignItems="center"
              gap={9}
              accessibilityRole="alert"
            >
              <AlertCircle size={17} color="$warning" strokeWidth={2.2} />
              <Text flex={1} fontSize={11.5} lineHeight={16} color="$secondary">
                {ignoredCount.toLocaleString("en-IN")} incompatible {ignoredCount === 1 ? "record was" : "records were"} excluded from this snapshot.
              </Text>
            </XStack>
          ) : null}

          <YStack marginTop={28} gap={5}>
            <Text accessibilityRole="header" fontSize={21} lineHeight={27} fontWeight="800" color="$charcoal">
              Quick actions
            </Text>
            <Text fontSize={13} lineHeight={19} color="$secondary">
              Start the task you need without searching through menus.
            </Text>
          </YStack>

          <SpringPressable
            scaleTo={0.98}
            onPress={openAnalyzer}
            accessibilityRole="button"
            accessibilityLabel="Analyse a bank statement"
            style={{ marginTop: 14 }}
          >
            <YStack
              minHeight={116}
              borderRadius={22}
              overflow="hidden"
            >
              <LinearGradient
                colors={redGradient as unknown as [string, string]}
                start={gradientStart}
                end={gradientEnd}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
                }}
                style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}
                resizeMode="cover"
              />
              <View
                position="absolute"
                width={120}
                height={120}
                borderRadius={60}
                backgroundColor="$orange"
                opacity={0.2}
                right={-26}
                top={-48}
              />
              <XStack flex={1} padding={18} alignItems="center" gap={14}>
                <View
                  width={50}
                  height={50}
                  borderRadius={17}
                  backgroundColor={overlays.onBrand18}
                  borderWidth={1}
                  borderColor={overlays.onBrand24}
                  alignItems="center"
                  justifyContent="center"
                >
                  <FileUp size={23} color="$onBrand" strokeWidth={2.2} />
                </View>
                <YStack flex={1} gap={4}>
                  <Text fontSize={17} lineHeight={22} fontWeight="800" color="$onBrand">
                    Analyse a bank statement
                  </Text>
                  <Text maxWidth={500} fontSize={12.5} lineHeight={18} color="$onBrand" opacity={0.78}>
                    Import a CSV, sanitize it locally, and create your private financial analysis.
                  </Text>
                </YStack>
                <View
                  width={42}
                  height={42}
                  borderRadius={21}
                  backgroundColor="$backgroundStrong"
                  alignItems="center"
                  justifyContent="center"
                >
                  <ArrowRight size={18} color="$red" strokeWidth={2.4} />
                </View>
              </XStack>
            </YStack>
          </SpringPressable>

          <XStack
            marginTop={12}
            flexDirection={twoColumnActions ? "row" : "column"}
            gap={12}
            alignItems="stretch"
          >
            <CompactAction
              icon={Target}
              title="Purchase planner"
              body="Test a real purchase against your available cash, reserve, and statement history."
              tone="warm"
              bgImage="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80"
              onPress={openPlanner}
              accessibilityLabel="Open Purchase Planner"
            />
            <CompactAction
              icon={BrainCircuit}
              title="FinSight AI"
              body="Explore guided financial questions and planning tools."
              tone="charcoal"
              bgImage="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80"
              onPress={openAI}
              accessibilityLabel="Open FinSight AI"
            />
          </XStack>

          {/* Peer Ranking & Benchmark Highlight Banner */}
          <SpringPressable
            scaleTo={0.98}
            onPress={() => {
              void Haptics.selectionAsync();
              navigation?.navigate?.("CohortScreen");
            }}
            accessibilityRole="button"
            accessibilityLabel="View Cohort Ranking and Peer Leaderboard"
            style={{ marginTop: 14 }}
          >
            <YStack
              minHeight={96}
              borderRadius={22}
              backgroundColor="$backgroundStrong"
              borderWidth={1}
              borderColor="$borderColor"
              overflow="hidden"
              padding={16}
              justifyContent="space-between"
            >
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
                }}
                style={[StyleSheet.absoluteFill, { opacity: 0.09 }]}
                resizeMode="cover"
              />
              <XStack alignItems="center" justifyContent="space-between" marginBottom={6}>
                <XStack alignItems="center" gap={7}>
                  <Trophy size={16} color="#F79E1B" strokeWidth={2.4} />
                  <Text fontSize={11} fontWeight="800" textTransform="uppercase" letterSpacing={1.2} color="$secondary">
                    Peer Benchmark Ranking
                  </Text>
                </XStack>
                <View
                  borderRadius={999}
                  backgroundColor="$orangeSoft"
                  paddingHorizontal={9}
                  paddingVertical={3.5}
                >
                  <Text fontSize={11} fontWeight="800" color="$orangeDeep">
                    Top 22% Saver
                  </Text>
                </View>
              </XStack>

              <XStack alignItems="center" justifyContent="space-between">
                <YStack gap={2} flex={1}>
                  <Text fontSize={15} fontWeight="800" color="$charcoal">
                    Nagpur College Students Benchmark
                  </Text>
                  <Text fontSize={12} color="$secondary">
                    Review your 4-category score and top money handler habits
                  </Text>
                </YStack>
                <View
                  width={34}
                  height={34}
                  borderRadius={17}
                  backgroundColor="$surfaceAlt"
                  alignItems="center"
                  justifyContent="center"
                  marginLeft={10}
                >
                  <ChevronRight size={16} color="$charcoal" strokeWidth={2.4} />
                </View>
              </XStack>
            </YStack>
          </SpringPressable>

          <YStack marginTop={28} gap={5}>
            <Text accessibilityRole="header" fontSize={21} lineHeight={27} fontWeight="800" color="$charcoal">
              Explore FinSight
            </Text>
            <Text fontSize={13} lineHeight={19} color="$secondary">
              Every workspace, grouped by what it helps you do.
            </Text>
          </YStack>

          <Card variant="flat" marginTop={14} paddingHorizontal={16} paddingVertical={0} overflow="hidden">
            <FeatureRow
              icon={BarChart3}
              title="Cash-flow insights"
              description="Review financial position, monthly movement, categories, and notable patterns."
              tone="red"
              onPress={() => openInsights("analysis")}
              accessibilityLabel="Open cash-flow analysis"
            />
            <FeatureRow
              icon={ListChecks}
              title="Transaction ledger"
              description="Search and filter the privacy-safe transactions in your selected scope."
              tone="neutral"
              onPress={() => openInsights("transactions")}
              accessibilityLabel="Open transaction ledger"
            />
            <FeatureRow
              icon={FileSpreadsheet}
              title="Saved statements"
              description="Choose, link, and reopen completed statement analyses."
              tone="warm"
              onPress={() => openInsights("statements")}
              accessibilityLabel="Open saved statements"
            />
            <FeatureRow
              icon={MessageSquareText}
              title="Message source status"
              description="See clearly whether a secure message source is connected."
              tone="neutral"
              onPress={openSourceStatus}
              accessibilityLabel="View message connection status"
            />
            <FeatureRow
              icon={Fingerprint}
              title="Privacy and account"
              description="Review authentication, source boundaries, and account security."
              tone="red"
              onPress={openSecurity}
              accessibilityLabel="Open privacy and account security"
              last
            />
          </Card>

          <XStack
            marginTop={20}
            minHeight={72}
            paddingHorizontal={15}
            paddingVertical={12}
            borderRadius={18}
            backgroundColor="$surfaceAlt"
            borderWidth={1}
            borderColor="$borderColor"
            alignItems="center"
            gap={12}
          >
            <View
              width={42}
              height={42}
              borderRadius={14}
              backgroundColor="$orangeSoft"
              alignItems="center"
              justifyContent="center"
            >
              <ShieldCheck size={20} color="$orangeDeep" strokeWidth={2.2} />
            </View>
            <YStack flex={1} gap={3}>
              <Text fontSize={13.5} fontWeight="800" color="$charcoal">
                Private by design
              </Text>
              <Text maxWidth={580} fontSize={11.5} lineHeight={16} color="$secondary">
                Statements, message-source status, AI demonstrations, and account controls stay explicitly separated.
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </MotiView>
    </ScrollView>
  );
}
