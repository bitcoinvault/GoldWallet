import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, Alert } from 'react-native';
import { connect } from 'react-redux';

import { ScreenTemplate, Text, InputItem, Header, Button, FlatButton, RadioButton } from 'app/components';
import { Route, Wallet, RootStackParams, ActionMeta, CONST, WalletType, ConfirmAddressFlowType } from 'app/consts';
import { maxWalletNameLength } from 'app/consts/text';
import { CreateMessage, MessageType } from 'app/helpers/MessageCreator';
import {
  HDSegwitBech32Wallet,
  HDSegwitP2SHWallet,
  SegwitP2SHWallet,
  HDSegwitP2SHArWallet,
  HDSegwitP2SHAirWallet,
} from 'app/legacy';
import { ApplicationState } from 'app/state';
import { AppSettingsState } from 'app/state/appSettings/reducer';
import {
  subscribeWallet as subscribeWalletAction,
  subscribeDeviceToken as subscribeDeviceTokenAction,
  SubscribeWalletActionCreator,
} from 'app/state/notifications/actions';
import { storedEmail, readableError } from 'app/state/notifications/selectors';
import { selectors as walletsSelector } from 'app/state/wallets';
import { createWallet as createWalletAction, CreateWalletAction } from 'app/state/wallets/actions';
import { palette, typography } from 'app/styles';

const i18n = require('../../loc');

interface Props {
  navigation: StackNavigationProp<RootStackParams, Route.CreateContact>;
  route: RouteProp<RootStackParams, Route.CreateWallet>;
  appSettings: AppSettingsState;
  createWallet: (wallet: Wallet, meta?: ActionMeta) => CreateWalletAction;
  subscribe: SubscribeWalletActionCreator;
  subscribeFcmToken: (wallet: Wallet[]) => void;
  walletsLabels: string[];
  email: string;
  error: string;
}

interface State {
  label: string;
  WalletClass: WalletType;
}

export class CreateWalletScreen extends React.PureComponent<Props, State> {
  state: State = {
    label: '',
    WalletClass: HDSegwitP2SHAirWallet,
  };

  onSelect = (selectedWallet: WalletType) => this.setState({ WalletClass: selectedWallet });

  setLabel = (label: string) => this.setState({ label: label.trim() });

  navigateToImportWallet = () => this.props.navigation.navigate(Route.ImportWalletChooseType, { error: false });

  createARWallet = (recoveryPublicKey: string) => {
    const { navigation } = this.props;

    const onError = () => this.showAlert(() => this.navigateToIntegrateRecoveryPublicKeyForAR());

    try {
      const wallet = new HDSegwitP2SHArWallet([recoveryPublicKey]);

      navigation.goBack();
      this.createWalletMessage(wallet, onError);
    } catch (_) {
      onError();
    }
  };

  showAlert = (onPress: () => void, error?: string) => {
    Alert.alert('Error', error || i18n.wallets.add.publicKeyError, [
      {
        text: 'OK',
        onPress: () => onPress(),
      },
    ]);
  };

  renderConfirmScreenContent = () => (
    <>
      <Text style={styles.notificationTitle}>{i18n.notifications.getNotification}</Text>
      <Text style={styles.notificationDescription}>
        {i18n.notifications.receiveTransactionDescription}
        <Text style={styles.boldedText}>{this.props.email}</Text>
      </Text>
      <Text style={[styles.notificationDescription, styles.note]}>
        <Text style={styles.boldedText}>{i18n.notifications.noteFirst}</Text>
        {i18n.notifications.noteSecond}
      </Text>
    </>
  );

  navigateToSuccesfullNotificationSubscriptionMessage = (wallet: Wallet) => {
    const { navigation } = this.props;
    //TODO:

    this.props.subscribeFcmToken([wallet]);
    CreateMessage({
      title: i18n.contactDelete.success,
      description: i18n.message.successSubscription,
      type: MessageType.success,
      buttonProps: {
        title: i18n.onboarding.successCompletedButton,
        onPress: () => navigation.navigate(Route.MainTabStackNavigator, { screen: Route.Dashboard }),
      },
    });
  };

  navigateToConfirmEmailSubscription = (wallet: Wallet) => {
    const { navigation, email } = this.props;

    navigation.navigate(Route.Confirm, {
      title: i18n.notifications.notifications,
      children: this.renderConfirmScreenContent(),
      gestureEnabled: false,
      onConfirm: () => {
        this.props.subscribe([wallet], email);
        navigation.navigate(Route.ConfirmEmail, {
          email,
          flowType: ConfirmAddressFlowType.SUBSCRIBE,
          wallets: [wallet],
          onSuccess: () => this.navigateToSuccesfullNotificationSubscriptionMessage(wallet),
          onResend: () => this.props.subscribe([wallet], email),
        });
      },
      onBack: () =>
        CreateMessage({
          title: i18n.message.hooray,
          description: i18n.message.creatingWalletSuccess,
          type: MessageType.success,
          buttonProps: {
            title: i18n.onboarding.successCompletedButton,
            onPress: () => navigation.navigate(Route.MainTabStackNavigator, { screen: Route.Dashboard }),
          },
        }),
      isBackArrow: false,
    });
  };

  generateWallet = (wallet: Wallet, onError: (error?: string) => void) => {
    const { label } = this.state;
    const { navigation, createWallet, email } = this.props;

    wallet.setLabel(label);
    createWallet(wallet, {
      onSuccess: (w: Wallet) => {
        navigation.navigate(Route.CreateWalletSuccess, {
          isP2SH: this.state.WalletClass === SegwitP2SHWallet,
          secret: w.getSecret(),
          handleNavigationSubscription: !!email ? () => this.navigateToConfirmEmailSubscription(wallet) : undefined,
        });
      },
      onFailure: (error?: string) => onError(error),
    });
  };

  // TODO: interface Wallet isn't compatible with all wallet classes thus any must stay here for now
  createWalletMessage = (wallet: any, onError: (error?: string) => void) => {
    CreateMessage({
      title: i18n.message.creatingWallet,
      description: i18n.message.creatingWalletDescription,
      type: MessageType.processingState,
      asyncTask: () => this.generateWallet(wallet, onError),
    });
  };

  createAIRWalletAddRecoveryPublicKey = (wallet: HDSegwitP2SHAirWallet) => (recoveryPublicKey: string) => {
    const { navigation } = this.props;

    const onError = (error?: string) =>
      this.showAlert(() => {
        this.navigateToIntegrateRecoveryPublicKeyForAIR(wallet);
      }, error);

    try {
      wallet.addPublicKey(recoveryPublicKey);
      navigation.goBack();
      this.createWalletMessage(wallet, onError);
    } catch (e) {
      if (e instanceof Error) {
        onError(e.message);
      }
    }
  };

  navigateToIntegrateRecoveryPublicKeyForAIR = (wallet: HDSegwitP2SHAirWallet) => {
    const { navigation } = this.props;

    navigation.navigate(Route.IntegrateKey, {
      onBarCodeScan: this.createAIRWalletAddRecoveryPublicKey(wallet),
      headerTitle: i18n.wallets.add.title,
      title: i18n.wallets.publicKey.recoverySubtitle,
      description: i18n.wallets.publicKey.instantDescription,
      onBackArrow: () => {
        this.navigateToIntegrateInstantPublicKeyForAIR();
      },
    });
  };

  navigateToIntegrateRecoveryPublicKeyForAR = () => {
    const { navigation } = this.props;

    navigation.navigate(Route.IntegrateKey, {
      onBarCodeScan: recoveryPublicKey => this.createARWallet(recoveryPublicKey),
      headerTitle: i18n.wallets.add.title,
      title: i18n.wallets.publicKey.recoverySubtitle,
      description: i18n.wallets.publicKey.recoveryDescription,
      onBackArrow: () => {
        navigation.navigate(Route.CreateWallet);
      },
    });
  };

  navigateToIntegrateInstantPublicKeyForAIR = () => {
    const { navigation } = this.props;
    const wallet = new HDSegwitP2SHAirWallet();

    navigation.navigate(Route.IntegrateKey, {
      onBarCodeScan: instantPublicKey => {
        try {
          wallet.addPublicKey(instantPublicKey);
          this.navigateToIntegrateRecoveryPublicKeyForAIR(wallet);
        } catch (e) {
          if (e instanceof Error) {
            this.showAlert(() => this.navigateToIntegrateInstantPublicKeyForAIR(), e.message);
          }
        }
      },
      title: i18n.wallets.publicKey.instantSubtitle,
      headerTitle: i18n.wallets.add.title,
      description: i18n.wallets.publicKey.recoveryDescription,
      onBackArrow: () => {
        navigation.navigate(Route.CreateWallet);
      },
    });
  };

  setupWallet = () => {
    const { WalletClass } = this.state;

    if (WalletClass === HDSegwitP2SHAirWallet) {
      return this.navigateToIntegrateInstantPublicKeyForAIR();
    }

    if (WalletClass === HDSegwitP2SHArWallet) {
      return this.navigateToIntegrateRecoveryPublicKeyForAR();
    }

    this.createWallet();
  };

  createWallet = async () => {
    const { navigation } = this.props;
    const { WalletClass } = this.state;

    const wallet = new WalletClass();

    const onError = (error?: string) =>
      this.showAlert(() => {
        navigation.navigate(Route.CreateWallet);
      }, error || i18n.wallets.add.failed);

    this.createWalletMessage(wallet, onError);
  };

  get canCreateWallet(): boolean {
    return !!this.state.label && !this.validationError;
  }

  get validationError(): string | undefined {
    const { walletsLabels } = this.props;

    if (walletsLabels.includes(this.state.label.trim())) {
      return i18n.wallets.importWallet.walletInUseValidationError;
    }
    if (
      this.state.label.toLowerCase() === i18n.wallets.dashboard.allWallets.toLowerCase() ||
      this.state.label === CONST.allWallets
    ) {
      return i18n.wallets.importWallet.allWalletsValidationError;
    }
  }

  renderAdvancedSection() {
    const { isAdvancedOptionsEnabled } = this.props.appSettings;

    return (
      <>
        <Text style={styles.advancedOptionsLabel}>{i18n.wallets.add.walletType}</Text>

        {!isAdvancedOptionsEnabled ? (
          <>
            <RadioButton
              testID="create-2-key-vault-radio"
              title={HDSegwitP2SHArWallet.typeReadable}
              subtitle={i18n.wallets.add.ar}
              value={HDSegwitP2SHArWallet}
              checked={this.state.WalletClass === HDSegwitP2SHArWallet}
              onPress={this.onSelect}
            />
            <RadioButton
              testID="create-3-key-vault-radio"
              title={HDSegwitP2SHAirWallet.typeReadable}
              subtitle={i18n.wallets.add.air}
              value={HDSegwitP2SHAirWallet}
              checked={this.state.WalletClass === HDSegwitP2SHAirWallet}
              onPress={this.onSelect}
            />
            <RadioButton
              testID="create-hd-p2sh-radio"
              title={i18n.wallets.add.legacyTitle}
              subtitle={i18n.wallets.add.legacy}
              value={HDSegwitP2SHWallet}
              checked={this.state.WalletClass === HDSegwitP2SHWallet}
              onPress={this.onSelect}
            />
          </>
        ) : (
          <>
            <RadioButton
              testID="create-2-key-vault-radio"
              title={HDSegwitP2SHArWallet.typeReadable}
              subtitle={i18n.wallets.add.ar}
              value={HDSegwitP2SHArWallet}
              checked={this.state.WalletClass === HDSegwitP2SHArWallet}
              onPress={this.onSelect}
            />
            <RadioButton
              testID="create-3-key-vault-radio"
              title={HDSegwitP2SHAirWallet.typeReadable}
              subtitle={i18n.wallets.add.air}
              value={HDSegwitP2SHAirWallet}
              checked={this.state.WalletClass === HDSegwitP2SHAirWallet}
              onPress={this.onSelect}
            />
            <RadioButton
              testID="create-hd-p2sh-radio"
              title={i18n.wallets.add.legacyHDP2SHTitle}
              subtitle={i18n.wallets.add.legacyHDP2SH}
              value={HDSegwitP2SHWallet}
              checked={this.state.WalletClass === HDSegwitP2SHWallet}
              onPress={this.onSelect}
            />
            <RadioButton
              testID="create-segwit-p2sh-radio"
              title={i18n.wallets.add.legacyP2SHTitle}
              subtitle={i18n.wallets.add.LegacyP2SH}
              value={SegwitP2SHWallet}
              checked={this.state.WalletClass === SegwitP2SHWallet}
              onPress={this.onSelect}
            />
            <RadioButton
              testID="create-hd-segwit-p2sh-radio"
              title={i18n.wallets.add.legacyHDSegWitTitle}
              subtitle={i18n.wallets.add.LegacyHDSegWit}
              value={HDSegwitBech32Wallet}
              checked={this.state.WalletClass === HDSegwitBech32Wallet}
              onPress={this.onSelect}
            />
          </>
        )}
      </>
    );
  }

  render() {
    return (
      <ScreenTemplate
        keyboardShouldPersistTaps={'always'}
        footer={
          <>
            <Button
              disabled={!this.canCreateWallet}
              onPress={this.setupWallet}
              title={i18n.wallets.add.addWalletButton}
              testID="creates-wallet-button"
            />
            <FlatButton
              onPress={this.navigateToImportWallet}
              containerStyle={styles.importButtonContainer}
              title={i18n.wallets.add.importWalletButton}
              testID="imports-wallet-button"
            />
          </>
        }
        header={<Header isBackArrow title={i18n.wallets.add.title} />}
      >
        <Text style={styles.subtitle}>{i18n.wallets.add.subtitle}</Text>
        <Text style={styles.description}>{i18n.wallets.add.description}</Text>
        <InputItem
          error={this.validationError}
          setValue={this.setLabel}
          label={i18n.wallets.add.inputLabel}
          maxLength={maxWalletNameLength}
          testID="create-wallet-name-input"
        />
        {this.renderAdvancedSection()}
      </ScreenTemplate>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  appSettings: state.appSettings,
  walletsLabels: walletsSelector.getWalletsLabels(state),
  email: storedEmail(state),
  error: readableError(state),
});

const mapDispatchToProps = {
  createWallet: createWalletAction,
  subscribe: subscribeWalletAction,
  subscribeFcmToken: subscribeDeviceTokenAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateWalletScreen);

const styles = StyleSheet.create({
  subtitle: {
    marginTop: 12,
    marginBottom: 18,
    ...typography.headline4,
    textAlign: 'center',
  },
  description: {
    marginBottom: 52,
    color: palette.textGrey,
    ...typography.caption,
    textAlign: 'center',
  },
  advancedOptionsLabel: {
    color: palette.textGrey,
    marginBottom: 12,
  },
  importButtonContainer: {
    marginTop: 12,
  },
  notificationDescription: {
    ...typography.caption,
    color: palette.textGrey,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 18,
  },
  boldedText: {
    ...typography.headline9,
    color: palette.textBlack,
  },
  notificationTitle: { ...typography.headline4, marginTop: 16, textAlign: 'center' },
  note: {
    marginTop: 42,
  },
});
