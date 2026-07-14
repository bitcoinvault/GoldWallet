import RNExitApp from 'react-native-exit-app';

import { CONST } from 'app/consts';
import { BlueApp } from 'app/legacy';
import { BiometricService, PinSessionVerifier, SecureStorageService, StoreService } from 'app/services';
import { persistor, store } from 'app/state/store';

export const factoryReset = () => {
  persistor
    .purge()
    .then(async () => {
      await BlueApp.purgeStore();
      return persistor.flush();
    })
    .then(() => {
      return persistor.pause();
    })
    .then(async () => {
      BiometricService.deleteBiometrics();
      PinSessionVerifier.clear();
      StoreService.wipeStore();
      SecureStorageService.removeSecuredPassword(CONST.pin);
      SecureStorageService.removeSecuredPassword(CONST.transactionPassword);
      return;
    })
    .then(() => {
      store.dispatch({
        type: 'RESET',
      });
      return RNExitApp.exitApp();
    });
};
