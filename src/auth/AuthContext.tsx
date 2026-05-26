import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, configureApiAuth } from '../api/client'
import type { AuthResponse, AuthUser } from '../api/types'
import { canUseShopAssist } from '../permissions'
import { clearSession, loadSession, saveSession, type StoredSession } from './storage'

const SESSION_EXPIRY_GRACE_MS = 1000

type AuthContextValue = {
  ready: boolean
  session: StoredSession | null
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<StoredSession | null>(null)

  const applySession = useCallback((s: StoredSession | null) => {
    setSession(s)
  }, [])

  useEffect(() => {
    void (async () => {
      const s = await loadSession()
      applySession(s)
      setReady(true)
    })()
  }, [applySession])

  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => session?.accessToken ?? null,
      getRefreshToken: () => session?.refreshToken ?? null,
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
    })
  }, [session])

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

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (!canUseShopAssist(res.user)) {
        throw new Error('This account needs catalog.read permission.')
      }
      const bundle: StoredSession = {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        user: res.user,
      }
      await saveSession(bundle)
      applySession(bundle)
    },
    [applySession],
  )

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', body: '{}' })
    } catch {
      /* offline or already logged out */
    }
    await clearSession()
    applySession(null)
  }, [applySession])

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      user: session?.user ?? null,
      login,
      logout,
    }),
    [ready, session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
