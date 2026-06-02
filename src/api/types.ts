export interface AuthUser {
  id: string
  email: string
  displayName?: string
  role: string
  permissions?: string[]
  allowShopAssistCatalogAdjustment?: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface StockAdjustmentRow {
  _id: string
  productId: string
  productSku: string
  fromStock: number
  toStock: number
  delta: number
  changedByEmail: string
  changedByDisplayName?: string | null
  sourceApp: string
  createdAt: string
}

export interface ProductRow {
  _id: string
  name: string
  sku: string
  category?: string | null
  subCategory?: string | null
  barcode?: string | null
  price: number
  stock: number
  trackInventory?: boolean
  layByReservedQty?: number
  availableQty?: number | null
  hasPhoto?: boolean
  photoRevision?: number
}

export interface ShopAssistCartLine {
  productId: string
  sku: string
  barcode?: string | null
  name: string
  quantity: number
  unitPrice: number
}

export interface ShopAssistCartResponse {
  _id: string
  status: 'ready' | 'claimed' | 'expired'
  token?: string
  qrPayload?: string
  createdByEmail?: string
  expiresAt: string
  claimedAt?: string | null
  createdAt?: string
  updatedAt?: string
  lines: ShopAssistCartLine[]
}
