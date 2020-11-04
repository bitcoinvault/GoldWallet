import { LegacyWallet } from './legacy-wallet';
const bitcoin = require('bitcoinjs-lib');
const signer = require('../models/signer');
const BigNumber = require('bignumber.js');
const config = require('../config');

/**
 * Creates Segwit P2SH Bitcoin address
 * @param pubkey
 * @param network
 * @returns {String}
 */
function pubkeyToP2shSegwitAddress(pubkey, network) {
  network = network || config.network;
  const { address } = bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({ pubkey, network }),
    network,
  });
  return address;
}

export class SegwitP2SHWallet extends LegacyWallet {
  static type = 'segwitP2SH';
  static typeReadable = 'SegWit (P2SH)';

  allowRBF() {
    return true;
  }

  static witnessToAddress(witness) {
    const pubKey = Buffer.from(witness, 'hex');
    return pubkeyToP2shSegwitAddress(pubKey);
  }

  /**
   * Converts script pub key to p2sh address if it can. Returns FALSE if it cant.
   *
   * @param scriptPubKey
   * @returns {boolean|string} Either p2sh address or false
   */
  static scriptPubKeyToAddress(scriptPubKey) {
    const scriptPubKey2 = Buffer.from(scriptPubKey, 'hex');
    let ret;
    try {
      ret = bitcoin.payments.p2sh({
        output: scriptPubKey2,
        network: config.network,
      }).address;
    } catch (_) {
      return false;
    }
    return ret;
  }

  getAddress() {
    if (this._address) return this._address;
    let address;
    try {
      let keyPair = bitcoin.ECPair.fromWIF(this.secret, config.network);
      let pubKey = keyPair.publicKey;
      if (!keyPair.compressed) {
        console.warn('only compressed public keys are good for segwit');
        return false;
      }
      address = pubkeyToP2shSegwitAddress(pubKey);
    } catch (err) {
      return false;
    }
    this._address = address;

    return this._address;
  }

  /**
   * Takes UTXOs (as presented by blockcypher api), transforms them into
   * format expected by signer module, creates tx and returns signed string txhex.
   *
   * @param utxos Unspent outputs, expects blockcypher format
   * @param amount
   * @param fee
   * @param address
   * @param memo
   * @param sequence By default zero. Increased with each transaction replace.
   * @return string Signed txhex ready for broadcast
   */
  createTx(utxos, amount, fee, address, memo, sequence) {
    console.log('utxos', utxos);
    const newUtxos = JSON.parse(JSON.stringify(utxos));
    // TODO: memo is not used here, get rid of it
    if (sequence === undefined) {
      sequence = 0;
    }
    // transforming UTXOs fields to how module expects it
    for (let u of newUtxos) {
      u.amount = u.amount.dividedBy(100000000);
      u.amount = u.amount.toString(10);
    }
    // console.log('creating tx ', amount, ' with fee ', fee, 'secret=', this.getSecret(), 'from address', this.getAddress());
    let amountPlusFee = parseFloat(new BigNumber(amount).plus(fee).toString(10));
    // to compensate that module substracts fee from amount
    return signer.createSegwitTransaction(newUtxos, address, amountPlusFee, fee, this.getSecret(), this.getAddress(), sequence);
  }
}
