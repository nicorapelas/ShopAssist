import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/src/auth/AuthContext'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

export function SessionBar() {
  const { user, logoutStaff } = useAuth()
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
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

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
    bar: {
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.panel,
      borderBottomWidth: colors.borderWidth,
      borderBottomColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    userText: {
      flex: 1,
      color: colors.muted,
      fontSize: 13,
    },
    userName: {
      color: colors.text,
      fontWeight: '800',
    },
    signOutButton: {
      borderRadius: 999,
      backgroundColor: colors.panel,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
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
