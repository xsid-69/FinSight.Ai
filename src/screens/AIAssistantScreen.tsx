import React, { useState } from "react";
import { ScrollView, YStack, XStack, Text, View, Input } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, ArrowRight, ArrowUp } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { FinSightShell, Card } from "../components/finsight";
import { AI_PROMPTS, AI_SAMPLE_RESPONSE, type AIResponse } from "../data/intelligence";

const PAGE_H = 20;

function ResponseCard({ response }: { response: AIResponse }) {
  return (
    <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 320 }}>
      <Card borderColor="rgba(124,108,242,0.18)">
        <XStack alignItems="center" gap={8} marginBottom={12}>
          <View width={22} height={22} borderRadius={7} backgroundColor="$aiSoft" alignItems="center" justifyContent="center">
            <Sparkles size={13} color="$ai" strokeWidth={2.2} />
          </View>
          <Text fontSize={13} fontWeight="800" color="$ai" letterSpacing={0.2}>
            {response.headline}
          </Text>
        </XStack>

        <Text fontSize={15} lineHeight={22} color="$navy" fontWeight="600">
          {response.body}
        </Text>

        <YStack gap={10} marginTop={16}>
          {response.metrics.map((m) => (
            <XStack key={m.label} justifyContent="space-between" alignItems="center">
              <Text fontSize={13} color="$secondary" fontWeight="600">
                {m.label}
              </Text>
              <Text fontSize={13.5} color="$navy" fontWeight="800">
                {m.value}
              </Text>
            </XStack>
          ))}
        </YStack>

        <XStack alignItems="center" gap={6} marginTop={16} pressStyle={{ opacity: 0.6 }}>
          <Text fontSize={13.5} fontWeight="800" color="$red">
            {response.action}
          </Text>
          <ArrowRight size={15} color="$red" strokeWidth={2.4} />
        </XStack>
      </Card>
    </MotiView>
  );
}

export function AIAssistantScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const [asked, setAsked] = useState<string | null>(null);

  const ask = (prompt: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAsked(prompt);
  };

  return (
    <FinSightShell title="Ask FInsightAI" onBack={() => navigation?.goBack?.()}>
      <YStack flex={1}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 18, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + 90 }}>
          {asked ? (
            <YStack gap={16}>
              <XStack justifyContent="flex-end">
                <View backgroundColor="$navy" borderRadius={18} borderBottomRightRadius={6} paddingHorizontal={14} paddingVertical={10} maxWidth="85%">
                  <Text color="white" fontSize={14} fontWeight="600">
                    {asked}
                  </Text>
                </View>
              </XStack>
              <ResponseCard response={AI_SAMPLE_RESPONSE} />
              <Text
                fontSize={13}
                fontWeight="700"
                color="$secondary"
                pressStyle={{ opacity: 0.6 }}
                onPress={() => setAsked(null)}
              >
                Ask something else
              </Text>
            </YStack>
          ) : (
            <YStack gap={18}>
              <XStack alignItems="center" gap={10}>
                <View width={38} height={38} borderRadius={12} backgroundColor="$aiSoft" alignItems="center" justifyContent="center">
                  <Sparkles size={20} color="$ai" strokeWidth={2.2} />
                </View>
                <YStack flex={1}>
                  <Text fontSize={16} fontWeight="800" color="$navy">
                    Your financial intelligence
                  </Text>
                  <Text fontSize={13} color="$secondary">
                    Ask about spending, goals, forecasts or peers.
                  </Text>
                </YStack>
              </XStack>

              <YStack gap={10}>
                {AI_PROMPTS.map((p, i) => (
                  <MotiView
                    key={p}
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 260, delay: i * 60 }}
                  >
                    <XStack
                      alignItems="center"
                      gap={12}
                      backgroundColor="$backgroundStrong"
                      borderWidth={1}
                      borderColor="$borderColor"
                      borderRadius={16}
                      padding={15}
                      pressStyle={{ scale: 0.99, opacity: 0.9 }}
                      onPress={() => ask(p)}
                    >
                      <Text flex={1} fontSize={14} fontWeight="600" color="$navy2">
                        {p}
                      </Text>
                      <ArrowRight size={16} color="$secondary" strokeWidth={2.2} />
                    </XStack>
                  </MotiView>
                ))}
              </YStack>
            </YStack>
          )}
        </ScrollView>

        {/* composer */}
        <XStack
          paddingHorizontal={PAGE_H}
          paddingTop={10}
          paddingBottom={insets.bottom + 10}
          gap={10}
          alignItems="center"
          backgroundColor="$background"
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          <XStack flex={1} height={46} borderRadius={23} backgroundColor="$backgroundStrong" borderWidth={1} borderColor="$borderColor" alignItems="center" paddingHorizontal={16}>
            <Input flex={1} unstyled placeholder="Ask anything about your money" placeholderTextColor="$secondary" fontSize={14} color="$navy" padding={0} />
          </XStack>
          <View width={46} height={46} borderRadius={23} backgroundColor="$red" alignItems="center" justifyContent="center" pressStyle={{ scale: 0.94 }} onPress={() => ask(AI_PROMPTS[0])}>
            <ArrowUp size={20} color="white" strokeWidth={2.4} />
          </View>
        </XStack>
      </YStack>
    </FinSightShell>
  );
}
