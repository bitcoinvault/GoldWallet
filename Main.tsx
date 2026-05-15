import * as Sentry from '@sentry/react-native';
import React, { useEffect } from 'react';
import { StatusBar, AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';

import App from './App';

const Main = () => {
  useEffect(() => {
    const listener = (state: AppStateStatus) => {
      switch (state) {
        case 'active':
          return RNBootSplash.hide({ fade: true }).catch(error => {
            Sentry.captureException(error);
          });
        case 'inactive':
          return RNBootSplash.show().catch(error => {
            Sentry.captureException(error);
          });
      }
    };

    const addAppStateChangeListener = (AppState.addEventListener as unknown) as (
      eventType: 'change',
      listener: (state: AppStateStatus) => void,
    ) => NativeEventSubscription;

    let appStateSubscription: NativeEventSubscription | undefined;

    try {
      appStateSubscription = addAppStateChangeListener('change', listener);
      listener(AppState.currentState);
    } catch (error) {
      Sentry.captureException(error);
    }

    return () => {
      appStateSubscription && appStateSubscription.remove();
    };
  }, []);

  return (
    <>
      <StatusBar backgroundColor="rgba(0,0,0,0)" translucent />
      <App />
    </>
  );
};

export default Main;
