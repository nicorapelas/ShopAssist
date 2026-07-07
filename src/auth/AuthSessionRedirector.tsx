import { router, usePathname } from 'expo-router'
import { useEffect } from 'react'
import { useAuth } from './AuthContext'

const PUBLIC_PATHS = new Set(['/', '/login', '/setup', '/enroll'])

export function AuthSessionRedirector() {
  const { ready, enrollment, session } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return
    if (PUBLIC_PATHS.has(pathname)) return
    if (!enrollment) {
      router.replace('/enroll')
      return
    }
    if (!session) {
      router.replace('/login')
    }
  }, [pathname, ready, enrollment, session])

  return null
}
