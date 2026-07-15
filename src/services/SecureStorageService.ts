import sha256 from 'crypto-js/sha256';
import * as Keychain from 'react-native-keychain';

const secureStorageOptions = (key: string) => ({
  service: key,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

export default class SecureStorageService {
  async getSecuredValue(key: string): Promise<string> {
    try {
      const credentials = await Keychain.getGenericPassword(secureStorageOptions(key));

      return credentials ? credentials.password : '';
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
    return Keychain.resetGenericPassword(secureStorageOptions(key));
  }
}
