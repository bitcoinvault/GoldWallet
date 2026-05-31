/**
 * Global hooks. beforeEach, afterAll and other hooks defined here are applied to any
 * test suite in the project.
 */
import { device } from 'detox';
import dotenv from 'dotenv';

dotenv.config({ path: 'tests/e2e/.env.e2e', quiet: true });

beforeEach(async () => {
  await device.launchApp({
    newInstance: true,
    delete: true,
    //Enable Notifications
    permissions: { notifications: 'YES' },
  });
});

afterAll(async () => {
  await device.terminateApp();
});
