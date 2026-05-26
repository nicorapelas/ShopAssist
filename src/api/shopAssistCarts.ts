import { apiFetch } from './client'
import type { ShopAssistCartResponse } from './types'

export type CreateShopAssistCartLine = {
  productId: string
  quantity: number
}

export async function createShopAssistCart(lines: CreateShopAssistCartLine[]) {
  return apiFetch<ShopAssistCartResponse>('/shop-assist-carts', {
    method: 'POST',
    body: JSON.stringify({ lines }),
  })
}
