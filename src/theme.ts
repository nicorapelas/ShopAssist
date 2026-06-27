export type ShopAssistTheme = 'dark' | 'light' | 'ubuntu' | 'elon' | 'lego' | 'jacobs' | 'cosmic'

export type ShopAssistColors = {
  bg: string
  panel: string
  border: string
  borderWidth: number
  text: string
  muted: string
  primary: string
  primaryText: string
  danger: string
  success: string
  inputBg: string
}

export const SHOP_ASSIST_THEME_OPTIONS: { id: ShopAssistTheme; label: string; hint: string }[] = [
  { id: 'dark', label: 'Dark', hint: 'Low-glare shop floor theme' },
  { id: 'light', label: 'Light', hint: 'Softer, brighter colours' },
  { id: 'ubuntu', label: 'Ubuntu', hint: 'Violet, teal, and coral accents' },
  { id: 'elon', label: 'Elon', hint: 'Old Glory blue & red - bold, minimal white' },
  { id: 'lego', label: 'Bricks', hint: 'Classic toy-brick reds, yellows & blues' },
  { id: 'jacobs', label: 'Jacobs', hint: 'Jacobs blue with a light workspace' },
  { id: 'cosmic', label: 'Cosmic', hint: 'Pop!_OS Cosmic — charcoal with cyan accents' },
]

export const SHOP_ASSIST_THEMES: Record<ShopAssistTheme, ShopAssistColors> = {
  light: {
    bg: '#dbcfb4',
    panel: '#dbcfb4',
    border: '#8a7a60',
    borderWidth: 3,
    text: '#08090d',
    muted: '#2f352f',
    primary: '#0909e8',
    primaryText: '#ffffff',
    danger: '#dc2626',
    success: '#15803d',
    inputBg: '#dbcfb4',
  },
  dark: {
    bg: '#0f172a',
    panel: '#111827',
    border: '#334155',
    borderWidth: 1,
    text: '#f8fafc',
    muted: '#94a3b8',
    primary: '#6366f1',
    primaryText: '#ffffff',
    danger: '#f87171',
    success: '#34d399',
    inputBg: '#020617',
  },
  ubuntu: {
    bg: '#24192f',
    panel: '#2f2140',
    border: '#5b3b72',
    borderWidth: 1,
    text: '#fff7ed',
    muted: '#d6bcfa',
    primary: '#e95420',
    primaryText: '#ffffff',
    danger: '#ef4444',
    success: '#2dd4bf',
    inputBg: '#1f1530',
  },
  elon: {
    bg: '#0a1628',
    panel: '#0f172a',
    border: '#3c3b6e',
    borderWidth: 1,
    text: '#e2e8f0',
    muted: '#94a3b8',
    primary: '#1d4ed8',
    primaryText: '#ffffff',
    danger: '#b91c1c',
    success: '#34d399',
    inputBg: '#020617',
  },
  lego: {
    bg: '#101827',
    panel: '#172033',
    border: '#334155',
    borderWidth: 1,
    text: '#fff7ed',
    muted: '#cbd5e1',
    primary: '#facc15',
    primaryText: '#111827',
    danger: '#ef4444',
    success: '#22c55e',
    inputBg: '#0f172a',
  },
  jacobs: {
    bg: '#eef4ff',
    panel: '#ffffff',
    border: '#c7d7f2',
    borderWidth: 1,
    text: '#10233f',
    muted: '#58708f',
    primary: '#0909e8',
    primaryText: '#ffffff',
    danger: '#dc2626',
    success: '#15803d',
    inputBg: '#ffffff',
  },
  cosmic: {
    bg: '#161616',
    panel: '#262626',
    border: '#484848',
    borderWidth: 1,
    text: '#dedede',
    muted: '#9e9e9e',
    primary: '#63d0df',
    primaryText: '#030303',
    danger: '#fda1a0',
    success: '#92cf9c',
    inputBg: '#1b1b1b',
  },
} as const

/** Default light workspace theme for legacy static styles. */
export const colors = SHOP_ASSIST_THEMES.light
