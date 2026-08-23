import React from "react";
import { ActivityIndicator } from "react-native";
import { YStack, XStack, Text, View, ScrollView } from "tamagui";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
  UserCog,
  ShieldCheck,
  Link2,
  BellRing,
  Languages,
  LifeBuoy,
  LogOut,
} from "@tamagui/lucide-icons";

import { FinSightShell } from "../components/finsight";
import { IconSquare, type LucideIcon } from "../components/IconSquare";
import { useAuth } from "../context/AuthContext";

const ROWS: { icon: LucideIcon; label: string; danger?: boolean }[] = [
  { icon: UserCog, label: "Personal Info" },
  { icon: ShieldCheck, label: "Security" },
  { icon: Link2, label: "Linked Accounts" },
  { icon: BellRing, label: "Notifications" },
  { icon: Languages, label: "Language" },
  { icon: LifeBuoy, label: "Help & Support" },
  { icon: LogOut, label: "Log Out", danger: true },
];

export function ProfileScreen({ navigation }: { navigation?: any }) {
  const insets = useSafeAreaInsets();
  const { user, profile, logout, operationLoading } = useAuth();
  const displayName = profile?.fullName || user?.displayName || "FinSight User";
  const email = profile?.email || user?.email || "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "F";

  const handleRow = async (danger?: boolean) => {
    Haptics.selectionAsync();
    if (!danger || operationLoading) return;

    try {
      await logout();
    } catch {
      // AuthContext retains the error; the authenticated screen stays mounted.
    }
  };

  return (
    <FinSightShell title="Profile" onBack={() => navigation?.goBack?.()}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
      >

        <YStack alignItems="center" marginBottom={22} gap={8}>
          <View
            width={72}
            height={72}
            borderRadius={36}
            backgroundColor="$accentPink"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="white" fontWeight="800" fontSize={28}>
              {initial}
            </Text>
          </View>
          <Text fontSize={19} fontWeight="800" color="$navy">
            {displayName}
          </Text>
          {email ? (
            <Text color="$secondary" fontSize={13} fontWeight="600">
              {email}
            </Text>
          ) : null}
          <XStack backgroundColor="$brandRed" borderRadius={999} paddingHorizontal={12} paddingVertical={4}>
            <Text color="white" fontSize={12} fontWeight="700">
              Premium
            </Text>
          </XStack>
        </YStack>

        {ROWS.map((row, index) => (
          <MotiView
            key={row.label}
            from={{ translateX: -12, opacity: 0 }}
            animate={{ translateX: 0, opacity: 1 }}
            transition={{ type: "timing", duration: 260, delay: index * 40 }}
          >
            <XStack
              alignItems="center"
              gap={12}
              paddingVertical={12}
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
              pressStyle={{ opacity: 0.6 }}
              opacity={row.danger && operationLoading ? 0.65 : 1}
              onPress={() => handleRow(row.danger)}
              accessibilityRole="button"
              accessibilityLabel={row.danger && operationLoading ? "Signing out" : row.label}
              accessibilityState={{
                disabled: Boolean(row.danger && operationLoading),
                busy: Boolean(row.danger && operationLoading),
              }}
            >
              <IconSquare
                icon={row.icon}
                color={row.danger ? "$brandRed" : "$accentPink"}
                size={36}
                radius={12 as any}
              />
              <Text flex={1} fontSize={14.5} fontWeight="600" color={row.danger ? "$brandRed" : "$navy"}>
                {row.danger && operationLoading ? "Signing out…" : row.label}
              </Text>
              {row.danger && operationLoading ? (
                <ActivityIndicator size="small" color="#EB001B" />
              ) : !row.danger ? (
                <ChevronRight size={18} color="$secondary" />
              ) : null}
            </XStack>
          </MotiView>
        ))}
      </ScrollView>
    </FinSightShell>
  );
}
