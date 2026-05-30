import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const eslintBin = path.join(root, 'node_modules', 'eslint', 'bin', 'eslint.js');
const outputPath = path.join(root, 'local-docs', 'lint-baseline-summary.txt');

const patterns = ['src/**/*.{js,ts,tsx}', 'tests/**/*.{js,ts,tsx}'];
const result = spawnSync(process.execPath, [eslintBin, ...patterns, '--format', 'json'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

if (result.error) {
  console.error(`Failed to run ESLint: ${result.error.message}`);
  process.exit(1);
}

if (![0, 1].includes(result.status)) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status ?? 1);
}

let report;

try {
  report = JSON.parse(result.stdout || '[]');
} catch (error) {
  console.error(`Failed to parse ESLint JSON output: ${error.message}`);
  process.exit(1);
}

const totals = report.reduce(
  (acc, file) => {
    acc.files += 1;
    acc.errors += file.errorCount;
    acc.warnings += file.warningCount;
    acc.fixableErrors += file.fixableErrorCount;
    acc.fixableWarnings += file.fixableWarningCount;
    return acc;
  },
  { files: 0, errors: 0, warnings: 0, fixableErrors: 0, fixableWarnings: 0 },
);

const filesWithMessages = report
  .filter(file => file.errorCount > 0 || file.warningCount > 0)
  .map(file => {
    const relativePath = path.relative(root, file.filePath);
    return `- ${relativePath}: ${file.errorCount} errors, ${file.warningCount} warnings`;
  });

const summary = [
  'ESLint baseline audit',
  '',
  `Command status: ${result.status}`,
  `Files scanned: ${totals.files}`,
  `Errors: ${totals.errors}`,
  `Warnings: ${totals.warnings}`,
  `Fixable errors: ${totals.fixableErrors}`,
  `Fixable warnings: ${totals.fixableWarnings}`,
  '',
  'Files with findings:',
  ...(filesWithMessages.length > 0 ? filesWithMessages : ['- none']),
  '',
].join('\n');

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, summary);

console.log(summary.trimEnd());

