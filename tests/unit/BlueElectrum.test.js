const flushPromises = () => Promise.resolve();

describe('BlueElectrum reconnect handling', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    process.env.BLUEELECTRUM_AUTO_CONNECT = 'true';
  });

  afterEach(() => {
    delete process.env.BLUEELECTRUM_AUTO_CONNECT;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('retries the main Electrum connection after a failed initial attempt', async () => {
    const initElectrum = jest
      .fn()
      .mockRejectedValueOnce(new Error('first connection failed'))
      .mockResolvedValueOnce(['ElectrumX 2.0']);
    const setHost = jest.fn();
    const close = jest.fn();
    const subscribe = {
      off: jest.fn(),
      on: jest.fn(),
    };

    const ElectrumClient = jest.fn().mockImplementation(() => ({
      close,
      initElectrum,
      setHost,
      subscribe,
    }));

    jest.doMock('electrum-client', () => ElectrumClient);
    const mockConfig = {
      APP_ID: 'io.goldwallet.wallet.dev',
      APPLICATION_NAME: 'GoldWallet',
      BTCV_NETWORK: 'bitcoinvaulttestnet',
      ELECTRUM_X_PROTOCOL_VERSION: '2.0',
      ENVIRONMENT: 'dev',
      EXPLORER_URL: 'https://explorer.example',
      HOSTS: 'electrum-one.example,electrum-two.example',
      PORT: '443',
      PROTOCOL: 'tls',
    };

    jest.doMock('react-native-config', () => ({
      __esModule: true,
      default: mockConfig,
      ...mockConfig,
    }));

    const BlueElectrum = require('../../BlueElectrum');

    await flushPromises();

    expect(ElectrumClient).toHaveBeenCalledTimes(1);
    expect(initElectrum).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    await flushPromises();

    expect(ElectrumClient).toHaveBeenCalledTimes(2);
    expect(initElectrum).toHaveBeenCalledTimes(2);

    BlueElectrum.forceDisconnect();
    jest.runOnlyPendingTimers();
  });
});
