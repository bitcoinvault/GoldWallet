import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { codePushEnvFiles, collectCodePushReleasePathAudit } from './auditCodePushReleasePath.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'codepush-env-cleanup-readiness-summary.txt');
const codePushKeyPattern = /^(CODEPUSH_[A-Z_]+)=(.*)$/;
const deploymentKeyNames = new Set(['CODEPUSH_DEPLOYMENT_KEY_ANDROID', 'CODEPUSH_DEPLOYMENT_KEY_IOS']);

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

export const collectCodePushEnvCleanupReadinessAudit = () => {
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

  const filesWithCodePushKeys = [...new Set(entries.map(entry => entry.envFile))].sort();
  const filesWithNonEmptyDeploymentKeys = [
    ...new Set(entries.filter(entry => entry.deploymentKey && !entry.blank).map(entry => entry.envFile)),
  ].sort();
  const nonEmptyDeploymentKeyEntries = entries.filter(entry => entry.deploymentKey && !entry.blank).length;
  const blankDeploymentKeyEntries = entries.filter(entry => entry.deploymentKey && entry.blank).length;
  const enabledFlagEntries = entries.filter(entry => entry.key === 'CODEPUSH_ENABLED').length;

  return {
    codePushRemoved: releasePathAudit.codePushRemoved,
    trackedEnvFiles: codePushEnvFiles.length,
    filesWithCodePushKeys,
    keyEntries: entries.length,
    nonEmptyDeploymentKeyEntries,
    blankDeploymentKeyEntries,
    enabledFlagEntries,
    filesWithNonEmptyDeploymentKeys,
    cleanupSafeThroughNormalDiff: entries.length === 0 || nonEmptyDeploymentKeyEntries === 0,
  };
};

export const formatCodePushEnvCleanupReadinessSummary = (audit, generatedAt = new Date().toISOString()) => {
  const requiredAction =
    audit.nonEmptyDeploymentKeyEntries > 0
      ? 'perform a secrets-safe cleanup or secure env regeneration that does not expose historical deployment-key values in review diffs or logs.'
      : audit.filesWithCodePushKeys.length > 0
        ? 'remove remaining non-secret CodePush env flags without exposing historical deployment-key values.'
        : 'none; no tracked CodePush env keys remain; do not expose historical deployment-key values.';

  return [
    'CodePush env cleanup readiness audit',
    `Generated at: ${generatedAt}`,
    `CodePush removed: ${audit.codePushRemoved ? 'yes' : 'no'}`,
    `Tracked env files scanned: ${audit.trackedEnvFiles}`,
    `Env files carrying CodePush keys: ${audit.filesWithCodePushKeys.length}`,
    ...audit.filesWithCodePushKeys.map(filePath => `- ${filePath}`),
    `CodePush env key entries: ${audit.keyEntries}`,
    `Non-empty deployment key entries: ${audit.nonEmptyDeploymentKeyEntries}`,
    `Blank deployment key entries: ${audit.blankDeploymentKeyEntries}`,
    `Enabled flag entries: ${audit.enabledFlagEntries}`,
    `Files with non-empty deployment keys: ${audit.filesWithNonEmptyDeploymentKeys.length}`,
    ...audit.filesWithNonEmptyDeploymentKeys.map(filePath => `- ${filePath}`),
    `Cleanup safe through normal text diff: ${audit.cleanupSafeThroughNormalDiff ? 'yes' : 'no'}`,
    'Secret values printed: no',
    `Required action: ${requiredAction}`,
    '',
  ].join('\n');
};

const main = () => {
  const audit = collectCodePushEnvCleanupReadinessAudit();
  const summary = formatCodePushEnvCleanupReadinessSummary(audit);
  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);

  console.log('CodePush env cleanup readiness audit');
  console.log(`CodePush removed: ${audit.codePushRemoved ? 'yes' : 'no'}`);
  console.log(`Tracked env files scanned: ${audit.trackedEnvFiles}`);
  console.log(`Env files carrying CodePush keys: ${audit.filesWithCodePushKeys.length}`);
  console.log(`CodePush env key entries: ${audit.keyEntries}`);
  console.log(`Non-empty deployment key entries: ${audit.nonEmptyDeploymentKeyEntries}`);
  console.log(`Cleanup safe through normal text diff: ${audit.cleanupSafeThroughNormalDiff ? 'yes' : 'no'}`);
  console.log('Secret values printed: no');
  console.log(`CodePush env cleanup readiness summary written to ${path.relative(root, summaryPath)}`);
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
