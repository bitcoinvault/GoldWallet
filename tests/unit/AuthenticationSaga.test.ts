import { put } from 'redux-saga/effects';

import logger from '../../logger';
import { PinSessionVerifier } from '../../src/services';
import { checkCredentials, checkCredentialsFailure } from '../../src/state/authentication/actions';
import { checkCredentialsSaga } from '../../src/state/authentication/sagas';

jest.mock('../../logger', () => ({
  __esModule: true,
  default: {
    captureException: jest.fn(),
  },
}));

jest.mock('../../src/services', () => ({
  PinSessionVerifier: {
    clear: jest.fn(),
    hasPin: jest.fn(),
    matches: jest.fn(),
    setPin: jest.fn(),
  },
  SecureStorageService: {
    getSecuredValue: jest.fn(),
  },
  StoreService: {},
}));

describe('checkCredentialsSaga', () => {
  it('releases the startup barrier for a non-Error storage rejection', () => {
    const onFailure = jest.fn();
    const saga = checkCredentialsSaga(checkCredentials({ onFailure }));

    saga.next();
    expect(saga.throw('native storage rejection').value).toEqual(
      put(checkCredentialsFailure('native storage rejection')),
    );
    expect(onFailure).not.toHaveBeenCalled();

    expect(saga.next().done).toBe(true);
    expect(PinSessionVerifier.clear).toHaveBeenCalledTimes(1);
    expect(onFailure).toHaveBeenCalledWith('native storage rejection');
    expect(logger.captureException).toHaveBeenCalledWith('native storage rejection');
  });
});
