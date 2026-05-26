import { Ionicons } from '@expo/vector-icons'
import { router, Tabs } from 'expo-router'
import { Pressable, StyleSheet } from 'react-native'
import { HapticTab } from '@/components/haptic-tab'
import { CogniPosHeaderLogo } from '@/src/components/CogniPosHeaderLogo'
import { useShopAssistTheme } from '@/src/themeContext'

export default function TabLayout() {
  const { colors } = useShopAssistTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerLeft: () => <CogniPosHeaderLogo />,
        headerRight: () => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push('/settings')}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color={colors.primary} />
          </Pressable>
        ),
        headerTitle: '',
        headerStyle: { backgroundColor: colors.panel },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.border,
          height: 76,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  settingsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
})
