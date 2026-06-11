import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getCodePushDecisionHandoffErrors } from './codePushDecisionHandoffGuard.mjs';
import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';
import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';
import { getCodePushRemovalReadinessSummaryErrors } from './codePushRemovalReadinessSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'local-docs', 'codepush-decision-handoff.txt');
const releasePathSummaryPath = path.join(root, 'local-docs', 'codepush-release-path-summary.txt');
const migrationReadinessSummaryPath = path.join(root, 'local-docs', 'codepush-migration-readiness-summary.txt');
const removalReadinessSummaryPath = path.join(root, 'local-docs', 'codepush-removal-readiness-summary.txt');

const defaultOptions = {
  decision: 'pending',
  replacementTarget: 'none',
  betaStrategy: 'unconfirmed',
  dryRun: false,
};

const usage = [
  'Usage: node scripts/runCodePushDecisionHandoff.mjs [--decision pending|remove|replace|temporary-legacy] [--replacement-target <name>] [--beta-strategy unconfirmed|beta-has-ota-keys|beta-has-no-ota|beta-out-of-scope] [--dry-run]',
  '',
  'Examples:',
  '  node scripts/runCodePushDecisionHandoff.mjs',
  '  node scripts/runCodePushDecisionHandoff.mjs --decision remove --beta-strategy beta-has-no-ota',
  '  node scripts/runCodePushDecisionHandoff.mjs --decision replace --replacement-target self-hosted-ota --beta-strategy beta-has-ota-keys',
].join('\n');

const decisions = new Map([
  ['pending', 'pending'],
  ['remove', 'remove'],
  ['replace', 'replace'],
  ['temporary-legacy', 'temporary legacy compatibility'],
  ['temporary legacy compatibility', 'temporary legacy compatibility'],
]);

const betaStrategies = new Map([
  ['unconfirmed', 'unconfirmed'],
  ['beta-has-ota-keys', 'beta has OTA keys'],
  ['beta-has-no-ota', 'beta has no OTA'],
  ['beta-out-of-scope', 'beta out of scope'],
  ['beta has OTA keys', 'beta has OTA keys'],
  ['beta has no OTA', 'beta has no OTA'],
  ['beta out of scope', 'beta out of scope'],
]);

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

const parseArgs = argv => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--decision') {
      options.decision = argv[++index] || '';
    } else if (arg === '--replacement-target') {
      options.replacementTarget = argv[++index] || '';
    } else if (arg === '--beta-strategy') {
      options.betaStrategy = argv[++index] || '';
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      options.unknown = arg;
    }
  }

  return options;
};

const normalizeOptions = options => {
  const normalizedDecision = decisions.get(options.decision);
  const normalizedBetaStrategy = betaStrategies.get(options.betaStrategy);
  const errors = [];

  if (!normalizedDecision) {
    errors.push(`Unknown decision: ${options.decision || '<missing>'}`);
  }

  if (!normalizedBetaStrategy) {
    errors.push(`Unknown beta strategy: ${options.betaStrategy || '<missing>'}`);
  }

  if (options.replacementTarget !== 'none' && /CODEPUSH_DEPLOYMENT_KEY|auth\.token|=/.test(options.replacementTarget)) {
    errors.push('Replacement target must not contain secret-looking assignments');
  }

  return {
    ...options,
    decision: normalizedDecision || options.decision,
    betaStrategy: normalizedBetaStrategy || options.betaStrategy,
    replacementTarget: options.replacementTarget || 'none',
    errors,
  };
};

const collectEvidence = () => {
  const releasePathSummary = readSummary(releasePathSummaryPath);
  const migrationReadinessSummary = readSummary(migrationReadinessSummaryPath);
  const removalReadinessSummary = readSummary(removalReadinessSummaryPath);
  const releasePathErrors = releasePathSummary ? getCodePushReleasePathSummaryErrors(releasePathSummary) : ['missing release path summary'];
  const migrationReadinessErrors = migrationReadinessSummary
    ? getCodePushMigrationReadinessSummaryErrors(migrationReadinessSummary)
    : ['missing migration readiness summary'];
  const removalReadinessErrors = removalReadinessSummary
    ? getCodePushRemovalReadinessSummaryErrors(removalReadinessSummary)
    : ['missing removal readiness summary'];

  return {
    releasePathSummary,
    migrationReadinessSummary,
    removalReadinessSummary,
    releasePathErrors,
    migrationReadinessErrors,
    removalReadinessErrors,
  };
};

const formatSummary = ({ evidence, options, generatedAt = new Date().toISOString() }) => {
  const releasePathSummaryValid = evidence.releasePathErrors.length === 0;
  const migrationReadinessSummaryValid = evidence.migrationReadinessErrors.length === 0;
  const removalReadinessSummaryValid = evidence.removalReadinessErrors.length === 0;
  const releaseBuildEvidenceReady = getLineValue(evidence.migrationReadinessSummary, 'CodePush release build evidence ready') || 'no';
  const releaseSmokeEvidenceReady = getLineValue(evidence.migrationReadinessSummary, 'CodePush release smoke evidence ready') || 'no';
  const migrationRequired = getLineValue(evidence.migrationReadinessSummary, 'CodePush migration required') || 'no';
  const updateValidation = getLineValue(evidence.migrationReadinessSummary, 'CodePush update validation') || 'not claimed';
  const runtimeGatedOff = getLineValue(evidence.migrationReadinessSummary, 'CodePush runtime gated off by default') || 'no';
  const implementationReady =
    options.decision === 'remove' &&
    releasePathSummaryValid &&
    migrationReadinessSummaryValid &&
    removalReadinessSummaryValid &&
    releaseBuildEvidenceReady === 'yes' &&
    releaseSmokeEvidenceReady === 'yes'
      ? 'yes'
      : 'no';
  const requiredAction =
    options.decision === 'pending'
      ? 'choose remove or replace before implementation; do not claim OTA update validation until deployment keys and a real delivery test are available.'
      : options.decision === 'temporary legacy compatibility'
        ? 'keep CodePush gated off by default as a temporary exception; choose remove or replace before long-term release support; do not claim OTA update validation.'
        : 'start the selected implementation branch only after reviewing this handoff; do not claim OTA update validation until deployment keys and a real delivery test are available.';

  const lines = [
    'CodePush decision handoff',
    `Generated at: ${generatedAt}`,
    `Decision: ${options.decision}`,
    `Implementation ready: ${implementationReady}`,
    `Replacement target: ${options.decision === 'replace' ? options.replacementTarget : 'none'}`,
    `Beta deployment-key strategy: ${options.betaStrategy}`,
    `Release path summary valid: ${releasePathSummaryValid ? 'yes' : 'no'}`,
    `Migration readiness summary valid: ${migrationReadinessSummaryValid ? 'yes' : 'no'}`,
    `Removal readiness summary valid: ${removalReadinessSummaryValid ? 'yes' : 'no'}`,
    `CodePush migration required: ${migrationRequired}`,
    `CodePush update validation: ${updateValidation}`,
    `CodePush runtime gated off by default: ${runtimeGatedOff}`,
    `CodePush release build evidence ready: ${releaseBuildEvidenceReady}`,
    `CodePush release smoke evidence ready: ${releaseSmokeEvidenceReady}`,
    'iOS runtime validation: not claimed on this Windows host; run macOS/Xcode/CocoaPods validation before claiming iOS delivery.',
    `Release path summary errors: ${evidence.releasePathErrors.length}`,
    ...evidence.releasePathErrors.map(error => `- ${error}`),
    `Migration readiness summary errors: ${evidence.migrationReadinessErrors.length}`,
    ...evidence.migrationReadinessErrors.map(error => `- ${error}`),
    `Removal readiness summary errors: ${evidence.removalReadinessErrors.length}`,
    ...evidence.removalReadinessErrors.map(error => `- ${error}`),
    'Secret values printed: no',
    `Required action: ${requiredAction}`,
    '',
  ];

  return lines.join('\n');
};

const main = () => {
  const parsedOptions = parseArgs(process.argv.slice(2));

  if (parsedOptions.help) {
    console.log(usage);
    return 0;
  }

  if (parsedOptions.unknown) {
    console.error(`Unknown argument: ${parsedOptions.unknown}`);
    console.error(usage);
    return 1;
  }

  const options = normalizeOptions(parsedOptions);
  if (options.errors.length > 0) {
    options.errors.forEach(error => console.error(error));
    console.error(usage);
    return 1;
  }

  const evidence = collectEvidence();
  const summary = formatSummary({ evidence, options });
  const errors = getCodePushDecisionHandoffErrors(summary);

  if (errors.length > 0) {
    console.error('CodePush decision handoff is invalid:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  if (options.dryRun) {
    console.log(summary.trim());
    return 0;
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, summary);
  console.log(summary.trim());
  console.log(`CodePush decision handoff written to ${path.relative(root, outputPath)}`);
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
