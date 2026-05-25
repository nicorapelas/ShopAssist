import { Image } from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useAuth } from '@/src/auth/AuthContext'

/** Minimum time the branded overlay stays visible after the app is ready (ms). */
const MIN_SPLASH_MS = 900

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Expo Go may reject; in-app overlay still shows the brand mark. */
})

type AppBootSplashProps = {
  children: ReactNode
}

/**
 * Shows ShopAssist logo on a white screen until auth storage is ready.
 * Works in Expo Go (native splash from app.json only applies to dev/production builds).
 */
export function AppBootSplash({ children }: AppBootSplashProps) {
  const { ready } = useAuth()
  const [overlayVisible, setOverlayVisible] = useState(true)

  useEffect(() => {
    if (!ready) return
    const hideTimer = setTimeout(() => {
      void SplashScreen.hideAsync().finally(() => {
        setOverlayVisible(false)
      })
    }, MIN_SPLASH_MS)
    return () => clearTimeout(hideTimer)
  }, [ready])

  return (
    <>
      {children}
      {overlayVisible ? (
        <View style={styles.overlay}>
          <Image
            source={require('../../assets/images/logo-SA_Port-light.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="ShopAssist logo"
          />
        </View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 220,
    height: 286,
  },
})
