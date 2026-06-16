import { existsSync, readFileSync } from 'fs';
import path from 'path';

export const expectedStoreMetadataLocales = ['da', 'en-US', 'es-ES', 'no', 'pt-BR', 'pt-PT', 'ru', 'sv'];
export const expectedAndroidStoreMetadataLocales = ['en-US'];

export const requiredLocalizedStoreMetadataFiles = [
  'name.txt',
  'subtitle.txt',
  'description.txt',
  'keywords.txt',
  'promotional_text.txt',
  'release_notes.txt',
  'privacy_url.txt',
  'support_url.txt',
  'marketing_url.txt',
  'apple_tv_privacy_policy.txt',
];

export const requiredRootStoreMetadataFiles = [
  'app_icon.jpg',
  'watch_icon.jpg',
  'copyright.txt',
  'primary_category.txt',
  'primary_first_sub_category.txt',
  'primary_second_sub_category.txt',
  'secondary_category.txt',
  'secondary_first_sub_category.txt',
  'secondary_second_sub_category.txt',
];

export const requiredAndroidLocalizedStoreMetadataFiles = [
  'title.txt',
  'short_description.txt',
  'full_description.txt',
];

export const requiredStoreMetadataDocSnippets = [
  ['docs/store-metadata-readiness.md', 'Scope: `BEM-37.337`, store metadata and rebranding preparation.'],
  ['docs/store-metadata-readiness.md', 'Android Fastlane metadata baseline is present under `android/fastlane/metadata/android/en-US`.'],
  ['docs/store-metadata-readiness.md', 'Play Console screenshots still need external/store-side verification.'],
  ['docs/store-metadata-readiness.md', '`GoldWallet`'],
  ['docs/store-metadata-readiness.md', '`Bitcoin & Lightning`'],
  ['docs/store-metadata-readiness.md', '`goldwallet.io`'],
  ['docs/store-metadata-readiness.md', '`https://github.com/GoldWallet/GoldWallet/issues`'],
  ['docs/rebranding-release-config-readiness.md', 'Store metadata refresh'],
  ['docs/wallet-modernization-log.md', 'BEM-37.337 - Store metadata readiness'],
];

const normalizePath = relativePath => relativePath.split('/').join(path.sep);

export const getStoreMetadataReadinessErrors = ({ root, readFile = readFileSync, fileExists = existsSync }) => {
  const errors = [];
  const metadataRoot = path.join(root, 'ios', 'fastlane', 'metadata');
  const androidMetadataRoot = path.join(root, 'android', 'fastlane', 'metadata', 'android');

  requiredRootStoreMetadataFiles.forEach(fileName => {
    const fullPath = path.join(metadataRoot, fileName);
    if (!fileExists(fullPath)) {
      errors.push(`ios/fastlane/metadata/${fileName} is missing`);
    }
  });

  expectedStoreMetadataLocales.forEach(locale => {
    requiredLocalizedStoreMetadataFiles.forEach(fileName => {
      const fullPath = path.join(metadataRoot, locale, fileName);
      if (!fileExists(fullPath)) {
        errors.push(`ios/fastlane/metadata/${locale}/${fileName} is missing`);
      }
    });

    const namePath = path.join(metadataRoot, locale, 'name.txt');
    const privacyPath = path.join(metadataRoot, locale, 'privacy_url.txt');
    const supportPath = path.join(metadataRoot, locale, 'support_url.txt');

    if (fileExists(namePath) && !readFile(namePath, 'utf8').includes('GoldWallet')) {
      errors.push(`ios/fastlane/metadata/${locale}/name.txt no longer records the pre-rebrand GoldWallet baseline`);
    }

    if (fileExists(privacyPath) && !readFile(privacyPath, 'utf8').includes('goldwallet.io')) {
      errors.push(`ios/fastlane/metadata/${locale}/privacy_url.txt no longer records the pre-rebrand goldwallet.io baseline`);
    }

    if (fileExists(supportPath) && !readFile(supportPath, 'utf8').includes('https://github.com/GoldWallet/GoldWallet/issues')) {
      errors.push(`ios/fastlane/metadata/${locale}/support_url.txt no longer records the pre-rebrand GitHub issues baseline`);
    }
  });

  const androidPlayIconPath = path.join(root, 'android', 'app', 'src', 'main', 'ic_launcher-playstore.png');
  if (!fileExists(androidPlayIconPath)) {
    errors.push('android/app/src/main/ic_launcher-playstore.png is missing');
  }

  expectedAndroidStoreMetadataLocales.forEach(locale => {
    requiredAndroidLocalizedStoreMetadataFiles.forEach(fileName => {
      const fullPath = path.join(androidMetadataRoot, locale, fileName);
      if (!fileExists(fullPath)) {
        errors.push(`android/fastlane/metadata/android/${locale}/${fileName} is missing`);
      }
    });

    const titlePath = path.join(androidMetadataRoot, locale, 'title.txt');
    const shortDescriptionPath = path.join(androidMetadataRoot, locale, 'short_description.txt');
    const descriptionPath = path.join(androidMetadataRoot, locale, 'full_description.txt');

    if (fileExists(titlePath) && !readFile(titlePath, 'utf8').includes('GoldWallet')) {
      errors.push(`android/fastlane/metadata/android/${locale}/title.txt no longer records the pre-rebrand GoldWallet baseline`);
    }

    if (fileExists(shortDescriptionPath) && !readFile(shortDescriptionPath, 'utf8').includes('Bitcoin & Lightning')) {
      errors.push(
        `android/fastlane/metadata/android/${locale}/short_description.txt no longer records the pre-rebrand Bitcoin & Lightning baseline`,
      );
    }

    if (fileExists(descriptionPath) && !readFile(descriptionPath, 'utf8').includes('GoldWallet')) {
      errors.push(`android/fastlane/metadata/android/${locale}/full_description.txt no longer records the pre-rebrand GoldWallet baseline`);
    }
  });

  requiredStoreMetadataDocSnippets.forEach(([relativePath, snippet]) => {
    const fullPath = path.join(root, normalizePath(relativePath));
    const content = fileExists(fullPath) ? readFile(fullPath, 'utf8') : '';

    if (!content.includes(snippet)) {
      errors.push(`${relativePath} is missing "${snippet}"`);
    }
  });

  return errors;
};
