import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const checkLightScript = packageJson.scripts['android:dev:check-light'] || '';

const requiredCheckLightScripts = [
  'android:dev:check-warning-guard',
  'android:dev:check-artifact-guard',
  'check:camera-usage-guard',
  'check:camera-usage-scope',
  'check:qr-scan-caller-guard',
  'check:qr-scan-callers',
  'check:qr-render-usage-guard',
  'check:qr-render-usage',
  'check:sentry-usage-guard',
  'check:sentry-usage-scope',
  'check:codepush-usage-guard',
  'check:codepush-usage-scope',
  'check:firebase-usage-guard',
  'check:firebase-usage-scope',
  'check:push-notification-ios-usage-guard',
  'check:push-notification-ios-usage-scope',
  'check:release-service-env-keys-guard',
  'check:release-service-env-keys',
  'check:android-env-config-files-guard',
  'check:android-env-config-files',
  'check:ios-scheme-config-guard',
  'check:ios-scheme-config',
  'check:storage-network-usage-guard',
  'check:storage-network-usage',
  'check:storage-network-validation-scripts-guard',
  'check:storage-network-validation-scripts',
  'check:native-module-inventory-guard',
  'check:native-module-inventory',
  'check:native-module-upgrade-plan-guard',
  'check:native-module-upgrade-plan',
  'check:rn-nodeify-shim-guard',
  'check:rn-nodeify-shims',
  'typescript:check',
  'check:diff-whitespace',
];

const docs = [
  {
    path: 'README.md',
    terms: [
      'android:dev:check-light',
      'CodePush usage',
      'Firebase usage',
      'iOS push notification bridge',
      'release-service env keys',
      'Android env mapping',
      'iOS scheme config mapping',
      'storage/network usage',
      'storage/network validation scripts',
      'native module inventory and upgrade-plan',
    ],
  },
  {
    path: 'docs/android-modernization-workflow.md',
    terms: [
      'CodePush usage guard self-check',
      'Firebase usage guard self-check',
      'iOS push notification usage guard self-check',
      'check:codepush-usage-scope',
      'check:firebase-usage-scope',
      'check:push-notification-ios-usage-scope',
      'check:release-service-env-keys',
      'Android envConfigFiles guard self-check',
      'check:android-env-config-files',
      'iOS scheme config guard self-check',
      'check:ios-scheme-config',
      'storage/network usage guard self-check',
      'check:storage-network-usage',
      'storage/network validation script guard self-check',
      'check:storage-network-validation-scripts',
    ],
  },
  {
    path: 'docs/wallet-modernization-baseline.md',
    terms: [
      'CodePush usage self-check/inventory guard',
      'Firebase usage self-check/inventory guard',
      'iOS push notification usage self-check/inventory guard',
      'release-service env key self-check/guard',
      'Android env mapping self-check/guard',
      'iOS scheme config self-check/guard',
      'storage/network usage self-check/guard',
      'storage/network validation script self-check/guard',
      'Android lightweight check runs',
    ],
  },
];

const errors = [];

requiredCheckLightScripts.forEach(scriptName => {
  if (!checkLightScript.includes(scriptName)) {
    errors.push(`android:dev:check-light is missing ${scriptName}`);
  }
});

docs.forEach(doc => {
  const content = readFileSync(path.join(root, doc.path), 'utf8');

  doc.terms.forEach(term => {
    if (!content.includes(term)) {
      errors.push(`${doc.path} is missing "${term}"`);
    }
  });
});

if (errors.length > 0) {
  console.error('Android lightweight check documentation is stale:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android lightweight check documentation matches the guarded check groups.');
