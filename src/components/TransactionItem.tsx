import moment from 'moment';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { icons } from 'app/assets';
import { TranscationLabelStatus, Image, Label } from 'app/components';
import { CONST, Transaction, TxType } from 'app/consts';
import { getConfirmationsText } from 'app/helpers/helpers';
import { typography, palette } from 'app/styles';

import { satoshiToBtc } from '../../utils/bitcoin';

const i18n = require('../../loc');

const renderArrowIcon = (value: number) => (
  <Image source={value > 0 ? icons.arrowRight : icons.arrowLeft} style={styles.arrow} resizeMode="contain" />
);

const renderCofirmations = (txType: TxType, confirmations: number) =>
  txType !== TxType.ALERT_RECOVERED && (
    <Text style={styles.label}>{`${i18n.transactions.list.conf}: ${getConfirmationsText(txType, confirmations)}`}</Text>
  );

const addMissingZerosToSatoshis = (value: number): string => {
  const arr = value.toString().split('.');
  console.log('arr', arr);
  const [integer, decimal] = arr;
  const decimallWithMissingZeros = (decimal || '').padEnd(8, '0');

  console.log('decimallWithMissingZeros', decimallWithMissingZeros);
  return [integer, decimallWithMissingZeros].join('.');
};

const getBtcLabel = (value: number): string => `${addMissingZerosToSatoshis(value)} ${CONST.preferredBalanceUnit}`;

export const TransactionItem = ({ item, onPress }: { item: Transaction; onPress: (item: any) => void }) => {
  const isMinusValue = item.value < 0;
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(item)}>
      <View style={styles.walletLabelWrapper}>
        {renderArrowIcon(item.value)}
        <Image source={icons.wallet} style={styles.wallet} resizeMode="contain" />
        <Text style={styles.walletLabel} numberOfLines={1} ellipsizeMode="tail">
          {item.walletLabel}
        </Text>
      </View>
      {!!item.note && <Text style={typography.caption}>{item.note}</Text>}
      <Text style={styles.label}>
        {item.time ? moment(item.received).format('LT') : i18n.transactions.details.timePending}
      </Text>
      {renderCofirmations(item.tx_type, item.confirmations)}
      <View style={styles.rowWrapper}>
        <TranscationLabelStatus type={item.tx_type} confirmations={item.confirmations} />
        <Text
          style={[
            typography.headline5,
            { color: isMinusValue ? palette.textRed : palette.textBlack },
            item.toExternalAddress ? styles.label : null,
          ]}
        >
          {!isMinusValue && '+'}
          {getBtcLabel(satoshiToBtc(item.value).toNumber())}
        </Text>
      </View>
      {item.blockedAmount && (
        <View style={styles.rowWrapper}>
          <Label>Blocked </Label>

          <Text style={[typography.headline5, { color: palette.textRed }]}>{getBtcLabel(item.blockedAmount)}</Text>
        </View>
      )}
      {item.unblockedAmount && (
        <View style={styles.rowWrapper}>
          <Label>Unblocked </Label>
          <Text style={[typography.headline5, item.toExternalAddress ? styles.label : null]}>
            +{getBtcLabel(item.unblockedAmount)}
          </Text>
        </View>
      )}
      {item.returnedFee && (
        <View style={styles.rowWrapper}>
          <Text style={styles.label}>Total returned fee: </Text>
          <Text style={[styles.label, typography.headline5, item.toExternalAddress ? styles.label : null]}>
            +{getBtcLabel(item.returnedFee)}
          </Text>
        </View>
      )}
      {item.fee && (
        <View style={styles.rowWrapper}>
          <Text style={styles.label}>Fee: </Text>
          <Text style={[styles.label, typography.headline5]}>{getBtcLabel(item.fee)}</Text>
        </View>
      )}
      {item.toInternalAddress && (
        <View>
          <Text style={styles.label}>To the internal wallet: </Text>
          <Text style={styles.label}>{item.toInternalAddress}</Text>
        </View>
      )}
      {item.toExternalAddress && (
        <View>
          <Text style={styles.label}>To the external wallet: </Text>
          <Text style={styles.label}>{item.toExternalAddress}</Text>
        </View>
      )}
      {item.recoveredTxsCounter && (
        <View>
          <Text style={styles.label}>Number of Cancel transactions: {item.recoveredTxsCounter} </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rowWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginVertical: 8,
    flexGrow: 1,
  },
  walletLabelWrapper: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  wallet: {
    width: 14,
    height: 14,
    marginHorizontal: 3,
  },
  arrow: {
    width: 24,
    height: 24,
  },
  label: {
    ...typography.caption,
    color: palette.textGrey,
  },
  walletLabel: {
    ...typography.headline5,
    flexShrink: 1,
  },
});
