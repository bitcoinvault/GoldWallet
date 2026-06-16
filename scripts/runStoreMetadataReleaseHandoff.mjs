import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getStoreMetadataReadinessErrors } from './storeMetadataReadinessGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputPath = path.join(root, 'local-docs', 'store-metadata-release-handoff.txt');

const defaultOptions = {
  dryRun: false,
  platform: 'all',
};

const platforms = new Set(['all', 'android', 'ios']);
const secretPattern =
  /SENTRY_DSN|SENTRY_AUTH_TOKEN|CODEPUSH_DEPLOYMENT_KEY|auth\.token|AIza[0-9A-Za-z_-]{10,}|plane_api_|Bearer\s+[A-Za-z0-9._-]+/i;

const usage = [
  'Usage: node scripts/runStoreMetadataReleaseHandoff.mjs [--dry-run] [--platform all|android|ios]',
  '',
  'Examples:',
  '  node scripts/runStoreMetadataReleaseHandoff.mjs --dry-run',
  '  node scripts/runStoreMetadataReleaseHandoff.mjs --platform android',
  '  node scripts/runStoreMetadataReleaseHandoff.mjs',
].join('\n');

const quoteArg = arg => {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(arg)) {
    return arg;
  }

  return `"${arg.replace(/"/g, '\\"')}"`;
};

const yarnStep = (label, script, args = []) => ({
  label,
  command: 'corepack',
  args: ['yarn', script, ...args],
  cwd: root,
});

export const renderStoreMetadataReleaseHandoffCommand = step => {
  const command = [step.command, ...step.args].map(quoteArg).join(' ');
  const cwd = step.cwd === root ? '.' : path.relative(root, step.cwd).replace(/\\/g, '/');

  return [`cwd=${cwd}`, command].join(' ');
};

export const getStoreMetadataReleaseHandoffCommands = () => [
  yarnStep('Validate store metadata release handoff guard', 'check:store-metadata-release-handoff-guard'),
  yarnStep('Validate store metadata readiness guard', 'check:store-metadata-readiness-guard'),
  yarnStep('Validate store metadata readiness', 'check:store-metadata-readiness'),
  yarnStep('Validate explorer/env readiness', 'check:explorer-env-config-readiness'),
  yarnStep('Validate rebranding release-config readiness', 'check:rebranding-release-config-readiness'),
  yarnStep('Validate Android env mapping', 'check:android-env-config-files'),
  yarnStep('Validate iOS scheme mapping', 'check:ios-scheme-config'),
  yarnStep('Render store metadata release handoff dry run', 'store-metadata:release-handoff:dry-run'),
];

const getExternalChecklist = platform => {
  const checklist = [];

  if (platform === 'all' || platform === 'android') {
    checklist.push(
      'Play Console: confirm GoldWallet live title, short description, full description, icon, screenshots, privacy URL, support URL, and release notes.',
      'Play Console: confirm screenshots match the final app name, explorer/network wording, and current wallet runtime.',
    );
  }

  if (platform === 'all' || platform === 'ios') {
    checklist.push(
      'App Store Connect: confirm localized names, subtitles, descriptions, keywords, promotional text, release notes, screenshots, privacy URL, support URL, and marketing URL.',
      'App Store Connect: confirm iOS screenshots and review metadata without printing review credentials or private contact values.',
    );
  }

  checklist.push(
    'Release owner: confirm final app name, legal owner, privacy/support URLs, explorer/network wording, and screenshot set before publishing store changes.',
  );

  return checklist;
};

export const getStoreMetadataReleaseHandoffOptionErrors = (options = defaultOptions) => {
  const errors = [];

  if (typeof options.dryRun !== 'boolean') {
    errors.push('dryRun must be a boolean');
  }

  if (!platforms.has(options.platform)) {
    errors.push(`platform must be one of ${[...platforms].join(', ')}`);
  }

  return errors;
};

export const getStoreMetadataReleaseHandoffSummary = ({
  options = defaultOptions,
  rootPath = root,
  generatedAt = new Date().toISOString(),
} = {}) => {
  options = { ...defaultOptions, ...options };
  const readinessErrors = getStoreMetadataReadinessErrors({ root: rootPath });
  const readinessValid = readinessErrors.length === 0;
  const commands = getStoreMetadataReleaseHandoffCommands();
  const checklist = getExternalChecklist(options.platform);

  return [
    'Store metadata release handoff',
    `Generated at: ${generatedAt}`,
    `Platform scope: ${options.platform}`,
    `Store metadata readiness valid: ${readinessValid ? 'yes' : 'no'}`,
    'External store validation: not claimed',
    options.platform === 'ios' ? 'Play Console live listing validation: not in scope' : 'Play Console live listing validation: required',
    options.platform === 'android'
      ? 'App Store Connect live listing validation: not in scope'
      : 'App Store Connect live listing validation: required',
    'Store screenshots validation: required',
    'Secret values printed: no',
    'Local validation commands:',
    ...commands.map((step, index) => `${index + 1}. ${step.label}\n   ${renderStoreMetadataReleaseHandoffCommand(step)}`),
    'External verification checklist:',
    ...checklist.map(item => `- ${item}`),
    `Store metadata readiness errors: ${readinessErrors.length}`,
    ...readinessErrors.map(error => `- ${error}`),
    'Required action: verify live store listings and screenshots externally before release; do not claim store-side validation from repo-only checks.',
    '',
  ].join('\n');
};

export const getStoreMetadataReleaseHandoffErrors = summary => {
  const errors = [];

  if (!summary.startsWith('Store metadata release handoff')) {
    errors.push('Store metadata release handoff summary must start with the expected heading');
  }

  [
    'External store validation: not claimed',
    'Store screenshots validation: required',
    'Secret values printed: no',
    'Play Console',
    'App Store Connect',
    'Required action: verify live store listings and screenshots externally before release',
  ].forEach(expected => {
    if (!summary.includes(expected)) {
      errors.push(`Store metadata release handoff summary is missing: ${expected}`);
    }
  });

  getStoreMetadataReleaseHandoffCommands().forEach(step => {
    const rendered = renderStoreMetadataReleaseHandoffCommand(step);
    if (!summary.includes(rendered)) {
      errors.push(`Store metadata release handoff summary is missing command: ${rendered}`);
    }
  });

  if (secretPattern.test(summary)) {
    errors.push('Store metadata release handoff summary must not print secret-looking values');
  }

  return errors;
};

const parseArgs = argv => {
  const options = { ...defaultOptions };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--platform') {
      options.platform = argv[++index] || '';
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      options.unknown = arg;
    }
  }

  return options;
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

  const optionErrors = getStoreMetadataReleaseHandoffOptionErrors(options);
  if (optionErrors.length > 0) {
    optionErrors.forEach(error => console.error(error));
    console.error(usage);
    return 1;
  }

  const summary = getStoreMetadataReleaseHandoffSummary({ options });
  const summaryErrors = getStoreMetadataReleaseHandoffErrors(summary);

  if (summaryErrors.length > 0) {
    console.error('Store metadata release handoff is invalid:');
    summaryErrors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  if (options.dryRun) {
    console.log(summary.trim());
    return 0;
  }

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, summary);
  console.log(summary.trim());
  console.log(`Store metadata release handoff written to ${path.relative(root, outputPath)}`);

  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
