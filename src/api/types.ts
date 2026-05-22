export interface AuthUser {
  id: string
  email: string
  role: string
  permissions?: string[]
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
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
