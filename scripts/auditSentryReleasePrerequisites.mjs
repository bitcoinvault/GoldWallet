import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'sentry-release-prereq-summary.txt');
export const requiredSentryPropertiesFiles = ['sentry.properties', 'android/sentry.properties', 'ios/sentry.properties'];
export const requiredSentryPropertiesKeys = ['defaults.url', 'defaults.org', 'defaults.project', 'auth.token'];
const createScriptPath = path.join(root, 'create-sentry-properties.sh');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const parsePropertiesKeys = content =>
  new Set(
    content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && line.includes('='))
      .map(line => line.slice(0, line.indexOf('='))),
  );

export const collectSentryReleasePrerequisites = ({ env = process.env } = {}) => {
  const missingFiles = requiredSentryPropertiesFiles.filter(relativePath => !existsSync(path.join(root, relativePath)));
  const invalidFiles = [];

  requiredSentryPropertiesFiles
    .filter(relativePath => !missingFiles.includes(relativePath))
    .forEach(relativePath => {
      const content = read(relativePath);
      const keys = parsePropertiesKeys(content);
      const missingKeys = requiredSentryPropertiesKeys.filter(key => !keys.has(key));
      const authLine = content
        .split(/\r?\n/)
        .find(line => line.trim().startsWith('auth.token='));
      const hasBlankToken = authLine !== undefined && authLine.trim() === 'auth.token=';

      if (missingKeys.length > 0 || hasBlankToken) {
        invalidFiles.push({
          relativePath,
          missingKeys,
          hasBlankToken,
        });
      }
    });

  const hasCreateScript = existsSync(createScriptPath);
  const createScript = hasCreateScript ? readFileSync(createScriptPath, 'utf8') : '';
  const createScriptUsesToken = createScript.includes('SENTRY_AUTH_TOKEN');
  const envHasToken = Boolean(env.SENTRY_AUTH_TOKEN);
  const ready = missingFiles.length === 0 && invalidFiles.length === 0;

  return {
    missingFiles,
    invalidFiles,
    hasCreateScript,
    createScriptUsesToken,
    envHasToken,
    ready,
  };
};

export const formatSentryReleasePrereqSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Sentry release prerequisite audit',
    `Generated at: ${generatedAt}`,
    `Release source-map prerequisites: ${audit.ready ? 'ready' : 'not ready'}`,
    `sentry.properties files present: ${audit.missingFiles.length === 0 ? 'yes' : 'no'}`,
    `Missing files: ${audit.missingFiles.length}`,
  ];

  audit.missingFiles.forEach(relativePath => lines.push(`- ${relativePath}`));
  lines.push(`Invalid files: ${audit.invalidFiles.length}`);

  audit.invalidFiles.forEach(file => {
    const issues = [];

    if (file.missingKeys.length > 0) {
      issues.push(`missing keys: ${file.missingKeys.join(', ')}`);
    }

    if (file.hasBlankToken) {
      issues.push('blank auth.token');
    }

    lines.push(`- ${file.relativePath}: ${issues.join('; ')}`);
  });

  lines.push(`create-sentry-properties.sh present: ${audit.hasCreateScript ? 'yes' : 'no'}`);
  lines.push(`create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: ${audit.createScriptUsesToken ? 'yes' : 'no'}`);
  lines.push(`SENTRY_AUTH_TOKEN available in current shell: ${audit.envHasToken ? 'yes' : 'no'}`);
  lines.push(
    audit.ready
      ? 'Required action: none; release source-map prerequisites are present locally.'
      : 'Required action: generate sentry.properties with SENTRY_AUTH_TOKEN before claiming Sentry release validation.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Sentry release prerequisite audit');
  console.log(`sentry.properties files present: ${audit.missingFiles.length === 0 ? 'yes' : 'no'}`);

  if (audit.missingFiles.length > 0) {
    console.log('Missing files:');
    audit.missingFiles.forEach(relativePath => console.log(`- ${relativePath}`));
  }

  if (audit.invalidFiles.length > 0) {
    console.log('Invalid files:');
    audit.invalidFiles.forEach(file => {
      const issues = [];

      if (file.missingKeys.length > 0) {
        issues.push(`missing keys: ${file.missingKeys.join(', ')}`);
      }

      if (file.hasBlankToken) {
        issues.push('blank auth.token');
      }

      console.log(`- ${file.relativePath}: ${issues.join('; ')}`);
    });
  }

  console.log(`create-sentry-properties.sh present: ${audit.hasCreateScript ? 'yes' : 'no'}`);
  console.log(`create-sentry-properties.sh requires SENTRY_AUTH_TOKEN: ${audit.createScriptUsesToken ? 'yes' : 'no'}`);
  console.log(`SENTRY_AUTH_TOKEN available in current shell: ${audit.envHasToken ? 'yes' : 'no'}`);

  if (!audit.ready) {
    console.log('Release source-map validation is not ready locally.');
    console.log('Required before claiming Sentry release validation: generate sentry.properties with SENTRY_AUTH_TOKEN.');
  } else {
    console.log('Release source-map prerequisites are present locally.');
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSentryReleasePrerequisites();
  const summary = formatSentryReleasePrereqSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Sentry release prerequisite summary written to ${path.relative(root, summaryPath)}`);
}
