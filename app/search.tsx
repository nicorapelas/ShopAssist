import { Ionicons } from '@expo/vector-icons'
import { router, Stack } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from 'react-native'
import { lookupProductTerm } from '@/src/api/productLookup'
import type { ProductRow } from '@/src/api/types'
import { useAuth } from '@/src/auth/AuthContext'
import { BarcodeScannerModal } from '@/src/components/BarcodeScannerModal'
import { Btn, ErrorText, Input, Loading, Muted, Screen } from '@/src/components/ui'
import { colors } from '@/src/theme'

export default function SearchScreen() {
  const { user, logout } = useAuth()
  const inputRef = useRef<TextInput>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ProductRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const applyLookup = useCallback((result: Awaited<ReturnType<typeof lookupProductTerm>>, term: string) => {
    if (result.kind === 'exact') {
      router.push({
        pathname: '/product/[id]',
        params: { id: result.product._id },
      })
      return
    }
    if (result.kind === 'list') {
      setQ(term)
      setResults(result.products)
      return
    }
    setResults([])
    setError('No product found for that code.')
  }, [])

  const runSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim()
      if (!trimmed) {
        setResults([])
        return
      }
      setBusy(true)
      setError(null)
      try {
        const result = await lookupProductTerm(trimmed)
        applyLookup(result, trimmed)
      } catch (e) {
        setResults([])
        setError(e instanceof Error ? e.message : 'Search failed')
      } finally {
        setBusy(false)
      }
    },
    [applyLookup],
  )

  function onSubmit() {
    void runSearch(q)
    inputRef.current?.blur()
  }

  function onBarcodeScanned(value: string) {
    setScannerOpen(false)
    setQ(value)
    void runSearch(value)
  }

  return (
    <Screen style={{ paddingTop: 0 }}>
      <Stack.Screen
        options={{
          title: 'ShopAssist',
          headerRight: () => (
            <Pressable onPress={() => router.push('/setup')} style={{ marginRight: 12 }}>
              <Text style={{ color: colors.primary, fontSize: 14 }}>Server</Text>
            </Pressable>
          ),
        }}
      />
      <Muted>
        {`Signed in as ${user?.email ?? '—'} (${user?.role ?? '—'}). Scan a barcode or type SKU / name.`}
      </Muted>
      <Btn
        label="Scan barcode"
        onPress={() => {
          setError(null)
          setScannerOpen(true)
        }}
        disabled={busy}
      />
      <Input
        ref={inputRef}
        value={q}
        onChangeText={setQ}
        placeholder="SKU, barcode, or product name"
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        blurOnSubmit
      />
      <View style={styles.row}>
        <Btn
          compact
          accessibilityLabel={busy ? 'Searching' : 'Search'}
          onPress={() => onSubmit()}
          disabled={busy}
          icon={
            busy ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Ionicons name="search" size={24} color={colors.primaryText} />
            )
          }
        />
        <Btn
          compact
          variant="ghost"
          accessibilityLabel="Clear search"
          onPress={() => {
            setQ('')
            setResults([])
            setError(null)
            inputRef.current?.focus()
          }}
          icon={<Ionicons name="close-circle" size={24} color={colors.text} />}
        />
      </View>
      {error ? <ErrorText>{error}</ErrorText> : null}
      {busy ? <Loading /> : null}
      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
        ListEmptyComponent={!busy && q.trim() ? <Muted>No products found.</Muted> : null}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: '/product/[id]',
                params: { id: item._id },
              })
            }
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {item.sku}
              {item.barcode ? ` · ${item.barcode}` : ''}
            </Text>
            <Text style={styles.cardStock}>
              Stock {item.stock}
              {item.availableQty != null ? ` · Available ${item.availableQty}` : ''}
              {' · '}
              {item.price.toFixed(2)}
            </Text>
          </Pressable>
        )}
      />
      <Btn
        label="Sign out"
        variant="ghost"
        onPress={() => {
          void logout().then(() => router.replace('/login'))
        }}
      />
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onBarcode={onBarcodeScanned}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  cardStock: {
    color: colors.text,
    fontSize: 13,
    marginTop: 6,
  },
})
