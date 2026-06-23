const path = require('path');

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
  },
  project: {
    ios: {},
    android: {
      packageName: 'io.goldwallet.wallet',
    },
  },
  assets: ['./src/assets/fonts/'],
};
