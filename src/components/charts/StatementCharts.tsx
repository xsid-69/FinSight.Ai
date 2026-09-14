import React, { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { MotiView } from "moti";
import { ScrollView, Text, View, XStack, YStack } from "tamagui";

import { Money } from "../banking/Money";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type {
  CategoryInsight,
  MonthlyActivityInsight,
} from "../../types/transactions";

type NumericMonthRange = 3 | 6 | 12;
type MonthRange = NumericMonthRange | "all";
type CashFlowSeries = "income" | "spending";
type CategoryMetric = "amount" | "count";

interface MonthlyCashFlowChartProps {
  data: MonthlyActivityInsight[];
  initialRange?: NumericMonthRange;
  parentPagerGesture?: ReturnType<typeof Gesture.Pan>;
}

interface CategoryHistogramProps {
  data: CategoryInsight[];
  maxItems?: number;
}

interface AnimatedVerticalBarProps {
  amount: number;
  maximum: number;
  color: string;
  active: boolean;
  selected: boolean;
  delay: number;
  reducedMotion: boolean;
}

interface AnimatedHorizontalFillProps {
  ratio: number;
  color: string;
  selected: boolean;
  delay: number;
  reducedMotion: boolean;
}

const RANGE_OPTIONS: NumericMonthRange[] = [3, 6, 12];
const INCOME_COLOR = "#4D8B42";
const SPENDING_COLOR = "#EB001B";
const INACTIVE_BAR_COLOR = "#39435C";
const MOTION_DURATION = 220;

function compactAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.max(0, value));
}

function triggerSelectionHaptic() {
  void Haptics.selectionAsync().catch(() => undefined);
}

function AnimatedVerticalBar({
  amount,
  maximum,
  color,
  active,
  selected,
  delay,
  reducedMotion,
}: AnimatedVerticalBarProps) {
  const targetHeight = amount > 0
    ? Math.max(5, Math.round((amount / maximum) * 108))
    : 3;
  const targetScale = active ? 1 : 0.05;
  const targetOpacity = active
    ? amount > 0
      ? selected ? 1 : 0.72
      : 0.28
    : 0.12;

  return (
    <View width={13} height={112} justifyContent="flex-end" alignItems="center">
      <MotiView
        from={{
          opacity: reducedMotion ? targetOpacity : Math.max(0.28, targetOpacity - 0.2),
          scaleY: reducedMotion ? targetScale : Math.max(0.08, targetScale * 0.16),
        }}
        animate={{ opacity: targetOpacity, scaleY: targetScale }}
        transition={{
          type: "timing",
          duration: reducedMotion ? 1 : MOTION_DURATION,
          delay: reducedMotion ? 0 : delay,
        }}
        style={{
          width: 13,
          height: targetHeight,
          borderRadius: 5,
          backgroundColor: color,
          transformOrigin: "bottom",
        } as never}
      />
    </View>
  );
}

function AnimatedHorizontalFill({
  ratio,
  color,
  selected,
  delay,
  reducedMotion,
}: AnimatedHorizontalFillProps) {
  const targetScale = Math.max(0.035, Math.min(1, ratio));

  return (
    <MotiView
      from={{
        opacity: reducedMotion ? (selected ? 1 : 0.58) : 0.36,
        scaleX: reducedMotion ? targetScale : 0.035,
      }}
      animate={{
        opacity: selected ? 1 : 0.58,
        scaleX: targetScale,
      }}
      transition={{
        type: "timing",
        duration: reducedMotion ? 1 : MOTION_DURATION,
        delay: reducedMotion ? 0 : delay,
      }}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderRadius: 5,
        backgroundColor: color,
        transformOrigin: "left",
      } as never}
    />
  );
}

export function MonthlyCashFlowChart({
  data,
  initialRange = 6,
  parentPagerGesture,
}: MonthlyCashFlowChartProps) {
  const reducedMotion = useReducedMotion();
  const [range, setRange] = useState<MonthRange>(
    data.length > initialRange ? initialRange : "all",
  );
  const [visibleSeries, setVisibleSeries] = useState<Record<CashFlowSeries, boolean>>({
    income: true,
    spending: true,
  });
  const rangeOptions = useMemo<MonthRange[]>(
    () => [
      ...RANGE_OPTIONS.filter((option) => option < data.length),
      "all" as const,
    ],
    [data.length],
  );
  const visibleMonths = useMemo(
    () => range === "all" ? data : data.slice(-range),
    [data, range],
  );
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(
    visibleMonths.at(-1)?.month ?? null,
  );

  useEffect(() => {
    if (range !== "all" && range >= data.length) setRange("all");
  }, [data.length, range]);

  useEffect(() => {
    if (!visibleMonths.some((month) => month.month === selectedMonthId)) {
      setSelectedMonthId(visibleMonths.at(-1)?.month ?? null);
    }
  }, [selectedMonthId, visibleMonths]);

  const selectedMonth = visibleMonths.find((month) => month.month === selectedMonthId)
    ?? visibleMonths.at(-1)
    ?? null;
  // Keep the domain stable when a series is hidden so the remaining bars do
  // not visually change magnitude and undermine financial comparison.
  const maximum = Math.max(
    1,
    ...visibleMonths.flatMap((month) => [month.totalIncome, month.totalSpent]),
  );
  const chartNativeGesture = useMemo(() => {
    const nativeGesture = Gesture.Native();
    return parentPagerGesture && visibleMonths.length > 6
      ? nativeGesture.blocksExternalGesture(parentPagerGesture)
      : nativeGesture;
  }, [parentPagerGesture, visibleMonths.length]);

  if (data.length === 0) return null;

  const selectRange = (option: MonthRange) => {
    if (option === range) return;
    triggerSelectionHaptic();
    setRange(option);
  };

  const selectMonth = (monthId: string) => {
    if (monthId === selectedMonthId) return;
    triggerSelectionHaptic();
    setSelectedMonthId(monthId);
  };

  const toggleSeries = (series: CashFlowSeries) => {
    const otherSeries = series === "income" ? "spending" : "income";
    if (visibleSeries[series] && !visibleSeries[otherSeries]) return;
    triggerSelectionHaptic();
    setVisibleSeries((current) => ({ ...current, [series]: !current[series] }));
  };

  return (
    <YStack gap={16}>
      <XStack alignItems="center" justifyContent="space-between" gap={10} flexWrap="wrap">
        <YStack gap={2} flex={1} minWidth={180}>
          <Text fontSize={14} fontWeight="800" color="$navy">
            Money in vs money out
          </Text>
          <Text fontSize={12.5} color="$ink2" lineHeight={16}>
            Tap a month, change the range, or isolate either series
          </Text>
        </YStack>
        <XStack
          backgroundColor="$surfaceAlt"
          borderRadius={13}
          padding={3}
          accessibilityRole="tablist"
          accessibilityLabel="Cash-flow time range"
        >
          {rangeOptions.map((option) => {
            const selected = range === option;
            const label = option === "all" ? "All" : `${option}M`;
            const accessibilityLabel = option === "all"
              ? `Show all ${data.length} available months`
              : `Show the last ${option} months`;
            return (
              <View
                key={option}
                minWidth={48}
                minHeight={46}
                borderRadius={10}
                alignItems="center"
                justifyContent="center"
                backgroundColor={selected ? "$backgroundStrong" : "transparent"}
                onPress={() => selectRange(option)}
                pressStyle={{ opacity: 0.72, scale: 0.97 }}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={accessibilityLabel}
              >
                <Text fontSize={12} fontWeight="800" color={selected ? "$navy" : "$ink2"}>
                  {label}
                </Text>
              </View>
            );
          })}
        </XStack>
      </XStack>

      {selectedMonth ? (
        <MotiView
          key={selectedMonth.month}
          from={{
            opacity: reducedMotion ? 1 : 0.74,
            translateX: reducedMotion ? 0 : 8,
          }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: reducedMotion ? 1 : 180 }}
        >
          <YStack
            padding={14}
            borderRadius={17}
            backgroundColor="rgba(24,35,61,0.045)"
            gap={11}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`${selectedMonth.label}. Money in ${selectedMonth.totalIncome} rupees. Money out ${selectedMonth.totalSpent} rupees. Net cash flow ${selectedMonth.netCashFlow} rupees.`}
          >
            <XStack alignItems="center" justifyContent="space-between" gap={12}>
              <YStack gap={2} flex={1}>
                <Text fontSize={13.5} fontWeight="800" color="$navy">
                  {selectedMonth.label}
                </Text>
                <Text fontSize={12.5} color="$ink2">
                  {selectedMonth.transactionCount} transaction{selectedMonth.transactionCount === 1 ? "" : "s"}
                </Text>
              </YStack>
              <YStack alignItems="flex-end" gap={3}>
                <Text fontSize={12} color="$ink2">Net cash flow</Text>
                <Money
                  amount={Math.abs(selectedMonth.netCashFlow)}
                  kind={selectedMonth.netCashFlow >= 0 ? "credit" : "debit"}
                  signed
                  size={14.5}
                />
              </YStack>
            </XStack>
            <XStack gap={8} flexWrap="wrap">
              <XStack
                flex={1}
                minWidth={120}
                minHeight={38}
                borderRadius={12}
                paddingHorizontal={10}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor="rgba(77,139,66,0.08)"
              >
                <Text fontSize={12} color="$navy2">Money in</Text>
                <Text fontSize={12.5} fontWeight="800" color="$navy">
                  ₹{Math.round(selectedMonth.totalIncome).toLocaleString("en-IN")}
                </Text>
              </XStack>
              <XStack
                flex={1}
                minWidth={120}
                minHeight={38}
                borderRadius={12}
                paddingHorizontal={10}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor="rgba(235,0,27,0.055)"
              >
                <Text fontSize={12} color="$navy2">Money out</Text>
                <Text fontSize={12.5} fontWeight="800" color="$navy">
                  ₹{Math.round(selectedMonth.totalSpent).toLocaleString("en-IN")}
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </MotiView>
      ) : null}

      <XStack gap={8} flexWrap="wrap" accessibilityRole="toolbar" accessibilityLabel="Visible cash-flow series">
        {([
          ["income", "Money in", INCOME_COLOR],
          ["spending", "Money out", SPENDING_COLOR],
        ] as const).map(([series, label, color]) => {
          const selected = visibleSeries[series];
          const otherSeries: CashFlowSeries = series === "income" ? "spending" : "income";
          const cannotHide = selected && !visibleSeries[otherSeries];
          return (
            <XStack
              key={series}
              minHeight={48}
              paddingHorizontal={12}
              borderRadius={13}
              borderWidth={1}
              borderColor={selected ? color : "$borderColor"}
              backgroundColor={selected ? `${color}12` : "$backgroundStrong"}
              alignItems="center"
              gap={7}
              opacity={cannotHide ? 0.72 : 1}
              onPress={cannotHide ? undefined : () => toggleSeries(series)}
              pressStyle={cannotHide ? undefined : { opacity: 0.74, scale: 0.98 }}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: cannotHide }}
              accessibilityLabel={cannotHide
                ? `${label} is the only visible series`
                : `${selected ? "Hide" : "Show"} ${label.toLowerCase()}`}
              accessibilityHint={cannotHide ? "Show the other series before hiding this one" : undefined}
            >
              <View width={9} height={9} borderRadius={3} backgroundColor={color} opacity={selected ? 1 : 0.35} />
              <Text fontSize={12.5} fontWeight="800" color={selected ? "$navy" : "$ink2"}>
                {label}
              </Text>
            </XStack>
          );
        })}
      </XStack>

      <YStack gap={10}>
        <XStack alignItems="center" justifyContent="space-between" gap={10}>
          <Text fontSize={12} color="$ink2">₹0</Text>
          <Text fontSize={12} color="$ink2">
            Shared scale · ₹{compactAmount(maximum)}
          </Text>
        </XStack>
        <GestureDetector gesture={chartNativeGesture}>
          <ScrollView
            horizontal={visibleMonths.length > 6}
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ minWidth: "100%" }}
            accessibilityLabel="Interactive monthly cash-flow chart"
            accessibilityHint={visibleMonths.length > 6 ? "Swipe horizontally, then tap a month to inspect it" : "Tap a month to inspect it"}
          >
          <XStack
            width={visibleMonths.length > 6 ? visibleMonths.length * 51 : "100%"}
            height={158}
            alignItems="flex-end"
            gap={visibleMonths.length > 6 ? 5 : 4}
            paddingHorizontal={2}
          >
            {visibleMonths.map((month, index) => {
              const selected = month.month === selectedMonth?.month;
              return (
                <MotiView
                  key={month.month}
                  animate={{
                    opacity: selected ? 1 : 0.9,
                    scale: selected ? 1 : 0.975,
                  }}
                  transition={{ type: "timing", duration: reducedMotion ? 1 : 160 }}
                  style={{
                    flex: visibleMonths.length > 6 ? undefined : 1,
                    minWidth: visibleMonths.length > 6 ? 46 : 29,
                    height: "100%",
                  }}
                >
                  <YStack
                    height="100%"
                    justifyContent="flex-end"
                    alignItems="center"
                    gap={7}
                    paddingTop={5}
                    borderRadius={13}
                    borderWidth={selected ? 1 : 0}
                    borderColor={selected ? "rgba(24,35,61,0.10)" : "transparent"}
                    backgroundColor={selected ? "rgba(24,35,61,0.045)" : "transparent"}
                    onPress={() => selectMonth(month.month)}
                    pressStyle={{ opacity: 0.7, scale: 0.98 }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${month.label}, money in ${Math.round(month.totalIncome).toLocaleString("en-IN")} rupees, money out ${Math.round(month.totalSpent).toLocaleString("en-IN")} rupees`}
                  >
                    <XStack height={112} alignItems="flex-end" justifyContent="center" gap={4} width="100%">
                      <AnimatedVerticalBar
                        amount={month.totalIncome}
                        maximum={maximum}
                        color={INCOME_COLOR}
                        active={visibleSeries.income}
                        selected={selected}
                        delay={Math.min(index * 18, 90)}
                        reducedMotion={reducedMotion}
                      />
                      <AnimatedVerticalBar
                        amount={month.totalSpent}
                        maximum={maximum}
                        color={SPENDING_COLOR}
                        active={visibleSeries.spending}
                        selected={selected}
                        delay={Math.min(index * 18 + 12, 102)}
                        reducedMotion={reducedMotion}
                      />
                    </XStack>
                    <Text fontSize={12} fontWeight={selected ? "800" : "600"} color={selected ? "$navy" : "$ink2"}>
                      {month.label.split(" ")[0]}
                    </Text>
                  </YStack>
                </MotiView>
              );
            })}
          </XStack>
          </ScrollView>
        </GestureDetector>
        <Text fontSize={12} lineHeight={17} color="$ink2" textAlign="center">
          Bar heights keep the same scale when either series is hidden, so comparisons stay trustworthy.
        </Text>
      </YStack>
    </YStack>
  );
}

export function CategoryHistogram({ data, maxItems = 10 }: CategoryHistogramProps) {
  const reducedMotion = useReducedMotion();
  const [metric, setMetric] = useState<CategoryMetric>("amount");
  const visibleCategories = useMemo(
    () => [...data]
      .sort((left, right) => {
        const difference = metric === "amount"
          ? right.amount - left.amount
          : right.count - left.count;
        return difference || right.amount - left.amount || left.label.localeCompare(right.label);
      })
      .slice(0, maxItems),
    [data, maxItems, metric],
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    visibleCategories[0]?.category ?? null,
  );

  useEffect(() => {
    if (!visibleCategories.some((category) => category.category === selectedCategoryId)) {
      setSelectedCategoryId(visibleCategories[0]?.category ?? null);
    }
  }, [selectedCategoryId, visibleCategories]);

  const selectedCategory = visibleCategories.find(
    (category) => category.category === selectedCategoryId,
  ) ?? visibleCategories[0] ?? null;
  const maximum = Math.max(
    1,
    ...visibleCategories.map((category) => metric === "amount" ? category.amount : category.count),
  );
  const selectedRank = selectedCategory
    ? visibleCategories.findIndex((category) => category.category === selectedCategory.category) + 1
    : 0;

  if (visibleCategories.length === 0) return null;

  const selectMetric = (nextMetric: CategoryMetric) => {
    if (nextMetric === metric) return;
    triggerSelectionHaptic();
    setMetric(nextMetric);
  };

  const selectCategory = (categoryId: string) => {
    if (categoryId === selectedCategoryId) return;
    triggerSelectionHaptic();
    setSelectedCategoryId(categoryId);
  };

  return (
    <YStack gap={16}>
      <XStack alignItems="center" justifyContent="space-between" gap={10} flexWrap="wrap">
        <YStack gap={2} flex={1} minWidth={180}>
          <Text fontSize={14} fontWeight="800" color="$navy">
            Spending distribution
          </Text>
          <Text fontSize={12.5} color="$ink2" lineHeight={16}>
            Rank categories by spend or transaction activity
          </Text>
        </YStack>
        <XStack
          backgroundColor="$surfaceAlt"
          borderRadius={13}
          padding={3}
          accessibilityRole="tablist"
          accessibilityLabel="Category ranking metric"
        >
          {([
            ["amount", "Spend"],
            ["count", "Activity"],
          ] as const).map(([value, label]) => {
            const selected = metric === value;
            return (
              <View
                key={value}
                minWidth={70}
                minHeight={46}
                borderRadius={10}
                alignItems="center"
                justifyContent="center"
                backgroundColor={selected ? "$backgroundStrong" : "transparent"}
                onPress={() => selectMetric(value)}
                pressStyle={{ opacity: 0.72, scale: 0.97 }}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={`Rank categories by ${label.toLowerCase()}`}
              >
                <Text fontSize={12.5} fontWeight="800" color={selected ? "$navy" : "$ink2"}>
                  {label}
                </Text>
              </View>
            );
          })}
        </XStack>
      </XStack>

      {selectedCategory ? (
        <MotiView
          key={`${metric}-${selectedCategory.category}`}
          from={{
            opacity: reducedMotion ? 1 : 0.74,
            translateX: reducedMotion ? 0 : 8,
          }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: "timing", duration: reducedMotion ? 1 : 180 }}
        >
          <YStack
            padding={14}
            borderRadius={17}
            backgroundColor="rgba(235,0,27,0.055)"
            gap={10}
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`${selectedCategory.label}, ${selectedCategory.amount} rupees, ${selectedCategory.count} debits, ${Math.round(selectedCategory.share)} percent of spending`}
          >
            <XStack justifyContent="space-between" alignItems="center" gap={12}>
              <YStack flex={1} gap={2}>
                <Text fontSize={13.5} fontWeight="800" color="$navy">
                  {selectedCategory.label}
                </Text>
                <Text fontSize={12.5} color="$ink2">
                  Rank {selectedRank} of {visibleCategories.length} by {metric === "amount" ? "spend" : "activity"}
                </Text>
              </YStack>
              <Money amount={selectedCategory.amount} kind="debit" size={14.5} />
            </XStack>
            <XStack gap={8} flexWrap="wrap">
              <XStack
                flex={1}
                minWidth={112}
                minHeight={46}
                borderRadius={11}
                paddingHorizontal={10}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor="rgba(255,255,255,0.72)"
              >
                <Text fontSize={12} color="$navy2">Share</Text>
                <Text fontSize={12.5} fontWeight="800" color="$navy">
                  {Math.round(selectedCategory.share)}%
                </Text>
              </XStack>
              <XStack
                flex={1}
                minWidth={112}
                minHeight={46}
                borderRadius={11}
                paddingHorizontal={10}
                alignItems="center"
                justifyContent="space-between"
                backgroundColor="rgba(255,255,255,0.72)"
              >
                <Text fontSize={12} color="$navy2">Debits</Text>
                <Text fontSize={12.5} fontWeight="800" color="$navy">
                  {selectedCategory.count.toLocaleString("en-IN")}
                </Text>
              </XStack>
            </XStack>
          </YStack>
        </MotiView>
      ) : null}

      <YStack gap={7}>
        {visibleCategories.map((category, index) => {
          const selected = category.category === selectedCategory?.category;
          const metricValue = metric === "amount" ? category.amount : category.count;
          const ratio = metricValue / maximum;
          return (
            <MotiView
              key={category.category}
              from={{
                opacity: reducedMotion ? 1 : 0.72,
                translateX: reducedMotion ? 0 : -7,
              }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: "timing",
                duration: reducedMotion ? 1 : 190,
                delay: reducedMotion ? 0 : Math.min(index * 22, 110),
              }}
            >
              <YStack
                minHeight={55}
                gap={7}
                paddingHorizontal={selected ? 10 : 4}
                paddingVertical={7}
                borderRadius={13}
                backgroundColor={selected ? "rgba(24,35,61,0.045)" : "transparent"}
                onPress={() => selectCategory(category.category)}
                pressStyle={{ opacity: 0.72, scale: 0.99 }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${category.label}, ${compactAmount(category.amount)} rupees, ${category.count} transactions, ${Math.round(category.share)} percent of spending`}
              >
                <XStack alignItems="center" justifyContent="space-between" gap={10}>
                  <XStack flex={1} alignItems="center" gap={8}>
                    <View
                      width={22}
                      height={22}
                      borderRadius={8}
                      backgroundColor={selected ? "$navy" : "$surfaceAlt"}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize={11.5} fontWeight="800" color={selected ? "white" : "$ink2"}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text
                      flex={1}
                      numberOfLines={1}
                      fontSize={12.5}
                      fontWeight={selected ? "800" : "700"}
                      color={selected ? "$navy" : "$navy2"}
                    >
                      {category.label}
                    </Text>
                  </XStack>
                  <Text fontSize={12} fontWeight="700" color="$ink2">
                    {metric === "amount"
                      ? `${compactAmount(category.amount)} · ${Math.round(category.share)}%`
                      : `${category.count.toLocaleString("en-IN")} debit${category.count === 1 ? "" : "s"}`}
                  </Text>
                </XStack>
                <View height={9} borderRadius={5} backgroundColor="$surfaceAlt" overflow="hidden">
                  <AnimatedHorizontalFill
                    ratio={ratio}
                    color={selected ? SPENDING_COLOR : INACTIVE_BAR_COLOR}
                    selected={selected}
                    delay={Math.min(index * 18, 90)}
                    reducedMotion={reducedMotion}
                  />
                </View>
              </YStack>
            </MotiView>
          );
        })}
      </YStack>
    </YStack>
  );
}
