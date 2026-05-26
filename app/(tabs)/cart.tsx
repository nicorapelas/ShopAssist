import { Ionicons } from '@expo/vector-icons'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { lookupProductTerm } from '@/src/api/productLookup'
import { createShopAssistCart } from '@/src/api/shopAssistCarts'
import type { ProductRow } from '@/src/api/types'
import { useShopAssistCart } from '@/src/cart/CartContext'
import { BarcodeScannerModal } from '@/src/components/BarcodeScannerModal'
import { SessionBar } from '@/src/components/SessionBar'
import { Btn, ErrorText, Input, Loading, Screen } from '@/src/components/ui'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

export default function CartScreen() {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const inputRef = useRef<TextInput>(null)
  const scrollRef = useRef<ScrollView>(null)
  const { lines, generatedCart, addProduct, setQuantity, removeProduct, clearCart, setGeneratedCart } =
    useShopAssistCart()
  const [term, setTerm] = useState('')
  const [matches, setMatches] = useState<ProductRow[]>([])
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrError, setQrError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity * line.product.price, 0),
    [lines],
  )
  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines])

  const addAndReset = useCallback(
    (product: ProductRow) => {
      addProduct(product)
      setTerm('')
      setMatches([])
      setError(null)
      setQrError(null)
    },
    [addProduct],
  )

  const runLookup = useCallback(
    async (raw: string) => {
      const q = raw.trim()
      if (!q) return
      setBusy(true)
      setError(null)
      try {
        const result = await lookupProductTerm(q)
        if (result.kind === 'exact') {
          addAndReset(result.product)
          return
        }
        if (result.kind === 'list') {
          setMatches(result.products)
          return
        }
        setMatches([])
        setError('No product found for that code.')
      } catch (e) {
        setMatches([])
        setError(e instanceof Error ? e.message : 'Lookup failed')
      } finally {
        setBusy(false)
      }
    },
    [addAndReset],
  )

  async function generateQr() {
    if (!lines.length) return
    setSaving(true)
    setQrError(null)
    try {
      const cart = await createShopAssistCart(
        lines.map((line) => ({ productId: line.product._id, quantity: line.quantity })),
      )
      setGeneratedCart(cart)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    } catch (e) {
      setQrError(e instanceof Error ? e.message : 'Could not create cart QR')
    } finally {
      setSaving(false)
    }
  }

  function onSubmit() {
    void runLookup(term)
    inputRef.current?.blur()
  }

  function onBarcodeScanned(value: string) {
    setScannerOpen(false)
    setTerm(value)
    void runLookup(value)
  }

  return (
    <Screen style={styles.screen}>
      <SessionBar />
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="cart-outline" size={30} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>ShopAssist Cart</Text>
          <Text style={styles.heroCopy}>
            Scan items while walking the floor, generate a QR code, then import this cart at POS.
          </Text>
          <Btn
            label="Scan item"
            onPress={() => {
              setError(null)
              setScannerOpen(true)
            }}
            disabled={busy}
          />
        </View>

        <View style={styles.lookupCard}>
          <Text style={styles.sectionTitle}>Add item</Text>
          <View style={styles.inputRow}>
            <Input
              ref={inputRef}
              value={term}
              onChangeText={setTerm}
              placeholder="SKU, barcode, or product name"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={onSubmit}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Find product"
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
          </View>
          {error ? <ErrorText>{error}</ErrorText> : null}
          {busy ? <Loading /> : null}
          {matches.length ? (
            <FlatList
              scrollEnabled={false}
              data={matches}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable style={styles.matchRow} onPress={() => addAndReset(item)}>
                  <View style={styles.matchText}>
                    <Text style={styles.matchName}>{item.name}</Text>
                    <Text style={styles.matchMeta}>SKU {item.sku}</Text>
                  </View>
                  <Ionicons name="add-circle" size={26} color={colors.primary} />
                </Pressable>
              )}
            />
          ) : null}
        </View>

        <View style={styles.cartHeader}>
          <Text style={styles.sectionTitle}>Cart</Text>
          <Text style={styles.cartSummary}>
            {itemCount} item{itemCount === 1 ? '' : 's'} - {total.toFixed(2)}
          </Text>
        </View>

        {lines.length ? (
          lines.map((line) => (
            <View key={line.product._id} style={styles.cartLine}>
              <View style={styles.lineMain}>
                <Text style={styles.lineName}>{line.product.name}</Text>
                <Text style={styles.lineMeta}>
                  SKU {line.product.sku} - {line.product.price.toFixed(2)}
                </Text>
              </View>
              <View style={styles.qtyControls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                  style={styles.qtyButton}
                  onPress={() => setQuantity(line.product._id, line.quantity - 1)}
                >
                  <Ionicons name="remove" size={18} color={colors.text} />
                </Pressable>
                <Text style={styles.qtyText}>{line.quantity}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                  style={styles.qtyButton}
                  onPress={() => setQuantity(line.product._id, line.quantity + 1)}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove item"
                  style={styles.removeButton}
                  onPress={() => removeProduct(line.product._id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCart}>
            <Ionicons name="basket-outline" size={28} color={colors.muted} />
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptyCopy}>Scan or search for items to prepare a POS cart.</Text>
          </View>
        )}

        {lines.length ? (
          <>
            <Btn
              label={saving ? 'Generating...' : generatedCart ? 'QR ready' : 'Generate POS QR'}
              onPress={() => void generateQr()}
              disabled={saving || Boolean(generatedCart)}
            />
            {saving ? <Text style={styles.qrStatus}>Creating secure cart token...</Text> : null}
            {generatedCart?.qrPayload ? (
              <Text style={styles.qrStatus}>QR code generated below. Scan it at the POS.</Text>
            ) : null}
            {generatedCart && !generatedCart.qrPayload ? (
              <Text style={styles.qrWarning}>Cart was created, but the server did not return a QR payload.</Text>
            ) : null}
            {qrError ? <Text style={styles.qrWarning}>{qrError}</Text> : null}
            <Btn label="Clear cart" variant="ghost" onPress={clearCart} disabled={saving} />
          </>
        ) : null}

        {generatedCart?.qrPayload ? (
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Scan this at POS</Text>
            <View style={styles.qrWrap}>
              <QRCode value={generatedCart.qrPayload} size={220} />
            </View>
            <Text style={styles.qrMeta}>
              Expires {new Date(generatedCart.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.qrPayload} selectable>
              {generatedCart.qrPayload}
            </Text>
          </View>
        ) : null}
      </ScrollView>

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
  content: {
    padding: 18,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  heroCopy: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  lookupCard: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  input: {
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
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: colors.borderWidth,
    borderTopColor: colors.border,
    paddingVertical: 12,
    gap: 12,
  },
  matchText: {
    flex: 1,
  },
  matchName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  matchMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartSummary: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  cartLine: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  lineMain: {
    marginBottom: 12,
  },
  lineName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  lineMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.bg,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  removeButton: {
    marginLeft: 'auto',
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCart: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
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
  qrCard: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    marginTop: 14,
  },
  qrTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  qrWrap: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 18,
  },
  qrMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 12,
  },
  qrPayload: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  qrStatus: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  qrWarning: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  pressed: {
    opacity: 0.82,
  },
})
}
