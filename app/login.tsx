import { router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAuth } from '@/src/auth/AuthContext'
import { Btn, ErrorText, FieldLabel, Input, Muted, Screen, Title } from '@/src/components/ui'

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
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Title>Sign in</Title>
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
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
