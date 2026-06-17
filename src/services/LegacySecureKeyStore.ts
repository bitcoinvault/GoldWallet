import { NativeModules } from 'react-native';

type LegacySecureKeyStoreModule = {
  get: (key: string) => Promise<string | null | undefined>;
  remove: (key: string) => Promise<unknown>;
};

const getNativeLegacySecureKeyStore = (): Partial<LegacySecureKeyStoreModule> | null => {
  const nativeModules = NativeModules as { RNSecureKeyStore?: Partial<LegacySecureKeyStoreModule> };

  return nativeModules.RNSecureKeyStore || null;
};

const rejectUnavailable = (operation: string): Promise<never> =>
  Promise.reject(new Error(`Legacy secure-storage native module is unavailable for ${operation}`));

const LegacySecureKeyStore: LegacySecureKeyStoreModule = {
  get(key: string) {
    const legacySecureKeyStore = getNativeLegacySecureKeyStore();

    if (typeof legacySecureKeyStore?.get !== 'function') {
      return rejectUnavailable('get');
    }

    return legacySecureKeyStore.get(key);
  },

  remove(key: string) {
    const legacySecureKeyStore = getNativeLegacySecureKeyStore();

    if (typeof legacySecureKeyStore?.remove !== 'function') {
      return rejectUnavailable('remove');
    }

    return legacySecureKeyStore.remove(key);
  },
};

export default LegacySecureKeyStore;
