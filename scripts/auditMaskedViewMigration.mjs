import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'masked-view-migration-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};

const requireFile = (errors, relativePath) => {
  if (!exists(relativePath)) {
    errors.push(`${relativePath} is missing`);
    return '';
  }

  return read(relativePath);
};

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

const requireMissingSnippet = (errors, label, content, snippet) => {
  if (content.includes(snippet)) {
    errors.push(`${label} still contains "${snippet}"`);
  }
};

const getPackageVersion = packageName => {
  const packagePath = path.join(root, 'node_modules', ...packageName.split('/'), 'package.json');

  if (!existsSync(packagePath)) {
    return '<missing>';
  }

  return JSON.parse(readFileSync(packagePath, 'utf8')).version;
};

export const collectMaskedViewMigrationAudit = () => {
  const errors = [];
  const warnings = [];
  const currentVersion = dependencies['@react-native-community/masked-view'];
  const navigationStackPackage = JSON.parse(requireFile(errors, 'node_modules/@react-navigation/stack/package.json') || '{}');
  const warningBaseline = requireFile(errors, 'local-docs/android-warning-audit-summary.txt');
  const navigationPlan = requireFile(errors, 'docs/navigation-native-compatibility-audit.md');
  const followupPlan = requireFile(errors, 'docs/android-warning-baseline-followups.md');

  if (currentVersion) {
    errors.push(`package.json still has @react-native-community/masked-view@${currentVersion}; expected removal after navigation migration`);
  }

  requireMissingSnippet(errors, '@react-navigation/stack package.json', JSON.stringify(navigationStackPackage), '@react-native-community/masked-view');
  requireSnippet(errors, 'docs/navigation-native-compatibility-audit.md', navigationPlan, '@react-navigation/stack@7.9.3');
  requireSnippet(errors, 'docs/android-warning-baseline-followups.md', followupPlan, 'react-native-secure-key-store');

  if (warningBaseline.includes('@react-native-community\\masked-view') || warningBaseline.includes('@react-native-community/masked-view')) {
    warnings.push('local Android warning audit summary still mentions masked-view; refresh the warning audit after migration.');
  }

  if (dependencies['@react-native-masked-view/masked-view']) {
    warnings.push('@react-native-masked-view/masked-view is installed even though React Navigation 7 does not require it.');
  }

  return {
    currentPackage: currentVersion ? `@react-native-community/masked-view@${currentVersion}` : '<removed>',
    replacementPackage: dependencies['@react-native-masked-view/masked-view'] || '<not required>',
    navigationStackVersion: navigationStackPackage.version || getPackageVersion('@react-navigation/stack'),
    navigationRequiresCommunityPath: JSON.stringify(navigationStackPackage).includes('@react-native-community/masked-view'),
    warningBaselineMentionsMaskedView:
      warningBaseline.includes('@react-native-community\\masked-view') || warningBaseline.includes('@react-native-community/masked-view'),
    errors,
    warnings,
    baselineStable: errors.length === 0,
  };
};

export const formatMaskedViewMigrationSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Masked-view migration audit',
    `Generated at: ${generatedAt}`,
    `Current masked-view package: ${audit.currentPackage}`,
    `Replacement masked-view package: ${audit.replacementPackage}`,
    `@react-navigation/stack version: ${audit.navigationStackVersion}`,
    `Navigation requires community masked-view path: ${audit.navigationRequiresCommunityPath ? 'yes' : 'no'}`,
    `Warning baseline mentions masked-view: ${audit.warningBaselineMentionsMaskedView ? 'yes' : 'no'}`,
    `Masked-view migration baseline stable: ${audit.baselineStable ? 'yes' : 'no'}`,
    `Warnings: ${audit.warnings.length}`,
  ];

  audit.warnings.forEach(warning => lines.push(`- ${warning}`));
  lines.push(`Errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.baselineStable
      ? 'Required action: none; masked-view migration is complete after navigation validation.'
      : 'Required action: restore masked-view migration baseline before merging.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Masked-view migration audit');
  console.log(`Current package: ${audit.currentPackage}`);
  console.log(`Replacement target: ${audit.replacementPackage}`);
  console.log(`@react-navigation/stack: ${audit.navigationStackVersion}`);

  if (audit.warnings.length > 0) {
    console.log('Warnings:');
    audit.warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (audit.errors.length > 0) {
    console.log('Masked-view migration baseline needs review:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Masked-view migration is complete after navigation validation.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectMaskedViewMigrationAudit();
  const summary = formatMaskedViewMigrationSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Masked-view migration summary written to ${path.relative(root, summaryPath)}`);
}
