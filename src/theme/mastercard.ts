export const brandColors = {
  redIdentity: "#EB001B",
  redAction: "#C90018",
  redPressed: "#A80014",
  redSoft: "#FFE9EB",
  redWash: "#FFF4F5",
  orange: "#FF5F00",
  orangeDeep: "#963800",
  orangeSoft: "#FFF0E8",
  gold: "#F79E1B",
  goldDeep: "#765000",
  goldSoft: "#FFF7E3",
  charcoal: "#171717",
  charcoalRaised: "#242321",
  charcoalSoft: "#34312E",
  textSecondary: "#4F4C48",
  textMuted: "#625E59",
  canvas: "#F8F8F6",
  surface: "#FFFFFF",
  surfaceSoft: "#F2F1EE",
  border: "#E3E1DC",
  borderStrong: "#CFCCC5",
  success: "#2E7D32",
  successSoft: "#EDF7EF",
  warning: "#805500",
  warningSoft: "#FFF7E3",
  danger: "#C62828",
  dangerSoft: "#FFF0F1",
  white: "#FFFFFF",
} as const;

export const brandGradients = {
  header: [brandColors.redAction, brandColors.redIdentity, brandColors.redPressed],
  primary: [brandColors.redIdentity, brandColors.redPressed],
  warm: [brandColors.orange, brandColors.gold],
  charcoal: [brandColors.charcoalRaised, brandColors.charcoal],
  intelligence: [brandColors.charcoalRaised, brandColors.redAction],
} as const;

export const brandOverlays = {
  onBrand08: "rgba(255,255,255,0.08)",
  onBrand12: "rgba(255,255,255,0.12)",
  onBrand18: "rgba(255,255,255,0.18)",
  onBrand24: "rgba(255,255,255,0.24)",
  red08: "rgba(235,0,27,0.08)",
  red12: "rgba(235,0,27,0.12)",
  orange14: "rgba(255,95,0,0.14)",
  charcoal06: "rgba(23,23,23,0.06)",
  charcoal12: "rgba(23,23,23,0.12)",
  scrim: "rgba(23,23,23,0.34)",
} as const;

export const typeScale = {
  caption: { fontSize: 11, lineHeight: 16 },
  meta: { fontSize: 12, lineHeight: 17 },
  label: { fontSize: 14, lineHeight: 20 },
  body: { fontSize: 16, lineHeight: 24 },
  title3: { fontSize: 18, lineHeight: 24 },
  title2: { fontSize: 22, lineHeight: 28 },
  title1: { fontSize: 28, lineHeight: 34 },
  money: { fontSize: 28, lineHeight: 34 },
} as const;

export const motionDurations = {
  instant: 1,
  fast: 160,
  standard: 220,
  deliberate: 320,
} as const;
