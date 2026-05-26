import { LegacyWallet, SegwitP2SHWallet } from '../../class';

jest.mock('../../BlueElectrum', () => ({
  getDustValue: jest.fn().mockResolvedValue(546),
}));

const assert = require('assert');

global.crypto = require('crypto'); // shall be used by tests under nodejs CLI, but not in RN environment

describe('wallet core offline flows', () => {
  describe('LegacyWallet', () => {
    it('serialize and unserialize work correctly', () => {
      const a = new LegacyWallet();

      a.setLabel('my1');
      const key = JSON.stringify(a);
      const b = LegacyWallet.fromJson(key);

      assert.strictEqual(key, JSON.stringify(b));
    });

    it('can validate addresses', () => {
      const w = new LegacyWallet();

      assert.ok(w.isAddressValid('YRMDysNqxPQiHee3NodziKKsHhRvysur63'));
      assert.ok(!w.isAddressValid('YRMDysNqxPQiHee3NodziKKsHhRvysur64'));
      assert.ok(!w.isAddressValid('3BDsBDxDimYgNZzsqszNZobqQq3yeUoJf2'));
      assert.ok(w.isAddressValid('RPuRPTc9o6DMLsESyhDSkPoinH4JX1RG26'));
      assert.ok(!w.isAddressValid('RPuRPTc9o6DMLsESyhDSkPoinH4JX1RG24'));
      assert.ok(!w.isAddressValid('12345'));
    });
  });

  it('SegwitP2SHWallet can generate segwit P2SH address from WIF', async () => {
    const wallet = new SegwitP2SHWallet();

    wallet.setSecret('Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct');
    assert.strictEqual(wallet.getAddress(), 'RBkrVH6nanQxjQ6n99nPHXcvY73u3jBLdU');
    assert.strictEqual(wallet.getAddress(), await wallet.getAddressAsync());
  });
});
