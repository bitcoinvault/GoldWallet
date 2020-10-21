import * as bitcoin from 'bitcoinjs-lib';
import { round } from 'lodash';

import config from '../config';
import { CONST } from '../src/consts';

const BigNumber = require('bignumber.js');
const reverse = require('buffer-reverse');

export const btcToSatoshi = (btc: number, precision: number | null = null): number => {
  const satoshis = new BigNumber(btc).multipliedBy(CONST.satoshiInBtc);
  if (precision === null) {
    return satoshis.toNumber();
  }

  return round(satoshis.toNumber(), precision);
};

export const satoshiToBtc = (satoshi: number) => new BigNumber(satoshi).dividedBy(CONST.satoshiInBtc);

export const roundBtcToSatoshis = (btc: number) => round(btc, Math.log10(CONST.satoshiInBtc));

export const addressToScriptHash = (address: string) => {
  const script = bitcoin.address.toOutputScript(address, config.network);
  const hash = bitcoin.crypto.sha256(script);
  const scriptHash = Buffer.from(reverse(hash)).toString('hex');
  return scriptHash;
};

export const addMissingZerosToSatoshis = (value: number): string => {
  const [integer, decimal] = value.toString().split('.');
  const decimallWithMissingZeros = (decimal || '').padEnd(Math.log10(CONST.satoshiInBtc), '0');

  return [integer, decimallWithMissingZeros].join('.');
};

export const getBtcLabel = (value: number): string =>
  `${addMissingZerosToSatoshis(value)} ${CONST.preferredBalanceUnit}`;
