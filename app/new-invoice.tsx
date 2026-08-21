import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { lookupProductTerm } from '@/src/api/productLookup'
import {
  createCatalogSale,
  createHouseAccount,
  getStoreInvoiceMeta,
  searchHouseAccounts,
  type SaleSettlement,
} from '@/src/api/sales'
import type { HouseAccountRow, ProductRow } from '@/src/api/types'
import { useAuth } from '@/src/auth/AuthContext'
import { BarcodeScannerModal } from '@/src/components/BarcodeScannerModal'
import { InvoicePreview } from '@/src/components/InvoicePreview'
import { canUseHouseAccounts } from '@/src/permissions'
import { invoiceColors as colors } from '@/src/theme'

function money(n: number) {
  return `R ${Number(n || 0).toFixed(2)}`
}

type CartLine = {
  productId: string
  name: string
  sku: string
  unitPrice: number
  quantity: number
  availableQty: number | null
  trackInventory: boolean
}

type Phase = 'items' | 'settle'
/** No defaults — user must pick. */
type SettlePath = null | 'paid' | 'on_account'
type PaidMethod = null | 'cash' | 'card'

function availableOf(p: ProductRow): number | null {
  if (p.availableQty != null && Number.isFinite(p.availableQty)) return Number(p.availableQty)
  if (p.trackInventory === false) return null
  return Number(p.stock ?? 0)
}

export default function NewInvoiceScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const allowOnAccount = canUseHouseAccounts(user)
  const [phase, setPhase] = useState<Phase>('items')
  const [scannerOpen, setScannerOpen] = useState(false)

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ProductRow[]>([])
  const [searchHint, setSearchHint] = useState<string | null>(null)
  const [cart, setCart] = useState<CartLine[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [storeMeta, setStoreMeta] = useState({
    storeName: 'Store',
    storeAddressLines: [] as string[],
    storePhone: '',
    vatRate: 0.14,
    storeVatNumber: '',
  })
  const searchSeq = useRef(0)

  // Settle — all start unset so we query the user
  const [settlePath, setSettlePath] = useState<SettlePath>(null)
  const [paidMethod, setPaidMethod] = useState<PaidMethod>(null)
  const [accountQuery, setAccountQuery] = useState('')
  const [accountSearching, setAccountSearching] = useState(false)
  const [accountResults, setAccountResults] = useState<HouseAccountRow[]>([])
  const [accountLookupError, setAccountLookupError] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<HouseAccountRow | null>(null)
  const [poNumber, setPoNumber] = useState('')
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [newAcctName, setNewAcctName] = useState('')
  const [newAcctPhone, setNewAcctPhone] = useState('')
  const [newAcctEmail, setNewAcctEmail] = useState('')
  const accountSeq = useRef(0)

  useEffect(() => {
    void getStoreInvoiceMeta().then(setStoreMeta)
  }, [])

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [cart],
  )

  useEffect(() => {
    const trimmed = query.trim()
    if (phase !== 'items' || trimmed.length < 1) {
      setResults([])
      setSearchHint(null)
      setSearching(false)
      return
    }

    const seq = ++searchSeq.current
    setSearching(true)
    const t = setTimeout(() => {
      void (async () => {
        try {
          const found = await lookupProductTerm(trimmed)
          if (seq !== searchSeq.current) return
          if (found.kind === 'exact') {
            setResults([found.product])
            setSearchHint(null)
          } else if (found.kind === 'list') {
            setResults(found.products)
            setSearchHint(null)
          } else {
            setResults([])
            setSearchHint('No products match')
          }
        } catch (e) {
          if (seq !== searchSeq.current) return
          setResults([])
          setSearchHint(e instanceof Error ? e.message : 'Search failed')
        } finally {
          if (seq === searchSeq.current) setSearching(false)
        }
      })()
    }, 280)

    return () => clearTimeout(t)
  }, [query, phase])

  useEffect(() => {
    if (phase !== 'settle' || settlePath !== 'on_account') return
    const trimmed = accountQuery.trim()
    const seq = ++accountSeq.current
    setAccountSearching(true)
    setAccountLookupError(null)
    const t = setTimeout(() => {
      void (async () => {
        try {
          const rows = await searchHouseAccounts(trimmed, 100)
          if (seq !== accountSeq.current) return
          setAccountResults(rows)
          if (rows.length === 0) {
            setAccountLookupError(
              trimmed
                ? `No active house accounts match “${trimmed}”.`
                : 'No active house accounts on this shop.',
            )
          }
        } catch (e) {
          if (seq !== accountSeq.current) return
          setAccountResults([])
          const msg = e instanceof Error ? e.message : 'Account search failed'
          setAccountLookupError(
            /permission|403|forbidden/i.test(msg)
              ? `${msg} — your user needs house_accounts.access.`
              : msg,
          )
          setError(msg)
        } finally {
          if (seq === accountSeq.current) setAccountSearching(false)
        }
      })()
    }, 280)
    return () => clearTimeout(t)
  }, [accountQuery, phase, settlePath])

  const addProduct = useCallback((p: ProductRow) => {
    setError(null)
    const unitPrice = Math.round(Number(p.price ?? 0) * 100) / 100
    const available = availableOf(p)
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p._id)
      if (existing) {
        const nextQty = existing.quantity + 1
        if (available != null && nextQty > available) {
          setError(`Only ${available} available for ${p.sku}`)
          return prev
        }
        return prev.map((l) => (l.productId === p._id ? { ...l, quantity: nextQty } : l))
      }
      if (available != null && available < 1) {
        setError(`Out of stock: ${p.sku}`)
        return prev
      }
      return [
        ...prev,
        {
          productId: p._id,
          name: p.name,
          sku: p.sku,
          unitPrice,
          quantity: 1,
          availableQty: available,
          trackInventory: p.trackInventory !== false,
        },
      ]
    })
  }, [])

  const setQty = (productId: string, quantity: number) => {
    setError(null)
    if (quantity < 1) {
      setCart((prev) => prev.filter((l) => l.productId !== productId))
      return
    }
    setCart((prev) =>
      prev.map((l) => {
        if (l.productId !== productId) return l
        if (l.availableQty != null && quantity > l.availableQty) {
          setError(`Only ${l.availableQty} available for ${l.sku}`)
          return l
        }
        return { ...l, quantity }
      }),
    )
  }

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId))
  }

  const goToSettle = () => {
    setError(null)
    if (cart.length === 0) {
      setError('Add at least one catalog item')
      return
    }
    setSettlePath(null)
    setPaidMethod(null)
    setSelectedAccount(null)
    setPoNumber('')
    setShowCreateAccount(false)
    setPhase('settle')
  }

  const settlementReady = useMemo(() => {
    if (settlePath === 'paid') return paidMethod === 'cash' || paidMethod === 'card'
    if (settlePath === 'on_account') {
      return Boolean(selectedAccount?._id && poNumber.trim().length > 0)
    }
    return false
  }, [settlePath, paidMethod, selectedAccount, poNumber])

  const settlementSummary = useMemo(() => {
    if (settlePath === 'paid' && paidMethod) {
      return `Paid now · ${paidMethod === 'cash' ? 'Cash' : 'Card'} · ${money(total)}`
    }
    if (settlePath === 'on_account' && selectedAccount) {
      return `On account · ${selectedAccount.accountNumber} ${selectedAccount.name} · PO ${poNumber.trim() || '—'} · ${money(total)}`
    }
    return null
  }, [settlePath, paidMethod, selectedAccount, poNumber, total])

  const buildSettlement = useCallback((): SaleSettlement | null => {
    if (settlePath === 'paid' && paidMethod === 'cash') return { kind: 'cash', total }
    if (settlePath === 'paid' && paidMethod === 'card') return { kind: 'card', total }
    if (settlePath === 'on_account' && selectedAccount && poNumber.trim()) {
      return {
        kind: 'on_account',
        total,
        houseAccountId: selectedAccount._id,
        purchaseOrderNumber: poNumber.trim(),
      }
    }
    return null
  }, [settlePath, paidMethod, selectedAccount, poNumber, total])

  const onCreate = useCallback(async () => {
    setError(null)
    const settlement = buildSettlement()
    if (!settlement) {
      setError('Answer how this invoice is settled before creating')
      return
    }
    setBusy(true)
    try {
      const result = await createCatalogSale(
        cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        settlement,
      )
      const saleRef = result.saleId || String(result._id)
      Alert.alert('Invoice created', `Doc ${saleRef}\n${settlementSummary ?? ''}`, [
        {
          text: 'Preview / email',
          onPress: () => router.replace(`/sale/${saleRef}`),
        },
        { text: 'Done', onPress: () => router.back() },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create invoice')
    } finally {
      setBusy(false)
    }
  }, [buildSettlement, cart, settlementSummary, router])

  const onCreateAccount = useCallback(async () => {
    setError(null)
    const name = newAcctName.trim()
    if (!name) {
      setError('Account name is required')
      return
    }
    setBusy(true)
    try {
      const created = await createHouseAccount({
        name,
        phone: newAcctPhone,
        email: newAcctEmail,
      })
      setSelectedAccount(created)
      setShowCreateAccount(false)
      setNewAcctName('')
      setNewAcctPhone('')
      setNewAcctEmail('')
      setAccountQuery(created.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create account')
    } finally {
      setBusy(false)
    }
  }, [newAcctName, newAcctPhone, newAcctEmail])

  const choiceBtn = (active: boolean) => [styles.choice, active && styles.choiceActive]
  const choiceText = (active: boolean) => [styles.choiceText, active && styles.choiceTextActive]

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {phase === 'items' ? (
        <>
          <View style={styles.searchBlock}>
            <Text style={styles.heading}>New invoice</Text>
            <Text style={styles.sub}>1 · Add catalog items</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.input, styles.searchInput]}
                value={query}
                onChangeText={setQuery}
                placeholder="SKU, barcode, or name"
                placeholderTextColor={colors.muted}
                autoCorrect={false}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Scan barcode"
                onPress={() => setScannerOpen(true)}
                style={styles.scanBtn}
              >
                <Ionicons name="barcode-outline" size={22} color="#fff" />
              </Pressable>
            </View>
            {searching ? <ActivityIndicator color={colors.brand} style={{ marginTop: 8 }} /> : null}
            {searchHint ? <Text style={styles.hint}>{searchHint}</Text> : null}
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
            ListEmptyComponent={
              <Text style={styles.emptyHelp}>
                Pick products from the store catalog, then settle how this invoice is paid.
              </Text>
            }
            renderItem={({ item }) => {
              const avail = availableOf(item)
              return (
                <Pressable style={styles.resultRow} onPress={() => addProduct(item)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{item.name}</Text>
                    <Text style={styles.resultMeta}>
                      {item.sku}
                      {avail != null ? ` · ${avail} avail` : ' · no stock track'}
                    </Text>
                  </View>
                  <Text style={styles.resultPrice}>{money(item.price)}</Text>
                  <Text style={styles.addMark}>+</Text>
                </Pressable>
              )
            }}
          />

          <View style={styles.cart}>
            <Text style={styles.cartTitle}>Lines ({cart.length})</Text>
            {cart.length === 0 ? (
              <Text style={styles.cartEmpty}>No items yet</Text>
            ) : (
              cart.map((l) => (
                <View key={l.productId} style={styles.cartRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartName} numberOfLines={1}>
                      {l.name}
                    </Text>
                    <Text style={styles.cartMeta}>
                      {l.sku} · {money(l.unitPrice)}
                    </Text>
                  </View>
                  <View style={styles.qtyControls}>
                    <Pressable style={styles.qtyBtn} onPress={() => setQty(l.productId, l.quantity - 1)}>
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <Text style={styles.qty}>{l.quantity}</Text>
                    <Pressable style={styles.qtyBtn} onPress={() => setQty(l.productId, l.quantity + 1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => removeLine(l.productId)}>
                    <Text style={styles.remove}>✕</Text>
                  </Pressable>
                </View>
              ))
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[styles.previewBtn, cart.length === 0 && styles.disabled]}
              disabled={cart.length === 0}
              onPress={() => setPreviewOpen(true)}
            >
              <Text style={styles.previewBtnText}>Preview invoice</Text>
            </Pressable>

            <Pressable
              style={[styles.submitBtn, cart.length === 0 && styles.disabled]}
              disabled={cart.length === 0}
              onPress={goToSettle}
            >
              <Text style={styles.submitText}>Continue · settle invoice</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.settlePad}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => setPhase('items')}>
            <Text style={styles.backLink}>← Back to items</Text>
          </Pressable>
          <Text style={styles.heading}>Settle invoice</Text>
          <Text style={styles.sub}>2 · How is this invoice settled? ({money(total)})</Text>

          <Text style={styles.question}>
            {allowOnAccount
              ? 'Is this invoice paid now, or charged to a house account?'
              : 'How is this invoice paid?'}
          </Text>
          <View style={styles.choiceRow}>
            <Pressable
              style={choiceBtn(settlePath === 'paid')}
              onPress={() => {
                setSettlePath('paid')
                setPaidMethod(null)
                setSelectedAccount(null)
                setError(null)
              }}
            >
              <Text style={choiceText(settlePath === 'paid')}>Paid now</Text>
            </Pressable>
            {allowOnAccount ? (
              <Pressable
                style={choiceBtn(settlePath === 'on_account')}
                onPress={() => {
                  setSettlePath('on_account')
                  setPaidMethod(null)
                  setError(null)
                }}
              >
                <Text style={choiceText(settlePath === 'on_account')}>On account</Text>
              </Pressable>
            ) : null}
          </View>

          {settlePath === 'paid' ? (
            <View style={styles.block}>
              <Text style={styles.question}>How was it paid?</Text>
              <View style={styles.choiceRow}>
                <Pressable style={choiceBtn(paidMethod === 'cash')} onPress={() => setPaidMethod('cash')}>
                  <Text style={choiceText(paidMethod === 'cash')}>Cash</Text>
                </Pressable>
                <Pressable style={choiceBtn(paidMethod === 'card')} onPress={() => setPaidMethod('card')}>
                  <Text style={choiceText(paidMethod === 'card')}>Card</Text>
                </Pressable>
              </View>
              {!paidMethod ? <Text style={styles.hint}>Choose cash or card to continue.</Text> : null}
            </View>
          ) : null}

          {settlePath === 'on_account' && allowOnAccount ? (
            <View style={styles.block}>
              <Text style={styles.question}>Which house account?</Text>
              <Text style={styles.apiHint}>House accounts on this shop</Text>
              <TextInput
                style={styles.input}
                value={accountQuery}
                onChangeText={(t) => {
                  setAccountQuery(t)
                  setSelectedAccount(null)
                }}
                placeholder="Search name, account #, phone… (leave blank to list)"
                placeholderTextColor={colors.muted}
                autoCorrect={false}
              />
              {accountSearching ? <ActivityIndicator color={colors.brand} style={{ marginVertical: 8 }} /> : null}

              {accountLookupError && !selectedAccount ? (
                <Text style={styles.accountEmpty}>{accountLookupError}</Text>
              ) : null}

              {selectedAccount ? (
                <View style={styles.selectedAcct}>
                  <Text style={styles.resultName}>
                    {selectedAccount.accountNumber} · {selectedAccount.name}
                  </Text>
                  <Pressable onPress={() => setSelectedAccount(null)}>
                    <Text style={styles.backLink}>Change</Text>
                  </Pressable>
                </View>
              ) : (
                accountResults.slice(0, 12).map((a) => (
                  <Pressable
                    key={a._id}
                    style={styles.resultRow}
                    onPress={() => {
                      setSelectedAccount(a)
                      setShowCreateAccount(false)
                      setAccountLookupError(null)
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName}>
                        {a.accountNumber} · {a.name}
                      </Text>
                      <Text style={styles.resultMeta}>
                        {[a.phone, a.email].filter(Boolean).join(' · ') || 'No contact'}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}

              {!selectedAccount ? (
                <Pressable
                  style={styles.linkBtn}
                  onPress={() => {
                    setShowCreateAccount(true)
                    if (!newAcctName && accountQuery.trim()) setNewAcctName(accountQuery.trim())
                  }}
                >
                  <Text style={styles.linkBtnText}>Account not found · create new</Text>
                </Pressable>
              ) : null}

              {showCreateAccount && !selectedAccount ? (
                <View style={styles.createBox}>
                  <Text style={styles.question}>New house account</Text>
                  <TextInput
                    style={styles.input}
                    value={newAcctName}
                    onChangeText={setNewAcctName}
                    placeholder="Account / customer name *"
                    placeholderTextColor={colors.muted}
                  />
                  <TextInput
                    style={styles.input}
                    value={newAcctPhone}
                    onChangeText={setNewAcctPhone}
                    placeholder="Phone"
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.input}
                    value={newAcctEmail}
                    onChangeText={setNewAcctEmail}
                    placeholder="Email"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <Pressable
                    style={[styles.previewBtn, busy && styles.disabled]}
                    disabled={busy}
                    onPress={() => void onCreateAccount()}
                  >
                    {busy ? (
                      <ActivityIndicator color={colors.brand} />
                    ) : (
                      <Text style={styles.previewBtnText}>Create account</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              <Text style={[styles.question, { marginTop: 12 }]}>Purchase order / reference?</Text>
              <TextInput
                style={styles.input}
                value={poNumber}
                onChangeText={setPoNumber}
                placeholder="PO number (required)"
                placeholderTextColor={colors.muted}
              />
              {!selectedAccount || !poNumber.trim() ? (
                <Text style={styles.hint}>Select or create an account and enter a PO to continue.</Text>
              ) : null}
            </View>
          ) : null}

          {!settlePath ? (
            <Text style={styles.hint}>Choose paid now or on account — nothing is assumed.</Text>
          ) : null}

          {settlementSummary ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Ready to create</Text>
              <Text style={styles.summaryText}>{settlementSummary}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.previewBtn, cart.length === 0 && styles.disabled]}
            disabled={cart.length === 0}
            onPress={() => setPreviewOpen(true)}
          >
            <Text style={styles.previewBtnText}>Preview invoice</Text>
          </Pressable>

          <Pressable
            style={[styles.submitBtn, (!settlementReady || busy) && styles.disabled]}
            disabled={!settlementReady || busy}
            onPress={() => void onCreate()}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Create invoice</Text>
            )}
          </Pressable>
        </ScrollView>
      )}

      <Modal
        visible={previewOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPreviewOpen(false)}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Invoice preview</Text>
            <Pressable onPress={() => setPreviewOpen(false)}>
              <Text style={styles.modalClose}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <InvoicePreview
              draft
              storeName={storeMeta.storeName}
              storeAddressLines={storeMeta.storeAddressLines}
              storePhone={storeMeta.storePhone}
              storeVatNumber={storeMeta.storeVatNumber}
              vatRate={storeMeta.vatRate}
              documentNumber="(assigned on create)"
              createdAt={new Date()}
              items={cart.map((l) => ({
                name: l.name,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                lineTotal: l.unitPrice * l.quantity,
              }))}
              total={total}
              note={settlementSummary || undefined}
              houseAccount={
                settlePath === 'on_account' && selectedAccount
                  ? {
                      name: selectedAccount.name,
                      accountNumber: selectedAccount.accountNumber,
                      contactPerson: selectedAccount.contactPerson,
                      phone: selectedAccount.phone,
                      email: selectedAccount.email,
                      vatNumber: selectedAccount.vatNumber,
                      companyRegistrationNumber: selectedAccount.companyRegistrationNumber,
                      addressLines: selectedAccount.addressLines,
                      paymentTerms: selectedAccount.paymentTerms,
                      purchaseOrderNumber: poNumber.trim() || undefined,
                    }
                  : undefined
              }
            />
          </ScrollView>
        </View>
      </Modal>
      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onBarcode={(value) => {
          setScannerOpen(false)
          setQuery(value)
        }}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  searchBlock: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, marginBottom: 0 },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlePad: { padding: 16, paddingBottom: 48 },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text },
  sub: { color: colors.muted, marginBottom: 10, marginTop: 2 },
  backLink: { color: colors.brand, fontWeight: '700', marginBottom: 10 },
  question: { fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    color: colors.text,
    backgroundColor: colors.panel,
  },
  hint: { color: colors.muted, marginTop: 4, marginBottom: 8, fontSize: 13 },
  apiHint: { color: colors.muted, fontSize: 11, marginBottom: 8 },
  accountEmpty: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  emptyHelp: { color: colors.muted, paddingVertical: 16, lineHeight: 20 },
  choiceRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  choice: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.panel,
  },
  choiceActive: {
    borderColor: colors.brand,
    backgroundColor: '#ecfdf5',
  },
  choiceText: { fontWeight: '700', color: colors.text },
  choiceTextActive: { color: colors.brandDark },
  block: { marginTop: 8 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  resultName: { fontWeight: '700', color: colors.text },
  resultMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  resultPrice: { fontWeight: '700', color: colors.brandDark },
  addMark: { color: colors.brand, fontWeight: '800', fontSize: 20, paddingHorizontal: 4 },
  cart: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.panel,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  cartTitle: { fontWeight: '800', color: colors.text, marginBottom: 8 },
  cartEmpty: { color: colors.muted, marginBottom: 8 },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cartName: { fontWeight: '600', color: colors.text },
  cartMeta: { color: colors.muted, fontSize: 12 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: colors.text },
  qty: { minWidth: 20, textAlign: 'center', fontWeight: '700' },
  remove: { color: colors.danger, fontWeight: '700', padding: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.brandDark },
  error: { color: colors.danger, marginBottom: 8 },
  previewBtn: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  previewBtnText: { color: colors.brand, fontWeight: '700', fontSize: 16 },
  submitBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.55 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  selectedAcct: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  linkBtn: { paddingVertical: 10, marginBottom: 8 },
  linkBtnText: { color: colors.brand, fontWeight: '700' },
  createBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: colors.panel,
  },
  summaryBox: {
    backgroundColor: '#f0fdfa',
    borderRadius: 10,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  summaryLabel: { fontWeight: '800', color: colors.brandDark, marginBottom: 4 },
  summaryText: { color: colors.text, lineHeight: 20 },
  modalRoot: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 18 : 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.panel,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalClose: { color: colors.brand, fontWeight: '700', fontSize: 16 },
})
