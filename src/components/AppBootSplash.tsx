import { Image } from 'expo-image'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useAuth } from '@/src/auth/AuthContext'
import { authScreenLogoSize, authScreenLogoSource } from '@/src/auth/authScreenLogo'
import { POS_SPLASH_BACKGROUND } from '@/src/constants/splashBranding'

/** Minimum time the branded overlay stays visible after the app is ready (ms). */
const MIN_SPLASH_MS = 900

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Expo Go may reject; in-app overlay still shows the brand mark. */
})

type AppBootSplashProps = {
  children: ReactNode
}

/**
 * Branded boot overlay — teal splash with the Cosmic mark.
 */
export function AppBootSplash({ children }: AppBootSplashProps) {
  const { ready } = useAuth()
  const [overlayVisible, setOverlayVisible] = useState(true)

  const logoSource = useMemo(() => authScreenLogoSource(), [])
  const logoSize = useMemo(() => authScreenLogoSize(false), [])

  useEffect(() => {
    if (!ready) return
    const hideTimer = setTimeout(() => {
      setOverlayVisible(false)
      void SplashScreen.hideAsync().catch(() => {
        /* Expo Go may reject; overlay is already gone. */
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
            source={logoSource}
            style={{ width: logoSize.width, height: logoSize.height }}
            contentFit="contain"
            accessibilityLabel="CogniPOS logo"
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
    backgroundColor: POS_SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
})
