const BUFFER_SIGN_COMPAT = Symbol.for('goldwallet.bitcoinjs.buffer-sign-compat');

const normalizeBufferProperty = (keyPair, propertyName) => {
  const value = keyPair[propertyName];

  if (!value || Buffer.isBuffer(value)) {
    return;
  }

  Object.defineProperty(keyPair, propertyName, {
    configurable: true,
    writable: true,
    value: Buffer.from(value),
  });
};

export const normalizeECPairSignatures = keyPair => {
  if (!keyPair) {
    return keyPair;
  }

  normalizeBufferProperty(keyPair, 'publicKey');
  normalizeBufferProperty(keyPair, 'privateKey');

  if (typeof keyPair.sign !== 'function' || keyPair[BUFFER_SIGN_COMPAT]) {
    return keyPair;
  }

  const sign = keyPair.sign.bind(keyPair);

  Object.defineProperty(keyPair, 'sign', {
    configurable: true,
    writable: true,
    value: (...args) => {
      const signature = sign(...args);

      return Buffer.isBuffer(signature) ? signature : Buffer.from(signature);
    },
  });

  Object.defineProperty(keyPair, BUFFER_SIGN_COMPAT, {
    value: true,
  });

  return keyPair;
};
