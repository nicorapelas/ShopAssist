import { apiFetch } from './client'
import type {
  CreateSaleResponse,
  EmailSaleResponse,
  HouseAccountRow,
  SaleSummary,
  SalesListResponse,
  StoreInvoiceMeta,
} from './types'

export type CartSaleLine = { productId: string; quantity: number }

export type SaleSettlement =
  | { kind: 'cash'; total: number }
  | { kind: 'card'; total: number }
  | {
      kind: 'on_account'
      total: number
      houseAccountId: string
      purchaseOrderNumber: string
    }

export function createCatalogSale(items: CartSaleLine[], settlement: SaleSettlement) {
  const amount = Math.round(Number(settlement.total) * 100) / 100
  const base = {
    items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  }

  if (settlement.kind === 'on_account') {
    return apiFetch<CreateSaleResponse>('/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...base,
        paymentMethod: 'on_account',
        onAccountAmount: amount,
        houseAccountId: settlement.houseAccountId,
        purchaseOrderNumber: settlement.purchaseOrderNumber,
        payment: { cashAmount: 0, cardAmount: 0 },
      }),
    })
  }

  if (settlement.kind === 'cash') {
    return apiFetch<CreateSaleResponse>('/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...base,
        paymentMethod: 'cash',
        payment: { cashAmount: amount, cardAmount: 0 },
      }),
    })
  }

  return apiFetch<CreateSaleResponse>('/sales', {
    method: 'POST',
    body: JSON.stringify({
      ...base,
      paymentMethod: 'card',
      payment: { cardAmount: amount, cashAmount: 0 },
    }),
  })
}

export function searchHouseAccounts(q: string, limit = 100) {
  const trimmed = q.trim()
  const qs = trimmed
    ? `?q=${encodeURIComponent(trimmed)}&limit=${limit}`
    : `?limit=${limit}`
  return apiFetch<HouseAccountRow[]>(`/house-accounts${qs}`).then((rows) =>
    (Array.isArray(rows) ? rows : []).map((r) => ({
      ...r,
      _id: String(r._id),
    })),
  )
}

export function createHouseAccount(input: { name: string; phone?: string; email?: string }) {
  return apiFetch<HouseAccountRow>('/house-accounts', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name.trim(),
      phone: input.phone?.trim() || '',
      email: input.email?.trim() || '',
    }),
  }).then((r) => ({ ...r, _id: String(r._id) }))
}

export function listSales(limit = 40) {
  return apiFetch<SalesListResponse>(`/sales?limit=${limit}`)
}

export function getSale(id: string) {
  return apiFetch<SaleSummary>(`/sales/${encodeURIComponent(id)}`)
}

export function getStoreInvoiceMeta(): Promise<StoreInvoiceMeta> {
  return apiFetch<{
    storeName?: string
    storeAddressLines?: string[]
    storePhone?: string
    vatRate?: number
    storeVatNumber?: string
  }>('/settings/store')
    .then((s) => ({
      storeName: typeof s.storeName === 'string' && s.storeName.trim() ? s.storeName.trim() : 'Store',
      storeAddressLines: Array.isArray(s.storeAddressLines)
        ? s.storeAddressLines.map((l) => String(l ?? '').trim()).filter(Boolean)
        : [],
      storePhone: typeof s.storePhone === 'string' ? s.storePhone.trim() : '',
      vatRate:
        typeof s.vatRate === 'number' && Number.isFinite(s.vatRate) && s.vatRate >= 0 ? s.vatRate : 0.14,
      storeVatNumber: typeof s.storeVatNumber === 'string' ? s.storeVatNumber.trim() : '',
    }))
    .catch(() => ({
      storeName: 'Store',
      storeAddressLines: [],
      storePhone: '',
      vatRate: 0.14,
      storeVatNumber: '',
    }))
}

export function emailSale(id: string, to: string, message?: string) {
  return apiFetch<EmailSaleResponse>(`/sales/${encodeURIComponent(id)}/email`, {
    method: 'POST',
    body: JSON.stringify({ to, ...(message ? { message } : {}) }),
  })
}
