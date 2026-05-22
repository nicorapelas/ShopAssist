import { getApiBaseUrl } from '../config/serverUrl'
import type { AuthResponse } from './types'

export type ApiErrorBody = { message?: string; error?: string }

let getAccessToken: () => string | null = () => null
let getRefreshToken: () => string | null = () => null
let onTokensRefreshed: (tokens: { accessToken: string; refreshToken: string }) => void = () => {}
let onAuthFailed: () => void = () => {}

export function configureApiAuth(handlers: {
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
  onTokensRefreshed: (tokens: { accessToken: string; refreshToken: string }) => void
  onAuthFailed: () => void
}) {
  getAccessToken = handlers.getAccessToken
  getRefreshToken = handlers.getRefreshToken
  onTokensRefreshed = handlers.onTokensRefreshed
  onAuthFailed = handlers.onAuthFailed
}

function isPublicAuthPath(path: string) {
  return path.startsWith('/auth/login') || path.startsWith('/auth/refresh')
}

async function apiBaseOrThrow(): Promise<string> {
  const b = await getApiBaseUrl()
  if (!b) throw new Error('Server URL not configured')
  return b
}

async function refreshTokens(): Promise<boolean> {
  const base = await getApiBaseUrl()
  const refreshToken = getRefreshToken()
  if (!base || !refreshToken) return false
  try {
    const res = await fetch(`${base}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    const text = await res.text()
    const data = text ? (JSON.parse(text) as unknown) : null
    if (!res.ok) return false
    const auth = data as AuthResponse
    onTokensRefreshed({ accessToken: auth.accessToken, refreshToken: auth.refreshToken })
    return true
  } catch {
    return false
  }
}

export async function apiFetch<T>(path: string, init: RequestInit & { _retry?: boolean } = {}): Promise<T> {
  const base = await apiBaseOrThrow()
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const token = isPublicAuthPath(path) ? null : getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, { ...init, headers })
  const text = await res.text()
  const data = text ? (JSON.parse(text) as unknown) : null

  if (res.status === 401 && !init._retry && !isPublicAuthPath(path)) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      return apiFetch<T>(path, { ...init, _retry: true })
    }
    onAuthFailed()
  }

  if (!res.ok) {
    const err = data as ApiErrorBody | null
    throw new Error(err?.message ?? err?.error ?? res.statusText)
  }
  return data as T
}

export async function testServerConnection(apiBase: string): Promise<void> {
  const healthUrl = apiBase.replace(/\/api\/?$/, '') + '/health'
  const res = await fetch(healthUrl)
  if (!res.ok) throw new Error(`Server returned ${res.status}`)
  const data = (await res.json()) as { ok?: boolean }
  if (!data.ok) throw new Error('Health check failed')
}
