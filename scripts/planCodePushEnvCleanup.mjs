import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { codePushEnvFiles, collectCodePushReleasePathAudit } from './auditCodePushReleasePath.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'local-docs', 'codepush-env-cleanup-plan.txt');
const codePushKeyPattern = /^(CODEPUSH_[A-Z_]+)=(.*)$/;
const deploymentKeyNames = new Set(['CODEPUSH_DEPLOYMENT_KEY_ANDROID', 'CODEPUSH_DEPLOYMENT_KEY_IOS']);

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const collectCodePushEnvCleanupPlan = () => {
  const releasePathAudit = collectCodePushReleasePathAudit();
  const entries = [];

  codePushEnvFiles.forEach(relativePath => {
    const absolutePath = path.join(root, relativePath);
    if (!existsSync(absolutePath)) {
      return;
    }

    read(relativePath)
      .split(/\r?\n/)
      .forEach(line => {
        const match = line.match(codePushKeyPattern);
        if (!match) {
          return;
        }

        const [, key, value] = match;
        entries.push({
          envFile: relativePath,
          key,
          deploymentKey: deploymentKeyNames.has(key),
          blank: value.length === 0,
        });
      });
  });

  const entriesByFile = new Map();
  entries.forEach(entry => {
    if (!entriesByFile.has(entry.envFile)) {
      entriesByFile.set(entry.envFile, []);
    }
    entriesByFile.get(entry.envFile).push(entry);
  });

  const filesNeedingCleanup = [...entriesByFile.keys()].sort();
  const nonEmptyDeploymentKeyEntries = entries.filter(entry => entry.deploymentKey && !entry.blank).length;

  return {
    codePushRemoved: releasePathAudit.codePushRemoved,
    trackedEnvFiles: codePushEnvFiles.length,
    filesNeedingCleanup,
    entriesByFile,
    keyEntries: entries.length,
    nonEmptyDeploymentKeyEntries,
    normalTextDiffCleanupAllowed: entries.length === 0 || nonEmptyDeploymentKeyEntries === 0,
  };
};

export const formatCodePushEnvCleanupPlan = (audit, generatedAt = new Date().toISOString()) => {
  const fileSections = audit.filesNeedingCleanup.flatMap(filePath => [
    `File: ${filePath}`,
    ...audit.entriesByFile.get(filePath).map(entry => {
      const keyKind = entry.deploymentKey ? 'deployment key' : 'flag';
      const valueState = entry.blank ? 'blank' : 'non-empty';
      const action = entry.deploymentKey && !entry.blank
        ? 'secure regeneration required'
        : 'normal cleanup allowed after secure regeneration';
      return `- ${entry.key}: ${keyKind}, ${valueState}, ${action}`;
    }),
  ]);

  const requiredAction =
    audit.nonEmptyDeploymentKeyEntries > 0
      ? 'perform a secrets-safe cleanup or secure env regeneration that does not expose historical deployment-key values in review diffs or logs.'
      : audit.filesNeedingCleanup.length > 0
        ? 'remove remaining non-secret CodePush env flags without exposing historical deployment-key values.'
        : 'none; no tracked CodePush env keys remain; do not expose historical deployment-key values.';

  return [
    'CodePush env cleanup plan',
    `Generated at: ${generatedAt}`,
    `CodePush removed: ${audit.codePushRemoved ? 'yes' : 'no'}`,
    `Tracked env files scanned: ${audit.trackedEnvFiles}`,
    `Files needing cleanup: ${audit.filesNeedingCleanup.length}`,
    ...fileSections,
    `CodePush env key entries: ${audit.keyEntries}`,
    `Non-empty deployment key entries: ${audit.nonEmptyDeploymentKeyEntries}`,
    `Normal text diff cleanup allowed: ${audit.normalTextDiffCleanupAllowed ? 'yes' : 'no'}`,
    `Secure env regeneration required: ${audit.nonEmptyDeploymentKeyEntries > 0 ? 'yes' : 'no'}`,
    'Review-safe evidence: file paths and key names only',
    'Secret values printed: no',
    `Required action: ${requiredAction}`,
    '',
  ].join('\n');
};

const main = () => {
  const audit = collectCodePushEnvCleanupPlan();
  const plan = formatCodePushEnvCleanupPlan(audit);
  mkdirSync(path.dirname(planPath), { recursive: true });
  writeFileSync(planPath, plan);

  console.log('CodePush env cleanup plan');
  console.log(`CodePush removed: ${audit.codePushRemoved ? 'yes' : 'no'}`);
  console.log(`Tracked env files scanned: ${audit.trackedEnvFiles}`);
  console.log(`Files needing cleanup: ${audit.filesNeedingCleanup.length}`);
  console.log(`CodePush env key entries: ${audit.keyEntries}`);
  console.log(`Non-empty deployment key entries: ${audit.nonEmptyDeploymentKeyEntries}`);
  console.log(`Normal text diff cleanup allowed: ${audit.normalTextDiffCleanupAllowed ? 'yes' : 'no'}`);
  console.log('Review-safe evidence: file paths and key names only');
  console.log('Secret values printed: no');
  console.log(`CodePush env cleanup plan written to ${path.relative(root, planPath)}`);
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
