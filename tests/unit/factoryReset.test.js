const mockPurge = jest.fn();
const mockFlush = jest.fn();
const mockPause = jest.fn();
const mockPurgeStore = jest.fn();
const mockDeleteBiometrics = jest.fn();
const mockClearPinSession = jest.fn();
const mockWipeStore = jest.fn();
const mockRemoveSecuredPassword = jest.fn();
const mockDispatch = jest.fn();
const mockExitApp = jest.fn();

jest.mock('react-native-exit-app', () => ({
  __esModule: true,
  default: { exitApp: mockExitApp },
}));
jest.mock('app/consts', () => ({ CONST: { pin: 'pin', transactionPassword: 'transactionPassword' } }));
jest.mock('app/legacy', () => ({ BlueApp: { purgeStore: mockPurgeStore } }));
jest.mock('app/services', () => ({
  BiometricService: { deleteBiometrics: mockDeleteBiometrics },
  PinSessionVerifier: { clear: mockClearPinSession },
  SecureStorageService: { removeSecuredPassword: mockRemoveSecuredPassword },
  StoreService: { wipeStore: mockWipeStore },
}));
jest.mock('app/state/store', () => ({
  persistor: { purge: mockPurge, flush: mockFlush, pause: mockPause },
  store: { dispatch: mockDispatch },
}));

const { factoryReset } = require('../../src/helpers/factoryReset');

describe('factoryReset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPurge.mockResolvedValue(undefined);
    mockPurgeStore.mockResolvedValue(undefined);
    mockFlush.mockResolvedValue(undefined);
    mockPause.mockResolvedValue(undefined);
    mockRemoveSecuredPassword.mockResolvedValue(true);
  });

  it('waits for PIN and transaction password deletion before resetting and exiting', async () => {
    let finishPinRemoval;
    let finishTransactionPasswordRemoval;

    mockRemoveSecuredPassword
      .mockImplementationOnce(() => new Promise(resolve => (finishPinRemoval = resolve)))
      .mockImplementationOnce(() => new Promise(resolve => (finishTransactionPasswordRemoval = resolve)));

    const resetPromise = factoryReset();

    for (let attempt = 0; attempt < 10 && mockRemoveSecuredPassword.mock.calls.length < 2; attempt += 1) {
      await Promise.resolve();
    }
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockExitApp).not.toHaveBeenCalled();

    finishPinRemoval(true);
    finishTransactionPasswordRemoval(true);
    await resetPromise;

    expect(mockRemoveSecuredPassword).toHaveBeenCalledWith('pin');
    expect(mockRemoveSecuredPassword).toHaveBeenCalledWith('transactionPassword');
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET' });
    expect(mockExitApp).toHaveBeenCalled();
  });
});
