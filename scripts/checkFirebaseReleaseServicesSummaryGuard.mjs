import { getFirebaseReleaseServicesSummaryErrors } from './firebaseReleaseServicesSummaryGuard.mjs';

const validSummary = [
  'Firebase release-services audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'React Native Firebase package version set: 24.0.0',
  'Firebase release-services wiring valid: yes',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Firebase runtime delivery validation: not claimed',
  'Warnings: 0',
  'Wiring errors: 0',
  'Required action: none; Firebase release-services wiring is present locally.',
  '',
].join('\n');

const invalidSummary = [
  'Firebase release-services audit',
  'Generated at: 2026-05-28T00:00:00.000Z',
  'React Native Firebase package version set: 12.7, 13.0',
  'Firebase release-services wiring valid: no',
  'Android release summary present: yes',
  'Android release summary variants: dev, stage, prod, beta',
  'Android release summary required variants covered: yes',
  'Android release summary valid: yes',
  'Android release summary current inputs covered: yes',
  'Android release summary errors: 0',
  'Firebase runtime delivery validation: not claimed',
  'Warnings: 0',
  'Wiring errors: 1',
  '- React Native Firebase package versions are not aligned',
  'Required action: restore Firebase package, Android, iOS, and Messaging wiring before dependency upgrades.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getFirebaseReleaseServicesSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getFirebaseReleaseServicesSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Firebase release-services summary fixture', validSummary);
assertAccepted('Invalid-wiring Firebase release-services summary fixture', invalidSummary);
assertRejected('Missing header fixture', validSummary.replace('Firebase release-services audit', 'Bad header'), 'summary header');
assertRejected('Bad timestamp fixture', validSummary.replace('Generated at: 2026-05-28T00:00:00.000Z', 'Generated at: now'), 'ISO timestamp');
assertRejected(
  'Claimed Firebase runtime delivery fixture',
  validSummary.replace('Firebase runtime delivery validation: not claimed', 'Firebase runtime delivery validation: claimed'),
  'not claimed',
);
assertRejected(
  'Missing release variant fixture',
  validSummary.replace('Android release summary variants: dev, stage, prod, beta', 'Android release summary variants: dev, stage, prod'),
  'beta release evidence',
);
assertRejected(
  'Stale Android release inputs fixture',
  validSummary.replace('Android release summary current inputs covered: yes', 'Android release summary current inputs covered: no'),
  'current release inputs',
);
assertRejected(
  'Missing required action fixture',
  invalidSummary.replace(
    'Required action: restore Firebase package, Android, iOS, and Messaging wiring before dependency upgrades.',
    'Required action: restore Firebase wiring.',
  ),
  'Firebase wiring required action',
);

console.log('Firebase release-services summary guard checks are valid.');
