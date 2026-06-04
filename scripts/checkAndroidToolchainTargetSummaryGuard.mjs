import { getAndroidToolchainTargetSummaryErrors } from './androidToolchainTargetSummaryGuard.mjs';

const validSummary = [
  'Android toolchain target audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'Current Android Gradle Plugin: 8.13.2',
  'Latest stable Android Gradle Plugin: 9.2.1',
  'Current Gradle wrapper: 8.13',
  'Latest Gradle current: 9.5.1',
  'AGP 9 minimum Gradle wrapper: 9.4.1',
  'Current Kotlin Gradle Plugin: 2.1.20',
  'Latest Kotlin Gradle Plugin: 2.4.0',
  'React Native Gradle plugin: 0.85.3',
  'Latest Android toolchain target blocked: yes',
  'Blockers: 3',
  '- AGP 9.2.1 requires Gradle 9.4.1 or newer.',
  '- Gradle 9.4.1 and 9.5.1 load Kotlin 2.3.x runtime metadata that the React Native Gradle plugin 0.85.3 Kotlin compiler path cannot read during :gradle-plugin:settings-plugin:compileKotlin.',
  '- The validated Android baseline remains AGP 8.13.2, Gradle 8.13, Kotlin 2.1.20, compile/target SDK 36, and JDK 17 until a newer React Native Gradle plugin baseline clears the blocker.',
  'Required action: keep the validated AGP 8.13 Android baseline until a React Native Gradle plugin baseline can compile against AGP 9 / Gradle 9, then rerun Android assemble, release validation, and emulator smoke.',
  '',
].join('\n');

const assertAccepted = (label, summary) => {
  const errors = getAndroidToolchainTargetSummaryErrors(summary);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, summary, expectedError) => {
  const errors = getAndroidToolchainTargetSummaryErrors(summary);

  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Android toolchain target fixture', validSummary);
assertRejected('Bad header fixture', validSummary.replace('Android toolchain target audit', 'Bad header'), 'summary header');
assertRejected('Bad current AGP fixture', validSummary.replace('Current Android Gradle Plugin: 8.13.2', 'Current Android Gradle Plugin: 9.2.1'), '8.13.2');
assertRejected('Bad Gradle fixture', validSummary.replace('Current Gradle wrapper: 8.13', 'Current Gradle wrapper: 9.4.1'), '8.13');
assertRejected('Unblocked target fixture', validSummary.replace('Latest Android toolchain target blocked: yes', 'Latest Android toolchain target blocked: no'), 'must stay blocked');
assertRejected('Bad blocker count fixture', validSummary.replace('Blockers: 3', 'Blockers: 2'), 'Blockers count');
assertRejected(
  'Missing RN Gradle plugin blocker fixture',
  validSummary.replace(/React Native Gradle plugin/g, 'RN plugin'),
  'React Native Gradle plugin',
);

console.log('Android toolchain target summary guard checks are valid.');
