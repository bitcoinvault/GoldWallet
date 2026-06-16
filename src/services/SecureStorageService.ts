import sha256 from 'crypto-js/sha256';
import * as Keychain from 'react-native-keychain';
import RNSecureKeyStore from 'react-native-secure-key-store';

import logger from '../../logger';

const secureStorageMigrationLogCategory = 'secure-storage-migration';

const secureStorageOptions = (key: string) => ({
  service: key,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

const logSecureStorageMigrationInfo = (message: string) =>
  logger.info({
    category: secureStorageMigrationLogCategory,
    message,
  });

const logSecureStorageMigrationWarning = (message: string) =>
  logger.warn({
    category: secureStorageMigrationLogCategory,
    message,
  });

export default class SecureStorageService {
  async getSecuredValue(key: string): Promise<string> {
    try {
      const credentials = await Keychain.getGenericPassword(secureStorageOptions(key));

      if (credentials) {
        return credentials.password;
      }
    } catch (_) {
      logSecureStorageMigrationWarning('Keychain read failed; trying legacy secure-storage fallback.');
    }

    try {
      const legacyValue = await RNSecureKeyStore.get(key);

      if (legacyValue) {
        logSecureStorageMigrationInfo('Legacy secure-storage value found; migrating to Keychain.');

        try {
          await Keychain.setGenericPassword(key, legacyValue, secureStorageOptions(key));
          logSecureStorageMigrationInfo('Legacy secure-storage value migrated to Keychain.');

          try {
            await RNSecureKeyStore.remove(key);
            logSecureStorageMigrationInfo('Migrated legacy secure-storage value removed from legacy backend.');
          } catch (_) {
            logSecureStorageMigrationWarning(
              'Legacy secure-storage cleanup failed after migration; value remains readable.',
            );
          }
        } catch (_) {
          logSecureStorageMigrationWarning(
            'Legacy secure-storage migration to Keychain failed; returning legacy value.',
          );
        }
      }

      return legacyValue;
    } catch (_) {
      return '';
    }
  }

  async setSecuredValue(key: string, value: string, encode?: boolean) {
    if (encode) {
      value = sha256(value).toString();
    }

    return Keychain.setGenericPassword(key, value, secureStorageOptions(key));
  }

  async checkSecuredPassword(key: string, value: string) {
    const securedStoredPassword = await this.getSecuredValue(key);

    return sha256(value).toString() === securedStoredPassword;
  }

  async removeSecuredPassword(key: string) {
    try {
      await RNSecureKeyStore.remove(key);
    } catch (_) {
      // Keychain cleanup should still run if the legacy value is already absent.
    }

    return await Keychain.resetGenericPassword(secureStorageOptions(key));
  }
}
