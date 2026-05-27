import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { expectedNativeModuleDependencies } from './nativeModuleInventoryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'docs', 'native-module-upgrade-plan.md');
const plan = readFileSync(planPath, 'utf8');

const missingPackages = [...expectedNativeModuleDependencies.keys()].filter(packageName => !plan.includes(`\`${packageName}\``));

if (missingPackages.length > 0) {
  console.error('Native module upgrade plan is missing inventory packages:');
  missingPackages.forEach(packageName => console.error(`- ${packageName}`));
  process.exit(1);
}

console.log(`Native module upgrade plan covers ${expectedNativeModuleDependencies.size} tracked dependencies.`);
