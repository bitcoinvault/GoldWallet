import path from 'path';
import {
  expectedAndroidStoreMetadataLocales,
  expectedStoreMetadataLocales,
  getStoreMetadataReadinessErrors,
  requiredAndroidLocalizedStoreMetadataFiles,
  requiredLocalizedStoreMetadataFiles,
  requiredRootStoreMetadataFiles,
} from './storeMetadataReadinessGuard.mjs';

const files = new Map();
const put = (relativePath, content = 'fixture') => files.set(path.normalize(relativePath), content);

requiredRootStoreMetadataFiles.forEach(fileName => put(path.join('ios', 'fastlane', 'metadata', fileName)));
put(path.join('android', 'app', 'src', 'main', 'ic_launcher-playstore.png'));

expectedAndroidStoreMetadataLocales.forEach(locale => {
  requiredAndroidLocalizedStoreMetadataFiles.forEach(fileName =>
    put(path.join('android', 'fastlane', 'metadata', 'android', locale, fileName)),
  );
  put(path.join('android', 'fastlane', 'metadata', 'android', locale, 'title.txt'), 'GoldWallet - Bitcoin wallet');
  put(path.join('android', 'fastlane', 'metadata', 'android', locale, 'full_description.txt'), 'GoldWallet description baseline');
});

expectedStoreMetadataLocales.forEach(locale => {
  requiredLocalizedStoreMetadataFiles.forEach(fileName => put(path.join('ios', 'fastlane', 'metadata', locale, fileName)));
  put(path.join('ios', 'fastlane', 'metadata', locale, 'name.txt'), 'GoldWallet - Bitcoin wallet');
  put(path.join('ios', 'fastlane', 'metadata', locale, 'privacy_url.txt'), 'http://www.goldwallet.io/privacy.txt');
  put(path.join('ios', 'fastlane', 'metadata', locale, 'support_url.txt'), 'https://github.com/GoldWallet/GoldWallet/issues');
});

put(
  path.join('docs', 'store-metadata-readiness.md'),
  [
    'Scope: `BEM-37.337`, store metadata and rebranding preparation.',
    'Android Fastlane metadata baseline is present under `android/fastlane/metadata/android/en-US`.',
    'Play Console screenshots still need external/store-side verification.',
    '`GoldWallet`',
    '`goldwallet.io`',
    '`https://github.com/GoldWallet/GoldWallet/issues`',
  ].join('\n'),
);
put(path.join('docs', 'rebranding-release-config-readiness.md'), 'Store metadata refresh');
put(path.join('docs', 'wallet-modernization-log.md'), 'BEM-37.337 - Store metadata readiness');

const makeReadFile = sourceFiles => fullPath => {
  const relativePath = path.normalize(fullPath).replace(`${path.normalize('fixture-root')}\\`, '');
  return sourceFiles.get(relativePath) || '';
};

const makeExists = sourceFiles => fullPath => {
  const relativePath = path.normalize(fullPath).replace(`${path.normalize('fixture-root')}\\`, '');
  return sourceFiles.has(relativePath);
};

const run = sourceFiles =>
  getStoreMetadataReadinessErrors({
    root: 'fixture-root',
    readFile: makeReadFile(sourceFiles),
    fileExists: makeExists(sourceFiles),
  });

const assertAccepted = (label, sourceFiles) => {
  const errors = run(sourceFiles);
  if (errors.length > 0) {
    console.error(`${label} should be accepted, but produced errors:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, sourceFiles, expectedError) => {
  const errors = run(sourceFiles);
  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Complete store metadata readiness fixture', files);

const missingLocalizedFile = new Map(files);
missingLocalizedFile.delete(path.normalize(path.join('ios', 'fastlane', 'metadata', 'en-US', 'name.txt')));
assertRejected('Missing localized metadata fixture', missingLocalizedFile, 'ios/fastlane/metadata/en-US/name.txt is missing');

const changedPrivacyBaseline = new Map(files);
changedPrivacyBaseline.set(path.normalize(path.join('ios', 'fastlane', 'metadata', 'en-US', 'privacy_url.txt')), 'https://example.invalid/privacy');
assertRejected('Changed privacy baseline fixture', changedPrivacyBaseline, 'privacy_url.txt no longer records');

const missingAndroidIcon = new Map(files);
missingAndroidIcon.delete(path.normalize(path.join('android', 'app', 'src', 'main', 'ic_launcher-playstore.png')));
assertRejected('Missing Android play icon fixture', missingAndroidIcon, 'android/app/src/main/ic_launcher-playstore.png is missing');

const missingAndroidTitle = new Map(files);
missingAndroidTitle.delete(path.normalize(path.join('android', 'fastlane', 'metadata', 'android', 'en-US', 'title.txt')));
assertRejected(
  'Missing Android metadata fixture',
  missingAndroidTitle,
  'android/fastlane/metadata/android/en-US/title.txt is missing',
);

const changedAndroidTitleBaseline = new Map(files);
changedAndroidTitleBaseline.set(path.normalize(path.join('android', 'fastlane', 'metadata', 'android', 'en-US', 'title.txt')), 'New Wallet');
assertRejected('Changed Android title baseline fixture', changedAndroidTitleBaseline, 'title.txt no longer records');

console.log('Store metadata readiness guard checks are valid.');
