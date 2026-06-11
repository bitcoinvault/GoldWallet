import { alt_networks, Network } from 'bitcoinjs-lib';
import Config from 'react-native-config';

const requireConfigValue = (key: keyof typeof Config): string => {
  const value = Config[key];

  if (typeof value !== 'string') {
    throw new Error(`Missing required config value: ${key}`);
  }

  return value;
};

const networkName = requireConfigValue('BTCV_NETWORK');
const networks = alt_networks as Record<string, Network>;

export default {
  environment: requireConfigValue('ENVIRONMENT'),
  isBeta: Config.IS_BETA === 'true',
  applicationId: requireConfigValue('APP_ID'),
  applicationName: requireConfigValue('APPLICATION_NAME'),
  hosts: requireConfigValue('HOSTS').split(','),
  port: requireConfigValue('PORT'),
  networkName,
  network: networks[networkName],
  protocol: requireConfigValue('PROTOCOL'),
  electrumXProtocolVersion: requireConfigValue('ELECTRUM_X_PROTOCOL_VERSION'),
  explorerUrl: requireConfigValue('EXPLORER_URL'),
  sentryDsnIOS: Config.SENTRY_DSN_IOS,
  sentryDsnAndroid: Config.SENTRY_DSN_ANDROID,
  emailNotificationsApi: Config.EMAIL_NOTIFICATIONS_API ?? '',
};
