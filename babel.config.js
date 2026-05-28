module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-runtime',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          app: './src',
        },
      },
    ],
    [
      'transform-inline-environment-variables',
      {
        include: ['NODE_ENV', 'LOG_BOX_IGNORE', 'CHAMBER_OF_SECRETS'],
      },
    ],
  ],
  env: {
    test: {
      plugins: ['react-native-config-node/transform'],
    },
  },
};
