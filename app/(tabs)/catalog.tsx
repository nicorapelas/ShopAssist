import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from 'react-native'
import { lookupProductTerm } from '@/src/api/productLookup'
import type { ProductRow } from '@/src/api/types'
import { useShopAssistCart } from '@/src/cart/CartContext'
import { BarcodeScannerModal } from '@/src/components/BarcodeScannerModal'
import { ErrorText, Input, Loading, Screen } from '@/src/components/ui'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

export default function CatalogScreen() {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { lines } = useShopAssistCart()
  const inputRef = useRef<TextInput>(null)
  const listRef = useRef<FlatList<ProductRow>>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ProductRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const hasQuery = q.trim().length > 0
  const tillCount = lines.reduce((sum, line) => sum + line.quantity, 0)

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
        setError(null)
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

  function scrollLookupIntoView() {
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true })
    }, 80)
  }

  const listHeader = (
    <View style={styles.headerContent}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open till cart"
        onPress={() => router.push('/(tabs)/cart')}
        style={({ pressed }) => [styles.tillLink, pressed && styles.pressed]}
      >
        <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
        <Text style={styles.tillLinkText}>Till cart{tillCount ? ` · ${tillCount}` : ''}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </Pressable>

      <View style={styles.lookupCard}>
        <View style={styles.inputRow}>
          <Input
            ref={inputRef}
            value={q}
            onChangeText={setQ}
            placeholder="SKU, barcode, or name"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            onFocus={scrollLookupIntoView}
            blurOnSubmit
            style={styles.searchInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open barcode scanner"
            disabled={busy}
            onPress={() => {
              setError(null)
              setScannerOpen(true)
            }}
            style={({ pressed }) => [styles.iconButton, (pressed || busy) && styles.pressed]}
          >
            <Ionicons name="barcode-outline" size={22} color={colors.primaryText} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={busy ? 'Searching' : 'Search products'}
            disabled={busy}
            onPress={onSubmit}
            style={({ pressed }) => [styles.iconButton, (pressed || busy) && styles.pressed]}
          >
            {busy ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Ionicons name="search" size={22} color={colors.primaryText} />
            )}
          </Pressable>
          {hasQuery ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => {
                setQ('')
                setResults([])
                setError(null)
                inputRef.current?.focus()
              }}
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          ) : null}
        </View>
        {error ? <ErrorText>{error}</ErrorText> : null}
        {busy ? <Loading /> : null}
      </View>

      {results.length ? (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Results</Text>
          <Text style={styles.resultsCount}>{results.length}</Text>
        </View>
      ) : null}
    </View>
  )

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <FlatList
          ref={listRef}
          data={results}
          keyExtractor={(item) => item._id}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            !busy && hasQuery ? (
              <View style={styles.emptyCard}>
                <Ionicons name="search-outline" size={24} color={colors.muted} />
                <Text style={styles.emptyTitle}>No products found</Text>
                <Text style={styles.emptyCopy}>Try another SKU, barcode or a shorter product name.</Text>
              </View>
            ) : !busy ? (
              <View style={styles.tipCard}>
                <Text style={styles.tipCopy}>Search or scan to open a product. Exact barcode or SKU match opens immediately.</Text>
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.resultCard, pressed && styles.pressed]}
              onPress={() =>
                router.push({
                  pathname: '/product/[id]',
                  params: { id: item._id },
                })
              }
            >
              <View style={styles.resultTopRow}>
                <Text style={styles.resultName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.pricePill}>
                  <Text style={styles.priceText}>{item.price.toFixed(2)}</Text>
                </View>
              </View>
              <Text style={styles.resultMeta}>
                SKU {item.sku}
                {item.barcode ? ` - Barcode ${item.barcode}` : ''}
              </Text>
              <View style={styles.stockRow}>
                <View style={styles.stockPill}>
                  <Text style={styles.stockLabel}>Stock</Text>
                  <Text style={styles.stockValue}>{item.stock}</Text>
                </View>
                {item.availableQty != null ? (
                  <View style={styles.stockPill}>
                    <Text style={styles.stockLabel}>Available</Text>
                    <Text style={styles.stockValue}>{item.availableQty}</Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
          ListFooterComponent={<View style={styles.footerSpacer} />}
        />
      </KeyboardAvoidingView>
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onBarcode={onBarcodeScanned}
      />
    </Screen>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
  screen: {
    padding: 0,
  },
  keyboardAvoider: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerContent: {
    gap: 14,
  },
  tillLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tillLinkText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  lookupCard: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    padding: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    width: 46,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.bg,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsHeader: {
    marginTop: 6,
    marginBottom: -2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  resultsCount: {
    minWidth: 28,
    textAlign: 'center',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.inputBg,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resultCard: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    padding: 14,
    marginTop: 10,
  },
  resultTopRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  resultName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  pricePill: {
    backgroundColor: '#ecfdf5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priceText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '900',
  },
  resultMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 8,
  },
  stockRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stockLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  stockValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    padding: 20,
    marginTop: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  tipCard: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  tipCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.82,
  },
  footerSpacer: {
    height: 16,
  },
})
}
