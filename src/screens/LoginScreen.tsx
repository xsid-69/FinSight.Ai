import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, YStack, XStack, Text, View, Input } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronLeft } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { Card, Wordmark } from "../components/finsight";
import { headerGradient, gradientStart, gradientEnd } from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { brandColors, brandOverlays } from "../theme/mastercard";

const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

function Field({
  icon: Icon,
  label,
  placeholder,
  value,
  onChangeText,
  secure,
  rightSlot,
  keyboardType,
}: {
  icon: any;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  rightSlot?: React.ReactNode;
  keyboardType?: "email-address" | "default";
}) {
  return (
    <YStack gap={7}>
      <Text fontSize={12} lineHeight={17} color="$navy" fontWeight="700">{label}</Text>
      <XStack
        alignItems="center"
        gap={11}
        minHeight={54}
        paddingLeft={15}
        paddingRight={rightSlot ? 4 : 15}
        borderRadius={15}
        backgroundColor="$surfaceAlt"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Icon size={18} color="$secondary" strokeWidth={2} />
        <Input
          flex={1}
          unstyled
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="$secondary"
          secureTextEntry={secure}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          fontSize={15}
          color="$navy"
          padding={0}
          accessibilityLabel={label}
        />
        {rightSlot}
      </XStack>
    </YStack>
  );
}

function PrimaryAction({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <View
      minHeight={54}
      borderRadius={15}
      overflow="hidden"
      marginTop={20}
      opacity={loading ? 0.72 : 1}
      pressStyle={loading ? undefined : { scale: 0.98, opacity: 0.95 }}
      onPress={loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${label} in progress` : label}
      accessibilityState={{ disabled: loading, busy: loading }}
    >
      <LinearGradient
        colors={headerGradient as unknown as [string, string, string]}
        start={gradientStart}
        end={gradientEnd}
        style={{ minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
      >
        {loading ? (
          <ActivityIndicator color="white" accessibilityLabel={`${label} in progress`} />
        ) : (
          <>
            <Text fontSize={16} fontWeight="800" color="white">{label}</Text>
            <ArrowRight size={18} color="white" strokeWidth={2.6} />
          </>
        )}
      </LinearGradient>
    </View>
  );
}

export function LoginScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { login, loginGoogle, operationLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  const updateEmail = (value: string) => {
    clearError();
    setEmail(value);
  };

  const updatePassword = (value: string) => {
    clearError();
    setPassword(value);
  };

  const signIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await login(email, password);
      setPassword("");
    } catch {
      // AuthContext exposes the normalized error below.
    }
  };

  const signInGoogle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await loginGoogle();
    } catch {
      // AuthContext exposes non-cancellation errors below.
    }
  };

  return (
    <View flex={1} backgroundColor="$background">
      <View height={insets.top + 206} overflow="hidden">
        <LinearGradient colors={headerGradient as unknown as [string, string, string]} start={gradientStart} end={gradientEnd} style={FILL} />
        <View
          position="absolute"
          top={-58}
          right={-38}
          width={208}
          height={208}
          borderRadius={104}
          backgroundColor={brandOverlays.onBrand12}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />
        <View
          position="absolute"
          bottom={-66}
          left={62}
          width={166}
          height={166}
          borderRadius={83}
          backgroundColor={brandColors.orange}
          opacity={0.2}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />
        <YStack paddingTop={insets.top + 10} paddingHorizontal={20} gap={20}>
          <XStack alignItems="center" justifyContent="space-between">
            <View
              width={48}
              height={48}
              borderRadius={16}
              backgroundColor={brandOverlays.onBrand18}
              borderWidth={1}
              borderColor={brandOverlays.onBrand24}
              alignItems="center"
              justifyContent="center"
              pressStyle={{ scale: 0.92 }}
              onPress={() => navigation?.goBack?.()}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <ChevronLeft size={22} color="white" />
            </View>
            <Wordmark size={20} />
          </XStack>
          <YStack gap={4}>
            <Text fontSize={10.5} lineHeight={15} fontWeight="800" color="rgba(255,255,255,0.72)" letterSpacing={1.15}>SECURE ACCOUNT ACCESS</Text>
            <Text maxWidth={300} fontSize={23} lineHeight={29} fontWeight="800" color="white" accessibilityRole="header">Your financial workspace, ready when you are.</Text>
          </YStack>
        </YStack>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <MotiView
            from={{ opacity: reducedMotion ? 1 : 0, translateY: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: reducedMotion ? 1 : 360 }}
            style={{ marginTop: -24 }}
          >
            <Card padding={20} borderColor="$borderStrong" shadowOpacity={0.1} shadowRadius={24}>
              <YStack gap={5} marginBottom={22}>
                <Text fontSize={25} lineHeight={31} fontWeight="800" color="$navy" letterSpacing={-0.6} accessibilityRole="header">Welcome back</Text>
                <Text fontSize={14} lineHeight={20} color="$ink2">
                  {__DEV__ ? "Sign in to your development account." : "Continue securely with your Google account."}
                </Text>
              </YStack>

              {__DEV__ ? (
                <>
                  <YStack gap={15}>
                    <Field
                      icon={Mail}
                      label="Email address"
                      placeholder="Email address"
                      value={email}
                      onChangeText={updateEmail}
                      keyboardType="email-address"
                    />
                    <Field
                      icon={Lock}
                      label="Password"
                      placeholder="Password"
                      value={password}
                      onChangeText={updatePassword}
                      secure={!show}
                      rightSlot={
                        <View
                          width={48}
                          height={48}
                          alignItems="center"
                          justifyContent="center"
                          pressStyle={{ opacity: 0.6 }}
                          onPress={() => setShow((current) => !current)}
                          accessibilityRole="button"
                          accessibilityLabel={show ? "Hide password" : "Show password"}
                        >
                          {show ? <EyeOff size={19} color="$secondary" /> : <Eye size={19} color="$secondary" />}
                        </View>
                      }
                    />
                  </YStack>
                  <PrimaryAction label="Sign in" loading={operationLoading} onPress={signIn} />
                </>
              ) : (
                <PrimaryAction label="Continue with Google" loading={operationLoading} onPress={signInGoogle} />
              )}

              {error ? (
                <View marginTop={14} borderRadius={12} backgroundColor="$dangerSoft" padding={12}>
                  <Text color="$danger" fontSize={13.5} lineHeight={19} textAlign="center" accessibilityRole="alert">{error.message}</Text>
                </View>
              ) : null}

              {__DEV__ ? (
                <XStack minHeight={48} justifyContent="center" alignItems="center" gap={5} marginTop={14}>
                  <Text fontSize={14} color="$ink2">Don't have an account?</Text>
                  <XStack
                    minWidth={48}
                    minHeight={48}
                    alignItems="center"
                    justifyContent="center"
                    pressStyle={{ opacity: 0.6 }}
                    onPress={() => {
                      clearError();
                      Haptics.selectionAsync();
                      navigation?.navigate?.("Register");
                    }}
                    accessibilityRole="link"
                    accessibilityLabel="Sign up"
                  >
                    <Text fontSize={14} fontWeight="800" color="$red">Sign up</Text>
                  </XStack>
                </XStack>
              ) : null}
            </Card>

            <Text textAlign="center" fontSize={11.5} lineHeight={17} color="$secondary" marginTop={16} paddingHorizontal={20}>
              FinSight uses your authenticated account to restore your private session. No payment-card partnership is implied.
            </Text>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
