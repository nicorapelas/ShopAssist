import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { Loading, Screen } from '@/src/components/ui'
import { getApiBaseUrl } from '@/src/config/serverUrl'
import { useAuth } from '@/src/auth/AuthContext'

export default function Index() {
  const { ready, enrollment, session } = useAuth()
  const [hasUrl, setHasUrl] = useState<boolean | null>(null)

  useEffect(() => {
    void (async () => {
      const url = await getApiBaseUrl()
      setHasUrl(Boolean(url))
    })()
  }, [])

  if (!ready || hasUrl === null) {
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }

  if (!hasUrl) return <Redirect href="/setup" />
  if (!enrollment) return <Redirect href="/enroll" />
  if (!session) return <Redirect href="/login" />
  return <Redirect href="/(tabs)" />
}
