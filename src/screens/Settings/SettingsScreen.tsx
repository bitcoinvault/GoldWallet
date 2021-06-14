import { CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { icons } from 'app/assets';
import { Image, ScreenTemplate, Header, ListItem, CustomModal } from 'app/components';
import { Route, MainTabNavigatorParams, RootStackParams, Wallet } from 'app/consts';
import { logoSource } from 'app/helpers/images';
import { BiometricService, AppStateManager } from 'app/services';
import { ApplicationState } from 'app/state';
import { updateBiometricSetting } from 'app/state/appSettings/actions';

import { LabeledSettingsRow } from './LabeledSettingsRow';

const i18n = require('../../../loc');

interface Props {
  navigation: CompositeNavigationProp<
    StackNavigationProp<MainTabNavigatorParams, Route.Settings>,
    StackNavigationProp<RootStackParams, Route.MainTabStackNavigator>
  >;
}

export const SettingsScreen = (props: Props) => {
  const { navigation } = props;
  const { isBiometricsEnabled } = useSelector((state: ApplicationState) => ({
    isBiometricsEnabled: state.appSettings.isBiometricsEnabled,
  }));
  const { language } = useSelector((state: ApplicationState) => ({
    language: state.appSettings.language,
  }));
  const [biometryTypeAvailable, setBiometryTypeAvailable] = useState(false);
  const [showWarring, setShowWarring] = useState(false);

  useEffect(() => {
    refreshBiometricsAvailability();
  }, [biometryTypeAvailable]);

  const dispatch = useDispatch();

  const navigateToAboutUs = () => navigation.navigate(Route.AboutUs);

  const navigateToTermsConditions = () => navigation.navigate(Route.TermsConditions, { language });

  const navigateToSelectLanguage = () => navigation.navigate(Route.SelectLanguage);

  const onAdvancedOptionsChange = () => navigation.navigate(Route.AdvancedOptions);

  const onNotificationsOptionsChange = () =>
    navigation.navigate(Route.Notifications, {
      wallet: {} as Wallet,
      onBackArrow: () => navigation.navigate(Route.MainTabStackNavigator, { screen: Route.Settings }),
    });

  const onFingerprintLoginChange = async (value: boolean) => {
    dispatch(updateBiometricSetting(value));
  };

  const renderGeneralSettings = () => (
    <>
      <ListItem onPress={navigateToSelectLanguage} title={i18n.settings.language} source={icons.languageIcon} />
      <ListItem
        testID="advanced-options-settings-item"
        title={i18n.settings.advancedOptions}
        source={icons.buildIcon}
        onPress={onAdvancedOptionsChange}
      />
      <ListItem
        testID="email-notifications-settings-item"
        title={i18n.settings.notifications}
        source={icons.bell}
        onPress={onNotificationsOptionsChange}
      />
    </>
  );

  const goToChangePin = () => {
    navigation.navigate(Route.CurrentPin);
  };

  const handleResetFactory = () => {
    //TODO:
  };

  const renderContent = () => {
    //TODO:
    return null;
  };

  const refreshBiometricsAvailability = async () => {
    await BiometricService.setBiometricsAvailability();
    setBiometryTypeAvailable(BiometricService.biometryType !== undefined);
  };

  const renderSecuritySettings = () => (
    <>
      <ListItem
        testID="change-pin-settings-item"
        title={i18n.settings.changePin}
        source={icons.lockIcon}
        iconWidth={15}
        iconHeight={20}
        onPress={goToChangePin}
      />
      {biometryTypeAvailable && (
        <ListItem
          testID="biometry-settings-item"
          title={i18n.settings[BiometricService.biometryType!]}
          source={icons.fingerprintIcon}
          switchTestID="biometry-switch"
          switchValue={isBiometricsEnabled}
          onSwitchValueChange={onFingerprintLoginChange}
          iconWidth={17}
          iconHeight={19}
        />
      )}
    </>
  );

  const renderAboutSettings = () => (
    <>
      <ListItem
        testID="about-us-settings-item"
        onPress={navigateToAboutUs}
        title={i18n.settings.aboutUs}
        source={icons.infoIcon}
      />
      <ListItem onPress={navigateToTermsConditions} title={i18n.settings.terms} source={icons.termsIcon} />
      <ListItem onPress={handleResetFactory} title={i18n.settings.factory} source={icons.resetFactory} />
    </>
  );

  return (
    <>
      <AppStateManager handleAppComesToForeground={refreshBiometricsAvailability} />
      <Header title={i18n.settings.header} />
      <ScreenTemplate>
        <Image testID="goldwallet-logo" source={logoSource} style={styles.logo} resizeMode="contain" />
        <LabeledSettingsRow label={i18n.settings.general}>{renderGeneralSettings()}</LabeledSettingsRow>
        <LabeledSettingsRow label={i18n.settings.security}>{renderSecuritySettings()}</LabeledSettingsRow>
        <LabeledSettingsRow label={i18n.settings.about}>{renderAboutSettings()}</LabeledSettingsRow>
        <CustomModal show={showWarring}>{renderContent()}</CustomModal>
      </ScreenTemplate>
    </>
  );
};

const styles = StyleSheet.create({
  logo: {
    height: 82,
    width: '100%',
    paddingTop: 3,
  },
});
