import { apiFetch } from './client'
import type { ProductRow } from './types'

export type ProductLookupResult =
  | { kind: 'exact'; product: ProductRow }
  | { kind: 'list'; products: ProductRow[] }
  | { kind: 'empty' }

/** SKU / barcode exact match, then text search (same as search screen). */
export async function lookupProductTerm(term: string): Promise<ProductLookupResult> {
  const trimmed = term.trim()
  if (!trimmed) {
    return { kind: 'empty' }
  }

  const tryLookup = async (query: string) => apiFetch<ProductRow>(`/products/lookup?${query}`)

  try {
    const exact = await tryLookup(`sku=${encodeURIComponent(trimmed)}`)
    return { kind: 'exact', product: exact }
  } catch {
    /* continue */
  }

  if (/^\d{4,}$/.test(trimmed)) {
    try {
      const exact = await tryLookup(`barcode=${encodeURIComponent(trimmed)}`)
      return { kind: 'exact', product: exact }
    } catch {
      /* continue */
    }
  }

  const rows = await apiFetch<ProductRow[]>(
    `/products/search?q=${encodeURIComponent(trimmed)}&limit=40`,
  )
  if (rows.length === 1) {
    return { kind: 'exact', product: rows[0] }
  }
  if (rows.length > 0) {
    return { kind: 'list', products: rows }
  }
  return { kind: 'empty' }
}
