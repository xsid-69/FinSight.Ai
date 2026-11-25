import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, usePreventRemove } from "@react-navigation/native";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Cloud,
  Cpu,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
  WalletCards,
} from "@tamagui/lucide-icons";
import { StatusBar } from "expo-status-bar";
import { LineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  analyzePurchasePlan,
  analyzeTransactionCoverage,
} from "../analytics/purchasePlanner";
import { useAuth } from "../context/AuthContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import {
  loadPrivateStatement,
  loadPrivateStatements,
  subscribeToPrivateTransactions,
} from "../services/transactionService";
import { brandColors } from "../theme/mastercard";

const TARGET_MONTH_OPTIONS = [1, 3, 6, 12];
const ANALYSIS_DELAY_MS = 900;
const ALL_TRANSACTIONS_LABEL = "All imported transactions";
const MONOSPACE = Platform.select({ android: "monospace", ios: "Menlo" });

const C = {
  page: brandColors.canvas,
  card: brandColors.surface,
  surface: brandColors.surfaceSoft,
  surfaceStrong: "#E9ECF1",
  border: brandColors.border,
  borderStrong: brandColors.borderStrong,
  navy: brandColors.charcoal,
  navy2: brandColors.charcoalSoft,
  body: brandColors.textSecondary,
  muted: brandColors.textMuted,
  faint: brandColors.textMuted,
  red: brandColors.redIdentity,
  redSoft: brandColors.redSoft,
  redWash: brandColors.redWash,
  orange: brandColors.orange,
  gold: brandColors.gold,
  warning: brandColors.warning,
  warningSoft: brandColors.warningSoft,
  success: brandColors.success,
  successSoft: brandColors.successSoft,
  danger: brandColors.danger,
  dangerSoft: brandColors.dangerSoft,
  white: brandColors.white,
};

function finiteNumber(value) {
  if (value === "" || value === null || value === undefined) return Number.NaN;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

function sanitizeWholeNumber(value) {
  return String(value).replace(/[^0-9]/g, "").slice(0, 12);
}

function formatCurrency(value) {
  const amount = Math.round(Number(value) || 0);
  const sign = amount < 0 ? "−" : "";
  return `${sign}₹${Math.abs(amount).toLocaleString("en-IN")}`;
}

function formatCompactCurrency(value) {
  const amount = Number(value) || 0;
  const absolute = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  if (absolute >= 10_000_000) {
    return `${sign}₹${(absolute / 10_000_000).toFixed(1).replace(".0", "")}Cr`;
  }
  if (absolute >= 100_000) {
    return `${sign}₹${(absolute / 100_000).toFixed(1).replace(".0", "")}L`;
  }
  if (absolute >= 1_000) {
    return `${sign}₹${(absolute / 1_000).toFixed(1).replace(".0", "")}k`;
  }
  return `${sign}₹${Math.round(absolute)}`;
}

function formatPercent(value) {
  return `${Math.round(Number(value) || 0)}%`;
}

function readableError(error, fallback) {
  return error instanceof Error && error.message.trim() ? error.message : fallback;
}

function hasCommittedStatement(result) {
  return result?.cloudSync?.status === "synced"
    || result?.cloudSync?.statementCommitted === true;
}

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function AppButton({
  label,
  onPress,
  disabled = false,
  busy = false,
  icon,
  secondary = false,
  accessibilityLabel,
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {icon}
      <Text style={[
        styles.buttonText,
        secondary && styles.buttonSecondaryText,
        disabled && styles.buttonDisabledText,
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Segment({ label, selected, onPress, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        selected && styles.segmentSelected,
        pressed && styles.segmentPressed,
      ]}
    >
      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function FormField({
  label,
  helper,
  error,
  value,
  onChangeText,
  onBlur,
  placeholder,
  accessibilityLabel,
  keyboardType = "default",
  prefix,
  suffix,
  maxLength = 40,
  returnKeyType = "done",
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[
        styles.inputShell,
        error && styles.inputShellError,
      ]}>
        {prefix ? <Text style={styles.inputAffix}>{prefix}</Text> : null}
        <TextInput
          accessibilityLabel={accessibilityLabel ?? label}
          autoComplete="off"
          importantForAutofill="no"
          keyboardType={keyboardType}
          maxLength={maxLength}
          onBlur={onBlur}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.faint}
          returnKeyType={returnKeyType}
          selectionColor={C.red}
          showSoftInputOnFocus
          style={styles.input}
          value={value}
        />
        {suffix ? <Text style={styles.inputSuffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      {!error && helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

function SectionHeading({ title, subtitle, icon }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>{icon}</View>
      <View style={styles.sectionHeadingCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function DetailRow({ label, value, tone = "default", last = false }) {
  const valueColor = tone === "red" ? C.red : tone === "positive" ? C.success : C.navy;
  return (
    <View style={[styles.detailRow, last && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={2} style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function MetricBox({ label, value, tone = "default" }) {
  const valueColor = tone === "red" ? C.red : tone === "positive" ? C.success : C.navy;
  return (
    <View style={styles.metricBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.metricValue, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

function TargetPoint({ color }) {
  return <View style={[styles.targetPoint, { borderColor: color }]} />;
}

function StatementSourceRow({
  title,
  meta,
  selected,
  loading = false,
  onPress,
}) {
  return (
    <Pressable
      accessibilityLabel={`${title}. ${meta}`}
      accessibilityRole="radio"
      accessibilityState={{ selected, busy: loading }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.statementRow,
        selected && styles.statementRowSelected,
        pressed && styles.statementRowPressed,
      ]}
    >
      <View style={[styles.statementRadio, selected && styles.statementRadioSelected]}>
        {selected ? <View style={styles.statementRadioDot} /> : null}
      </View>
      <View style={styles.statementRowCopy}>
        <Text numberOfLines={2} style={styles.statementRowTitle}>{title}</Text>
        <Text style={styles.statementRowMeta}>{meta}</Text>
      </View>
      {loading ? <ActivityIndicator color={C.red} size="small" /> : null}
    </Pressable>
  );
}

function HistoryGate({
  isLoading,
  loadError,
  coverage,
  ignoredCount,
  sourceLabel,
  importBusy,
  onImport,
  onRetry,
}) {
  if (isLoading) {
    return (
      <View style={styles.historyGate}>
        <ActivityIndicator color={C.red} size="small" />
        <View style={styles.historyGateCopy}>
          <Text style={styles.historyGateTitle}>Checking transaction history</Text>
          <Text style={styles.historyGateText}>Looking for six consecutive completed months in this source.</Text>
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={[styles.historyGate, styles.historyGateError]}>
        <AlertTriangle color={C.red} size={20} strokeWidth={2.2} />
        <View style={styles.historyGateCopy}>
          <Text style={styles.historyGateTitle}>Could not verify your data</Text>
          <Text style={styles.historyGateText}>{loadError}</Text>
        </View>
        <Pressable
          accessibilityLabel="Retry transaction source"
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <RefreshCw color={C.red} size={18} strokeWidth={2.2} />
        </Pressable>
      </View>
    );
  }

  if (!coverage.hasMinimumHistory) {
    return (
      <View style={[styles.historyGate, styles.historyGateWarning]}>
        <Cloud color={C.warning} size={21} strokeWidth={2.1} />
        <View style={styles.historyGateCopy}>
          <Text style={styles.historyGateTitle}>Six months of real data required</Text>
          <Text style={styles.historyGateText}>
            This source has {coverage.completeMonthCount} consecutive completed {coverage.completeMonthCount === 1 ? "month" : "months"}. Select another saved statement or upload a CSV covering at least six consecutive months.
          </Text>
          <Pressable
            accessibilityLabel="Upload a six month CSV statement"
            accessibilityRole="button"
            disabled={importBusy}
            onPress={onImport}
            style={({ pressed }) => [
              styles.inlineLink,
              pressed && !importBusy && styles.inlineLinkPressed,
            ]}
          >
            <Text style={[styles.inlineLinkText, importBusy && styles.inlineLinkTextDisabled]}>
              {importBusy ? "Saving CSV…" : "Upload CSV here"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.historyGate, styles.historyGateReady]}>
      <CheckCircle2 color={C.success} size={21} strokeWidth={2.2} />
      <View style={styles.historyGateCopy}>
        <Text style={styles.historyGateTitle}>Real-data analysis ready</Text>
        <Text style={styles.historyGateText}>
          {sourceLabel} · {coverage.analyzedMonthKeys.length} analyzed completed months · {coverage.rangeLabel} · {coverage.transactionCount} validated transactions
          {ignoredCount > 0 ? ` · ${ignoredCount} invalid excluded` : ""}
        </Text>
      </View>
    </View>
  );
}

function AnalysisLoader({ purchaseName, coverage, sourceLabel, targetMonth, reducedMotion }) {
  const stages = [
    {
      title: "Cash-flow baseline",
      detail: `Measuring income and spending across ${coverage.analyzedMonthKeys.length} completed months`,
      color: C.red,
    },
    {
      title: "Full-price test",
      detail: "Checking the purchase against available cash and the protected reserve",
      color: C.orange,
    },
    {
      title: "Timing forecast",
      detail: `Modelling the cash runway from the selected month ${targetMonth}`,
      color: C.gold,
    },
  ];

  return (
    <Card style={styles.loaderCard}>
      <View accessibilityLabel="Analysis in progress" style={styles.loaderRing}>
        {reducedMotion ? (
          <Cpu color={C.red} size={27} strokeWidth={2.2} />
        ) : (
          <ActivityIndicator color={C.red} size="large" />
        )}
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.loaderTitle}>
        Analysing {purchaseName}
      </Text>
      <Text style={styles.loaderSubtitle}>
        Building a local purchase decision from {sourceLabel}.
      </Text>
      <View style={styles.loaderSource}>
        <Text style={styles.loaderSourceLabel}>Verified source</Text>
        <Text style={styles.loaderSourceValue}>{sourceLabel}</Text>
      </View>
      <View style={styles.loaderSteps}>
        {stages.map((stage) => (
          <View key={stage.title} style={styles.loaderStep}>
            <View style={[styles.loaderStepDot, { backgroundColor: stage.color }]} />
            <View style={styles.loaderStepCopy}>
              <Text style={styles.loaderStepTitle}>{stage.title}</Text>
              <Text style={styles.loaderStepText}>{stage.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function ReportContextBar({ report, onEdit }) {
  return (
    <View style={styles.reportContextBar}>
      <View style={styles.reportContextCopy}>
        <Text style={styles.reportContextProduct}>
          {report.inputs.purchaseName}
        </Text>
        <Text style={styles.reportContextSource}>
          {report.inputs.sourceLabel}
        </Text>
        <Text style={styles.reportContextAssumption}>
          Month {report.inputs.targetMonth} · Assumes full price {formatCurrency(report.inputs.purchasePrice)} upfront
        </Text>
      </View>
      <Pressable
        accessibilityHint="Returns to the purchase form without clearing your entries"
        accessibilityLabel="Edit purchase"
        accessibilityRole="button"
        hitSlop={4}
        onPress={onEdit}
        style={({ pressed }) => [
          styles.editPurchaseButton,
          pressed && styles.editPurchaseButtonPressed,
        ]}
      >
        <Text style={styles.editPurchaseButtonText}>Edit purchase</Text>
      </Pressable>
    </View>
  );
}

function VerdictCard({ report }) {
  const { status } = report.verdict;
  const affordable = status === "affordable";
  const caution = status === "caution";
  const title = affordable
    ? `${report.inputs.purchaseName} fits the plan`
    : caution
      ? "Possible, but financially tight"
      : "Not affordable on this plan";
  const message = affordable
    ? `The full-price purchase preserves your ${formatCurrency(report.inputs.protectedReserve)} protected cash and remains sustainable in the modeled runway.`
    : caution
      ? "You can make the full payment, but the reserve or historical cash-flow test is not fully protected."
      : "The modeled cash runway falls below zero or cannot cover the full purchase safely.";
  const backgroundColor = status === "not_affordable" ? C.red : C.navy;

  return (
    <View style={[styles.verdictCard, { backgroundColor, overflow: "hidden" }]}>
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80",
        }}
        style={[StyleSheet.absoluteFillObject, { opacity: 0.1 }]}
        resizeMode="cover"
      />
      <View style={styles.verdictHeader}>
        <View style={styles.verdictIcon}>
          {affordable ? (
            <CheckCircle2 color={C.white} size={24} strokeWidth={2.4} />
          ) : (
            <AlertTriangle color={C.white} size={24} strokeWidth={2.4} />
          )}
        </View>
        <View style={styles.verdictHeaderCopy}>
          <Text style={styles.verdictStatus}>
            {affordable ? "Affordable" : caution ? "Caution" : "Not affordable"}
          </Text>
          <Text style={styles.verdictTitle}>{title}</Text>
        </View>
      </View>
      <Text style={styles.verdictMessage}>{message}</Text>
      <View style={styles.verdictMetrics}>
        <View style={styles.verdictMetric}>
          <Text style={styles.verdictMetricLabel}>Cash after purchase</Text>
          <Text style={styles.verdictMetricValue}>
            {formatCurrency(report.verdict.cashAfterImmediatePayment)}
          </Text>
        </View>
        <View style={styles.verdictMetricDivider} />
        <View style={styles.verdictMetric}>
          <Text style={styles.verdictMetricLabel}>Lowest projected cash</Text>
          <Text style={styles.verdictMetricValue}>
            {formatCurrency(report.verdict.minimumProjectedCash)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EvidenceCard({ report }) {
  const { historical, coverage } = report;
  return (
    <Card style={styles.reportCard}>
      <SectionHeading
        icon={<TrendingUp color={C.red} size={20} strokeWidth={2.2} />}
        subtitle={`${coverage.rangeLabel} · ${historical.transactionCount} transactions`}
        title="What your history says"
      />
      <View style={styles.metricGrid}>
        <MetricBox label="Average monthly credits" value={formatCurrency(historical.averageIncome)} />
        <MetricBox label="Average monthly spending" value={formatCurrency(historical.averageSpending)} />
        <MetricBox
          label="Average free cash flow"
          tone={historical.averageNetCashFlow >= 0 ? "positive" : "red"}
          value={formatCurrency(historical.averageNetCashFlow)}
        />
        <MetricBox
          label="Average savings rate"
          tone={historical.savingsRate >= 0 ? "positive" : "red"}
          value={formatPercent(historical.savingsRate)}
        />
      </View>
      <View style={styles.detailList}>
        <DetailRow
          label="Positive cash-flow months"
          value={`${historical.positiveCashFlowMonths} of ${historical.monthsAnalyzed}`}
        />
        <DetailRow
          label="Identified discretionary spend"
          value={`${formatCurrency(historical.averageDiscretionarySpending)} / month`}
        />
        <DetailRow
          label="Model confidence"
          last
          tone={historical.confidence === "Cautious" ? "red" : "default"}
          value={historical.confidence}
        />
      </View>
    </Card>
  );
}

function PurchaseImpactCard({ report }) {
  const { inputs, verdict } = report;
  return (
    <Card style={styles.reportCard}>
      <SectionHeading
        icon={<WalletCards color={C.red} size={20} strokeWidth={2.2} />}
        subtitle="Full upfront purchase model"
        title="Purchase impact"
      />
      <View style={styles.detailList}>
        <DetailRow label="Selected source" value={inputs.sourceLabel} />
        <DetailRow label="Product price" value={formatCurrency(inputs.purchasePrice)} />
        <DetailRow label="Available cash today" value={formatCurrency(inputs.availableCash)} />
        <DetailRow
          label="Projected cash before purchase"
          value={formatCurrency(verdict.cashAtPurchaseBeforePayment)}
        />
        <DetailRow
          label="Full purchase deduction"
          tone="red"
          value={formatCurrency(-inputs.purchasePrice)}
        />
        <DetailRow label="Protected cash reserve" value={formatCurrency(inputs.protectedReserve)} />
        <DetailRow label="Target month" last value={`Month ${inputs.targetMonth}`} />
      </View>
    </Card>
  );
}

function RunwayChart({ report, reducedMotion }) {
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(report.inputs.targetMonth);

  useEffect(() => {
    setSelectedMonth(report.inputs.targetMonth);
  }, [report]);

  const selectedPoint = useMemo(
    () => report.trajectory.find((point) => point.monthIndex === selectedMonth)
      ?? report.trajectory[0]
      ?? null,
    [report.trajectory, selectedMonth],
  );

  const chartBounds = useMemo(() => {
    const values = report.trajectory.flatMap((point) => [
      point.baselineBalance,
      point.simulatedBalance,
    ]);
    const minimum = Math.min(0, ...values);
    const maximum = Math.max(0, ...values);
    const range = Math.max(1000, maximum - minimum);
    const unit = range >= 1_000_000 ? 100_000 : range >= 100_000 ? 10_000 : 1000;
    return {
      maximum: Math.max(unit, Math.ceil((maximum + range * 0.1) / unit) * unit),
      minimum: Math.min(0, Math.floor((minimum - (minimum < 0 ? range * 0.08 : 0)) / unit) * unit),
    };
  }, [report.trajectory]);

  const baselineData = useMemo(
    () => report.trajectory.map((point) => {
      const target = point.monthIndex === report.inputs.targetMonth;
      const showLabel = point.monthIndex === 1
        || target
        || point.monthIndex === report.verdict.forecastMonths
        || point.monthIndex % 6 === 0;
      return {
        value: point.baselineBalance,
        label: showLabel ? `M+${point.monthIndex}` : "",
        dataPointRadius: target ? 6 : 2,
        dataPointColor: C.navy2,
        customDataPoint: target ? () => <TargetPoint color={C.navy2} /> : undefined,
        onPress: () => setSelectedMonth(point.monthIndex),
      };
    }),
    [report],
  );

  const purchaseData = useMemo(
    () => report.trajectory.map((point) => {
      const target = point.monthIndex === report.inputs.targetMonth;
      return {
        value: point.simulatedBalance,
        dataPointRadius: target ? 6 : 2,
        dataPointColor: C.red,
        customDataPoint: target ? () => <TargetPoint color={C.red} /> : undefined,
        showVerticalLine: target,
        verticalLineColor: "rgba(235,0,27,0.24)",
        verticalLineThickness: 1,
        verticalLineStrokeDashArray: [5, 5],
        onPress: () => setSelectedMonth(point.monthIndex),
      };
    }),
    [report],
  );

  return (
    <Card style={styles.reportCard}>
      <SectionHeading
        icon={<TrendingUp color={C.red} size={20} strokeWidth={2.2} />}
        subtitle={`Cash position across ${report.verdict.forecastMonths} months`}
        title="Detailed cash runway"
      />
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: C.navy2 }]} />
          <Text style={styles.legendText}>Without purchase</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: C.red }]} />
          <Text style={styles.legendText}>With purchase</Text>
        </View>
      </View>
      <View
        onLayout={(event) => setChartWidth(Math.floor(event.nativeEvent.layout.width))}
        style={styles.chartWrap}
      >
        {chartWidth > 0 ? (
          <LineChart
            animateOnDataChange={!reducedMotion}
            animateTogether
            animationDuration={reducedMotion ? 0 : 420}
            backgroundColor="transparent"
            color1={C.navy2}
            color2={C.red}
            curved
            curvature={0.12}
            data={baselineData}
            data2={purchaseData}
            dataPointsColor1={C.navy2}
            dataPointsColor2={C.red}
            dataPointsRadius1={2}
            dataPointsRadius2={2}
            endSpacing={14}
            focusEnabled
            focusTogether
            focusedDataPointColor={C.red}
            focusedDataPointIndex={Math.max(0, selectedMonth - 1)}
            focusedDataPointRadius={5}
            formatYLabel={formatCompactCurrency}
            height={230}
            initialSpacing={10}
            isAnimated={!reducedMotion}
            labelsExtraHeight={8}
            maxValue={chartBounds.maximum}
            mostNegativeValue={chartBounds.minimum}
            noOfSections={4}
            noOfSectionsBelowXAxis={chartBounds.minimum < 0 ? 2 : 0}
            onDataChangeAnimationDuration={reducedMotion ? 0 : 240}
            onFocus={(_, index) => {
              const point = report.trajectory[index];
              if (point) setSelectedMonth(point.monthIndex);
            }}
            overflowTop={16}
            parentWidth={chartWidth}
            rulesColor="#EDF0F4"
            rulesThickness={1}
            scrollAnimation={!reducedMotion}
            showDataPointOnFocus
            showScrollIndicator={false}
            spacing={28}
            thickness1={3}
            thickness2={3}
            width={Math.max(218, chartWidth - 55)}
            xAxisColor={C.border}
            xAxisLabelTextStyle={styles.axisText}
            xAxisLabelsHeight={28}
            xAxisThickness={1}
            yAxisColor="transparent"
            yAxisLabelWidth={52}
            yAxisTextStyle={styles.axisText}
            yAxisThickness={0}
          />
        ) : null}
      </View>
      {selectedPoint ? (
        <View style={styles.chartInspector}>
          <View style={styles.chartInspectorHeader}>
            <Text style={styles.chartInspectorTitle}>Month {selectedPoint.monthIndex}</Text>
            <Text style={styles.chartInspectorSaving}>
              Forecast net flow {formatCurrency(selectedPoint.projectedNetSavings)}
            </Text>
          </View>
          <View style={styles.metricGrid}>
            <MetricBox label="Without purchase" value={formatCurrency(selectedPoint.baselineBalance)} />
            <MetricBox
              label="With purchase"
              tone={selectedPoint.simulatedBalance < 0 ? "red" : "default"}
              value={formatCurrency(selectedPoint.simulatedBalance)}
            />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function QuestionsCard({ questions }) {
  return (
    <Card style={styles.reportCard}>
      <SectionHeading
        icon={<HelpCircle color={C.red} size={20} strokeWidth={2.2} />}
        subtitle="Plain-language answers from this plan"
        title="Questions you may have"
      />
      <View style={styles.questionList}>
        {questions.map((item, index) => (
          <View key={item.question} style={[
            styles.questionItem,
            index === questions.length - 1 && styles.questionItemLast,
          ]}>
            <Text style={styles.questionText}>{item.question}</Text>
            <Text style={styles.answerText}>{item.answer}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function RecommendationsCard({ recommendations }) {
  return (
    <View style={styles.recommendationsCard}>
      <View style={styles.recommendationsHeader}>
        <ShieldCheck color={C.white} size={22} strokeWidth={2.3} />
        <View style={styles.recommendationsHeaderCopy}>
          <Text style={styles.recommendationsTitle}>Recommended next steps</Text>
          <Text style={styles.recommendationsSubtitle}>Based on this exact scenario</Text>
        </View>
      </View>
      <View style={styles.recommendationList}>
        {recommendations.map((recommendation) => (
          <View key={recommendation} style={styles.recommendationItem}>
            <View style={styles.recommendationDot} />
            <Text style={styles.recommendationText}>{recommendation}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function SimulatorScreen({ navigation }) {
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const pageScrollRef = useRef(null);
  const reducedMotionRef = useRef(reducedMotion);
  const analysisTimerRef = useRef(null);
  const analysisGenerationRef = useRef(0);
  const sourceGenerationRef = useRef(0);
  const statementListGenerationRef = useRef(0);
  const statementDetailGenerationRef = useRef(0);
  const importGenerationRef = useRef(0);
  const importActiveRef = useRef(false);
  const activeUserUidRef = useRef(user?.uid ?? null);
  const selectedStatementIdRef = useRef(null);
  const pendingCloudSaveRef = useRef(null);
  activeUserUidRef.current = user?.uid ?? null;
  reducedMotionRef.current = reducedMotion;

  const [accountTransactions, setAccountTransactions] = useState([]);
  const [accountIgnoredCount, setAccountIgnoredCount] = useState(0);
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [accountError, setAccountError] = useState(null);
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);

  const [statements, setStatements] = useState([]);
  const [ignoredStatementCount, setIgnoredStatementCount] = useState(0);
  const [isStatementListLoading, setIsStatementListLoading] = useState(true);
  const [statementListError, setStatementListError] = useState(null);
  const [selectedStatementId, setSelectedStatementId] = useState(null);
  const [selectedStatementDetail, setSelectedStatementDetail] = useState(null);
  const [isStatementDetailLoading, setIsStatementDetailLoading] = useState(false);
  const [statementDetailError, setStatementDetailError] = useState(null);

  const [importAction, setImportAction] = useState(null);
  const [importError, setImportError] = useState(null);
  const [pendingCloudSave, setPendingCloudSave] = useState(null);
  const [pendingCloudSync, setPendingCloudSync] = useState(null);

  const [purchaseName, setPurchaseName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [availableCashInput, setAvailableCashInput] = useState("");
  const [protectedReserveInput, setProtectedReserveInput] = useState("");
  const [targetMonth, setTargetMonth] = useState(3);
  const [focusedField, setFocusedField] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [analysisState, setAnalysisState] = useState("idle");
  const [report, setReport] = useState(null);

  pendingCloudSaveRef.current = pendingCloudSave;

  const clearPendingAnalysis = useCallback(() => {
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  }, []);

  const invalidateAnalysis = useCallback(() => {
    analysisGenerationRef.current += 1;
    clearPendingAnalysis();
    setAnalysisState("idle");
    setReport(null);
    setSubmitError("");
  }, [clearPendingAnalysis]);

  const invalidateSourceAnalysis = () => {
    sourceGenerationRef.current += 1;
    invalidateAnalysis();
  };

  const screenState = analysisState === "loading"
    ? "loading"
    : analysisState === "ready" && report
      ? "ready"
      : "idle";

  useEffect(() => {
    pageScrollRef.current?.scrollTo({
      y: 0,
      animated: !reducedMotionRef.current,
    });
  }, [screenState]);

  const handleBack = useCallback(() => {
    if (screenState !== "idle") {
      invalidateAnalysis();
      return;
    }
    navigation?.goBack?.();
  }, [invalidateAnalysis, navigation, screenState]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android" || screenState === "idle") return undefined;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        invalidateAnalysis();
        return true;
      });
      return () => subscription.remove();
    }, [invalidateAnalysis, screenState]),
  );

  const refreshStatementList = async (expectedUid = activeUserUidRef.current) => {
    const requestId = statementListGenerationRef.current + 1;
    statementListGenerationRef.current = requestId;

    if (!expectedUid || activeUserUidRef.current !== expectedUid) {
      setIsStatementListLoading(false);
      setStatementListError("Sign in to load saved statements.");
      return;
    }

    setIsStatementListLoading(true);
    setStatementListError(null);
    try {
      const result = await loadPrivateStatements(expectedUid);
      if (
        statementListGenerationRef.current !== requestId
        || activeUserUidRef.current !== expectedUid
      ) return;
      setStatements(result.statements);
      setIgnoredStatementCount(result.ignoredCount);
      setIsStatementListLoading(false);
    } catch (error) {
      if (
        statementListGenerationRef.current !== requestId
        || activeUserUidRef.current !== expectedUid
      ) return;
      setStatementListError(readableError(
        error,
        "Your saved statements could not be loaded. Try again.",
      ));
      setIsStatementListLoading(false);
    }
  };

  const loadSelectedStatement = async (
    statementId,
    expectedUid = activeUserUidRef.current,
  ) => {
    const requestId = statementDetailGenerationRef.current + 1;
    statementDetailGenerationRef.current = requestId;

    if (
      !expectedUid
      || activeUserUidRef.current !== expectedUid
      || selectedStatementIdRef.current !== statementId
    ) return;

    setSelectedStatementDetail(null);
    setIsStatementDetailLoading(true);
    setStatementDetailError(null);
    try {
      const detail = await loadPrivateStatement(expectedUid, statementId);
      if (
        statementDetailGenerationRef.current !== requestId
        || activeUserUidRef.current !== expectedUid
        || selectedStatementIdRef.current !== statementId
      ) return;
      if (detail?.statement?.id !== statementId) {
        throw new Error("The saved statement response did not match the selected source.");
      }
      setSelectedStatementDetail(detail);
      setIsStatementDetailLoading(false);
      invalidateSourceAnalysis();
    } catch (error) {
      if (
        statementDetailGenerationRef.current !== requestId
        || activeUserUidRef.current !== expectedUid
        || selectedStatementIdRef.current !== statementId
      ) return;
      setSelectedStatementDetail(null);
      setStatementDetailError(readableError(
        error,
        "This saved statement could not be opened. Try again.",
      ));
      setIsStatementDetailLoading(false);
    }
  };

  const selectTransactionSource = (statementId, force = false) => {
    const normalizedId = typeof statementId === "string" ? statementId : null;
    const unchanged = selectedStatementIdRef.current === normalizedId;
    if (unchanged && !force) return;

    statementDetailGenerationRef.current += 1;
    selectedStatementIdRef.current = normalizedId;
    setSelectedStatementId(normalizedId);
    setSelectedStatementDetail(null);
    setStatementDetailError(null);
    setIsStatementDetailLoading(Boolean(normalizedId));
    invalidateSourceAnalysis();

    if (normalizedId) void loadSelectedStatement(normalizedId);
  };

  useEffect(() => {
    const requestUid = user?.uid ?? null;
    statementListGenerationRef.current += 1;
    statementDetailGenerationRef.current += 1;
    importGenerationRef.current += 1;
    sourceGenerationRef.current += 1;
    analysisGenerationRef.current += 1;
    importActiveRef.current = false;
    selectedStatementIdRef.current = null;
    pendingCloudSaveRef.current = null;
    clearPendingAnalysis();

    setAccountTransactions([]);
    setAccountIgnoredCount(0);
    setIsAccountLoading(Boolean(requestUid));
    setAccountError(requestUid ? null : "Sign in to load your private transaction history.");
    setStatements([]);
    setIgnoredStatementCount(0);
    setIsStatementListLoading(Boolean(requestUid));
    setStatementListError(requestUid ? null : "Sign in to load saved statements.");
    setSelectedStatementId(null);
    setSelectedStatementDetail(null);
    setIsStatementDetailLoading(false);
    setStatementDetailError(null);
    setImportAction(null);
    setImportError(null);
    setPendingCloudSave(null);
    setPendingCloudSync(null);
    setAnalysisState("idle");
    setReport(null);
    setSubmitError("");

    if (requestUid) void refreshStatementList(requestUid);

    return () => {
      statementListGenerationRef.current += 1;
      statementDetailGenerationRef.current += 1;
      importGenerationRef.current += 1;
      sourceGenerationRef.current += 1;
      analysisGenerationRef.current += 1;
      importActiveRef.current = false;
      clearPendingAnalysis();
      if (activeUserUidRef.current === requestUid) activeUserUidRef.current = null;
    };
  }, [user?.uid]);

  useEffect(() => {
    const requestUid = user?.uid;
    if (!requestUid) return undefined;

    let active = true;
    setIsAccountLoading(true);
    setAccountError(null);

    let unsubscribe;
    try {
      unsubscribe = subscribeToPrivateTransactions(
        requestUid,
        ({ transactions: nextTransactions, ignoredCount: nextIgnoredCount }) => {
          if (!active || activeUserUidRef.current !== requestUid) return;
          setAccountTransactions(nextTransactions);
          setAccountIgnoredCount(nextIgnoredCount);
          setAccountError(null);
          setIsAccountLoading(false);
          if (selectedStatementIdRef.current === null) invalidateSourceAnalysis();
        },
        (error) => {
          if (!active || activeUserUidRef.current !== requestUid) return;
          setAccountError(error?.message || "Unable to sync your transaction history.");
          setIsAccountLoading(false);
          if (selectedStatementIdRef.current === null) invalidateSourceAnalysis();
        },
      );
    } catch (error) {
      setAccountError(error?.message || "Unable to sync your transaction history.");
      setIsAccountLoading(false);
      if (selectedStatementIdRef.current === null) invalidateSourceAnalysis();
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [subscriptionVersion, user?.uid]);

  const runCsvImport = async () => {
    const requestUid = activeUserUidRef.current;
    if (!requestUid) {
      setImportError("Sign in before uploading a bank statement.");
      return;
    }
    if (importActiveRef.current) return;
    if (pendingCloudSaveRef.current) {
      setImportError("Retry the pending private cloud save before uploading another statement.");
      return;
    }

    const requestId = importGenerationRef.current + 1;
    importGenerationRef.current = requestId;
    importActiveRef.current = true;
    setImportAction("upload");
    setImportError(null);
    invalidateSourceAnalysis();

    try {
      const { importCsvStatement } = await import("../services/csvService");
      const result = await importCsvStatement(requestUid);
      if (
        importGenerationRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      if (result.canceled) return;

      const nextPendingSave = result.pendingCloudSave ?? null;
      pendingCloudSaveRef.current = nextPendingSave;
      setPendingCloudSave(nextPendingSave);
      setPendingCloudSync(result.cloudSync ?? null);

      if (hasCommittedStatement(result)) {
        if (typeof result.statementId !== "string" || !result.statementId) {
          setImportError("The uploaded statement was saved without a valid statement reference.");
          return;
        }
        void refreshStatementList(requestUid);
        selectTransactionSource(result.statementId, true);
      } else if (!nextPendingSave) {
        setImportError(
          result.cloudSync?.message
          || "The statement was analyzed but its private save could not be confirmed.",
        );
      }
    } catch (error) {
      if (
        importGenerationRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      setImportError(readableError(
        error,
        "The statement could not be uploaded. Check the file and your connection, then try again.",
      ));
    } finally {
      if (
        importGenerationRef.current === requestId
        && activeUserUidRef.current === requestUid
      ) {
        importActiveRef.current = false;
        setImportAction(null);
      }
    }
  };

  const retryCloudSave = async () => {
    const requestUid = activeUserUidRef.current;
    const retryToken = pendingCloudSaveRef.current;
    if (!requestUid) {
      setImportError("Sign in before retrying the private cloud save.");
      return;
    }
    if (!retryToken || importActiveRef.current) return;

    const requestId = importGenerationRef.current + 1;
    importGenerationRef.current = requestId;
    importActiveRef.current = true;
    setImportAction("retry");
    setImportError(null);
    invalidateSourceAnalysis();

    try {
      const { retryImportedStatementCloudSave } = await import("../services/csvService");
      const result = await retryImportedStatementCloudSave(requestUid, retryToken);
      if (
        importGenerationRef.current !== requestId
        || activeUserUidRef.current !== requestUid
        || pendingCloudSaveRef.current !== retryToken
      ) return;

      const nextPendingSave = result.pendingCloudSave ?? null;
      pendingCloudSaveRef.current = nextPendingSave;
      setPendingCloudSave(nextPendingSave);
      setPendingCloudSync(result.cloudSync ?? null);

      if (hasCommittedStatement(result)) {
        if (typeof result.statementId !== "string" || !result.statementId) {
          setImportError("The saved statement did not return a valid statement reference.");
          return;
        }
        void refreshStatementList(requestUid);
        selectTransactionSource(result.statementId, true);
      } else if (!nextPendingSave) {
        setImportError(
          result.cloudSync?.message
          || "The private statement save could not be confirmed.",
        );
      }
    } catch (error) {
      if (
        importGenerationRef.current !== requestId
        || activeUserUidRef.current !== requestUid
      ) return;
      setImportError(readableError(
        error,
        "The private cloud save could not be retried. Check your connection and try again.",
      ));
    } finally {
      if (
        importGenerationRef.current === requestId
        && activeUserUidRef.current === requestUid
      ) {
        importActiveRef.current = false;
        setImportAction(null);
      }
    }
  };

  const selectedStatementMetadata = selectedStatementDetail?.statement?.id === selectedStatementId
    ? selectedStatementDetail.statement
    : statements.find((statement) => statement.id === selectedStatementId) ?? null;
  const sourceLabel = selectedStatementId === null
    ? ALL_TRANSACTIONS_LABEL
    : selectedStatementMetadata?.displayName ?? "Selected statement";
  const analysisTransactions = selectedStatementId === null
    ? accountTransactions
    : selectedStatementDetail?.statement?.id === selectedStatementId
      ? selectedStatementDetail.transactions
      : [];
  const analysisIgnoredCount = selectedStatementId === null
    ? accountIgnoredCount
    : selectedStatementDetail?.ignoredCount ?? 0;
  const isHistoryLoading = selectedStatementId === null
    ? isAccountLoading
    : isStatementDetailLoading;
  const historyError = selectedStatementId === null
    ? accountError
    : statementDetailError;
  const isImportBusy = importAction !== null;

  usePreventRemove(
    isImportBusy || Boolean(pendingCloudSave),
    ({ data }) => {
      if (isImportBusy) {
        Alert.alert(
          "Statement import in progress",
          "Keep this screen open until the private statement import finishes.",
          [{ text: "Keep importing", style: "cancel" }],
        );
        return;
      }
      Alert.alert(
        "Private save is still pending",
        "Leaving now removes the in-memory retry copy. Stay here to retry, or discard it and upload the statement again later.",
        [
          { text: "Keep retry copy", style: "cancel" },
          {
            text: "Discard and leave",
            style: "destructive",
            onPress: () => navigation?.dispatch?.(data.action),
          },
        ],
      );
    },
  );
  const pageTitle = screenState === "loading"
    ? "Analysing purchase"
    : screenState === "ready"
      ? "Purchase analysis"
      : "Purchase planner";
  const pageSubtitle = screenState === "loading"
    ? `Checking ${purchaseName.trim()} against ${sourceLabel} with a full-price cash-flow model.`
    : screenState === "ready"
      ? `Review the full-price impact, cash runway, and next steps for ${report.inputs.purchaseName}.`
      : "Test a real purchase against your cash, reserve, and verified transaction history.";

  const coverage = useMemo(
    () => analyzeTransactionCoverage(analysisTransactions),
    [analysisTransactions],
  );

  const purchasePrice = finiteNumber(priceInput);
  const availableCash = finiteNumber(availableCashInput);
  const protectedReserve = finiteNumber(protectedReserveInput);
  const hasProductBasics = purchaseName.trim().length > 0
    && Number.isFinite(purchasePrice)
    && purchasePrice > 0;

  const errors = {
    purchaseName: !purchaseName.trim() ? "Enter the product or purchase name." : "",
    price: !Number.isFinite(purchasePrice) || purchasePrice <= 0
      ? "Enter a price greater than ₹0."
      : "",
    availableCash: !Number.isFinite(availableCash) || availableCash < 0
      ? "Enter your current spendable bank cash."
      : "",
    protectedReserve: !Number.isFinite(protectedReserve) || protectedReserve < 0
      ? "Enter a reserve amount. Use 0 only if that is intentional."
      : "",
  };

  const formValid = hasProductBasics
    && !errors.availableCash
    && !errors.protectedReserve;
  const historyReady = !isHistoryLoading && !historyError && coverage.hasMinimumHistory;
  const canAttemptAnalysis = hasProductBasics
    && historyReady
    && !isImportBusy
    && analysisState !== "loading";

  const updateValue = (setter, value) => {
    setter(value);
    invalidateAnalysis();
  };

  const markTouched = (field) => {
    setFocusedField(null);
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const retryHistorySource = () => {
    invalidateSourceAnalysis();
    if (selectedStatementIdRef.current === null) {
      setSubscriptionVersion((version) => version + 1);
      return;
    }
    void loadSelectedStatement(selectedStatementIdRef.current);
  };

  const runAnalysis = () => {
    Keyboard.dismiss();
    setFocusedField(null);
    setTouched({
      purchaseName: true,
      price: true,
      availableCash: true,
      protectedReserve: true,
    });

    if (!formValid) {
      setSubmitError("Complete the required cash details before analysing.");
      AccessibilityInfo.announceForAccessibility("Complete the required purchase details.");
      return;
    }
    if (!historyReady) {
      setSubmitError("Six consecutive completed months are required from the selected source.");
      return;
    }

    const analysisInputs = {
      purchaseName: purchaseName.trim(),
      purchasePrice,
      availableCash,
      protectedReserve,
      targetMonth,
      sourceLabel,
    };
    const transactionSnapshot = [...analysisTransactions];
    const requestUid = activeUserUidRef.current;
    const requestSourceId = selectedStatementIdRef.current;
    const requestSourceGeneration = sourceGenerationRef.current;
    const requestId = analysisGenerationRef.current + 1;
    analysisGenerationRef.current = requestId;

    clearPendingAnalysis();
    setSubmitError("");
    setReport(null);
    setAnalysisState("loading");

    const timer = setTimeout(() => {
      if (
        analysisTimerRef.current !== timer
        || analysisGenerationRef.current !== requestId
        || sourceGenerationRef.current !== requestSourceGeneration
        || activeUserUidRef.current !== requestUid
        || selectedStatementIdRef.current !== requestSourceId
      ) return;

      const nextReport = analyzePurchasePlan(transactionSnapshot, analysisInputs);
      if (
        analysisGenerationRef.current !== requestId
        || sourceGenerationRef.current !== requestSourceGeneration
        || activeUserUidRef.current !== requestUid
        || selectedStatementIdRef.current !== requestSourceId
      ) return;

      analysisTimerRef.current = null;
      if (!nextReport.eligible) {
        setAnalysisState("idle");
        setSubmitError(nextReport.errors?.[0] || "The analysis could not be completed.");
        return;
      }
      setReport(nextReport);
      setAnalysisState("ready");
      AccessibilityInfo.announceForAccessibility(
        nextReport.verdict.status === "affordable"
          ? `${analysisInputs.purchaseName} is affordable under this plan.`
          : nextReport.verdict.status === "caution"
            ? `${analysisInputs.purchaseName} is possible but financially tight.`
            : `${analysisInputs.purchaseName} is not affordable under this plan.`,
      );
    }, ANALYSIS_DELAY_MS);
    analysisTimerRef.current = timer;
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar backgroundColor={C.page} style="dark" />
      <ScrollView
        ref={pageScrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityHint={screenState === "idle"
                ? "Returns to the previous screen"
                : "Returns to the purchase form without clearing your entries"}
              accessibilityLabel={screenState === "idle" ? "Go back" : "Edit purchase"}
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.iconButtonPressed]}
            >
              <ArrowLeft color={C.navy} size={21} strokeWidth={2.3} />
            </Pressable>
            <View style={styles.brandMark}>
              <View style={styles.brandMarkDot} />
              <Text style={styles.brandMarkText}>FINSIGHT</Text>
            </View>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>{pageTitle}</Text>
            <Text style={styles.pageSubtitle}>{pageSubtitle}</Text>
          </View>

          {screenState === "idle" ? (
            <Card style={styles.formCard}>
            <SectionHeading
              icon={<Target color={C.red} size={21} strokeWidth={2.3} />}
              subtitle="Start with the purchase itself"
              title="What are you planning to buy?"
            />

            <FormField
              accessibilityLabel="Product or purchase name"
              error={touched.purchaseName ? errors.purchaseName : ""}
              focused={focusedField === "purchaseName"}
              label="Product name"
              maxLength={50}
              onBlur={() => markTouched("purchaseName")}
              onChangeText={(value) => updateValue(setPurchaseName, value)}
              onFocus={() => setFocusedField("purchaseName")}
              placeholder="e.g. MacBook Pro, car, course"
              value={purchaseName}
            />
            <FormField
              accessibilityLabel="Total product price"
              error={touched.price ? errors.price : ""}
              focused={focusedField === "price"}
              helper={priceInput ? `Total entered: ${formatCurrency(purchasePrice)}` : "Enter the complete purchase price."}
              keyboardType="number-pad"
              label="Total price"
              maxLength={12}
              onBlur={() => markTouched("price")}
              onChangeText={(value) => updateValue(setPriceInput, sanitizeWholeNumber(value))}
              onFocus={() => setFocusedField("price")}
              placeholder="60,000"
              prefix="₹"
              value={priceInput}
            />

            {!hasProductBasics ? (
              <View style={styles.continueHint}>
                <View style={styles.continueHintLine} />
                <Text style={styles.continueHintText}>
                  Enter both fields to continue with cash and statement details.
                </Text>
                <View style={styles.continueHintLine} />
              </View>
            ) : (
              <View style={styles.advancedFields}>
                <View style={styles.formDivider} />
                <Text style={styles.formSectionTitle}>Your real cash position</Text>
                <Text style={styles.formSectionCopy}>
                  Transaction history does not contain your bank balance. Enter the spendable amount available today.
                </Text>

                <FormField
                  error={touched.availableCash ? errors.availableCash : ""}
                  focused={focusedField === "availableCash"}
                  helper="Cash in bank or savings that is available—not credit limit or investments."
                  keyboardType="number-pad"
                  label="Available cash today"
                  maxLength={12}
                  onBlur={() => markTouched("availableCash")}
                  onChangeText={(value) => updateValue(setAvailableCashInput, sanitizeWholeNumber(value))}
                  onFocus={() => setFocusedField("availableCash")}
                  placeholder="Enter current bank cash"
                  prefix="₹"
                  value={availableCashInput}
                />
                <FormField
                  error={touched.protectedReserve ? errors.protectedReserve : ""}
                  focused={focusedField === "protectedReserve"}
                  helper="This amount must remain untouched after the purchase."
                  keyboardType="number-pad"
                  label="Protected emergency reserve"
                  maxLength={12}
                  onBlur={() => markTouched("protectedReserve")}
                  onChangeText={(value) => updateValue(setProtectedReserveInput, sanitizeWholeNumber(value))}
                  onFocus={() => setFocusedField("protectedReserve")}
                  placeholder="Amount you refuse to spend"
                  prefix="₹"
                  value={protectedReserveInput}
                />

                <View style={styles.statementSection}>
                  <View style={styles.statementSectionHeader}>
                    <View style={styles.statementSectionHeaderCopy}>
                      <Text style={styles.formSectionTitle}>Transaction statement</Text>
                      <Text style={styles.formSectionCopyCompact}>
                        Choose one verified source. Statement transactions are never combined with the account-wide option.
                      </Text>
                    </View>
                    {isStatementListLoading ? (
                      <ActivityIndicator color={C.red} size="small" />
                    ) : null}
                  </View>

                  <View accessibilityRole="radiogroup" style={styles.statementList}>
                    <StatementSourceRow
                      meta={isAccountLoading
                        ? "Syncing private account history…"
                        : `${accountTransactions.length.toLocaleString("en-IN")} validated transactions`}
                      onPress={() => selectTransactionSource(null)}
                      selected={selectedStatementId === null}
                      title={ALL_TRANSACTIONS_LABEL}
                    />
                    {statements.map((statement) => (
                      <StatementSourceRow
                        key={statement.id}
                        loading={selectedStatementId === statement.id && isStatementDetailLoading}
                        meta={`${statement.periodStart} – ${statement.periodEnd} · ${statement.transactionCount.toLocaleString("en-IN")} transactions`}
                        onPress={() => selectTransactionSource(statement.id)}
                        selected={selectedStatementId === statement.id}
                        title={statement.displayName}
                      />
                    ))}
                  </View>

                  {!isStatementListLoading && statements.length === 0 && !statementListError ? (
                    <Text style={styles.statementEmptyText}>
                      No saved statements yet. Upload a CSV here or use all imported transactions.
                    </Text>
                  ) : null}

                  {statementListError ? (
                    <View style={styles.sourceMessage}>
                      <AlertTriangle color={C.red} size={17} strokeWidth={2.2} />
                      <View style={styles.sourceMessageCopy}>
                        <Text style={styles.sourceMessageText}>{statementListError}</Text>
                        <Pressable
                          accessibilityLabel="Retry saved statement list"
                          accessibilityRole="button"
                          onPress={() => void refreshStatementList()}
                          style={({ pressed }) => [styles.inlineLink, pressed && styles.inlineLinkPressed]}
                        >
                          <Text style={styles.inlineLinkText}>Retry saved statements</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {selectedStatementId && statementDetailError ? (
                    <View style={styles.sourceMessage}>
                      <AlertTriangle color={C.red} size={17} strokeWidth={2.2} />
                      <View style={styles.sourceMessageCopy}>
                        <Text style={styles.sourceMessageText}>{statementDetailError}</Text>
                        <Pressable
                          accessibilityLabel="Retry selected statement"
                          accessibilityRole="button"
                          onPress={() => void loadSelectedStatement(selectedStatementId)}
                          style={({ pressed }) => [styles.inlineLink, pressed && styles.inlineLinkPressed]}
                        >
                          <Text style={styles.inlineLinkText}>Retry this statement</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : null}

                  {ignoredStatementCount > 0 ? (
                    <Text style={styles.statementNoticeText}>
                      {ignoredStatementCount.toLocaleString("en-IN")} invalid saved {ignoredStatementCount === 1 ? "record was" : "records were"} excluded.
                    </Text>
                  ) : null}

                  {importError ? (
                    <View style={styles.sourceMessage}>
                      <AlertTriangle color={C.red} size={17} strokeWidth={2.2} />
                      <Text style={styles.sourceMessageText}>{importError}</Text>
                    </View>
                  ) : null}

                  {pendingCloudSave ? (
                    <View style={styles.pendingCloudPanel}>
                      <Cloud color={C.warning} size={20} strokeWidth={2.1} />
                      <View style={styles.pendingCloudCopy}>
                        <Text style={styles.pendingCloudTitle}>
                          {pendingCloudSync?.statementCommitted
                            ? "Statement ready; account sync pending"
                            : "Private cloud save pending"}
                        </Text>
                        <Text style={styles.pendingCloudText}>
                          {pendingCloudSync?.message
                            || "Keep this screen open and retry the private save."}
                        </Text>
                        <AppButton
                          busy={importAction === "retry"}
                          disabled={isImportBusy}
                          icon={importAction === "retry"
                            ? <ActivityIndicator color={C.faint} size="small" />
                            : <RefreshCw color={isImportBusy ? C.faint : C.navy} size={18} strokeWidth={2.2} />}
                          label={importAction === "retry" ? "Retrying cloud save…" : "Retry cloud save"}
                          onPress={() => void retryCloudSave()}
                          secondary
                        />
                      </View>
                    </View>
                  ) : null}

                  <AppButton
                    accessibilityLabel="Upload CSV statement here"
                    busy={importAction === "upload"}
                    disabled={isImportBusy || Boolean(pendingCloudSave)}
                    icon={importAction === "upload"
                      ? <ActivityIndicator color={C.faint} size="small" />
                      : <Cloud color={isImportBusy || pendingCloudSave ? C.faint : C.navy} size={18} strokeWidth={2.2} />}
                    label={importAction === "upload" ? "Uploading CSV…" : "Upload CSV here"}
                    onPress={() => void runCsvImport()}
                    secondary
                  />
                </View>

                <View style={styles.optionBlock}>
                  <View style={styles.optionLabelRow}>
                    <View style={styles.optionLabelWithIcon}>
                      <CalendarDays color={C.muted} size={17} strokeWidth={2} />
                      <Text style={styles.fieldLabelInline}>When will you buy it?</Text>
                    </View>
                    <Text style={styles.optionValue}>Month {targetMonth}</Text>
                  </View>
                  <View accessibilityRole="radiogroup" style={styles.segmentRow}>
                    {TARGET_MONTH_OPTIONS.map((months) => (
                      <Segment
                        key={months}
                        label={`${months}M`}
                        onPress={() => updateValue(setTargetMonth, months)}
                        selected={targetMonth === months}
                      />
                    ))}
                  </View>
                </View>

                <HistoryGate
                  coverage={coverage}
                  ignoredCount={analysisIgnoredCount}
                  importBusy={isImportBusy || Boolean(pendingCloudSave)}
                  isLoading={isHistoryLoading}
                  loadError={historyError}
                  onImport={() => void runCsvImport()}
                  onRetry={retryHistorySource}
                  sourceLabel={sourceLabel}
                />

                {submitError ? (
                  <View accessibilityLiveRegion="polite" style={styles.submitError}>
                    <AlertTriangle color={C.red} size={18} strokeWidth={2.2} />
                    <Text style={styles.submitErrorText}>{submitError}</Text>
                  </View>
                ) : null}

                <AppButton
                  disabled={!canAttemptAnalysis}
                  icon={<TrendingUp color={canAttemptAnalysis ? C.white : C.faint} size={19} strokeWidth={2.4} />}
                  label={analysisState === "loading" ? "Analysing purchase…" : "Analyse purchase"}
                  onPress={runAnalysis}
                />
                <Text style={styles.analysisPrivacyNote}>
                  Analysis runs locally. No external AI service receives your transactions.
                </Text>
              </View>
            )}
            </Card>
          ) : null}

          {screenState === "loading" ? (
            <View style={styles.resultsStack}>
              <AnalysisLoader
                coverage={coverage}
                purchaseName={purchaseName.trim()}
                reducedMotion={reducedMotion}
                sourceLabel={sourceLabel}
                targetMonth={targetMonth}
              />
            </View>
          ) : null}

          {screenState === "ready" && report ? (
            <View style={styles.resultsStack}>
              <ReportContextBar onEdit={invalidateAnalysis} report={report} />
              <VerdictCard report={report} />
              <EvidenceCard report={report} />
              <PurchaseImpactCard report={report} />
              <RunwayChart reducedMotion={reducedMotion} report={report} />
              <QuestionsCard questions={report.questions} />
              <RecommendationsCard recommendations={report.recommendations} />
              <View style={styles.methodNote}>
                <Cpu color={C.muted} size={17} strokeWidth={2} />
                <Text style={styles.methodNoteText}>
                  This is a deterministic estimate, not financial advice. Re-run it whenever your balance, income, reserve, transaction source, purchase timing, or price changes.
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.page,
  },
  scrollContent: {
    paddingBottom: 52,
  },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  topBar: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  brandMarkDot: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: C.red,
    transform: [{ rotate: "45deg" }],
  },
  brandMarkText: {
    color: C.navy,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
  },
  topBarSpacer: {
    width: 46,
  },
  pageHeader: {
    paddingTop: 25,
    paddingBottom: 23,
  },
  pageTitle: {
    color: C.navy,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    letterSpacing: -1,
  },
  pageSubtitle: {
    maxWidth: 620,
    marginTop: 8,
    color: C.body,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  formCard: {
    padding: 20,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.redSoft,
  },
  sectionHeadingCopy: {
    flex: 1,
    marginLeft: 12,
  },
  sectionTitle: {
    color: C.navy,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.35,
  },
  sectionSubtitle: {
    marginTop: 2,
    color: C.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    marginBottom: 8,
    color: C.navy2,
    fontSize: 13,
    fontWeight: "800",
  },
  inputShell: {
    minHeight: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.card,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  inputShellFocused: {
    borderColor: C.red,
    shadowColor: C.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 7,
  },
  inputShellError: {
    borderColor: C.red,
    backgroundColor: C.dangerSoft,
  },
  input: {
    minHeight: 52,
    flex: 1,
    paddingVertical: 0,
    color: C.navy,
    fontSize: 16,
    fontWeight: "700",
  },
  inputAffix: {
    marginRight: 8,
    color: C.navy2,
    fontFamily: MONOSPACE,
    fontSize: 17,
    fontWeight: "700",
  },
  inputSuffix: {
    marginLeft: 8,
    color: C.muted,
    fontSize: 14,
    fontWeight: "800",
  },
  fieldHelper: {
    marginTop: 7,
    color: C.muted,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "500",
  },
  fieldError: {
    marginTop: 7,
    color: C.danger,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
  },
  continueHint: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  continueHintLine: {
    height: 1,
    flex: 1,
    backgroundColor: C.border,
  },
  continueHintText: {
    maxWidth: 190,
    color: C.faint,
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
  },
  advancedFields: {
    paddingTop: 2,
  },
  formDivider: {
    height: 1,
    marginBottom: 20,
    backgroundColor: C.border,
  },
  formSectionTitle: {
    color: C.navy,
    fontSize: 16,
    fontWeight: "900",
  },
  formSectionCopy: {
    marginTop: 5,
    marginBottom: 18,
    color: C.body,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  formSectionCopyCompact: {
    marginTop: 5,
    color: C.body,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  optionBlock: {
    marginBottom: 20,
  },
  optionLabelRow: {
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  fieldLabelInline: {
    color: C.navy2,
    fontSize: 13,
    fontWeight: "800",
  },
  optionValue: {
    color: C.red,
    fontFamily: MONOSPACE,
    fontSize: 12,
    fontWeight: "800",
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
  },
  segment: {
    minHeight: 48,
    flex: 1,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    backgroundColor: C.surface,
  },
  segmentSelected: {
    borderColor: C.navy,
    backgroundColor: C.navy,
  },
  segmentPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  segmentText: {
    color: C.body,
    textAlign: "center",
    fontSize: 11.5,
    fontWeight: "800",
  },
  segmentTextSelected: {
    color: C.white,
  },
  statementSection: {
    marginTop: 2,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 20,
  },
  statementSectionHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  statementSectionHeaderCopy: {
    flex: 1,
  },
  statementList: {
    gap: 9,
  },
  statementRow: {
    minHeight: 66,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
  },
  statementRowSelected: {
    borderColor: C.navy,
    backgroundColor: C.card,
  },
  statementRowPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.992 }],
  },
  statementRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: C.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.card,
  },
  statementRadioSelected: {
    borderColor: C.red,
  },
  statementRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.red,
  },
  statementRowCopy: {
    flex: 1,
    marginHorizontal: 11,
  },
  statementRowTitle: {
    color: C.navy,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "900",
  },
  statementRowMeta: {
    marginTop: 3,
    color: C.muted,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "500",
  },
  statementEmptyText: {
    marginTop: 10,
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
  statementNoticeText: {
    marginTop: 10,
    color: C.muted,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "500",
  },
  sourceMessage: {
    marginTop: 11,
    borderRadius: 13,
    padding: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.dangerSoft,
  },
  sourceMessageCopy: {
    flex: 1,
  },
  sourceMessageText: {
    flex: 1,
    color: C.danger,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  pendingCloudPanel: {
    marginTop: 11,
    marginBottom: 11,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F0DDB8",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: C.warningSoft,
  },
  pendingCloudCopy: {
    flex: 1,
  },
  pendingCloudTitle: {
    color: C.navy,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  pendingCloudText: {
    marginTop: 4,
    marginBottom: 10,
    color: C.body,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "500",
  },
  historyGate: {
    minHeight: 76,
    marginTop: 2,
    marginBottom: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.surface,
  },
  historyGateReady: {
    borderColor: "#D3E8D9",
    backgroundColor: C.successSoft,
  },
  historyGateWarning: {
    borderColor: "#F0DDB8",
    backgroundColor: C.warningSoft,
  },
  historyGateError: {
    borderColor: "#F3C5CB",
    backgroundColor: C.dangerSoft,
  },
  historyGateCopy: {
    flex: 1,
    marginLeft: 10,
  },
  historyGateTitle: {
    color: C.navy,
    fontSize: 12.5,
    fontWeight: "900",
  },
  historyGateText: {
    marginTop: 4,
    color: C.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
  inlineLink: {
    alignSelf: "flex-start",
    minHeight: 48,
    marginTop: 8,
    justifyContent: "center",
  },
  inlineLinkPressed: {
    opacity: 0.65,
  },
  inlineLinkText: {
    color: C.red,
    fontSize: 12,
    fontWeight: "900",
  },
  inlineLinkTextDisabled: {
    color: C.faint,
  },
  iconButton: {
    width: 48,
    height: 48,
    marginLeft: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F3C5CB",
    backgroundColor: C.card,
  },
  iconButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  submitError: {
    marginBottom: 13,
    borderRadius: 13,
    padding: 11,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: C.redSoft,
  },
  submitErrorText: {
    flex: 1,
    color: C.danger,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: "700",
  },
  button: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    backgroundColor: C.navy,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.card,
  },
  buttonDisabled: {
    backgroundColor: C.surfaceStrong,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.988 }],
  },
  buttonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "900",
  },
  buttonSecondaryText: {
    color: C.navy,
  },
  buttonDisabledText: {
    color: C.faint,
  },
  analysisPrivacyNote: {
    marginTop: 9,
    color: C.muted,
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "500",
  },
  resultsStack: {
    marginTop: 18,
    gap: 18,
  },
  reportContextBar: {
    minHeight: 80,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
  },
  reportContextCopy: {
    minWidth: 0,
    flex: 1,
  },
  reportContextProduct: {
    color: C.navy,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
  },
  reportContextSource: {
    marginTop: 3,
    color: C.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  reportContextAssumption: {
    marginTop: 5,
    color: C.red,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  editPurchaseButton: {
    minWidth: 106,
    minHeight: 48,
    marginLeft: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.borderStrong,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
  },
  editPurchaseButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  editPurchaseButtonText: {
    color: C.navy,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
  },
  loaderCard: {
    padding: 24,
    alignItems: "center",
  },
  loaderRing: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.redSoft,
  },
  loaderTitle: {
    marginTop: 17,
    color: C.navy,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
  },
  loaderSubtitle: {
    maxWidth: 430,
    marginTop: 6,
    color: C.body,
    textAlign: "center",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
  },
  loaderSource: {
    width: "100%",
    marginTop: 18,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: C.surface,
  },
  loaderSourceLabel: {
    color: C.muted,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "700",
  },
  loaderSourceValue: {
    marginTop: 2,
    color: C.navy,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  loaderSteps: {
    width: "100%",
    marginTop: 16,
    gap: 12,
  },
  loaderStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  loaderStepDot: {
    width: 8,
    height: 8,
    marginTop: 5,
    borderRadius: 4,
  },
  loaderStepCopy: {
    flex: 1,
  },
  loaderStepTitle: {
    color: C.navy2,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "800",
  },
  loaderStepText: {
    marginTop: 2,
    color: C.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
  verdictCard: {
    borderRadius: 22,
    padding: 20,
    shadowColor: C.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 5,
  },
  verdictHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  verdictIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  verdictHeaderCopy: {
    flex: 1,
    marginLeft: 13,
  },
  verdictStatus: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11.5,
    fontWeight: "800",
  },
  verdictTitle: {
    marginTop: 4,
    color: C.white,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  verdictMessage: {
    marginTop: 15,
    color: "rgba(255,255,255,0.86)",
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: "500",
  },
  verdictMetrics: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.16)",
    flexDirection: "row",
  },
  verdictMetric: {
    flex: 1,
    paddingHorizontal: 5,
  },
  verdictMetricDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  verdictMetricLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
  },
  verdictMetricValue: {
    marginTop: 5,
    color: C.white,
    fontFamily: MONOSPACE,
    fontSize: 17,
    fontWeight: "800",
  },
  reportCard: {
    padding: 18,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricBox: {
    minWidth: 130,
    flexGrow: 1,
    flexBasis: "46%",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    backgroundColor: C.surface,
  },
  metricLabel: {
    color: C.muted,
    fontSize: 10.5,
    lineHeight: 15,
    fontWeight: "600",
  },
  metricValue: {
    marginTop: 6,
    color: C.navy,
    fontFamily: MONOSPACE,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.25,
  },
  detailList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  detailRow: {
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLabel: {
    flex: 1,
    color: C.body,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  detailValue: {
    maxWidth: "52%",
    color: C.navy,
    textAlign: "right",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "900",
  },
  legendRow: {
    marginTop: -4,
    marginBottom: 5,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  legendLine: {
    width: 17,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    color: C.muted,
    fontSize: 10.5,
    fontWeight: "600",
  },
  chartWrap: {
    width: "100%",
    minHeight: 276,
    marginTop: 8,
  },
  axisText: {
    color: C.muted,
    fontSize: 9.5,
    fontWeight: "600",
  },
  targetPoint: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    backgroundColor: C.white,
  },
  chartInspector: {
    marginTop: 2,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  chartInspectorHeader: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  chartInspectorTitle: {
    color: C.navy,
    fontSize: 13,
    fontWeight: "900",
  },
  chartInspectorSaving: {
    flex: 1,
    color: C.muted,
    textAlign: "right",
    fontSize: 10.5,
    fontWeight: "600",
  },
  questionList: {
    marginTop: -2,
  },
  questionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  questionItemLast: {
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  questionText: {
    color: C.navy,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
  },
  answerText: {
    marginTop: 6,
    color: C.body,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "500",
  },
  recommendationsCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: C.navy,
  },
  recommendationsHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  recommendationsHeaderCopy: {
    flex: 1,
    marginLeft: 11,
  },
  recommendationsTitle: {
    color: C.white,
    fontSize: 17,
    fontWeight: "900",
  },
  recommendationsSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "500",
  },
  recommendationList: {
    marginTop: 17,
    gap: 13,
  },
  recommendationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  recommendationDot: {
    width: 7,
    height: 7,
    marginTop: 6,
    borderRadius: 4,
    backgroundColor: C.red,
  },
  recommendationText: {
    flex: 1,
    color: "rgba(255,255,255,0.87)",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "500",
  },
  methodNote: {
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  methodNoteText: {
    flex: 1,
    color: C.muted,
    fontSize: 10.5,
    lineHeight: 16,
    fontWeight: "500",
  },
});

export default SimulatorScreen;
