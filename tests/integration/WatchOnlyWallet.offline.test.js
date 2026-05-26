import { WatchOnlyWallet } from '../../class';

jest.mock('../../BlueElectrum', () => ({
  getDustValue: jest.fn().mockResolvedValue(546),
}));

const assert = require('assert');

describe('Watch only wallet offline flows', () => {
  it('can validate address', async () => {
    const w = new WatchOnlyWallet();

    w.setSecret('12eQ9m4sgAwTSQoNXkRABKhCXCsjm2jdVG');
    assert.ok(!w.valid());
    w.setSecret('YRMrqNUKAfA2bQ7RmSz1hLYCeGAtci8NkT');
    assert.ok(w.valid());
    w.setSecret('not valid');
    assert.ok(!w.valid());

    w.setSecret(
      'xpub6CQdfC3v9gU86eaSn7AhUFcBVxiGhdtYxdC5Cw2vLmFkfth2KXCMmYcPpvZviA89X6DXDs4PJDk5QVL2G2xaVjv7SM4roWHr1gR4xB3Z7Ps',
    );
    assert.ok(w.valid());
    w.setSecret(
      'ypub6XRzrn3HB1tjhhvrHbk1vnXCecZEdXohGzCk3GXwwbDoJ3VBzZ34jNGWbC6WrS7idXrYjjXEzcPDX5VqnHEnuNf5VAXgLfSaytMkJ2rwVqy',
    );
    assert.ok(w.valid());
    w.setSecret(
      'zpub6r7jhKKm7BAVx3b3nSnuadY1WnshZYkhK8gKFoRLwK9rF3Mzv28BrGcCGA3ugGtawi1WLb2vyjQAX9ZTDGU5gNk2bLdTc3iEXr6tzR1ipNP',
    );
    assert.ok(w.valid());
  });

  it('can create PSBT base64 without signature for HW wallet', async () => {
    const w = new WatchOnlyWallet();

    await w.setSecret(
      'zpub6rjLjQVqVnj7crz9E4QWj4WgczmEseJq22u2B6k2HZr6NE2PQx3ZYg8BnbjN9kCfHymSeMd2EpwpM5iiz5Nrb3TzvddxW2RMcE3VXdVaXHk',
    );
    await w.init();
    const changeAddress = 'royale1qtts2q4ysaegjd9alctcahsywpl7882xna36tnx';
    const utxos = [
      {
        height: 596736,
        value: 20000,
        address: 'royale1qldu625d6lpv5teemlq5pe7mp4kleef5fy82ler',
        txid: '7f3b9e032a84413d7a5027b0d020f8acf80ad28f68b5bce8fa8ac357248c5b80',
        vout: 0,
      },
    ];

    const { psbt } = await w.createTransaction(
      utxos,
      [{ address: 'royale1qcr4fdqnk5a7zhqv9vc9lzqszxc8c348kn8wyv8', value: 5000 }],
      1,
      changeAddress,
    );

    assert.strictEqual(
      psbt.toBase64(),
      'cHNidP8BAHECAAAAAYBbjCRXw4r66Ly1aI/SCvis+CDQsCdQej1BhCoDnjt/AAAAAAAAAACAAogTAAAAAAAAFgAUwOqWgnanfCuBhWYL8QICNg+I1Pa3OQAAAAAAABYAFFrgoFSQ7lEml7/C8dvAjg/8c6jTAAAAAAABAR8gTgAAAAAAABYAFPt5pVG6+FlF5zv4KBz7Ya2/nKaJIgYDr0JrWaMPRB41wzS5U3ws/41GnUBDZbJoZmZ2JfI/vecYAAAAAFQAAIC4AQCAAAAAgAAAAAABAAAAAAAiAgPTzRhf8aBoEP5xvDSc8h0P9AOyKY6sfDQ7d0mWutAT0RgAAAAAVAAAgLgBAIAAAACAAAAAAAwAAAAA',
    );
  });

  it('can combine signed PSBT and prepare it for broadcast', async () => {
    const w = new WatchOnlyWallet();

    await w.setSecret(
      'zpub6rjLjQVqVnj7crz9E4QWj4WgczmEseJq22u2B6k2HZr6NE2PQx3ZYg8BnbjN9kCfHymSeMd2EpwpM5iiz5Nrb3TzvddxW2RMcE3VXdVaXHk',
    );
    await w.init();
    const signedPsbt =
      'cHNidP8BAHECAAAAAYBbjCRXw4r66Ly1aI/SCvis+CDQsCdQej1BhCoDnjt/AAAAAAAAAACAAogTAAAAAAAAFgAUwM681sPTyox13F7GLr5VMw75EOK3OQAAAAAAABYAFOc6kh7rlKStRwwMvbaeu+oFvB4MAAAAAAAiAgNY4ds4TcPgqK6hHuQe2ZO0VnspdAH7zNvnVAAssnFPH0cwRAIgPR9zZzNTnfPqZJifyUwdM2cWW8PZqCnSCsfCePlZ2aoCIFbhr/5P/bS6eGQZtX3+6q+nUO6KaSKYgaaZrUZENF6BAQAAAA==';
    const unsignedPsbt =
      'cHNidP8BAHECAAAAAYBbjCRXw4r66Ly1aI/SCvis+CDQsCdQej1BhCoDnjt/AAAAAAAAAACAAogTAAAAAAAAFgAUwM681sPTyox13F7GLr5VMw75EOK3OQAAAAAAABYAFOc6kh7rlKStRwwMvbaeu+oFvB4MAAAAAAABAR8gTgAAAAAAABYAFL8PIBBJ6JHVhwsE61MPwWtjtptAIgYDWOHbOE3D4KiuoR7kHtmTtFZ7KXQB+8zb51QALLJxTx8YAAAAAFQAAIAAAACAAAAAgAAAAAAAAAAAAAAiAgM005BVD8MgH5kiSGnwXSfzaxLeDSl3y17Vhrx3F/9XxBgAAAAAVAAAgAAAAIAAAACAAQAAAAAAAAAA';

    const Tx = w.combinePsbt(unsignedPsbt, signedPsbt);

    assert.strictEqual(
      Tx.toHex(),
      '02000000000101805b8c2457c38afae8bcb5688fd20af8acf820d0b027507a3d41842a039e3b7f000000000000000080028813000000000000160014c0cebcd6c3d3ca8c75dc5ec62ebe55330ef910e2b739000000000000160014e73a921eeb94a4ad470c0cbdb69ebbea05bc1e0c0247304402203d1f736733539df3ea64989fc94c1d3367165bc3d9a829d20ac7c278f959d9aa022056e1affe4ffdb4ba786419b57dfeeaafa750ee8a69229881a699ad4644345e8101210358e1db384dc3e0a8aea11ee41ed993b4567b297401fbccdbe754002cb2714f1f00000000',
    );
  });
});
