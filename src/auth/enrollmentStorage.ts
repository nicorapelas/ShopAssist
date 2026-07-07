import * as SecureStore from 'expo-secure-store'

const TOKEN = 'shopassist-device-token'
const ENDPOINT = 'shopassist-enrolled-endpoint'

export interface StoredEnrollment {
  deviceToken: string
  storeEndpoint: string
}

export async function loadEnrollment(): Promise<StoredEnrollment | null> {
  const deviceToken = await SecureStore.getItemAsync(TOKEN)
  const storeEndpoint = await SecureStore.getItemAsync(ENDPOINT)
  if (!deviceToken?.trim() || !storeEndpoint?.trim()) return null
  return {
    deviceToken: deviceToken.trim(),
    storeEndpoint: storeEndpoint.trim().replace(/\/$/, ''),
  }
}

export async function saveEnrollment(enrollment: StoredEnrollment): Promise<void> {
  await SecureStore.setItemAsync(TOKEN, enrollment.deviceToken.trim())
  await SecureStore.setItemAsync(ENDPOINT, enrollment.storeEndpoint.trim().replace(/\/$/, ''))
}

export async function clearEnrollment(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN)
  await SecureStore.deleteItemAsync(ENDPOINT)
}

export async function enrollmentMatchesApiBase(apiBase: string | null): Promise<boolean> {
  if (!apiBase) return false
  const enrollment = await loadEnrollment()
  if (!enrollment) return false
  return enrollment.storeEndpoint === apiBase.trim().replace(/\/$/, '')
}
