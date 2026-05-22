import { router, Stack } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from 'react-native'
import { apiFetch } from '@/src/api/client'
import type { ProductRow } from '@/src/api/types'
import { useAuth } from '@/src/auth/AuthContext'
import { Btn, ErrorText, Input, Loading, Muted, Screen } from '@/src/components/ui'
import { colors } from '@/src/theme'

export default function SearchScreen() {
  const { user, logout } = useAuth()
  const inputRef = useRef<TextInput>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ProductRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) {
      setResults([])
      return
    }
    setBusy(true)
    setError(null)
    try {
      const tryLookup = async (query: string) => apiFetch<ProductRow>(`/products/lookup?${query}`)
      try {
        const exact = await tryLookup(`sku=${encodeURIComponent(trimmed)}`)
        setResults([exact])
        return
      } catch {
        /* continue */
      }
      if (/^\d{6,}$/.test(trimmed)) {
        try {
          const exact = await tryLookup(`barcode=${encodeURIComponent(trimmed)}`)
          setResults([exact])
          return
        } catch {
          /* continue */
        }
      }
      const rows = await apiFetch<ProductRow[]>(
        `/products/search?q=${encodeURIComponent(trimmed)}&limit=40`,
      )
      setResults(rows)
    } catch (e) {
      setResults([])
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setBusy(false)
    }
  }, [])

  function onSubmit() {
    void runSearch(q)
    inputRef.current?.blur()
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
        {`Signed in as ${user?.email ?? '—'} (${user?.role ?? '—'}). Scan or type SKU / barcode / name, then Search.`}
      </Muted>
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
        <Btn label={busy ? 'Searching…' : 'Search'} onPress={() => onSubmit()} disabled={busy} />
        <Btn
          label="Clear"
          variant="ghost"
          onPress={() => {
            setQ('')
            setResults([])
            setError(null)
            inputRef.current?.focus()
          }}
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
