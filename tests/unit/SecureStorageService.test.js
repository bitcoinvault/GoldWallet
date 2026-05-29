import sha256 from 'crypto-js/sha256';

const mockSecureStore = {
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
};

jest.mock('react-native-secure-key-store', () => ({
  __esModule: true,
  default: mockSecureStore,
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  },
}));

const SecureStorageService = require('../../src/services/SecureStorageService').default;

describe('unit - SecureStorageService', function() {
  let service;

  beforeEach(function() {
    service = new SecureStorageService();
    mockSecureStore.get.mockReset();
    mockSecureStore.set.mockReset();
    mockSecureStore.remove.mockReset();
  });

  it('returns an empty string when a secured value is unavailable', async function() {
    mockSecureStore.get.mockRejectedValueOnce(new Error('missing'));

    await expect(service.getSecuredValue('pin')).resolves.toBe('');
    expect(mockSecureStore.get).toHaveBeenCalledWith('pin');
  });

  it('stores plain values with the current accessibility mode', async function() {
    mockSecureStore.set.mockResolvedValueOnce('ok');

    await expect(service.setSecuredValue('pin', '1234')).resolves.toBe('ok');
    expect(mockSecureStore.set).toHaveBeenCalledWith('pin', '1234', {
      accessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    });
  });

  it('hashes encoded values before storing them', async function() {
    mockSecureStore.set.mockResolvedValueOnce('ok');

    await expect(service.setSecuredValue('transactionPassword', 'secret', true)).resolves.toBe('ok');
    expect(mockSecureStore.set).toHaveBeenCalledWith('transactionPassword', sha256('secret').toString(), {
      accessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    });
  });

  it('checks transaction passwords against the stored hash', async function() {
    mockSecureStore.get.mockResolvedValueOnce(sha256('secret').toString());

    await expect(service.checkSecuredPassword('transactionPassword', 'secret')).resolves.toBe(true);
  });

  it('removes secured values through the native store', async function() {
    mockSecureStore.remove.mockResolvedValueOnce('removed');

    await expect(service.removeSecuredPassword('pin')).resolves.toBe('removed');
    expect(mockSecureStore.remove).toHaveBeenCalledWith('pin');
  });
});
