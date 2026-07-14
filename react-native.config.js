const path = require('path');

const disableLegacySecureStorage = process.env.GOLDWALLET_DISABLE_LEGACY_SECURE_STORAGE === '1';

module.exports = {
  dependencies: {
    'react-native-config': {
      platforms: {
        android: {
          sourceDir: path.join(__dirname, 'node_modules/react-native-config/android'),
          packageImportPath: 'import com.lugg.RNCConfig.RNCConfigPackage;',
          packageInstance: 'new RNCConfigPackage()',
        },
      },
    },
    ...(disableLegacySecureStorage
      ? {
          'react-native-secure-key-store': {
            platforms: {
              android: null,
            },
          },
        }
      : {}),
  },
  project: {
    ios: {},
    android: {
      packageName: 'io.goldwallet.wallet',
    },
  },
  assets: ['./src/assets/fonts/'],
};
