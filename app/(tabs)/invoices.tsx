import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { listSales } from '@/src/api/sales'
import type { SaleSummary } from '@/src/api/types'
import { useAuth } from '@/src/auth/AuthContext'
import { Screen } from '@/src/components/ui'
import { canCreateInvoices, canReadInvoices } from '@/src/permissions'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

function money(n: number) {
  return `R ${Number(n || 0).toFixed(2)}`
}

function saleRef(sale: SaleSummary) {
  return sale.saleId?.trim() || String(sale._id)
}

function formatWhen(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function InvoicesScreen() {
  const { user } = useAuth()
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const canRead = canReadInvoices(user)
  const canCreate = canCreateInvoices(user)
  const [sales, setSales] = useState<SaleSummary[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(canRead)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!canRead) {
        setLoading(false)
        setRefreshing(false)
        return
      }
      if (mode === 'refresh') setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const data = await listSales(50)
        setSales(data.sales ?? [])
        setTotal(data.total ?? 0)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load sales')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [canRead],
  )

  useFocusEffect(
    useCallback(() => {
      void load('initial')
    }, [load]),
  )

  return (
    <Screen style={styles.screen}>
      {canCreate ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New invoice"
          onPress={() => router.push('/new-invoice')}
          style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
        >
          <Text style={styles.newBtnText}>+ New invoice</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} size="large" />
      ) : (
        <FlatList
          data={canRead ? sales : []}
          keyExtractor={(item) => String(item._id)}
          refreshControl={
            canRead ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void load('refresh')}
                tintColor={colors.primary}
              />
            ) : undefined
          }
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            canRead ? (
              <Text style={styles.count}>
                {total} sale{total === 1 ? '' : 's'} · tap to preview
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {error ||
                (canRead
                  ? 'No invoices yet. Create one, then pull to refresh.'
                  : 'You can create invoices. List access needs sales.read.')}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => router.push(`/sale/${saleRef(item)}`)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ref}>{saleRef(item)}</Text>
                <Text style={styles.meta}>{formatWhen(item.createdAt)}</Text>
                {item.houseAccountName ? <Text style={styles.meta}>{item.houseAccountName}</Text> : null}
              </View>
              <Text style={styles.total}>{money(item.total)}</Text>
            </Pressable>
          )}
        />
      )}

      {error && sales.length > 0 ? <Text style={styles.errorBanner}>{error}</Text> : null}
    </Screen>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
    screen: {
      padding: 0,
    },
    newBtn: {
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    newBtnText: {
      color: colors.primaryText,
      fontWeight: '700',
      fontSize: 16,
    },
    list: {
      paddingHorizontal: 12,
      paddingBottom: 32,
    },
    count: {
      paddingHorizontal: 4,
      paddingVertical: 10,
      color: colors.muted,
      fontSize: 13,
    },
    empty: {
      padding: 24,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
    row: {
      marginBottom: 8,
      backgroundColor: colors.panel,
      borderRadius: 12,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    ref: { fontWeight: '700', color: colors.text, fontSize: 16 },
    meta: { color: colors.muted, marginTop: 2, fontSize: 13 },
    total: { fontWeight: '800', color: colors.primary, fontSize: 16 },
    errorBanner: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
      backgroundColor: '#fef2f2',
      color: colors.danger,
      padding: 12,
      borderRadius: 10,
      overflow: 'hidden',
    },
    pressed: {
      opacity: 0.82,
    },
  })
}
