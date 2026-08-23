import React from "react";
import { ScrollView, XStack, YStack } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  FinancialHealthCard,
  SummaryStatCard,
  AIInsightCard,
  AnomalyCard,
  SectionHeading,
} from "../../components/finsight";
import { AI_INSIGHT, ANOMALY, HEALTH, SUMMARY_STATS } from "../../data/intelligence";

const PAGE_H = 20;
const DOCK_CLEARANCE = 140;

export function OverviewContent({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + DOCK_CLEARANCE }}>
      <YStack paddingHorizontal={PAGE_H} gap={20}>
        <FinancialHealthCard health={HEALTH} />
      </YStack>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAGE_H, paddingTop: 20 }}>
        <XStack>
          {SUMMARY_STATS.map((s) => (
            <SummaryStatCard key={s.id} stat={s} />
          ))}
        </XStack>
      </ScrollView>

      <YStack paddingHorizontal={PAGE_H} gap={20} paddingTop={20}>
        <AIInsightCard insight={AI_INSIGHT} />
        <YStack gap={12}>
          <SectionHeading title="Anomaly detection" caption="Unusual activity, flagged automatically" />
          <AnomalyCard anomaly={ANOMALY} onDetails={() => navigation?.navigate?.("AI")} />
        </YStack>
      </YStack>
    </ScrollView>
  );
}
