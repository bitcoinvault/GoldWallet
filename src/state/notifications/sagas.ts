import logger from 'app/../logger';
import { takeEvery, takeLatest, put, call, all, select } from 'redux-saga/effects';

import { CheckSubscriptionResponse, verifyEmail } from 'app/api';
import {
  subscribeEmail,
  authenticate,
  checkSubscriptionEmail,
  unsubscribeEmail,
  modifyEmail,
  subscribeDeviceFCM,
  removeDeviceFCM,
} from 'app/api/emailNotifications/client';
import { Wallet } from 'app/consts';
import { decryptCode } from 'app/helpers/decode';
import { getWalletHashedPublicKeys, walletToAddressesGenerationBase } from 'app/helpers/wallets';

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
  SubscribeDeviceTokenAction,
} from './actions';
import * as appSettingsSelectors from '../appSettings/selectors';

export function* createNotificationEmailSaga(action: CreateNotificationEmailAction | unknown) {
  const { meta, payload } = action as CreateNotificationEmailAction;
  const { email } = payload;

  try {
    yield put(createNotificationEmailSuccess(email));

    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(createNotificationEmailFailure(error.message));
    }

    if (meta?.onFailure) {
      meta.onFailure();
    }

    logger.captureException(error);
  }
}

export function* verifyNotificationEmailSaga(action: VerifyNotificationEmailAction | unknown) {
  const { meta, payload } = action as VerifyNotificationEmailAction;
  const { email } = payload;

  try {
    const { pin } = yield call(verifyEmail, { email });
    const decryptedCode: string = yield decryptCode(email, pin);

    yield put(verifyNotificationEmailSuccess(decryptedCode));

    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(verifyNotificationEmailFailure(error.message));
    }

    if (meta?.onFailure) {
      meta.onFailure();
    }

    logger.captureException(error);
  }
}

export function* subscribeWalletSaga(action: SubscribeWalletAction) {
  const {
    payload: { wallets, email },
    meta,
  } = action as SubscribeWalletAction;

  try {
    const walletsGenerationBase: Promise<any> = yield all(
      wallets.map(wallet => call(walletToAddressesGenerationBase, wallet)),
    );

    const lang: string = yield select(appSettingsSelectors.language);
    // TODO: fix types
    const { session_token } = yield call(subscribeEmail as any, {
      email,
      wallets: walletsGenerationBase,
      lang,
    });

    yield put(subscribeWalletSuccess(session_token));

    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(subscribeWalletFailure(error.message));
    }

    if (meta?.onFailure) {
      meta.onFailure();
    }

    logger.captureException(error);
  }
}

export function* unsubscribeWalletSaga(action: UnsubscribeWalletAction) {
  const {
    payload: { wallets, email },
    meta,
  } = action as UnsubscribeWalletAction;

  try {
    const hashes: string[] = yield all(wallets.map(wallet => call(getWalletHashedPublicKeys, wallet)));

    const { session_token } = yield call(unsubscribeEmail, { hashes, email });

    yield put(unsubscribeWalletSuccess(session_token));

    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(unsubscribeWalletFailure(error.message));
    }

    if (meta?.onFailure) {
      meta.onFailure();
    }

    logger.captureException(error);
  }
}

export function* authenticateEmailSaga(action: AuthenticateEmailAction) {
  const { payload, meta } = action as AuthenticateEmailAction;

  try {
    yield call(authenticate, payload);
    yield put(authenticateEmailSuccess());

    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(authenticateEmailFailure(error.message));
    }

    if (meta?.onFailure) {
      meta.onFailure();
    }

    logger.captureException(error);
  }
}

export function* updateEmailSaga(action: UpdateNotificationEmailAction) {
  const {
    payload: { wallets, currentEmail, newEmail },
    meta,
  } = action;

  try {
    const hashes: string[] = yield all(wallets.map(wallet => call(getWalletHashedPublicKeys, wallet)));

    const { session_token } = yield call(modifyEmail, {
      hashes,
      old_email: currentEmail,
      new_email: newEmail,
    });

    yield put(updateNotificationEmailSuccess(session_token));

    if (meta?.onSuccess) {
      meta.onSuccess();
    }
  } catch (error) {
    if (error instanceof Error) {
      yield put(updateNotificationEmailFailure(error.message));
    }
    logger.captureException(error);
  }
}

export function* checkSubscriptionSaga(action: CheckSubscriptionAction) {
  const {
    meta,
    payload: { wallets, email },
  } = action;

  try {
    const walletWithHashes: Wallet[] = yield Promise.all(
      wallets.map(async wallet => ({ ...wallet, hash: await getWalletHashedPublicKeys(wallet) })),
    );
    const hashes = walletWithHashes.map((wallet: Wallet) => wallet.hash);
    const response: CheckSubscriptionResponse = yield call(checkSubscriptionEmail as any, { hashes, email });
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
    if (error instanceof Error) {
      yield put(checkSubscriptionFailure(error.message));

      if (meta?.onFailure) {
        meta.onFailure(error.message);
      }
    }

    logger.captureException(error);
  }
}

export function* unsubscribeDeviceTokenSaga() {
  try {
    const fcm: string = yield select(appSettingsSelectors.fcmToken);

    yield call(removeDeviceFCM, { fcm });
  } catch (error) {
    logger.captureException(error);
  }
}

export function* subscribeDeviceTokenSaga(action: SubscribeDeviceTokenAction) {
  const { payload: wallets } = action;

  try {
    const fcm: string = yield select(appSettingsSelectors.fcmToken);
    const language: string = yield select(appSettingsSelectors.language);
    const isPushnotificationsEnabled: boolean = yield select(appSettingsSelectors.pushnotificationsEnabled);

    if (isPushnotificationsEnabled) {
      const hashes: string[] = yield all(wallets.wallets.map(wallet => call(getWalletHashedPublicKeys, wallet)));

      yield call(subscribeDeviceFCM, {
        fcm,
        wallets: hashes,
        language,
      });
    }
  } catch (error) {
    logger.captureException(error);
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
  takeEvery(NotificationAction.UnsubscribeDeviceTokenAction, unsubscribeDeviceTokenSaga),
  takeEvery(NotificationAction.SubscribeDeviceTokenAction, subscribeDeviceTokenSaga),
];
