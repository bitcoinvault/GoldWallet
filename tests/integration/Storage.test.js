import AsyncStorage from '@react-native-async-storage/async-storage';
import assert from 'assert';
import crypto from 'crypto';
import * as mockKeychain from 'react-native-keychain';
import mockLegacySecureStore from 'react-native-secure-key-store';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  captureException: jest.fn(),
};

jest.mock('react-native-keychain', () => ({
  __esModule: true,
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));
jest.mock('react-native-secure-key-store', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'LegacyAccessibleWhenUnlockedThisDeviceOnly',
  },
}));
jest.mock('../../logger', () => ({
  __esModule: true,
  default: mockLogger,
}));
global.crypto = crypto; // shall be used by tests under nodejs CLI, but not in RN environment

jest.mock('../../BlueElectrum', () => ({
  getDustValue: jest.fn().mockResolvedValue(546),
}));

const { SegwitP2SHWallet, AppStorage } = require('../../class');

jest.useFakeTimers();

const originalNavigator = global.navigator;

const setReactNativeNavigator = () => {
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: { product: 'ReactNative' },
  });
};

afterEach(() => {
  mockKeychain.getGenericPassword.mockReset();
  mockKeychain.setGenericPassword.mockReset();
  mockKeychain.resetGenericPassword.mockReset();
  mockLegacySecureStore.get.mockReset();
  mockLegacySecureStore.set.mockReset();
  mockLegacySecureStore.remove.mockReset();
  mockLogger.info.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.error.mockReset();
  mockLogger.captureException.mockReset();
  Object.defineProperty(global, 'navigator', {
    configurable: true,
    value: originalNavigator,
  });
});

it('Appstorage - loadFromDisk works', async () => {
  /** @type {AppStorage} */
  const Storage = new AppStorage();
  const w = new SegwitP2SHWallet();

  w.setLabel('testlabel');
  await w.generate();
  Storage.wallets.push(w);
  await Storage.saveToDisk();

  // saved, now trying to load

  const Storage2 = new AppStorage();

  await Storage2.loadFromDisk();
  assert.strictEqual(Storage2.wallets.length, 1);
  assert.strictEqual(Storage2.wallets[0].getLabel(), 'testlabel');
  let isEncrypted = await Storage2.storageIsEncrypted();

  assert.ok(!isEncrypted);

  // emulating encrypted storage (and testing flag)

  await AsyncStorage.setItem('data', false);
  await AsyncStorage.setItem(AppStorage.FLAG_ENCRYPTED, '1');
  const Storage3 = new AppStorage();

  isEncrypted = await Storage3.storageIsEncrypted();
  assert.ok(isEncrypted);
});

it('Appstorage - encryptStorage & load encrypted storage works', async () => {
  /** @type {AppStorage} */
  const Storage = new AppStorage();
  let w = new SegwitP2SHWallet();

  w.setLabel('testlabel');
  await w.generate();
  Storage.wallets.push(w);
  await Storage.saveToDisk();
  let isEncrypted = await Storage.storageIsEncrypted();

  assert.ok(!isEncrypted);
  await Storage.encryptStorage('password');
  isEncrypted = await Storage.storageIsEncrypted();
  assert.strictEqual(Storage.cachedPassword, 'password');
  assert.ok(isEncrypted);

  // saved, now trying to load, using good password

  let Storage2 = new AppStorage();

  isEncrypted = await Storage2.storageIsEncrypted();
  assert.ok(isEncrypted);
  let loadResult = await Storage2.loadFromDisk('password');

  assert.ok(loadResult);
  assert.strictEqual(Storage2.wallets.length, 1);
  assert.strictEqual(Storage2.wallets[0].getLabel(), 'testlabel');

  // now trying to load, using bad password

  Storage2 = new AppStorage();
  isEncrypted = await Storage2.storageIsEncrypted();
  assert.ok(isEncrypted);
  loadResult = await Storage2.loadFromDisk('passwordBAD');
  assert.ok(!loadResult);
  assert.strictEqual(Storage2.wallets.length, 0);

  // now, trying case with adding data after decrypt.
  // saveToDisk should be handled correctly

  Storage2 = new AppStorage();
  isEncrypted = await Storage2.storageIsEncrypted();
  assert.ok(isEncrypted);
  loadResult = await Storage2.loadFromDisk('password');
  assert.ok(loadResult);
  assert.strictEqual(Storage2.wallets.length, 1);
  assert.strictEqual(Storage2.wallets[0].getLabel(), 'testlabel');
  w = new SegwitP2SHWallet();
  w.setLabel('testlabel2');
  await w.generate();
  Storage2.wallets.push(w);
  assert.strictEqual(Storage2.wallets.length, 2);
  assert.strictEqual(Storage2.wallets[1].getLabel(), 'testlabel2');
  await Storage2.saveToDisk();
  // saved to encrypted storage after load. next load should be successfull
  Storage2 = new AppStorage();
  isEncrypted = await Storage2.storageIsEncrypted();
  assert.ok(isEncrypted);
  loadResult = await Storage2.loadFromDisk('password');
  assert.ok(loadResult);
  assert.strictEqual(Storage2.wallets.length, 2);
  assert.strictEqual(Storage2.wallets[0].getLabel(), 'testlabel');
  assert.strictEqual(Storage2.wallets[1].getLabel(), 'testlabel2');

  // next, adding new `fake` storage which should be unlocked with `fake` password
  const createFakeStorageResult = await Storage2.createFakeStorage('fakePassword');

  assert.ok(createFakeStorageResult);
  assert.strictEqual(Storage2.wallets.length, 0);
  assert.strictEqual(Storage2.cachedPassword, 'fakePassword');
  w = new SegwitP2SHWallet();
  w.setLabel('fakewallet');
  await w.generate();
  Storage2.wallets.push(w);
  await Storage2.saveToDisk();
  // now, will try to load & decrypt with real password and with fake password
  // real:
  let Storage3 = new AppStorage();

  loadResult = await Storage3.loadFromDisk('password');
  assert.ok(loadResult);
  assert.strictEqual(Storage3.wallets.length, 2);
  assert.strictEqual(Storage3.wallets[0].getLabel(), 'testlabel');
  // fake:
  Storage3 = new AppStorage();
  loadResult = await Storage3.loadFromDisk('fakePassword');
  assert.ok(loadResult);
  assert.strictEqual(Storage3.wallets.length, 1);
  assert.strictEqual(Storage3.wallets[0].getLabel(), 'fakewallet');
});

it('Appstorage - React Native storage writes new values to keychain only', async () => {
  setReactNativeNavigator();
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  const Storage = new AppStorage();

  await expect(Storage.setItem('data', 'wallet-json')).resolves.toEqual({ service: 'data', storage: 'keychain' });
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockLegacySecureStore.set).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage does not write new values to the legacy store', async () => {
  setReactNativeNavigator();
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  const Storage = new AppStorage();

  await expect(Storage.setItem('data', 'wallet-json')).resolves.toEqual({ service: 'data', storage: 'keychain' });
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockLegacySecureStore.set).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage removes values from current and legacy stores', async () => {
  setReactNativeNavigator();
  mockLegacySecureStore.remove.mockResolvedValueOnce('removed');
  mockKeychain.resetGenericPassword.mockResolvedValueOnce(true);
  const Storage = new AppStorage();

  await expect(Storage.removeItem(AppStorage.FLAG_ENCRYPTED)).resolves.toBe(true);
  expect(mockLegacySecureStore.remove).toHaveBeenCalledWith(AppStorage.FLAG_ENCRYPTED);
  expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
    service: AppStorage.FLAG_ENCRYPTED,
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage still removes current value when legacy cleanup fails', async () => {
  setReactNativeNavigator();
  mockLegacySecureStore.remove.mockRejectedValueOnce(new Error('legacy value absent'));
  mockKeychain.resetGenericPassword.mockResolvedValueOnce(true);
  const Storage = new AppStorage();

  await expect(Storage.removeItem(AppStorage.FLAG_ENCRYPTED)).resolves.toBe(true);
  expect(mockLegacySecureStore.remove).toHaveBeenCalledWith(AppStorage.FLAG_ENCRYPTED);
  expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
    service: AppStorage.FLAG_ENCRYPTED,
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
});

it('Appstorage - React Native storage reads keychain before legacy store', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce({ password: 'wallet-json' });
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('wallet-json');
  expect(mockLegacySecureStore.get).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage normalizes a null legacy fallback result to missing storage', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacySecureStore.get.mockResolvedValueOnce(null);
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBeNull();
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
  expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage normalizes an undefined legacy fallback result to missing storage', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacySecureStore.get.mockResolvedValueOnce(undefined);
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBeNull();
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
  expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage normalizes a null legacy fallback result after keychain read failure to missing storage', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
  mockLegacySecureStore.get.mockResolvedValueOnce(null);
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBeNull();
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
  expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
  expect(mockLogger.warn).toHaveBeenCalledWith({
    category: 'secure-storage-migration',
    message: 'Keychain wallet read failed; trying legacy secure-storage fallback.',
  });
});

it('Appstorage - React Native storage normalizes an undefined legacy fallback result after keychain read failure to missing storage', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
  mockLegacySecureStore.get.mockResolvedValueOnce(undefined);
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBeNull();
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
  expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
  expect(mockLogger.warn).toHaveBeenCalledWith({
    category: 'secure-storage-migration',
    message: 'Keychain wallet read failed; trying legacy secure-storage fallback.',
  });
});

it('Appstorage - React Native storage migrates legacy value into keychain when keychain is empty', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacySecureStore.get.mockResolvedValueOnce('legacy-wallet-json');
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  mockLegacySecureStore.remove.mockResolvedValueOnce('removed');
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('legacy-wallet-json');
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'legacy-wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('data');
  expect(mockLogger.info).toHaveBeenCalledWith({
    category: 'secure-storage-migration',
    message: 'Legacy secure-storage wallet value found; migrating to Keychain.',
  });
  expect(mockLogger.info).toHaveBeenCalledWith({
    category: 'secure-storage-migration',
    message: 'Legacy secure-storage wallet value migrated to Keychain.',
  });
  expect(mockLogger.info).toHaveBeenCalledWith({
    category: 'secure-storage-migration',
    message: 'Migrated legacy secure-storage wallet value removed from legacy backend.',
  });
});

it('Appstorage - React Native storage falls back to legacy value when keychain read fails', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
  mockLegacySecureStore.get.mockResolvedValueOnce('legacy-wallet-json');
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  mockLegacySecureStore.remove.mockResolvedValueOnce('removed');
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('legacy-wallet-json');
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockLogger.warn).toHaveBeenCalledWith({
    category: 'secure-storage-migration',
    message: 'Keychain wallet read failed; trying legacy secure-storage fallback.',
  });
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'legacy-wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('data');
});

it('Appstorage - React Native storage keeps legacy value when keychain migration write fails', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacySecureStore.get.mockResolvedValueOnce('legacy-wallet-json');
  mockKeychain.setGenericPassword.mockRejectedValueOnce(new Error('keychain write unavailable'));
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('legacy-wallet-json');
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'legacy-wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
  expect(mockLogger.warn).toHaveBeenCalledWith({
    category: 'secure-storage-migration',
    message: 'Legacy secure-storage wallet migration to Keychain failed; returning legacy value.',
  });
});

it('Appstorage - React Native storage keeps migrated legacy value when legacy cleanup fails', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacySecureStore.get.mockResolvedValueOnce('legacy-wallet-json');
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  mockLegacySecureStore.remove.mockRejectedValueOnce(new Error('legacy cleanup unavailable'));
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('legacy-wallet-json');
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'legacy-wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('data');
  expect(mockLogger.warn).toHaveBeenCalledWith({
    category: 'secure-storage-migration',
    message: 'Legacy secure-storage wallet cleanup failed after migration; value remains readable.',
  });
});
