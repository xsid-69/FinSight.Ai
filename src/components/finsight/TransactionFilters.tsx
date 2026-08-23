import React from "react";
import { ScrollView } from "react-native";
import { XStack, Text, View } from "tamagui";
import * as Haptics from "expo-haptics";
import { CATEGORY_FILTERS } from "../../data/intelligence";

export interface TransactionFiltersProps {
  active: string;
  onChange: (id: string) => void;
}

/** Compact horizontally-scrolling category chips. */
export function TransactionFilters({ active, onChange }: TransactionFiltersProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
      {CATEGORY_FILTERS.map((c) => {
        const on = c.id === active;
        const Icon = c.icon;
        return (
          <XStack
            key={c.id}
            alignItems="center"
            gap={6}
            height={36}
            paddingHorizontal={14}
            borderRadius={999}
            backgroundColor={on ? "$red" : "$backgroundStrong"}
            borderWidth={1}
            borderColor={on ? "$red" : "$borderColor"}
            pressStyle={{ scale: 0.96 }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(c.id);
            }}
          >
            <Icon size={14} color={on ? "white" : "$secondary"} strokeWidth={2} />
            <Text fontSize={12.5} fontWeight={on ? "800" : "600"} color={on ? "white" : "$navy2"}>
              {c.label}
            </Text>
          </XStack>
        );
      })}
    </ScrollView>
  );
}
