import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSentryReleaseIntegrationErrors } from './sentryReleaseIntegrationGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const errors = getSentryReleaseIntegrationErrors({
  androidBuildGradle: readFileSync(path.join(root, 'android', 'app', 'build.gradle'), 'utf8'),
  iosProject: readFileSync(
    path.join(root, 'ios', 'GoldWallet.xcodeproj', 'project.pbxproj'),
    'utf8',
  ),
});

if (errors.length > 0) {
  console.error('Sentry release integration guard failed:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Sentry release integration is wired for Android Gradle and iOS source-map/dSYM phases.');
