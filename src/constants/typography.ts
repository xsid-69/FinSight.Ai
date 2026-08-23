/**
 * Money formatting helpers. Reference (mockups/finsight-mockups.html) uses
 * the Indian Rupee ₹ as a PREFIX symbol with Indian lakh grouping
 * (e.g. ₹1,75,160.03) and 2 decimals rendered smaller + muted.
 */

export type CurrencyCode = "INR" | "USD" | "EUR";

const SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

/** Currency symbol for a code (defaults to ₹). */
export function currencySymbol(code: CurrencyCode = "INR"): string {
  return SYMBOLS[code] ?? "₹";
}

/**
 * Split a number into a grouped integer part + 2-decimal part.
 * INR uses Indian (lakh) grouping; other currencies use standard grouping.
 */
export function splitAmount(
  value: number,
  currency: CurrencyCode = "INR"
): { int: string; dec: string } {
  const fixed = Math.abs(value).toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const locale = currency === "INR" ? "en-IN" : "en-US";
  const intFormatted = Number(intPart).toLocaleString(locale);
  return { int: intFormatted, dec: decPart };
}

/** Compact whole-number formatter (no decimals), used for budget captions. */
export function formatWhole(value: number, currency: CurrencyCode = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return `${currencySymbol(currency)}${Math.round(value).toLocaleString(locale)}`;
}

export const DEFAULT_CURRENCY: CurrencyCode = "INR";
