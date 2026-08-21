import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import 'react-native-reanimated'
import { AuthProvider } from '@/src/auth/AuthContext'
import { AuthSessionRedirector } from '@/src/auth/AuthSessionRedirector'
import { CartProvider } from '@/src/cart/CartContext'
import { AppBootSplash } from '@/src/components/AppBootSplash'
import { ShopAssistThemeProvider, useShopAssistTheme } from '@/src/themeContext'

export default function RootLayout() {
  return (
    <ShopAssistThemeProvider>
      <AuthProvider>
        <CartProvider>
          <RootLayoutInner />
        </CartProvider>
      </AuthProvider>
    </ShopAssistThemeProvider>
  )
}

function RootLayoutInner() {
  const { colors } = useShopAssistTheme()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider preload={false}>
        <AppBootSplash>
        <AuthSessionRedirector />
        <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.panel },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ title: 'Shop API' }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="account" options={{ headerShown: false }} />
        <Stack.Screen name="enroll" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: true, title: 'Search' }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true, title: 'Product' }} />
        <Stack.Screen name="new-invoice" options={{ headerShown: true, title: 'New invoice' }} />
        <Stack.Screen name="sale/[id]" options={{ headerShown: true, title: 'Invoice' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="dark" />
        </AppBootSplash>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
