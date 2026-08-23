import React from "react";
import { ScrollView, XStack, YStack, Text, View } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileUp, ChevronRight } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { CohortMirror, AIInsightCard, SectionHeading, Card } from "../../components/finsight";
import { AI_INSIGHT, COHORT } from "../../data/intelligence";

const PAGE_H = 20;
const DOCK_CLEARANCE = 140;

/** Import entry — tapping Insights surfaces this; it opens the analyzer. */
function ImportCard({ onPress }: { onPress?: () => void }) {
  return (
    <Card
      pressStyle={{ scale: 0.99, opacity: 0.95 }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
    >
      <XStack alignItems="center" gap={14}>
        <View width={46} height={46} borderRadius={14} backgroundColor="rgba(235,0,27,0.10)" alignItems="center" justifyContent="center">
          <FileUp size={22} color="$red" strokeWidth={2} />
        </View>
        <YStack flex={1}>
          <Text fontSize={15} fontWeight="800" color="$navy">
            Import a statement
          </Text>
          <Text fontSize={12.5} color="$secondary" marginTop={2}>
            Analyze 6–12 months of history for deeper trends
          </Text>
        </YStack>
        <ChevronRight size={20} color="$secondary" />
      </XStack>
    </Card>
  );
}

export function InsightsContent({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + DOCK_CLEARANCE }}>
      <YStack gap={20}>
        <SectionHeading title="Financial insights" caption="Your money, benchmarked and understood" />
        <ImportCard onPress={() => navigation?.navigate?.("Analyzer")} />
        <AIInsightCard insight={AI_INSIGHT} />
        <CohortMirror cohort={COHORT} />
      </YStack>
    </ScrollView>
  );
}
