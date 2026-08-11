const { NativeModules } = require('react-native');

const legacySecureStorage = NativeModules.GoldWalletLegacySecureStorage;
const originalGet = legacySecureStorage?.get?.bind(legacySecureStorage);
const originalRemove = legacySecureStorage?.remove?.bind(legacySecureStorage);

if (!originalGet || !originalRemove) {
  throw new Error('Historical migration probe requires the first-party migration bridge.');
}

global.GOLDWALLET_LEGACY_STORAGE_MIGRATION_PROBE_ENTRY = true;

legacySecureStorage.get = async key => {
  const value = await originalGet(key);

  if (value != null) {
    console.warn(`GOLDWALLET_LEGACY_MIGRATION_FOUND:${key}`);
  }

  return value;
};

legacySecureStorage.remove = async key => {
  const result = await originalRemove(key);

  console.warn(`GOLDWALLET_LEGACY_MIGRATION_MIGRATED:${key}`);
  console.warn(`GOLDWALLET_LEGACY_MIGRATION_REMOVED:${key}`);
  return result;
};

setTimeout(async () => {
  for (const key of ['pin', 'transactionPassword', 'data_encrypted', 'data']) {
    try {
      const value = await originalGet(key);

      console.warn(`GOLDWALLET_LEGACY_MIGRATION_ABSENT:${key}:${value == null ? 'yes' : 'no'}`);
    } catch (_) {
      console.warn(`GOLDWALLET_LEGACY_MIGRATION_ABSENT:${key}:error`);
    }
  }
}, 12000);

require('../index');
