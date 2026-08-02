import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { collectIosPodfileLockDrift } from './iosPodfileLockDrift.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'ios-mac-validation-prereqs-summary.txt');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

const runVersionCommand = (command, args) => {
  try {
    return execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })
      .trim()
      .replace(/\r?\n/g, '; ');
  } catch {
    return null;
  }
};

export const collectIosMacValidationPrereqs = () => {
  const packageJson = JSON.parse(read('package.json'));
  const rnHelpers = read('node_modules/react-native/scripts/cocoapods/helpers.rb');
  const rnMinXcodeMatch = rnHelpers.match(/min_xcode_version_supported\s*\n\s*return '([^']+)'/);
  const rnMinXcodeVersion = rnMinXcodeMatch ? rnMinXcodeMatch[1] : '<unknown>';
  const { podfileLockDriftIssues } = collectIosPodfileLockDrift({
    packageJson,
    podfileLock: read('ios/Podfile.lock'),
  });
  const xcodebuildVersion = runVersionCommand('xcodebuild', ['-version']);
  const podVersion = runVersionCommand('pod', ['--version']);
  const bundlePodVersion =
    existsSync(path.join(root, 'Gemfile')) || existsSync(path.join(root, 'ios', 'Gemfile'))
    ? runVersionCommand('bundle', ['exec', 'pod', '--version'])
    : null;
  const blockers = [];

  if (process.platform !== 'darwin') {
    blockers.push(`Current platform is ${process.platform}; iOS archive/simulator validation requires macOS with Xcode.`);
  }

  if (!xcodebuildVersion) {
    blockers.push(`xcodebuild is not available; React Native ${packageJson.dependencies['react-native']} requires Xcode ${rnMinXcodeVersion}+.`);
  }

  if (!podVersion && !bundlePodVersion) {
    blockers.push('CocoaPods is not available via pod or bundle exec pod; ios/Podfile.lock cannot be refreshed here.');
  }

  if (podfileLockDriftIssues.length > 0) {
    blockers.push(`ios/Podfile.lock has ${podfileLockDriftIssues.length} active drift issues; run pod install on macOS before archive validation.`);
  }

  return {
    platform: process.platform,
    ready: blockers.length === 0,
    xcodebuildVersion,
    rnMinXcodeVersion,
    podVersion,
    bundlePodVersion,
    podfileLockDriftIssues,
    blockers,
  };
};

export const formatIosMacValidationPrereqsSummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'iOS macOS validation prerequisites audit',
    `Generated at: ${generatedAt}`,
    `Platform: ${audit.platform}`,
    `Ready for macOS pod/archive validation: ${audit.ready ? 'yes' : 'no'}`,
    `xcodebuild available: ${audit.xcodebuildVersion ? 'yes' : 'no'}`,
    `xcodebuild version: ${audit.xcodebuildVersion || '<not available>'}`,
    `React Native minimum Xcode: ${audit.rnMinXcodeVersion}`,
    `pod available: ${audit.podVersion ? 'yes' : 'no'}`,
    `bundle exec pod available: ${audit.bundlePodVersion ? 'yes' : 'no'}`,
    `Podfile.lock refresh required: ${audit.podfileLockDriftIssues.length > 0 ? 'yes' : 'no'}`,
    `Podfile.lock drift issues: ${audit.podfileLockDriftIssues.length}`,
    `iOS runtime delivery validation: not claimed`,
    `Blockers: ${audit.blockers.length}`,
    ...audit.blockers.map(blocker => `- ${blocker}`),
    audit.ready
      ? 'Required action: run pod install, then iOS archive/simulator validation on macOS before claiming iOS runtime delivery.'
      : 'Required action: run this prerequisite audit on macOS with Xcode and CocoaPods, refresh ios/Podfile.lock with pod install, then run iOS archive/simulator validation before claiming iOS runtime delivery.',
    '',
  ].join('\n');

const printReport = () => {
  const audit = collectIosMacValidationPrereqs();
  const summary = formatIosMacValidationPrereqsSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`iOS macOS validation prerequisites summary written to ${path.relative(root, summaryPath)}`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  printReport();
}
