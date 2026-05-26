import { WalletPayload } from 'app/consts';

export enum Result {
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface SubscribePayload {
  wallets: WalletPayload[];
  email: string;
  lang: string;
}

export interface SubscribeResponse {
  result: Result;
  sessionToken: string;
}

export interface AuthenticatePayload {
  session_token: string;
  pin: string;
}

export interface AuthenticateResponse {
  result: Result;
  session_token: string;
}

export interface ModifyPayload {
  hashes: string[];
  old_email: string;
  new_email: string;
}

export interface ModifyResponse {
  sessionToken: string;
}

export interface CheckSubscriptionPayload {
  hashes: string[];
  email: string;
}

export interface CheckSubscriptionResponse {
  result: boolean[];
}

export interface VerifyEmailPayload {
  email: string;
}

export interface VerifyEmailResponse {
  result: Result;
  pin: string;
}

export interface SubscribeDeviceFCMPayload {
  fcm: string;
  wallets: string[];
  language: string;
}

export interface RemoveDeviceFCMPayload {
  fcm: string;
}

export interface UnsubscribePayload {
  hashes: string[];
  email: string;
}

export interface UnsubscribeEmailResponse {
  result: Result;
  sessionToken: string;
}
