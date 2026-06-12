import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getIosPodfileRefreshPlanErrors } from './iosPodfileRefreshPlanGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const planPath = path.join(root, 'local-docs', 'ios-podfile-refresh-plan.txt');

if (!existsSync(planPath)) {
  console.error(`Missing iOS Podfile.lock refresh plan artifact: ${planPath}`);
  process.exit(1);
}

const plan = readFileSync(planPath, 'utf8');
const errors = getIosPodfileRefreshPlanErrors(plan);

if (errors.length > 0) {
  console.error('iOS Podfile.lock refresh plan artifact is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('iOS Podfile.lock refresh plan artifact is valid.');
