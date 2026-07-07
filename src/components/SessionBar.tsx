import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/src/auth/AuthContext'
import type { ShopAssistColors, ShopAssistTheme } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

export function SessionBar() {
  const { user, logoutStaff } = useAuth()
  const { colors, theme } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors, theme), [colors, theme])
  if (!user) return null

  const name = user.displayName?.trim() || user.email

  return (
    <View style={styles.bar}>
      <Text style={styles.userText} numberOfLines={1}>
        Signed in: <Text style={styles.userName}>{name}</Text>
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => {
          void logoutStaff().then(() => router.replace('/login'))
        }}
        style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed]}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  )
}

function makeStyles(colors: ShopAssistColors, theme: ShopAssistTheme) {
  const isHighContrastTheme =
    theme === 'dark' || theme === 'ubuntu' || theme === 'elon' || theme === 'lego' || theme === 'cosmic'
  const barBg =
    theme === 'lego'
      ? '#7f1d1d'
      : theme === 'ubuntu'
        ? '#4c1d95'
        : theme === 'cosmic'
          ? '#262626'
          : theme === 'elon'
          ? '#172554'
          : theme === 'dark'
            ? '#1e1b4b'
            : colors.panel
  const userTextColor = theme === 'lego' ? '#fde68a' : isHighContrastTheme ? colors.muted : colors.muted
  const signOutBg = isHighContrastTheme ? colors.inputBg : colors.panel

  return StyleSheet.create({
  bar: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: barBg,
    borderBottomWidth: colors.borderWidth,
    borderBottomColor: isHighContrastTheme ? colors.primary : colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  userText: {
    flex: 1,
    color: userTextColor,
    fontSize: 13,
  },
  userName: {
    color: isHighContrastTheme ? '#ffffff' : colors.text,
    fontWeight: '800',
  },
  signOutButton: {
    borderRadius: 999,
    backgroundColor: signOutBg,
    borderWidth: colors.borderWidth,
    borderColor: isHighContrastTheme ? colors.primary : colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  signOutText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
})
}
