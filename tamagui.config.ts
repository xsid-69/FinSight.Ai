import { createTamagui, createTokens } from 'tamagui'
import { config as configBase } from '@tamagui/config/v3'

/**
 * FInsightAI design tokens — Financial Intelligence system.
 * Centralized color / radius / space scales. Components reference `$token`
 * rather than scattering raw hex values.
 */
const tokens = createTokens({
  ...configBase.tokens,
  color: {
    ...configBase.tokens.color,
    red: '#EB001B',
    accent: '#FF3B47',
    redDeep: '#B00016',
    navy: '#18233D',
    navy2: '#39435C',
    ink2: '#687187',
    secondary: '#626B80',
    muted: '#687187',
    border: '#ECEEF2',
    borderStrong: '#E1E4EA',
    success: '#63A64A',
    warning: '#D79A35',
    danger: '#D64545',
    ai: '#7C6CF2',
    aiSoft: '#EFEDFD',
    pageBg: '#F7F8FA',
    cardBg: '#FFFFFF',
    surfaceAlt: '#F2F4F7',
  },
  radius: {
    ...configBase.tokens.radius,
    xs: 10,
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28,
    dock: 34,
    icon: 13,
    card: 20,
    wave: 24,
    pill: 9999,
  },
  space: {
    ...configBase.tokens.space,
    screenH: 20,
    screenV: 20,
  },
})

const appConfig = createTamagui({
  ...configBase,
  tokens,
  themes: {
    ...configBase.themes,
    light: {
      ...configBase.themes.light,
      background: '#F7F8FA',
      backgroundStrong: '#FFFFFF',
      borderColor: '#ECEEF2',
      color: '#18233D',
      colorMuted: '#626B80',
      red: '#EB001B',
      accent: '#FF3B47',
      redDeep: '#B00016',
      navy: '#18233D',
      navy2: '#39435C',
      ink2: '#687187',
      secondary: '#626B80',
      muted: '#687187',
      success: '#63A64A',
      warning: '#D79A35',
      danger: '#D64545',
      ai: '#7C6CF2',
      aiSoft: '#EFEDFD',
      surfaceAlt: '#F2F4F7',
      // legacy aliases kept so untouched screens still resolve
      brandRed: '#EB001B',
      accentPink: '#FF3B47',
      pinkSoft: '#FFE9EB',
      positive: '#63A64A',
      line2: '#E1E4EA',
    },
    dark: {
      ...configBase.themes.dark,
      background: '#0B0D12',
      backgroundStrong: '#151821',
      borderColor: '#242833',
      color: '#F3F4F7',
      colorMuted: '#8A91A2',
      red: '#EB001B',
      accent: '#FF3B47',
      redDeep: '#B00016',
      navy: '#F3F4F7',
      navy2: '#C3C8D4',
      ink2: '#AAB0BE',
      secondary: '#8A91A2',
      muted: '#7C8290',
      success: '#63A64A',
      warning: '#D79A35',
      danger: '#D64545',
      ai: '#7C6CF2',
      aiSoft: '#221F3A',
      surfaceAlt: '#1C202B',
      brandRed: '#EB001B',
      accentPink: '#FF3B47',
      pinkSoft: '#3A1420',
      positive: '#63A64A',
      line2: '#242833',
    },
  },
})

export type AppConfig = typeof appConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig
