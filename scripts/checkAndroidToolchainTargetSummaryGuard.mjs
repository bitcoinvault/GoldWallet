import { getAndroidToolchainTargetSummaryErrors } from './androidToolchainTargetSummaryGuard.mjs';

const validSummary = [
  'Android toolchain target audit',
  'Generated at: 2026-06-04T00:00:00.000Z',
  'Current Android Gradle Plugin: 8.13.2',
  'Latest stable Android Gradle Plugin: 9.2.1',
  'Current Gradle wrapper: 8.13',
  'Latest Gradle current: 9.6.1',
  'AGP 9 minimum Gradle wrapper: 9.4.1',
  'Current Kotlin Gradle Plugin: 2.1.20',
  'Latest Kotlin Gradle Plugin: 2.4.0',
  'Latest Kotlin metadata release: 2.4.20-Beta1',
  'Latest Kotlin metadata release prerelease: yes',
  'React Native Gradle plugin: 0.86.0',
  'Direct AGP 9 probe Android Gradle Plugin: 9.2.1',
  'Direct AGP 9 probe Gradle wrapper: 9.6.1',
  'Direct AGP 9 probe Kotlin Gradle Plugin: 2.4.0',
  'Direct AGP 9 probe JDK: 17',
  'Direct AGP 9 probe status: blocked',
  'Direct AGP 9 probe task: :gradle-plugin:settings-plugin:compileKotlin',
  'Direct AGP 9 probe source: node_modules/@react-native/gradle-plugin/settings-plugin/src/main/kotlin/com/facebook/react/ReactSettingsExtension.kt',
  'Direct AGP 9 probe Kotlin runtime metadata: 2.3.0',
  'React Native Gradle plugin Kotlin metadata ceiling: 2.2.0',
  'Direct AGP 9 probe evidence: docs/wallet-modernization-log.md BEM-37.818',
  'Direct AGP 9 probe evidence status: committed',
  'Direct AGP 9 probe evidence required snippets: 8',
  '- AGP `9.2.1`',
  '- Gradle `9.6.1`',
  '- Kotlin `2.4.0`',
  '- JDK 17',
  '- :gradle-plugin:settings-plugin:compileKotlin',
  '- Kotlin metadata `2.3.0`',
  '- up to `2.2.0`',
  '- AGP `8.13.2`, Gradle `8.13`, and Kotlin `2.1.20`',
  'Direct AGP 9 probe evidence missing snippets: 0',
  'Latest Android toolchain target blocked: yes',
  'Blockers: 3',
  '- AGP 9.2.1 requires Gradle 9.4.1 or newer.',
  '- The Gradle 9.4.1+ path is blocked: direct AGP 9.2.1 / Gradle 9.6.1 / Kotlin 2.4.0 probe failed in :gradle-plugin:settings-plugin:compileKotlin while compiling node_modules/@react-native/gradle-plugin/settings-plugin/src/main/kotlin/com/facebook/react/ReactSettingsExtension.kt; Gradle loaded Kotlin runtime metadata 2.3.0, but the React Native Gradle plugin 0.86.0 compiler path can read up to metadata 2.2.0.',
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
assertRejected('Prerelease Kotlin target fixture', validSummary.replace('Latest Kotlin Gradle Plugin: 2.4.0', 'Latest Kotlin Gradle Plugin: 2.4.20-Beta1'), 'latest stable target');
assertRejected(
  'Missing Kotlin metadata release fixture',
  validSummary.replace('Latest Kotlin metadata release: 2.4.20-Beta1', 'Latest Kotlin metadata release: missing'),
  'Latest Kotlin metadata release',
);
assertRejected('Unblocked target fixture', validSummary.replace('Latest Android toolchain target blocked: yes', 'Latest Android toolchain target blocked: no'), 'must stay blocked');
assertRejected('Bad blocker count fixture', validSummary.replace('Blockers: 3', 'Blockers: 2'), 'Blockers count');
assertRejected(
  'Missing RN Gradle plugin blocker fixture',
  validSummary.replace(/React Native Gradle plugin/g, 'RN plugin'),
  'React Native Gradle plugin',
);
assertRejected(
  'Stale latest AGP blocker fixture',
  validSummary.replace('AGP 9.2.1 requires Gradle 9.4.1 or newer.', 'AGP 9.1.0 requires Gradle 9.4.1 or newer.'),
  'latest stable AGP',
);
assertRejected(
  'Stale latest Gradle blocker fixture',
  validSummary.replace('Direct AGP 9 probe Gradle wrapper: 9.6.1', 'Direct AGP 9 probe Gradle wrapper: 9.4.1'),
  'current latest Gradle',
);
assertRejected(
  'Stale validated baseline blocker fixture',
  validSummary.replace('AGP 8.13.2, Gradle 8.13, Kotlin 2.1.20', 'AGP 8.13.2, Gradle 8.13, Kotlin 2.0.21'),
  'validated current AGP, Gradle, and Kotlin baseline',
);
assertRejected(
  'Missing direct probe evidence fixture',
  validSummary.replace('Direct AGP 9 probe evidence: docs/wallet-modernization-log.md BEM-37.818', 'Direct AGP 9 probe evidence: local-only'),
  'committed BEM-37.818 log entry',
);
assertRejected(
  'Missing committed evidence status fixture',
  validSummary.replace('Direct AGP 9 probe evidence status: committed', 'Direct AGP 9 probe evidence status: missing-or-stale'),
  'evidence status must be committed',
);
assertRejected(
  'Missing evidence snippet fixture',
  validSummary.replace('Direct AGP 9 probe evidence missing snippets: 0', 'Direct AGP 9 probe evidence missing snippets: 1\n- Gradle `9.6.1`'),
  'must not have missing snippets',
);
assertRejected(
  'Stale evidence required tuple fixture',
  validSummary.replace('- Gradle `9.6.1`', '- Gradle `9.5.1`'),
  'required snippets must include',
);
assertRejected(
  'Missing direct probe task fixture',
  validSummary.replace(/:gradle-plugin:settings-plugin:compileKotlin/g, ':app:assembleDevDebug'),
  'compileKotlin',
);
assertRejected(
  'Stale direct probe AGP fixture',
  validSummary.replace('Direct AGP 9 probe Android Gradle Plugin: 9.2.1', 'Direct AGP 9 probe Android Gradle Plugin: 9.1.0'),
  'latest stable AGP',
);

console.log('Android toolchain target summary guard checks are valid.');
