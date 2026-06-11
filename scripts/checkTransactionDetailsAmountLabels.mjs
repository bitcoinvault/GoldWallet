import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'src', 'screens', 'TransactionDetailsScreen.tsx');
const source = readFileSync(sourcePath, 'utf8');

const blockedAmountBlock = source.match(/transaction\.blockedAmount !== undefined && \(([\s\S]*?)\n\s*\)\}/);
const unblockedAmountBlock = source.match(/transaction\.unblockedAmount !== undefined && \(([\s\S]*?)\n\s*\)\}/);
const errors = [];

if (!blockedAmountBlock) {
  errors.push('TransactionDetailsScreen blockedAmount render block is missing.');
} else if (!blockedAmountBlock[1].includes('i18n.transactions.details.blocked')) {
  errors.push('TransactionDetailsScreen blockedAmount render block must use the blocked label.');
}

if (!unblockedAmountBlock) {
  errors.push('TransactionDetailsScreen unblockedAmount render block is missing.');
} else {
  if (!unblockedAmountBlock[1].includes('i18n.transactions.details.unblocked')) {
    errors.push('TransactionDetailsScreen unblockedAmount render block must use the unblocked label.');
  }

  if (unblockedAmountBlock[1].includes('i18n.transactions.details.blocked')) {
    errors.push('TransactionDetailsScreen unblockedAmount render block must not use the blocked label.');
  }
}

if (errors.length > 0) {
  console.error('Transaction details amount label guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Transaction details amount labels are valid.');
