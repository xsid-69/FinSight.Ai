import React from "react";
import { XStack, Text } from "tamagui";
import {
  splitAmount,
  currencySymbol,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "../../constants/typography";

export interface MoneyProps {
  amount: number;
  currency?: CurrencyCode;
  /** Font size of the integer part (px). Decimals scale from it (~0.62). */
  size?: number;
  weight?: "500" | "600" | "700" | "800";
  /** credit = green with leading +, debit = ink, none = ink no sign. */
  kind?: "credit" | "debit" | "none";
  /** Override the main color (symbol + integer). */
  color?: string;
  /** Override the decimals color (defaults to muted, or soft-green for credit). */
  decColor?: string;
  /** Show an explicit sign: `+` for credit, `−` for debit. */
  signed?: boolean;
}

/**
 * ₹ symbol + integer (Indian-grouped) + smaller muted decimals, baseline
 * aligned. Matches the reference money typography:
 * `.money .dec { font-size:.62em; color:var(--t-2); font-weight:700 }`.
 */
export function Money({
  amount,
  currency = DEFAULT_CURRENCY,
  size = 16,
  weight = "800",
  kind = "debit",
  color,
  decColor,
  signed = false,
}: MoneyProps) {
  const { int, dec } = splitAmount(amount, currency);
  const isCredit = kind === "credit";
  const mainColor = color ?? (isCredit ? "$success" : "$navy");
  const decCol = decColor ?? (isCredit ? "$success" : "$muted");
  const sign = isCredit ? "+" : signed && kind === "debit" ? "\u2212" : "";

  return (
    <XStack alignItems="flex-end">
      <Text fontSize={size} fontWeight={weight} color={mainColor as any} letterSpacing={-0.3}>
        {sign}
        {currencySymbol(currency)}
        {int}
      </Text>
      <Text
        fontSize={Math.round(size * 0.62)}
        fontWeight="700"
        color={decCol as any}
        marginBottom={Math.round(size * 0.05)}
      >
        .{dec}
      </Text>
    </XStack>
  );
}
