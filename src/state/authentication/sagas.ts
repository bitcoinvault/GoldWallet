import logger from 'app/../logger';
import { takeLatest, takeEvery, put, call } from 'redux-saga/effects';

import { CONST, USER_VERSIONS } from 'app/consts';
import { PinSessionVerifier, SecureStorageService, StoreService } from 'app/services';

import {
  createTxPasswordSuccess,
  createTxPasswordFailure,
  createPinSuccess,
  createPinFailure,
  CreatePinAction,
  authenticateSuccess,
  authenticateFailure,
  AuthenticateAction,
  checkCredentialsFailure,
  checkCredentialsSuccess,
  CreateTxPasswordAction,
  CheckCredentialsAction,
  AuthenticationAction,
  SetUserVersionAction,
  setIsTcAccepted,
  setUserVersionSuccess,
  setUserVersionFailure,
} from './actions';

export function* checkCredentialsSaga(action: CheckCredentialsAction | unknown) {
  const { meta } = action as CheckCredentialsAction;

  try {
    const pin: string = yield call(SecureStorageService.getSecuredValue, CONST.pin);
    const transactionPassword: string = yield call(SecureStorageService.getSecuredValue, CONST.transactionPassword);
    const credentials = {
      isPinSet: !!pin,
      isTxPasswordSet: !!transactionPassword,
    };

    PinSessionVerifier.setPin(pin);
    yield put(checkCredentialsSuccess(credentials));
    if (meta?.onSuccess) {
      meta.onSuccess(credentials);
    }
  } catch (e) {
    PinSessionVerifier.clear();
    const errorMessage = e instanceof Error ? e.message : String(e);

    yield put(checkCredentialsFailure(errorMessage));
    if (meta?.onFailure) {
      meta.onFailure(errorMessage);
    }

    logger.captureException(e);
  }
}

export function* authenticateSaga(action: AuthenticateAction | unknown) {
  const { meta, payload } = action as AuthenticateAction;

  try {
    if (!PinSessionVerifier.hasPin()) {
      const storedPin: string = yield call(SecureStorageService.getSecuredValue, CONST.pin);

      PinSessionVerifier.setPin(storedPin);
    }

    if (!PinSessionVerifier.matches(payload.pin)) {
      throw new Error('Wrong pin');
    }
    yield put(authenticateSuccess());

    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (e) {
    if (e instanceof Error) {
      yield put(authenticateFailure(e.message));
    }

    if (meta?.onFailure) {
      meta.onFailure();
    }

    logger.captureException(e);
  }
}

export function* createPinSaga(action: CreatePinAction | unknown) {
  const { meta, payload } = action as CreatePinAction;

  try {
    yield call(SecureStorageService.setSecuredValue, CONST.pin, payload.pin);

    PinSessionVerifier.setPin(payload.pin);
    yield put(createPinSuccess());

    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (e) {
    if (e instanceof Error) {
      yield put(createPinFailure(e.message));
    }
    if (meta?.onFailure) {
      meta.onFailure();
    }

    logger.captureException(e);
  }
}

export function* createTxPasswordSaga(action: CreateTxPasswordAction | unknown) {
  const { meta, payload } = action as CreateTxPasswordAction;

  try {
    yield call(SecureStorageService.setSecuredValue, CONST.transactionPassword, payload.txPassword, true);
    yield put(createTxPasswordSuccess());
    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (e) {
    if (e instanceof Error) {
      yield put(createTxPasswordFailure(e.message));
    }
    if (meta?.onFailure) {
      meta.onFailure();
    }

    logger.captureException(e);
  }
}

export function* checkTcSaga() {
  const tcVersion: string = yield call(StoreService.getStoreValue, CONST.tcVersion);

  if (tcVersion && Number(tcVersion) >= CONST.tcVersionRequired) {
    yield put(setIsTcAccepted(true));
  }
}

export function* setUserVersionSaga(action: SetUserVersionAction | unknown) {
  const { payload } = action as SetUserVersionAction;

  try {
    yield call(StoreService.setStoreValue, CONST.userVersion, payload.userVersion);

    yield put(setUserVersionSuccess(payload.userVersion));
  } catch (e) {
    if (e instanceof Error) {
      yield put(setUserVersionFailure(e.message));
    }

    logger.captureException(e);
  }
}

export function* checkUserVersionSaga() {
  const userVersion: string = yield call(StoreService.getStoreValue, CONST.userVersion);

  if (userVersion) {
    yield put(setUserVersionSuccess(userVersion as USER_VERSIONS));
  }
}

export function* createTcSaga() {
  yield call(StoreService.setStoreValue, CONST.tcVersion, CONST.tcVersionRequired);
  yield put(setIsTcAccepted(true));
}

export default [
  takeLatest(AuthenticationAction.CheckCredentials, checkCredentialsSaga),
  takeEvery(AuthenticationAction.Authenticate, authenticateSaga),
  takeEvery(AuthenticationAction.CreatePin, createPinSaga),
  takeEvery(AuthenticationAction.CreateTxPassword, createTxPasswordSaga),
  takeEvery(AuthenticationAction.CheckTc, checkTcSaga),
  takeEvery(AuthenticationAction.CheckUserVersion, checkUserVersionSaga),
  takeEvery(AuthenticationAction.SetUserVersion, setUserVersionSaga),
  takeEvery(AuthenticationAction.CreateTc, createTcSaga),
];
