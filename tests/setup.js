import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

global.net = require('net');

jest.mock('react-native-default-preference', () => {
  return {
    setName: jest.fn(),
    set: jest.fn(),
  };
});

jest.mock('react-native-localize', () => {
  return {
    getLocales: jest.fn(),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);
