import { VaultTxType, Transaction as BtcTransaction, ECPair } from 'bitcoinjs-lib';
import { Dayjs } from 'dayjs';
import { last } from 'lodash';
import React from 'react';
import { KeyboardType, StyleProp, Platform } from 'react-native';
import { ButtonProps } from 'react-native-elements';
import { ImageStyle } from 'react-native-fast-image';

import { FastImageSource } from 'app/components';

import {
  HDSegwitP2SHAirWallet,
  HDSegwitP2SHArWallet,
  HDSegwitBech32Wallet,
  SegwitP2SHWallet,
  HDSegwitP2SHWallet,
  HDLegacyP2PKHWallet,
} from '../../class';

// don't change the order when addign the new version, the oldest user version is on the top, the newest on the bottom
export enum USER_VERSIONS {
  BEFORE_NOTIFICATIONS_WERE_ADDED = 'BEFORE_NOTIFICATIONS_WERE_ADDED',
  AFTER_NOTIFICATIONS_WERE_ADDED = 'AFTER_NOTIFICATIONS_WERE_ADDED',
}

export const CONST = {
  pinCodeLength: 4,
  codeLength: 4,
  transactionMinPasswordLength: 8,
  allWallets: 'All wallets',
  receive: 'receive',
  send: 'send',
  webGeneratorUrl: 'keygenerator.bitcoinvault.global',
  mnemonicWordsAmount: 12,
  satoshiInBtc: 100000000,
  preferredBalanceUnit: 'BTCV',
  alertBlocks: 144,
  confirmationsBlocks: 6,
  android: 'android',
  ios: 'ios',
  transactionPassword: 'transactionPassword',
  pin: 'pin',
  defaultLanguage: 'en',
  maxAddressLength: 48,
  tcVersionRequired: 2,
  tcVersion: 'tcVersion',
  emailCodeErrorMax: 3,
  walletsDefaultGapLimit: 20,
  walletsDefaultAddressRange: '20/0',
  walletsDefaultDerivationPath: 'm/0',
  userVersion: 'userVersion',
  newestUserVersion: last(Object.keys(USER_VERSIONS)) as USER_VERSIONS,
  buttonTimeoutSeconds: 30,
  notificationCodeInputRegex: /^[A-Za-z0-9]*$/,
  maxCoinsInput: 21000000,
};

export const ADDRESSES_TYPES = {
  p2wsh_p2sh: 'p2wsh-p2sh',
  p2pkh: 'p2pkh',
  p2wpkh: 'p2wpkh',
  p2wpkh_p2sh: 'p2wpkh-p2sh',
};

export const WALLETS_ADDRESSES_TYPES = {
  [HDSegwitP2SHArWallet?.type]: ADDRESSES_TYPES.p2wsh_p2sh,
  [HDSegwitP2SHAirWallet?.type]: ADDRESSES_TYPES.p2wsh_p2sh,
  [HDLegacyP2PKHWallet?.type]: ADDRESSES_TYPES.p2pkh,
  [HDSegwitBech32Wallet?.type]: ADDRESSES_TYPES.p2wpkh,
  [HDSegwitP2SHWallet?.type]: ADDRESSES_TYPES.p2wpkh_p2sh,
  [SegwitP2SHWallet?.type]: ADDRESSES_TYPES.p2wpkh_p2sh,
};

export const defaultKeyboardType = Platform.select({ android: 'visible-password', ios: 'default' }) as KeyboardType;

export interface SocketOptions {
  host: string;
  port: number;
  rejectUnauthorized: boolean;
}

export type SocketCallback = () => void;

export const ELECTRUM_VAULT_SEED_PREFIXES = {
  SEED_PREFIX: '01', // Standard wallet
  SEED_PREFIX_SW: '100', // Segwit wallet
  SEED_PREFIX_2FA: '101', // Two - factor authentication
  SEED_PREFIX_2FA_SW: '102', // Two-factor auth, using segwit
};

export interface Toast {
  title: string | undefined;
  icon?: string;
  description: string | undefined;
  duration: number;
  id: string;
  status?: string;
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  CANCELED = 'CANCELED',
  CANCELED_DONE = 'CANCELED_DONE',
}

enum AdditionalTags {
  BLOCKED = 'BLOCKED',
  UNBLOCKED = 'UNBLOCKED',
}

export type TagsType = TransactionStatus | AdditionalTags;

export const Tags = { ...TransactionStatus, ...AdditionalTags };

export const ELECTRUM_VAULT_SEED_KEY = 'Seed version';

export enum FlowType {
  password = 'password',
  newPin = 'newPin',
}

export enum Route {
  Dashboard = 'Dashboard',
  RecoverySend = 'RecoverySend',
  RecoverySeed = 'RecoverySeed',
  AuthenticatorList = 'AuthenticatorList',
  RecoveryTransactionList = 'RecoveryTransactionList',
  ImportAuthenticator = 'ImportAuthenticator',
  OptionsAuthenticator = 'OptionsAuthenticator',
  CreateWalletSuccess = 'CreateWalletSuccess',
  Confirm = 'Confirm',
  CreateAuthenticatorPublicKey = 'CreateAuthenticatorPublicKey',
  CreateAuthenticatorSuccess = 'CreateAuthenticatorSuccess',
  CreateAuthenticator = 'CreateAuthenticator',
  WalletDetails = 'WalletDetails',
  ContactList = 'ContactList',
  ContactDetails = 'ContactDetails',
  CreateContact = 'CreateContact',
  DeleteContact = 'DeleteContact',
  ContactQRCode = 'ContactQRCode',
  Settings = 'Settings',
  Message = 'Message',
  CreateWallet = 'CreateWallet',
  ImportWallet = 'ImportWallet',
  ExportWallet = 'ExportWallet',
  ExportWalletXpub = 'ExportWalletXub',
  TransactionDetails = 'TransactionDetails',
  ReceiveCoins = 'ReceiveCoins',
  SendCoins = 'SendCoins',
  SendCoinsConfirm = 'SendCoinsConfirm',
  EditText = 'EditText',
  AboutUs = 'AboutUs',
  Developer = 'Developer',
  TermsConditions = 'TermsConditions',
  SelectLanguage = 'SelectLanguage',
  ActionSheet = 'ActionSheet',
  SendTransactionDetails = 'SendTransactionDetailsScreen',
  ScanQrCode = 'ScanQrCode',
  ChooseContactList = 'ChooseContactList',
  MainTabStackNavigator = 'MainTabStackNavigator',
  CurrentPin = 'CurrentPin',
  CreatePin = 'CreatePin',
  ConfirmPin = 'ConfirmPin',
  AddNotificationEmail = 'AddNotificationEmail',
  LocalConfirmNotificationCode = 'LocalConfirmNotificationCode',
  CreateTransactionPassword = 'CreateTransactionPassword',
  ConfirmTransactionPassword = 'ConfirmTransactionPassword',
  AdvancedOptions = 'AdvancedOptions',
  UnlockTransaction = 'UnlockTransaction',
  FilterTransactions = 'FilterTransactions',
  IntegrateKey = 'IntegrateKey',
  ImportWalletChooseType = 'ImportWalletChooseType',
  ChunkedQrCode = 'ChunkedQrCode',
  Notifications = 'Notifications',
  ConfirmEmail = 'ConfirmEmail',
  ChooseWalletsForNotification = 'ChooseWalletsForNotification',
  UpdateEmailNotification = 'UpdateEmailNotification',
  SeedPhraseConfirm = 'SeedPhraseConfirm',
}

/** Only for strongly typed RadioButton's values in ImportWalletChooseTypeScreen */
export type ImportWalletType = '3-Key Vault' | '2-Key Vault' | 'Standard';

export type WalletType = typeof HDSegwitP2SHAirWallet | typeof HDSegwitP2SHArWallet | StandardWalletType;

export type StandardWalletType = typeof HDSegwitP2SHWallet | typeof SegwitP2SHWallet | typeof HDSegwitBech32Wallet;

export interface Wallet {
  balance: number;
  hideBalance: boolean;
  preferredBalanceUnit: string;
  label: string;
  chain: string;
  num_addresses: number;
  transactions: Transaction[];
  getBalance: () => number;
  getLatestTransactionTime: () => void;
  getLabel: () => string;
  setLabel: (label: string) => void;
  getAddress: () => any;
  getSecret: () => string;
  getXpub: () => Promise<string>;
  address?: string;
  secret: string;
  type: string;
  hash?: string;
  typeReadable: string;
  unconfirmed_balance: number;
  confirmed_balance: number;
  outgoing_balance: number;
  incoming_balance: number;
  utxo: any[];
  _xpub: string;
  getID: () => string;
  weOwnAddress: (clipboard: string) => boolean;
  isInvoiceGeneratedByWallet?: (clipboard: string) => void;
  getPreferredBalanceUnit: () => string;
  isOutputScriptMine: (script: Buffer) => boolean;
  setMnemonic: (mnemonic: string) => void;
  generate: () => void;
  fetchBalance: () => void;
  fetchUtxos: () => void;
  fetchTransactions: () => void;
  isAnyOfAddressesMine: (addresses: string[]) => boolean;
  id: string;
  getScriptHashes: () => string[];
  getAddressForTransaction: () => string;
  password?: string;
  pubKeys?: Buffer[];
  getDerivationPath: () => string;
}

export interface WalletPayload {
  name: string;
  gap_limit: number;
  address_range: string;
  derivation_path?: string;
  xpub: string;
  address_type: string;
  instant_public_key?: string;
  recovery_public_key?: string;
}

export interface ActionMeta {
  onSuccess?: (...args: any[]) => void;
  onFailure?: (...args: any[]) => void;
}

export interface Contact {
  id: string;
  name: string;
  address: string;
}

export enum TxType {
  NONVAULT = 'NONVAULT',
  ALERT_PENDING = 'ALERT_PENDING',
  ALERT_CONFIRMED = 'ALERT_CONFIRMED',
  ALERT_RECOVERED = 'ALERT_RECOVERED',
  INSTANT = 'INSTANT',
  RECOVERY = 'RECOVERY',
}

export enum ConfirmAddressFlowType {
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  UPDATE_CURRENT = 'UPDATE_CURRENT',
  UPDATE_NEW = 'UPDATE_NEW',
}

export interface InfoContainerContent {
  title?: string;
  description?: string;
  onInit?: () => void;
  onCodeConfirm?: () => void;
}

export interface WordWithKey {
  word: string;
  key: string;
}

export interface Transaction {
  hash: string;
  txid: string;
  value: number;
  time?: number; // not present right after transaction is done
  received: string; // date string, same value as 'time' field but human readable
  walletLabel: string;
  confirmations: number;
  tx_type: TxType;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  note?: string;
  fee?: number;
  blockedAmount?: number;
  unblockedAmount?: number;
  toExternalAddress?: string;
  toInternalAddress?: string;
  recoveredTxsCounter?: number;
  valueWithoutFee: number;
  returnedFee?: number;
  isRecoveredAlertToMe?: boolean;
  height: number;
  status: TransactionStatus;
  walletPreferredBalanceUnit: string;
  tags: TagsType[];
}

export interface EnhancedTransaction extends Transaction {
  walletPreferredBalanceUnit: string;
  walletId: string;
  walletLabel: string;
  walletTypeReadable?: string;
}

export interface AppSettings {
  isPinSetup: boolean;
}

export interface Filters {
  isFilteringOn?: boolean;
  address?: string;
  dateKey?: number;
  isCalendarVisible?: boolean;
  fromDate?: string;
  toDate?: string;
  fromAmount?: string;
  toAmount?: string;
  transactionType?: string;
  transactionStatus?: string;
  transactionReceivedTags: TagsType[];
  transactionSentTags: TagsType[];
}

export interface TransactionOutput {
  addresses: string[];
  value: number;
  scriptPubKey: { asm: string; addresses: string[]; hex: string; type: string; reqSigs: number };
  n: number;
}

export interface TransactionInput {
  addresses: string[];
  txid: string;
  vout: number;
  value: number;
  scriptSig: { asm: string; hex: string };
  sequence: number;
  txinwitness: string[];
}

export interface Utxo {
  address: string;
  height: number;
  spend_tx_num: number;
  tx_hash: string;
  tx_pos: number;
  txid: string;
  value: number;
  vout: number;
  wif: string;
}

export interface Recipient {
  address: string;
  value: number;
}

export interface FinalizedPSBT {
  tx: BtcTransaction;
  vaultTxType: VaultTxType;
  recipients: Recipient[];
  fee: number;
}

export type MainTabNavigatorParams = {
  [Route.Dashboard]: undefined;
  [Route.AuthenticatorList]: undefined;
  [Route.ContactList]: undefined;
  [Route.Settings]: { screen: keyof RootStackParams };
};

export interface AddNotificationEmailParams {
  title: string;
  onSuccess: () => void;
  wallet: Wallet;
  isBackArrow: boolean;
  description: string;
  onSkipSuccess?: () => void;
  inputAutofocus: boolean;
  additionalContent?: React.ReactNode;
}

export type RootStackParams = {
  [Route.MainTabStackNavigator]: { screen: keyof MainTabNavigatorParams };
  [Route.ActionSheet]: { wallets: Wallet[]; selectedIndex: number; onPress: (index: number) => void };
  [Route.UnlockTransaction]: { onSuccess: () => void };
  [Route.EditText]: {
    title: string;
    onSave: (value: string) => void;
    label: string;
    header?: React.ReactNode;
    value?: string;
    inputTestID?: string;
    submitButtonTestID?: string;
    validateName?: boolean;
    validate?: (value: string) => string | undefined;
    validateOnSave?: (value: string) => void;
    keyboardType?: KeyboardType;
    maxLength?: number;
    emptyValueAllowed?: boolean;
    checkZero?: (value: string) => string | undefined;
  };
  [Route.Message]: {
    title: string;
    source: FastImageSource;
    description: string;
    testID?: string;
    buttonProps?: ButtonProps;
    imageStyle?: StyleProp<ImageStyle>;
    asyncTask?: () => void;
  };
  [Route.ExportWallet]: { wallet: Wallet };
  [Route.ExportWalletXpub]: { wallet: Wallet };
  [Route.DeleteContact]: { contact?: Contact };
  [Route.SendTransactionDetails]: {
    fee: number;
    recipients: any;
    tx: any;
    satoshiPerByte: any;
    wallet: Wallet;
    size: number;
    feeSatoshi: number;
  };
  [Route.CreatePin]: {
    flowType: string;
  };
  [Route.ConfirmPin]: {
    flowType: string;
    pin: string;
  };
  [Route.CreateTransactionPassword]: undefined;
  [Route.ConfirmTransactionPassword]: { setPassword: string };
  [Route.LocalConfirmNotificationCode]: {
    children: React.ReactNode;
    onSuccess: () => void;
    title: string;
    email: string;
  };
  [Route.ChooseWalletsForNotification]: {
    flowType: ConfirmAddressFlowType;
    subtitle: string;
    description: string;
    email: string;
    wallet: Wallet;
    onSuccess: () => void;
    onSkip: () => void;
    wallets: Wallet[];
  };
  [Route.AddNotificationEmail]: AddNotificationEmailParams;
  [Route.CreateWallet]: undefined;
  [Route.ImportWallet]: { walletType: ImportWalletType };
  [Route.CreateTransactionPassword]: undefined;
  [Route.WalletDetails]: { id: string };
  [Route.CreateContact]: { address?: string } | undefined;
  [Route.ContactDetails]: { contact: Contact };
  [Route.ContactQRCode]: { contact: Contact };
  [Route.TransactionDetails]: { transaction: EnhancedTransaction };
  [Route.ReceiveCoins]: { id: string };
  [Route.SendCoins]: { fromSecret?: string; fromAddress?: string; fromWallet?: Wallet; toAddress?: string };
  [Route.SendCoinsConfirm]: {
    fee: number;
    feeSatoshi?: number;
    memo?: string;
    recipients: any;
    size?: number;
    txDecoded: BtcTransaction;
    isAlert?: boolean;
    satoshiPerByte: any;
    fromWallet: Wallet;
    pendingAmountDecrease?: number;
    headerTitle?: string;
    buttonTitle?: string;
    successMsgDesc?: string;
  };
  [Route.RecoveryTransactionList]: { wallet: Wallet };
  [Route.RecoverySend]: { transactions: Transaction[]; wallet: any };
  [Route.RecoverySeed]: {
    onSubmit: (keyPair: ECPair.ECPairInterface, mnemonic?: Array<string>) => void;
    subtitle: string;
    description: string;
    buttonText: string;
    onBackArrow?: () => void;
    mnemonic?: Array<string>;
  };
  [Route.ScanQrCode]: { onBarCodeScan: (code: string) => void };
  [Route.ChooseContactList]: {
    onContactPress?: (data: string) => void;
    title?: string;
  };
  [Route.SelectLanguage]: undefined;
  [Route.AboutUs]: undefined;
  [Route.Developer]: undefined;
  [Route.TermsConditions]: { language: string };
  [Route.AdvancedOptions]: undefined;
  [Route.CurrentPin]: undefined;
  [Route.ConfirmPin]: {
    flowType: string;
    pin: string;
  };
  [Route.FilterTransactions]: { onFilterPress: () => void };
  [Route.CreateAuthenticator]: undefined;
  [Route.CreateAuthenticatorPublicKey]: { id: string };
  [Route.CreateAuthenticatorSuccess]: { id: string };
  [Route.Confirm]: {
    onConfirm: () => void;
    title: string;
    onBack?: () => void;
    children: React.ReactNode;
    isBackArrow?: boolean;
    gestureEnabled?: boolean;
  };
  [Route.ImportAuthenticator]: undefined;
  [Route.OptionsAuthenticator]: { id: string };
  [Route.CreateWalletSuccess]: { secret: string; handleNavigationSubscription?: () => void; isP2SH?: boolean };
  [Route.IntegrateKey]: {
    onBarCodeScan: (text: string) => void;
    title: string;
    description: string;
    withLink?: boolean;
    headerTitle?: string;
    onBackArrow?: () => void;
  };
  [Route.ImportWalletChooseType]: { error?: boolean };
  [Route.ChunkedQrCode]: {
    chunkNo: string;
    chunksQuantity: string;
    onScanned: () => void;
  };
  [Route.Notifications]: {
    onBackArrow: () => void;
    wallet: Wallet;
  };
  [Route.ConfirmEmail]: {
    email: string;
    newAddress?: string;
    wallets?: Wallet[];
    flowType: ConfirmAddressFlowType;
    onBack?: () => void;
    onSuccess: (arg?: any) => void;
    onResend: () => void;
  };
  [Route.UpdateEmailNotification]: {
    subscribedWallets: Wallet[];
    wallet: Wallet;
  };
  [Route.SeedPhraseConfirm]: { secret: string; handleNavigationSubscription?: () => void };
};

export type DateType = Date | Dayjs;
export interface Authenticator {
  keyPair: ECPair.ECPairInterface | null;
  publicKey: string;
  name: string;
  QRCode: string;
  id: string;
  init: ({ mnemonic }: { mnemonic?: string }) => void;
  pin: string;
  secret: string;
  createdAt: Dayjs;
}

export type GlobalParams = RootStackParams & MainTabNavigatorParams;

export type MasterPublicKey = 'xpub' | 'ypub' | 'Ypub' | 'Zpub' | 'zpub';
