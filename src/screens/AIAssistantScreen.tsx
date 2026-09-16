import React, { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, YStack, XStack, Text, View, Input } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles, ArrowRight, ArrowUp, RotateCcw } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { FinSightShell, Card } from "../components/finsight";
import { AI_PROMPTS, AI_SAMPLE_RESPONSE, type AIResponse } from "../data/intelligence";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { brandColors } from "../theme/mastercard";

const PAGE_H = 20;
const DEMO_NOTE = "Built-in sample · no external AI request";
const DOT_COLORS = [brandColors.redIdentity, brandColors.orange, brandColors.gold] as const;

function DemoNotice() {
  return (
    <Card variant="soft" padding={14} borderColor="$orangeSoft">
      <XStack alignItems="flex-start" gap={10}>
        <View width={30} height={30} borderRadius={10} backgroundColor="$orangeSoft" alignItems="center" justifyContent="center">
          <Sparkles size={15} color="$orangeDeep" strokeWidth={2.2} />
        </View>
        <YStack flex={1} gap={2}>
          <Text fontSize={11} lineHeight={16} fontWeight="800" color="$orangeDeep" letterSpacing={0.8}>GUIDED DEMO</Text>
          <Text fontSize={12.5} lineHeight={18} color="$secondary">
            Responses use the built-in laptop-planning sample. Your question is not sent to a live AI service.
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
}

function ThinkingState({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <Card
      variant="soft"
      borderColor="$orangeSoft"
      accessibilityRole="progressbar"
      accessibilityLabel="FinSight AI is preparing a response"
      accessibilityValue={{ text: "Preparing the built-in sample response" }}
    >
      <XStack alignItems="center" gap={12}>
        <View width={38} height={38} borderRadius={13} backgroundColor="$orangeSoft" alignItems="center" justifyContent="center">
          <Sparkles size={18} color="$orangeDeep" strokeWidth={2.2} />
        </View>
        <YStack flex={1} gap={5}>
          <Text fontSize={14} lineHeight={20} fontWeight="800" color="$navy">Preparing the sample response</Text>
          <XStack alignItems="center" gap={7}>
            <XStack gap={5} accessible={false} importantForAccessibility="no-hide-descendants">
              {[0, 1, 2].map((index) => (
                <MotiView
                  key={index}
                  from={{ opacity: 0.35, translateY: 0 }}
                  animate={{ opacity: reducedMotion ? 0.72 : 1, translateY: reducedMotion ? 0 : -2 }}
                  transition={{ type: "timing", duration: reducedMotion ? 1 : 420, delay: index * 110, loop: !reducedMotion, repeatReverse: true }}
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: DOT_COLORS[index] }}
                />
              ))}
            </XStack>
            <Text fontSize={11.5} color="$secondary">{DEMO_NOTE}</Text>
          </XStack>
        </YStack>
      </XStack>
    </Card>
  );
}

function ResponseCard({ response, reducedMotion, onAction }: { response: AIResponse; reducedMotion: boolean; onAction: () => void }) {
  return (
    <MotiView
      from={{ opacity: reducedMotion ? 1 : 0.65, translateY: reducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: reducedMotion ? 1 : 220 }}
    >
      <Card borderColor="$borderStrong">
        <XStack alignItems="center" gap={10} marginBottom={14}>
          <View width={34} height={34} borderRadius={11} backgroundColor="$redSoft" alignItems="center" justifyContent="center">
            <Sparkles size={16} color="$red" strokeWidth={2.2} />
          </View>
          <YStack flex={1} gap={1}>
            <Text fontSize={10.5} lineHeight={15} fontWeight="800" color="$red" letterSpacing={0.9}>SAMPLE OUTPUT</Text>
            <Text fontSize={15} lineHeight={20} fontWeight="800" color="$navy" accessibilityRole="header">{response.headline}</Text>
          </YStack>
        </XStack>

        <Text fontSize={15} lineHeight={23} color="$navy" fontWeight="600">{response.body}</Text>

        <YStack marginTop={16} borderTopWidth={1} borderTopColor="$borderColor">
          {response.metrics.map((metric) => (
            <XStack key={metric.label} minHeight={44} justifyContent="space-between" alignItems="center" gap={16} borderBottomWidth={1} borderBottomColor="$borderColor">
              <Text flex={1} fontSize={12.5} color="$secondary" fontWeight="600">{metric.label}</Text>
              <Text fontSize={13.5} color="$navy" fontWeight="800">{metric.value}</Text>
            </XStack>
          ))}
        </YStack>

        <Text fontSize={11.5} lineHeight={17} color="$secondary" marginTop={12}>
          Illustrative only. This fixed result uses the laptop-planning fixture shown in the app.
        </Text>

        <XStack
          minHeight={48}
          alignItems="center"
          justifyContent="space-between"
          gap={10}
          marginTop={12}
          paddingHorizontal={14}
          borderRadius={14}
          backgroundColor="$redSoft"
          pressStyle={{ scale: 0.98, opacity: 0.84 }}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={response.action}
        >
          <Text fontSize={13.5} fontWeight="800" color="$red">{response.action}</Text>
          <ArrowRight size={16} color="$red" strokeWidth={2.4} />
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
    <FinSightShell title="FinSight assistant" onBack={() => navigation?.goBack?.()}>
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
                <DemoNotice />
                <XStack justifyContent="flex-end">
                  <Card
                    variant="charcoal"
                    paddingHorizontal={15}
                    paddingVertical={11}
                    borderRadius={18}
                    borderBottomRightRadius={6}
                    maxWidth="86%"
                    shadowOpacity={0}
                  >
                    <Text color="white" fontSize={14} lineHeight={20} fontWeight="600">{asked}</Text>
                  </Card>
                </XStack>
                {thinking ? (
                  <ThinkingState reducedMotion={reducedMotion} />
                ) : (
                  <ResponseCard response={AI_SAMPLE_RESPONSE} reducedMotion={reducedMotion} onAction={() => navigation?.navigate?.("Analyzer")} />
                )}
                {!thinking ? (
                  <XStack
                    minHeight={48}
                    alignItems="center"
                    justifyContent="center"
                    gap={7}
                    borderRadius={14}
                    pressStyle={{ opacity: 0.62 }}
                    onPress={reset}
                    accessibilityRole="button"
                    accessibilityLabel="Ask something else"
                  >
                    <RotateCcw size={15} color="$secondary" strokeWidth={2.2} />
                    <Text fontSize={13} fontWeight="800" color="$secondary">Ask something else</Text>
                  </XStack>
                ) : null}
              </YStack>
            ) : (
              <YStack gap={18}>
                <Card variant="charcoal" overflow="hidden">
                  <View position="absolute" top={-38} right={-28} width={118} height={118} borderRadius={59} backgroundColor="$red" opacity={0.2} />
                  <XStack alignItems="flex-start" gap={12}>
                    <View width={42} height={42} borderRadius={14} backgroundColor="$red" alignItems="center" justifyContent="center">
                      <Sparkles size={20} color={brandColors.gold} strokeWidth={2.2} />
                    </View>
                    <YStack flex={1} gap={4}>
                      <Text fontSize={11} lineHeight={16} fontWeight="800" color={brandColors.gold} letterSpacing={0.9}>GUIDED FINANCIAL DEMO</Text>
                      <Text fontSize={18} lineHeight={24} fontWeight="800" color="white" accessibilityRole="header">Explore a sample money question</Text>
                      <Text fontSize={12.5} lineHeight={18} color="rgba(255,255,255,0.7)">{DEMO_NOTE}</Text>
                    </YStack>
                  </XStack>
                </Card>

                <DemoNotice />

                <YStack gap={8}>
                  <Text fontSize={14} lineHeight={20} fontWeight="800" color="$navy" accessibilityRole="header">Try a sample question</Text>
                  <Text fontSize={12.5} lineHeight={18} color="$secondary">Every choice demonstrates the same local laptop-planning response.</Text>
                </YStack>

                <YStack gap={10}>
                  {AI_PROMPTS.map((prompt, index) => (
                    <MotiView
                      key={prompt}
                      from={{ opacity: reducedMotion ? 1 : 0.7, translateY: reducedMotion ? 0 : 8 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: "timing", duration: reducedMotion ? 1 : 200, delay: reducedMotion ? 0 : index * 45 }}
                    >
                      <Card
                        variant="flat"
                        minHeight={56}
                        padding={14}
                        flexDirection="row"
                        alignItems="center"
                        gap={12}
                        pressStyle={{ scale: 0.99, opacity: 0.88 }}
                        onPress={() => ask(prompt)}
                        accessibilityRole="button"
                        accessibilityLabel={prompt}
                        accessibilityHint="Shows the built-in sample planning response"
                      >
                        <View width={28} height={28} borderRadius={9} backgroundColor={index === 0 ? "$redSoft" : "$orangeSoft"} alignItems="center" justifyContent="center">
                          <Text fontSize={11} fontWeight="800" color={index === 0 ? "$red" : "$orangeDeep"}>{index + 1}</Text>
                        </View>
                        <Text flex={1} fontSize={14} lineHeight={20} fontWeight="600" color="$navy2">{prompt}</Text>
                        <ArrowRight size={16} color="$secondary" strokeWidth={2.2} />
                      </Card>
                    </MotiView>
                  ))}
                </YStack>
              </YStack>
            )}
          </ScrollView>

          <YStack
            paddingHorizontal={PAGE_H}
            paddingTop={10}
            paddingBottom={insets.bottom + 10}
            gap={7}
            backgroundColor="$backgroundStrong"
            borderTopWidth={1}
            borderTopColor="$borderColor"
          >
            <Text fontSize={11.5} lineHeight={16} color="$secondary" fontWeight="700">Your question · guided demo</Text>
            <XStack gap={10} alignItems="center">
              <XStack flex={1} minHeight={48} borderRadius={16} backgroundColor="$surfaceAlt" borderWidth={1} borderColor="$borderColor" alignItems="center" paddingHorizontal={15}>
                <Input
                  flex={1}
                  unstyled
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={() => ask(input)}
                  disabled={thinking}
                  returnKeyType="send"
                  placeholder="Ask about the sample"
                  placeholderTextColor="$secondary"
                  fontSize={14}
                  color="$navy"
                  padding={0}
                  accessibilityLabel="Message FinSight AI"
                  accessibilityHint="Responses use a built-in demonstration and are not sent to an external service"
                />
              </XStack>
              <View
                width={48}
                height={48}
                borderRadius={16}
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
        </YStack>
      </KeyboardAvoidingView>
    </FinSightShell>
  );
}
