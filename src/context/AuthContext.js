import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../config/firebase";
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
      <View
        style={styles.loading}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Restoring your secure session"
      >
        <ActivityIndicator size="large" color="#EB001B" />
      </View>
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
    backgroundColor: "#FDF7F8",
  },
});

export { AuthContext };
