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

type AuthContextValue = {
  ready: boolean
  session: StoredSession | null
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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
