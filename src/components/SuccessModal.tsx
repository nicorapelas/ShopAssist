import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { invoiceColors as colors } from '@/src/theme'

export function SuccessModal({
  visible,
  title,
  message,
  onClose,
}: {
  visible: boolean
  title: string
  message?: string
  onClose: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          {message?.trim() ? <Text style={styles.message}>{message.trim()}</Text> : null}
          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  badgeText: {
    color: colors.success,
    fontSize: 26,
    fontWeight: '800',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  btn: {
    marginTop: 20,
    alignSelf: 'stretch',
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})
