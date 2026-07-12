import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const script = packageJson.scripts?.['ios:static:verify'] || '';

const requiredParts = [
  'yarn check:ios-release-readiness-audit-guard',
  'yarn check:ios-release-readiness-summary-guard',
  'yarn ios:release:readiness:audit',
  'yarn ios:release:readiness:check-summary',
  'yarn check:ios-mac-validation-prereq-summary-guard',
  'yarn ios:mac-validation-prereq:audit',
  'yarn ios:mac-validation-prereq:check-summary',
  'yarn check:ios-podfile-refresh-plan-guard',
  'yarn ios:podfile-refresh:plan',
  'yarn ios:podfile-refresh:check-plan',
  'yarn check:ios-mac-validation-handoff-guard',
  'yarn check:ios-validation-handoff-summary-guard',
  'yarn ios:validation:handoff-summary',
  'yarn ios:validation:handoff-summary:check',
  'yarn ios:mac-validation:handoff:preflight:dry-run --all-schemes',
];

const errors = [];

if (!script) {
  errors.push('package.json is missing ios:static:verify');
}

requiredParts.forEach(part => {
  if (!script.includes(part)) {
    errors.push(`ios:static:verify is missing: ${part}`);
  }
});

if (script.includes('xcodebuild') || script.includes(' pod install') || script.includes('bundle exec pod install')) {
  errors.push('ios:static:verify must stay Windows-safe and must not execute xcodebuild or pod install');
}

if (!script.includes('--all-schemes')) {
  errors.push('ios:static:verify must render the macOS handoff for all shared schemes');
}

const assertOrder = (before, after) => {
  const beforeIndex = script.indexOf(before);
  const afterIndex = script.indexOf(after);

  if (beforeIndex === -1 || afterIndex === -1 || beforeIndex >= afterIndex) {
    errors.push(`ios:static:verify must run "${before}" before "${after}"`);
  }
};

assertOrder('yarn ios:podfile-refresh:check-plan', 'yarn check:ios-validation-handoff-summary-guard');
assertOrder('yarn check:ios-validation-handoff-summary-guard', 'yarn ios:validation:handoff-summary');
assertOrder('yarn ios:validation:handoff-summary', 'yarn ios:validation:handoff-summary:check');
assertOrder('yarn ios:validation:handoff-summary:check', 'yarn ios:mac-validation:handoff:preflight:dry-run --all-schemes');

if (errors.length > 0) {
  console.error('iOS static validation script guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('iOS static validation script guard checks are valid.');
