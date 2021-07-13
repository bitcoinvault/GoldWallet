import * as Sentry from '@sentry/react-native';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { View, StyleSheet, LogBox } from 'react-native';
import codePush from 'react-native-code-push';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { Navigator } from 'app/navigators';
import { AppStateManager } from 'app/services';
import NotificationsServices from 'app/services/NotificationServices';
import { AppSettingsAction } from 'app/state/appSettings/actions';
import { AuthenticationAction } from 'app/state/authentication/actions';
import { persistor, store } from 'app/state/store';

import config from './src/config';

const i18n = require('./loc');

LogBox.ignoreAllLogs(process.env.LOG_BOX_IGNORE === 'true');

if (!__DEV__) {
  Sentry.init({
    dsn: config.sentryDsn,
    tracesSampleRate: 0.25,
    debug: config.environment === 'dev',
    environment: config.environment,
  });
}

const getNewKey = () => new Date().toISOString();

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
  minimumBackgroundDuration: 30 * 60, // 30 minutes
};

class App extends React.PureComponent {
  state = {
    unlockKey: getNewKey(),
  };

  lockScreen = () => {
    store.dispatch({
      type: AuthenticationAction.SetIsAuthenticated,
      isAuthenticated: false,
    });
  };

  setUnlockScreenKey = () => {
    this.setState({
      unlockKey: getNewKey(),
    });
    store.dispatch({
      type: AppSettingsAction.ClearBadge,
    });
  };

  render() {
    return (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <AppStateManager
            handleAppComesToForeground={this.setUnlockScreenKey}
            handleAppComesToBackground={this.lockScreen}
          />
          <PersistGate loading={null} persistor={persistor}>
            <View style={styles.wrapper}>
              <Navigator unlockKey={this.state.unlockKey} />
            </View>
            <NotificationsServices />
          </PersistGate>
        </Provider>
      </I18nextProvider>
    );
  }
}

export default codePush(codePushOptions)(App);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
});
