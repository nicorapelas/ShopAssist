import { Image } from 'expo-image'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

const COSMIC_MARK = require('../../assets/images/LogoCosmic.png')

type Props = {
  /** Extra inset from the left edge of the header (e.g. dashboard tabs). */
  paddingLeft?: number
  style?: StyleProp<ViewStyle>
}

/** Small Cosmic mark — Home and Account headers only. */
export function CogniPosHeaderLogo({ paddingLeft = 0, style }: Props) {
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
        source={COSMIC_MARK}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="CogniPOS"
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
    width: 36,
    height: 40,
  },
})
