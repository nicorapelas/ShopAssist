import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { apiFetch } from '@/src/api/client'
import { useAuth } from '@/src/auth/AuthContext'
import { Btn, ErrorText, Loading, Muted, Screen, Title } from '@/src/components/ui'
import { getApiBaseUrl } from '@/src/config/serverUrl'
import { colors } from '@/src/theme'

type CatalogSync = {
  catalogRevision: number
  catalogPushedAt: string | null
}

export default function HomeScreen() {
  const { user, logout } = useAuth()
  const [apiBase, setApiBase] = useState<string | null>(null)
  const [sync, setSync] = useState<CatalogSync | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getApiBaseUrl().then(setApiBase)
  }, [])

  const pingApi = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await apiFetch<CatalogSync>('/settings/catalog-sync')
      setSync(data)
    } catch (e) {
      setSync(null)
      setError(e instanceof Error ? e.message : 'API request failed')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void pingApi()
  }, [pingApi])

  return (
    <Screen style={styles.screen}>
      <ScrollView>
        <Title>ShopAssist</Title>
        <Muted>Connected via Cloudflare tunnel to your shop server.</Muted>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>API</Text>
          <Text style={styles.cardValue}>{apiBase ?? '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Signed in</Text>
          <Text style={styles.cardValue}>
            {user?.email ?? '—'} ({user?.role ?? '—'})
          </Text>
        </View>

        {busy ? <Loading /> : null}
        {sync ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Catalog sync (POS poll)</Text>
            <Text style={styles.cardValue}>
              revision {sync.catalogRevision}
              {sync.catalogPushedAt ? ` · pushed ${new Date(sync.catalogPushedAt).toLocaleString()}` : ''}
            </Text>
          </View>
        ) : null}
        {error ? <ErrorText>{error}</ErrorText> : null}

        <Btn label="Test API again" onPress={() => void pingApi()} disabled={busy} />
        <Btn label="Server settings" onPress={() => router.push('/setup')} variant="ghost" />
        <Btn
          label="Sign out"
          onPress={() => {
            void logout().then(() => router.replace('/login'))
          }}
          variant="ghost"
        />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screen: { paddingTop: 16 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    color: colors.text,
  },
})
