require('react-native-get-random-values');

const sha256 = require('crypto-js/sha256');
const { NativeModules } = require('react-native');
const { ACCESSIBLE } = require('react-native-secure-key-store');

const { AppStorage } = require('../class/app-storage');
const encryption = require('../encryption');
const { SecureStorageService } = require('../src/services');

const legacySecureKeyStore = NativeModules.RNSecureKeyStore;
const legacyOptions = {
  accessible: ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};
const validationStoragePassphrase = 'GoldWalletHistoricalMigrationFixture';

if (typeof legacySecureKeyStore?.set !== 'function') {
  throw new Error('Historical migration seed requires the RNSecureKeyStore native module.');
}

global.GOLDWALLET_LEGACY_STORAGE_SEED_ENTRY = true;

AppStorage.prototype.setItem = function setLegacyStorageItem(key, value) {
  if (key === 'data') {
    const encryptedBuckets = JSON.stringify([encryption.encrypt(value, validationStoragePassphrase)]);

    return legacySecureKeyStore
      .set(key, encryptedBuckets, legacyOptions)
      .then(() => legacySecureKeyStore.set(AppStorage.FLAG_ENCRYPTED, '1', legacyOptions));
  }

  return legacySecureKeyStore.set(key, value, legacyOptions);
};

AppStorage.prototype.getItem = async function getLegacyStorageItem(key) {
  try {
    if (key === AppStorage.FLAG_ENCRYPTED) return null;

    const value = await legacySecureKeyStore.get(key);

    if (key !== 'data') return value;

    const buckets = JSON.parse(value);

    return encryption.decrypt(buckets[0], validationStoragePassphrase);
  } catch (_) {
    return null;
  }
};

AppStorage.prototype.removeItem = async function removeLegacyStorageItem(key) {
  if (key === AppStorage.FLAG_ENCRYPTED) return;

  return legacySecureKeyStore.remove(key);
};

AppStorage.prototype.storageIsEncrypted = async function seedStorageIsEncrypted() {
  return false;
};

SecureStorageService.setSecuredValue = function setLegacySecuredValue(key, value, encode) {
  const storedValue = encode ? sha256(value).toString() : value;

  return legacySecureKeyStore.set(key, storedValue, legacyOptions);
};

SecureStorageService.getSecuredValue = async function getLegacySecuredValue(key) {
  try {
    return (await legacySecureKeyStore.get(key)) || '';
  } catch (_) {
    return '';
  }
};

require('../index');
