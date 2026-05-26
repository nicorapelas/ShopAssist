import { router, usePathname } from 'expo-router'
import { useEffect } from 'react'
import { useAuth } from './AuthContext'

const PUBLIC_PATHS = new Set(['/', '/login', '/setup'])

export function AuthSessionRedirector() {
  const { ready, session } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready || session) return
    if (PUBLIC_PATHS.has(pathname)) return
    router.replace('/login')
  }, [pathname, ready, session])

  return null
}
