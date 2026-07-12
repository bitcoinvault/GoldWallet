import { getPlistMajorCompatibilitySummaryErrors } from './plistMajorCompatibilitySummaryGuard.mjs';

const validSummary = [
  'Plist major compatibility audit',
  'Generated at: 2026-07-12T00:00:00.000Z',
  'package.json plist resolution: 3.1.1',
  'package.json simple-plist resolution: 1.3.1',
  'Installed plist version: 3.1.1',
  'Installed simple-plist version: 1.3.1',
  'Installed xcode version: 3.0.1',
  'Current plist parse type: function',
  'Current plist build type: function',
  'Current simple-plist readFileSync type: function',
  'Current xcode project type: function',
  'Current Info.plist parse: ok',
  'Current simple-plist Info.plist read: ok',
  'Current xcode project parse: ok',
  'Current Info.plist display name: GoldWallet',
  'Latest plist version: 5.0.0',
  'Latest plist node engine: >=18',
  'Latest plist package type: module',
  'Latest plist import export present: yes',
  'Latest plist require export present: no',
  'Latest plist forced resolution install status: 0',
  'Latest simple-plist CJS require: failed',
  'Latest simple-plist CJS require error: ERR_PACKAGE_PATH_NOT_EXPORTED',
  'Latest xcode CJS require: failed',
  'Latest xcode CJS require error: ERR_PACKAGE_PATH_NOT_EXPORTED',
  'Latest plist CJS require: failed',
  'Latest plist CJS require error: ERR_PACKAGE_PATH_NOT_EXPORTED',
  'Latest plist ESM import: ok',
  'Latest plist ESM import keys: build,buildBinary,parse,parseBinary,parseOpenStep',
  'Latest plist ESM import parse type: function',
  'Latest plist ESM import build type: function',
  'Latest plist ESM import error: none',
  'Latest plist target blocked: yes',
  'Owner path: react-native-bootsplash > @expo/config-plugins > xcode > simple-plist > plist',
  'Secret values printed: no',
  'Compatibility errors: 0',
  "Required action: keep plist on the CommonJS-compatible 3.1.1 resolution and simple-plist on 1.3.1 until the xcode/simple-plist owner path supports plist 5's ESM/import-only export map.",
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getPlistMajorCompatibilitySummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getPlistMajorCompatibilitySummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid plist major compatibility fixture', validSummary);
assertRejected('Missing header fixture', validSummary.replace('Plist major compatibility audit', 'Bad header'), 'summary header');
assertRejected('Wrong plist resolution fixture', validSummary.replace('package.json plist resolution: 3.1.1', 'package.json plist resolution: 5.0.0'), '3.1.1');
assertRejected(
  'Wrong simple-plist resolution fixture',
  validSummary.replace('package.json simple-plist resolution: 1.3.1', 'package.json simple-plist resolution: 2.0.0'),
  '1.3.1',
);
assertRejected('Wrong current parse fixture', validSummary.replace('Current Info.plist parse: ok', 'Current Info.plist parse: failed'), 'Info.plist parse');
assertRejected('Wrong latest package type fixture', validSummary.replace('Latest plist package type: module', 'Latest plist package type: commonjs'), 'ESM-only');
assertRejected('Require export fixture', validSummary.replace('Latest plist require export present: no', 'Latest plist require export present: yes'), 'require export');
assertRejected('simple-plist require success fixture', validSummary.replace('Latest simple-plist CJS require: failed', 'Latest simple-plist CJS require: ok'), 'simple-plist CJS require');
assertRejected('xcode require success fixture', validSummary.replace('Latest xcode CJS require: failed', 'Latest xcode CJS require: ok'), 'xcode CJS require');
assertRejected('plist require success fixture', validSummary.replace('Latest plist CJS require: failed', 'Latest plist CJS require: ok'), 'plist CJS require');
assertRejected('ESM import failure fixture', validSummary.replace('Latest plist ESM import: ok', 'Latest plist ESM import: failed'), 'ESM import must work');
assertRejected('Unblocked latest fixture', validSummary.replace('Latest plist target blocked: yes', 'Latest plist target blocked: no'), 'must stay blocked');
assertRejected('Wrong owner path fixture', validSummary.replace('xcode > simple-plist > plist', 'other > plist'), 'Owner path');

console.log('Plist major compatibility summary guard checks are valid.');
