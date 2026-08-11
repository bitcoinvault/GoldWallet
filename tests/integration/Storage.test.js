import AsyncStorage from '@react-native-async-storage/async-storage';
import assert from 'assert';
import crypto from 'crypto';
import * as mockKeychain from 'react-native-keychain';

const mockLegacyStore = {
  get: jest.fn(),
  remove: jest.fn(),
};
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
jest.mock('../../logger', () => ({
  __esModule: true,
  default: mockLogger,
}));
global.crypto = crypto; // shall be used by tests under nodejs CLI, but not in RN environment

jest.mock('../../BlueElectrum', () => ({
  getDustValue: jest.fn().mockResolvedValue(546),
}));

const { NativeModules } = require('react-native');

NativeModules.GoldWalletLegacySecureStorage = mockLegacyStore;
const { SegwitP2SHWallet, AppStorage } = require('../../class');
const encryption = require('../../encryption');
const { LEGACY_SECURE_STORAGE_DELETION_MARKER } = require('../../src/services/LegacySecureStorageMigration');

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
  mockLegacyStore.get.mockReset();
  mockLegacyStore.remove.mockReset();
  mockLogger.info.mockReset();
  mockLogger.warn.mockReset();
  mockLogger.error.mockReset();
  mockLogger.captureException.mockReset();
  NativeModules.GoldWalletLegacySecureStorage = mockLegacyStore;
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
});

it('Appstorage - React Native storage removes values from keychain', async () => {
  setReactNativeNavigator();
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: AppStorage.FLAG_ENCRYPTED });
  mockLegacyStore.remove.mockResolvedValueOnce(true);
  mockKeychain.resetGenericPassword.mockResolvedValueOnce(true);
  const Storage = new AppStorage();

  await expect(Storage.removeItem(AppStorage.FLAG_ENCRYPTED)).resolves.toBe(true);
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith(LEGACY_SECURE_STORAGE_DELETION_MARKER, 'deleted', {
    service: AppStorage.FLAG_ENCRYPTED,
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockKeychain.resetGenericPassword).toHaveBeenCalledWith({
    service: AppStorage.FLAG_ENCRYPTED,
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
});

it('Appstorage - React Native storage keeps deletion authoritative when marker cleanup fails', async () => {
  setReactNativeNavigator();
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: AppStorage.FLAG_ENCRYPTED });
  mockLegacyStore.remove.mockResolvedValueOnce(true);
  mockKeychain.resetGenericPassword.mockRejectedValueOnce(new Error('keychain cleanup unavailable'));
  const Storage = new AppStorage();

  await expect(Storage.removeItem(AppStorage.FLAG_ENCRYPTED)).resolves.toBe(true);
});

it('Appstorage - React Native storage keeps the marker when legacy cleanup fails', async () => {
  setReactNativeNavigator();
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: AppStorage.FLAG_ENCRYPTED });
  mockLegacyStore.remove.mockRejectedValueOnce(new Error('legacy cleanup unavailable'));
  const Storage = new AppStorage();

  await expect(Storage.removeItem(AppStorage.FLAG_ENCRYPTED)).resolves.toBe(true);
  expect(mockKeychain.resetGenericPassword).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage reads values from keychain', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce({ password: 'wallet-json' });
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('wallet-json');
  expect(mockLegacyStore.get).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage returns missing storage when keychain is empty', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacyStore.get.mockResolvedValueOnce(null);
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBeNull();
  expect(mockLegacyStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage migrates legacy wallet data before cleanup', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacyStore.get.mockResolvedValueOnce('legacy-wallet-json');
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  mockLegacyStore.remove.mockResolvedValueOnce(true);
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('legacy-wallet-json');
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'legacy-wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockLegacyStore.remove).toHaveBeenCalledWith('data');
});

it('Appstorage - React Native storage keeps legacy wallet data when migration write fails', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacyStore.get.mockResolvedValueOnce('legacy-wallet-json');
  mockKeychain.setGenericPassword.mockRejectedValueOnce(new Error('keychain write unavailable'));
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('legacy-wallet-json');
  expect(mockLegacyStore.remove).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage skips stale fallback after a keychain read failure', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
  mockLegacyStore.get.mockResolvedValueOnce('legacy-wallet-json');
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBeNull();
  expect(mockLegacyStore.get).not.toHaveBeenCalled();
  expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage does not restore data behind a deletion marker', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce({
    username: LEGACY_SECURE_STORAGE_DELETION_MARKER,
    password: 'deleted',
  });
  mockLegacyStore.get.mockResolvedValueOnce('stale-wallet-json');
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBeNull();
  expect(mockLegacyStore.get).not.toHaveBeenCalled();
});

it('Appstorage - React Native storage validates fallback-free encrypted wallet data from keychain', async () => {
  const sourceStorage = new AppStorage();
  const wallet = new SegwitP2SHWallet();

  wallet.setLabel('keychain-only-wallet');
  await wallet.generate();
  sourceStorage.wallets.push(wallet);
  await sourceStorage.saveToDisk();

  const serializedWalletData = await AsyncStorage.getItem('data');
  const encryptedWalletBuckets = JSON.stringify([encryption.encrypt(serializedWalletData, 'password')]);

  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockImplementation(({ service }) => {
    if (service === AppStorage.FLAG_ENCRYPTED) {
      return Promise.resolve({ password: '1' });
    }

    if (service === 'data') {
      return Promise.resolve({ password: encryptedWalletBuckets });
    }

    return Promise.resolve(false);
  });

  const keychainOnlyStorage = new AppStorage();

  await expect(keychainOnlyStorage.storageIsEncrypted()).resolves.toBe(true);
  await expect(keychainOnlyStorage.loadFromDisk('password')).resolves.toBe(true);
  expect(keychainOnlyStorage.wallets).toHaveLength(1);
  expect(keychainOnlyStorage.wallets[0].getLabel()).toBe('keychain-only-wallet');
});

it('Appstorage - React Native storage returns missing storage when keychain read fails', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
  mockLegacyStore.get.mockRejectedValueOnce(new Error('legacy storage unavailable'));
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBeNull();
  expect(mockKeychain.setGenericPassword).not.toHaveBeenCalled();
});
