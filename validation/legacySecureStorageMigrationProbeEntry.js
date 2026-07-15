const { NativeModules } = require('react-native');

const legacySecureKeyStore = NativeModules.RNSecureKeyStore;
const originalRemove = legacySecureKeyStore?.remove?.bind(legacySecureKeyStore);

if (!originalRemove) {
  throw new Error('Historical migration probe requires the RNSecureKeyStore native module.');
}

global.GOLDWALLET_LEGACY_STORAGE_MIGRATION_PROBE_ENTRY = true;

legacySecureKeyStore.remove = async key => {
  const result = await originalRemove(key);

  console.warn(`GOLDWALLET_LEGACY_MIGRATION_REMOVED:${key}`);
  return result;
};

setTimeout(() => {
  ['pin', 'transactionPassword', 'data_encrypted', 'data'].forEach(key => {
    legacySecureKeyStore.get(key).catch(() => undefined);
  });
}, 12000);

require('../index');
