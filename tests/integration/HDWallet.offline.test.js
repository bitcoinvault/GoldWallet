import {
  HDLegacyP2PKHWallet,
  HDSegwitBech32Wallet,
  HDSegwitP2SHWallet,
  SegwitBech32Wallet,
  SegwitP2SHWallet,
} from '../../class';
import { BitcoinUnit } from '../../models/bitcoinUnits';

jest.mock('../../BlueElectrum', () => ({
  getDustValue: jest.fn().mockResolvedValue(546),
}));

const assert = require('assert');
const bitcoin = require('bitcoinjs-lib');

const config = require('../../src/config').default;

global.crypto = require('crypto'); // shall be used by tests under nodejs CLI, but not in RN environment

jest.setTimeout(60000);

describe('HD wallet offline flows', () => {
  it('can convert witness and scriptPubKey to addresses', () => {
    let address = SegwitP2SHWallet.witnessToAddress(
      '035c618df829af694cb99e664ce1b34f80ad2c3b49bcd0d9c0b1836c66b2d25fd8',
    );

    assert.strictEqual(address, 'RC9fRZSXW4SYKHmSAuWdJGU6vdUezHmowA');

    address = SegwitP2SHWallet.scriptPubKeyToAddress('a914e286d58e53f9247a4710e51232cce0686f16873c87');
    assert.strictEqual(address, 'RVvxKKBuC7jRDuYxmmXTex4F4Bqs86Vfca');

    address = SegwitBech32Wallet.witnessToAddress('035c618df829af694cb99e664ce1b34f80ad2c3b49bcd0d9c0b1836c66b2d25fd8');
    assert.strictEqual(address, 'royale1quhnve8q4tk3unhmjts7ymxv8cd6w9xv80d8n3p');

    address = SegwitBech32Wallet.scriptPubKeyToAddress('00144d757460da5fcaf84cc22f3847faaa1078e84f6a');
    assert.strictEqual(address, 'royale1qf46hgcx6tl90snxz9uuy0742zpuwsnm2ldam6n');
  });

  it('can derive Segwit HD BIP49 keys from a known mnemonic', async () => {
    const mnemonic =
      'fiber quiz produce chuckle sort crisp price direct speak recipe adult layer thumb lift tape start peace wave jungle fluid green interest cave learn';
    const hd = new HDSegwitP2SHWallet();

    await hd.setSecret(mnemonic);

    assert.strictEqual(hd.getAddress()[0], 'RVUYxQnej5m99PEr5qKrMS128czSCSPz4W');
    assert.strictEqual(hd.getAddress()[1], 'RA4DhjMkk67nBYbNhPh8q3Zh3mDeGZzCdX');
    assert.strictEqual(hd.getAddress()[2], 'RKBm1Wz1tPBefb92d3hEXYMZqZTsxEcPJe');
    assert.strictEqual(hd.validateMnemonic(), true);
    assert.strictEqual(await hd._getWIFByIndex(0), 'L5KcrwqMGgEtVnsM4ZGS6XdRoBDinfb1hfFW61RhsY9QuumePh8b');
    assert.strictEqual(
      hd._getWifForAddress(hd.getAddress()[0]),
      'L5KcrwqMGgEtVnsM4ZGS6XdRoBDinfb1hfFW61RhsY9QuumePh8b',
    );
    assert.strictEqual(
      await hd.getXpub(),
      'ypub6Wj9dHZAtSM3DQB6kG37aK5i1yJbBoM2d1W57aMkyLx4cNyGqWYpGvL194zA4HSxWpQyoPrsXE2PP4pNUqu5cvvHUK2ZpfUeHFmuK4THAD3',
    );
  });

  it('can create signed Segwit HD BIP49 transactions from offline UTXO fixtures', async () => {
    const mnemonic =
      'fiber quiz produce chuckle sort crisp price direct speak recipe adult layer thumb lift tape start peace wave jungle fluid green interest cave learn';
    const hd = new HDSegwitP2SHWallet();

    await hd.setSecret(mnemonic);

    const [fundingAddress, recipientAddress] = hd.getAddress();
    const expectedChangeAddress = hd.getAddressForTransaction();
    const utxos = [
      {
        txid: 'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        vout: 0,
        value: 20000,
        address: fundingAddress,
      },
    ];

    const { tx: txHex, fee } = await hd.createTx(utxos, 0.00005, 0.00001, recipientAddress);
    const tx = bitcoin.Transaction.fromHex(txHex);

    assert.strictEqual(fee, 1000);
    assert.strictEqual(tx.ins.length, 1);
    assert.strictEqual(tx.outs.length, 2);
    assert.deepStrictEqual(
      tx.outs.map(output => bitcoin.address.fromOutputScript(output.script, config.network)),
      [recipientAddress, expectedChangeAddress],
    );
    assert.strictEqual(tx.outs[0].value, 5000);
    assert.strictEqual(tx.outs[1].value, 14000);

    const { tx: sendMaxTxHex, fee: sendMaxFee } = await hd.createTx(utxos, BitcoinUnit.MAX, 0.00001, recipientAddress);
    const sendMaxTx = bitcoin.Transaction.fromHex(sendMaxTxHex);

    assert.strictEqual(sendMaxFee, 1000);
    assert.strictEqual(sendMaxTx.ins.length, 1);
    assert.strictEqual(sendMaxTx.outs.length, 1);
    assert.strictEqual(bitcoin.address.fromOutputScript(sendMaxTx.outs[0].script, config.network), recipientAddress);
    assert.strictEqual(sendMaxTx.outs[0].value, 19000);
  });

  it('can normalize malformed Segwit HD BIP49 mnemonic spacing', async () => {
    let mnemonic =
      'honey risk juice trip orient galaxy win situate shoot anchor bounce remind horse traffic exotic since escape mimic ramp skin judge owner topple erode';
    let hd = new HDSegwitP2SHWallet();

    await hd.setSecret(mnemonic);
    const seed1 = await hd.getMnemonicToSeedHex();

    assert.ok(hd.validateMnemonic());

    mnemonic = 'hell';
    hd = new HDSegwitP2SHWallet();
    await hd.setSecret(mnemonic);
    assert.ok(!hd.validateMnemonic());

    mnemonic =
      '    honey  risk   juice    trip     orient      galaxy win !situate ;; shoot   ;;;   anchor Bounce remind\nhorse \n traffic exotic since escape mimic ramp skin judge owner topple erode ';
    hd = new HDSegwitP2SHWallet();
    await hd.setSecret(mnemonic);
    const seed2 = await hd.getMnemonicToSeedHex();

    assert.strictEqual(seed1, seed2);
    assert.ok(hd.validateMnemonic());
  });

  it('can derive Bech32 Segwit HD BIP84 keys from a known mnemonic', async () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const hd = new HDSegwitBech32Wallet();

    await hd.setSecret(mnemonic);

    assert.strictEqual(hd.validateMnemonic(), true);
    assert.strictEqual(
      await hd.getXpub(),
      'zpub6qV8gC8H2NR4zcdP5rvnTpY7xZw3H3Samf8XuoeJdKDvF4UCJzeaj7DjwSYdj5A6wdmt6qVHqbnonjQXZA56Ecs1QTe4ug6gPRBwYnMiW2s',
    );

    assert.strictEqual(await hd._getWIFByIndex(0), 'KwLAKpr3t88u6E6CEQT6Qb2Q9ZJ6RJzoxc4Z2Gx6ALxwgAgaqfEn');
    assert.strictEqual(await hd._getWIFByIndex(1), 'L4CRAA2JrVuivLTLQc4A2g2Nnu7Xjhnnh8jCEzJaP739C9hWqXux');
    assert.strictEqual(await hd._getWIFByIndex(2), 'KxNUq8mMoo14fVGgG3EqyYjMMAPAvKZVTqhNFfS2AAeka8LRSPWr');
    assert.ok((await hd._getWIFByIndex(0)) !== (await hd._getWIFByIndex(1)));

    assert.strictEqual(hd.getAddress()[0], 'royale1qs79r2xk6nhr8ce9ae6rexrtprms3cr7yggm3dt');
    assert.strictEqual(hd.getAddress()[1], 'royale1q6ur0znmd0ux9tj5h66h9jhpzjv7ahpjhxu8z7z');
    assert.strictEqual(hd.getAddress()[2], 'royale1qjk9php9jn577926wu9sqgnwz9whj2sea68dejp');
    assert.strictEqual(hd._getDerivationPathByAddress(hd.getAddress()[1]), "m/84'/440'/0'/0/1");
    assert.strictEqual(hd._getDerivationPathByAddress(hd.getAddress()[0]), "m/84'/440'/0'/0/0");
    assert.strictEqual(
      hd._getWifForAddress(hd.getAddress()[0]),
      'KwLAKpr3t88u6E6CEQT6Qb2Q9ZJ6RJzoxc4Z2Gx6ALxwgAgaqfEn',
    );
    assert.throws(() => hd._getWifForAddress('royale1qmissingaddress'), /Could not find WIF/);
  });

  it('can create signed Bech32 Segwit HD transactions from offline UTXO fixtures', async () => {
    const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const hd = new HDSegwitBech32Wallet();

    await hd.setSecret(mnemonic);

    const [fundingAddress, changeAddress, sendMaxFundingAddress] = hd.getAddress();
    const recipientAddress = 'royale1qf46hgcx6tl90snxz9uuy0742zpuwsnm2ldam6n';
    const utxos = [
      {
        txid: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        vout: 1,
        value: 20000,
        address: fundingAddress,
      },
    ];

    const { tx, inputs, outputs, fee } = await hd.createTransaction(
      utxos,
      [{ address: recipientAddress, value: 5000 }],
      1,
      changeAddress,
    );

    assert.strictEqual(inputs.length, 1);
    assert.strictEqual(outputs.length, 2);
    assert.strictEqual(tx.ins.length, 1);
    assert.strictEqual(tx.outs.length, 2);
    assert.strictEqual(
      fee,
      inputs.reduce((sum, input) => sum + input.value, 0) - outputs.reduce((sum, output) => sum + output.value, 0),
    );
    assert.deepStrictEqual(
      tx.outs.map(output => bitcoin.address.fromOutputScript(output.script, config.network)),
      [recipientAddress, changeAddress],
    );
    assert.strictEqual(tx.outs[0].value, 5000);
    assert.strictEqual(tx.outs[1].value, outputs[1].value);

    const sendMax = await hd.createTransaction(
      [
        {
          txid: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          vout: 0,
          value: 12000,
          address: fundingAddress,
        },
        {
          txid: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
          vout: 2,
          value: 8000,
          address: sendMaxFundingAddress,
        },
      ],
      [{ address: recipientAddress }],
      1,
      changeAddress,
    );

    assert.strictEqual(sendMax.inputs.length, 2);
    assert.strictEqual(sendMax.outputs.length, 1);
    assert.strictEqual(sendMax.tx.outs.length, 1);
    assert.strictEqual(bitcoin.address.fromOutputScript(sendMax.tx.outs[0].script, config.network), recipientAddress);
    assert.strictEqual(
      sendMax.tx.outs[0].value,
      sendMax.inputs.reduce((sum, input) => sum + input.value, 0) - sendMax.fee,
    );
  });

  it('can generate Legacy HD BIP44 addresses based on xpub', async () => {
    const xpub =
      'xpub6CQdfC3v9gU86eaSn7AhUFcBVxiGhdtYxdC5Cw2vLmFkfth2KXCMmYcPpvZviA89X6DXDs4PJDk5QVL2G2xaVjv7SM4roWHr1gR4xB3Z7Ps';
    const hd = new HDLegacyP2PKHWallet();

    hd._xpub = xpub;
    await hd.generateAddresses();
    assert.strictEqual(hd.getAddress()[0], 'Yd1tx3ziqNa9G5hoMEKdZ7ep9JxMbFefDW');
    assert.strictEqual(hd.getAddress()[1], 'YRWK5bPer6ZDfo42uoicrzdtPSPSHHFAzg');
    assert.strictEqual(hd.getAddress()[2], 'YTeuE3HqGbGKHrtkbZuTqhvmza2drgJaTR');
  });
});
