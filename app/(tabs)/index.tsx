import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { Redirect, router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/src/auth/AuthContext'
import { Screen } from '@/src/components/ui'
import { landingHref, shouldSkipHome } from '@/src/nav/modules'
import { canUseCatalog, canUseInvoices, canUseTillCart } from '@/src/permissions'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

const COSMIC_MARK = require('../../assets/images/LogoCosmic.png')

export default function HomeScreen() {
  const { user, enrollment } = useAuth()
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  if (shouldSkipHome(user)) {
    return <Redirect href={landingHref(user)} />
  }

  const name = user?.displayName?.trim() || user?.email || 'Staff'
  const showCatalog = canUseCatalog(user)
  const showTillCart = canUseTillCart(user) && Boolean(enrollment)
  const showInvoices = canUseInvoices(user)

  return (
    <Screen style={styles.screen}>
      <View style={styles.hero}>
        <Image source={COSMIC_MARK} style={styles.mark} contentFit="contain" accessibilityLabel="CogniPOS" />
        <Text style={styles.title}>CogniPOS</Text>
        <Text style={styles.subtitle}>{name}</Text>
      </View>

      <View style={styles.tiles}>
        {showCatalog ? (
          <Tile
            colors={colors}
            icon="cube-outline"
            label="Catalog"
            onPress={() => router.push('/(tabs)/catalog')}
          />
        ) : null}
        {showTillCart ? (
          <Tile
            colors={colors}
            icon="qr-code-outline"
            label="Till cart"
            onPress={() => router.push('/(tabs)/cart')}
          />
        ) : null}
        {showInvoices ? (
          <Tile
            colors={colors}
            icon="receipt-outline"
            label="Invoices"
            onPress={() => router.push('/(tabs)/invoices')}
          />
        ) : null}
        {!showCatalog && !showTillCart && !showInvoices ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCopy}>Nothing on this phone for your role. Ask for catalog.read or sales access.</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  )
}

function Tile({
  colors,
  icon,
  label,
  onPress,
}: {
  colors: ShopAssistColors
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
}) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.tileIcon}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
    screen: {
      padding: 20,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 22,
      paddingTop: 8,
    },
    mark: {
      width: 56,
      height: 64,
      marginBottom: 10,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.4,
    },
    subtitle: {
      color: colors.muted,
      fontSize: 15,
      marginTop: 4,
    },
    tiles: {
      gap: 10,
    },
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.panel,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
    },
    tileIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileLabel: {
      flex: 1,
      color: colors.text,
      fontSize: 17,
      fontWeight: '700',
    },
    emptyCard: {
      backgroundColor: colors.panel,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
    },
    emptyCopy: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
    },
    pressed: {
      opacity: 0.82,
    },
  })
}
