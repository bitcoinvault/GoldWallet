import sha256 from 'crypto-js/sha256';

const mockSecureStore = {
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
};
const mockLegacySecureStore = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
};
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  captureException: jest.fn(),
};

jest.mock('react-native-keychain', () => ({
  __esModule: true,
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
  },
  getGenericPassword: mockSecureStore.getGenericPassword,
  setGenericPassword: mockSecureStore.setGenericPassword,
  resetGenericPassword: mockSecureStore.resetGenericPassword,
}));
jest.mock('react-native-secure-key-store', () => ({
  __esModule: true,
  default: mockLegacySecureStore,
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'LegacyAccessibleWhenUnlockedThisDeviceOnly',
  },
}));
jest.mock('../../logger', () => ({
  __esModule: true,
  default: mockLogger,
}));

const SecureStorageService = require('../../src/services/SecureStorageService').default;

describe('unit - SecureStorageService', function () {
  let service;

  beforeEach(function () {
    service = new SecureStorageService();
    mockSecureStore.getGenericPassword.mockReset();
    mockSecureStore.setGenericPassword.mockReset();
    mockSecureStore.resetGenericPassword.mockReset();
    mockLegacySecureStore.get.mockReset();
    mockLegacySecureStore.set.mockReset();
    mockLegacySecureStore.remove.mockReset();
    mockLogger.info.mockReset();
    mockLogger.warn.mockReset();
    mockLogger.error.mockReset();
    mockLogger.captureException.mockReset();
  });

  it('returns an empty string when a secured value is unavailable', async function () {
    mockSecureStore.getGenericPassword.mockRejectedValueOnce(new Error('missing'));
    mockLegacySecureStore.get.mockRejectedValueOnce(new Error('missing'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockSecureStore.getGenericPassword).toHaveBeenCalledWith({
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
  });

  it('returns an empty string when keychain has no credentials for the key', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacySecureStore.get.mockRejectedValueOnce(new Error('missing'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
  });

  it('normalizes a null legacy fallback result to an empty secured value', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacySecureStore.get.mockResolvedValueOnce(null);

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
    expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
  });

  it('normalizes an undefined legacy fallback result to an empty secured value', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacySecureStore.get.mockResolvedValueOnce(undefined);

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
    expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
  });

  it('normalizes a null legacy fallback result after keychain read failure to an empty secured value', async function () {
    mockSecureStore.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
    mockLegacySecureStore.get.mockResolvedValueOnce(null);

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
    expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith({
      category: 'secure-storage-migration',
      message: 'Keychain read failed; trying legacy secure-storage fallback.',
    });
  });

  it('normalizes an undefined legacy fallback result after keychain read failure to an empty secured value', async function () {
    mockSecureStore.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
    mockLegacySecureStore.get.mockResolvedValueOnce(undefined);

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
    expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith({
      category: 'secure-storage-migration',
      message: 'Keychain read failed; trying legacy secure-storage fallback.',
    });
  });

  it('returns keychain credentials without touching the legacy secure store', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({ password: '1234' });

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockSecureStore.getGenericPassword).toHaveBeenCalledWith({
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
    expect(mockLegacySecureStore.get).not.toHaveBeenCalled();
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('falls back to the legacy secure store and migrates the value into keychain', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacySecureStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacySecureStore.remove.mockResolvedValueOnce('removed');

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
    expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('pin');
    expect(mockLogger.info).toHaveBeenCalledWith({
      category: 'secure-storage-migration',
      message: 'Legacy secure-storage value found; migrating to Keychain.',
    });
    expect(mockLogger.info).toHaveBeenCalledWith({
      category: 'secure-storage-migration',
      message: 'Legacy secure-storage value migrated to Keychain.',
    });
    expect(mockLogger.info).toHaveBeenCalledWith({
      category: 'secure-storage-migration',
      message: 'Migrated legacy secure-storage value removed from legacy backend.',
    });
  });

  it('falls back to the legacy secure store when keychain read fails', async function () {
    mockSecureStore.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
    mockLegacySecureStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacySecureStore.remove.mockResolvedValueOnce('removed');

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockLogger.warn).toHaveBeenCalledWith({
      category: 'secure-storage-migration',
      message: 'Keychain read failed; trying legacy secure-storage fallback.',
    });
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
    expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('pin');
  });

  it('keeps returning the legacy value when keychain migration write fails', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacySecureStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockRejectedValueOnce(new Error('keychain write unavailable'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
    expect(mockLegacySecureStore.remove).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith({
      category: 'secure-storage-migration',
      message: 'Legacy secure-storage migration to Keychain failed; returning legacy value.',
    });
  });

  it('keeps returning the migrated legacy value when legacy cleanup fails', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacySecureStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacySecureStore.remove.mockRejectedValueOnce(new Error('legacy cleanup unavailable'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
    expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('pin');
    expect(mockLogger.warn).toHaveBeenCalledWith({
      category: 'secure-storage-migration',
      message: 'Legacy secure-storage cleanup failed after migration; value remains readable.',
    });
  });

  it('stores plain values with the current accessibility mode', async function () {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });

    await expect(service.setSecuredValue('pin', '1234')).resolves.toEqual({ service: 'pin', storage: 'keychain' });
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
    expect(mockLegacySecureStore.set).not.toHaveBeenCalled();
  });

  it('does not write new values to the legacy secure store', async function () {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });

    await expect(service.setSecuredValue('pin', '1234')).resolves.toEqual({ service: 'pin', storage: 'keychain' });
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
    expect(mockLegacySecureStore.set).not.toHaveBeenCalled();
  });

  it('hashes encoded values before storing them', async function () {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'transactionPassword', storage: 'keychain' });

    await expect(service.setSecuredValue('transactionPassword', 'secret', true)).resolves.toEqual({
      service: 'transactionPassword',
      storage: 'keychain',
    });
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith(
      'transactionPassword',
      sha256('secret').toString(),
      {
        service: 'transactionPassword',
        accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
      },
    );
    expect(mockLegacySecureStore.set).not.toHaveBeenCalled();
  });

  it('checks transaction passwords against the stored hash', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({
      password: sha256('secret').toString(),
    });

    await expect(service.checkSecuredPassword('transactionPassword', 'secret')).resolves.toBe(true);
  });

  it('rejects transaction passwords that do not match the stored hash', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({
      password: sha256('secret').toString(),
    });

    await expect(service.checkSecuredPassword('transactionPassword', 'wrong-secret')).resolves.toBe(false);
  });

  it('removes secured values through the native store', async function () {
    mockSecureStore.resetGenericPassword.mockResolvedValueOnce(true);
    mockLegacySecureStore.remove.mockResolvedValueOnce('removed');

    await expect(service.removeSecuredPassword('pin')).resolves.toBe(true);
    expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.resetGenericPassword).toHaveBeenCalledWith({
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
  });

  it('continues keychain cleanup when legacy secure store removal fails', async function () {
    mockLegacySecureStore.remove.mockRejectedValueOnce(new Error('legacy value absent'));
    mockSecureStore.resetGenericPassword.mockResolvedValueOnce(true);

    await expect(service.removeSecuredPassword('pin')).resolves.toBe(true);
    expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.resetGenericPassword).toHaveBeenCalledWith({
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
  });
});
