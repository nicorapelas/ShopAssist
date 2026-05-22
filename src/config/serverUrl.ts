import * as SecureStore from 'expo-secure-store'

/** Cloudflare tunnel → Steve dev API (override in Server setup). */
export const DEFAULT_API_BASE = 'https://api-dev.jacobscycles.com/api'

const KEY = 'shopassist-api-base'

export async function getApiBaseUrl(): Promise<string | null> {
  const raw = await SecureStore.getItemAsync(KEY)
  if (!raw?.trim()) return null
  return raw.trim().replace(/\/$/, '')
}

export async function setApiBaseUrl(url: string): Promise<void> {
  const trimmed = url.trim().replace(/\/$/, '')
  if (!trimmed) {
    await SecureStore.deleteItemAsync(KEY)
    return
  }
  await SecureStore.setItemAsync(KEY, trimmed)
}

export function normalizeApiBaseInput(input: string): string {
  let s = input.trim().replace(/\/$/, '')
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s}`
  }
  if (!s.endsWith('/api')) {
    s = `${s}/api`
  }
  return s
}
