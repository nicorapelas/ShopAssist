import { Stack, router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { apiFetch } from '@/src/api/client'
import type { ProductRow } from '@/src/api/types'
import { useAuth } from '@/src/auth/AuthContext'
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

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
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

  async function save() {
    if (!id || !product) return
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
      setNotice('Saved — tills will refresh catalog within about a minute.')
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
              <Input value={name} onChangeText={setName} />
              <FieldLabel>Price (VAT inclusive)</FieldLabel>
              <Input value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
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
              <Input value={barcode} onChangeText={setBarcode} autoCapitalize="none" />
              {tracksStock ? (
                <>
                  <FieldLabel>Stock on hand</FieldLabel>
                  <Input value={stock} onChangeText={setStock} keyboardType="number-pad" />
                </>
              ) : (
                <Muted>This item does not track inventory.</Muted>
              )}
            </>
          ) : (
            <Muted>Read-only — you need catalog.write to adjust stock or barcode.</Muted>
          )}

          {error ? <ErrorText>{error}</ErrorText> : null}
          {notice ? <Muted>{notice}</Muted> : null}

          {(canStock || canPricing) && (
            <Btn
              label={saving ? 'Saving…' : 'Save changes'}
              onPress={() => void save()}
              disabled={saving}
            />
          )}
          <Btn
            label="Back to search"
            variant="ghost"
            onPress={() => {
              if (notice) router.back()
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
    </Screen>
  )
}
