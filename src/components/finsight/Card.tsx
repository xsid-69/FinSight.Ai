import React from "react";
import { YStack, type YStackProps } from "tamagui";

export interface CardProps extends YStackProps {
  children: React.ReactNode;
}

/** Consistent white surface: soft radius, hairline border, very subtle shadow. */
export function Card({ children, ...rest }: CardProps) {
  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderRadius="$lg"
      borderWidth={1}
      borderColor="rgba(24,35,61,0.05)"
      padding={18}
      shadowColor="#0B1220"
      shadowOffset={{ width: 0, height: 8 }}
      shadowOpacity={0.05}
      shadowRadius={16}
      {...rest}
    >
      {children}
    </YStack>
  );
}
