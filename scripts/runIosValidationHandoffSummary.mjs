import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';
import { getIosMacValidationPrereqSummaryErrors } from './iosMacValidationPrereqSummaryGuard.mjs';
import { getIosValidationHandoffSummaryErrors } from './iosValidationHandoffSummaryGuard.mjs';
import { iosMacValidationSchemes } from './runIosMacValidationHandoff.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'local-docs', 'ios-validation-handoff-summary.txt');
const releaseReadinessSummaryPath = path.join(root, 'local-docs', 'ios-release-static-readiness-summary.txt');
const macValidationPrereqSummaryPath = path.join(root, 'local-docs', 'ios-mac-validation-prereqs-summary.txt');

const readSummary = summaryPath => {
  if (!existsSync(summaryPath)) {
    return '';
  }

  return readFileSync(summaryPath, 'utf8');
};

const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const toInteger = value => (/^\d+$/.test(value) ? Number(value) : 0);
const yesNo = value => (value === 'yes' ? 'yes' : 'no');

const collectEvidence = () => {
  const releaseReadinessSummary = readSummary(releaseReadinessSummaryPath);
  const macValidationPrereqSummary = readSummary(macValidationPrereqSummaryPath);
  const releaseReadinessErrors = releaseReadinessSummary
    ? getIosReleaseReadinessSummaryErrors(releaseReadinessSummary)
    : ['missing iOS release readiness summary'];
  const macValidationPrereqErrors = macValidationPrereqSummary
    ? getIosMacValidationPrereqSummaryErrors(macValidationPrereqSummary)
    : ['missing iOS macOS validation prerequisite summary'];

  return {
    releaseReadinessSummary,
    macValidationPrereqSummary,
    releaseReadinessErrors,
    macValidationPrereqErrors,
  };
};

const formatSummary = ({ evidence, generatedAt = new Date().toISOString() }) => {
  const releaseSummaryValid = evidence.releaseReadinessErrors.length === 0;
  const prereqSummaryValid = evidence.macValidationPrereqErrors.length === 0;
  const staticReady = getLineValue(evidence.releaseReadinessSummary, 'Static iOS release files valid') || 'no';
  const archiveReady = getLineValue(evidence.releaseReadinessSummary, 'Ready for macOS archive validation') || 'no';
  const macPrereqsReady = getLineValue(evidence.macValidationPrereqSummary, 'Ready for macOS pod/archive validation') || 'no';
  const releasePodfileLockRefreshRequired = getLineValue(evidence.releaseReadinessSummary, 'Podfile.lock refresh required') || 'yes';
  const prereqPodfileLockRefreshRequired = getLineValue(evidence.macValidationPrereqSummary, 'Podfile.lock refresh required') || 'yes';
  const releasePodfileLockDriftIssues = toInteger(getLineValue(evidence.releaseReadinessSummary, 'Podfile.lock drift issues'));
  const prereqPodfileLockDriftIssues = toInteger(getLineValue(evidence.macValidationPrereqSummary, 'Podfile.lock drift issues'));
  const podfileLockRefreshRequired =
    releasePodfileLockRefreshRequired === 'yes' || prereqPodfileLockRefreshRequired === 'yes' || releasePodfileLockDriftIssues > 0 || prereqPodfileLockDriftIssues > 0
      ? 'yes'
      : 'no';
  const platform = getLineValue(evidence.macValidationPrereqSummary, 'Platform') || process.platform;
  const xcodebuildAvailable = getLineValue(evidence.macValidationPrereqSummary, 'xcodebuild available') || 'no';
  const xcodebuildVersion = getLineValue(evidence.macValidationPrereqSummary, 'xcodebuild version') || '<not available>';
  const podAvailable = getLineValue(evidence.macValidationPrereqSummary, 'pod available') || 'no';
  const bundlePodAvailable = getLineValue(evidence.macValidationPrereqSummary, 'bundle exec pod available') || 'no';
  const runtimeValidation = getLineValue(evidence.macValidationPrereqSummary, 'iOS runtime delivery validation') || 'not claimed';
  const guardedSchemes = Object.keys(iosMacValidationSchemes).length;
  const macHandoffCommand = 'corepack yarn ios:mac-validation:handoff --all-schemes';
  const macHandoffDryRunCommand = 'corepack yarn ios:mac-validation:handoff:dry-run --all-schemes';
  const macHandoffSchemeCoverage = 'all shared schemes';
  const macHandoffSdk = 'iphonesimulator';
  const blockers = [];

  if (!releaseSummaryValid) {
    evidence.releaseReadinessErrors.forEach(error => blockers.push(`Release readiness summary invalid: ${error}`));
  }

  if (!prereqSummaryValid) {
    evidence.macValidationPrereqErrors.forEach(error => blockers.push(`macOS validation prerequisite summary invalid: ${error}`));
  }

  if (staticReady !== 'yes') {
    blockers.push('Static iOS release files are not valid.');
  }

  if (archiveReady !== 'yes') {
    blockers.push('iOS release readiness summary is not ready for macOS archive validation.');
  }

  if (macPrereqsReady !== 'yes') {
    blockers.push('iOS macOS prerequisite summary is not ready for pod/archive validation.');
  }

  if (platform !== 'darwin') {
    blockers.push(`Current platform is ${platform}; iOS archive/simulator validation requires macOS with Xcode.`);
  }

  if (xcodebuildAvailable !== 'yes') {
    blockers.push('xcodebuild is unavailable; install/run Xcode on macOS before claiming iOS validation.');
  }

  if (podAvailable !== 'yes' && bundlePodAvailable !== 'yes') {
    blockers.push('CocoaPods is unavailable; install pod or run through bundle exec pod on macOS.');
  }

  if (podfileLockRefreshRequired === 'yes') {
    blockers.push(`ios/Podfile.lock refresh is required; release drift ${releasePodfileLockDriftIssues}, prereq drift ${prereqPodfileLockDriftIssues}.`);
  }

  if (runtimeValidation !== 'not claimed') {
    blockers.push('iOS runtime delivery validation must remain not claimed until simulator/device evidence exists.');
  }

  const implementationReady =
    releaseSummaryValid &&
    prereqSummaryValid &&
    staticReady === 'yes' &&
    archiveReady === 'yes' &&
    macPrereqsReady === 'yes' &&
    platform === 'darwin' &&
    xcodebuildAvailable === 'yes' &&
    (podAvailable === 'yes' || bundlePodAvailable === 'yes') &&
    podfileLockRefreshRequired === 'no' &&
    releasePodfileLockDriftIssues === 0 &&
    prereqPodfileLockDriftIssues === 0 &&
    runtimeValidation === 'not claimed' &&
    blockers.length === 0
      ? 'yes'
      : 'no';
  const requiredAction =
    podfileLockRefreshRequired === 'yes'
      ? `refresh ios/Podfile.lock with pod install on macOS, then run \`${macHandoffCommand}\` before claiming iOS runtime delivery.`
      : `run \`${macHandoffCommand}\` on macOS before claiming iOS runtime delivery.`;

  return [
    'iOS validation handoff summary',
    `Generated at: ${generatedAt}`,
    `Platform: ${platform}`,
    `Static iOS release files valid: ${yesNo(staticReady)}`,
    `Release readiness summary valid: ${releaseSummaryValid ? 'yes' : 'no'}`,
    `Mac prerequisite summary valid: ${prereqSummaryValid ? 'yes' : 'no'}`,
    `Ready for macOS archive validation: ${yesNo(archiveReady)}`,
    `Ready for macOS pod/archive validation: ${yesNo(macPrereqsReady)}`,
    `Podfile.lock refresh required: ${podfileLockRefreshRequired}`,
    `Release Podfile.lock drift issues: ${releasePodfileLockDriftIssues}`,
    `Prereq Podfile.lock drift issues: ${prereqPodfileLockDriftIssues}`,
    `xcodebuild available: ${yesNo(xcodebuildAvailable)}`,
    `xcodebuild version: ${xcodebuildVersion}`,
    `pod available: ${yesNo(podAvailable)}`,
    `bundle exec pod available: ${yesNo(bundlePodAvailable)}`,
    `Guarded iOS schemes: ${guardedSchemes}`,
    `Mac handoff command: ${macHandoffCommand}`,
    `Mac handoff dry-run command: ${macHandoffDryRunCommand}`,
    `Mac handoff scheme coverage: ${macHandoffSchemeCoverage}`,
    `Mac handoff scheme count: ${guardedSchemes}`,
    `Mac handoff SDK: ${macHandoffSdk}`,
    `iOS runtime delivery validation: ${runtimeValidation}`,
    `Implementation ready: ${implementationReady}`,
    `Blockers: ${blockers.length}`,
    ...blockers.map(blocker => `- ${blocker}`),
    'Secret values printed: no',
    `Required action: ${requiredAction}`,
    '',
  ].join('\n');
};

const main = () => {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const evidence = collectEvidence();
  const summary = formatSummary({ evidence });
  const errors = getIosValidationHandoffSummaryErrors(summary);

  if (errors.length > 0) {
    console.error('iOS validation handoff summary is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  if (dryRun) {
    console.log(summary.trim());
    return 0;
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, summary);
  console.log(summary.trim());
  console.log(`iOS validation handoff summary written to ${path.relative(root, outputPath)}`);
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
