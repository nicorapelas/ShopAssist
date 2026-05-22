import { forwardRef } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native'
import { colors } from '../theme'

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>
}

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>
}

export function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>
}

export const Input = forwardRef<TextInput, TextInputProps>(function Input(props, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.muted}
      style={[styles.input, props.style]}
      {...props}
    />
  )
})

export function Btn({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        (disabled || pressed) && styles.btnPressed,
      ]}
    >
      <Text style={[styles.btnText, variant === 'ghost' && styles.btnGhostText]}>{label}</Text>
    </Pressable>
  )
}

export function ErrorText({ children }: { children: string }) {
  return <Text style={styles.error}>{children}</Text>
}

export function Loading() {
  return <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
    paddingTop: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  muted: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  btnGhostText: {
    color: colors.text,
  },
  error: {
    color: colors.danger,
    marginTop: 12,
    fontSize: 14,
  },
})
