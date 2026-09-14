/**
 * FInsightAI — Financial Intelligence palette.
 * Red is dominant only in the header/accent system; the dashboard body is
 * calm light-grey + white with navy typography and a sparing AI purple.
 */
export const palette = {
  // Red / accent system — Mastercard red is the dominant brand color.
  red: "#EB001B", // Mastercard red (primary/main)
  accent: "#FF3B47", // brighter red for gradient highlights / active states
  redDeep: "#B00016", // deep red for gradients / pressed

  // Navy typography
  navy: "#18233D", // primary text
  navy2: "#39435C", // secondary navy
  ink2: "#687187", // secondary text
  muted: "#626B80", // accessible muted labels
  muted2: "#687187", // quiet text that remains AA-readable

  // Surfaces
  background: "#F7F8FA",
  surface: "#FFFFFF",
  border: "#ECEEF2",
  borderStrong: "#E1E4EA",

  // Semantic
  success: "#63A64A",
  warning: "#D79A35",
  danger: "#D64545",

  // AI intelligence accent (used sparingly)
  ai: "#7C6CF2",
  aiSoft: "#EFEDFD",

  white: "#FFFFFF",
} as const;

/**
 * Mastercard-inspired header gradient: a subtle warm-red top glow melting into
 * the core Mastercard red and a deep red base. Warmth is minimal (no yellow).
 */
export const headerGradient = ["#FF4E20", palette.red, palette.redDeep] as const;

/** Primary action gradient (used on the floating AI button + CTAs). */
export const redGradient = [palette.accent, palette.redDeep] as const;

/** AI accent gradient (assistant / intelligence surfaces). */
export const aiGradient = ["#8E7BFF", "#6B5AE0"] as const;

/** Diagonal-ish gradient direction approximating the reference angles. */
export const gradientStart = { x: 0.1, y: 0 } as const;
export const gradientEnd = { x: 0.9, y: 1 } as const;

export type PaletteKey = keyof typeof palette;
