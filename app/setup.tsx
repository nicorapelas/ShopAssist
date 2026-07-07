import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { testServerConnection } from '@/src/api/client'
import { Btn, ErrorText, FieldLabel, Input, Muted, Screen, Title } from '@/src/components/ui'
import { DEFAULT_API_BASE, DEV_API_BASE, PROD_API_BASE, getApiBaseUrl, normalizeApiBaseInput, setApiBaseUrl } from '@/src/config/serverUrl'
import { useAuth } from '@/src/auth/AuthContext'
import { loadEnrollment } from '@/src/auth/enrollmentStorage'

export default function SetupScreen() {
  const { session, refreshEnrollment, resetStoreBinding } = useAuth()
  const [url, setUrl] = useState(DEFAULT_API_BASE)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const saved = await getApiBaseUrl()
      if (saved) setUrl(saved)
    })()
  }, [])

  async function save(andContinue: boolean) {
    setError(null)
    setNotice(null)
    const normalized = normalizeApiBaseInput(url)
    if (!normalized) {
      setError('Enter your server API URL')
      return
    }
    setBusy(true)
    try {
      await testServerConnection(normalized)
      const previous = await getApiBaseUrl()
      await setApiBaseUrl(normalized)
      if (previous && previous !== normalized) {
        await resetStoreBinding()
      } else {
        await refreshEnrollment()
      }
      setNotice('Connected to tunnel / server')
      if (andContinue) {
        const enrolled = await loadEnrollment()
        if (enrolled && enrolled.storeEndpoint === normalized.replace(/\/$/, '')) {
          router.replace(session ? '/(tabs)' : '/login')
        } else {
          router.replace('/enroll')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Title>ShopAssist</Title>
          <Muted>
            {__DEV__
              ? `Development: ${DEV_API_BASE} (Steve + cloudflared). Production: ${PROD_API_BASE} (Dell).`
              : `Production store API: ${PROD_API_BASE} via Cloudflare tunnel on jacobs-server.`}
          </Muted>
          <FieldLabel>Server API URL</FieldLabel>
          <Input
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder={DEFAULT_API_BASE}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          {notice ? <Muted>{notice}</Muted> : null}
          <Btn label={busy ? 'Testing…' : 'Test & save'} onPress={() => void save(true)} disabled={busy} />
          <Btn label="Test only" onPress={() => void save(false)} variant="ghost" disabled={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
