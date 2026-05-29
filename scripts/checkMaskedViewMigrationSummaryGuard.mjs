import { getMaskedViewMigrationSummaryErrors } from './maskedViewMigrationSummaryGuard.mjs';

const validSummary = [
  'Masked-view migration audit',
  'Generated at: 2026-05-29T00:00:00.000Z',
  'Current masked-view package: <removed>',
  'Replacement masked-view package: <not required>',
  '@react-navigation/stack version: 7.9.3',
  'Navigation requires community masked-view path: no',
  'Warning baseline mentions masked-view: no',
  'Masked-view migration baseline stable: yes',
  'Warnings: 0',
  'Errors: 0',
  'Required action: none; masked-view migration is complete after navigation validation.',
].join('\n');

const invalidSummary = validSummary
  .replace('Current masked-view package: <removed>', 'Current masked-view package: @react-native-community/masked-view@0.1.11')
  .replace('Masked-view migration baseline stable: yes', 'Masked-view migration baseline stable: no')
  .replace(
    'Required action: none; masked-view migration is complete after navigation validation.',
    'Required action: restore masked-view migration baseline before merging.',
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
