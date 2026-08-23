import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Input, ScrollView, Text, View, XStack, YStack } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowRight, ChevronLeft, Eye, EyeOff, Lock, Mail, User } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { Wordmark } from "../components/finsight";
import { gradientEnd, gradientStart, headerGradient } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

function Field({ icon: Icon, rightSlot, ...inputProps }) {
  return (
    <XStack
      alignItems="center"
      gap={12}
      height={54}
      paddingHorizontal={16}
      borderRadius={16}
      backgroundColor="$backgroundStrong"
      borderWidth={1}
      borderColor="$borderColor"
    >
      <Icon size={19} color="$secondary" strokeWidth={2} />
      <Input
        flex={1}
        unstyled
        autoCorrect={false}
        fontSize={15}
        color="$navy"
        placeholderTextColor="$secondary"
        padding={0}
        {...inputProps}
      />
      {rightSlot}
    </XStack>
  );
}

export function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
      <View height={insets.top + 132}>
        <LinearGradient
          colors={headerGradient}
          start={gradientStart}
          end={gradientEnd}
          style={FILL}
        />
        <View position="absolute" top={-40} right={-30} width={200} height={170} borderRadius={100} backgroundColor="rgba(255,255,255,0.10)" />
        <YStack paddingTop={insets.top + 12} paddingHorizontal={20} gap={20}>
          <View
            width={40}
            height={40}
            borderRadius={20}
            backgroundColor="rgba(255,255,255,0.16)"
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
        </YStack>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 360 }}
          >
            <YStack gap={6} marginBottom={22}>
              <Text fontSize={26} fontWeight="800" color="$navy" letterSpacing={-0.6}>
                Create dev account
              </Text>
              <Text fontSize={14.5} color="$ink2">
                Email registration is available in development builds only.
              </Text>
            </YStack>

            <YStack gap={12}>
              <Field
                icon={User}
                placeholder="Full name"
                value={fullName}
                onChangeText={update(setFullName)}
                autoCapitalize="words"
              />
              <Field
                icon={Mail}
                placeholder="Email address"
                value={email}
                onChangeText={update(setEmail)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Field
                icon={Lock}
                placeholder="Password"
                value={password}
                onChangeText={update(setPassword)}
                autoCapitalize="none"
                secureTextEntry={!showPassword}
                rightSlot={
                  <View
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
                placeholder="Confirm password"
                value={confirmation}
                onChangeText={update(setConfirmation)}
                autoCapitalize="none"
                secureTextEntry={!showPassword}
              />
            </YStack>

            {visibleError ? (
              <Text
                marginTop={14}
                color="$red"
                fontSize={13.5}
                lineHeight={19}
                textAlign="center"
                accessibilityRole="alert"
              >
                {visibleError}
              </Text>
            ) : null}

            <View
              borderRadius={16}
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
                style={{ height: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
              >
                {operationLoading ? (
                  <ActivityIndicator color="white" accessibilityLabel="Creating account" />
                ) : (
                  <>
                    <Text fontSize={16} fontWeight="800" color="white">
                      Create account
                    </Text>
                    <ArrowRight size={18} color="white" strokeWidth={2.6} />
                  </>
                )}
              </LinearGradient>
            </View>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
