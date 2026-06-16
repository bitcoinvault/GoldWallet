const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const defaultSourceExts = defaultConfig.resolver.sourceExts;

module.exports = mergeConfig(defaultConfig, {
  server: {
    enhanceMiddleware: middleware => (req, res, next) => {
      if (process.env.RN_DISABLE_METRO_MULTIPART === 'true' && req.headers.accept?.includes('multipart/mixed')) {
        req.headers.accept = req.headers.accept
          .split(',')
          .map(value => value.trim())
          .filter(value => value && value !== 'multipart/mixed')
          .join(', ');
      }

      return middleware(req, res, next);
    },
  },
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
