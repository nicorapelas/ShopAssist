import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/src/auth/AuthContext'
import { authScreenLogoSize, authScreenLogoSource } from '@/src/auth/authScreenLogo'
import { AuthKeyboardScroll } from '@/src/components/AuthKeyboardScroll'
import { BarcodeScannerModal } from '@/src/components/BarcodeScannerModal'
import { Btn, ErrorText, FieldLabel, Input, Muted } from '@/src/components/ui'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

type Mode = 'badge' | 'password'

const LOGO_MS = 220

export function SignInScreen() {
  const { loginBadge, loginPassword } = useAuth()
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const focusDepthRef = useRef(0)

  const logoSource = authScreenLogoSource()
  const logoFull = authScreenLogoSize(false)
  const logoCompact = authScreenLogoSize(true)

  const logoProgress = useSharedValue(0)
  const logoFullW = useSharedValue(logoFull.width)
  const logoFullH = useSharedValue(logoFull.height)
  const logoCompactW = useSharedValue(logoCompact.width)
  const logoCompactH = useSharedValue(logoCompact.height)

  const [mode, setMode] = useState<Mode>('badge')
  const [badgeCode, setBadgeCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    logoFullW.value = logoFull.width
    logoFullH.value = logoFull.height
    logoCompactW.value = logoCompact.width
    logoCompactH.value = logoCompact.height
  }, [logoCompact.height, logoCompact.width, logoFull.height, logoFull.width, logoCompactH, logoCompactW, logoFullH, logoFullW])

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

  const handleBadge = useCallback(
    async (code: string) => {
      const trimmed = code.trim()
      if (!trimmed || busy) return
      setError(null)
      setBusy(true)
      setBadgeCode('')
      Keyboard.dismiss()
      try {
        await loginBadge(trimmed)
        router.replace('/(tabs)')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Badge sign-in failed')
      } finally {
        setBusy(false)
      }
    },
    [busy, loginBadge],
  )

  async function submitPassword() {
    setError(null)
    setBusy(true)
    Keyboard.dismiss()
    try {
      await loginPassword(email, password)
      router.replace('/(tabs)')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <AuthKeyboardScroll>
        <View style={styles.logoSection}>
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
          <Muted>Scan your staff badge or sign in with password.</Muted>

          <View style={styles.modeRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMode('badge')}
              style={[styles.modeBtn, mode === 'badge' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, mode === 'badge' && styles.modeBtnTextActive]}>Badge</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMode('password')}
              style={[styles.modeBtn, mode === 'password' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, mode === 'password' && styles.modeBtnTextActive]}>Password</Text>
            </Pressable>
          </View>

          {mode === 'badge' ? (
            <>
              <FieldLabel>Badge code</FieldLabel>
              <Input
                value={badgeCode}
                onChangeText={setBadgeCode}
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => bumpLogo(true)}
                onBlur={() => bumpLogo(false)}
                onSubmitEditing={() => void handleBadge(badgeCode)}
                returnKeyType="go"
              />
              <Btn
                label={busy ? 'Signing in…' : 'Sign in with badge'}
                onPress={() => void handleBadge(badgeCode)}
                disabled={busy}
              />
              <Btn
                label="Scan badge barcode"
                onPress={() => setScannerOpen(true)}
                variant="ghost"
                disabled={busy}
              />
            </>
          ) : (
            <>
              <FieldLabel>Email</FieldLabel>
              <Input
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                onFocus={() => bumpLogo(true)}
                onBlur={() => bumpLogo(false)}
              />
              <FieldLabel>Password</FieldLabel>
              <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                onFocus={() => bumpLogo(true)}
                onBlur={() => bumpLogo(false)}
                onSubmitEditing={() => void submitPassword()}
              />
              <Btn
                label={busy ? 'Signing in…' : 'Sign in with password'}
                onPress={() => void submitPassword()}
                disabled={busy}
              />
            </>
          )}

          {error ? <ErrorText>{error}</ErrorText> : null}
          <Btn label="Change shop API" onPress={() => router.push('/setup')} variant="ghost" />
        </View>
      </AuthKeyboardScroll>

      <BarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onBarcode={(value) => {
          setScannerOpen(false)
          void handleBadge(value)
        }}
      />
    </SafeAreaView>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    logoSection: {
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
      gap: 0,
    },
    modeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 14,
      marginTop: 8,
    },
    modeBtn: {
      flex: 1,
      borderRadius: 12,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      paddingVertical: 10,
      alignItems: 'center',
    },
    modeBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.panel,
    },
    modeBtnText: {
      color: colors.muted,
      fontWeight: '700',
      fontSize: 14,
    },
    modeBtnTextActive: {
      color: colors.primary,
    },
  })
}
