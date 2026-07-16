import { readFileSync } from 'fs';
import path from 'path';

import { resolveAndroidReleaseVersion } from './androidReleaseVersioning.mjs';

export const BUNDLETOOL_VERSION = '1.18.3';
export const BUNDLETOOL_SHA256 = 'a099cfa1543f55593bc2ed16a70a7c67fe54b1747bb7301f37fdfd6d91028e29';
export const supportedAndroidAppBundleVariants = ['dev', 'stage', 'prod', 'beta'];

const variantPackages = {
  dev: 'io.goldwallet.wallet.dev',
  stage: 'io.goldwallet.wallet.stage',
  prod: 'io.goldwallet.wallet',
  beta: 'io.goldwallet.wallet.beta',
};

export const parseAndroidAppBundleVariant = args => {
  const inlineArgument = args.find(argument => argument.startsWith('--variant='));
  const inlineValue = inlineArgument?.split('=', 2)[1];
  const index = args.indexOf('--variant');
  const separateValue = index >= 0 ? args[index + 1] : undefined;

  if ((inlineArgument && !inlineValue) || (index >= 0 && (!separateValue || separateValue.startsWith('--')))) {
    throw new Error('Missing value for --variant');
  }

  const variant = inlineValue || separateValue || 'prod';
  if (!supportedAndroidAppBundleVariants.includes(variant)) {
    throw new Error(`Unsupported Android App Bundle variant: ${variant}`);
  }

  return variant;
};

const readGradleValue = (content, key) => {
  const quoted = content.match(new RegExp(`${key}\\s*=\\s*["']([^"']+)["']|${key}\\s+["']([^"']+)["']`));
  const numeric = content.match(new RegExp(`${key}\\s*=\\s*(\\d+)|${key}\\s+(\\d+)`));

  return quoted?.[1] || quoted?.[2] || numeric?.[1] || numeric?.[2] || '';
};

export const getAndroidAppBundleProjectMetadata = root => {
  const androidBuildGradle = readFileSync(path.join(root, 'android', 'build.gradle'), 'utf8');
  const releaseVersion = resolveAndroidReleaseVersion(root);
  const metadata = {
    versionCode: String(releaseVersion.versionCode),
    versionName: releaseVersion.versionName,
    minSdk: readGradleValue(androidBuildGradle, 'minSdkVersion'),
    targetSdk: readGradleValue(androidBuildGradle, 'targetSdkVersion'),
    buildToolsVersion: readGradleValue(androidBuildGradle, 'buildToolsVersion'),
  };
  const missing = Object.entries(metadata)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Unable to read Android App Bundle project metadata: ${missing.join(', ')}`);
  }

  return metadata;
};

export const getAndroidAppBundleVariantConfig = (root, variant) => {
  if (!supportedAndroidAppBundleVariants.includes(variant)) {
    throw new Error(`Unsupported Android App Bundle variant: ${variant}`);
  }

  const displayName = `${variant}Release`;
  const artifactBase = `android-app-bundle-${variant}-release`;
  const projectMetadata = getAndroidAppBundleProjectMetadata(root);

  return {
    variant,
    displayName,
    gradleTask: `:app:bundle${variant[0].toUpperCase()}${variant.slice(1)}Release`,
    packageName: variantPackages[variant],
    ...projectMetadata,
    aabPath: path.join(
      root,
      'android',
      'app',
      'build',
      'outputs',
      'bundle',
      displayName,
      `app-${variant}-release.aab`,
    ),
    apksPath: path.join(root, 'local-docs', `${artifactBase}.apks`),
    extractionDir: path.join(root, 'local-docs', `${artifactBase}-extracted`),
    universalApkPath: path.join(root, 'local-docs', `${artifactBase}-universal.apk`),
    summaryPath: path.join(root, 'local-docs', `${artifactBase}-summary.txt`),
    validationOnlySummaryPath: path.join(root, 'local-docs', `${artifactBase}-validation-only-summary.txt`),
    smokeArtifactBase: `${artifactBase}-smoke`,
  };
};

export const getAndroidAppBundleSummaryErrors = (summary, config) => {
  const requiredLines = [
    'Android App Bundle validation',
    `Variant: ${config.displayName}`,
    `Package: ${config.packageName}`,
    `Version code: ${config.versionCode}`,
    `Version name: ${config.versionName}`,
    `Minimum SDK: ${config.minSdk}`,
    `Target SDK: ${config.targetSdk}`,
    `Bundletool version: ${BUNDLETOOL_VERSION}`,
    `Bundletool SHA-256: ${BUNDLETOOL_SHA256}`,
    'Bundle validation: passed',
    'Emulator smoke: passed',
    'Production signing/upload: not claimed; local debug keystore used for device proof',
  ];

  const errors = requiredLines
    .filter(line => !summary.includes(line))
    .map(line => `Android App Bundle summary is missing required evidence: ${line}`);

  ['AAB', 'APK Set', 'Universal APK'].forEach(label => {
    if (!new RegExp(`^${label} SHA-256: [a-f0-9]{64}$`, 'm').test(summary)) {
      errors.push(`Android App Bundle summary has an invalid ${label} SHA-256`);
    }
  });

  return errors;
};
