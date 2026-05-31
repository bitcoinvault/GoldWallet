const ecc = require('@bitcoinerlab/secp256k1');
const { BIP32Factory } = require('bip32');

module.exports = BIP32Factory(ecc);
