import React, { useState } from "react";
import { Modal, Pressable } from "react-native";
import { YStack, XStack, Text, View } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, UserRound, Settings, Bell, LifeBuoy, LogOut } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";
import { headerGradient } from "../../constants/colors";
import { Wordmark } from "./Wordmark";
import { HeaderNavigation, type MainTab } from "./HeaderNavigation";

export const SCREEN_H = 20;

export interface IntelligenceHeaderProps {
  activeTab?: MainTab;
  onChangeTab?: (t: MainTab) => void;
  onMeasureTab?: (index: number, centerX: number) => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
  /** Pushed-screen mode: back button + centered title. */
  title?: string;
  subtitle?: string;
  onBack?: () => void;
}

const FILL = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const;

function MenuRow({ icon: Icon, label, danger, onPress }: { icon: any; label: string; danger?: boolean; onPress: () => void }) {
  return (
    <XStack alignItems="center" gap={12} paddingVertical={11} paddingHorizontal={14} pressStyle={{ backgroundColor: "$surfaceAlt" }} onPress={onPress}>
      <Icon size={18} color={danger ? "$danger" : "$navy2"} strokeWidth={2} />
      <Text fontSize={14.5} fontWeight="600" color={danger ? "$danger" : "$navy"}>
        {label}
      </Text>
    </XStack>
  );
}

/**
 * Red intelligence header: FInsightAI wordmark + profile menu, with an optional
 * section control row. Pushed screens render a back button + title instead.
 */
export function IntelligenceHeader({
  activeTab,
  onChangeTab,
  onMeasureTab,
  onProfile,
  onSettings,
  onLogout,
  title,
  subtitle,
  onBack,
}: IntelligenceHeaderProps) {
  const insets = useSafeAreaInsets();
  const pushed = !!onBack;
  const [menuOpen, setMenuOpen] = useState(false);

  const openMenu = () => {
    Haptics.selectionAsync();
    setMenuOpen(true);
  };
  const pick = (fn?: () => void) => () => {
    setMenuOpen(false);
    fn?.();
  };

  return (
    <YStack>
      <LinearGradient colors={headerGradient as unknown as [string, string, string]} start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }} style={FILL} />
      <View position="absolute" top={-40} right={-30} width={220} height={180} borderRadius={110} backgroundColor="rgba(255,255,255,0.10)" />

      <YStack paddingTop={insets.top + 14} paddingHorizontal={SCREEN_H} paddingBottom={12}>
        {pushed ? (
          <YStack alignItems="center" justifyContent="center" height={42}>
            <View position="absolute" left={0} width={42} height={42} borderRadius={21} backgroundColor="rgba(255,255,255,0.16)" alignItems="center" justifyContent="center" pressStyle={{ scale: 0.92 }} onPress={onBack}>
              <ChevronLeft size={22} color="white" />
            </View>
            <Text color="white" fontSize={17} fontWeight="800" letterSpacing={-0.2}>
              {title}
            </Text>
          </YStack>
        ) : (
          <XStack alignItems="center" justifyContent="space-between">
            <Wordmark />
            <View width={42} height={42} borderRadius={21} backgroundColor="rgba(255,255,255,0.16)" borderWidth={1} borderColor="rgba(255,255,255,0.22)" alignItems="center" justifyContent="center" pressStyle={{ scale: 0.92, opacity: 0.85 }} onPress={openMenu}>
              <UserRound size={20} color="white" strokeWidth={2} />
            </View>
          </XStack>
        )}

        {!pushed && activeTab && onChangeTab ? (
          <>
            <View height={38} />
            <HeaderNavigation active={activeTab} onChange={onChangeTab} rowOffsetX={SCREEN_H} onMeasure={onMeasureTab} />
          </>
        ) : !pushed && subtitle ? (
          <>
            <View height={22} />
            <Text color="rgba(255,255,255,0.82)" fontSize={13} fontWeight="500">
              {subtitle}
            </Text>
          </>
        ) : null}
      </YStack>

      {/* profile dropdown menu */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuOpen(false)}>
          <View position="absolute" top={insets.top + 62} right={SCREEN_H} width={216} backgroundColor="$backgroundStrong" borderRadius={16} borderWidth={1} borderColor="$borderColor" paddingVertical={6} shadowColor="#0B1220" shadowOffset={{ width: 0, height: 12 }} shadowOpacity={0.16} shadowRadius={24}>
            <MenuRow icon={UserRound} label="Profile" onPress={pick(onProfile)} />
            <MenuRow icon={Settings} label="Settings" onPress={pick(onSettings)} />
            <MenuRow icon={Bell} label="Notifications" onPress={pick(onSettings)} />
            <MenuRow icon={LifeBuoy} label="Help & Support" onPress={pick(onSettings)} />
            <View height={1} backgroundColor="$borderColor" marginVertical={4} />
            <MenuRow icon={LogOut} label="Log out" danger onPress={pick(onLogout)} />
          </View>
        </Pressable>
      </Modal>
    </YStack>
  );
}
