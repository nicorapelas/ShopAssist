import { CameraView, useCameraPermissions } from 'expo-camera'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { playScanBeep } from '@/src/audio/scanBeep'
import { Btn, Muted } from '@/src/components/ui'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

type Props = {
  visible: boolean
  onClose: () => void
  onBarcode: (value: string) => void
}

export function BarcodeScannerModal({ visible, onClose, onBarcode }: Props) {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [permission, requestPermission] = useCameraPermissions()
  const [torch, setTorch] = useState(false)
  const lastScanRef = useRef<{ value: string; at: number } | null>(null)

  const handleScan = useCallback(
    ({ data }: { data: string }) => {
      const value = data.trim()
      if (!value) return
      const now = Date.now()
      const last = lastScanRef.current
      if (last && last.value === value && now - last.at < 2000) return
      lastScanRef.current = { value, at: now }
      void playScanBeep()
      onBarcode(value)
    },
    [onBarcode],
  )

  if (!visible) return null

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.centered}>
            <Muted>Checking camera permission…</Muted>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centered}>
            <Muted>Camera access is needed to scan barcodes.</Muted>
            <Btn label="Allow camera" onPress={() => void requestPermission()} />
            <Btn label="Cancel" variant="ghost" onPress={onClose} />
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={torch}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'codabar',
                  'itf14',
                  'qr',
                ],
              }}
              onBarcodeScanned={handleScan}
            />
            <View style={styles.overlay}>
              <Text style={styles.hint}>Line up the barcode in the frame</Text>
              <View style={styles.frame} />
              <View style={styles.actions}>
                <Pressable style={styles.chip} onPress={() => setTorch((t) => !t)}>
                  <Text style={styles.chipText}>{torch ? 'Torch on' : 'Torch'}</Text>
                </Pressable>
                <Pressable style={styles.chip} onPress={onClose}>
                  <Text style={styles.chipText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  hint: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: '#000',
    textShadowRadius: 6,
  },
  frame: {
    alignSelf: 'center',
    width: '88%',
    height: 140,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
  },
  chipText: {
    color: '#fff',
    fontWeight: '600',
  },
})
}
