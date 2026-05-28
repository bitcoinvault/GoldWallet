const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const defaultSourceExts = defaultConfig.resolver.sourceExts;

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    sourceExts: process.env.RN_SRC_EXT
      ? process.env.RN_SRC_EXT.split(',').concat(defaultSourceExts)
      : defaultSourceExts,
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    minifierConfig: {
      keep_classnames: true, // Preserve class names
      keep_fnames: true, // Preserve function names
      mangle: {
        keep_classnames: true, // Preserve class names
        keep_fnames: true, // Preserve function names
      },
    },
  },
});
