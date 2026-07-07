import { getApiBaseUrl } from '../config/serverUrl'
import type { ApiErrorBody } from './client'

type AuthHeaders = {
  getAccessToken: () => string | null
  getDeviceToken: () => string | null
  getStoreEndpoint: () => string | null
  refreshTokens: () => Promise<boolean>
}

let auth: AuthHeaders = {
  getAccessToken: () => null,
  getDeviceToken: () => null,
  getStoreEndpoint: () => null,
  refreshTokens: async () => false,
}

/** Wired from api/client configureApiAuth. */
export function configureProductPhotoAuth(handlers: AuthHeaders) {
  auth = handlers
}

async function apiBaseOrThrow(): Promise<string> {
  const base = await getApiBaseUrl()
  if (!base) throw new Error('Server URL not configured. Tap Change server first.')
  return base
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'X-Client-App': 'shop-assist' }
  const token = auth.getAccessToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const deviceToken = auth.getDeviceToken()
  if (deviceToken) headers['X-Device-Token'] = deviceToken
  const store = auth.getStoreEndpoint()
  if (store) headers['X-Store-Endpoint'] = store
  return headers
}

export async function getProductPhotoImageSource(
  productId: string,
  revision: number,
): Promise<{ uri: string; headers: Record<string, string> } | null> {
  if (revision < 1) return null
  const base = await apiBaseOrThrow()
  return {
    uri: `${base}/products/${encodeURIComponent(productId)}/photo?rev=${encodeURIComponent(String(revision))}`,
    headers: authHeaders(),
  }
}

/** Multipart upload — form field name must be `photo`. */
export async function uploadProductPhoto(
  productId: string,
  localUri: string,
  mimeType: string,
  fileName = 'photo.jpg',
): Promise<{ photoRevision: number; hasPhoto: boolean }> {
  const base = await apiBaseOrThrow()
  const url = `${base}/products/${encodeURIComponent(productId)}/photo`

  const post = async () => {
    const form = new FormData()
    form.append('photo', {
      uri: localUri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob)
    return fetch(url, { method: 'POST', headers: authHeaders(), body: form })
  }

  let res = await post()
  if (res.status === 401) {
    const refreshed = await auth.refreshTokens()
    if (refreshed) res = await post()
  }

  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err = data as ApiErrorBody | null
    throw new Error(err?.message ?? err?.error ?? res.statusText ?? 'Upload failed')
  }
  return data as { photoRevision: number; hasPhoto: boolean }
}

export async function deleteProductPhoto(productId: string): Promise<void> {
  const base = await apiBaseOrThrow()
  const url = `${base}/products/${encodeURIComponent(productId)}/photo`

  const del = async () => fetch(url, { method: 'DELETE', headers: authHeaders() })

  let res = await del()
  if (res.status === 401) {
    const refreshed = await auth.refreshTokens()
    if (refreshed) res = await del()
  }
  if (!res.ok && res.status !== 204) {
    const text = await res.text()
    let msg = res.statusText
    try {
      const j = text ? (JSON.parse(text) as ApiErrorBody) : null
      msg = j?.message ?? j?.error ?? msg
    } catch {
      /* ignore */
    }
    throw new Error(msg || 'Could not remove photo')
  }
}
