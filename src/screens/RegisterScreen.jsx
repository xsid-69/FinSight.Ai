import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Input, ScrollView, Text, View, XStack, YStack } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, ChevronLeft, Eye, EyeOff, Lock, Mail, User } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { Card, Wordmark } from "../components/finsight";
import { gradientEnd, gradientStart, headerGradient } from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { brandColors, brandOverlays } from "../theme/mastercard";

const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

function Field({ icon: Icon, label, rightSlot, ...inputProps }) {
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
          autoCorrect={false}
          fontSize={15}
          color="$navy"
          placeholderTextColor="$secondary"
          padding={0}
          accessibilityLabel={label}
          {...inputProps}
        />
        {rightSlot}
      </XStack>
    </YStack>
  );
}

export function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { register, operationLoading, error, clearError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);

  const update = (setter) => (value) => {
    clearError();
    setLocalError(null);
    setter(value);
  };

  const submit = async () => {
    if (password !== confirmation) {
      setLocalError("Passwords do not match.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await register(email, password, fullName);
      setPassword("");
      setConfirmation("");
    } catch {
      // AuthContext exposes the normalized error below.
    }
  };

  const visibleError = localError || error?.message;

  return (
    <View flex={1} backgroundColor="$background">
      <View height={insets.top + 206} overflow="hidden">
        <LinearGradient colors={headerGradient} start={gradientStart} end={gradientEnd} style={FILL} />
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
              accessibilityLabel="Back to sign in"
            >
              <ChevronLeft size={22} color="white" />
            </View>
            <Wordmark size={20} />
          </XStack>
          <YStack gap={4}>
            <Text fontSize={10.5} lineHeight={15} fontWeight="800" color="rgba(255,255,255,0.72)" letterSpacing={1.15}>DEVELOPMENT ACCESS</Text>
            <Text maxWidth={300} fontSize={23} lineHeight={29} fontWeight="800" color="white" accessibilityRole="header">Create a protected development account.</Text>
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
                <Text fontSize={25} lineHeight={31} fontWeight="800" color="$navy" letterSpacing={-0.6} accessibilityRole="header">Create dev account</Text>
                <Text fontSize={14} lineHeight={20} color="$ink2">Email registration is available in development builds only.</Text>
              </YStack>

              <YStack gap={15}>
                <Field
                  icon={User}
                  label="Full name"
                  placeholder="Full name"
                  value={fullName}
                  onChangeText={update(setFullName)}
                  autoCapitalize="words"
                />
                <Field
                  icon={Mail}
                  label="Email address"
                  placeholder="Email address"
                  value={email}
                  onChangeText={update(setEmail)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Field
                  icon={Lock}
                  label="Password"
                  placeholder="Password"
                  value={password}
                  onChangeText={update(setPassword)}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                  rightSlot={
                    <View
                      width={48}
                      height={48}
                      alignItems="center"
                      justifyContent="center"
                      onPress={() => setShowPassword((current) => !current)}
                      pressStyle={{ opacity: 0.6 }}
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? "Hide passwords" : "Show passwords"}
                    >
                      {showPassword ? <EyeOff size={19} color="$secondary" /> : <Eye size={19} color="$secondary" />}
                    </View>
                  }
                />
                <Field
                  icon={Lock}
                  label="Confirm password"
                  placeholder="Confirm password"
                  value={confirmation}
                  onChangeText={update(setConfirmation)}
                  autoCapitalize="none"
                  secureTextEntry={!showPassword}
                />
              </YStack>

              {visibleError ? (
                <View marginTop={14} borderRadius={12} backgroundColor="$dangerSoft" padding={12}>
                  <Text color="$danger" fontSize={13.5} lineHeight={19} textAlign="center" accessibilityRole="alert">{visibleError}</Text>
                </View>
              ) : null}

              <View
                minHeight={54}
                borderRadius={15}
                overflow="hidden"
                marginTop={20}
                opacity={operationLoading ? 0.72 : 1}
                pressStyle={operationLoading ? undefined : { scale: 0.98, opacity: 0.95 }}
                onPress={operationLoading ? undefined : submit}
                accessibilityRole="button"
                accessibilityLabel={operationLoading ? "Creating account" : "Create account"}
                accessibilityState={{ disabled: operationLoading, busy: operationLoading }}
              >
                <LinearGradient
                  colors={headerGradient}
                  start={gradientStart}
                  end={gradientEnd}
                  style={{ minHeight: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
                >
                  {operationLoading ? (
                    <ActivityIndicator color="white" accessibilityLabel="Creating account" />
                  ) : (
                    <>
                      <Text fontSize={16} fontWeight="800" color="white">Create account</Text>
                      <ArrowRight size={18} color="white" strokeWidth={2.6} />
                    </>
                  )}
                </LinearGradient>
              </View>
            </Card>

            <Text textAlign="center" fontSize={11.5} lineHeight={17} color="$secondary" marginTop={16} paddingHorizontal={20}>
              Production builds keep Google-only authentication; this form remains a development tool.
            </Text>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
