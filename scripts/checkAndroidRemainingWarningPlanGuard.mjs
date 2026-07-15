import { getRemainingWarningPlanErrors } from './androidRemainingWarningPlanGuard.mjs';

const validPlan = [
  '# Android Warning Baseline Follow-ups',
  'Targeted Android Gradle warnings: 0',
  'No targeted Android Gradle warning sources remain.',
].join('\n');

if (getRemainingWarningPlanErrors(validPlan).length > 0) throw new Error('Valid zero-warning plan was rejected');
const stalePlan = `${validPlan}\n| \`react-native-secure-key-store\` | old warning | resolved |`;
if (!getRemainingWarningPlanErrors(stalePlan).some(error => error.includes('react-native-secure-key-store'))) {
  throw new Error('Stale secure-storage warning row was accepted');
}
if (!getRemainingWarningPlanErrors(validPlan.replace('warnings: 0', 'warnings: 1')).some(error => error.includes('zero targeted'))) {
  throw new Error('Non-zero warning count was accepted');
}
console.log('Android remaining warning plan guard checks are valid.');
