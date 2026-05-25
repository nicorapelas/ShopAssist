import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Platform } from 'react-native'
import 'react-native-reanimated'
import { AuthProvider } from '@/src/auth/AuthContext'
import { AppBootSplash } from '@/src/components/AppBootSplash'
import { CogniPosHeaderLogo } from '@/src/components/CogniPosHeaderLogo'
import { colors } from '@/src/theme'

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppBootSplash>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.panel },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '600' },
          headerLeft: () => <CogniPosHeaderLogo />,
          headerLeftContainerStyle: {
            paddingLeft: Platform.OS === 'ios' ? 0 : 8,
            left: 0,
          },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="setup" options={{ title: 'Server' }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="search" options={{ headerShown: true }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      </AppBootSplash>
      <StatusBar style="dark" />
    </AuthProvider>
  )
}
