import * as SecureStore from 'expo-secure-store'
import type { AuthUser } from '../api/types'

const ACCESS = 'shopassist-access'
const REFRESH = 'shopassist-refresh'
const USER = 'shopassist-user'

export interface StoredSession {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export async function loadSession(): Promise<StoredSession | null> {
  const accessToken = await SecureStore.getItemAsync(ACCESS)
  const refreshToken = await SecureStore.getItemAsync(REFRESH)
  const userJson = await SecureStore.getItemAsync(USER)
  if (!accessToken || !refreshToken || !userJson) return null
  try {
    const user = JSON.parse(userJson) as AuthUser
    return { accessToken, refreshToken, user }
  } catch {
    return null
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(ACCESS, session.accessToken)
  await SecureStore.setItemAsync(REFRESH, session.refreshToken)
  await SecureStore.setItemAsync(USER, JSON.stringify(session.user))
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS)
  await SecureStore.deleteItemAsync(REFRESH)
  await SecureStore.deleteItemAsync(USER)
}
