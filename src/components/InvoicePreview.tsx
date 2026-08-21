import { Dimensions, Image, StyleSheet, Text, View } from 'react-native'
import { invoiceColors as colors } from '@/src/theme'
import type { HouseAccountInvoice } from '@/src/api/types'

const brandLogo = require('../../assets/images/LogoCosmic.png')

export type InvoicePreviewLine = {
  name: string
  quantity: number
  unitPrice: number
  lineTotal?: number
}

export type InvoicePreviewProps = {
  storeName?: string
  storeAddressLines?: string[]
  storePhone?: string
  storeVatNumber?: string
  /** Decimal, e.g. 0.14 for 14% (prices are VAT-inclusive). */
  vatRate?: number
  /** Same id printed on till receipts (saleId). */
  documentNumber: string
  createdAt?: string | Date | null
  items: InvoicePreviewLine[]
  total: number
  note?: string
  draft?: boolean
  houseAccount?: HouseAccountInvoice | null
}

function money(n: number) {
  return `R ${Number(n || 0).toFixed(2)}`
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function vatBreakdown(totalIncl: number, vatRate: number) {
  const incl = round2(Math.max(0, Number(totalIncl) || 0))
  const rate = Number.isFinite(vatRate) && vatRate > 0 ? vatRate : 0
  if (rate <= 0) {
    return { excl: incl, vat: 0, incl, ratePctLabel: '0%' }
  }
  const excl = round2(incl / (1 + rate))
  const vat = round2(incl - excl)
  return { excl, vat, incl, ratePctLabel: `${round2(rate * 100)}%` }
}

function formatWhen(raw?: string | Date | null) {
  if (!raw) return ''
  const d = raw instanceof Date ? raw : new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })
}

function paymentTermsLabel(raw?: string | null): string {
  const key = String(raw ?? '').trim()
  if (!key) return ''
  const labels: Record<string, string> = {
    cod: 'COD',
    '7_days': '7 days',
    '30_days': '30 days',
    end_of_month: 'End of month',
  }
  return labels[key] || key.replace(/_/g, ' ')
}

function houseAccountHasContent(ha?: HouseAccountInvoice | null): boolean {
  if (!ha) return false
  return Boolean(
    ha.name?.trim() ||
      ha.accountNumber?.trim() ||
      ha.contactPerson?.trim() ||
      ha.phone?.trim() ||
      ha.email?.trim() ||
      ha.vatNumber?.trim() ||
      ha.companyRegistrationNumber?.trim() ||
      ha.purchaseOrderNumber?.trim() ||
      (ha.addressLines ?? []).some((l) => String(l).trim()) ||
      ha.paymentTerms?.trim(),
  )
}

export function receiptDocumentNumber(saleId?: string | null, mongoId?: string | null) {
  const sid = typeof saleId === 'string' ? saleId.trim() : ''
  if (sid) return sid
  const id = typeof mongoId === 'string' ? mongoId.trim() : ''
  return id.length >= 8 ? id.slice(-8) : id || '—'
}

function HouseAccountBlock({ ha }: { ha: HouseAccountInvoice }) {
  const terms = paymentTermsLabel(ha.paymentTerms)
  const address = (ha.addressLines ?? []).map((l) => l.trim()).filter(Boolean)
  const row = (label: string, value?: string | null) => {
    const v = value?.trim()
    if (!v) return null
    return (
      <Text style={styles.haRow}>
        <Text style={styles.haLabel}>{label}: </Text>
        {v}
      </Text>
    )
  }
  return (
    <View style={styles.haBox}>
      <Text style={styles.haHeading}>HOUSE ACCOUNT</Text>
      {ha.name?.trim() ? <Text style={styles.haName}>{ha.name.trim()}</Text> : null}
      {row('Account no', ha.accountNumber)}
      {row('Contact', ha.contactPerson)}
      {row('Phone', ha.phone)}
      {row('Email', ha.email)}
      {row('VAT no', ha.vatNumber)}
      {row('Co. reg', ha.companyRegistrationNumber)}
      {address.map((line) => (
        <Text key={line} style={styles.haRow}>
          {line}
        </Text>
      ))}
      {row('Terms', terms)}
      {row('PO', ha.purchaseOrderNumber)}
    </View>
  )
}

export function InvoicePreview({
  storeName = 'Store',
  storeAddressLines = [],
  storePhone,
  storeVatNumber,
  vatRate = 0.14,
  documentNumber,
  createdAt,
  items,
  total,
  note,
  draft,
  houseAccount,
}: InvoicePreviewProps) {
  const when = formatWhen(createdAt)
  const vat = vatBreakdown(total, vatRate)
  const address = storeAddressLines.map((l) => l.trim()).filter(Boolean)

  return (
    <View style={styles.doc}>
      {draft ? <Text style={styles.draftBadge}>Preview · not saved yet</Text> : null}
      <Text style={styles.store}>{storeName}</Text>
      {address.map((line) => (
        <Text key={line} style={styles.addressLine}>
          {line}
        </Text>
      ))}
      {storePhone?.trim() ? <Text style={styles.contact}>Tel: {storePhone.trim()}</Text> : null}
      {storeVatNumber?.trim() ? (
        <Text style={styles.contact}>VAT no: {storeVatNumber.trim()}</Text>
      ) : null}

      <Text style={styles.docTitle}>TAX INVOICE</Text>
      <Text style={styles.docNo}>
        Document no: <Text style={styles.docNoValue}>{documentNumber}</Text>
      </Text>
      {when ? <Text style={styles.meta}>Date: {when}</Text> : null}

      {houseAccountHasContent(houseAccount) ? <HouseAccountBlock ha={houseAccount!} /> : null}

      {note?.trim() ? (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{note.trim()}</Text>
        </View>
      ) : null}

      <View style={styles.tableHead}>
        <Text style={[styles.th, styles.colItem]}>Item</Text>
        <Text style={[styles.th, styles.colQty]}>Qty</Text>
        <Text style={[styles.th, styles.colMoney]}>Unit</Text>
        <Text style={[styles.th, styles.colMoney]}>Total</Text>
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>No line items</Text>
      ) : (
        items.map((line, i) => {
          const lineTotal =
            line.lineTotal != null && Number.isFinite(line.lineTotal)
              ? Number(line.lineTotal)
              : Number(line.unitPrice || 0) * Number(line.quantity || 0)
          return (
            <View key={`${line.name}-${i}`} style={styles.tableRow}>
              <Text style={[styles.td, styles.colItem]} numberOfLines={2}>
                {line.name || 'Item'}
              </Text>
              <Text style={[styles.td, styles.colQty]}>{line.quantity}</Text>
              <Text style={[styles.td, styles.colMoney]}>{money(line.unitPrice)}</Text>
              <Text style={[styles.td, styles.colMoney]}>{money(lineTotal)}</Text>
            </View>
          )
        })
      )}

      <Text style={styles.inclHint}>Line amounts include VAT.</Text>

      <View style={styles.breakdown}>
        <View style={styles.breakRow}>
          <Text style={styles.breakLabel}>Subtotal (excl. VAT)</Text>
          <Text style={styles.breakValue}>{money(vat.excl)}</Text>
        </View>
        <View style={styles.breakRow}>
          <Text style={styles.breakLabel}>VAT ({vat.ratePctLabel})</Text>
          <Text style={styles.breakValue}>{money(vat.vat)}</Text>
        </View>
        <View style={[styles.breakRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total (incl. VAT)</Text>
          <Text style={styles.totalValue}>{money(vat.incl)}</Text>
        </View>
      </View>
      <Text style={styles.thanks}>Thank you for your business.</Text>
      <View style={styles.footerSpacer} />
      <Image source={brandLogo} style={styles.brandLogo} resizeMode="contain" accessibilityLabel="CogniPOS" />
      <Text style={styles.brandUrl}>www.cognipos.com</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  doc: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    minHeight: Math.max(560, Dimensions.get('window').height - 120),
  },
  draftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    color: colors.brandDark,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  store: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  addressLine: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  contact: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  docTitle: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.text,
  },
  docNo: {
    marginTop: 4,
    fontSize: 15,
    color: colors.text,
  },
  docNoValue: {
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  meta: {
    color: colors.muted,
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
  },
  haBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  haHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.brand,
    marginBottom: 6,
  },
  haName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  haRow: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  haLabel: {
    color: colors.muted,
    fontWeight: '600',
  },
  noteBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  noteText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#d1d5db',
    paddingBottom: 6,
    marginBottom: 2,
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  td: {
    fontSize: 13,
    color: colors.text,
  },
  colItem: { flex: 1.4, paddingRight: 6 },
  colQty: { width: 36, textAlign: 'right' },
  colMoney: { width: 68, textAlign: 'right' },
  empty: { color: colors.muted, paddingVertical: 12 },
  inclHint: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 12,
  },
  breakdown: {
    marginTop: 10,
    alignSelf: 'stretch',
  },
  breakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  breakLabel: { fontSize: 13, color: colors.muted },
  breakValue: { fontSize: 13, color: colors.text, fontWeight: '600' },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.brandDark },
  thanks: {
    marginTop: 16,
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  footerSpacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  brandLogo: {
    alignSelf: 'center',
    marginTop: 12,
    width: 52,
    height: 66,
  },
  brandUrl: {
    alignSelf: 'center',
    marginTop: 6,
    color: colors.muted,
    fontSize: 12,
  },
})
