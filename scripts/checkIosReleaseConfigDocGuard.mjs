import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docPath = path.join(root, 'docs', 'ios-release-config-compatibility-audit.md');
const doc = readFileSync(docPath, 'utf8');

const requiredSnippets = [
  'After `BEM-37.794`',
  '`corepack yarn check:ios-release-config-doc-guard`',
  'Current CodePush posture is removed',
  'iOS Info.plist files no longer contain native `CodePushDeploymentKey` placeholders',
  'CodePush native/runtime integration is removed',
  'macOS with Xcode `16.1+`, CocoaPods, and a refreshed `ios/Podfile.lock`',
  '`ios:mac-validation:handoff:preflight --all-schemes`',
  '`ios:mac-validation:handoff --all-schemes`',
  '`ios/Podfile.lock` still has `12` active drift issues',
  'iOS runtime delivery validation remains not claimed',
  'Sentry source-map/dSYM upload',
  'Do not guess missing DSNs, Firebase files, Sentry credentials, or store metadata values',
];

const forbiddenSnippets = [
  '`feature/bem-codepush-release-path-audit`',
  'validate non-dev CodePush bundle/deployment-key behavior',
  'Start CodePush release-path validation',
  'Validate at least one non-dev build path for Sentry source-map behavior and confirm the intended OTA/update replacement posture',
  'Firebase/Sentry/CodePush wiring',
];

const errors = [];

requiredSnippets.forEach(snippet => {
  if (!doc.includes(snippet)) {
    errors.push(`docs/ios-release-config-compatibility-audit.md is missing: ${snippet}`);
  }
});

forbiddenSnippets.forEach(snippet => {
  if (doc.includes(snippet)) {
    errors.push(`docs/ios-release-config-compatibility-audit.md still contains stale wording: ${snippet}`);
  }
});

if (errors.length > 0) {
  console.error('iOS release-config compatibility documentation guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('iOS release-config compatibility documentation guard is valid.');
