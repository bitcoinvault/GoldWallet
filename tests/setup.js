import mockAsyncStorage from '@react-native-async-storage/async-storage/jest';

global.net = require('net');

jest.mock('react-native-default-preference', () => {
  return {
    setName: jest.fn(),
    set: jest.fn(),
  };
});

jest.mock('react-native-localize', () => {
  return {
    getLocales: jest.fn(() => [{ languageCode: 'en' }]),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  init: jest.fn(),
  wrap: jest.fn(component => component),
}));
