import type { ShopAssistTheme } from '../theme'

const AUTH_LOGO_LIGHT = require('../../assets/images/logo-SA_Port-light.png')
const AUTH_LOGO_DARK = require('../../assets/images/logo-text_bottom1-dark.png')

export function isDarkShopAssistTheme(theme: ShopAssistTheme): boolean {
  return (
    theme === 'dark' ||
    theme === 'ubuntu' ||
    theme === 'elon' ||
    theme === 'lego' ||
    theme === 'cosmic'
  )
}

export function authScreenLogoSource(theme: ShopAssistTheme) {
  return isDarkShopAssistTheme(theme) ? AUTH_LOGO_DARK : AUTH_LOGO_LIGHT
}

/** Portrait auth screens — dark wordmark is slightly wider. */
export function authScreenLogoSize(theme: ShopAssistTheme, compact: boolean) {
  if (isDarkShopAssistTheme(theme)) {
    return compact ? { width: 160, height: 80 } : { width: 280, height: 140 }
  }
  return compact ? { width: 90, height: 117 } : { width: 180, height: 234 }
}
