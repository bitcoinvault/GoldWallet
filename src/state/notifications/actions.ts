import { AuthenticatePayload, ModifyResponse, UnsubscribeEmailResponse } from 'app/api';
import { ActionMeta, Wallet } from 'app/consts';

export enum NotificationAction {
  CreateNotificationEmail = 'CreateNotificationEmail',
  CreateNotificationEmailSuccess = 'CreateNotificationEmailSuccess',
  CreateNotificationEmailFailure = 'CreateNotificationEmailFailure',
  VerifyNotificationEmailAction = 'VerifyNotificationEmailAction',
  VerifyNotificationEmailActionSuccess = 'VerifyNotificationEmailActionSuccess',
  VerifyNotificationEmailActionFailure = 'VerifyNotificationEmailActionFailure',
  DeleteNotificationEmailAction = 'DeleteNotificationEmailAction',
  SubscribeWalletAction = 'SubscribeWalletAction',
  SubscribeWalletSuccessAction = 'SubscribeWalletSuccessAction',
  SubscribeWalletFailureAction = 'SubscribeWalletFailureAction',
  UnsubscribeWalletAction = 'UnsubscribeWalletAction',
  UnsubscribeWalletSuccessAction = 'UnsubscribeWalletSuccessAction',
  UnsubscribeWalletFailureAction = 'UnsubscribeWalletFailureAction',
  AuthenticateEmailAction = 'AuthenticateEmailAction',
  AuthenticateEmailSuccessAction = 'AuthenticateEmailSuccessAction',
  AuthenticateEmailFailureAction = 'AuthenticateEmailFailureAction',
  CheckSubscriptionAction = 'CheckSubscriptionAction',
  CheckSubscriptionSuccessAction = 'CheckSubscriptionSuccessAction',
  CheckSubscriptionFailureAction = 'CheckSubscriptionFailureAction',
  SetErrorAction = 'SetErrorAction',
  UpdateNotificationEmailAction = 'UpdateNotificationEmailAction',
  UpdateNotificationEmailSuccessAction = 'UpdateNotificationEmailSuccessAction',
  UpdateNotificationEmailFailureAction = 'UpdateNotificationEmailFailureAction',
  StartResendAction = 'StartResendAction',
  ResetResendTimeAction = 'ResetResendTimeAction',
  UnsubscribeDeviceTokenAction = 'UnsubscribeDeviceTokenAction',
  SubscribeDeviceTokenAction = 'SubscribeDeviceTokenAction',
}

export interface SetErrorAction {
  type: NotificationAction.SetErrorAction;
  error: string;
}
export interface CreateNotificationEmailAction {
  type: NotificationAction.CreateNotificationEmail;
  payload: {
    email: string;
  };
  meta?: ActionMeta;
}

export interface CreateNotificationEmailSuccessAction {
  type: NotificationAction.CreateNotificationEmailSuccess;
  payload: {
    email: string;
  };
}

export interface CreateNotificationEmailFailureAction {
  type: NotificationAction.CreateNotificationEmailFailure;
  error: string;
}

export interface VerifyNotificationEmailAction {
  type: NotificationAction.VerifyNotificationEmailAction;
  payload: {
    email: string;
  };
  meta?: ActionMeta;
}

export interface VerifyNotificationEmailActionFailure {
  type: NotificationAction.VerifyNotificationEmailActionFailure;
  error: string;
}

export interface DeleteNotificationEmailAction {
  type: NotificationAction.DeleteNotificationEmailAction;
}

export interface VerifyNotificationEmailActionSuccess {
  type: NotificationAction.VerifyNotificationEmailActionSuccess;
  payload: {
    pin: string;
  };
}
export interface SubscribeWalletAction {
  type: NotificationAction.SubscribeWalletAction;
  payload: {
    wallets: Wallet[];
    email: string;
  };
  meta?: ActionMeta;
}

export interface SubscribeWalletSuccessAction {
  type: NotificationAction.SubscribeWalletSuccessAction;
  payload: { sessionToken: string };
}

export interface SubscribeWalletFailureAction {
  type: NotificationAction.SubscribeWalletFailureAction;
  error: string;
}

export interface UnsubscribeWalletAction {
  type: NotificationAction.UnsubscribeWalletAction;
  payload: {
    wallets: Wallet[];
    email: string;
  };
  meta?: ActionMeta;
}

export interface UnsubscribeWalletSuccessAction {
  type: NotificationAction.UnsubscribeWalletSuccessAction;
  payload: UnsubscribeEmailResponse;
}

export interface UnsubscribeWalletFailureAction {
  type: NotificationAction.UnsubscribeWalletFailureAction;
  error: string;
}

export interface AuthenticateEmailAction {
  type: NotificationAction.AuthenticateEmailAction;
  payload: AuthenticatePayload;
  meta?: ActionMeta;
}

export interface AuthenticateEmailSuccessAction {
  type: NotificationAction.AuthenticateEmailSuccessAction;
}
export interface AuthenticateEmailFailureAction {
  type: NotificationAction.AuthenticateEmailFailureAction;
  error: string;
}

export interface CheckSubscriptionAction {
  type: NotificationAction.CheckSubscriptionAction;
  payload: { wallets: Wallet[]; email: string };
  meta?: ActionMeta;
}
export interface CheckSubscriptionSuccessAction {
  type: NotificationAction.CheckSubscriptionSuccessAction;
  payload: {
    subscribedIds: string[];
  };
}
export interface CheckSubscriptionFailureAction {
  type: NotificationAction.CheckSubscriptionFailureAction;
  error: string;
}

export interface UpdateNotificationEmailAction {
  type: NotificationAction.UpdateNotificationEmailAction;
  payload: { wallets: Wallet[]; currentEmail: string; newEmail: string };
  meta?: ActionMeta;
}

export interface UpdateNotificationEmailSuccessAction {
  type: NotificationAction.UpdateNotificationEmailSuccessAction;
  payload: ModifyResponse;
}

export interface UpdateNotificationEmailFailureAction {
  type: NotificationAction.UpdateNotificationEmailFailureAction;
  error: string;
}

export interface StartResendAction {
  type: NotificationAction.StartResendAction;
}

export interface ResetResendTimeAction {
  type: NotificationAction.ResetResendTimeAction;
}

export interface UnsubscribeDeviceTokenAction {
  type: NotificationAction.UnsubscribeDeviceTokenAction;
}

export interface SubscribeDeviceTokenAction {
  type: NotificationAction.SubscribeDeviceTokenAction;
  payload: { wallets: Wallet[] };
}

export type NotificationActionType =
  | CreateNotificationEmailAction
  | CreateNotificationEmailSuccessAction
  | CreateNotificationEmailFailureAction
  | DeleteNotificationEmailAction
  | VerifyNotificationEmailAction
  | VerifyNotificationEmailActionSuccess
  | VerifyNotificationEmailActionFailure
  | SubscribeWalletAction
  | SubscribeWalletSuccessAction
  | SubscribeWalletFailureAction
  | UnsubscribeWalletAction
  | UnsubscribeWalletSuccessAction
  | UnsubscribeWalletFailureAction
  | AuthenticateEmailAction
  | AuthenticateEmailSuccessAction
  | AuthenticateEmailFailureAction
  | CheckSubscriptionAction
  | CheckSubscriptionSuccessAction
  | CheckSubscriptionFailureAction
  | SetErrorAction
  | UpdateNotificationEmailAction
  | UpdateNotificationEmailSuccessAction
  | UpdateNotificationEmailFailureAction
  | StartResendAction
  | ResetResendTimeAction
  | UnsubscribeDeviceTokenAction
  | SubscribeDeviceTokenAction;

export type CreateNotificationEmailActionCreator = (email: string, meta?: ActionMeta) => CreateNotificationEmailAction;
export const createNotificationEmail: CreateNotificationEmailActionCreator = (email, meta) => ({
  type: NotificationAction.CreateNotificationEmail,
  payload: { email },
  meta,
});

export const createNotificationEmailSuccess = (email: string): CreateNotificationEmailSuccessAction => ({
  type: NotificationAction.CreateNotificationEmailSuccess,
  payload: { email },
});

export const createNotificationEmailFailure = (error: string): CreateNotificationEmailFailureAction => ({
  type: NotificationAction.CreateNotificationEmailFailure,
  error,
});

export const deleteNotificationEmail = (): DeleteNotificationEmailAction => ({
  type: NotificationAction.DeleteNotificationEmailAction,
});

export type VerifyNotificationEmailActionCreator = (email: string, meta?: ActionMeta) => VerifyNotificationEmailAction;

export const verifyNotificationEmail: VerifyNotificationEmailActionCreator = (email, meta) => ({
  type: NotificationAction.VerifyNotificationEmailAction,
  payload: { email },
  meta,
});

export const verifyNotificationEmailSuccess = (pin: string): VerifyNotificationEmailActionSuccess => ({
  type: NotificationAction.VerifyNotificationEmailActionSuccess,
  payload: { pin },
});

export const verifyNotificationEmailFailure = (error: string): VerifyNotificationEmailActionFailure => ({
  type: NotificationAction.VerifyNotificationEmailActionFailure,
  error,
});

export type SubscribeWalletActionCreator = (
  wallets: Wallet[],
  email: string,
  meta?: ActionMeta,
) => SubscribeWalletAction;
export const subscribeWallet: SubscribeWalletActionCreator = (wallets, email, meta) => ({
  type: NotificationAction.SubscribeWalletAction,
  payload: { wallets, email },
  meta,
});

export const subscribeWalletSuccess = (sessionToken: string): SubscribeWalletSuccessAction => ({
  type: NotificationAction.SubscribeWalletSuccessAction,
  payload: { sessionToken },
});

export const subscribeWalletFailure = (error: string): SubscribeWalletFailureAction => ({
  type: NotificationAction.SubscribeWalletFailureAction,
  error,
});

export type UnsubscribeWalletActionCreator = (
  wallets: Wallet[],
  email: string,
  meta?: ActionMeta,
) => UnsubscribeWalletAction;
export const unsubscribeWallet: UnsubscribeWalletActionCreator = (wallets, email, meta) => ({
  type: NotificationAction.UnsubscribeWalletAction,
  payload: { wallets, email },
  meta,
});

export const unsubscribeWalletSuccess = (sessionToken: string): SubscribeWalletSuccessAction => ({
  type: NotificationAction.SubscribeWalletSuccessAction,
  payload: { sessionToken },
});

export const unsubscribeWalletFailure = (error: string): SubscribeWalletFailureAction => ({
  type: NotificationAction.SubscribeWalletFailureAction,
  error,
});

export type AuthenticateEmailActionCreator = (
  session_token: string,
  pin: string,
  meta?: ActionMeta,
) => AuthenticateEmailAction;
export const authenticateEmail: AuthenticateEmailActionCreator = (session_token, pin, meta) => ({
  type: NotificationAction.AuthenticateEmailAction,
  payload: { session_token, pin },
  meta,
});

export const authenticateEmailSuccess = (): AuthenticateEmailSuccessAction => ({
  type: NotificationAction.AuthenticateEmailSuccessAction,
});

export const authenticateEmailFailure = (error: string): AuthenticateEmailFailureAction => ({
  type: NotificationAction.AuthenticateEmailFailureAction,
  error,
});

export type CheckSubscriptionActionCreator = (
  wallets: Wallet[],
  email: string,
  meta?: ActionMeta,
) => CheckSubscriptionAction;

export const checkSubscription: CheckSubscriptionActionCreator = (wallets, email, meta) => ({
  type: NotificationAction.CheckSubscriptionAction,
  payload: {
    wallets,
    email,
  },
  meta,
});

export const checkSubscriptionSuccess = (subscribedIds: string[]): CheckSubscriptionSuccessAction => ({
  type: NotificationAction.CheckSubscriptionSuccessAction,
  payload: {
    subscribedIds,
  },
});

export const checkSubscriptionFailure = (error: string): CheckSubscriptionFailureAction => ({
  type: NotificationAction.CheckSubscriptionFailureAction,
  error,
});

export type SetErrorActionCreator = (error: string) => SetErrorAction;
export const setError: SetErrorActionCreator = error => ({
  type: NotificationAction.SetErrorAction,
  error,
});

export type UpdateNotificationEmailActionCreator = (
  wallets: Wallet[],
  currentEmail: string,
  newEmail: string,
  meta?: ActionMeta,
) => UpdateNotificationEmailAction;
export const updateNotificationEmail: UpdateNotificationEmailActionCreator = (
  wallets,
  currentEmail,
  newEmail,
  meta,
) => ({
  type: NotificationAction.UpdateNotificationEmailAction,
  payload: {
    wallets,
    currentEmail,
    newEmail,
  },
  meta,
});

export type UpdateNotificationEmailSuccessActionCreator = (
  sessionToken: string,
) => UpdateNotificationEmailSuccessAction;
export const updateNotificationEmailSuccess: UpdateNotificationEmailSuccessActionCreator = sessionToken => ({
  type: NotificationAction.UpdateNotificationEmailSuccessAction,
  payload: { sessionToken },
});

export const updateNotificationEmailFailure = (error: string): UpdateNotificationEmailFailureAction => ({
  type: NotificationAction.UpdateNotificationEmailFailureAction,
  error,
});

export const startResend = (): StartResendAction => ({
  type: NotificationAction.StartResendAction,
});

export const resetResendTime = (): ResetResendTimeAction => ({
  type: NotificationAction.ResetResendTimeAction,
});

export const unsubscribeDeviceToken = (): UnsubscribeDeviceTokenAction => ({
  type: NotificationAction.UnsubscribeDeviceTokenAction,
});

export const subscribeDeviceToken = (wallets: Wallet[]): SubscribeDeviceTokenAction => ({
  type: NotificationAction.SubscribeDeviceTokenAction,
  payload: { wallets },
});
