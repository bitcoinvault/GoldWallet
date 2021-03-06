import { RouteProp } from '@react-navigation/native';
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Header, ScreenTemplate, TextAreaItem } from 'app/components';
import { CopyButton } from 'app/components/CopyButton';
import { RootStackParams, Route } from 'app/consts';
import { typography } from 'app/styles';

import { WatchOnlyWallet } from '../../class';

const i18n = require('../../loc');

interface Props {
  route: RouteProp<RootStackParams, Route.ExportWalletXpub>;
}

export const ExportWalletXpubScreen = ({ route }: Props) => {
  const { wallet } = route.params;
  const isWatchOnlyWallet = wallet.type === WatchOnlyWallet.type;

  const xpub = isWatchOnlyWallet ? wallet.secret : wallet._xpub;

  return (
    <ScreenTemplate header={<Header title={i18n.wallets.exportWalletXpub.header} isBackArrow />}>
      <Text style={styles.title}>{wallet.label}</Text>
      <View testID="wallet-xpub-qr-code" style={styles.qrCodeContainer}>
        <QRCode quietZone={10} value={xpub} size={140} ecl={'H'} />
      </View>
      <TextAreaItem testID="wallet-xpub" value={xpub} editable={false} style={styles.textArea} />
      <CopyButton testID="wallet-xpub-copy-button" textToCopy={xpub} />
    </ScreenTemplate>
  );
};

const styles = StyleSheet.create({
  qrCodeContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  textArea: {
    height: 130,
  },
  title: { ...typography.headline4, marginTop: 16, textAlign: 'center' },
});
