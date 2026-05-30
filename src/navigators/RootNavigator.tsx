import { useReduxDevToolsExtension } from '@react-navigation/devtools';
import { NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';
import React, { ComponentType, FC } from 'react';

import { Route, RootStackParams, USER_VERSIONS } from 'app/consts';
import { getOnboardingAddEmailParams, getAppUpdateAddEmailParams } from 'app/helpers/notifications';
import {
  ActionSheet,
  ExportWalletScreen,
  ExportWalletXpubScreen,
  DeleteContactScreen,
  SendTransactionDetailsScreen,
  MessageScreen,
  EditTextScreen,
  UnlockTransaction,
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
  SelectLanguageScreen,
  AboutUsScreen,
  DeveloperScreen,
  TermsConditionsSettingsScreen,
  AdvancedOptionsScreen,
  CreatePinScreen,
  CurrentPinScreen,
  ConfirmPinScreen,
  FilterTransactionsScreen,
  CreateAuthenticatorScreen,
  CreateAuthenticatorPublicKeyScreen,
  CreateAuthenticatorSuccessScreen,
  ConfirmScreen,
  ImportAuthenticatorScreen,
  CreateWalletSuccessScreen,
  IntegrateKeyScreen,
  RecoveryTransactionListScreen,
  RecoverySendScreen,
  RecoverySeedScreen,
  ImportWalletChooseTypeScreen,
  OptionsAuthenticatorScreen,
  ChunkedQrCode,
  NotificationScreen,
  ConfirmEmailScreen,
  ChooseWalletsForNotificationScreen,
  CreateTransactionPassword,
  ConfirmTransactionPassword,
  LocalConfirmNotificationCodeScreen,
  AddNotificationEmailScreen,
  UpdateEmailNotificationScreen,
  SeedPhraseConfirmScreen,
} from 'app/screens';
import { navigationRef } from 'app/services';

import { MainTabNavigator } from './MainTabNavigator';

const Stack = createStackNavigator<RootStackParams>();
const screenComponent = (component: ComponentType<any>) => component as ComponentType<NonNullable<unknown>>;

interface Props {
  shouldRenderCredentialsCreation: boolean;
  shouldRenderNotification: boolean;
  userVersion: USER_VERSIONS;
}

export const RootNavigator: FC<Props> = ({
  shouldRenderCredentialsCreation,
  shouldRenderNotification,
  userVersion,
}) => {
  useReduxDevToolsExtension(navigationRef as React.RefObject<NavigationContainerRef<any>>);

  const getAddEmailInitialParams = () => {
    if (userVersion === USER_VERSIONS.BEFORE_NOTIFICATIONS_WERE_ADDED) {
      return getAppUpdateAddEmailParams();
    }
    return getOnboardingAddEmailParams();
  };

  const getInitialRouteName = () => {
    if (shouldRenderCredentialsCreation) {
      return Route.CreatePin;
    }
    if (shouldRenderNotification) {
      return Route.AddNotificationEmail;
    }

    return Route.MainTabStackNavigator;
  };

  return (
    <Stack.Navigator initialRouteName={getInitialRouteName()} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={Route.CreatePin} component={screenComponent(CreatePinScreen)} />
      <Stack.Screen name={Route.ConfirmPin} component={screenComponent(ConfirmPinScreen)} />
      <Stack.Screen
        name={Route.CreateTransactionPassword}
        options={{ gestureEnabled: false }}
        component={screenComponent(CreateTransactionPassword)}
      />
      <Stack.Screen name={Route.ConfirmTransactionPassword} component={screenComponent(ConfirmTransactionPassword)} />

      <Stack.Screen
        name={Route.AddNotificationEmail}
        component={screenComponent(AddNotificationEmailScreen)}
        options={{ gestureEnabled: false }}
        initialParams={getAddEmailInitialParams()}
      />
      <Stack.Screen
        name={Route.LocalConfirmNotificationCode}
        component={screenComponent(LocalConfirmNotificationCodeScreen)}
      />
      <Stack.Screen
        name={Route.ChooseWalletsForNotification}
        component={screenComponent(ChooseWalletsForNotificationScreen)}
      />

      <Stack.Screen name={Route.ActionSheet} component={screenComponent(ActionSheet)} options={modalOptions} />
      <Stack.Screen name={Route.UnlockTransaction} component={screenComponent(UnlockTransaction)} />
      <Stack.Screen name={Route.EditText} component={screenComponent(EditTextScreen)} />
      <Stack.Screen
        name={Route.Message}
        component={screenComponent(MessageScreen)}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name={Route.ExportWallet} component={screenComponent(ExportWalletScreen)} />
      <Stack.Screen name={Route.ExportWalletXpub} component={screenComponent(ExportWalletXpubScreen)} />
      <Stack.Screen name={Route.DeleteContact} component={screenComponent(DeleteContactScreen)} />
      <Stack.Screen name={Route.SendTransactionDetails} component={screenComponent(SendTransactionDetailsScreen)} />

      <Stack.Screen
        name={Route.MainTabStackNavigator}
        options={{ gestureEnabled: false }}
        component={screenComponent(MainTabNavigator)}
      />

      <Stack.Screen name={Route.CreateWallet} component={screenComponent(CreateWalletScreen)} />
      <Stack.Screen name={Route.SeedPhraseConfirm} component={screenComponent(SeedPhraseConfirmScreen)} />
      <Stack.Screen name={Route.ImportWallet} component={screenComponent(ImportWalletScreen)} />
      <Stack.Screen name={Route.WalletDetails} component={screenComponent(WalletDetailsScreen)} />
      <Stack.Screen name={Route.CreateContact} component={screenComponent(CreateContactScreen)} />
      <Stack.Screen name={Route.ContactDetails} component={screenComponent(ContactDetailsScreen)} />
      <Stack.Screen name={Route.ContactQRCode} component={screenComponent(ContactQRCodeScreen)} />
      <Stack.Screen name={Route.TransactionDetails} component={screenComponent(TransactionDetailsScreen)} />
      <Stack.Screen name={Route.ReceiveCoins} component={screenComponent(ReceiveCoinsScreen)} />
      <Stack.Screen name={Route.SendCoins} component={screenComponent(SendCoinsScreen)} />
      <Stack.Screen name={Route.SendCoinsConfirm} component={screenComponent(SendCoinsConfirmScreen)} />
      <Stack.Screen name={Route.ScanQrCode} component={screenComponent(ScanQrCodeScreen)} />
      <Stack.Screen name={Route.ChooseContactList} component={screenComponent(ContactListScreen)} />
      <Stack.Screen name={Route.SelectLanguage} component={screenComponent(SelectLanguageScreen)} />
      <Stack.Screen name={Route.AboutUs} component={screenComponent(AboutUsScreen)} />
      <Stack.Screen name={Route.Developer} component={screenComponent(DeveloperScreen)} />
      <Stack.Screen name={Route.TermsConditions} component={screenComponent(TermsConditionsSettingsScreen)} />
      <Stack.Screen name={Route.AdvancedOptions} component={screenComponent(AdvancedOptionsScreen)} />
      <Stack.Screen
        name={Route.CurrentPin}
        component={screenComponent(CurrentPinScreen)}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name={Route.FilterTransactions} component={screenComponent(FilterTransactionsScreen)} />
      <Stack.Screen name={Route.CreateAuthenticator} component={screenComponent(CreateAuthenticatorScreen)} />
      <Stack.Screen
        name={Route.CreateAuthenticatorPublicKey}
        component={screenComponent(CreateAuthenticatorPublicKeyScreen)}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name={Route.CreateAuthenticatorSuccess}
        component={screenComponent(CreateAuthenticatorSuccessScreen)}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name={Route.Confirm}
        initialParams={{ isBackArrow: true }}
        component={screenComponent(ConfirmScreen)}
      />
      <Stack.Screen name={Route.ImportAuthenticator} component={screenComponent(ImportAuthenticatorScreen)} />
      <Stack.Screen
        name={Route.CreateWalletSuccess}
        options={{ gestureEnabled: false }}
        component={screenComponent(CreateWalletSuccessScreen)}
      />
      <Stack.Screen name={Route.IntegrateKey} component={screenComponent(IntegrateKeyScreen)} />
      <Stack.Screen name={Route.RecoveryTransactionList} component={screenComponent(RecoveryTransactionListScreen)} />
      <Stack.Screen name={Route.RecoverySend} component={screenComponent(RecoverySendScreen)} />
      <Stack.Screen name={Route.RecoverySeed} component={screenComponent(RecoverySeedScreen)} />
      <Stack.Screen name={Route.ImportWalletChooseType} component={screenComponent(ImportWalletChooseTypeScreen)} />
      <Stack.Screen name={Route.OptionsAuthenticator} component={screenComponent(OptionsAuthenticatorScreen)} />
      <Stack.Screen name={Route.ChunkedQrCode} component={screenComponent(ChunkedQrCode)} />
      <Stack.Screen name={Route.Notifications} component={screenComponent(NotificationScreen)} />
      <Stack.Screen name={Route.ConfirmEmail} component={screenComponent(ConfirmEmailScreen)} />
      <Stack.Screen name={Route.UpdateEmailNotification} component={screenComponent(UpdateEmailNotificationScreen)} />
    </Stack.Navigator>
  );
};

const modalOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: 'transparent' },
  cardOverlayEnabled: true,
  detachPreviousScreen: false,
  cardStyleInterpolator: () => ({}),
} as StackNavigationOptions;
