import { expectedNativeModuleDependencies } from './nativeModuleInventoryGuard.mjs';
import { formatNativeModuleUpgradePlanErrors, getNativeModuleUpgradePlanErrors } from './nativeModuleUpgradePlanGuard.mjs';

const fullPlanFixture = [...expectedNativeModuleDependencies]
  .map(([packageName, expectedVersion]) => `- \`${packageName}\` -> \`${expectedVersion}\``)
  .join('\n');
const missingPlanFixture = fullPlanFixture.replace('- `react-native-webview`', '');
const missingVersionFixture = fullPlanFixture.replace('`react-native-webview` -> `13.16.1`', '`react-native-webview`');

const assertAccepted = (label, planContent) => {
  const errors = getNativeModuleUpgradePlanErrors(planContent);

  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    console.error(formatNativeModuleUpgradePlanErrors(errors));
    process.exit(1);
  }
};

const assertRejected = (label, planContent) => {
  const errors = getNativeModuleUpgradePlanErrors(planContent);

  if (errors.length === 0) {
    console.error(`${label} should be rejected, but produced no errors.`);
    process.exit(1);
  }
};

assertAccepted('Complete native module upgrade plan fixture', fullPlanFixture);
assertRejected('Missing native module upgrade plan fixture', missingPlanFixture);
assertRejected('Missing native module upgrade plan version fixture', missingVersionFixture);

console.log('Native module upgrade plan guard checks are valid.');
