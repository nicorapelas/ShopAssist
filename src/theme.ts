export type ShopAssistTheme = 'cognipos'

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

/** InvoiceGo / site tokens — one look for the shop phone. */
export const COGNIPOS_COLORS: ShopAssistColors = {
  bg: '#f4f7f6',
  panel: '#ffffff',
  border: '#e2e8f0',
  borderWidth: 1,
  text: '#0f172a',
  muted: '#64748b',
  primary: '#0f766e',
  primaryText: '#ffffff',
  danger: '#b91c1c',
  success: '#15803d',
  inputBg: '#ffffff',
}

export const colors = COGNIPOS_COLORS

/** InvoiceGo aliases used by ported invoice screens. */
export const invoiceColors = {
  bg: COGNIPOS_COLORS.bg,
  panel: COGNIPOS_COLORS.panel,
  text: COGNIPOS_COLORS.text,
  muted: COGNIPOS_COLORS.muted,
  border: COGNIPOS_COLORS.border,
  brand: COGNIPOS_COLORS.primary,
  brandDark: '#115e59',
  danger: COGNIPOS_COLORS.danger,
  success: '#047857',
}
