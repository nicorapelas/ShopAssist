import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/src/auth/AuthContext'
import { Btn, ErrorText, FieldLabel, Input, Muted } from '@/src/components/ui'
import { colors } from '@/src/theme'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
      router.replace('/search')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/logo-SA_Port-light.png')}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="ShopAssist"
            />
          </View>

          <View style={styles.form}>
            <Muted>Back Office staff account with catalog.read.</Muted>
            <FieldLabel>Email</FieldLabel>
            <Input
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <FieldLabel>Password</FieldLabel>
            <Input
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              onSubmitEditing={() => void submit()}
            />
            {error ? <ErrorText>{error}</ErrorText> : null}
            <Btn label={busy ? 'Signing in…' : 'Sign in'} onPress={() => void submit()} disabled={busy} />
            <Btn label="Change server" onPress={() => router.push('/setup')} variant="ghost" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    minHeight: 280,
  },
  logo: {
    width: 240,
    height: 312,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
})
