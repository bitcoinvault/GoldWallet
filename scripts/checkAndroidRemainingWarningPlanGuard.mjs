import { getRemainingWarningPlanErrors } from './androidRemainingWarningPlanGuard.mjs';

const validPlan = [
  '| Package | Warning source | Follow-up |',
  '| --- | --- | --- |',
  '| `@react-native-community/masked-view` | `node_modules/@react-native-community/masked-view/android/build.gradle:47` | dedicated masked-view/navigation migration |',
  '| `react-native-secure-key-store` | `node_modules/react-native-secure-key-store/android/build.gradle:46` | dedicated secure-storage removal after dual-write migration |',
].join('\n');

const invalidPlan = validPlan.replace('dedicated masked-view/navigation migration', 'generic cleanup');
const resolvedPackagePlan = `${validPlan}\n| \`react-native-vector-icons\` | \`node_modules/react-native-vector-icons/android/build.gradle:41\` | already resolved |`;

const assertAccepted = (label, plan) => {
  const errors = getRemainingWarningPlanErrors(plan);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, plan, expectedError) => {
  const errors = getRemainingWarningPlanErrors(plan);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid remaining warning plan', validPlan);
assertRejected('Missing follow-up plan', invalidPlan, 'dedicated masked-view/navigation migration');
assertRejected('Resolved package listed as remaining', resolvedPackagePlan, 'react-native-vector-icons');

console.log('Android remaining warning plan guard checks are valid.');
