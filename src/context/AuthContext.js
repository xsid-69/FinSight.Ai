import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, StyleSheet, View as NativeView } from "react-native";
import { Text, View, XStack, YStack } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../config/firebase";
import { Card, Wordmark } from "../components/finsight";
import { brandColors, brandGradients, brandOverlays } from "../theme/mastercard";
import {
  getUserProfile,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  signUpWithEmail,
} from "../services/authService";

const AuthContext = createContext(/** @type {any} */ (null));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [error, setError] = useState(null);
  const operationActive = useRef(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setProfile(null);

      if (nextUser) {
        try {
          const nextProfile = await getUserProfile(nextUser.uid);
          if (active) setProfile(nextProfile);
        } catch (profileError) {
          if (active) setError(profileError);
        }
      }

      if (active) setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const runOperation = useCallback(async (operation) => {
    if (operationActive.current) return null;

    operationActive.current = true;
    setOperationLoading(true);
    setError(null);

    try {
      const result = await operation();
      if (result?.uid) {
        setProfile(await getUserProfile(result.uid));
      }
      return result;
    } catch (operationError) {
      setError(operationError);
      throw operationError;
    } finally {
      operationActive.current = false;
      setOperationLoading(false);
    }
  }, []);

  const login = useCallback(
    (email, password) => runOperation(() => loginWithEmail(email, password)),
    [runOperation],
  );

  const register = useCallback(
    (email, password, fullName) =>
      runOperation(() => signUpWithEmail(email, password, fullName)),
    [runOperation],
  );

  const loginGoogle = useCallback(
    () => runOperation(() => loginWithGoogle()),
    [runOperation],
  );

  const logout = useCallback(
    () => runOperation(() => logoutUser()),
    [runOperation],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      operationLoading,
      error,
      login,
      register,
      loginGoogle,
      logout,
      clearError,
    }),
    [
      user,
      profile,
      loading,
      operationLoading,
      error,
      login,
      register,
      loginGoogle,
      logout,
      clearError,
    ],
  );

  if (loading) {
    return (
      <NativeView
        style={styles.loading}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Restoring your secure session"
      >
        <LinearGradient colors={brandGradients.charcoal} start={{ x: 0.08, y: 0 }} end={{ x: 0.94, y: 1 }} style={StyleSheet.absoluteFill} />
        <View
          position="absolute"
          top={-90}
          right={-80}
          width={260}
          height={260}
          borderRadius={130}
          backgroundColor={brandColors.redAction}
          opacity={0.24}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />
        <View
          position="absolute"
          bottom={-74}
          left={-48}
          width={220}
          height={220}
          borderRadius={110}
          backgroundColor={brandColors.orange}
          opacity={0.13}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        />

        <YStack width="100%" maxWidth={390} padding={24} gap={24}>
          <Wordmark size={22} />
          <YStack gap={6}>
            <Text fontSize={10.5} lineHeight={15} fontWeight="800" color="rgba(255,255,255,0.66)" letterSpacing={1.15}>SECURE SESSION</Text>
            <Text maxWidth={310} fontSize={27} lineHeight={34} fontWeight="800" color="white">Restoring your FinSight workspace</Text>
          </YStack>

          <Card padding={18} borderColor={brandOverlays.onBrand24} shadowOpacity={0.22}>
            <XStack alignItems="center" gap={14}>
              <View width={48} height={48} borderRadius={16} backgroundColor="$redSoft" alignItems="center" justifyContent="center">
                <ActivityIndicator size="small" color={brandColors.redIdentity} />
              </View>
              <YStack flex={1} gap={3}>
                <Text fontSize={14.5} lineHeight={20} fontWeight="800" color="$navy">Checking your authenticated account</Text>
                <Text fontSize={12.5} lineHeight={18} color="$secondary">Your private session will open when restoration is complete.</Text>
              </YStack>
            </XStack>
            <XStack marginTop={16} gap={6} accessible={false} importantForAccessibility="no-hide-descendants">
              <View flex={1} height={4} borderRadius={2} backgroundColor="$red" />
              <View flex={1} height={4} borderRadius={2} backgroundColor="$orange" />
              <View flex={1} height={4} borderRadius={2} backgroundColor="$gold" />
            </XStack>
          </Card>
        </YStack>
      </NativeView>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: brandColors.charcoal,
  },
});

export { AuthContext };
