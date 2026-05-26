import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { apiFetch } from '@/src/api/client'
import { useAuth } from '@/src/auth/AuthContext'
import { Btn, ErrorText, Loading, Screen } from '@/src/components/ui'
import { getApiBaseUrl } from '@/src/config/serverUrl'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

type CatalogSync = {
  catalogRevision: number
  catalogPushedAt: string | null
}

export default function AccountScreen() {
  const { user, logout } = useAuth()
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [apiBase, setApiBase] = useState<string | null>(null)
  const [sync, setSync] = useState<CatalogSync | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void getApiBaseUrl().then(setApiBase)
  }, [])

  async function pingApi() {
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
  }

  useEffect(() => {
    void pingApi()
  }, [])

  return (
    <Screen style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color={colors.primary} />
          </View>
          <Text style={styles.email}>{user?.email ?? 'Signed in'}</Text>
          <Text style={styles.role}>{user?.role ?? 'staff'}</Text>
        </View>

        <InfoCard label="API server" value={apiBase ?? '-'} colors={colors} />
        <InfoCard
          label="Catalog sync"
          value={
            sync
              ? `revision ${sync.catalogRevision}${
                  sync.catalogPushedAt ? ` - pushed ${new Date(sync.catalogPushedAt).toLocaleString()}` : ''
                }`
              : 'Not checked yet'
          }
          colors={colors}
        />

        {busy ? <Loading /> : null}
        {error ? <ErrorText>{error}</ErrorText> : null}

        <Btn label="Test API again" onPress={() => void pingApi()} disabled={busy} />
        <Btn label="Server settings" onPress={() => router.push('/setup')} variant="ghost" />
        <Btn
          label="Sign out"
          onPress={() => {
            void logout().then(() => router.replace('/login'))
          }}
          variant="danger"
        />
      </ScrollView>
    </Screen>
  )
}

function InfoCard({ colors, label, value }: { colors: ShopAssistColors; label: string; value: string }) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
  screen: {
    padding: 0,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  email: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  role: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
})
}
