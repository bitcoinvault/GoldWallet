import { getMaskedViewMigrationSummaryErrors } from './maskedViewMigrationSummaryGuard.mjs';

const validSummary = [
  'Masked-view migration audit',
  'Generated at: 2026-05-29T00:00:00.000Z',
  'Current masked-view package: @react-native-community/masked-view@0.1.11',
  'Replacement masked-view package: @react-native-masked-view/masked-view@0.3.2',
  '@react-navigation/stack version: 5.14.9',
  'Navigation requires community masked-view path: yes',
  'Warning baseline mentions masked-view: yes',
  'Masked-view migration baseline stable: yes',
  'Warnings: 1',
  '- local Android warning audit summary does not mention masked-view; refresh the warning audit before migration.',
  'Errors: 0',
  'Required action: none; masked-view migration baseline is stable for a dedicated navigation validation branch.',
].join('\n');

const invalidSummary = validSummary
  .replace('Current masked-view package: @react-native-community/masked-view@0.1.11', 'Current masked-view package: <missing>')
  .replace('Masked-view migration baseline stable: yes', 'Masked-view migration baseline stable: no')
  .replace(
    'Required action: none; masked-view migration baseline is stable for a dedicated navigation validation branch.',
    'Required action: restore masked-view migration baseline before replacing the dependency.',
  );

const assertAccepted = (label, summary) => {
  const errors = getMaskedViewMigrationSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getMaskedViewMigrationSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid masked-view migration summary fixture', validSummary);
assertRejected('Invalid masked-view package fixture', invalidSummary, 'Current masked-view package');
assertRejected('Missing header fixture', validSummary.replace('Masked-view migration audit', 'Bad header'), 'summary header');

console.log('Masked-view migration summary guard checks are valid.');
