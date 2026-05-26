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
import { useAuth } from '@/src/auth/AuthContext'
import { BarcodeScannerModal } from '@/src/components/BarcodeScannerModal'
import { SessionBar } from '@/src/components/SessionBar'
import { ErrorText, Input, Loading, Screen } from '@/src/components/ui'
import type { ShopAssistColors, ShopAssistTheme } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

export default function ScanScreen() {
  const { user } = useAuth()
  const { colors, theme } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors, theme), [colors, theme])
  const inputRef = useRef<TextInput>(null)
  const listRef = useRef<FlatList<ProductRow>>(null)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<ProductRow[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const hasQuery = q.trim().length > 0

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
      listRef.current?.scrollToOffset({ offset: 170, animated: true })
    }, 80)
  }

  const listHeader = (
    <View style={styles.headerContent}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="scan-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.userPill}>
            <Ionicons name="person-outline" size={14} color={colors.muted} />
            <Text style={styles.userPillText}>{user?.role ?? 'staff'}</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Scan a barcode</Text>
        <Text style={styles.heroCopy}>
          Point the camera at an item barcode to jump straight to stock, price and product details.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open barcode scanner"
          disabled={busy}
          onPress={() => {
            setError(null)
            setScannerOpen(true)
          }}
          style={({ pressed }) => [styles.scanButton, (pressed || busy) && styles.pressed]}
        >
          <Ionicons name="barcode" size={28} color={colors.primaryText} />
          <Text style={styles.scanButtonText}>Start scanning</Text>
        </Pressable>
      </View>

      <View style={styles.lookupCard}>
        <Text style={styles.sectionLabel}>Manual lookup</Text>
        <Text style={styles.lookupCopy}>Search by SKU, barcode or product name when the code will not scan.</Text>
        <View style={styles.inputRow}>
          <Input
            ref={inputRef}
            value={q}
            onChangeText={setQ}
            placeholder="SKU, barcode, or product name"
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
      <SessionBar />
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
                <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
                <View style={styles.tipTextWrap}>
                  <Text style={styles.tipTitle}>Ready for the shop floor</Text>
                  <Text style={styles.tipCopy}>Scanned products open instantly when there is an exact match.</Text>
                </View>
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

function makeStyles(colors: ShopAssistColors, theme: ShopAssistTheme) {
  const isHighContrastTheme = theme === 'dark' || theme === 'ubuntu' || theme === 'elon' || theme === 'lego'
  const tipBg =
    theme === 'lego'
      ? '#172554'
      : theme === 'ubuntu'
        ? '#3b164f'
        : theme === 'elon'
          ? '#0f172a'
          : theme === 'dark'
            ? '#1e293b'
            : colors.panel

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
  heroCard: {
    backgroundColor: colors.panel,
    borderRadius: 24,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    padding: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  userPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  scanButton: {
    marginTop: 18,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  scanButtonText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: '800',
  },
  lookupCard: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    padding: 14,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  lookupCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
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
    flexDirection: 'row',
    gap: 12,
    backgroundColor: tipBg,
    borderWidth: isHighContrastTheme ? 1 : 0,
    borderColor: colors.primary,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  tipCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.82,
  },
  footerSpacer: {
    height: 16,
  },
})
}
