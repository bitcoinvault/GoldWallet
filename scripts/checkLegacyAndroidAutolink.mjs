import { createRequire } from 'module';
import { getLegacyAndroidAutolinkErrors } from './legacyAndroidAutolinkGuard.mjs';

const require = createRequire(import.meta.url);
const reactNativeConfig = require('../react-native.config.js');

const errors = getLegacyAndroidAutolinkErrors(reactNativeConfig.dependencies);

if (errors.length > 0) {
console.error('Legacy Android autolink guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Legacy Android autolinking remains enabled for wallet-critical native prompt modules and rejects unexpected disabled Android autolink entries.');
