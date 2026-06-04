import {
  getIosMacValidationCommands,
  getIosMacValidationHandoffErrors,
  iosMacValidationSchemes,
  renderIosMacValidationCommand,
} from './runIosMacValidationHandoff.mjs';

const assert = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

const assertRejected = (label, options, expected) => {
  const errors = getIosMacValidationHandoffErrors(options);

  assert(
    errors.some(error => error.includes(expected)),
    `${label} should reject with "${expected}", got: ${errors.join('; ')}`,
  );
};

const schemes = Object.keys(iosMacValidationSchemes);

assert(schemes.length === 8, `Expected 8 iOS schemes, got ${schemes.length}`);
assert(iosMacValidationSchemes['GoldWallet Dev (Debug)'] === 'Debug', 'GoldWallet Dev debug scheme mapping is missing');
assert(iosMacValidationSchemes['GoldWallet Dev (Release)'] === 'Release', 'GoldWallet Dev release scheme mapping is missing');
assert(iosMacValidationSchemes['GoldWallet Stage (Debug)'] === 'Debug', 'GoldWallet Stage debug scheme mapping is missing');
assert(iosMacValidationSchemes['GoldWallet Stage (Release)'] === 'Release', 'GoldWallet Stage release scheme mapping is missing');
assert(iosMacValidationSchemes['GoldWallet Beta (Debug)'] === 'Debug', 'GoldWallet Beta debug scheme mapping is missing');
assert(iosMacValidationSchemes['GoldWallet Beta (Release)'] === 'Release', 'GoldWallet Beta release scheme mapping is missing');
assert(iosMacValidationSchemes['GoldWallet (Debug)'] === 'Debug', 'GoldWallet prod debug scheme mapping is missing');
assert(iosMacValidationSchemes['GoldWallet (Release)'] === 'Release', 'GoldWallet prod release scheme mapping is missing');

assertRejected(
  'Unknown scheme',
  { scheme: 'GoldWallet Prod (Release)', configuration: 'Release', sdk: 'iphonesimulator' },
  'Unknown iOS shared scheme',
);
assertRejected(
  'Mismatched configuration',
  { scheme: 'GoldWallet Dev (Debug)', configuration: 'Release', sdk: 'iphonesimulator' },
  'must use Debug configuration',
);
assertRejected(
  'Unsupported SDK',
  { scheme: 'GoldWallet Dev (Debug)', configuration: 'Debug', sdk: 'iphoneos' },
  'Unsupported iOS SDK',
);

const commands = getIosMacValidationCommands({
  scheme: 'GoldWallet (Release)',
  configuration: 'Release',
  sdk: 'iphonesimulator',
  preferBundleExecPod: true,
});
const rendered = commands.map(renderIosMacValidationCommand).join('\n');

[
  'corepack yarn ios:mac-validation-prereq:audit',
  'corepack yarn ios:mac-validation-prereq:check-summary',
  'bundle exec pod install',
  'corepack yarn ios:release:readiness:audit',
  'corepack yarn ios:release:readiness:check-summary',
  'xcodebuild',
  'ios/GoldWallet.xcworkspace',
  '"GoldWallet (Release)"',
  '-configuration Release',
  '-sdk iphonesimulator',
  '-derivedDataPath ios/build',
  'CODE_SIGNING_ALLOWED=NO',
  'RN_SRC_EXT=e2e.tsx',
  'CHAMBER_OF_SECRETS=true',
].forEach(expected => {
  assert(rendered.includes(expected), `Expected handoff commands to include: ${expected}`);
});

const releaseReadinessRuns = commands.filter(step => step.args.join(' ').includes('ios:release:readiness:audit')).length;
assert(releaseReadinessRuns === 2, `Expected release readiness audit before and after xcodebuild, got ${releaseReadinessRuns}`);

console.log('iOS macOS validation handoff guard checks are valid.');
