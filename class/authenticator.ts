import { generatePrivateKey, privateKeyToPublicKey } from '../utils/crypto';

const i18n = require('../loc');

const ENCODING = 'hex';
const PIN_LENGTH = 4;

export class Authenticator {
  private privateKey: Buffer | null;
  private publicKey: string;

  constructor(readonly name?: string) {
    this.privateKey = null;
    this.publicKey = '';
  }

  static fromJson(json: string) {
    const data = JSON.parse(json);
    const { privateKey } = data;
    const parsedPrivateKey = Buffer.from(privateKey.data, ENCODING);
    const authenticator = new this();
    for (const key of Object.keys(data)) {
      authenticator[key] = data[key];
    }

    authenticator.privateKey = parsedPrivateKey;

    return authenticator;
  }

  async init(entropy: string) {
    const buffer = Buffer.from(entropy, ENCODING);
    try {
      this.privateKey = await generatePrivateKey({
        salt: buffer,
        password: buffer,
      });
      this.publicKey = privateKeyToPublicKey(this.privateKey);
    } catch (_) {
      throw new Error(i18n.wallets.errors.invalidPrivateKey);
    }
  }

  getPin() {
    return this.publicKey.slice(-PIN_LENGTH);
  }
}
