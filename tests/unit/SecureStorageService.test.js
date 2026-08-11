import sha256 from 'crypto-js/sha256';

const mockSecureStore = {
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
};
const mockLegacyStore = {
  get: jest.fn(),
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
jest.mock('../../logger', () => ({
  __esModule: true,
  default: mockLogger,
}));

const { NativeModules } = require('react-native');

NativeModules.GoldWalletLegacySecureStorage = mockLegacyStore;
const { LEGACY_SECURE_STORAGE_DELETION_MARKER } = require('../../src/services/LegacySecureStorageMigration');
const SecureStorageService = require('../../src/services/SecureStorageService').default;

const optionsFor = service => ({
  service,
  accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
});

describe('unit - SecureStorageService', function () {
  let service;

  beforeEach(function () {
    service = new SecureStorageService();
    mockSecureStore.getGenericPassword.mockReset();
    mockSecureStore.setGenericPassword.mockReset();
    mockSecureStore.resetGenericPassword.mockReset();
    mockLegacyStore.get.mockReset();
    mockLegacyStore.remove.mockReset();
    mockLogger.info.mockReset();
    mockLogger.warn.mockReset();
    NativeModules.GoldWalletLegacySecureStorage = mockLegacyStore;
  });

  it('returns keychain credentials for the requested service', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({ password: '1234' });

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockSecureStore.getGenericPassword).toHaveBeenCalledWith(optionsFor('pin'));
    expect(mockLegacyStore.get).not.toHaveBeenCalled();
  });

  it('returns an empty string when neither current nor legacy storage has credentials', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacyStore.get.mockResolvedValueOnce(null);

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockLegacyStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
  });

  it('migrates a legacy value after an empty keychain read', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacyStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacyStore.remove.mockResolvedValueOnce(true);

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', optionsFor('pin'));
    expect(mockLegacyStore.remove).toHaveBeenCalledWith('pin');
  });

  it('does not use stale legacy data when the keychain read fails', async function () {
    mockSecureStore.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
    mockLegacyStore.get.mockResolvedValueOnce('1234');

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockLegacyStore.get).not.toHaveBeenCalled();
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.objectContaining({ category: 'secure-storage-migration' }));
  });

  it('treats a keychain deletion marker as authoritative', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({
      username: LEGACY_SECURE_STORAGE_DELETION_MARKER,
      password: 'deleted',
    });
    mockLegacyStore.get.mockResolvedValueOnce('stale-pin');

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockLegacyStore.get).not.toHaveBeenCalled();
  });

  it('returns the legacy value without cleanup when the migration write fails', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacyStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockRejectedValueOnce(new Error('keychain write unavailable'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockLegacyStore.remove).not.toHaveBeenCalled();
  });

  it('returns the migrated value when legacy cleanup fails', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacyStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacyStore.remove.mockRejectedValueOnce(new Error('legacy cleanup unavailable'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
  });

  it('fails closed when the migration native module is unavailable', async function () {
    delete NativeModules.GoldWalletLegacySecureStorage;
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
  });

  it('stores plain values with the current accessibility mode', async function () {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });

    await expect(service.setSecuredValue('pin', '1234')).resolves.toEqual({
      service: 'pin',
      storage: 'keychain',
    });
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', optionsFor('pin'));
  });

  it('hashes transaction passwords before storing them', async function () {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({
      service: 'transactionPassword',
      storage: 'keychain',
    });

    await expect(service.setSecuredValue('transactionPassword', 'secret', true)).resolves.toEqual({
      service: 'transactionPassword',
      storage: 'keychain',
    });
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith(
      'transactionPassword',
      sha256('secret').toString(),
      optionsFor('transactionPassword'),
    );
  });

  it('accepts transaction passwords matching the stored hash', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({ password: sha256('secret').toString() });

    await expect(service.checkSecuredPassword('transactionPassword', 'secret')).resolves.toBe(true);
  });

  it('rejects transaction passwords that do not match the stored hash', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({ password: sha256('secret').toString() });

    await expect(service.checkSecuredPassword('transactionPassword', 'wrong-secret')).resolves.toBe(false);
  });

  it('removes secured values from legacy storage and keychain', async function () {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacyStore.remove.mockResolvedValueOnce(true);
    mockSecureStore.resetGenericPassword.mockResolvedValueOnce(true);

    await expect(service.removeSecuredPassword('pin')).resolves.toBe(true);
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith(
      LEGACY_SECURE_STORAGE_DELETION_MARKER,
      'deleted',
      optionsFor('pin'),
    );
    expect(mockLegacyStore.remove).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.resetGenericPassword).toHaveBeenCalledWith(optionsFor('pin'));
  });

  it('keeps the keychain deletion marker when legacy cleanup fails', async function () {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacyStore.remove.mockRejectedValueOnce(new Error('legacy value absent'));

    await expect(service.removeSecuredPassword('pin')).resolves.toBe(true);
    expect(mockSecureStore.resetGenericPassword).not.toHaveBeenCalled();
  });

  it('does not touch legacy storage when the deletion marker write fails', async function () {
    mockSecureStore.setGenericPassword.mockRejectedValueOnce(new Error('keychain write unavailable'));

    await expect(service.removeSecuredPassword('pin')).rejects.toThrow('keychain write unavailable');
    expect(mockLegacyStore.remove).not.toHaveBeenCalled();
    expect(mockSecureStore.resetGenericPassword).not.toHaveBeenCalled();
  });

  it('propagates keychain write failures', async function () {
    mockSecureStore.setGenericPassword.mockRejectedValueOnce(new Error('keychain write unavailable'));

    await expect(service.setSecuredValue('pin', '1234')).rejects.toThrow('keychain write unavailable');
  });

  it('keeps deletion authoritative when keychain marker cleanup fails', async function () {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacyStore.remove.mockResolvedValueOnce(true);
    mockSecureStore.resetGenericPassword.mockRejectedValueOnce(new Error('keychain cleanup unavailable'));

    await expect(service.removeSecuredPassword('pin')).resolves.toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith(expect.objectContaining({ category: 'secure-storage-migration' }));
  });
});
