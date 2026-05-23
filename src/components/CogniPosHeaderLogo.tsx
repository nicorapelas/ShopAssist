import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'

/** CogniPOS wordmark for stack headers (dark variant on panel background). */
export function CogniPosHeaderLogo() {
  return (
    <View style={styles.wrap}>
      <Image
        source={require('../../assets/images/logo-text_bottom1-dark.png')}
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
    marginLeft: -16,
    paddingLeft: 0,
  },
  logo: {
    width: 128,
    height: 30,
  },
})
