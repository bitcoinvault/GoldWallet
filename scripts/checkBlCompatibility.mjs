import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const expectedBlVersion = '6.1.6';
const requiredCommonJsConsumers = ['levelup', 'ora'];
const errors = [];

let blPackage;

try {
  blPackage = require('bl/package.json');
} catch (error) {
  errors.push(`Unable to resolve bl/package.json: ${error.code || error.message}`);
}

if (blPackage && blPackage.version !== expectedBlVersion) {
  errors.push(`bl version is ${blPackage.version}; expected ${expectedBlVersion}`);
}

try {
  const bl = require('bl');

  if (typeof bl !== 'function') {
    errors.push(`require('bl') returned ${typeof bl}; expected function`);
  }
} catch (error) {
  errors.push(`require('bl') failed: ${error.code || error.message}`);
}

requiredCommonJsConsumers.forEach(packageName => {
  try {
    require(packageName);
  } catch (error) {
    errors.push(`require('${packageName}') failed: ${error.code || error.message}`);
  }
});

if (errors.length > 0) {
  console.error('BL compatibility check failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`BL compatibility check passed for bl@${expectedBlVersion}.`);
