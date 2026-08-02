import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';
import { getIosMacValidationPrereqSummaryErrors } from './iosMacValidationPrereqSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iosReleaseReadinessSummaryPath = path.join(root, 'local-docs', 'ios-release-static-readiness-summary.txt');
const iosMacValidationPrereqSummaryPath = path.join(root, 'local-docs', 'ios-mac-validation-prereqs-summary.txt');

export const iosMacValidationSchemes = {
  'GoldWallet Dev (Debug)': 'Debug',
  'GoldWallet Dev (Release)': 'Release',
  'GoldWallet Stage (Debug)': 'Debug',
  'GoldWallet Stage (Release)': 'Release',
  'GoldWallet Beta (Debug)': 'Debug',
  'GoldWallet Beta (Release)': 'Release',
  'GoldWallet (Debug)': 'Debug',
  'GoldWallet (Release)': 'Release',
};

const defaultOptions = {
  dryRun: false,
  preflightOnly: false,
  scheme: 'GoldWallet Dev (Debug)',
  configuration: null,
  sdk: 'iphonesimulator',
  preferBundleExecPod: null,
  allSchemes: false,
  schemeProvided: false,
  configurationProvided: false,
};

const usage = [
  'Usage: node scripts/runIosMacValidationHandoff.mjs [--dry-run] [--preflight-only] [--all-schemes | --scheme "<shared scheme>"] [--configuration Debug|Release] [--sdk iphonesimulator]',
  '',
  'Examples:',
  '  node scripts/runIosMacValidationHandoff.mjs --dry-run',
  '  node scripts/runIosMacValidationHandoff.mjs --preflight-only',
  '  node scripts/runIosMacValidationHandoff.mjs --dry-run --all-schemes',
  '  node scripts/runIosMacValidationHandoff.mjs --scheme "GoldWallet (Release)" --configuration Release',
].join('\n');

const getSpawnInvocation = step => {
  if (process.platform !== 'win32') {
    return { command: step.command, args: step.args };
  }

  return { command: 'cmd.exe', args: ['/d', '/s', '/c', step.command, ...step.args] };
};

const quoteArg = arg => {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
};

export const renderIosMacValidationCommand = step => {
  const command = [step.command, ...step.args].map(quoteArg).join(' ');
  const cwd = step.cwd === root ? '.' : path.relative(root, step.cwd).replace(/\\/g, '/');
  const env = step.env ? Object.entries(step.env).map(([key, value]) => `${key}=${value}`).join(' ') : null;

  return [`cwd=${cwd}`, env, command].filter(Boolean).join(' ');
};

export const getIosMacValidationHandoffErrors = options => {
  const scheme = options.scheme || defaultOptions.scheme;
  const expectedConfiguration = iosMacValidationSchemes[scheme];
  const configuration = options.configuration || expectedConfiguration;
  const sdk = options.sdk || defaultOptions.sdk;
  const errors = [];

  if (options.allSchemes && options.schemeProvided) {
    errors.push('--all-schemes cannot be combined with --scheme');
  }

  if (options.allSchemes && options.configurationProvided) {
    errors.push('--all-schemes cannot be combined with --configuration');
  }

  if (!expectedConfiguration) {
    errors.push(`Unknown iOS shared scheme: ${scheme}`);
  }

  if (expectedConfiguration && configuration !== expectedConfiguration) {
    errors.push(`${scheme} must use ${expectedConfiguration} configuration, got ${configuration}`);
  }

  if (!['Debug', 'Release'].includes(configuration)) {
    errors.push(`Unsupported iOS configuration: ${configuration}`);
  }

  if (sdk !== 'iphonesimulator') {
    errors.push(`Unsupported iOS SDK for this handoff: ${sdk}`);
  }

  return errors;
};

const readSummary = summaryPath => {
  if (!existsSync(summaryPath)) {
    return null;
  }

  return readFileSync(summaryPath, 'utf8');
};

const requireSummaryLine = (errors, summaryText, snippet, message) => {
  if (!summaryText.includes(snippet)) {
    errors.push(message);
  }
};

const yarnStep = (label, script, scriptArgs = []) => ({
  label,
  command: 'corepack',
  args: ['yarn', script, ...scriptArgs],
  cwd: root,
});

export const getIosMacValidationReadinessErrors = ({
  releaseReadinessSummaryText,
  macValidationPrereqSummaryText,
}) => {
  const errors = [];

  if (!macValidationPrereqSummaryText) {
    errors.push('iOS macOS validation prerequisite summary is missing; run ios:mac-validation-prereq:audit first');
  } else {
    const prereqSummaryErrors = getIosMacValidationPrereqSummaryErrors(macValidationPrereqSummaryText);
    prereqSummaryErrors.forEach(error => errors.push(`iOS macOS validation prerequisite summary is invalid: ${error}`));
    requireSummaryLine(
      errors,
      macValidationPrereqSummaryText,
      'Ready for macOS pod/archive validation: yes',
      'iOS macOS validation prerequisites are not ready for pod/archive validation',
    );
    requireSummaryLine(errors, macValidationPrereqSummaryText, 'xcodebuild available: yes', 'iOS handoff requires xcodebuild availability');
    requireSummaryLine(errors, macValidationPrereqSummaryText, 'Podfile.lock refresh required: no', 'iOS handoff requires refreshed Podfile.lock evidence');
    requireSummaryLine(errors, macValidationPrereqSummaryText, 'Podfile.lock drift issues: 0', 'iOS handoff requires zero Podfile.lock drift issues');
    requireSummaryLine(
      errors,
      macValidationPrereqSummaryText,
      'iOS runtime delivery validation: not claimed',
      'iOS handoff must keep runtime delivery unclaimed until explicit simulator/device validation evidence is reviewed',
    );
  }

  if (!releaseReadinessSummaryText) {
    errors.push('iOS release readiness summary is missing; run ios:release:readiness:audit first');
  } else {
    const releaseSummaryErrors = getIosReleaseReadinessSummaryErrors(releaseReadinessSummaryText);
    releaseSummaryErrors.forEach(error => errors.push(`iOS release readiness summary is invalid: ${error}`));
    requireSummaryLine(
      errors,
      releaseReadinessSummaryText,
      'Ready for macOS archive validation: yes',
      'iOS release readiness summary is not ready for macOS archive validation',
    );
    requireSummaryLine(errors, releaseReadinessSummaryText, 'Podfile.lock refresh required: no', 'iOS release readiness requires refreshed Podfile.lock evidence');
    requireSummaryLine(errors, releaseReadinessSummaryText, 'Podfile.lock drift issues: 0', 'iOS release readiness requires zero Podfile.lock drift issues');
    requireSummaryLine(
      errors,
      releaseReadinessSummaryText,
      'iOS runtime delivery validation: not claimed',
      'iOS release readiness must keep runtime delivery unclaimed until explicit simulator/device validation evidence is reviewed',
    );
  }

  return errors;
};

const getIosBuildTargets = options => {
  if (options.allSchemes) {
    return Object.entries(iosMacValidationSchemes).map(([scheme, configuration]) => ({ scheme, configuration }));
  }

  const scheme = options.scheme || defaultOptions.scheme;
  const configuration = options.configuration || iosMacValidationSchemes[scheme];
  return [{ scheme, configuration }];
};

const getDryRunArgsForOptions = options => {
  if (options.allSchemes) {
    return ['--all-schemes'];
  }

  const args = [];

  if (options.schemeProvided && options.scheme) {
    args.push('--scheme', options.scheme);
  }

  if (options.configurationProvided && options.configuration) {
    args.push('--configuration', options.configuration);
  }

  if (options.sdk && options.sdk !== defaultOptions.sdk) {
    args.push('--sdk', options.sdk);
  }

  return args;
};

export const getIosMacValidationPreflightCommands = options => [
  yarnStep('Audit static iOS release readiness', 'ios:release:readiness:audit'),
  yarnStep('Validate static iOS release readiness summary', 'ios:release:readiness:check-summary'),
  yarnStep('Audit iOS macOS validation prerequisites', 'ios:mac-validation-prereq:audit'),
  yarnStep('Validate iOS macOS validation prerequisite summary', 'ios:mac-validation-prereq:check-summary'),
  yarnStep('Validate iOS Podfile refresh plan guard', 'check:ios-podfile-refresh-plan-guard'),
  yarnStep('Refresh iOS Podfile refresh plan', 'ios:podfile-refresh:plan'),
  yarnStep('Validate iOS Podfile refresh plan', 'ios:podfile-refresh:check-plan'),
  yarnStep('Validate iOS validation handoff summary guard', 'check:ios-validation-handoff-summary-guard'),
  yarnStep('Refresh iOS validation handoff summary', 'ios:validation:handoff-summary'),
  yarnStep('Validate iOS validation handoff summary artifact', 'ios:validation:handoff-summary:check'),
  yarnStep('Render macOS validation handoff dry run', 'ios:mac-validation:handoff:dry-run', getDryRunArgsForOptions(options)),
];

export const getIosMacValidationPreflightReadinessErrors = ({
  releaseReadinessSummaryText,
  macValidationPrereqSummaryText,
}) => {
  const errors = [];

  if (!releaseReadinessSummaryText) {
    errors.push('iOS release readiness summary is missing; run ios:release:readiness:audit first');
  } else {
    const releaseSummaryErrors = getIosReleaseReadinessSummaryErrors(releaseReadinessSummaryText);
    releaseSummaryErrors.forEach(error => errors.push(`iOS release readiness summary is invalid: ${error}`));
    requireSummaryLine(
      errors,
      releaseReadinessSummaryText,
      'Static iOS release files valid: yes',
      'iOS static release files are not ready for preflight handoff',
    );
    requireSummaryLine(
      errors,
      releaseReadinessSummaryText,
      'iOS runtime delivery validation: not claimed',
      'iOS preflight must keep runtime delivery unclaimed until macOS simulator/device evidence exists',
    );
  }

  if (!macValidationPrereqSummaryText) {
    errors.push('iOS macOS validation prerequisite summary is missing; run ios:mac-validation-prereq:audit first');
  } else {
    const prereqSummaryErrors = getIosMacValidationPrereqSummaryErrors(macValidationPrereqSummaryText);
    prereqSummaryErrors.forEach(error => errors.push(`iOS macOS validation prerequisite summary is invalid: ${error}`));
    requireSummaryLine(
      errors,
      macValidationPrereqSummaryText,
      'iOS runtime delivery validation: not claimed',
      'iOS preflight must keep runtime delivery unclaimed until macOS simulator/device evidence exists',
    );
  }

  return errors;
};

export const getIosMacValidationCommands = options => {
  const sdk = options.sdk || defaultOptions.sdk;
  const preferBundleExecPod =
    options.preferBundleExecPod ??
    (existsSync(path.join(root, 'Gemfile')) || existsSync(path.join(root, 'ios', 'Gemfile')));
  const podInstall = preferBundleExecPod
    ? { command: 'bundle', args: ['exec', 'pod', 'install'], cwd: path.join(root, 'ios') }
    : { command: 'pod', args: ['install'], cwd: path.join(root, 'ios') };
  const rubySetup = preferBundleExecPod
    ? [{ label: 'Install locked Ruby dependencies', command: 'bundle', args: ['install'], cwd: root }]
    : [];
  const buildTargets = getIosBuildTargets(options);

  return [
    ...rubySetup,
    { label: 'Audit macOS/Xcode/CocoaPods prerequisites', command: 'corepack', args: ['yarn', 'ios:mac-validation-prereq:audit'], cwd: root },
    { label: 'Validate macOS prerequisite summary', command: 'corepack', args: ['yarn', 'ios:mac-validation-prereq:check-summary'], cwd: root },
    { label: 'Refresh iOS pods', ...podInstall },
    { label: 'Audit iOS release readiness after pod refresh', command: 'corepack', args: ['yarn', 'ios:release:readiness:audit'], cwd: root },
    { label: 'Validate iOS release readiness summary', command: 'corepack', args: ['yarn', 'ios:release:readiness:check-summary'], cwd: root },
    ...buildTargets.map(({ scheme, configuration }) => ({
      label: `Build ${scheme} on simulator`,
      command: 'xcodebuild',
      args: [
        '-workspace',
        'ios/GoldWallet.xcworkspace',
        '-scheme',
        scheme,
        '-configuration',
        configuration,
        '-sdk',
        sdk,
        '-derivedDataPath',
        'ios/build',
        'CODE_SIGNING_ALLOWED=NO',
        '-quiet',
      ],
      cwd: root,
      env: {
        RN_SRC_EXT: 'e2e.tsx',
        CHAMBER_OF_SECRETS: 'true',
      },
    })),
    { label: 'Re-audit iOS release readiness after simulator build', command: 'corepack', args: ['yarn', 'ios:release:readiness:audit'], cwd: root },
    { label: 'Re-validate iOS release readiness summary', command: 'corepack', args: ['yarn', 'ios:release:readiness:check-summary'], cwd: root },
  ];
};

const parseArgs = argv => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--preflight-only') {
      options.preflightOnly = true;
    } else if (arg === '--all-schemes') {
      options.allSchemes = true;
    } else if (arg === '--') {
      continue;
    } else if (arg === '--scheme') {
      options.scheme = argv[index + 1];
      options.schemeProvided = true;
      index += 1;
    } else if (arg === '--configuration') {
      options.configuration = argv[index + 1];
      options.configurationProvided = true;
      index += 1;
    } else if (arg === '--sdk') {
      options.sdk = argv[index + 1];
      index += 1;
    } else if (arg === '--pod') {
      const mode = argv[index + 1];
      options.preferBundleExecPod = mode === 'bundle';
      index += 1;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      options.unknown = arg;
    }
  }

  if (options.allSchemes && !options.schemeProvided && options.scheme === defaultOptions.scheme) {
    options.scheme = null;
  }

  if (!options.configuration && options.scheme) {
    options.configuration = iosMacValidationSchemes[options.scheme] || null;
  }

  return options;
};

const runStep = step => {
  console.log(`\n${step.label}`);
  console.log(renderIosMacValidationCommand(step));

  const invocation = getSpawnInvocation(step);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: step.cwd,
    env: {
      ...process.env,
      ...(step.env || {}),
    },
    stdio: 'inherit',
    windowsHide: true,
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage);
    return 0;
  }

  if (options.unknown) {
    console.error(`Unknown argument: ${options.unknown}`);
    console.error(usage);
    return 1;
  }

  const errors = getIosMacValidationHandoffErrors(options);

  if (errors.length > 0) {
    errors.forEach(error => console.error(error));
    console.error(usage);
    return 1;
  }

  const commands = options.preflightOnly ? getIosMacValidationPreflightCommands(options) : getIosMacValidationCommands(options);

  if (options.dryRun) {
    console.log(options.preflightOnly ? 'iOS static validation preflight handoff dry run' : 'iOS macOS validation handoff dry run');
    console.log(`Scheme: ${options.allSchemes ? 'all shared schemes' : options.scheme}`);
    console.log(`Configuration: ${options.allSchemes ? 'per shared scheme' : options.configuration}`);
    console.log(`SDK: ${options.sdk}`);
    commands.forEach((step, index) => {
      console.log(`${index + 1}. ${step.label}`);
      console.log(`   ${renderIosMacValidationCommand(step)}`);
    });
    console.log(
      options.preflightOnly
        ? 'Dry run complete. Run without --dry-run to execute static iOS preflight without claiming runtime validation.'
        : 'Dry run complete. Run without --dry-run on macOS with Xcode 16.1+ and CocoaPods to execute.',
    );
    return 0;
  }

  if (options.preflightOnly) {
    for (const step of commands) {
      const status = runStep(step);

      if (status !== 0) {
        return status;
      }
    }

    const readinessErrors = getIosMacValidationPreflightReadinessErrors({
      releaseReadinessSummaryText: readSummary(iosReleaseReadinessSummaryPath),
      macValidationPrereqSummaryText: readSummary(iosMacValidationPrereqSummaryPath),
    });

    if (readinessErrors.length > 0) {
      console.error('\niOS static validation preflight handoff is blocked:');
      readinessErrors.forEach(error => console.error(`- ${error}`));
      return 1;
    }

    console.log('\niOS static validation preflight handoff completed.');
    console.log('iOS runtime delivery validation remains not claimed until macOS simulator/device evidence exists.');
    return 0;
  }

  if (process.platform !== 'darwin') {
    console.error('iOS macOS validation handoff requires macOS with Xcode 16.1+ and CocoaPods.');
    console.error('Use --dry-run or --preflight-only on Windows without claiming iOS runtime validation.');
    return 1;
  }

  for (const step of commands) {
    const status = runStep(step);

    if (status !== 0) {
      return status;
    }
  }

  const readinessErrors = getIosMacValidationReadinessErrors({
    releaseReadinessSummaryText: readSummary(iosReleaseReadinessSummaryPath),
    macValidationPrereqSummaryText: readSummary(iosMacValidationPrereqSummaryPath),
  });

  if (readinessErrors.length > 0) {
    console.error('\niOS macOS validation handoff readiness is blocked:');
    readinessErrors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log('\niOS macOS validation handoff completed.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
