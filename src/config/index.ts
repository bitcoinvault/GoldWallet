import { alt_networks, Network } from 'bitcoinjs-lib';
import Config from 'react-native-config';

export default {
  environment: Config.ENVIRONMENT,
  isBeta: Config.IS_BETA === 'true',
  applicationId: Config.APP_ID,
  applicationName: Config.APPLICATION_NAME,
  hosts: Config.HOSTS.split(','),
  port: Config.PORT,
  networkName: Config.BTCV_NETWORK,
  network: alt_networks[Config.BTCV_NETWORK] as Network,
  protocol: Config.PROTOCOL,
  electrumXProtocolVersion: Config.ELECTRUM_X_PROTOCOL_VERSION,
  explorerUrl: Config.EXPLORER_URL,
  sentryDsn: Config.SENTRY_DSN,
  emailNotificationsApi: Config.EMAIL_NOTIFICATIONS_API,
  smartlookKey: Config.SMARTLOOK_API_KEY,
};
