import { DEFAULT_API_BASE, getApiBaseUrl } from '../config/serverUrl'
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

function responseLooksLikeHtml(text: string, contentType: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('<')) return true
  if (contentType.includes('text/html')) return true
  return false
}

function parseResponseBody(text: string, res: Response): unknown {
  const trimmed = text.trim()
  if (!trimmed) return null

  const contentType = res.headers.get('content-type') ?? ''
  if (responseLooksLikeHtml(trimmed, contentType)) {
    throw new Error(
      `Server returned a web page instead of JSON (HTTP ${res.status}). ` +
        `Tap Change server and set your API URL to the /api base, e.g. ${DEFAULT_API_BASE}. ` +
        `Confirm the tunnel or server is running.`,
    )
  }

  try {
    return JSON.parse(trimmed) as unknown
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'invalid JSON'
    throw new Error(`Could not read server response (${detail}). Check the server URL under Change server.`)
  }
}

function apiErrorMessage(data: unknown, res: Response): string {
  const err = data as ApiErrorBody | null
  if (err?.message) return err.message
  if (err?.error) return String(err.error)
  if (res.status === 401) return 'Invalid email or password'
  if (res.status === 403) return 'Access denied'
  if (res.status >= 500) return `Server error (${res.status})`
  return res.statusText || `Request failed (${res.status})`
}

async function apiBaseOrThrow(): Promise<string> {
  const b = await getApiBaseUrl()
  if (!b) throw new Error('Server URL not configured. Tap Change server first.')
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
    const data = parseResponseBody(text, res)
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

  let res: Response
  try {
    res = await fetch(url, { ...init, headers })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network request failed'
    if (msg.toLowerCase().includes('network request failed') || msg.toLowerCase().includes('failed to fetch')) {
      throw new Error(
        `Cannot reach the server at ${base}. Check Wi‑Fi, the tunnel, and the URL under Change server.`,
      )
    }
    throw err instanceof Error ? err : new Error(msg)
  }

  const text = await res.text()
  const data = parseResponseBody(text, res)

  if (res.status === 401 && !init._retry && !isPublicAuthPath(path)) {
    const refreshed = await refreshTokens()
    if (refreshed) {
      return apiFetch<T>(path, { ...init, _retry: true })
    }
    onAuthFailed()
  }

  if (!res.ok) {
    throw new Error(apiErrorMessage(data, res))
  }
  return data as T
}

function cloudflareTunnelHint(status: number): string {
  if (status === 530 || status === 502 || status === 503) {
    return (
      ' Cloudflare cannot reach the shop PC (tunnel or API offline). On Steve run: ' +
      'npm run dev in server/, then cloudflared tunnel run jacobs-cycles_tunnel.'
    )
  }
  return ''
}

async function probeHealthUrl(healthUrl: string): Promise<void> {
  let res: Response
  try {
    res = await fetch(healthUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Connection failed'
    throw new Error(`Cannot reach ${healthUrl}: ${msg}`)
  }
  const text = await res.text()
  if (responseLooksLikeHtml(text, res.headers.get('content-type') ?? '')) {
    throw new Error(
      `Health check returned a web page (HTTP ${res.status}), not the API.${cloudflareTunnelHint(res.status)} ` +
        `Use an /api URL such as ${DEFAULT_API_BASE}.`,
    )
  }
  if (!res.ok) {
    throw new Error(`Server returned HTTP ${res.status}.${cloudflareTunnelHint(res.status)}`)
  }
  let data: { ok?: boolean }
  try {
    data = text ? (JSON.parse(text) as { ok?: boolean }) : {}
  } catch {
    throw new Error('Health check returned invalid JSON')
  }
  if (!data.ok) throw new Error('Health check failed')
}

export async function testServerConnection(apiBase: string): Promise<void> {
  const base = apiBase.replace(/\/$/, '')
  const origin = base.replace(/\/api\/?$/, '')
  const candidates = [...new Set([`${base}/health`, `${origin}/health`])]
  let lastError: Error | null = null
  for (const url of candidates) {
    try {
      await probeHealthUrl(url)
      return
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastError ?? new Error('Connection failed')
}
