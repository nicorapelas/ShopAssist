import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import 'react-native-reanimated'
import { AuthProvider } from '@/src/auth/AuthContext'
import { AuthSessionRedirector } from '@/src/auth/AuthSessionRedirector'
import { CartProvider } from '@/src/cart/CartContext'
import { AppBootSplash } from '@/src/components/AppBootSplash'
import { CogniPosHeaderLogo } from '@/src/components/CogniPosHeaderLogo'
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
  const { colors, theme } = useShopAssistTheme()
  const darkStatusBar =
    theme === 'dark' || theme === 'ubuntu' || theme === 'elon' || theme === 'lego' || theme === 'cosmic'

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider preload={false}>
        <AppBootSplash>
        <AuthSessionRedirector />
        <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.panel },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => <CogniPosHeaderLogo />,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ title: 'Server' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="account" options={{ title: 'Account' }} />
        <Stack.Screen name="enroll" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: true }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={darkStatusBar ? 'light' : 'dark'} />
        </AppBootSplash>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
