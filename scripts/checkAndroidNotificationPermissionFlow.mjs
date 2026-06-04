import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidNotificationPermissionFlowErrors } from './androidNotificationPermissionFlowGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

const errors = getAndroidNotificationPermissionFlowErrors({
  notificationServiceSource: read('src/services/NotificationServices.tsx'),
  androidManifestSource: read('android/app/src/main/AndroidManifest.xml'),
  notificationServiceTestSource: read('tests/unit/NotificationServices.test.tsx'),
});

if (errors.length > 0) {
  console.error('Android notification permission flow is invalid:');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Android notification permission flow is guarded.');
