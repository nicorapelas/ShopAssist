import { Image } from 'expo-image'
import { Platform, StyleSheet, View } from 'react-native'

/** ShopAssist wordmark for stack headers. */
export function CogniPosHeaderLogo() {
  return (
    <View style={styles.wrap}>
      <Image
        source={require('../../assets/images/logo-SA_land-dark.png')}
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
    marginLeft: Platform.OS === 'ios' ? -8 : -16,
    paddingLeft: 0,
  },
  logo: {
    width: 156,
    height: 36,
  },
})
