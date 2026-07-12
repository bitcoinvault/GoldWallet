import {
  getIosMacValidationCommands,
  getIosMacValidationHandoffErrors,
  getIosMacValidationPreflightCommands,
  getIosMacValidationPreflightReadinessErrors,
  getIosMacValidationReadinessErrors,
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
assertRejected(
  'All schemes with explicit scheme',
  {
    allSchemes: true,
    scheme: 'GoldWallet Dev (Debug)',
    schemeProvided: true,
    configuration: null,
    configurationProvided: false,
    sdk: 'iphonesimulator',
  },
  '--all-schemes cannot be combined with --scheme',
);
assertRejected(
  'All schemes with explicit configuration',
  {
    allSchemes: true,
    scheme: null,
    schemeProvided: false,
    configuration: 'Debug',
    configurationProvided: true,
    sdk: 'iphonesimulator',
  },
  '--all-schemes cannot be combined with --configuration',
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

const allSchemeCommands = getIosMacValidationCommands({
  allSchemes: true,
  sdk: 'iphonesimulator',
  preferBundleExecPod: true,
});
const allSchemeRendered = allSchemeCommands.map(renderIosMacValidationCommand).join('\n');
const allSchemeBuilds = allSchemeCommands.filter(step => step.command === 'xcodebuild');

assert(allSchemeBuilds.length === schemes.length, `Expected ${schemes.length} all-scheme xcodebuild commands, got ${allSchemeBuilds.length}`);
schemes.forEach(scheme => {
  const build = allSchemeBuilds.find(step => step.args.includes(scheme));
  const configuration = iosMacValidationSchemes[scheme];

  assert(build, `All-schemes handoff must include ${scheme}`);
  assert(build.args.includes(configuration), `All-schemes handoff must use ${configuration} for ${scheme}`);
});
assert(
  allSchemeCommands.filter(step => step.args.join(' ').includes('pod install')).length === 1,
  'All-schemes handoff must run pod install once before all scheme builds',
);
assert(
  allSchemeCommands[0].args.join(' ').includes('ios:mac-validation-prereq:audit'),
  'All-schemes handoff must start with macOS prerequisite audit',
);
assert(
  allSchemeCommands[allSchemeCommands.length - 1].args.join(' ').includes('ios:release:readiness:check-summary'),
  'All-schemes handoff must end with iOS release readiness summary validation',
);

const preflightCommands = getIosMacValidationPreflightCommands({
  scheme: 'GoldWallet (Release)',
  schemeProvided: true,
  configuration: 'Release',
  configurationProvided: true,
  sdk: 'iphonesimulator',
});
const preflightRendered = preflightCommands.map(renderIosMacValidationCommand).join('\n');

[
  'corepack yarn ios:release:readiness:audit',
  'corepack yarn ios:release:readiness:check-summary',
  'corepack yarn ios:mac-validation-prereq:audit',
  'corepack yarn ios:mac-validation-prereq:check-summary',
  'corepack yarn check:ios-podfile-refresh-plan-guard',
  'corepack yarn ios:podfile-refresh:plan',
  'corepack yarn ios:podfile-refresh:check-plan',
  'corepack yarn check:ios-validation-handoff-summary-guard',
  'corepack yarn ios:validation:handoff-summary',
  'corepack yarn ios:validation:handoff-summary:check',
  'corepack yarn ios:mac-validation:handoff:dry-run --scheme "GoldWallet (Release)" --configuration Release',
].forEach(expected => {
  assert(preflightRendered.includes(expected), `Expected preflight commands to include: ${expected}`);
});
assert(
  !preflightCommands.some(step => step.command === 'xcodebuild'),
  'iOS preflight handoff must not execute xcodebuild',
);
assert(
  !preflightCommands.some(step => step.command === 'pod' || step.args.join(' ') === 'exec pod install'),
  'iOS preflight handoff must not execute pod install',
);
assert(
  preflightCommands.findIndex(step => step.args.includes('check:ios-validation-handoff-summary-guard')) >
    preflightCommands.findIndex(step => step.args.includes('ios:podfile-refresh:check-plan')),
  'iOS validation handoff summary guard must run after the Podfile refresh plan is validated',
);
assert(
  preflightCommands.findIndex(step => step.args.includes('check:ios-validation-handoff-summary-guard')) <
    preflightCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary')),
  'iOS validation handoff summary guard must run before the summary is generated',
);
assert(
  preflightCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary')) <
    preflightCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary:check')),
  'iOS validation handoff summary must be checked after it is generated',
);
assert(
  preflightCommands.findIndex(step => step.args.includes('ios:validation:handoff-summary:check')) <
    preflightCommands.findIndex(step => step.args.includes('ios:mac-validation:handoff:dry-run')),
  'iOS macOS handoff dry-run must render after the generated iOS validation handoff summary is checked',
);

const readyPrereqSummary = [
  'iOS macOS validation prerequisites audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Platform: darwin',
  'Ready for macOS pod/archive validation: yes',
  'xcodebuild available: yes',
  'xcodebuild version: Xcode 16.1; Build version 16B40',
  'React Native minimum Xcode: 16.1',
  'pod available: yes',
  'bundle exec pod available: no',
  'Podfile.lock refresh required: no',
  'Podfile.lock drift issues: 0',
  'iOS runtime delivery validation: not claimed',
  'Blockers: 0',
  'Required action: run pod install, then iOS archive/simulator validation on macOS before claiming iOS runtime delivery.',
  '',
].join('\n');

const blockedPrereqSummary = readyPrereqSummary
  .replace('Platform: darwin', 'Platform: win32')
  .replace('Ready for macOS pod/archive validation: yes', 'Ready for macOS pod/archive validation: no')
  .replace('xcodebuild available: yes', 'xcodebuild available: no')
  .replace('xcodebuild version: Xcode 16.1; Build version 16B40', 'xcodebuild version: <not available>')
  .replace('pod available: yes', 'pod available: no')
  .replace('Podfile.lock refresh required: no', 'Podfile.lock refresh required: yes')
  .replace('Podfile.lock drift issues: 0', 'Podfile.lock drift issues: 1')
  .replace('Blockers: 0', 'Blockers: 1\n- Current platform is win32; iOS archive/simulator validation requires macOS with Xcode.')
  .replace(
    'Required action: run pod install, then iOS archive/simulator validation on macOS before claiming iOS runtime delivery.',
    'Required action: run this prerequisite audit on macOS with Xcode and CocoaPods, refresh ios/Podfile.lock with pod install, then run iOS archive/simulator validation before claiming iOS runtime delivery.',
  );

const readyReleaseSummary = [
  'iOS release static readiness audit',
  'Generated at: 2026-06-10T00:00:00.000Z',
  'Static iOS release files valid: yes',
  'Ready for macOS archive validation: yes',
  'React Native version: 0.86.0',
  'React Native minimum iOS: 15.1',
  'React Native minimum Xcode: 16.1',
  'Podfile iOS platform: 15.1',
  'Xcode deployment targets: 15.1',
  'Guarded iOS schemes: 8',
  'iOS Sentry bundle/source-map phases: 4',
  'iOS Sentry dSYM upload phases: 3',
  'iOS CodePush plist placeholders: 0',
  'iOS remote-notification plists: 4',
  'Podfile.lock refresh required: no',
  'Removed Podfile.lock pod references: 0',
  'Podfile.lock drift issues: 0',
  'xcodebuild version: Xcode 16.1; Build version 16B40',
  'iOS runtime delivery validation: not claimed',
  'Errors: 0',
  'Warnings: 0',
  'Required action: run pod install and iOS archive/simulator validation on macOS before claiming iOS runtime delivery.',
  '',
].join('\n');

const blockedReleaseSummary = readyReleaseSummary
  .replace('Ready for macOS archive validation: yes', 'Ready for macOS archive validation: no')
  .replace('Podfile.lock refresh required: no', 'Podfile.lock refresh required: yes')
  .replace('Podfile.lock drift issues: 0', 'Podfile.lock drift issues: 1\n- ios/Podfile.lock has React-Core 0.65.3; package.json has react-native 0.86.0')
  .replace('xcodebuild version: Xcode 16.1; Build version 16B40', 'xcodebuild version: <not available on this machine>')
  .replace('Warnings: 0', 'Warnings: 1\n- iOS compile/archive validation is blocked on this machine: xcodebuild requires macOS with Xcode.')
  .replace(
    'Required action: run pod install and iOS archive/simulator validation on macOS before claiming iOS runtime delivery.',
    'Required action: refresh ios/Podfile.lock with pod install on macOS, then run iOS archive/simulator validation before claiming iOS runtime delivery.',
  );

assert(
  getIosMacValidationReadinessErrors({
    releaseReadinessSummaryText: readyReleaseSummary,
    macValidationPrereqSummaryText: readyPrereqSummary,
  }).length === 0,
  'Ready iOS macOS validation handoff summaries must pass readiness checks',
);
assert(
  getIosMacValidationReadinessErrors({
    releaseReadinessSummaryText: readyReleaseSummary,
    macValidationPrereqSummaryText: blockedPrereqSummary,
  }).some(error => error.includes('prerequisites are not ready')),
  'iOS macOS validation handoff must reject blocked prerequisite summaries',
);
assert(
  getIosMacValidationReadinessErrors({
    releaseReadinessSummaryText: readyReleaseSummary,
    macValidationPrereqSummaryText: readyPrereqSummary.replace('Platform: darwin', 'Platform: win32'),
  }).some(error => error.includes('Ready summary must be produced on darwin')),
  'iOS macOS validation handoff must reject ready prerequisite summaries from non-macOS platforms',
);
assert(
  getIosMacValidationReadinessErrors({
    releaseReadinessSummaryText: readyReleaseSummary,
    macValidationPrereqSummaryText: readyPrereqSummary.replace('pod available: yes', 'pod available: no'),
  }).some(error => error.includes('CocoaPods available')),
  'iOS macOS validation handoff must reject ready prerequisite summaries without CocoaPods',
);
assert(
  getIosMacValidationReadinessErrors({
    releaseReadinessSummaryText: blockedReleaseSummary,
    macValidationPrereqSummaryText: readyPrereqSummary,
  }).some(error => error.includes('not ready for macOS archive validation')),
  'iOS macOS validation handoff must reject blocked release readiness summaries',
);
assert(
  getIosMacValidationReadinessErrors({
    releaseReadinessSummaryText: '',
    macValidationPrereqSummaryText: readyPrereqSummary,
  }).some(error => error.includes('iOS release readiness summary is missing')),
  'iOS macOS validation handoff must report missing release readiness summary',
);
assert(
  getIosMacValidationPreflightReadinessErrors({
    releaseReadinessSummaryText: readyReleaseSummary,
    macValidationPrereqSummaryText: blockedPrereqSummary,
  }).length === 0,
  'iOS preflight handoff must accept valid static summaries even when macOS archive validation remains blocked',
);
assert(
  getIosMacValidationPreflightReadinessErrors({
    releaseReadinessSummaryText: readyReleaseSummary.replace('iOS runtime delivery validation: not claimed', 'iOS runtime delivery validation: passed'),
    macValidationPrereqSummaryText: blockedPrereqSummary,
  }).some(error => error.includes('runtime delivery')),
  'iOS preflight handoff must reject claimed runtime validation',
);
assert(
  getIosMacValidationPreflightReadinessErrors({
    releaseReadinessSummaryText: '',
    macValidationPrereqSummaryText: blockedPrereqSummary,
  }).some(error => error.includes('iOS release readiness summary is missing')),
  'iOS preflight handoff must report missing release readiness summary',
);

console.log('iOS macOS validation handoff guard checks are valid.');
