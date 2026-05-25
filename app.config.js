/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo

/**
 * Expo Go prints `name` under the icon while downloading the bundle.
 * Use a zero-width name so only the logo image shows; real display name is set per platform below.
 */
const EXPO_GO_HIDDEN_NAME = '\u200B'

module.exports = {
  expo: {
    ...base,
    name: EXPO_GO_HIDDEN_NAME,
    icon: './assets/images/logo-SA_Port-light.png',
    ios: {
      ...base.ios,
      infoPlist: {
        ...base.ios?.infoPlist,
        CFBundleDisplayName: 'ShopAssist',
      },
    },
    android: {
      ...base.android,
      adaptiveIcon: {
        ...base.android?.adaptiveIcon,
        foregroundImage: './assets/images/logo-SA_Port-light.png',
      },
    },
  },
}
