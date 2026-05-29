module.exports = {
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  modulePathIgnorePatterns: ['<rootDir>/tests/e2e'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@react-native|react-native|react-navigation|@react-native-community|@sentry/*)',
  ],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js',
  },
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['src/**/*.{js,ts,tsx}', 'class/**/*.{js,ts,tsx}', 'utils/**/*.{js,ts,tsx}'],
  // coverageThreshold: {
  //   global: {
  //     branches: 7,
  //     functions: 6,
  //     lines: 12,
  //     statements: 11,
  //   },
  // },
};
