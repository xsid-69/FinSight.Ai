import React, { useState } from "react";
import { Modal, Pressable } from "react-native";
import { YStack, XStack, Text, View } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  ChevronLeft,
  FileSpreadsheet,
  LifeBuoy,
  LogOut,
  Settings,
  UserRound,
} from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { headerGradient } from "../../constants/colors";
import { Wordmark } from "./Wordmark";
import { HeaderNavigation, type MainTab } from "./HeaderNavigation";

import type { SharedValue } from "react-native-reanimated";

export const SCREEN_H = 20;

export interface IntelligenceHeaderProps {
  activeTab?: MainTab;
  onChangeTab?: (t: MainTab) => boolean | void;
  onMeasureTab?: (index: number, centerX: number) => void;
  pageProgress?: SharedValue<number>;
  onOpenCsvWorkspace?: () => boolean | void;
  csvWorkspaceSelected?: boolean;
  onProfile?: () => void;
  onSettings?: () => void;
  onNotifications?: () => void;
  onHelp?: () => void;
  onLogout?: () => void;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

function MenuRow({ icon: Icon, label, danger, onPress }: { icon: any; label: string; danger?: boolean; onPress: () => void }) {
  return (
    <XStack
      minHeight={48}
      alignItems="center"
      gap={12}
      paddingVertical={11}
      paddingHorizontal={14}
      pressStyle={{ backgroundColor: "$surfaceAlt", opacity: 0.84 }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Icon size={18} color={danger ? "$danger" : "$navy2"} strokeWidth={2} />
      <Text fontSize={14.5} fontWeight="600" color={danger ? "$danger" : "$navy"}>
        {label}
      </Text>
    </XStack>
  );
}

export function IntelligenceHeader({
  activeTab,
  onChangeTab,
  onMeasureTab,
  pageProgress,
  onOpenCsvWorkspace,
  csvWorkspaceSelected = false,
  onProfile,
  onSettings,
  onNotifications,
  onHelp,
  onLogout,
  title,
  subtitle,
  onBack,
}: IntelligenceHeaderProps) {
  const insets = useSafeAreaInsets();
  const pushed = Boolean(onBack);
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => {
    void Haptics.selectionAsync();
    setMenuOpen(true);
  };
  const openCsvWorkspace = () => {
    const accepted = onOpenCsvWorkspace?.();
    if (accepted !== false) void Haptics.selectionAsync();
  };
  const pick = (action?: () => void) => () => {
    setMenuOpen(false);
    action?.();
  };

  return (
    <YStack>
      <LinearGradient colors={headerGradient as unknown as [string, string, string]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={FILL} />
      <View position="absolute" top={-40} right={-30} width={220} height={180} borderRadius={110} backgroundColor="rgba(255,255,255,0.10)" />

      <YStack paddingTop={insets.top + 14} paddingHorizontal={SCREEN_H} paddingBottom={12}>
        {pushed ? (
          <YStack alignItems="center" justifyContent="center" height={42}>
            <View
              position="absolute"
              left={0}
              width={42}
              height={42}
              borderRadius={21}
              backgroundColor="rgba(255,255,255,0.16)"
              alignItems="center"
              justifyContent="center"
              pressStyle={{ scale: 0.92 }}
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ChevronLeft size={22} color="white" />
            </View>
            <Text color="white" fontSize={17} fontWeight="800" letterSpacing={-0.2}>
              {title}
            </Text>
          </YStack>
        ) : (
          <XStack alignItems="center" justifyContent="space-between" gap={14}>
            <Wordmark />
            <XStack alignItems="center" gap={9}>
              {onOpenCsvWorkspace ? (
                <XStack
                  minWidth={68}
                  minHeight={44}
                  height={44}
                  paddingHorizontal={12}
                  borderRadius={15}
                  backgroundColor={csvWorkspaceSelected ? "white" : "rgba(255,255,255,0.16)"}
                  borderWidth={1}
                  borderColor={csvWorkspaceSelected ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.24)"}
                  alignItems="center"
                  justifyContent="center"
                  gap={6}
                  pressStyle={{ scale: 0.96, opacity: 0.84 }}
                  onPress={openCsvWorkspace}
                  accessibilityRole="button"
                  accessibilityLabel="Open CSV insights workspace"
                  accessibilityState={{ selected: csvWorkspaceSelected }}
                >
                  <FileSpreadsheet
                    size={17}
                    color={csvWorkspaceSelected ? "$red" : "white"}
                    strokeWidth={2.2}
                  />
                  <Text
                    color={csvWorkspaceSelected ? "$navy" : "white"}
                    fontSize={11.5}
                    fontWeight="900"
                    letterSpacing={0.45}
                  >
                    CSV
                  </Text>
                </XStack>
              ) : null}
              <View
                width={44}
                height={44}
                borderRadius={22}
                backgroundColor="rgba(255,255,255,0.16)"
                borderWidth={1}
                borderColor="rgba(255,255,255,0.24)"
                alignItems="center"
                justifyContent="center"
                pressStyle={{ scale: 0.92, opacity: 0.85 }}
                onPress={openMenu}
                accessibilityRole="button"
                accessibilityLabel="Open account menu"
                accessibilityState={{ expanded: menuOpen }}
              >
                <UserRound size={20} color="white" strokeWidth={2} />
              </View>
            </XStack>
          </XStack>
        )}

        {!pushed && activeTab && onChangeTab ? (
          <>
            <View height={30} />
            <HeaderNavigation
              active={activeTab}
              onChange={onChangeTab}
              pageProgress={pageProgress}
              rowOffsetX={SCREEN_H}
              onMeasure={onMeasureTab}
            />
          </>
        ) : !pushed && subtitle ? (
          <>
            <View height={22} />
            <Text color="rgba(255,255,255,0.86)" fontSize={13} fontWeight="600">
              {subtitle}
            </Text>
          </>
        ) : null}
      </YStack>

      <Modal visible={menuOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(11,18,32,0.18)" }}
          onPress={() => setMenuOpen(false)}
          accessibilityViewIsModal
        >
          <View
            position="absolute"
            top={insets.top + 62}
            right={SCREEN_H}
            width={224}
            backgroundColor="$backgroundStrong"
            borderRadius={16}
            borderWidth={1}
            borderColor="$borderColor"
            paddingVertical={6}
            shadowColor="#0B1220"
            shadowOffset={{ width: 0, height: 12 }}
            shadowOpacity={0.16}
            shadowRadius={24}
          >
            <MenuRow icon={UserRound} label="Profile" onPress={pick(onProfile)} />
            <MenuRow icon={Settings} label="Settings" onPress={pick(onSettings)} />
            <MenuRow icon={Bell} label="Notifications" onPress={pick(onNotifications)} />
            <MenuRow icon={LifeBuoy} label="Help & Support" onPress={pick(onHelp)} />
            <View height={1} backgroundColor="$borderColor" marginVertical={4} />
            <MenuRow icon={LogOut} label="Log out" danger onPress={pick(onLogout)} />
          </View>
        </Pressable>
      </Modal>
    </YStack>
  );
}
