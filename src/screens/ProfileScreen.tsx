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
import { brandColors } from "../theme/mastercard";

const PAGE_H = 20;
const PREFERENCES_KEY = "finsight.preferences.v1";
type SectionId = "personal" | "security" | "accounts" | "notifications" | "language" | "help";

type ProfileRow = {
  id: SectionId | "logout";
  icon: LucideIcon;
  label: string;
  iconBackground: string;
  iconColor: string;
  danger?: boolean;
};

const ROWS: ProfileRow[] = [
  { id: "personal", icon: UserCog, label: "Personal Info", iconBackground: "$redSoft", iconColor: "$red" },
  { id: "security", icon: ShieldCheck, label: "Security", iconBackground: "$surfaceAlt", iconColor: "$charcoal" },
  { id: "accounts", icon: Link2, label: "Linked Accounts", iconBackground: "$orangeSoft", iconColor: "$orangeDeep" },
  { id: "notifications", icon: BellRing, label: "Notifications", iconBackground: "$goldSoft", iconColor: "$goldDeep" },
  { id: "language", icon: Languages, label: "Language", iconBackground: "$surfaceAlt", iconColor: "$charcoal" },
  { id: "help", icon: LifeBuoy, label: "Help & Support", iconBackground: "$orangeSoft", iconColor: "$orangeDeep" },
  { id: "logout", icon: LogOut, label: "Log Out", iconBackground: "$dangerSoft", iconColor: "$danger", danger: true },
];

const MENU_GROUPS: { title: string; rows: ProfileRow[] }[] = [
  { title: "Account", rows: ROWS.slice(0, 3) },
  { title: "Preferences", rows: ROWS.slice(3, 5) },
  { title: "Support", rows: ROWS.slice(5, 6) },
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
    <XStack minHeight={56} alignItems="center" justifyContent="space-between" gap={16} borderBottomWidth={1} borderBottomColor="$borderColor">
      <Text fontSize={13} lineHeight={18} color="$secondary" fontWeight="600">{label}</Text>
      <Text flex={1} textAlign="right" fontSize={13.5} lineHeight={19} color="$navy" fontWeight="700">{value}</Text>
    </XStack>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <XStack minHeight={72} alignItems="center" gap={14} borderBottomWidth={1} borderBottomColor="$borderColor">
      <YStack flex={1} gap={2}>
        <Text fontSize={14} lineHeight={20} color="$navy" fontWeight="700">{label}</Text>
        <Text fontSize={12.5} lineHeight={17} color="$secondary">{description}</Text>
      </YStack>
      <Switch
        value={value}
        onValueChange={(next) => {
          Haptics.selectionAsync();
          onChange(next);
        }}
        trackColor={{ false: brandColors.borderStrong, true: brandColors.redSoft }}
        thumbColor={value ? brandColors.redIdentity : brandColors.surface}
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
        <YStack gap={3} marginBottom={8}>
          <Text fontSize={16} lineHeight={22} color="$navy" fontWeight="800" accessibilityRole="header">Notification preferences</Text>
          <Text fontSize={13} color="$secondary" lineHeight={19}>Choose the updates that are useful. Security alerts remain recommended.</Text>
        </YStack>
        <ToggleRow label="Insight alerts" description="Meaningful changes and unusual activity" value={insightAlerts} onChange={setInsightAlerts} />
        <ToggleRow label="Weekly summary" description="A calm weekly financial recap" value={weeklySummary} onChange={setWeeklySummary} />
        <ToggleRow label="Security alerts" description="New sign-ins and account protection" value={securityAlerts} onChange={setSecurityAlerts} />
      </Card>
    );
  }

  if (section === "language") {
    return (
      <Card>
        <XStack alignItems="center" gap={12} marginBottom={4}>
          <IconSquare icon={Languages} color="$goldSoft" iconColor="$goldDeep" size={42} radius={14 as any} />
          <YStack flex={1} gap={2}>
            <Text fontSize={15} lineHeight={21} color="$navy" fontWeight="800" accessibilityRole="header">App language</Text>
            <Text fontSize={12.5} lineHeight={18} color="$secondary">Complete translations only</Text>
          </YStack>
        </XStack>
        <InfoRow label="Current language" value="English (India)" />
        <Text fontSize={12.5} color="$secondary" lineHeight={18} marginTop={12}>Additional fully translated languages will appear here when they are ready. FinSight will not apply a partial translation.</Text>
      </Card>
    );
  }

  if (section === "help") {
    return (
      <YStack gap={14}>
        <Card variant="charcoal" overflow="hidden">
          <View position="absolute" top={-34} right={-26} width={108} height={108} borderRadius={54} backgroundColor="$red" opacity={0.2} />
          <XStack alignItems="center" gap={12}>
            <IconSquare icon={LifeBuoy} color="$orangeSoft" iconColor="$orangeDeep" size={44} radius={14 as any} />
            <YStack flex={1} gap={3}>
              <Text fontSize={16} lineHeight={22} color="white" fontWeight="800" accessibilityRole="header">We’re here to help</Text>
              <Text fontSize={13} color="rgba(255,255,255,0.7)" lineHeight={19}>Questions about your account, privacy, or an insight?</Text>
            </YStack>
          </XStack>
        </Card>
        <XStack
          minHeight={50}
          borderRadius={15}
          backgroundColor="$red"
          alignItems="center"
          justifyContent="center"
          gap={8}
          onPress={contactSupport}
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          accessibilityRole="button"
          accessibilityLabel="Email FinSight support"
        >
          <Mail size={17} color="white" strokeWidth={2.3} />
          <Text color="white" fontSize={14} fontWeight="800">Email support</Text>
        </XStack>
        <Text textAlign="center" fontSize={12.5} color="$secondary">support@finsight.ai</Text>
      </YStack>
    );
  }

  if (section === "security") {
    return (
      <Card>
        <XStack alignItems="center" gap={12} marginBottom={8}>
          <IconSquare icon={ShieldCheck} color="$successSoft" iconColor="$success" size={42} radius={14 as any} />
          <YStack flex={1} gap={2}>
            <Text fontSize={15} lineHeight={21} color="$navy" fontWeight="800" accessibilityRole="header">Account protected</Text>
            <Text fontSize={12.5} lineHeight={18} color="$success" fontWeight="700">Authenticated session active</Text>
          </YStack>
        </XStack>
        <InfoRow label="Sign-in method" value={provider} />
        <InfoRow label="Account" value={email || "Authenticated account"} />
        <Text fontSize={12.5} lineHeight={18} color="$secondary" marginTop={12}>Authentication is managed securely through Firebase. FinSight never displays or stores your password in the app.</Text>
      </Card>
    );
  }

  if (section === "accounts") {
    return (
      <Card>
        <XStack alignItems="center" gap={12} marginBottom={8}>
          <IconSquare icon={Link2} color="$orangeSoft" iconColor="$orangeDeep" size={42} radius={14 as any} />
          <YStack flex={1} gap={2}>
            <Text fontSize={15} lineHeight={21} color="$navy" fontWeight="800" accessibilityRole="header">Connected identity</Text>
            <Text fontSize={12.5} lineHeight={18} color="$secondary">Your signed-in FinSight account</Text>
          </YStack>
        </XStack>
        <InfoRow label="Primary account" value={email || "Signed-in account"} />
        <InfoRow label="Bank connections" value="None" />
        <Text fontSize={12.5} lineHeight={18} color="$secondary" marginTop={12}>Statement previews do not connect to a bank. A connection will always require your explicit approval.</Text>
      </Card>
    );
  }

  return (
    <Card>
      <XStack alignItems="center" gap={12} marginBottom={6}>
        <IconSquare icon={UserCog} color="$redSoft" iconColor="$red" size={42} radius={14 as any} />
        <YStack flex={1} gap={2}>
          <Text fontSize={15} lineHeight={21} color="$navy" fontWeight="800" accessibilityRole="header">Personal details</Text>
          <Text fontSize={12.5} lineHeight={18} color="$secondary">From your authenticated account</Text>
        </YStack>
      </XStack>
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

  const handleRow = async (row: ProfileRow) => {
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

  const renderRow = (row: ProfileRow, isLast: boolean) => {
    const rowIndex = ROWS.findIndex((candidate) => candidate.id === row.id);
    const signingOut = Boolean(row.danger && operationLoading);

    return (
      <MotiView
        key={row.id}
        from={{ translateX: reducedMotion ? 0 : -10, opacity: reducedMotion ? 1 : 0.7 }}
        animate={{ translateX: 0, opacity: 1 }}
        transition={{ type: "timing", duration: reducedMotion ? 1 : 190, delay: reducedMotion ? 0 : rowIndex * 28 }}
      >
        <XStack
          minHeight={62}
          paddingHorizontal={14}
          alignItems="center"
          gap={12}
          borderBottomWidth={isLast ? 0 : 1}
          borderBottomColor="$borderColor"
          pressStyle={{ opacity: 0.62 }}
          opacity={signingOut ? 0.65 : 1}
          onPress={() => handleRow(row)}
          accessibilityRole="button"
          accessibilityLabel={signingOut ? "Signing out" : row.label}
          accessibilityState={{ disabled: signingOut, busy: signingOut }}
        >
          <IconSquare icon={row.icon} color={row.iconBackground} iconColor={row.iconColor} size={38} radius={12 as any} />
          <Text flex={1} fontSize={14.5} lineHeight={20} fontWeight="700" color={row.danger ? "$danger" : "$navy"}>
            {signingOut ? "Signing out…" : row.label}
          </Text>
          {signingOut ? (
            <ActivityIndicator size="small" color={brandColors.danger} />
          ) : !row.danger ? (
            <ChevronRight size={18} color="$secondary" />
          ) : null}
        </XStack>
      </MotiView>
    );
  };

  return (
    <FinSightShell title={activeSection ? SECTION_TITLES[activeSection] : "Profile"} onBack={handleBack}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + 40 }}
      >
        {activeSection ? (
          <MotiView
            key={activeSection}
            from={{ opacity: reducedMotion ? 1 : 0.72, translateX: reducedMotion ? 0 : 12 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: reducedMotion ? 1 : 200 }}
          >
            <DetailContent section={activeSection} displayName={displayName} email={email} provider={provider} />
          </MotiView>
        ) : (
          <YStack gap={20}>
            <Card variant="charcoal" overflow="hidden" padding={20}>
              <View position="absolute" top={-48} right={-34} width={146} height={146} borderRadius={73} backgroundColor="$red" opacity={0.22} />
              <View position="absolute" bottom={-38} right={52} width={102} height={102} borderRadius={51} backgroundColor="$orange" opacity={0.12} />
              <XStack alignItems="center" gap={14}>
                <View
                  width={68}
                  height={68}
                  borderRadius={22}
                  backgroundColor="$red"
                  borderWidth={2}
                  borderColor="$orange"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontWeight="800" fontSize={27}>{initial}</Text>
                </View>
                <YStack flex={1} gap={3}>
                  <Text fontSize={19} lineHeight={25} fontWeight="800" color="white" accessibilityRole="header">{displayName}</Text>
                  {email ? <Text color="rgba(255,255,255,0.68)" fontSize={12.5} lineHeight={18} fontWeight="600">{email}</Text> : null}
                  <XStack alignSelf="flex-start" backgroundColor="$red" borderRadius={999} paddingHorizontal={10} paddingVertical={4} marginTop={3}>
                    <Text color="white" fontSize={11.5} fontWeight="800">Premium</Text>
                  </XStack>
                </YStack>
              </XStack>
            </Card>

            {MENU_GROUPS.map((group) => (
              <YStack key={group.title} gap={8}>
                <Text paddingHorizontal={2} fontSize={12} lineHeight={17} color="$secondary" fontWeight="800" letterSpacing={0.5} accessibilityRole="header">{group.title}</Text>
                <Card variant="flat" padding={0} overflow="hidden">
                  {group.rows.map((row, index) => renderRow(row, index === group.rows.length - 1))}
                </Card>
              </YStack>
            ))}

            <YStack gap={8}>
              <Text paddingHorizontal={2} fontSize={12} lineHeight={17} color="$secondary" fontWeight="800" letterSpacing={0.5} accessibilityRole="header">Session</Text>
              <Card variant="flat" padding={0} overflow="hidden">
                {renderRow(ROWS[ROWS.length - 1], true)}
              </Card>
            </YStack>
          </YStack>
        )}
      </ScrollView>
    </FinSightShell>
  );
}
