import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'secure-storage-migration-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};
const scripts = packageJson.scripts || {};

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

export const collectSecureStorageMigrationAudit = () => {
  const errors = [];
  const warnings = [];
  const currentVersion = dependencies['react-native-secure-key-store'];
  const replacementVersion = '10.0.0';
  const secureStorageService = requireFile(errors, 'src/services/SecureStorageService.ts');
  const authSagas = requireFile(errors, 'src/state/authentication/sagas.ts');
  const unlockTransaction = requireFile(errors, 'src/screens/UnlockTransaction.tsx');
  const factoryReset = requireFile(errors, 'src/helpers/factoryReset.ts');
  const warningBaseline = requireFile(errors, 'local-docs/android-warning-audit-summary.txt');
  const storageAudit = requireFile(errors, 'docs/storage-network-native-compatibility-audit.md');
  const followupPlan = requireFile(errors, 'docs/android-warning-baseline-followups.md');

  if (currentVersion !== '2.0.10') {
    errors.push(`package.json has react-native-secure-key-store@${currentVersion || '<missing>'}; expected 2.0.10`);
  }

  if (dependencies['react-native-keychain']) {
    warnings.push('react-native-keychain is already installed; verify the old secure-key-store dependency is deliberately migrated.');
  }

  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, "from 'react-native-secure-key-store'");
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY');
  requireSnippet(errors, 'SecureStorageService.ts', secureStorageService, 'sha256(value).toString()');
  requireSnippet(errors, 'authentication sagas', authSagas, 'CONST.pin');
  requireSnippet(errors, 'authentication sagas', authSagas, 'CONST.transactionPassword');
  requireSnippet(errors, 'UnlockTransaction.tsx', unlockTransaction, 'checkSecuredPassword(CONST.transactionPassword');
  requireSnippet(errors, 'factoryReset.ts', factoryReset, 'removeSecuredPassword(CONST.pin)');
  requireSnippet(errors, 'factoryReset.ts', factoryReset, 'removeSecuredPassword(CONST.transactionPassword)');
  requireSnippet(errors, 'docs/storage-network-native-compatibility-audit.md', storageAudit, 'react-native-secure-key-store latest: 2.0.10');
  requireSnippet(errors, 'docs/android-warning-baseline-followups.md', followupPlan, 'dedicated secure-storage replacement');

  if (
    scripts['test:storage-network:focused'] !==
    'yarn test:secure-storage:unit && yarn test:storage && yarn test:authenticator && yarn test:wallet-core:offline'
  ) {
    errors.push('test:storage-network:focused must keep secure-storage, storage, authenticator, and wallet-core offline checks grouped');
  }

  if (!warningBaseline.includes('react-native-secure-key-store')) {
    warnings.push('local Android warning audit summary does not mention react-native-secure-key-store; refresh the warning audit before migration.');
  }

  return {
    currentPackage: `react-native-secure-key-store@${currentVersion || '<missing>'}`,
    replacementPackage: `react-native-keychain@${replacementVersion}`,
    serviceFile: 'src/services/SecureStorageService.ts',
    storesPin: authSagas.includes('CONST.pin') && factoryReset.includes('CONST.pin'),
    storesTransactionPassword:
      authSagas.includes('CONST.transactionPassword') &&
      unlockTransaction.includes('CONST.transactionPassword') &&
      secureStorageService.includes('sha256(value).toString()'),
    focusedValidation: 'test:storage-network:focused',
    warningBaselineMentionsSecureStorage: warningBaseline.includes('react-native-secure-key-store'),
    errors,
    warnings,
    baselineStable: errors.length === 0,
  };
};

export const formatSecureStorageMigrationSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Secure-storage migration audit',
    `Generated at: ${generatedAt}`,
    `Current secure-storage package: ${audit.currentPackage}`,
    `Replacement secure-storage package: ${audit.replacementPackage}`,
    `SecureStorageService file: ${audit.serviceFile}`,
    `Stores PIN: ${audit.storesPin ? 'yes' : 'no'}`,
    `Stores transaction password hash: ${audit.storesTransactionPassword ? 'yes' : 'no'}`,
    `Focused validation script: ${audit.focusedValidation}`,
    `Warning baseline mentions secure-key-store: ${audit.warningBaselineMentionsSecureStorage ? 'yes' : 'no'}`,
    `Secure-storage migration baseline stable: ${audit.baselineStable ? 'yes' : 'no'}`,
    `Warnings: ${audit.warnings.length}`,
  ];

  audit.warnings.forEach(warning => lines.push(`- ${warning}`));
  lines.push(`Errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.baselineStable
      ? 'Required action: none; secure-storage migration baseline is stable for a dedicated storage validation branch.'
      : 'Required action: restore secure-storage migration baseline before replacing the dependency.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Secure-storage migration audit');
  console.log(`Current package: ${audit.currentPackage}`);
  console.log(`Replacement target: ${audit.replacementPackage}`);
  console.log(`Focused validation: ${audit.focusedValidation}`);

  if (audit.warnings.length > 0) {
    console.log('Warnings:');
    audit.warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (audit.errors.length > 0) {
    console.log('Secure-storage migration baseline needs review:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Secure-storage migration baseline is stable for a dedicated storage validation branch.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectSecureStorageMigrationAudit();
  const summary = formatSecureStorageMigrationSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Secure-storage migration summary written to ${path.relative(root, summaryPath)}`);
}
