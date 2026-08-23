import React, { useState } from "react";
import { ScrollView, XStack, YStack, Text, View, Input } from "tamagui";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Wallet, Briefcase, PiggyBank, CreditCard, Search, SlidersHorizontal, ChevronDown } from "@tamagui/lucide-icons";
import * as Haptics from "expo-haptics";

import { IconSquare, type LucideIcon } from "../../components/IconSquare";
import { Money } from "../../components/banking/Money";
import { AnalyzedTransactionRow, LiveDot, Card } from "../../components/finsight";
import { TRANSACTION_DAYS } from "../../data/intelligence";

const PAGE_H = 20;
const DOCK_CLEARANCE = 140;

const CATS: LucideIcon[] = [Wallet, Briefcase, PiggyBank, CreditCard];

function CategoryIcons() {
  const [active, setActive] = useState(0);
  return (
    <XStack gap={12}>
      {CATS.map((Icon, i) => {
        const on = i === active;
        return (
          <View
            key={i}
            pressStyle={{ scale: 0.94 }}
            onPress={() => {
              Haptics.selectionAsync();
              setActive(i);
            }}
          >
            {on ? (
              <IconSquare icon={Icon} gradient size={56} radius={18} iconStrokeWidth={2} />
            ) : (
              <IconSquare icon={Icon} color="$surfaceAlt" iconColor="$red" size={56} radius={18} iconStrokeWidth={2} />
            )}
          </View>
        );
      })}
    </XStack>
  );
}

function SearchRow() {
  return (
    <XStack gap={12} alignItems="center">
      <XStack flex={1} alignItems="center" gap={10} height={48} paddingHorizontal={16} borderRadius={16} backgroundColor="$surfaceAlt">
        <Search size={18} color="$secondary" strokeWidth={2} />
        <Input flex={1} unstyled placeholder="Search" placeholderTextColor="$secondary" fontSize={14.5} color="$navy" padding={0} />
      </XStack>
      <View width={48} height={48} borderRadius={16} backgroundColor="$surfaceAlt" alignItems="center" justifyContent="center" pressStyle={{ scale: 0.94 }} onPress={() => Haptics.selectionAsync()}>
        <SlidersHorizontal size={19} color="$secondary" strokeWidth={2} />
      </View>
    </XStack>
  );
}

function PendingCard() {
  return (
    <Card paddingVertical={14} paddingHorizontal={16}>
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontSize={13} color="$secondary" fontWeight="600">
          Pending transactions (2)
        </Text>
        <XStack alignItems="center" gap={6}>
          <Money amount={1857.28} currency="INR" size={15} weight="800" />
          <ChevronDown size={15} color="$muted" strokeWidth={2} />
        </XStack>
      </XStack>
    </Card>
  );
}

export function TransactionsContent() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingHorizontal: PAGE_H, paddingBottom: insets.bottom + DOCK_CLEARANCE }}>
      <XStack justifyContent="flex-end" marginBottom={10}>
        <LiveDot />
      </XStack>

      <CategoryIcons />

      <YStack marginTop={18}>
        <SearchRow />
      </YStack>

      <YStack marginTop={16}>
        <PendingCard />
      </YStack>

      {TRANSACTION_DAYS.map((day) => (
        <YStack key={day.id}>
          <Text fontSize={12.5} fontWeight="700" color="$muted" marginTop={20} marginBottom={2} letterSpacing={0.2}>
            {day.label}
          </Text>
          {day.items.map((t, i) => (
            <MotiView key={t.id} from={{ opacity: 0, translateY: 6 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 240, delay: i * 45 }}>
              <AnalyzedTransactionRow txn={t} showSeparator={i < day.items.length - 1} />
            </MotiView>
          ))}
        </YStack>
      ))}
    </ScrollView>
  );
}
