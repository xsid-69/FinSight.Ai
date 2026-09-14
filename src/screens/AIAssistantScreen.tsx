import React, { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, YStack, XStack, Text, View, Input } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, ArrowRight, ArrowUp } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { FinSightShell, Card } from "../components/finsight";
import { AI_PROMPTS, AI_SAMPLE_RESPONSE, type AIResponse } from "../data/intelligence";
import { useReducedMotion } from "../hooks/useReducedMotion";

const PAGE_H = 20;

function ThinkingState({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Card borderColor="rgba(124,108,242,0.18)" accessibilityRole="progressbar" accessibilityLabel="FinSight AI is preparing a response">
      <XStack alignItems="center" gap={10}>
        <View width={28} height={28} borderRadius={9} backgroundColor="$aiSoft" alignItems="center" justifyContent="center">
          <Sparkles size={15} color="$ai" strokeWidth={2.2} />
        </View>
        <YStack gap={4}>
          <Text fontSize={13.5} fontWeight="800" color="$navy">Reviewing your financial picture</Text>
          <XStack gap={5}>
            {[0, 1, 2].map((index) => (
              <MotiView
                key={index}
                from={{ opacity: 0.35, translateY: 0 }}
                animate={{ opacity: reducedMotion ? 0.7 : 1, translateY: reducedMotion ? 0 : -2 }}
                transition={{ type: "timing", duration: reducedMotion ? 1 : 420, delay: index * 110, loop: !reducedMotion, repeatReverse: true }}
                style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#7C6CF2" }}
              />
            ))}
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}

function ResponseCard({ response, reducedMotion, onAction }: { response: AIResponse; reducedMotion: boolean; onAction: () => void }) {
  return (
    <MotiView from={{ opacity: reducedMotion ? 1 : 0.65, translateY: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: reducedMotion ? 1 : 220 }}>
      <Card borderColor="rgba(124,108,242,0.18)">
        <XStack alignItems="center" gap={8} marginBottom={12}>
          <View width={22} height={22} borderRadius={7} backgroundColor="$aiSoft" alignItems="center" justifyContent="center">
            <Sparkles size={13} color="$ai" strokeWidth={2.2} />
          </View>
          <Text fontSize={13} fontWeight="800" color="$ai" letterSpacing={0.2}>{response.headline}</Text>
        </XStack>
        <Text fontSize={15} lineHeight={22} color="$navy" fontWeight="600">{response.body}</Text>
        <YStack gap={10} marginTop={16}>
          {response.metrics.map((metric) => (
            <XStack key={metric.label} justifyContent="space-between" alignItems="center">
              <Text fontSize={13} color="$secondary" fontWeight="600">{metric.label}</Text>
              <Text fontSize={13.5} color="$navy" fontWeight="800">{metric.value}</Text>
            </XStack>
          ))}
        </YStack>
        <XStack
          minHeight={44}
          alignItems="center"
          gap={6}
          marginTop={10}
          pressStyle={{ opacity: 0.62 }}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={response.action}
        >
          <Text fontSize={13.5} fontWeight="800" color="$red">{response.action}</Text>
          <ArrowRight size={15} color="$red" strokeWidth={2.4} />
        </XStack>
      </Card>
    </MotiView>
  );
}

export function AIAssistantScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [input, setInput] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const ask = (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    if (!prompt || thinking) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setInput("");
    setAsked(prompt);
    setThinking(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setThinking(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, reducedMotion ? 180 : 720);
  };

  const reset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setThinking(false);
    setAsked(null);
    setInput("");
  };
  const canSend = input.trim().length > 0 && !thinking;

  return (
    <FinSightShell title="Ask FInsightAI" onBack={() => navigation?.goBack?.()}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <YStack flex={1}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingTop: 18, paddingHorizontal: PAGE_H, paddingBottom: 28 }}
          >
            {asked ? (
              <YStack gap={16}>
                <XStack justifyContent="flex-end">
                  <View backgroundColor="$navy" borderRadius={18} borderBottomRightRadius={6} paddingHorizontal={14} paddingVertical={10} maxWidth="85%">
                    <Text color="white" fontSize={14} fontWeight="600">{asked}</Text>
                  </View>
                </XStack>
                {thinking ? (
                  <ThinkingState reducedMotion={reducedMotion} />
                ) : (
                  <ResponseCard response={AI_SAMPLE_RESPONSE} reducedMotion={reducedMotion} onAction={() => navigation?.navigate?.("Analyzer")} />
                )}
                {!thinking ? (
                  <Text fontSize={13} fontWeight="700" color="$secondary" pressStyle={{ opacity: 0.6 }} onPress={reset} accessibilityRole="button">
                    Ask something else
                  </Text>
                ) : null}
              </YStack>
            ) : (
              <YStack gap={18}>
                <XStack alignItems="center" gap={10}>
                  <View width={38} height={38} borderRadius={12} backgroundColor="$aiSoft" alignItems="center" justifyContent="center">
                    <Sparkles size={20} color="$ai" strokeWidth={2.2} />
                  </View>
                  <YStack flex={1}>
                    <Text fontSize={16} fontWeight="800" color="$navy">Your financial intelligence</Text>
                    <Text fontSize={13} color="$secondary">Ask about spending, goals, forecasts or peers.</Text>
                  </YStack>
                </XStack>
                <YStack gap={10}>
                  {AI_PROMPTS.map((prompt, index) => (
                    <MotiView key={prompt} from={{ opacity: reducedMotion ? 1 : 0.7, translateY: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: reducedMotion ? 1 : 200, delay: reducedMotion ? 0 : index * 45 }}>
                      <XStack
                        minHeight={52}
                        alignItems="center"
                        gap={12}
                        backgroundColor="$backgroundStrong"
                        borderWidth={1}
                        borderColor="$borderColor"
                        borderRadius={16}
                        padding={15}
                        pressStyle={{ scale: 0.99, opacity: 0.9 }}
                        onPress={() => ask(prompt)}
                        accessibilityRole="button"
                        accessibilityLabel={prompt}
                      >
                        <Text flex={1} fontSize={14} fontWeight="600" color="$navy2">{prompt}</Text>
                        <ArrowRight size={16} color="$secondary" strokeWidth={2.2} />
                      </XStack>
                    </MotiView>
                  ))}
                </YStack>
              </YStack>
            )}
          </ScrollView>

          <XStack paddingHorizontal={PAGE_H} paddingTop={10} paddingBottom={insets.bottom + 10} gap={10} alignItems="center" backgroundColor="$background" borderTopWidth={1} borderTopColor="$borderColor">
            <XStack flex={1} minHeight={48} borderRadius={24} backgroundColor="$backgroundStrong" borderWidth={1} borderColor="$borderColor" alignItems="center" paddingHorizontal={16}>
              <Input
                flex={1}
                unstyled
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => ask(input)}
                disabled={thinking}
                returnKeyType="send"
                placeholder="Ask anything about your money"
                placeholderTextColor="$secondary"
                fontSize={14}
                color="$navy"
                padding={0}
                accessibilityLabel="Message FinSight AI"
              />
            </XStack>
            <View
              width={48}
              height={48}
              borderRadius={24}
              backgroundColor={canSend ? "$red" : "$borderStrong"}
              alignItems="center"
              justifyContent="center"
              pressStyle={canSend ? { scale: 0.94 } : undefined}
              onPress={canSend ? () => ask(input) : undefined}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !canSend, busy: thinking }}
            >
              <ArrowUp size={20} color={canSend ? "white" : "$secondary"} strokeWidth={2.4} />
            </View>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </FinSightShell>
  );
}
