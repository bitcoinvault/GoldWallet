import { NativeModules } from 'react-native';

type LegacySecureStorageMigrationModule = {
  get: (key: string) => Promise<string | null | undefined>;
  remove: (key: string) => Promise<boolean>;
};

export const LEGACY_SECURE_STORAGE_DELETION_MARKER = 'GoldWalletLegacySecureStorageDeleted:v1';

const getNativeModule = (): Partial<LegacySecureStorageMigrationModule> | null => {
  const nativeModules = NativeModules as {
    GoldWalletLegacySecureStorage?: Partial<LegacySecureStorageMigrationModule>;
  };

  return nativeModules.GoldWalletLegacySecureStorage || null;
};

const rejectUnavailable = (operation: string): Promise<never> =>
  Promise.reject(new Error(`Legacy secure-storage migration module is unavailable for ${operation}`));

const LegacySecureStorageMigration: LegacySecureStorageMigrationModule = {
  get(key: string) {
    const nativeModule = getNativeModule();

    return typeof nativeModule?.get === 'function' ? nativeModule.get(key) : rejectUnavailable('get');
  },

  remove(key: string) {
    const nativeModule = getNativeModule();

    return typeof nativeModule?.remove === 'function' ? nativeModule.remove(key) : rejectUnavailable('remove');
  },
};

export default LegacySecureStorageMigration;
