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

const SecureStorageService = require('../../src/services/SecureStorageService').default;

describe('unit - SecureStorageService', function() {
  let service;

  beforeEach(function() {
    service = new SecureStorageService();
    mockSecureStore.getGenericPassword.mockReset();
    mockSecureStore.setGenericPassword.mockReset();
    mockSecureStore.resetGenericPassword.mockReset();
    mockLegacySecureStore.get.mockReset();
    mockLegacySecureStore.set.mockReset();
    mockLegacySecureStore.remove.mockReset();
  });

  it('returns an empty string when a secured value is unavailable', async function() {
    mockSecureStore.getGenericPassword.mockRejectedValueOnce(new Error('missing'));
    mockLegacySecureStore.get.mockRejectedValueOnce(new Error('missing'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockSecureStore.getGenericPassword).toHaveBeenCalledWith({
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
  });

  it('returns an empty string when keychain has no credentials for the key', async function() {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacySecureStore.get.mockRejectedValueOnce(new Error('missing'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
  });

  it('falls back to the legacy secure store and migrates the value into keychain', async function() {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);
    mockLegacySecureStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
  });

  it('falls back to the legacy secure store when keychain read fails', async function() {
    mockSecureStore.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));
    mockLegacySecureStore.get.mockResolvedValueOnce('1234');
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockLegacySecureStore.get).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
  });

  it('stores plain values with the current accessibility mode', async function() {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'pin', storage: 'keychain' });
    mockLegacySecureStore.set.mockResolvedValueOnce('ok');

    await expect(service.setSecuredValue('pin', '1234')).resolves.toEqual({ service: 'pin', storage: 'keychain' });
    expect(mockLegacySecureStore.set).toHaveBeenCalledWith('pin', '1234', {
      accessible: 'LegacyAccessibleWhenUnlockedThisDeviceOnly',
    });
    expect(mockSecureStore.setGenericPassword).toHaveBeenCalledWith('pin', '1234', {
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
  });

  it('hashes encoded values before storing them', async function() {
    mockSecureStore.setGenericPassword.mockResolvedValueOnce({ service: 'transactionPassword', storage: 'keychain' });
    mockLegacySecureStore.set.mockResolvedValueOnce('ok');

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
    expect(mockLegacySecureStore.set).toHaveBeenCalledWith('transactionPassword', sha256('secret').toString(), {
      accessible: 'LegacyAccessibleWhenUnlockedThisDeviceOnly',
    });
  });

  it('checks transaction passwords against the stored hash', async function() {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({
      password: sha256('secret').toString(),
    });

    await expect(service.checkSecuredPassword('transactionPassword', 'secret')).resolves.toBe(true);
  });

  it('removes secured values through the native store', async function() {
    mockSecureStore.resetGenericPassword.mockResolvedValueOnce(true);
    mockLegacySecureStore.remove.mockResolvedValueOnce('removed');

    await expect(service.removeSecuredPassword('pin')).resolves.toBe(true);
    expect(mockLegacySecureStore.remove).toHaveBeenCalledWith('pin');
    expect(mockSecureStore.resetGenericPassword).toHaveBeenCalledWith({
      service: 'pin',
      accessible: 'AccessibleWhenUnlockedThisDeviceOnly',
    });
  });
});
