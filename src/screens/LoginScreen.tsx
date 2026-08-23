import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { ScrollView, YStack, XStack, Text, View, Input } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ChevronLeft } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { Wordmark } from "../components/finsight";
import { headerGradient, gradientStart, gradientEnd } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

function Field({
  icon: Icon,
  placeholder,
  value,
  onChangeText,
  secure,
  rightSlot,
  keyboardType,
}: {
  icon: any;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  rightSlot?: React.ReactNode;
  keyboardType?: "email-address" | "default";
}) {
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
      />
      {rightSlot}
    </XStack>
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
      borderRadius={16}
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
        style={{ height: 54, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
      >
        {loading ? (
          <ActivityIndicator color="white" accessibilityLabel={`${label} in progress`} />
        ) : (
          <>
            <Text fontSize={16} fontWeight="800" color="white">
              {label}
            </Text>
            <ArrowRight size={18} color="white" strokeWidth={2.6} />
          </>
        )}
      </LinearGradient>
    </View>
  );
}

export function LoginScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
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
      <View height={insets.top + 132}>
        <LinearGradient
          colors={headerGradient as unknown as [string, string, string]}
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
            accessibilityLabel="Back"
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
                Welcome back
              </Text>
              <Text fontSize={14.5} color="$ink2">
                {__DEV__
                  ? "Sign in to your development account."
                  : "Continue securely with your Google account."}
              </Text>
            </YStack>

            {__DEV__ ? (
              <>
                <YStack gap={12}>
                  <Field
                    icon={Mail}
                    placeholder="Email address"
                    value={email}
                    onChangeText={updateEmail}
                    keyboardType="email-address"
                  />
                  <Field
                    icon={Lock}
                    placeholder="Password"
                    value={password}
                    onChangeText={updatePassword}
                    secure={!show}
                    rightSlot={
                      <View
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
              <Text
                marginTop={14}
                color="$red"
                fontSize={13.5}
                lineHeight={19}
                textAlign="center"
                accessibilityRole="alert"
              >
                {error.message}
              </Text>
            ) : null}

            {__DEV__ ? (
              <XStack justifyContent="center" gap={5} marginTop={26}>
                <Text fontSize={14} color="$ink2">
                  Don't have an account?
                </Text>
                <Text
                  fontSize={14}
                  fontWeight="800"
                  color="$red"
                  pressStyle={{ opacity: 0.6 }}
                  onPress={() => {
                    clearError();
                    Haptics.selectionAsync();
                    navigation?.navigate?.("Register");
                  }}
                  accessibilityRole="link"
                >
                  Sign up
                </Text>
              </XStack>
            ) : null}
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
