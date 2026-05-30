import AsyncStorage from '@react-native-async-storage/async-storage';
import assert from 'assert';
import crypto from 'crypto';
import * as mockKeychain from 'react-native-keychain';
import mockLegacySecureStore from 'react-native-secure-key-store';

import { SegwitP2SHWallet, AppStorage } from '../../class';

jest.mock('react-native-keychain', () => ({
  __esModule: true,
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));
jest.mock('react-native-secure-key-store', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'LegacyAccessibleWhenUnlockedThisDeviceOnly',
  },
}));
global.crypto = crypto; // shall be used by tests under nodejs CLI, but not in RN environment

jest.mock('../../BlueElectrum', () => ({
  getDustValue: jest.fn().mockResolvedValue(546),
}));

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
  mockLegacySecureStore.get.mockReset();
  mockLegacySecureStore.set.mockReset();
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

it('Appstorage - React Native storage writes to legacy store and keychain', async () => {
  setReactNativeNavigator();
  mockLegacySecureStore.set.mockResolvedValueOnce('legacy-ok');
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  const Storage = new AppStorage();

  await expect(Storage.setItem('data', 'wallet-json')).resolves.toEqual({ service: 'data', storage: 'keychain' });
  expect(mockLegacySecureStore.set).toHaveBeenCalledWith('data', 'wallet-json', {
    accessible: 'LegacyAccessibleWhenUnlockedThisDeviceOnly',
  });
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'wallet-json', {
    service: 'data',
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

it('Appstorage - React Native storage migrates legacy value into keychain when keychain is empty', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockResolvedValueOnce(false);
  mockLegacySecureStore.get.mockResolvedValueOnce('legacy-wallet-json');
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('legacy-wallet-json');
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'legacy-wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
});

it('Appstorage - React Native storage falls back to legacy value when keychain read fails', async () => {
  setReactNativeNavigator();
  mockKeychain.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
  mockLegacySecureStore.get.mockResolvedValueOnce('legacy-wallet-json');
  mockKeychain.setGenericPassword.mockResolvedValueOnce({ service: 'data', storage: 'keychain' });
  const Storage = new AppStorage();

  await expect(Storage.getItem('data')).resolves.toBe('legacy-wallet-json');
  expect(mockLegacySecureStore.get).toHaveBeenCalledWith('data');
  expect(mockKeychain.setGenericPassword).toHaveBeenCalledWith('data', 'legacy-wallet-json', {
    service: 'data',
    accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
  });
});
