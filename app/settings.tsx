import { Ionicons } from '@expo/vector-icons'
import { router, Stack } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Muted, Screen, Title } from '@/src/components/ui'
import { SHOP_ASSIST_THEME_OPTIONS, type ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

export default function SettingsScreen() {
  const { colors, setTheme, theme } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  function closeSettings() {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)')
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          headerTitle: '',
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close settings"
              onPress={closeSettings}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Title>Settings</Title>
        <Muted>ShopAssist app settings and connection options.</Muted>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name="color-palette-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Theme</Text>
              <Text style={styles.menuCopy}>Applies to this device only.</Text>
            </View>
          </View>

          <View accessibilityLabel="ShopAssist theme" accessibilityRole="radiogroup" style={styles.themeSelector}>
            {SHOP_ASSIST_THEME_OPTIONS.map((option) => {
              const selected = option.id === theme
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setTheme(option.id)}
                  style={({ pressed }) => [
                    styles.themeOption,
                    selected && styles.themeOptionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.themeOptionText}>
                    <Text style={styles.themeOptionLabel}>{option.label}</Text>
                    <Text style={styles.themeOptionHint}>{option.hint}</Text>
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                </Pressable>
              )
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open account"
          onPress={() => router.push('/account')}
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="person-circle-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Account</Text>
            <Text style={styles.menuCopy}>Staff session, device binding, and sign out.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open server settings"
          onPress={() => router.push('/setup')}
          style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="server-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.menuText}>
            <Text style={styles.menuTitle}>Server</Text>
            <Text style={styles.menuCopy}>Change or test the ShopAssist API connection.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  themeSelector: {
    gap: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  themeOptionSelected: {
    borderColor: colors.primary,
  },
  themeOptionText: {
    flex: 1,
  },
  themeOptionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  themeOptionHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.inputBg,
    borderWidth: colors.borderWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  menuCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.82,
  },
})
}
