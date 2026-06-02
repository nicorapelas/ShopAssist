import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { apiFetch } from '@/src/api/client'
import type { ProductRow, StockAdjustmentRow } from '@/src/api/types'
import { useAuth } from '@/src/auth/AuthContext'
import { useShopAssistCart } from '@/src/cart/CartContext'
import {
  Btn,
  ErrorText,
  FieldLabel,
  Input,
  Loading,
  Muted,
  Screen,
} from '@/src/components/ui'
import { canEditPricingFields, canEditStockFields } from '@/src/permissions'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

function stockAdjustmentSourceLabel(sourceApp: string): string {
  switch (sourceApp) {
    case 'shop-assist':
      return 'ShopAssist'
    case 'back-office':
      return 'Back Office'
    case 'pos':
      return 'POS'
    case 'scan':
      return 'Scan'
    default:
      return 'Unknown'
  }
}

function stockAdjustmentUserLabel(row: StockAdjustmentRow): string {
  return row.changedByDisplayName?.trim() || row.changedByEmail
}

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { addProduct } = useShopAssistCart()
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const canStock = canEditStockFields(user)
  const canPricing = canEditPricingFields(user)

  const [product, setProduct] = useState<ProductRow | null>(null)
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [stockHistory, setStockHistory] = useState<StockAdjustmentRow[]>([])
  const [stockHistoryBusy, setStockHistoryBusy] = useState(false)

  const loadStockHistory = useCallback(async () => {
    if (!id || !canStock) {
      setStockHistory([])
      return
    }
    setStockHistoryBusy(true)
    try {
      const rows = await apiFetch<StockAdjustmentRow[]>(
        `/products/${encodeURIComponent(id)}/stock-adjustments?limit=10`,
      )
      setStockHistory(rows)
    } catch {
      setStockHistory([])
    } finally {
      setStockHistoryBusy(false)
    }
  }, [id, canStock])

  const load = useCallback(async () => {
    if (!id) return
    setBusy(true)
    setError(null)
    try {
      const p = await apiFetch<ProductRow>(`/products/${encodeURIComponent(id)}`)
      setProduct(p)
      setName(p.name)
      setBarcode(p.barcode ?? '')
      setPrice(String(p.price))
      setStock(String(p.stock))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load product')
    } finally {
      setBusy(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadStockHistory()
  }, [loadStockHistory])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  async function save() {
    if (!id || !product) return
    Keyboard.dismiss()
    if (!canStock && !canPricing) {
      setError('You do not have permission to edit products (catalog.write).')
      return
    }
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const body: Record<string, unknown> = {}
      if (canPricing) {
        body.name = name.trim()
        const p = Number(price.replace(',', '.'))
        if (!Number.isFinite(p) || p < 0) {
          throw new Error('Price must be a number ≥ 0')
        }
        body.price = Math.round(p * 100) / 100
      }
      if (canStock) {
        body.barcode = barcode.trim() || null
        if (product.trackInventory !== false) {
          const s = Math.floor(Number(stock.replace(',', '.')) || 0)
          if (s < 0) throw new Error('Stock must be ≥ 0')
          body.stock = s
        }
      }
      const updated = await apiFetch<ProductRow>(`/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setProduct(updated)
      setName(updated.name)
      setBarcode(updated.barcode ?? '')
      setPrice(String(updated.price))
      setStock(String(updated.stock))
      setNotice('Saved successfully')
      void loadStockHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (busy && !product) {
    return (
      <Screen>
        <Loading />
      </Screen>
    )
  }

  if (!product) {
    return (
      <Screen>
        {error ? <ErrorText>{error}</ErrorText> : <Muted>Product not found.</Muted>}
        <Btn label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    )
  }

  const tracksStock = product.trackInventory !== false
  const hasChanges =
    (canPricing && (name !== product.name || price !== String(product.price))) ||
    (canStock &&
      (barcode !== (product.barcode ?? '') || (tracksStock && stock !== String(product.stock))))

  return (
    <Screen style={{ paddingTop: 0 }}>
      <Stack.Screen options={{ title: product.sku }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Muted>
            {product.subCategory
              ? `${product.category ?? '—'} / ${product.subCategory}`
              : (product.category ?? '—')}
          </Muted>
          {product.layByReservedQty ? (
            <Muted>
              {`Lay-by reserved: ${product.layByReservedQty} · Available: ${product.availableQty ?? '—'}`}
            </Muted>
          ) : null}

          {canPricing ? (
            <>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={name}
                onChangeText={(value) => {
                  setName(value)
                  setNotice(null)
                }}
              />
              <FieldLabel>Price (VAT inclusive)</FieldLabel>
              <Input
                value={price}
                onChangeText={(value) => {
                  setPrice(value)
                  setNotice(null)
                }}
                keyboardType="decimal-pad"
              />
            </>
          ) : (
            <>
              <FieldLabel>Name</FieldLabel>
              <Muted>{product.name}</Muted>
              <FieldLabel>Price</FieldLabel>
              <Muted>{product.price.toFixed(2)}</Muted>
            </>
          )}

          {canStock ? (
            <>
              <FieldLabel>Barcode</FieldLabel>
              <Input
                value={barcode}
                onChangeText={(value) => {
                  setBarcode(value)
                  setNotice(null)
                }}
                autoCapitalize="none"
              />
              {tracksStock ? (
                <>
                  <FieldLabel>Stock on hand</FieldLabel>
                  <Input
                    value={stock}
                    onChangeText={(value) => {
                      setStock(value)
                      setNotice(null)
                    }}
                    keyboardType="number-pad"
                  />
                  <FieldLabel>Recent stock changes</FieldLabel>
                  {stockHistoryBusy ? (
                    <Muted>Loading history…</Muted>
                  ) : stockHistory.length === 0 ? (
                    <Muted>No recorded stock changes yet.</Muted>
                  ) : (
                    stockHistory.map((row) => (
                      <View key={row._id} style={styles.historyRow}>
                        <Text style={styles.historyMeta}>
                          {new Date(row.createdAt).toLocaleString()} · {stockAdjustmentUserLabel(row)} ·{' '}
                          {stockAdjustmentSourceLabel(row.sourceApp)}
                        </Text>
                        <Text style={styles.historyDelta}>
                          {row.fromStock} → {row.toStock} ({row.delta >= 0 ? '+' : ''}
                          {row.delta})
                        </Text>
                      </View>
                    ))
                  )}
                </>
              ) : (
                <Muted>This item does not track inventory.</Muted>
              )}
            </>
          ) : (
            <Muted>Read-only — you need catalog.write to adjust stock or barcode.</Muted>
          )}

          {error ? <ErrorText>{error}</ErrorText> : null}

          <Btn
            label="Add to cart"
            variant="ghost"
            onPress={() => {
              addProduct(product)
              setNotice('Added to cart')
            }}
            disabled={!canStock}
          />

          {(canStock || canPricing) && (
            <Btn
              label={saving ? 'Saving…' : 'Save changes'}
              onPress={() => void save()}
              disabled={saving || !hasChanges}
            />
          )}
          <Btn
            label="Back to search"
            variant="ghost"
            onPress={() => {
              if (!hasChanges) router.back()
              else {
                Alert.alert('Discard?', 'Go back without saving?', [
                  { text: 'Stay', style: 'cancel' },
                  { text: 'Back', onPress: () => router.back() },
                ])
              }
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      {notice ? (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{notice}</Text>
        </View>
      ) : null}
    </Screen>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
    borderWidth: colors.borderWidth,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  toastText: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  historyRow: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    backgroundColor: colors.panel,
  },
  historyMeta: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 4,
  },
  historyDelta: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
})
}
