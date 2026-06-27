import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SHOP_ASSIST_THEMES, type ShopAssistColors, type ShopAssistTheme } from './theme'

const THEME_KEY = 'shopassist-theme-v1'

type ShopAssistThemeContextValue = {
  theme: ShopAssistTheme
  colors: ShopAssistColors
  setTheme: (theme: ShopAssistTheme) => void
}

const ShopAssistThemeContext = createContext<ShopAssistThemeContextValue | null>(null)

function isTheme(value: string | null): value is ShopAssistTheme {
  return (
    value === 'dark' ||
    value === 'light' ||
    value === 'ubuntu' ||
    value === 'elon' ||
    value === 'lego' ||
    value === 'jacobs' ||
    value === 'cosmic'
  )
}

export function ShopAssistThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ShopAssistTheme>('light')

  useEffect(() => {
    void (async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY)
      if (isTheme(stored)) setThemeState(stored)
    })()
  }, [])

  const setTheme = useCallback((next: ShopAssistTheme) => {
    setThemeState(next)
    void AsyncStorage.setItem(THEME_KEY, next)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      colors: SHOP_ASSIST_THEMES[theme],
      setTheme,
    }),
    [setTheme, theme],
  )

  return <ShopAssistThemeContext.Provider value={value}>{children}</ShopAssistThemeContext.Provider>
}

export function useShopAssistTheme() {
  const ctx = useContext(ShopAssistThemeContext)
  if (!ctx) throw new Error('useShopAssistTheme must be used within ShopAssistThemeProvider')
  return ctx
}
