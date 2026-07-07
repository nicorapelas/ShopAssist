/** @type {import('expo/config').ExpoConfig} */
const base = require('./app.json').expo

/**
 * Expo Go prints `name` under the icon while downloading the bundle.
 * Use a zero-width name so only the logo image shows; real display name is set per platform below.
 */
const EXPO_GO_HIDDEN_NAME = '\u200B'

const EAS_PROJECT_ID = 'c552f722-c884-42eb-b591-1cac78f439d7'

/** EAS sets this during cloud builds — use app.json branding (appIcon, ShopAssist name). */
const isEasBuild = Boolean(process.env.EAS_BUILD_PROFILE)

module.exports = {
  expo: {
    ...base,
    extra: {
      ...(base.extra ?? {}),
      eas: {
        ...(base.extra?.eas ?? {}),
        projectId: EAS_PROJECT_ID,
      },
    },
    ...(isEasBuild
      ? {}
      : {
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
        }),
  },
}
