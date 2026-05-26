import { Image } from 'expo-image'
import { Platform, StyleSheet, View } from 'react-native'
import { useShopAssistTheme } from '@/src/themeContext'

const LIGHT_THEME_LOGO = require('../../assets/images/logo-text_land-light.png')
const DARK_THEME_LOGO = require('../../assets/images/logo-SA_land-dark.png')

/** ShopAssist wordmark for stack headers. */
export function CogniPosHeaderLogo() {
  const { theme } = useShopAssistTheme()
  const logoSource =
    theme === 'dark' || theme === 'ubuntu' || theme === 'elon' || theme === 'lego' ? DARK_THEME_LOGO : LIGHT_THEME_LOGO

  return (
    <View style={styles.wrap}>
      <Image
        source={logoSource}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="ShopAssist"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginLeft: Platform.OS === 'ios' ? -16 : -24,
    paddingLeft: 0,
  },
  logo: {
    width: 156,
    height: 36,
  },
})
