import { createContext, useContext, type ReactNode } from 'react'
import { COGNIPOS_COLORS, type ShopAssistColors, type ShopAssistTheme } from './theme'

type ShopAssistThemeContextValue = {
  theme: ShopAssistTheme
  colors: ShopAssistColors
}

const ShopAssistThemeContext = createContext<ShopAssistThemeContextValue | null>(null)

const THEME_VALUE: ShopAssistThemeContextValue = {
  theme: 'cognipos',
  colors: COGNIPOS_COLORS,
}

export function ShopAssistThemeProvider({ children }: { children: ReactNode }) {
  return <ShopAssistThemeContext.Provider value={THEME_VALUE}>{children}</ShopAssistThemeContext.Provider>
}

export function useShopAssistTheme() {
  const ctx = useContext(ShopAssistThemeContext)
  if (!ctx) throw new Error('useShopAssistTheme must be used within ShopAssistThemeProvider')
  return ctx
}
