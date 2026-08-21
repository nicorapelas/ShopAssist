import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/src/auth/AuthContext'
import { authScreenLogoSize, authScreenLogoSource } from '@/src/auth/authScreenLogo'
import { AuthKeyboardScroll } from '@/src/components/AuthKeyboardScroll'
import { Btn, ErrorText, FieldLabel, Input, Muted } from '@/src/components/ui'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

const LOGO_MS = 220

export default function EnrollScreen() {
  const { enrollDevice } = useAuth()
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const logoSource = useMemo(() => authScreenLogoSource(), [])
  const logoFull = authScreenLogoSize(false)
  const logoCompact = authScreenLogoSize(true)

  const focusDepthRef = useRef(0)
  const logoProgress = useSharedValue(0)
  const logoFullW = useSharedValue(logoFull.width)
  const logoFullH = useSharedValue(logoFull.height)
  const logoCompactW = useSharedValue(logoCompact.width)
  const logoCompactH = useSharedValue(logoCompact.height)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logoStyle = useAnimatedStyle(() => {
    const t = logoProgress.value
    return {
      width: logoFullW.value + (logoCompactW.value - logoFullW.value) * t,
      height: logoFullH.value + (logoCompactH.value - logoFullH.value) * t,
    }
  })

  const bumpLogo = useCallback(
    (focused: boolean) => {
      if (focused) {
        focusDepthRef.current += 1
        if (focusDepthRef.current === 1) {
          logoProgress.value = withTiming(1, { duration: LOGO_MS })
        }
        return
      }
      focusDepthRef.current = Math.max(0, focusDepthRef.current - 1)
      if (focusDepthRef.current === 0) {
        logoProgress.value = withTiming(0, { duration: LOGO_MS })
      }
    },
    [logoProgress],
  )

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      await enrollDevice(email, password, label || undefined)
      router.replace('/login')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enrollment failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AuthKeyboardScroll>
        <View style={styles.logoWrap}>
          <Animated.View style={logoStyle}>
            <Image
              source={logoSource}
              style={styles.logoImage}
              contentFit="contain"
              accessibilityLabel="CogniPOS"
            />
          </Animated.View>
        </View>

        <View style={styles.form}>
          <Muted>
            Store admin only: sign in once to bind this phone to your CogniPOS store. Staff use badge
            sign-in after that.
          </Muted>
          <FieldLabel>Admin email</FieldLabel>
          <Input
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            onFocus={() => bumpLogo(true)}
            onBlur={() => bumpLogo(false)}
          />
          <FieldLabel>Admin password</FieldLabel>
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            onFocus={() => bumpLogo(true)}
            onBlur={() => bumpLogo(false)}
          />
          <FieldLabel>Device label (optional)</FieldLabel>
          <Input
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Floor phone"
            autoCapitalize="words"
            onFocus={() => bumpLogo(true)}
            onBlur={() => bumpLogo(false)}
          />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Btn label={busy ? 'Enrolling…' : 'Bind this phone'} onPress={() => void submit()} disabled={busy} />
          <Btn label="Change shop API" onPress={() => router.push('/setup')} variant="ghost" />
        </View>
      </AuthKeyboardScroll>
    </SafeAreaView>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    logoWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    form: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
    },
  })
}
