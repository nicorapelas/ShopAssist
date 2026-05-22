import type { AuthUser } from './api/types'

export function hasPermission(user: AuthUser | null | undefined, perm: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  const p = user.permissions ?? []
  if (p.includes('*')) return true
  return p.includes(perm)
}

export function canUseShopAssist(user: AuthUser | null | undefined): boolean {
  return hasPermission(user, 'catalog.read')
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
