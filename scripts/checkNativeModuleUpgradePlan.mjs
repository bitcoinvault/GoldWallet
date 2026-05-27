import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expectedNativeModuleDependencies } from './nativeModuleInventoryGuard.mjs';
import { formatNativeModuleUpgradePlanErrors, getNativeModuleUpgradePlanErrors } from './nativeModuleUpgradePlanGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'docs', 'native-module-upgrade-plan.md');
const plan = readFileSync(planPath, 'utf8');
const errors = getNativeModuleUpgradePlanErrors(plan);

if (errors.length > 0) {
  console.error(formatNativeModuleUpgradePlanErrors(errors));
  process.exit(1);
}

console.log(`Native module upgrade plan covers ${expectedNativeModuleDependencies.size} tracked dependencies.`);
