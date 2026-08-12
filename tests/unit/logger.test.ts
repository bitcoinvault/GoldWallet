import logger from '../../logger';

const sentryMock = jest.requireMock('@sentry/react-native') as {
  addBreadcrumb: jest.Mock;
};

describe('logger Sentry breadcrumbs', () => {
  const originalDev = __DEV__;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(global, '__DEV__', {
      configurable: true,
      value: false,
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(global, '__DEV__', {
      configurable: true,
      value: originalDev,
      writable: true,
    });
  });

  it('lets Sentry assign the breadcrumb timestamp in SDK units', () => {
    logger.info({ category: 'Wallet', message: 'loaded' });

    expect(sentryMock.addBreadcrumb).toHaveBeenCalledWith({
      category: 'Wallet',
      level: 'info',
      message: 'loaded',
    });
  });
});
