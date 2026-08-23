import React, { useState } from "react";
import { ScrollView, YStack, XStack, Text, View } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, TrendingUp } from "@tamagui/lucide-icons";

import { FinSightShell, StatementUploadCard, AnalysisProgress, Card } from "../components/finsight";

const PAGE_H = 20;
const DOCK_CLEARANCE = 150;

type Phase = "idle" | "analyzing" | "done";

export function StatementAnalyzerScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>("idle");

  return (
    <FinSightShell title="Import statement" onBack={() => navigation?.goBack?.()}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + DOCK_CLEARANCE }}>
        {phase === "idle" ? (
          <StatementUploadCard onUpload={() => setPhase("analyzing")} />
        ) : phase === "analyzing" ? (
          <AnalysisProgress onDone={() => setPhase("done")} onSkip={() => setPhase("done")} />
        ) : (
          <MotiView from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 320 }}>
            <YStack gap={18}>
              <XStack alignItems="center" gap={10}>
                <View width={40} height={40} borderRadius={20} backgroundColor="rgba(99,166,74,0.14)" alignItems="center" justifyContent="center">
                  <CheckCircle2 size={22} color="$success" strokeWidth={2.2} />
                </View>
                <YStack>
                  <Text fontSize={18} fontWeight="800" color="$navy">
                    Analysis complete
                  </Text>
                  <Text fontSize={13} color="$secondary">
                    1,248 transactions across 12 months
                  </Text>
                </YStack>
              </XStack>

              <Card>
                <Text fontSize={13} color="$secondary" fontWeight="700">
                  What we found
                </Text>
                <YStack gap={12} marginTop={12}>
                  {[
                    ["Recurring expenses", "₹9,400 / month across 6 subscriptions"],
                    ["Discretionary burn", "38% of monthly spend"],
                    ["Top growth category", "Food & Dining, +18%"],
                  ].map(([k, v]) => (
                    <XStack key={k} justifyContent="space-between" alignItems="center">
                      <Text fontSize={13.5} color="$navy2" fontWeight="600">
                        {k}
                      </Text>
                      <Text fontSize={13.5} color="$navy" fontWeight="800">
                        {v}
                      </Text>
                    </XStack>
                  ))}
                </YStack>
              </Card>

              <XStack
                backgroundColor="$red"
                borderRadius={16}
                paddingVertical={14}
                alignItems="center"
                justifyContent="center"
                gap={8}
                pressStyle={{ scale: 0.98, opacity: 0.92 }}
                onPress={() => navigation?.navigate?.("Insights")}
              >
                <TrendingUp size={17} color="white" strokeWidth={2.4} />
                <Text color="white" fontSize={14.5} fontWeight="800">
                  View full insights
                </Text>
              </XStack>

              <Text
                fontSize={13}
                fontWeight="700"
                color="$secondary"
                textAlign="center"
                pressStyle={{ opacity: 0.6 }}
                onPress={() => setPhase("idle")}
              >
                Import another statement
              </Text>
            </YStack>
          </MotiView>
        )}
      </ScrollView>
    </FinSightShell>
  );
}
