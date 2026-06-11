import sha256 from 'crypto-js/sha256';
import * as Keychain from 'react-native-keychain';
import RNSecureKeyStore from 'react-native-secure-key-store';

const secureStorageOptions = (key: string) => ({
  service: key,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

export default class SecureStorageService {
  async getSecuredValue(key: string): Promise<string> {
    try {
      const credentials = await Keychain.getGenericPassword(secureStorageOptions(key));

      if (credentials) {
        return credentials.password;
      }
    } catch (_) {
      // Fallback below keeps existing secure-key-store values readable during the staged migration.
    }

    try {
      const legacyValue = await RNSecureKeyStore.get(key);

      if (legacyValue) {
        try {
          await Keychain.setGenericPassword(key, legacyValue, secureStorageOptions(key));
          await RNSecureKeyStore.remove(key);
        } catch (_) {
          // Keep the legacy value usable even if a one-off migration write or cleanup fails.
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
