import { Image } from 'expo-image'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useShopAssistTheme } from '@/src/themeContext'

const LIGHT_THEME_LOGO = require('../../assets/images/logo-text_land-light.png')
const DARK_THEME_LOGO = require('../../assets/images/logo-SA_land-dark.png')

type Props = {
  /** Extra inset from the left edge of the header (e.g. dashboard tabs). */
  paddingLeft?: number
  style?: StyleProp<ViewStyle>
}

/** ShopAssist wordmark for stack headers. */
export function CogniPosHeaderLogo({ paddingLeft = 0, style }: Props) {
  const { theme } = useShopAssistTheme()
  const logoSource =
    theme === 'dark' || theme === 'ubuntu' || theme === 'elon' || theme === 'lego' || theme === 'cosmic'
      ? DARK_THEME_LOGO
      : LIGHT_THEME_LOGO

  const wrapStyle =
    paddingLeft > 0
      ? {
          marginLeft: 0,
          paddingLeft,
        }
      : null

  return (
    <View style={[styles.wrap, wrapStyle, style]}>
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
