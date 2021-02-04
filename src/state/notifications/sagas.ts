import { takeEvery, takeLatest, put, call, all, select } from 'redux-saga/effects';

import { verifyEmail } from 'app/api';
import {
  subscribeEmail,
  authenticateEmail,
  checkSubscriptionEmail,
  unsubscribeEmail,
  modifyEmail,
} from 'app/api/emailApi';
import { Wallet } from 'app/consts';
import { decryptCode } from 'app/helpers/decode';
import { getWalletHashedPublicKeys, walletToAddressesGenerationBase } from 'app/helpers/wallets';

import * as appSettingsSelectors from '../appSettings/selectors';
import {
  createNotificationEmailFailure,
  createNotificationEmailSuccess,
  CreateNotificationEmailAction,
  NotificationAction,
  verifyNotificationEmailSuccess,
  VerifyNotificationEmailAction,
  verifyNotificationEmailFailure,
  SubscribeWalletAction,
  AuthenticateEmailAction,
  authenticateEmailSuccess,
  authenticateEmailFailure,
  subscribeWalletSuccess,
  CheckSubscriptionAction,
  checkSubscriptionSuccess,
  checkSubscriptionFailure,
  UnsubscribeWalletAction,
  unsubscribeWalletFailure,
  unsubscribeWalletSuccess,
  subscribeWalletFailure,
  UpdateNotificationEmailAction,
  updateNotificationEmailSuccess,
  updateNotificationEmailFailure,
} from './actions';

enum Result {
  error = 'error',
  success = 'success',
}

export function* createNotificationEmailSaga(action: CreateNotificationEmailAction | unknown) {
  const { meta, payload } = action as CreateNotificationEmailAction;
  const email = payload.email;

  try {
    yield put(createNotificationEmailSuccess(email));
    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (e) {
    yield put(createNotificationEmailFailure(e.message));
    if (meta?.onFailure) {
      meta.onFailure();
    }
  }
}

export function* verifyNotificationEmailSaga(action: VerifyNotificationEmailAction | unknown) {
  const { meta, payload } = action as VerifyNotificationEmailAction;
  const email = payload.email;

  try {
    const verifyCode = yield call(verifyEmail, { email });

    if (verifyCode.result === Result.success) {
      const decryptedCode = yield decryptCode(email, verifyCode.pin);

      yield put(verifyNotificationEmailSuccess(decryptedCode));
    } else {
      throw new Error('Your email cannot be verified');
    }
    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (error) {
    const { msg } = error.response.data;

    yield put(verifyNotificationEmailFailure(msg));
    if (meta?.onFailure) {
      meta.onFailure();
    }
  }
}

export function* subscribeWalletSaga(action: SubscribeWalletAction) {
  const {
    payload: { wallets, email },
  } = action as SubscribeWalletAction;

  try {
    const walletsGenerationBase = yield all(wallets.map(wallet => call(walletToAddressesGenerationBase, wallet)));

    const lang = yield select(appSettingsSelectors.language);
    const response: { session_token: string; result: Result } = yield call(subscribeEmail, {
      email,
      wallets: walletsGenerationBase,
      lang,
    });

    if (response.session_token) {
      yield put(subscribeWalletSuccess(response.session_token));
    }
  } catch (error) {
    yield put(subscribeWalletFailure(error.message));
  }
}

export function* unsubscribeWalletSaga(action: UnsubscribeWalletAction) {
  const {
    payload: { wallets, email },
  } = action as UnsubscribeWalletAction;

  try {
    const hashes = yield all(wallets.map(wallet => call(getWalletHashedPublicKeys, wallet)));

    const response = yield call(unsubscribeEmail, { hashes, email });

    if (response.session_token) {
      yield put(unsubscribeWalletSuccess(response.session_token));
    }
  } catch (error) {
    yield put(unsubscribeWalletFailure(error.msg));
  }
}

export function* authenticateEmailSaga(action: AuthenticateEmailAction) {
  const { payload, meta } = action as AuthenticateEmailAction;

  try {
    const response = yield call(authenticateEmail, payload);

    if (response.result === Result.success) {
      yield put(authenticateEmailSuccess());
      if (meta?.onSuccess) {
        meta.onSuccess(payload.session_token);
      }
    }
  } catch (error) {
    const { msg } = error.response.data;

    yield put(authenticateEmailFailure(msg));
    if (meta?.onFailure) {
      meta.onFailure();
    }
  }
}

export function* updateEmailSaga(action: UpdateNotificationEmailAction) {
  const {
    payload: { wallets, currentEmail, newEmail },
    meta,
  } = action;

  try {
    const walletsWithHashes = yield Promise.all(
      wallets.map(async wallet => ({ ...wallet, hash: await getWalletHashedPublicKeys(wallet) })),
    );
    const hashes = walletsWithHashes.map((wallet: Wallet) => wallet.hash);

    const response = yield call(modifyEmail, {
      hashes,
      old_email: currentEmail,
      new_email: newEmail,
    });

    if (response.session_token) {
      yield put(updateNotificationEmailSuccess(response.session_token));
      if (meta?.onSuccess) {
        meta.onSuccess();
      }
    }
  } catch (error) {
    const { msg } = error.response.data;

    yield put(updateNotificationEmailFailure(msg));
  }
}

export function* checkSubscriptionSaga(action: CheckSubscriptionAction) {
  const {
    meta,
    payload: { wallets, email },
  } = action;

  try {
    const walletWithHashes = yield Promise.all(
      wallets.map(async wallet => ({ ...wallet, hash: await getWalletHashedPublicKeys(wallet) })),
    );
    const hashes = walletWithHashes.map((wallet: Wallet) => wallet.hash);
    const response = yield call(checkSubscriptionEmail, { hashes, email });
    const ids: string[] = [];

    walletWithHashes.forEach((wallet: Wallet, index: number) => {
      if (response.result[index]) {
        ids.push(wallet.id);
      }
    });
    yield put(checkSubscriptionSuccess(ids));
    if (meta?.onSuccess) {
      meta.onSuccess(ids);
    }
  } catch (error) {
    const { msg } = error.response.data;

    yield put(checkSubscriptionFailure(msg));
    if (meta?.onFailure) {
      meta.onFailure(msg);
    }
  }
}

export default [
  takeEvery(NotificationAction.CheckSubscriptionAction, checkSubscriptionSaga),
  takeEvery(NotificationAction.CreateNotificationEmail, createNotificationEmailSaga),
  takeLatest(NotificationAction.VerifyNotificationEmailAction, verifyNotificationEmailSaga),
  takeEvery(NotificationAction.SubscribeWalletAction, subscribeWalletSaga),
  takeEvery(NotificationAction.AuthenticateEmailAction, authenticateEmailSaga),
  takeEvery(NotificationAction.UnsubscribeWalletAction, unsubscribeWalletSaga),
  takeLatest(NotificationAction.UpdateNotificationEmailAction, updateEmailSaga),
];
