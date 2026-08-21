import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '@/src/auth/AuthContext'
import { loadEnrollment } from '@/src/auth/enrollmentStorage'
import { Btn, ErrorText, FieldLabel, Input, Screen } from '@/src/components/ui'
import { getApiBaseUrl } from '@/src/config/serverUrl'
import type { ShopAssistColors } from '@/src/theme'
import { useShopAssistTheme } from '@/src/themeContext'

const COSMIC_MARK = require('../../assets/images/LogoCosmic.png')

function hostLabel(url: string | null): string {
  if (!url) return '—'
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

export default function AccountScreen() {
  const { user, logoutStaff, unbindDevice } = useAuth()
  const { colors } = useShopAssistTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [apiBase, setApiBase] = useState<string | null>(null)
  const [deviceEnrolled, setDeviceEnrolled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUnbind, setShowUnbind] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const canUnbind = user?.role === 'admin'

  useEffect(() => {
    void (async () => {
      setApiBase(await getApiBaseUrl())
      setDeviceEnrolled(Boolean(await loadEnrollment()))
    })()
  }, [])

  async function handleUnbind() {
    setBusy(true)
    setError(null)
    try {
      await unbindDevice(adminEmail, adminPassword)
      setShowUnbind(false)
      setAdminEmail('')
      setAdminPassword('')
      router.replace('/enroll')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbind failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <Image source={COSMIC_MARK} style={styles.mark} contentFit="contain" accessibilityLabel="CogniPOS" />
          <Text style={styles.email}>{user?.displayName?.trim() || user?.email || 'Staff session'}</Text>
          <Text style={styles.role}>{user?.role ?? 'staff'}</Text>
        </View>

        <InfoCard label="Shop API" value={hostLabel(apiBase)} colors={colors} />
        <InfoCard
          label="This phone"
          value={deviceEnrolled ? 'Bound to this store' : 'Not bound'}
          colors={colors}
        />

        {error ? <ErrorText>{error}</ErrorText> : null}

        <Btn
          label="Sign out"
          onPress={() => {
            void logoutStaff().then(() => router.replace('/login'))
          }}
          variant="danger"
        />

        {canUnbind ? (
          showUnbind ? (
            <View style={styles.unbindCard}>
              <Text style={styles.unbindTitle}>Unbind this phone (admin)</Text>
              <FieldLabel>Admin email</FieldLabel>
              <Input
                value={adminEmail}
                onChangeText={setAdminEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <FieldLabel>Admin password</FieldLabel>
              <Input value={adminPassword} onChangeText={setAdminPassword} secureTextEntry />
              <Btn label={busy ? 'Working…' : 'Confirm unbind'} onPress={() => void handleUnbind()} disabled={busy} />
              <Btn label="Cancel" onPress={() => setShowUnbind(false)} variant="ghost" />
            </View>
          ) : (
            <Btn label="Unbind this phone" onPress={() => setShowUnbind(true)} variant="ghost" />
          )
        ) : null}
      </ScrollView>
    </Screen>
  )
}

function InfoCard({ colors, label, value }: { colors: ShopAssistColors; label: string; value: string }) {
  const styles = useMemo(() => makeStyles(colors), [colors])
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function makeStyles(colors: ShopAssistColors) {
  return StyleSheet.create({
    screen: {
      padding: 0,
    },
    content: {
      padding: 20,
      paddingBottom: 32,
    },
    profileCard: {
      backgroundColor: colors.panel,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 22,
      alignItems: 'center',
      marginBottom: 14,
    },
    mark: {
      width: 48,
      height: 56,
      marginBottom: 12,
    },
    email: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
    },
    role: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'capitalize',
      marginTop: 4,
    },
    infoCard: {
      backgroundColor: colors.panel,
      borderRadius: 16,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
    },
    infoLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 6,
    },
    infoValue: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
    unbindCard: {
      marginTop: 8,
      backgroundColor: colors.panel,
      borderRadius: 16,
      borderWidth: colors.borderWidth,
      borderColor: colors.border,
      padding: 14,
      gap: 4,
    },
    unbindTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 8,
    },
  })
}
