import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getModernizationLogIdReport } from './modernizationLogIdGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logPath = path.join(root, 'docs', 'wallet-modernization-log.md');
const log = readFileSync(logPath, 'utf8');
const report = getModernizationLogIdReport(log);

if (report.unexpectedDuplicates.length > 0) {
  console.error('Unexpected duplicate modernization log entry IDs found:');
  report.unexpectedDuplicates.forEach(({ previous, current }) => {
    console.error(`- ${current.id}: line ${previous.lineNumber} "${previous.title}" and line ${current.lineNumber} "${current.title}"`);
  });
  process.exit(1);
}

if (report.legacyDuplicates.length > 0) {
  console.log(
    `Modernization log entry IDs passed (${report.uniqueCount} unique IDs checked; ${report.legacyDuplicates.length} legacy duplicate IDs allowed).`,
  );
} else {
  console.log(`Modernization log entry IDs are unique (${report.uniqueCount} entries checked).`);
}
