module.exports = {
  dependencies: {
    '@remobile/react-native-qrcode-local-image': {
      platforms: {
        android: null,
      },
    },
    'react-native-prompt-android': {
      platforms: {
        android: null,
      },
    },
  },
  project: {
    ios: {},
    android: {
      packageName: 'io.goldwallet.wallet',
    },
  },
  assets: ['./src/assets/fonts/'],
};
