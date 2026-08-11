import sha256 from 'crypto-js/sha256';
import * as Keychain from 'react-native-keychain';

import LegacySecureStorageMigration, { LEGACY_SECURE_STORAGE_DELETION_MARKER } from './LegacySecureStorageMigration';
import logger from '../../logger';

const migrationLogCategory = 'secure-storage-migration';

const secureStorageOptions = (key: string) => ({
  service: key,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

const logMigrationInfo = (message: string) => logger.info({ category: migrationLogCategory, message });
const logMigrationWarning = (message: string) => logger.warn({ category: migrationLogCategory, message });

export default class SecureStorageService {
  async getSecuredValue(key: string): Promise<string> {
    try {
      const credentials = await Keychain.getGenericPassword(secureStorageOptions(key));

      if (credentials) {
        if (credentials.username === LEGACY_SECURE_STORAGE_DELETION_MARKER) {
          return '';
        }

        return credentials.password;
      }
    } catch (_) {
      logMigrationWarning('Keychain read failed; legacy fallback was skipped.');
      return '';
    }

    try {
      const legacyValue = await LegacySecureStorageMigration.get(key);

      if (!legacyValue) {
        return '';
      }

      logMigrationInfo('Legacy secure-storage value found; migrating it to Keychain.');
      try {
        await Keychain.setGenericPassword(key, legacyValue, secureStorageOptions(key));
        logMigrationInfo('Legacy secure-storage value migrated to Keychain.');

        try {
          await LegacySecureStorageMigration.remove(key);
          logMigrationInfo('Migrated legacy secure-storage value removed from the legacy backend.');
        } catch (_) {
          logMigrationWarning('Legacy secure-storage cleanup failed after migration; the value remains readable.');
        }
      } catch (_) {
        logMigrationWarning('Legacy secure-storage migration write failed; returning the legacy value.');
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
    await Keychain.setGenericPassword(LEGACY_SECURE_STORAGE_DELETION_MARKER, 'deleted', secureStorageOptions(key));

    try {
      await LegacySecureStorageMigration.remove(key);
    } catch (_) {
      logMigrationWarning('Legacy secure-storage cleanup failed; the Keychain deletion marker remains active.');
      return true;
    }

    try {
      await Keychain.resetGenericPassword(secureStorageOptions(key));
    } catch (_) {
      logMigrationWarning('Keychain deletion marker cleanup failed; the secured value remains deleted.');
    }

    return true;
  }
}
