import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { Route } from 'app/consts';
import { MainTabNavigator } from 'app/navigators/MainTabNavigator';
import {
  CreateWalletScreen,
  // WalletDetailsScreen,
  // ImportWalletScreen,
  // ExportWalletScreen,
  // DeleteWalletScreen,
  // ExportWalletXpubScreen,
  // CreateContactScreen,
  // ContactDetailsScreen,
  // TransactionDetailsScreen,
  // ContactQRCodeScreen,
  // DeleteContactScreen,
  // ReceiveCoinsScreen,
  // SendCoinsScreen,
  // SendCoinsConfirmScreen,
  // SendTransactionDetailsScreen,
  // ScanQrCodeScreen,
  // ContactListScreen,
  // SettingsScreen,
  // SelectLanguageScreen,
  // AboutUsScreen,
  // AdvancedOptionsScreen,
  // ElectrumServerScreen,
  // CreatePinScreen,
  // CurrentPinScreen,
  // ConfirmPinScreen,
  // FilterTransactionsScreen,
} from 'app/screens';

const Stack = createStackNavigator();

export const MainCardStackNavigator = () => {
  return (
    <>
      <MainTabNavigator />
      {/* <Stack.Navigator>
        <Stack.Screen name={Route.CreateWallet} component={CreateWalletScreen} />
      </Stack.Navigator> */}
    </>
  );
};

// export const MainCardStackNavigator = createStackNavigator(
//   {
//     MainTabNavigator: {
//       screen: MainTabNavigator,
//       navigationOptions: {
//         header: null,
//       },
//     },
//     [Route.CreateWallet]: CreateWalletScreen,
//     [Route.ImportWallet]: ImportWalletScreen,
//     [Route.DeleteWallet]: DeleteWalletScreen,
//     [Route.WalletDetails]: WalletDetailsScreen,
//     [Route.ExportWallet]: ExportWalletScreen,
//     [Route.ExportWalletXpub]: ExportWalletXpubScreen,
//     [Route.CreateContact]: CreateContactScreen,
//     [Route.ContactDetails]: ContactDetailsScreen,
//     [Route.ContactQRCode]: ContactQRCodeScreen,
//     [Route.DeleteContact]: DeleteContactScreen,
//     [Route.TransactionDetails]: TransactionDetailsScreen,
//     [Route.ReceiveCoins]: ReceiveCoinsScreen,
//     [Route.SendCoins]: SendCoinsScreen,
//     [Route.SendCoinsConfirm]: SendCoinsConfirmScreen,
//     [Route.SendTransactionDetails]: SendTransactionDetailsScreen,
//     [Route.ScanQrCode]: ScanQrCodeScreen,
//     [Route.ChooseContactList]: ContactListScreen,
//     [Route.Settings]: SettingsScreen,
//     [Route.SelectLanguage]: SelectLanguageScreen,
//     [Route.AboutUs]: AboutUsScreen,
//     [Route.AdvancedOptions]: AdvancedOptionsScreen,
//     [Route.ElectrumServer]: ElectrumServerScreen,
//     [Route.CreatePin]: CreatePinScreen,
//     [Route.CurrentPin]: CurrentPinScreen,
//     [Route.ConfirmPin]: ConfirmPinScreen,
//     [Route.FilterTransactions]: FilterTransactionsScreen,
//   },
//   {
//     mode: 'card',
//   },
// );
