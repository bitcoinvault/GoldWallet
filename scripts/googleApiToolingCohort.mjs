import assert from 'assert';
import { readFileSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

import { androidpublisher, auth as publisherAuth } from '@googleapis/androidpublisher';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relativePath => JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
const require = createRequire(import.meta.url);
const { google } = require('googleapis');

export const assertGoogleApiToolingCohort = () => {
  const packageJson = readJson('package.json');
  const publisherManifest = readJson('node_modules/@googleapis/androidpublisher/package.json');
  const googleApisManifest = readJson('node_modules/googleapis/package.json');

  assert.strictEqual(packageJson.devDependencies['@googleapis/androidpublisher'], '37.0.0');
  assert.strictEqual(packageJson.devDependencies.googleapis, '174.0.1');
  assert.strictEqual(packageJson.dependencies?.['@googleapis/androidpublisher'], undefined);
  assert.strictEqual(packageJson.dependencies?.googleapis, undefined);
  assert.strictEqual(publisherManifest.version, '37.0.0');
  assert.strictEqual(googleApisManifest.version, '174.0.1');
  assert.strictEqual(publisherManifest.dependencies['googleapis-common'], '^8.0.0');
  assert.strictEqual(googleApisManifest.dependencies['googleapis-common'], '^8.0.0');

  const playAuth = new publisherAuth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const playClient = androidpublisher({ version: 'v3', auth: playAuth });
  for (const [name, method] of [
    ['edits.insert', playClient.edits.insert],
    ['edits.bundles.upload', playClient.edits.bundles.upload],
    ['edits.tracks.get', playClient.edits.tracks.get],
    ['edits.tracks.update', playClient.edits.tracks.update],
    ['edits.validate', playClient.edits.validate],
    ['edits.commit', playClient.edits.commit],
    ['edits.delete', playClient.edits.delete],
  ]) {
    assert.strictEqual(typeof method, 'function', `Android Publisher client must expose ${name}`);
  }

  const gmailAuth = new google.auth.OAuth2('fixture-client', 'fixture-secret', 'http://localhost');
  assert.strictEqual(typeof gmailAuth.generateAuthUrl, 'function');
  assert.strictEqual(typeof gmailAuth.getToken, 'function');
  assert.strictEqual(typeof gmailAuth.setCredentials, 'function');
  const authorizationUrl = gmailAuth.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
  assert(authorizationUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth?'));
  gmailAuth.setCredentials({ access_token: 'fixture-access-token' });
  assert.strictEqual(gmailAuth.credentials.access_token, 'fixture-access-token');

  return {
    androidPublisherVersion: publisherManifest.version,
    googleApisVersion: googleApisManifest.version,
  };
};
