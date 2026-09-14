import React, { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator, Alert, BackHandler, Linking, Switch } from "react-native";
import { YStack, XStack, Text, View, ScrollView } from "tamagui";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  ChevronRight,
  UserCog,
  ShieldCheck,
  Link2,
  BellRing,
  Languages,
  LifeBuoy,
  LogOut,
  Mail,
} from "@tamagui/lucide-icons";

import { FinSightShell, Card } from "../components/finsight";
import { IconSquare, type LucideIcon } from "../components/IconSquare";
import { useAuth } from "../context/AuthContext";
import { useReducedMotion } from "../hooks/useReducedMotion";

const PAGE_H = 20;
const PREFERENCES_KEY = "finsight.preferences.v1";
type SectionId = "personal" | "security" | "accounts" | "notifications" | "language" | "help";

const ROWS: { id: SectionId | "logout"; icon: LucideIcon; label: string; danger?: boolean }[] = [
  { id: "personal", icon: UserCog, label: "Personal Info" },
  { id: "security", icon: ShieldCheck, label: "Security" },
  { id: "accounts", icon: Link2, label: "Linked Accounts" },
  { id: "notifications", icon: BellRing, label: "Notifications" },
  { id: "language", icon: Languages, label: "Language" },
  { id: "help", icon: LifeBuoy, label: "Help & Support" },
  { id: "logout", icon: LogOut, label: "Log Out", danger: true },
];

const SECTION_TITLES: Record<SectionId, string> = {
  personal: "Personal Info",
  security: "Security",
  accounts: "Linked Accounts",
  notifications: "Notifications",
  language: "Language",
  help: "Help & Support",
};

function isSectionId(value: unknown): value is SectionId {
  return typeof value === "string" && value in SECTION_TITLES;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack minHeight={52} alignItems="center" justifyContent="space-between" gap={16} borderBottomWidth={1} borderBottomColor="$borderColor">
      <Text fontSize={13} color="$secondary" fontWeight="600">{label}</Text>
      <Text flex={1} textAlign="right" fontSize={13.5} color="$navy" fontWeight="700">{value}</Text>
    </XStack>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <XStack minHeight={68} alignItems="center" gap={14} borderBottomWidth={1} borderBottomColor="$borderColor">
      <YStack flex={1} gap={2}>
        <Text fontSize={14} color="$navy" fontWeight="700">{label}</Text>
        <Text fontSize={12.5} lineHeight={17} color="$secondary">{description}</Text>
      </YStack>
      <Switch
        value={value}
        onValueChange={(next) => { Haptics.selectionAsync(); onChange(next); }}
        trackColor={{ false: "#D7DAE1", true: "#F3A3AD" }}
        thumbColor={value ? "#EB001B" : "#FFFFFF"}
        accessibilityLabel={label}
      />
    </XStack>
  );
}

interface DetailContentProps {
  section: SectionId;
  displayName: string;
  email: string;
  provider: string;
}

function DetailContent({ section, displayName, email, provider }: DetailContentProps) {
  const [insightAlerts, setInsightAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFERENCES_KEY)
      .then((stored) => {
        if (!stored) return;
        const preferences = JSON.parse(stored) as Partial<{
          insightAlerts: boolean;
          weeklySummary: boolean;
          securityAlerts: boolean;
        }>;
        if (typeof preferences.insightAlerts === "boolean") setInsightAlerts(preferences.insightAlerts);
        if (typeof preferences.weeklySummary === "boolean") setWeeklySummary(preferences.weeklySummary);
        if (typeof preferences.securityAlerts === "boolean") setSecurityAlerts(preferences.securityAlerts);
      })
      .catch(() => undefined)
      .finally(() => setPreferencesLoaded(true));
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify({ insightAlerts, weeklySummary, securityAlerts })).catch(() => undefined);
  }, [insightAlerts, preferencesLoaded, securityAlerts, weeklySummary]);

  const contactSupport = async () => {
    const url = "mailto:support@finsight.ai?subject=FInsightAI%20Support";
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Contact support", "Email support@finsight.ai and our team will help you.");
    }
  };

  if (section === "notifications") {
    return (
      <Card>
        <Text fontSize={14} color="$secondary" lineHeight={20} marginBottom={8}>Choose the updates that are useful. Security alerts remain recommended.</Text>
        <ToggleRow label="Insight alerts" description="Meaningful changes and unusual activity" value={insightAlerts} onChange={setInsightAlerts} />
        <ToggleRow label="Weekly summary" description="A calm weekly financial recap" value={weeklySummary} onChange={setWeeklySummary} />
        <ToggleRow label="Security alerts" description="New sign-ins and account protection" value={securityAlerts} onChange={setSecurityAlerts} />
      </Card>
    );
  }

  if (section === "language") {
    return (
      <Card>
        <Text fontSize={14} color="$navy" fontWeight="800">App language</Text>
        <InfoRow label="Current language" value="English (India)" />
        <Text fontSize={12.5} color="$secondary" lineHeight={18} marginTop={12}>Additional fully translated languages will appear here when they are ready. FinSight will not apply a partial translation.</Text>
      </Card>
    );
  }

  if (section === "help") {
    return (
      <YStack gap={14}>
        <Card>
          <XStack alignItems="center" gap={12}>
            <IconSquare icon={LifeBuoy} color="$ai" size={42} radius={14 as any} />
            <YStack flex={1} gap={3}>
              <Text fontSize={15} color="$navy" fontWeight="800">We’re here to help</Text>
              <Text fontSize={13} color="$secondary" lineHeight={18}>Questions about your account, privacy, or an insight?</Text>
            </YStack>
          </XStack>
        </Card>
        <XStack minHeight={50} borderRadius={16} backgroundColor="$navy" alignItems="center" justifyContent="center" gap={8} onPress={contactSupport} pressStyle={{ scale: 0.98, opacity: 0.9 }} accessibilityRole="button" accessibilityLabel="Email FinSight support">
          <Mail size={17} color="white" strokeWidth={2.3} />
          <Text color="white" fontSize={14} fontWeight="800">Email support</Text>
        </XStack>
        <Text textAlign="center" fontSize={12.5} color="$secondary">support@finsight.ai</Text>
      </YStack>
    );
  }

  if (section === "security") {
    return (
      <YStack gap={14}>
        <Card>
          <XStack alignItems="center" gap={10} marginBottom={8}>
            <ShieldCheck size={20} color="$success" strokeWidth={2.3} />
            <Text fontSize={15} color="$navy" fontWeight="800">Account protected</Text>
          </XStack>
          <InfoRow label="Sign-in method" value={provider} />
          <InfoRow label="Account" value={email || "Authenticated account"} />
          <Text fontSize={12.5} lineHeight={18} color="$secondary" marginTop={12}>Authentication is managed securely through Firebase. FInsightAI never displays or stores your password in the app.</Text>
        </Card>
      </YStack>
    );
  }

  if (section === "accounts") {
    return (
      <Card>
        <XStack alignItems="center" gap={10} marginBottom={10}>
          <Link2 size={20} color="$ai" strokeWidth={2.3} />
          <Text fontSize={15} color="$navy" fontWeight="800">Connected identity</Text>
        </XStack>
        <InfoRow label="Primary account" value={email || "Signed-in account"} />
        <InfoRow label="Bank connections" value="None" />
        <Text fontSize={12.5} lineHeight={18} color="$secondary" marginTop={12}>Statement previews do not connect to a bank. A connection will always require your explicit approval.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <InfoRow label="Name" value={displayName} />
      <InfoRow label="Email" value={email || "Not provided"} />
      <InfoRow label="Plan" value="Premium" />
      <Text fontSize={12.5} lineHeight={18} color="$secondary" marginTop={12}>Profile details come from your authenticated account and remain private to your session.</Text>
    </Card>
  );
}

export function ProfileScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { user, profile, logout, operationLoading } = useAuth();
  const routeSection = route?.params?.section;
  const [activeSection, setActiveSection] = useState<SectionId | null>(isSectionId(routeSection) ? routeSection : null);
  const displayName = profile?.fullName || user?.displayName || "FinSight User";
  const email = profile?.email || user?.email || "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "F";
  const providerId = user?.providerData?.[0]?.providerId || "Secure sign-in";
  const provider = providerId.includes("google") ? "Google" : providerId.includes("password") ? "Email and password" : "Secure sign-in";

  useEffect(() => {
    if (isSectionId(routeSection)) setActiveSection(routeSection);
  }, [routeSection]);

  const handleBack = useCallback(() => {
    if (activeSection) {
      setActiveSection(null);
      return;
    }
    navigation?.goBack?.();
  }, [activeSection, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!activeSection) return undefined;
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        setActiveSection(null);
        return true;
      });
      return () => subscription.remove();
    }, [activeSection]),
  );

  const handleRow = async (row: (typeof ROWS)[number]) => {
    Haptics.selectionAsync();
    if (row.id !== "logout") {
      setActiveSection(row.id);
      return;
    }
    if (operationLoading) return;
    try {
      await logout();
    } catch {
      // AuthContext retains the error; the authenticated screen stays mounted.
    }
  };

  return (
    <FinSightShell title={activeSection ? SECTION_TITLES[activeSection] : "Profile"} onBack={handleBack}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + 40 }}>
        {activeSection ? (
          <MotiView key={activeSection} from={{ opacity: reducedMotion ? 1 : 0.72, translateX: reducedMotion ? 0 : 12 }} animate={{ opacity: 1, translateX: 0 }} transition={{ type: "timing", duration: reducedMotion ? 1 : 200 }}>
            <DetailContent section={activeSection} displayName={displayName} email={email} provider={provider} />
          </MotiView>
        ) : (
          <>
            <YStack alignItems="center" marginBottom={22} gap={8}>
              <View width={72} height={72} borderRadius={36} backgroundColor="$accentPink" alignItems="center" justifyContent="center">
                <Text color="white" fontWeight="800" fontSize={28}>{initial}</Text>
              </View>
              <Text fontSize={19} fontWeight="800" color="$navy">{displayName}</Text>
              {email ? <Text color="$secondary" fontSize={13} fontWeight="600">{email}</Text> : null}
              <XStack backgroundColor="$brandRed" borderRadius={999} paddingHorizontal={12} paddingVertical={4}>
                <Text color="white" fontSize={12} fontWeight="700">Premium</Text>
              </XStack>
            </YStack>

            {ROWS.map((row, index) => (
              <MotiView key={row.id} from={{ translateX: reducedMotion ? 0 : -10, opacity: reducedMotion ? 1 : 0.7 }} animate={{ translateX: 0, opacity: 1 }} transition={{ type: "timing", duration: reducedMotion ? 1 : 190, delay: reducedMotion ? 0 : index * 28 }}>
                <XStack
                  minHeight={58}
                  alignItems="center"
                  gap={12}
                  borderBottomWidth={1}
                  borderBottomColor="$borderColor"
                  pressStyle={{ opacity: 0.62 }}
                  opacity={row.danger && operationLoading ? 0.65 : 1}
                  onPress={() => handleRow(row)}
                  accessibilityRole="button"
                  accessibilityLabel={row.danger && operationLoading ? "Signing out" : row.label}
                  accessibilityState={{ disabled: Boolean(row.danger && operationLoading), busy: Boolean(row.danger && operationLoading) }}
                >
                  <IconSquare icon={row.icon} color={row.danger ? "$brandRed" : "$accentPink"} size={36} radius={12 as any} />
                  <Text flex={1} fontSize={14.5} fontWeight="600" color={row.danger ? "$brandRed" : "$navy"}>{row.danger && operationLoading ? "Signing out…" : row.label}</Text>
                  {row.danger && operationLoading ? <ActivityIndicator size="small" color="#EB001B" /> : !row.danger ? <ChevronRight size={18} color="$secondary" /> : null}
                </XStack>
              </MotiView>
            ))}
          </>
        )}
      </ScrollView>
    </FinSightShell>
  );
}
