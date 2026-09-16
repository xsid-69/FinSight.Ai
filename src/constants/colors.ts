import { brandColors, brandGradients, brandOverlays } from "../theme/mastercard";

export const palette = {
  red: brandColors.redIdentity,
  accent: brandColors.redIdentity,
  redDeep: brandColors.redPressed,
  redSoft: brandColors.redSoft,
  orange: brandColors.orange,
  orangeDeep: brandColors.orangeDeep,
  orangeSoft: brandColors.orangeSoft,
  gold: brandColors.gold,
  goldDeep: brandColors.goldDeep,
  goldSoft: brandColors.goldSoft,
  charcoal: brandColors.charcoal,
  charcoalRaised: brandColors.charcoalRaised,
  navy: brandColors.charcoal,
  navy2: brandColors.textSecondary,
  ink2: brandColors.textMuted,
  muted: brandColors.textSecondary,
  muted2: brandColors.textMuted,
  background: brandColors.canvas,
  surface: brandColors.surface,
  surfaceAlt: brandColors.surfaceSoft,
  border: brandColors.border,
  borderStrong: brandColors.borderStrong,
  success: brandColors.success,
  warning: brandColors.warning,
  danger: brandColors.danger,
  ai: brandColors.orangeDeep,
  aiSoft: brandColors.orangeSoft,
  white: brandColors.white,
} as const;

export const headerGradient = brandGradients.header;
export const redGradient = brandGradients.primary;
export const warmGradient = brandGradients.warm;
export const charcoalGradient = brandGradients.charcoal;
export const aiGradient = brandGradients.intelligence;
export const overlays = brandOverlays;

export const gradientStart = { x: 0.1, y: 0 } as const;
export const gradientEnd = { x: 0.9, y: 1 } as const;

export type PaletteKey = keyof typeof palette;
