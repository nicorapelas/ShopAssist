import type { AuthUser } from './api/types'

export function hasPermission(user: AuthUser | null | undefined, perm: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  const p = user.permissions ?? []
  if (p.includes('*')) return true
  return p.includes(perm)
}

export function canUseCatalog(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'catalog.read')
}

export function canReadInvoices(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'sales.read')
}

export function canCreateInvoices(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'sales.create')
}

export function canUseInvoices(user: AuthUser | null | undefined): boolean {
  return canReadInvoices(user) || canCreateInvoices(user)
}

export function canUseHouseAccounts(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'house_accounts.access')
}

export function canUseTillCart(user: AuthUser | null | undefined): boolean {
  return canUseCatalog(user)
}

/** Staff may sign in with catalog or sales access (invoice-only roles). */
export function canUseShopAssist(user: AuthUser | null | undefined): boolean {
  return (
    canUseCatalog(user) || hasPermission(user, 'sales.read') || hasPermission(user, 'sales.create')
  )
}

export function canEditStockFields(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'catalog.write')
}

export function canEditPricingFields(user: AuthUser | null | undefined): boolean {
  if (!hasPermission(user, 'catalog.write')) return false
  const role = user?.role ?? ''
  if (role === 'admin' || role === 'manager') return true
  if (role === 'cashier' || role === 'warehouse') return false
  return true
}
