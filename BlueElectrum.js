/* eslint-disable @typescript-eslint/no-empty-function */
import { difference, random } from 'lodash';
import { compose, map, mapValues, values, flatten, uniq, filter as fpFilter } from 'lodash/fp';

import { messages, AppErrors } from './error';
import logger from './logger';
import config from './src/config';
import { btcToSatoshi } from './utils/bitcoin';
import { wait } from './utils/time';

const BigNumber = require('bignumber.js');
const bitcoin = require('bitcoinjs-lib');
const reverse = require('buffer-reverse');
const ElectrumClient = require('electrum-client');

const hardcodedPeers = [
  { host: 'e1.electrumx.bitcoinvault.global', tcp: '50001' },
  { host: '157.245.20.66', tcp: '50001' },
];

let mainClient = false;
let mainConnected = false;
let currentHost = '';
const shouldAutoConnect = process.env.NODE_ENV !== 'test' || process.env.BLUEELECTRUM_AUTO_CONNECT === 'true';
const reconnectBaseDelayMs = 1000;
const reconnectMaxDelayMs = 30000;
let reconnectAttempts = 0;

const getReconnectDelayMs = () =>
  Math.min(reconnectMaxDelayMs, reconnectBaseDelayMs * 2 ** Math.min(reconnectAttempts, 5));

const getHost = () => {
  const hosts = config.hosts;
  const hostsLength = hosts.length;

  if (hostsLength === 1) {
    return hosts[0];
  }
  while (true) {
    const selectedHost = hosts[random(0, hostsLength - 1)];

    if (currentHost !== selectedHost) {
      currentHost = selectedHost;
      return currentHost;
    }
  }
};
const setNewHost = () => {
  mainClient.setHost(getHost());
};

const onClose = () => {
  setNewHost();
  logger.info({
    message: 'closed connection to server',
    category: 'BlueElectrum',
  });
  mainConnected = false;
};

const onConnect = () => {
  logger.info({
    message: 'connected to server',
    category: 'BlueElectrum',
  });
  mainConnected = true;
};

async function connectMain() {
  const usingPeer = { host: getHost(), port: config.port, protocol: config.protocol };

  try {
    logger.info({
      message: `begin connection: ${JSON.stringify(usingPeer)}`,
      category: 'BlueElectrum',
    });
    mainClient = new ElectrumClient(usingPeer.port, usingPeer.host, usingPeer.protocol);

    mainClient.onConnectionClose = () => onClose();

    mainClient.onConnect = () => onConnect();

    mainClient.onError = function (e) {
      logger.error({
        message: e.message,
        category: 'BlueElectrum',
      });
    };

    const ver = await mainClient.initElectrum({
      client: '2.7.11',
      version: config.electrumXProtocolVersion,
    });

    if (ver && ver[0]) {
      logger.info({
        message: `connected to, ${ver}`,
        category: 'BlueElectrum',
      });
      mainConnected = true;
      reconnectAttempts = 0;
    }
  } catch (e) {
    mainConnected = false;
    logger.error({
      message: `bad connection: ${JSON.stringify(usingPeer)}, Error: ${e.message}`,
      category: 'BlueElectrum',
    });
  }

  if (!mainConnected) {
    const reconnectDelayMs = getReconnectDelayMs();

    reconnectAttempts += 1;
    await wait(reconnectDelayMs);
    await connectMain();
  }
}

module.exports.getBlockchainHeaders = function () {
  return mainClient.blockchainHeaders_subscribe();
};

module.exports.subscribe = function (event, handler) {
  return mainClient.subscribe.on(event, handler);
};

module.exports.unsubscribe = function (event) {
  return mainClient.subscribe.off(event);
};

module.exports.subscribeToOnConnect = function (handler) {
  mainClient.onConnect = () => {
    onConnect();
    handler();
  };
};

module.exports.subscribeToOnClose = function (handler) {
  mainClient.onConnectionClose = () => {
    onClose();
    handler();
  };
};

if (shouldAutoConnect) {
  connectMain();
}

/**
 *
 * @param address {String}
 * @returns {Promise<Object>}
 */
module.exports.getBalanceByAddress = async function (address) {
  try {
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    const script = bitcoin.address.toOutputScript(address, config.network);
    const hash = bitcoin.crypto.sha256(script);
    const reversedHash = Buffer.from(reverse(hash));
    const balance = await mainClient.blockchainScripthash_getBalance(reversedHash.toString('hex'));

    balance.addr = address;
    return balance;
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.getConfig = async function () {
  try {
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    return {
      host: mainClient.host,
      port: mainClient.port,
      status: mainClient.status,
    };
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

/**
 *
 * @param address {String}
 * @returns {Promise<Array>}
 */
module.exports.getTransactionsByAddress = async function (address) {
  try {
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    const script = bitcoin.address.toOutputScript(address, config.network);
    const hash = bitcoin.crypto.sha256(script);
    const reversedHash = Buffer.from(reverse(hash));
    const history = await mainClient.blockchainScripthash_getHistory(reversedHash.toString('hex'));

    return history;
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.ping = async function () {
  try {
    await mainClient.server_ping();
  } catch (_) {
    mainConnected = false;
    return false;
  }

  return true;
};

module.exports.multiGetTransactionsFullByTxid = async function (txIds) {
  try {
    const txs = await this.multiGetTransactionByTxid(uniq(txIds));

    const inputsTxIds = difference(
      compose(
        uniq,
        flatten,
        map(tx => tx.vin.map(vin => vin.txid)),
      )(txs),
      txIds,
    );

    let inputsTxs = {};

    if (inputsTxIds.length > 0) {
      inputsTxs = await this.multiGetTransactionByTxid(inputsTxIds);
    }

    const allTxs = { ...txs, ...inputsTxs };

    return compose(
      // TODO: Add proper handling for coinbase transaction, this is quick fix with filtering them completly
      fpFilter(tx => tx.inputs.length > 0),
      values,
      mapValues(tx => {
        const inputs = tx.vin
          .filter(input => input.txid)
          .map(input => {
            const prevOutputOfInput = allTxs[input.txid].vout[input.vout];

            return { ...input, value: prevOutputOfInput.value, addresses: prevOutputOfInput.scriptPubKey.addresses };
          });

        const outputs = tx.vout
          .filter(o => !!o.scriptPubKey.addresses)
          .map(output => ({ ...output, addresses: output.scriptPubKey.addresses }));

        return { ...tx, outputs, inputs };
      }),
    )(txs);
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.subscribeToSriptHashes = scriptHashes => {
  return Promise.all(scriptHashes.map(scriptHash => mainClient.blockchainScripthash_subscribe(scriptHash)));
};

module.exports.unsubscribeFromSriptHashes = scriptHashes => {
  return Promise.all(scriptHashes.map(scriptHash => mainClient.blockchainScripthash_unsubscribe(scriptHash)));
};

/**
 *
 * @param addresses {Array}
 * @param batchsize {Number}
 * @returns {Promise<{balance: number, unconfirmed_balance: number, addresses: object}>}
 */
module.exports.multiGetBalanceByAddress = async function (addresses, batchsize) {
  try {
    batchsize = batchsize || 100;
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    const ret = { balance: 0, unconfirmed_balance: 0, incoming_balance: 0, outgoing_balance: 0, addresses: {} };

    const chunks = splitIntoChunks(addresses, batchsize);

    for (const chunk of chunks) {
      const scripthashes = [];
      const scripthash2addr = {};

      for (const addr of chunk) {
        const script = bitcoin.address.toOutputScript(addr, config.network);
        const hash = bitcoin.crypto.sha256(script);
        let reversedHash = Buffer.from(reverse(hash));

        reversedHash = reversedHash.toString('hex');
        scripthashes.push(reversedHash);
        scripthash2addr[reversedHash] = addr;
      }

      const balances = await mainClient.blockchainScripthash_getBalanceBatch(scripthashes);

      for (const bal of balances) {
        ret.incoming_balance += +bal.result.alert_incoming;
        ret.outgoing_balance += +bal.result.alert_outgoing;
        ret.balance += +bal.result.confirmed;
        ret.unconfirmed_balance += +bal.result.unconfirmed;
        ret.addresses[scripthash2addr[bal.param]] = bal.result;
      }
    }

    return ret;
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.multiGetUtxoByAddress = async function (addresses, batchsize) {
  try {
    batchsize = batchsize || 100;
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    const ret = {};
    const res = [];
    const chunks = splitIntoChunks(addresses, batchsize);

    for (const chunk of chunks) {
      const scripthashes = [];
      const scripthash2addr = {};

      for (const addr of chunk) {
        const script = bitcoin.address.toOutputScript(addr, config.network);
        const hash = bitcoin.crypto.sha256(script);
        let reversedHash = Buffer.from(reverse(hash));

        reversedHash = reversedHash.toString('hex');
        scripthashes.push(reversedHash);
        scripthash2addr[reversedHash] = addr;
      }

      const results = await mainClient.blockchainScripthash_listunspentBatch(scripthashes);

      for (const utxos of results) {
        ret[scripthash2addr[utxos.param]] = utxos.result;
        for (const utxo of ret[scripthash2addr[utxos.param]]) {
          utxo.address = scripthash2addr[utxos.param];
          utxo.txid = utxo.tx_hash;
          utxo.vout = utxo.tx_pos;
          utxo.spend_tx_num = utxo.spend_tx_num;
          res.push(utxo);
        }
      }
    }

    return res;
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.multiGetHistoryByAddress = async function (addresses, batchsize) {
  try {
    batchsize = batchsize || 100;
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    const ret = {};

    const chunks = splitIntoChunks(addresses, batchsize);

    for (const chunk of chunks) {
      const scripthashes = [];
      const scripthash2addr = {};

      for (const addr of chunk) {
        const script = bitcoin.address.toOutputScript(addr, config.network);
        const hash = bitcoin.crypto.sha256(script);
        let reversedHash = Buffer.from(reverse(hash));

        reversedHash = reversedHash.toString('hex');
        scripthashes.push(reversedHash);
        scripthash2addr[reversedHash] = addr;
      }

      const results = await mainClient.blockchainScripthash_getHistoryBatch(scripthashes);

      for (const history of results) {
        ret[scripthash2addr[history.param]] = history.result;
        for (const hist of ret[scripthash2addr[history.param]]) {
          hist.address = scripthash2addr[history.param];
        }
      }
    }

    return ret;
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.multiGetTransactionByTxid = async function (txids, batchsize, verbose) {
  try {
    batchsize = batchsize || 100;
    verbose = verbose !== false;
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    const ret = {};

    const chunks = splitIntoChunks(txids, batchsize);

    for (const chunk of chunks) {
      const results = await mainClient.blockchainTransaction_getBatch(chunk, verbose);

      for (const txdata of results) {
        ret[txdata.param] = txdata.result;
      }
    }

    return ret;
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};
/**
 * Simple waiter till `mainConnected` becomes true (which means
 * it Electrum was connected in other function), or timeout 30 sec.
 *
 *
 * @returns {Promise<Promise<*> | Promise<*>>}
 */
module.exports.waitTillConnected = async function () {
  try {
    const retriesMax = 30;

    for (let i = 0; i < retriesMax; i++) {
      if (mainConnected) {
        return true;
      }

      await wait(1000);
    }
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError('Waiting for Electrum connection timeout');
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.estimateFees = async function () {
  try {
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    let fast = await mainClient.blockchainEstimatefee(1);
    let medium = await mainClient.blockchainEstimatefee(5);
    let slow = await mainClient.blockchainEstimatefee(10);

    if (fast < 1) fast = 1;
    if (medium < 1) medium = 1;
    if (slow < 1) slow = 1;
    return { fast, medium, slow };
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

/**
 * Returns the estimated transaction fee to be confirmed within a certain number of blocks
 *
 * @param numberOfBlocks {number} The number of blocks to target for confirmation
 * @returns {Promise<number>} Satoshis per byte
 */
module.exports.estimateFee = async function (numberOfBlocks) {
  try {
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    numberOfBlocks = numberOfBlocks || 1;
    const coinUnitsPerKilobyte = await mainClient.blockchainEstimatefee(numberOfBlocks);

    if (coinUnitsPerKilobyte < 1) return 1;
    return Math.round(new BigNumber(coinUnitsPerKilobyte).dividedBy(1024).multipliedBy(100000000).toNumber());
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.getDustValue = async () => {
  try {
    const relayFee = await mainClient.blockchain_relayfee();
    // magic numbers from electrum vault

    return btcToSatoshi((183 * 3 * relayFee) / 1000, 0);
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

module.exports.broadcast = async function (hex) {
  try {
    if (!mainConnected) throw new AppErrors.ElectrumXConnectionError();
    try {
      return await mainClient.blockchainTransaction_broadcast(hex);
    } catch (error) {
      if (error?.code === 1) {
        if (error.message.includes(messages.txnMempoolConflictCode18)) {
          throw new AppErrors.DoubleSpentFundsError();
        }
        if (error.message.includes(messages.missingInputs)) {
          throw new AppErrors.NotExistingFundsError();
        }
        if (error.message.includes(messages.dustCode64)) {
          throw new AppErrors.DustError();
        }
        throw new AppErrors.BroadcastError(error.message);
      }
      throw error;
    }
  } catch (error) {
    logger.error({
      message: error.message,
      category: error.name,
    });
  }
};

/**
 *
 * @param host
 * @param tcpPort
 * @returns {Promise<boolean>} Whether provided host:port is a valid electrum server
 */
module.exports.testConnection = async function (host, tcpPort) {
  const client = new ElectrumClient(tcpPort, host, 'tcp');

  try {
    await client.connect();
    await client.server_version('2.7.11', '1.4');
    await client.server_ping();

    client.close();
    return true;
  } catch (_) {
    return false;
  }
};

module.exports.forceDisconnect = () => {
  mainConnected = false;
  reconnectAttempts = 0;

  if (mainClient && typeof mainClient.close === 'function') {
    mainClient.close();
  }
};

module.exports.hardcodedPeers = hardcodedPeers;

const splitIntoChunks = function (arr, chunkSize) {
  const groups = [];
  let i;

  for (i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
};
