import { getRnNodeifyShimErrors, requiredRnNodeifyShims } from './rnNodeifyShimGuard.mjs';

const validContents = new Map(
  requiredRnNodeifyShims.map(({ file, marker }) => [file, `module.exports = global.StreamModule || require('stream'); // ${marker}`]),
);

const missingContents = new Map(validContents);
missingContents.delete(requiredRnNodeifyShims[0].file);

const missingMarkerContents = new Map(validContents);
missingMarkerContents.set(requiredRnNodeifyShims[1].file, "module.exports = require('stream');");

const assertAccepted = (label, contents) => {
  const errors = getRnNodeifyShimErrors(contents);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, contents) => {
  const errors = getRnNodeifyShimErrors(contents);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Known rn-nodeify shim markers', validContents);
assertRejected('Missing rn-nodeify shim file', missingContents);
assertRejected('Missing rn-nodeify shim marker', missingMarkerContents);

console.log('React Native node polyfill shim guard checks are valid.');
