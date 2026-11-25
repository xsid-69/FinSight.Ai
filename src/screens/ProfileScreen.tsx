import React, { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Switch,
} from "react-native";
import { YStack, XStack, Text, View, ScrollView } from "tamagui";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
  Compass,
  MapPin,
  Briefcase,
  Award,
  Sparkles,
  Check,
} from "@tamagui/lucide-icons";

import { FinSightShell, Card } from "../components/finsight";
import { IconSquare, type LucideIcon } from "../components/IconSquare";
import { useAuth } from "../context/AuthContext";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { brandColors } from "../theme/mastercard";
import { syncUserProfileDemographics } from "../services/cohortService";

const PAGE_H = 20;
const PREFERENCES_KEY = "finsight.preferences.v1";
export const DEMOGRAPHICS_STORAGE_KEY = "finsight.user_demographics_v1";

type SectionId =
  | "personal"
  | "demographics"
  | "security"
  | "accounts"
  | "notifications"
  | "language"
  | "help";

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
  { id: "demographics", icon: Compass, label: "Demographics & Peer Cohort", iconBackground: "$orangeSoft", iconColor: "$orangeDeep" },
  { id: "security", icon: ShieldCheck, label: "Security", iconBackground: "$surfaceAlt", iconColor: "$charcoal" },
  { id: "accounts", icon: Link2, label: "Linked Accounts", iconBackground: "$orangeSoft", iconColor: "$orangeDeep" },
  { id: "notifications", icon: BellRing, label: "Notifications", iconBackground: "$goldSoft", iconColor: "$goldDeep" },
  { id: "language", icon: Languages, label: "Language", iconBackground: "$surfaceAlt", iconColor: "$charcoal" },
  { id: "help", icon: LifeBuoy, label: "Help & Support", iconBackground: "$orangeSoft", iconColor: "$orangeDeep" },
  { id: "logout", icon: LogOut, label: "Log Out", iconBackground: "$dangerSoft", iconColor: "$danger", danger: true },
];

const MENU_GROUPS: { title: string; rows: ProfileRow[] }[] = [
  { title: "Account", rows: ROWS.slice(0, 4) },
  { title: "Preferences", rows: ROWS.slice(4, 6) },
  { title: "Support", rows: ROWS.slice(6, 7) },
];

const SECTION_TITLES: Record<SectionId, string> = {
  personal: "Personal Info",
  demographics: "Demographics & Cohort",
  security: "Security",
  accounts: "Linked Accounts",
  notifications: "Notifications",
  language: "Language",
  help: "Help & Support",
};

const CITY_OPTIONS = [
  {
    id: "nagpur",
    name: "Nagpur",
    state: "MH",
    cohortKey: "nagpur_students",
    sampleSize: "5,420 peers",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pune",
    name: "Pune",
    state: "MH",
    cohortKey: "pune_students",
    sampleSize: "4,180 peers",
    image: "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    state: "KA",
    cohortKey: "tech_bengaluru",
    sampleSize: "18,300 peers",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "MH",
    cohortKey: "entry_professionals",
    sampleSize: "12,850 peers",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80",
  },
];

const ROLE_OPTIONS = [
  { id: "student", label: "College Student", icon: "🎓", cohortTag: "Students (18-24)" },
  { id: "young_pro", label: "Young Professional", icon: "💼", cohortTag: "Early Career" },
  { id: "tech_pro", label: "Tech / IT Specialist", icon: "⚡", cohortTag: "Tech & Product" },
  { id: "freelancer", label: "Freelancer / Creator", icon: "💻", cohortTag: "Independent" },
];

const BUDGET_OPTIONS = [
  "Under ₹10,000/mo",
  "₹10,000 – ₹25,000/mo",
  "₹25,000 – ₹50,000/mo",
  "Above ₹50,000/mo",
];

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
          void Haptics.selectionAsync();
          onChange(next);
        }}
        trackColor={{ false: brandColors.borderStrong, true: brandColors.redSoft }}
        thumbColor={value ? brandColors.redIdentity : brandColors.surface}
        accessibilityLabel={label}
      />
    </XStack>
  );
}

function DemographicsSection() {
  const { user } = useAuth();
  const [selectedCity, setSelectedCity] = useState("nagpur");
  const [selectedRole, setSelectedRole] = useState("student");
  const [selectedBudget, setSelectedBudget] = useState("₹10,000 – ₹25,000/mo");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DEMOGRAPHICS_STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored);
          if (parsed.city) setSelectedCity(parsed.city);
          if (parsed.role) setSelectedRole(parsed.role);
          if (parsed.budget) setSelectedBudget(parsed.budget);
        } catch {
          // fallback
        }
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const activeCityObj = CITY_OPTIONS.find((c) => c.id === selectedCity) || CITY_OPTIONS[0];
    const activeRoleObj = ROLE_OPTIONS.find((r) => r.id === selectedRole) || ROLE_OPTIONS[0];

    const dataToSave = {
      city: selectedCity,
      cityName: activeCityObj.name,
      role: selectedRole,
      roleLabel: activeRoleObj.label,
      budget: selectedBudget,
      cohortKey: activeCityObj.cohortKey,
      updatedAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem(DEMOGRAPHICS_STORAGE_KEY, JSON.stringify(dataToSave));
      if (user?.uid) {
        await syncUserProfileDemographics(user.uid, dataToSave);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      Alert.alert("Error", "Could not save demographics to local storage.");
    }
  };

  const currentCityObj = CITY_OPTIONS.find((c) => c.id === selectedCity) || CITY_OPTIONS[0];

  return (
    <YStack gap={16}>
      {/* City Hero Banner */}
      <View
        height={130}
        borderRadius={20}
        overflow="hidden"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Image
          source={{ uri: currentCityObj.image }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["rgba(23, 23, 23, 0.4)", "rgba(18, 18, 18, 0.88)"]}
          style={StyleSheet.absoluteFill}
        />
        <YStack flex={1} padding={16} justifyContent="space-between">
          <XStack alignItems="center" justifyContent="space-between">
            <XStack
              backgroundColor="rgba(255, 255, 255, 0.2)"
              borderRadius={999}
              paddingHorizontal={10}
              paddingVertical={4}
              alignItems="center"
              gap={5}
            >
              <MapPin size={12} color="#F79E1B" />
              <Text color="white" fontSize={11.5} fontWeight="700">
                {currentCityObj.name}, {currentCityObj.state}
              </Text>
            </XStack>
            <Text color="#F79E1B" fontSize={11.5} fontWeight="800">
              {currentCityObj.sampleSize}
            </Text>
          </XStack>

          <YStack gap={2}>
            <Text color="white" fontSize={17} fontWeight="800">
              Peer Benchmarking Demographic
            </Text>
            <Text color="rgba(255, 255, 255, 0.75)" fontSize={12}>
              Used by the Ranking Engine to compute your live KDE Percentile
            </Text>
          </YStack>
        </YStack>
      </View>

      {/* Select City */}
      <Card>
        <YStack gap={4} marginBottom={12}>
          <Text fontSize={15} lineHeight={21} color="$navy" fontWeight="800" accessibilityRole="header">
            Select Your City
          </Text>
          <Text fontSize={12.5} color="$secondary">
            Your spending is anonymously ranked against peers living in this city
          </Text>
        </YStack>

        <XStack flexWrap="wrap" gap={8}>
          {CITY_OPTIONS.map((c) => {
            const isSelected = selectedCity === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedCity(c.id);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: isSelected ? brandColors.redIdentity : "#F5F5F3",
                  borderWidth: 1,
                  borderColor: isSelected ? brandColors.redIdentity : "#E5E5E0",
                }}
                accessibilityRole="button"
                accessibilityLabel={`City ${c.name}`}
              >
                <Text
                  fontSize={13}
                  fontWeight="700"
                  color={isSelected ? "white" : "$charcoal"}
                >
                  {c.name} ({c.state})
                </Text>
              </Pressable>
            );
          })}
        </XStack>
      </Card>

      {/* Select Role */}
      <Card>
        <YStack gap={4} marginBottom={12}>
          <Text fontSize={15} lineHeight={21} color="$navy" fontWeight="800" accessibilityRole="header">
            Occupation / Lifestyle
          </Text>
          <Text fontSize={12.5} color="$secondary">
            Ensures benchmarks reflect students, tech professionals, or young earners
          </Text>
        </YStack>

        <YStack gap={8}>
          {ROLE_OPTIONS.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <Pressable
                key={r.id}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedRole(r.id);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: isSelected ? brandColors.redSoft : "#F9F9F8",
                  borderWidth: 1,
                  borderColor: isSelected ? brandColors.redIdentity : "#E5E5E0",
                }}
                accessibilityRole="button"
                accessibilityLabel={`Role ${r.label}`}
              >
                <XStack alignItems="center" gap={10}>
                  <Text fontSize={20}>{r.icon}</Text>
                  <YStack gap={2}>
                    <Text
                      fontSize={14}
                      fontWeight="700"
                      color={isSelected ? "$brand" : "$navy"}
                    >
                      {r.label}
                    </Text>
                    <Text fontSize={11.5} color="$secondary">
                      {r.cohortTag}
                    </Text>
                  </YStack>
                </XStack>
                {isSelected ? (
                  <View
                    width={22}
                    height={22}
                    borderRadius={11}
                    backgroundColor="$brand"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Check size={13} color="white" strokeWidth={2.5} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </YStack>
      </Card>

      {/* Monthly Budget Range */}
      <Card>
        <YStack gap={4} marginBottom={12}>
          <Text fontSize={15} lineHeight={21} color="$navy" fontWeight="800" accessibilityRole="header">
            Monthly Spend Range
          </Text>
          <Text fontSize={12.5} color="$secondary">
            Used to calibrate top money handler targets
          </Text>
        </YStack>

        <XStack flexWrap="wrap" gap={8}>
          {BUDGET_OPTIONS.map((b) => {
            const isSelected = selectedBudget === b;
            return (
              <Pressable
                key={b}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedBudget(b);
                }}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  borderRadius: 12,
                  backgroundColor: isSelected ? brandColors.goldDeep : "#F5F5F3",
                  borderWidth: 1,
                  borderColor: isSelected ? brandColors.goldDeep : "#E5E5E0",
                }}
                accessibilityRole="button"
                accessibilityLabel={`Budget ${b}`}
              >
                <Text
                  fontSize={12.5}
                  fontWeight="700"
                  color={isSelected ? "white" : "$charcoal"}
                >
                  {b}
                </Text>
              </Pressable>
            );
          })}
        </XStack>
      </Card>

      {savedSuccess ? (
        <XStack
          padding={12}
          borderRadius={14}
          backgroundColor="$successSoft"
          borderWidth={1}
          borderColor="$success"
          alignItems="center"
          gap={8}
        >
          <Check size={16} color="$success" strokeWidth={2.5} />
          <Text fontSize={13} fontWeight="700" color="$success">
            Demographics updated! Ranking engine recalibrated.
          </Text>
        </XStack>
      ) : null}

      <Pressable
        onPress={handleSave}
        style={{
          minHeight: 52,
          borderRadius: 16,
          backgroundColor: brandColors.redIdentity,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 4,
        }}
        accessibilityRole="button"
        accessibilityLabel="Save & Update Ranking Cohort"
      >
        <Text color="white" fontSize={14.5} fontWeight="800">
          Save & Update Ranking Cohort
        </Text>
      </Pressable>
    </YStack>
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

  if (section === "demographics") {
    return <DemographicsSection />;
  }

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
  const [demographics, setDemographics] = useState<{ cityName?: string; roleLabel?: string } | null>(null);

  const displayName = profile?.fullName || user?.displayName || "FinSight User";
  const email = profile?.email || user?.email || "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "F";
  const providerId = user?.providerData?.[0]?.providerId || "Secure sign-in";
  const provider = providerId.includes("google") ? "Google" : providerId.includes("password") ? "Email and password" : "Secure sign-in";

  useEffect(() => {
    if (isSectionId(routeSection)) setActiveSection(routeSection);
  }, [routeSection]);

  useEffect(() => {
    AsyncStorage.getItem(DEMOGRAPHICS_STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        try {
          const parsed = JSON.parse(stored);
          setDemographics(parsed);
        } catch {
          // ignore
        }
      })
      .catch(() => undefined);
  }, [activeSection]);

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
    void Haptics.selectionAsync();
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
            {/* User Profile Card with Visual Cover & Portrait */}
            <Card variant="charcoal" overflow="hidden" padding={0}>
              {/* Cover Banner */}
              <View height={84} width="100%" overflow="hidden">
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
                  }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["rgba(23, 23, 23, 0.2)", "rgba(18, 18, 18, 0.85)"]}
                  style={StyleSheet.absoluteFill}
                />
              </View>

              <YStack padding={20} paddingTop={0} marginTop={-34}>
                <XStack alignItems="flex-end" gap={14} marginBottom={12}>
                  <View
                    width={72}
                    height={72}
                    borderRadius={24}
                    backgroundColor="$red"
                    borderWidth={3}
                    borderColor="#FFFFFF"
                    overflow="hidden"
                    alignItems="center"
                    justifyContent="center"
                    shadowColor="#000"
                    shadowOffset={{ width: 0, height: 4 }}
                    shadowOpacity={0.25}
                    shadowRadius={6}
                  >
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                      }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    <Text color="white" fontWeight="800" fontSize={26} opacity={0.3}>
                      {initial}
                    </Text>
                  </View>

                  <YStack flex={1} gap={2} paddingBottom={4}>
                    <Text fontSize={19} lineHeight={25} fontWeight="800" color="white" accessibilityRole="header">
                      {displayName}
                    </Text>
                    {email ? (
                      <Text color="rgba(255,255,255,0.72)" fontSize={12.5} lineHeight={17} fontWeight="600">
                        {email}
                      </Text>
                    ) : null}
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap={8} marginTop={4}>
                  <XStack backgroundColor="$red" borderRadius={999} paddingHorizontal={10} paddingVertical={4}>
                    <Text color="white" fontSize={11.5} fontWeight="800">
                      Premium Member
                    </Text>
                  </XStack>
                  <XStack backgroundColor="rgba(255,255,255,0.12)" borderRadius={999} paddingHorizontal={10} paddingVertical={4}>
                    <Text color="rgba(255,255,255,0.85)" fontSize={11.5} fontWeight="700">
                      {demographics?.cityName || "Nagpur"} • {demographics?.roleLabel || "Student"}
                    </Text>
                  </XStack>
                </XStack>
              </YStack>
            </Card>

            {/* Interactive Demographics & Ranking Summary Card */}
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                setActiveSection("demographics");
              }}
              style={({ pressed }) => [
                {
                  borderRadius: 20,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E5E5E0",
                  padding: 16,
                  overflow: "hidden",
                },
                pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="View or edit demographic peer cohort"
            >
              <XStack alignItems="center" justifyContent="space-between" marginBottom={10}>
                <XStack alignItems="center" gap={7}>
                  <Award size={16} color="#F79E1B" strokeWidth={2.4} />
                  <Text fontSize={11.5} fontWeight="800" textTransform="uppercase" letterSpacing={1.2} color="$secondary">
                    Peer Benchmark Standing
                  </Text>
                </XStack>
                <XStack alignItems="center" gap={4}>
                  <Text fontSize={12} fontWeight="800" color="$brand">
                    Edit
                  </Text>
                  <ChevronRight size={14} color="$brand" />
                </XStack>
              </XStack>

              <XStack alignItems="center" justifyContent="space-between">
                <YStack gap={3}>
                  <Text fontSize={16} fontWeight="800" color="$charcoal">
                    {demographics?.cityName || "Nagpur"} • {demographics?.roleLabel || "College Student"}
                  </Text>
                  <Text fontSize={12.5} color="$secondary">
                    Active cohort: 5,420 peer samples • Top 22% Standing
                  </Text>
                </YStack>

                <View
                  borderRadius={12}
                  backgroundColor="$orangeSoft"
                  paddingHorizontal={10}
                  paddingVertical={6}
                >
                  <Text fontSize={12} fontWeight="800" color="$orangeDeep">
                    Top 22%
                  </Text>
                </View>
              </XStack>
            </Pressable>

            {MENU_GROUPS.map((group) => (
              <YStack key={group.title} gap={8}>
                <Text paddingHorizontal={2} fontSize={12} lineHeight={17} color="$secondary" fontWeight="800" letterSpacing={0.5} accessibilityRole="header">
                  {group.title}
                </Text>
                <Card variant="flat" padding={0} overflow="hidden">
                  {group.rows.map((row, index) => renderRow(row, index === group.rows.length - 1))}
                </Card>
              </YStack>
            ))}

            <YStack gap={8}>
              <Text paddingHorizontal={2} fontSize={12} lineHeight={17} color="$secondary" fontWeight="800" letterSpacing={0.5} accessibilityRole="header">
                Session
              </Text>
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
