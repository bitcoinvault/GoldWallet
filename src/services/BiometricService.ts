import ReactNativeBiometrics, { Biometrics, BiometryType, FaceID, TouchID } from 'react-native-biometrics';

import logger from '../../logger';

const i18n = require('../../loc');

type Biometry = BiometryType | undefined;

export default class BiometricService {
  static FaceID = FaceID;
  static TouchID = TouchID;
  static Biometrics = Biometrics;

  private biometrics = new ReactNativeBiometrics();

  constructor() {
    this.setBiometricsAvailability();
  }

  biometryType: Biometry;

  setBiometricsAvailability = async () => {
    const biometricsResult = await this.biometrics.isSensorAvailable();
    const { available, biometryType } = biometricsResult;

    if (!available) {
      this.biometryType = undefined;
    } else {
      this.biometryType = biometryType;
    }
  };

  unlockWithBiometrics = async () => {
    try {
      const checkResult = await this.biometrics.simplePrompt({
        promptMessage: i18n.unlock.touchID,
        cancelButtonText: i18n.unlock.enter,
      });
      const { success } = checkResult;

      logger.info({
        message: 'cancelled by user',
        category: 'BiometricSerivce',
      });
      if (success) {
        return success;
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.error({
          message: `cancelled by user: ${e.message}`,
          category: 'BiometricSerivce',
        });
      }
    }
  };

  deleteBiometrics = async () => {
    this.biometrics.deleteKeys();
  };
}
