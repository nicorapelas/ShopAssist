import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { HapticTab } from '@/components/haptic-tab'
import { CogniPosHeaderLogo } from '@/src/components/CogniPosHeaderLogo'
import { useAuth } from '@/src/auth/AuthContext'
import { shouldSkipHome } from '@/src/nav/modules'
import { canUseCatalog, canUseInvoices } from '@/src/permissions'
import { useShopAssistTheme } from '@/src/themeContext'

export default function TabLayout() {
  const { colors } = useShopAssistTheme()
  const { user } = useAuth()
  const skipHome = shouldSkipHome(user)
  const showCatalog = canUseCatalog(user)
  const showInvoices = canUseInvoices(user)

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        headerStyle: { backgroundColor: colors.panel },
        headerShadowVisible: false,
        headerTintColor: colors.text,
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
          title: 'CogniPOS',
          href: skipHome ? null : '/(tabs)',
          headerLeft: () => <CogniPosHeaderLogo paddingLeft={20} />,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catalog',
          href: showCatalog ? '/(tabs)/catalog' : null,
          headerLeft: () => null,
          tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="invoices"
        options={{
          title: 'Invoices',
          href: showInvoices ? '/(tabs)/invoices' : null,
          headerLeft: () => null,
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          headerLeft: () => <CogniPosHeaderLogo paddingLeft={20} />,
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Till cart',
          href: null,
          headerLeft: () => null,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          href: null,
          headerLeft: () => null,
        }}
      />
    </Tabs>
  )
}
