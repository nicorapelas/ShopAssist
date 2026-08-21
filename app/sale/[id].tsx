import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { emailSale, getSale, getStoreInvoiceMeta } from '@/src/api/sales'
import type { SaleSummary } from '@/src/api/types'
import { InvoicePreview, receiptDocumentNumber } from '@/src/components/InvoicePreview'
import { SuccessModal } from '@/src/components/SuccessModal'
import { invoiceColors as colors } from '@/src/theme'

export default function SaleInvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const saleId = String(id ?? '').trim()

  const [sale, setSale] = useState<SaleSummary | null>(null)
  const [storeMeta, setStoreMeta] = useState({
    storeName: 'Store',
    storeAddressLines: [] as string[],
    storePhone: '',
    vatRate: 0.14,
    storeVatNumber: '',
  })
  const [loading, setLoading] = useState(true)
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentPopup, setSentPopup] = useState<{ to: string } | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  const scrollEmailIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const [data, meta] = await Promise.all([getSale(saleId), getStoreInvoiceMeta()])
        if (cancelled) return
        setSale(data)
        setStoreMeta(meta)
        const haEmail = data.houseAccount?.email?.trim()
        if (haEmail) setTo((prev) => prev || haEmail)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Sale not found')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [saleId])

  const onSend = useCallback(async () => {
    setError(null)
    setBusy(true)
    try {
      const res = await emailSale(saleId, to.trim(), message.trim() || undefined)
      setSentPopup({ to: res.to })
      setShowEmail(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setBusy(false)
    }
  }, [saleId, to, message])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} size="large" />
      </View>
    )
  }

  const docNo = receiptDocumentNumber(sale?.saleId, sale?._id || saleId)

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 24}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.pad}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        {sale ? (
          <InvoicePreview
            storeName={storeMeta.storeName}
            storeAddressLines={storeMeta.storeAddressLines}
            storePhone={storeMeta.storePhone}
            storeVatNumber={storeMeta.storeVatNumber}
            vatRate={storeMeta.vatRate}
            documentNumber={docNo}
            createdAt={sale.createdAt}
            items={(sale.items ?? []).map((l) => ({
              name: l.name,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              lineTotal: l.lineTotal,
            }))}
            total={sale.total}
            note={message.trim() || undefined}
            houseAccount={sale.houseAccount}
          />
        ) : (
          <Text style={styles.error}>{error || 'Sale not found'}</Text>
        )}

        {sale ? (
          <View style={styles.actions}>
            {!showEmail ? (
              <Pressable
                style={styles.btn}
                onPress={() => {
                  setShowEmail(true)
                  scrollEmailIntoView()
                }}
              >
                <Text style={styles.btnText}>Email invoice</Text>
              </Pressable>
            ) : (
              <View style={styles.emailBox}>
                <Text style={styles.sectionTitle}>Email invoice</Text>
                <Text style={styles.label}>Customer email</Text>
                <TextInput
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={to}
                  onChangeText={setTo}
                  placeholder="customer@example.com"
                  placeholderTextColor={colors.muted}
                  onFocus={scrollEmailIntoView}
                />

                <Text style={styles.label}>Note (optional · shown on invoice)</Text>
                <TextInput
                  style={[styles.input, styles.note]}
                  multiline
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Thanks for your business"
                  placeholderTextColor={colors.muted}
                  onFocus={scrollEmailIntoView}
                  blurOnSubmit={false}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={[styles.btn, (busy || !to.trim()) && styles.btnDisabled]}
                  disabled={busy || !to.trim()}
                  onPress={() => void onSend()}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Send invoice email</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
      <SuccessModal
        visible={!!sentPopup}
        title="Email sent successfully"
        message={sentPopup ? `Invoice emailed to ${sentPopup.to}` : undefined}
        onClose={() => setSentPopup(null)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  pad: { padding: 16, paddingBottom: 160, flexGrow: 1 },
  actions: { marginTop: 16 },
  emailBox: {
    marginTop: 4,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  label: { fontWeight: '600', color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    color: colors.text,
    backgroundColor: colors.panel,
  },
  note: { minHeight: 88, textAlignVertical: 'top' },
  btn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: colors.danger, marginBottom: 10 },
})
