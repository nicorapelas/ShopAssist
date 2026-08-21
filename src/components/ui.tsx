import { forwardRef, useMemo, type ReactNode } from 'react'
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
import type { ShopAssistColors } from '../theme'
import { useShopAssistTheme } from '../themeContext'

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return <View style={[styles.screen, style]}>{children}</View>
}

export function Title({ children }: { children: string }) {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return <Text style={styles.title}>{children}</Text>
}

export function Muted({ children }: { children: React.ReactNode }) {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return <Text style={styles.muted}>{children}</Text>
}

export function FieldLabel({ children }: { children: string }) {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return <Text style={styles.label}>{children}</Text>
}

export const Input = forwardRef<TextInput, TextInputProps>(function Input(props, ref) {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const { placeholderTextColor, style, ...rest } = props
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? colors.muted}
      style={[styles.input, style]}
      {...rest}
    />
  )
})

export function Btn({
  label,
  icon,
  onPress,
  variant = 'primary',
  disabled,
  compact,
  accessibilityLabel,
}: {
  label?: string
  icon?: ReactNode
  onPress: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  disabled?: boolean
  /** Icon-only toolbar style (no top margin, fixed height). */
  compact?: boolean
  accessibilityLabel?: string
}) {
  const a11y = accessibilityLabel ?? label ?? 'Button'
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
      ]}
    >
      {icon ??
        (label ? (
          <Text style={[styles.btnText, variant === 'ghost' && styles.btnGhostText, disabled && styles.btnDisabledText]}>
            {label}
          </Text>
        ) : null)}
    </Pressable>
  )
}

export function ErrorText({ children }: { children: string }) {
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  return <Text style={styles.error}>{children}</Text>
}

export function Loading() {
  const { colors } = useShopAssistTheme()
  return <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
    paddingTop: 12,
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
    borderWidth: colors.borderWidth,
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
    justifyContent: 'center',
    marginTop: 16,
  },
  btnCompact: {
    flex: 1,
    marginTop: 0,
    minHeight: 48,
    paddingVertical: 12,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnDisabled: {
    backgroundColor: '#cbd5e1',
    borderColor: '#cbd5e1',
    opacity: 1,
  },
  btnText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  btnGhostText: {
    color: colors.text,
  },
  btnDisabledText: {
    color: '#64748b',
  },
  error: {
    color: colors.danger,
    marginTop: 12,
    fontSize: 14,
  },
})
}
