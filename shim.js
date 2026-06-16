import TcpSocket from 'react-native-tcp-socket';

import { connect } from 'app/network/socket';

global.net = TcpSocket;
global.tls = { connect };

if (typeof __dirname === 'undefined') global.__dirname = '/';
if (typeof __filename === 'undefined') global.__filename = '';
if (typeof process === 'undefined') {
  global.process = require('process');
} else {
  const bProcess = require('process');

  for (const p in bProcess) {
    if (!(p in process)) {
      process[p] = bProcess[p];
    }
  }
}

process.browser = false;
if (typeof Buffer === 'undefined') global.Buffer = require('buffer').Buffer;

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(input = '') {
      return Uint8Array.from(Buffer.from(String(input), 'utf8'));
    }
  };
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class TextDecoder {
    decode(input = new Uint8Array()) {
      if (input instanceof ArrayBuffer) {
        return Buffer.from(input).toString('utf8');
      }

      if (ArrayBuffer.isView(input)) {
        return Buffer.from(input.buffer, input.byteOffset, input.byteLength).toString('utf8');
      }

      return Buffer.from(input).toString('utf8');
    }
  };
}
