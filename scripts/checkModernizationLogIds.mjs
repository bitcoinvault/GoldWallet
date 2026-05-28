import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logPath = path.join(root, 'docs', 'wallet-modernization-log.md');
const log = readFileSync(logPath, 'utf8');
const headingPattern = /^### (BEM-\d+\.\d+) - (.+)$/gm;
const allowedLegacyDuplicateIds = new Set([
  'BEM-34.2',
  'BEM-34.3',
  'BEM-34.4',
  'BEM-36.12',
  'BEM-36.13',
  'BEM-36.14',
  'BEM-36.15',
  'BEM-36.16',
  'BEM-36.17',
  'BEM-36.18',
  'BEM-36.19',
  'BEM-36.20',
  'BEM-36.72',
  'BEM-36.83',
  'BEM-36.84',
  'BEM-36.85',
  'BEM-36.86',
  'BEM-36.87',
]);
const seen = new Map();
const duplicates = [];
let match;

while ((match = headingPattern.exec(log)) !== null) {
  const [, id, title] = match;
  const lineNumber = log.slice(0, match.index).split(/\r?\n/).length;
  const entry = { id, title, lineNumber };
  const previous = seen.get(id);

  if (previous) {
    duplicates.push({ previous, current: entry });
  } else {
    seen.set(id, entry);
  }
}

if (duplicates.length > 0) {
  const unexpectedDuplicates = duplicates.filter(({ current }) => !allowedLegacyDuplicateIds.has(current.id));

  if (unexpectedDuplicates.length === 0) {
    console.log(
      `Modernization log entry IDs passed (${seen.size} unique IDs checked; ${duplicates.length} legacy duplicate IDs allowed).`,
    );
    process.exit(0);
  }

  console.error('Unexpected duplicate modernization log entry IDs found:');
  unexpectedDuplicates.forEach(({ previous, current }) => {
    console.error(`- ${current.id}: line ${previous.lineNumber} "${previous.title}" and line ${current.lineNumber} "${current.title}"`);
  });
  process.exit(1);
}

console.log(`Modernization log entry IDs are unique (${seen.size} entries checked).`);
