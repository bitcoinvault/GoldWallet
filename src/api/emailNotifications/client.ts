import config from 'app/config';

import createHttpClient from '../client';
import {
  SubscribePayload,
  UnsubscribePayload,
  AuthenticatePayload,
  ModifyPayload,
  CheckSubscriptionPayload,
  VerifyEmailPayload,
  VerifyEmailResponse,
  SubscribeResponse,
  ModifyResponse,
  CheckSubscriptionResponse,
  SubscribeDeviceFCMPayload,
  RemoveDeviceFCMPayload,
} from './types';

export enum EmailNotificationsError {
  INVALID_EMAIL = 'Enter a valid email address',
  ERROR_VERIFICATION_ERROR = 'On /verify-email/ request the server responded with result: "error"',
  WRONG_PIN = 'Wrong pin',
  TRIALS_LEFT = 'Trials left',
  WRONG_PIN_1_LEFT = 'You have 1 more attempt',
  WRONG_PIN_1_LEFT_2 = 'Trials left: 1',
  WRONG_PIN_2_LEFT = 'You have 2 more attempt',
  WRONG_PIN_2_LEFT_2 = 'Trials left: 2',
  WRONG_PIN_NO_TRIALS_LEFT = 'entered an invalid code 3 times',
  WRONG_PIN_NO_TRIALS_LEFT_2 = 'No more trials left',
  ERROR_REQUEST_AUTHENTICATION = 'On /authenticate/ request the server responded with result: "error',
  FAILED_TO_SEND = 'Failed to send email with code',
  THE_SAME_EMAIL = 'already existing email address',
  INVALID_EMAIL_NAME = 'Invalid wallet name',
}

const httpClient = createHttpClient(config.emailNotificationsApi);

export const subscribeEmail = (data: SubscribePayload): Promise<SubscribeResponse> =>
  httpClient.post(`/subscribe/`, data);

export const unsubscribeEmail = (data: UnsubscribePayload): Promise<UnsubscribePayload> =>
  httpClient.post(`/unsubscribe/`, data);

export const authenticate = (data: AuthenticatePayload): Promise<AuthenticatePayload> =>
  httpClient.post(`/authenticate/`, data);

export const modifyEmail = (data: ModifyPayload): Promise<ModifyResponse> => httpClient.put(`/modify/`, data);

export const checkSubscriptionEmail = (data: CheckSubscriptionPayload): Promise<CheckSubscriptionResponse> =>
  httpClient.post(`/check_subscription`, data);

export const verifyEmail = (data: VerifyEmailPayload): Promise<VerifyEmailResponse> =>
  httpClient.post(`/verify_email/`, data);

export const subscribeDeviceFCM = (data: SubscribeDeviceFCMPayload): Promise<void> => httpClient.post(`/push/`, data);

export const removeDeviceFCM = (data: RemoveDeviceFCMPayload): Promise<void> => httpClient.put(`/push/`, data);
