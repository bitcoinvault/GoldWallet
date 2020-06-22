import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { Route, MainCardStackNavigatorParams } from 'app/consts';
import { MainTabNavigator } from 'app/navigators/MainTabNavigator';
import {
  CreateWalletScreen,
  WalletDetailsScreen,
  ImportWalletScreen,
  CreateContactScreen,
  ContactDetailsScreen,
  TransactionDetailsScreen,
  ContactQRCodeScreen,
  ReceiveCoinsScreen,
  SendCoinsScreen,
  SendCoinsConfirmScreen,
  ScanQrCodeScreen,
  ContactListScreen,
  SettingsScreen,
  SelectLanguageScreen,
  AboutUsScreen,
  AdvancedOptionsScreen,
  ElectrumServerScreen,
  CreatePinScreen,
  CurrentPinScreen,
  ConfirmPinScreen,
  FilterTransactionsScreen,
  IntegrateKeyScreen,
  CreateAuthenticatorScreen,
  EnterPINScreen,
  CreateAuthenticatorSuccessScreen,
  DeleteEntityScreen,
  ExportAuthenticatorScreen,
  ImportAuthenticatorScreen,
  CreateWalletSuccessScreen,
} from 'app/screens';

export const MainCardStackNavigator = createStackNavigator(
  {
    MainTabNavigator: {
      screen: MainTabNavigator,
      navigationOptions: {
        header: null,
      },
    },
    [Route.CreateWalletSuccess]: CreateWalletSuccessScreen,
    [Route.ExportAuthenticator]: ExportAuthenticatorScreen,
    [Route.ImportAuthenticator]: ImportAuthenticatorScreen,
    [Route.DeleteEntity]: DeleteEntityScreen,
    [Route.CreateAuthenticatorSuccess]: CreateAuthenticatorSuccessScreen,
    [Route.CreateAuthenticator]: CreateAuthenticatorScreen,
    [Route.CreateWallet]: CreateWalletScreen,
    [Route.EnterPIN]: EnterPINScreen,
    [Route.IntagrateKey]: IntegrateKeyScreen,
    [Route.ImportWallet]: ImportWalletScreen,
    [Route.DeleteWallet]: DeleteWalletScreen,
    [Route.WalletDetails]: WalletDetailsScreen,
    [Route.ExportWallet]: ExportWalletScreen,
    [Route.ExportWalletXpub]: ExportWalletXpubScreen,
    [Route.CreateContact]: CreateContactScreen,
    [Route.ContactDetails]: ContactDetailsScreen,
    [Route.ContactQRCode]: ContactQRCodeScreen,
    [Route.DeleteContact]: DeleteContactScreen,
    [Route.TransactionDetails]: TransactionDetailsScreen,
    [Route.ReceiveCoins]: ReceiveCoinsScreen,
    [Route.SendCoins]: SendCoinsScreen,
    [Route.SendCoinsConfirm]: SendCoinsConfirmScreen,
    [Route.SendTransactionDetails]: SendTransactionDetailsScreen,
    [Route.ScanQrCode]: ScanQrCodeScreen,
    [Route.ChooseContactList]: ContactListScreen,
    [Route.Settings]: SettingsScreen,
    [Route.SelectLanguage]: SelectLanguageScreen,
    [Route.AboutUs]: AboutUsScreen,
    [Route.AdvancedOptions]: AdvancedOptionsScreen,
    [Route.ElectrumServer]: ElectrumServerScreen,
    [Route.CreatePin]: CreatePinScreen,
    [Route.CurrentPin]: CurrentPinScreen,
    [Route.ConfirmPin]: ConfirmPinScreen,
    [Route.FilterTransactions]: FilterTransactionsScreen,
  },
  {
    mode: 'card',
  },
);
