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

export type SaleLine = {
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type HouseAccountInvoice = {
  name?: string
  accountNumber?: string
  contactPerson?: string
  phone?: string
  email?: string
  vatNumber?: string
  companyRegistrationNumber?: string
  addressLines?: string[]
  paymentTerms?: string
  purchaseOrderNumber?: string
}

export type SaleSummary = {
  _id: string
  saleId?: string
  total: number
  createdAt?: string
  paymentMethod?: string
  items?: SaleLine[]
  houseAccountName?: string
  houseAccountNumber?: string
  purchaseOrderNumber?: string
  houseAccount?: HouseAccountInvoice
  cashierDisplayName?: string
  cashier?: { displayName?: string; email?: string } | null
}

export type SalesListResponse = {
  total: number
  sales: SaleSummary[]
}

export type EmailSaleResponse = {
  ok: boolean
  to: string
  saleId: string
  messageId: string
}

export type CreateSaleResponse = {
  _id: string
  saleId?: string
  total: number
}

export type HouseAccountRow = {
  _id: string
  accountNumber: string
  name: string
  phone?: string
  email?: string
  contactPerson?: string
  vatNumber?: string
  companyRegistrationNumber?: string
  addressLines?: string[]
  paymentTerms?: string
  balance?: number
  status?: string
}

export type StoreInvoiceMeta = {
  storeName: string
  storeAddressLines: string[]
  storePhone: string
  vatRate: number
  storeVatNumber: string
}
