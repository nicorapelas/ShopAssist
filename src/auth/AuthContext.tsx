import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { apiFetch, configureApiAuth } from '../api/client'
import type { AuthResponse, AuthUser } from '../api/types'
import { getApiBaseUrl } from '../config/serverUrl'
import { canUseShopAssist } from '../permissions'
import { getOrCreateDeviceId } from './deviceId'
import {
  clearEnrollment,
  loadEnrollment,
  saveEnrollment,
  type StoredEnrollment,
} from './enrollmentStorage'
import { clearSession, loadSession, saveSession, type StoredSession } from './storage'

const SESSION_EXPIRY_GRACE_MS = 1000

export type EnrolledDevice = {
  deviceId: string
  storeEndpoint: string
  enrolledAt?: string
  label?: string
}

type AuthContextValue = {
  ready: boolean
  enrollment: StoredEnrollment | null
  session: StoredSession | null
  user: AuthUser | null
  enrollDevice: (email: string, password: string, label?: string) => Promise<void>
  loginBadge: (badgeCode: string) => Promise<void>
  loginPassword: (email: string, password: string) => Promise<void>
  logoutStaff: () => Promise<void>
  unbindDevice: (email: string, password: string) => Promise<void>
  resetStoreBinding: () => Promise<void>
  refreshEnrollment: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function jwtExpiryMs(token: string): number | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = JSON.parse(atob(padded)) as { exp?: number }
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null
  } catch {
    return null
  }
}

function deviceMeta() {
  const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? undefined
  return {
    platform: Platform.OS,
    appVersion: appVersion ? String(appVersion) : undefined,
  }
}

async function assertStaffSession(res: AuthResponse) {
  if (!canUseShopAssist(res.user)) {
    throw new Error('This account needs catalog.read or sales access.')
  }
  const bundle: StoredSession = {
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    user: res.user,
  }
  await saveSession(bundle)
  return bundle
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [enrollment, setEnrollment] = useState<StoredEnrollment | null>(null)
  const [session, setSession] = useState<StoredSession | null>(null)

  const applyEnrollment = useCallback((value: StoredEnrollment | null) => {
    setEnrollment(value)
  }, [])

  const applySession = useCallback((value: StoredSession | null) => {
    setSession(value)
  }, [])

  const refreshEnrollment = useCallback(async () => {
    const apiBase = await getApiBaseUrl()
    const stored = await loadEnrollment()
    if (!stored || !apiBase || stored.storeEndpoint !== apiBase.replace(/\/$/, '')) {
      if (stored) await clearEnrollment()
      applyEnrollment(null)
      return
    }
    applyEnrollment(stored)
  }, [applyEnrollment])

  useEffect(() => {
    void (async () => {
      const [storedEnrollment, storedSession] = await Promise.all([loadEnrollment(), loadSession()])
      const apiBase = await getApiBaseUrl()
      if (
        storedEnrollment &&
        apiBase &&
        storedEnrollment.storeEndpoint === apiBase.replace(/\/$/, '')
      ) {
        applyEnrollment(storedEnrollment)
      } else if (storedEnrollment) {
        await clearEnrollment()
      }
      applySession(storedSession)
      setReady(true)
    })()
  }, [applyEnrollment, applySession])

  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => session?.accessToken ?? null,
      getRefreshToken: () => session?.refreshToken ?? null,
      getDeviceToken: () => enrollment?.deviceToken ?? null,
      getStoreEndpoint: () => enrollment?.storeEndpoint ?? null,
      onTokensRefreshed: ({ accessToken, refreshToken }) => {
        setSession((prev) => {
          if (!prev) return prev
          const next = { ...prev, accessToken, refreshToken }
          void saveSession(next)
          return next
        })
      },
      onAuthFailed: () => {
        void clearSession()
        setSession(null)
      },
      onDeviceAuthFailed: () => {
        void clearEnrollment()
        setEnrollment(null)
      },
    })
  }, [session, enrollment])

  useEffect(() => {
    if (!session?.refreshToken) return
    const expiresAt = jwtExpiryMs(session.refreshToken)
    if (!expiresAt) return

    const delay = expiresAt - Date.now() + SESSION_EXPIRY_GRACE_MS
    if (delay <= 0) {
      void clearSession()
      setSession(null)
      return
    }

    const timer = setTimeout(() => {
      void clearSession()
      setSession(null)
    }, delay)
    return () => clearTimeout(timer)
  }, [session?.refreshToken])

  const enrollDevice = useCallback(
    async (email: string, password: string, label?: string) => {
      const apiBase = await getApiBaseUrl()
      if (!apiBase) throw new Error('Server URL not configured. Set the API URL first.')
      const deviceId = await getOrCreateDeviceId()
      const meta = deviceMeta()
      const res = await apiFetch<{ deviceToken: string; device: EnrolledDevice }>(
        '/shop-assist/devices/enroll',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
            deviceId,
            storeEndpoint: apiBase,
            label: label?.trim() || undefined,
            platform: meta.platform,
            appVersion: meta.appVersion,
          }),
        },
      )
      const bundle: StoredEnrollment = {
        deviceToken: res.deviceToken,
        storeEndpoint: apiBase.replace(/\/$/, ''),
      }
      await saveEnrollment(bundle)
      applyEnrollment(bundle)
      await clearSession()
      applySession(null)
    },
    [applyEnrollment, applySession],
  )

  const loginBadge = useCallback(
    async (badgeCode: string) => {
      const trimmed = badgeCode.trim()
      if (!trimmed) throw new Error('Enter or scan a badge code')
      const res = await apiFetch<AuthResponse>('/auth/login-badge', {
        method: 'POST',
        body: JSON.stringify({ badgeCode: trimmed }),
      })
      const bundle = await assertStaffSession(res)
      applySession(bundle)
    },
    [applySession],
  )

  const loginPassword = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const bundle = await assertStaffSession(res)
      applySession(bundle)
    },
    [applySession],
  )

  const logoutStaff = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', body: '{}' })
    } catch {
      /* offline or already logged out */
    }
    await clearSession()
    applySession(null)
  }, [applySession])

  const resetStoreBinding = useCallback(async () => {
    await clearEnrollment()
    await clearSession()
    applyEnrollment(null)
    applySession(null)
  }, [applyEnrollment, applySession])

  const unbindDevice = useCallback(
    async (email: string, password: string) => {
      await apiFetch('/shop-assist/devices/unbind', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      await clearEnrollment()
      await clearSession()
      applyEnrollment(null)
      applySession(null)
    },
    [applyEnrollment, applySession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      enrollment,
      session,
      user: session?.user ?? null,
      enrollDevice,
      loginBadge,
      loginPassword,
      logoutStaff,
      unbindDevice,
      resetStoreBinding,
      refreshEnrollment,
    }),
    [
      ready,
      enrollment,
      session,
      enrollDevice,
      loginBadge,
      loginPassword,
      logoutStaff,
      unbindDevice,
      resetStoreBinding,
      refreshEnrollment,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
