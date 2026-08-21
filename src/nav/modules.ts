import type { Href } from 'expo-router'
import type { AuthUser } from '@/src/api/types'
import { canUseCatalog, canUseInvoices } from '@/src/permissions'

export type WorkModule = 'catalog' | 'invoices'

export function workModules(user: AuthUser | null | undefined): WorkModule[] {
  const modules: WorkModule[] = []
  if (canUseCatalog(user)) modules.push('catalog')
  if (canUseInvoices(user)) modules.push('invoices')
  return modules
}

export function shouldSkipHome(user: AuthUser | null | undefined): boolean {
  return workModules(user).length === 1
}

export function landingHref(user: AuthUser | null | undefined): Href {
  const modules = workModules(user)
  if (modules.length === 1 && modules[0] === 'catalog') return '/(tabs)/catalog'
  if (modules.length === 1 && modules[0] === 'invoices') return '/(tabs)/invoices'
  return '/(tabs)'
}
