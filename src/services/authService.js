import { Platform } from "react-native";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID;

function getGoogleSignin() {
  // Load the custom native module only when production Google auth is invoked.
  // This keeps development email auth runnable in Expo Go.
  return require("@react-native-google-signin/google-signin").GoogleSignin;
}

const ERROR_MESSAGES = {
  "auth/email-already-in-use": "An account already exists for this email.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/missing-password": "Enter your password.",
  "auth/network-request-failed": "Check your connection and try again.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "The email or password is incorrect.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/wrong-password": "The email or password is incorrect.",
  "google/missing-client-id": "Google Sign-In is not configured for this build.",
  "google/missing-id-token": "Google did not return a valid sign-in token. Please try again.",
  "google/play-services": "Google Play Services is unavailable or needs an update.",
  "profile/sync-failed": "You are signed in, but your profile could not be updated. Please try again shortly.",
  "auth/method-not-available": "This sign-in method is not available in this build.",
};

export class AuthServiceError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "AuthServiceError";
    this.code = code;
    if (__DEV__ && cause) this.cause = cause;
  }
}

function toAuthError(error, fallbackCode = "auth/unknown") {
  if (error instanceof AuthServiceError) return error;

  const code = error?.code || fallbackCode;
  const message = ERROR_MESSAGES[code] || "Authentication failed. Please try again.";
  return new AuthServiceError(code, message, error);
}

function assertDevelopmentMethod() {
  if (!__DEV__) {
    throw new AuthServiceError(
      "auth/method-not-available",
      ERROR_MESSAGES["auth/method-not-available"],
    );
  }
}

function assertProductionMethod() {
  if (__DEV__) {
    throw new AuthServiceError(
      "auth/method-not-available",
      ERROR_MESSAGES["auth/method-not-available"],
    );
  }
}

function normalizeEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized)) {
    throw new AuthServiceError("auth/invalid-email", ERROR_MESSAGES["auth/invalid-email"]);
  }
  return normalized;
}

function validatePassword(password, requireMinimumLength = false) {
  if (!password) {
    throw new AuthServiceError("auth/missing-password", ERROR_MESSAGES["auth/missing-password"]);
  }
  if (requireMinimumLength && password.length < 6) {
    throw new AuthServiceError("auth/weak-password", ERROR_MESSAGES["auth/weak-password"]);
  }
}

function profileName(user, fullName) {
  return (
    String(fullName || user.displayName || "").trim() ||
    user.email?.split("@")[0] ||
    "FinSight User"
  );
}

export async function synchronizeUserProfile(user, authProvider = "EMAIL", fullName) {
  if (!user?.uid || !db) return null;
  const profileRef = doc(db, "users", user.uid);

  try {
    const snapshot = await getDoc(profileRef);
    const existing = snapshot.exists() ? snapshot.data() : {};

    const profile = {
      uid: user.uid,
      email: user.email || null,
      fullName: profileName(user, fullName || existing?.fullName),
      authProvider,
      updatedAt: serverTimestamp(),
    };

    if (!snapshot.exists()) profile.createdAt = serverTimestamp();
    await setDoc(profileRef, profile, { merge: true });

    // Seed/merge into cohort_profiles for real-time peer ranking
    const cohortRef = doc(db, "cohort_profiles", user.uid);
    const cohortId = existing?.cohortId || "nagpur_students";
    const city = existing?.city || "Nagpur";
    const college = existing?.college || `${city}, MH`;
    const monthlySpend = Number(existing?.monthlySpend) || 0;
    const categories = existing?.categories || {
      FOOD: 0,
      SHOPPING: 0,
      TRAVEL: 0,
      ENTERTAINMENT: 0,
    };
    const savingsRate = existing?.savingsRate || "50%";
    const percentile = Number(existing?.percentile) || 0;
    const hasRealTransactions = Boolean(
      existing?.hasRealTransactions && monthlySpend > 0,
    );
    const badge =
      existing?.badge ||
      (monthlySpend > 0 ? "Disciplined Saver" : "Starting Fresh");
    const keyHabit =
      existing?.keyHabit ||
      (monthlySpend > 0
        ? "Active FinSight Tracker"
        : "New account starting fresh");

    const cohortPayload = {
      userId: user.uid,
      id: user.uid,
      name: profile.fullName,
      avatar: user.photoURL || null,
      city,
      cohortId,
      college,
      monthlySpend,
      categories,
      savingsRate,
      percentile,
      badge,
      keyHabit,
      hasRealTransactions,
      updatedAt: serverTimestamp(),
      lastActive: new Date().toISOString(),
    };

    await setDoc(cohortRef, cohortPayload, { merge: true });

    return profile;
  } catch (error) {
    throw new AuthServiceError(
      "profile/sync-failed",
      ERROR_MESSAGES["profile/sync-failed"],
      error,
    );
  }
}

export async function signUpWithEmail(email, password, fullName) {
  assertDevelopmentMethod();
  const normalizedEmail = normalizeEmail(email);
  validatePassword(password, true);

  const normalizedName = String(fullName || "").trim();
  if (!normalizedName) {
    throw new AuthServiceError("auth/missing-name", "Enter your full name.");
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );
    await updateProfile(credential.user, { displayName: normalizedName });
    await synchronizeUserProfile(credential.user, "EMAIL", normalizedName);
    return credential.user;
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function loginWithEmail(email, password) {
  assertDevelopmentMethod();
  const normalizedEmail = normalizeEmail(email);
  validatePassword(password);

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );
    await synchronizeUserProfile(credential.user, "EMAIL");
    return credential.user;
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function loginWithGoogle() {
  assertProductionMethod();
  if (!googleWebClientId) {
    throw new AuthServiceError(
      "google/missing-client-id",
      ERROR_MESSAGES["google/missing-client-id"],
    );
  }

  try {
    const GoogleSignin = getGoogleSignin();
    GoogleSignin.configure({ webClientId: googleWebClientId });
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();
    if (response.type === "cancelled") return null;

    const idToken = response.data?.idToken;
    if (!idToken) {
      throw new AuthServiceError(
        "google/missing-id-token",
        ERROR_MESSAGES["google/missing-id-token"],
      );
    }

    const firebaseCredential = GoogleAuthProvider.credential(idToken);
    const credential = await signInWithCredential(auth, firebaseCredential);
    await synchronizeUserProfile(credential.user, "GOOGLE");
    return credential.user;
  } catch (error) {
    if (error?.code === "PLAY_SERVICES_NOT_AVAILABLE") {
      throw new AuthServiceError(
        "google/play-services",
        ERROR_MESSAGES["google/play-services"],
        error,
      );
    }
    throw toAuthError(error, "google/sign-in-failed");
  }
}

export async function getUserProfile(uid) {
  if (!uid) return null;

  try {
    const snapshot = await getDoc(doc(db, "users", uid));
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    throw new AuthServiceError(
      "profile/read-failed",
      "Your profile could not be loaded. Please try again shortly.",
      error,
    );
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw toAuthError(error, "auth/sign-out-failed");
  }

  if (!__DEV__) {
    try {
      await getGoogleSignin().signOut();
    } catch {
      // Firebase is already signed out; native provider cleanup is best effort.
    }
  }
}
