import sha256 from 'crypto-js/sha256';

const mockSecureStore = {
  getGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
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
  });

  it('returns keychain credentials for the requested service', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce({ password: '1234' });

    await expect(service.getSecuredValue('pin')).resolves.toBe('1234');
    expect(mockSecureStore.getGenericPassword).toHaveBeenCalledWith(optionsFor('pin'));
  });

  it('returns an empty string when keychain has no credentials', async function () {
    mockSecureStore.getGenericPassword.mockResolvedValueOnce(false);

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
  });

  it('returns an empty string when the keychain read fails', async function () {
    mockSecureStore.getGenericPassword.mockRejectedValueOnce(new Error('keychain unavailable'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockSecureStore.setGenericPassword).not.toHaveBeenCalled();
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

  it('removes secured values from keychain', async function () {
    mockSecureStore.resetGenericPassword.mockResolvedValueOnce(true);

    await expect(service.removeSecuredPassword('pin')).resolves.toBe(true);
    expect(mockSecureStore.resetGenericPassword).toHaveBeenCalledWith(optionsFor('pin'));
  });

  it('propagates keychain write failures', async function () {
    mockSecureStore.setGenericPassword.mockRejectedValueOnce(new Error('keychain write unavailable'));

    await expect(service.setSecuredValue('pin', '1234')).rejects.toThrow('keychain write unavailable');
  });

  it('propagates keychain cleanup failures', async function () {
    mockSecureStore.resetGenericPassword.mockRejectedValueOnce(new Error('keychain cleanup unavailable'));

    await expect(service.removeSecuredPassword('pin')).rejects.toThrow('keychain cleanup unavailable');
  });
});
