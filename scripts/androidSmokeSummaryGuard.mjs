import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync } from 'fs';

export const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}:`));

  return line ? line.slice(label.length + 1).trim() : '';
};

const hasLine = (content, expectedLine) => content.split(/\r?\n/).includes(expectedLine);

const isIsoTimestamp = value => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value);

const isPositiveInteger = value => /^\d+$/.test(value) && Number(value) > 0;

const isPositiveNumber = value => /^\d+(?:\.\d+)?$/.test(value) && Number(value) > 0;

const isExistingFile = (filePath, requireNonEmpty = false) => {
  if (!filePath || !existsSync(filePath)) {
    return false;
  }

  return !requireNonEmpty || statSync(filePath).size > 0;
};

const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');

const parseCsvLine = value =>
  (value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const requireLineValue = (summary, label, expectedValue, errors) => {
  const actualValue = getLineValue(summary, label);

  if (actualValue !== expectedValue) {
    errors.push(`${label} must be ${expectedValue}. Received: ${actualValue || 'missing'}`);
  }
};

const requireCsvItems = (summary, label, expectedItems, errors) => {
  const actualItems = parseCsvLine(getLineValue(summary, label));
  const missingItems = expectedItems.filter(expectedItem => !actualItems.includes(expectedItem));

  if (missingItems.length > 0) {
    errors.push(`${label} is missing embedded smoke value(s): ${missingItems.join(', ')}`);
  }
};

const requireFileEvidence = (summary, { pathLabel, bytesLabel, shaLabel, expectedPath }, errors) => {
  const filePath = getLineValue(summary, pathLabel);
  const bytes = getLineValue(summary, bytesLabel);
  const sha256 = getLineValue(summary, shaLabel);

  if (!filePath) {
    errors.push(`${pathLabel} is missing`);
    return;
  }

  if (expectedPath && filePath !== expectedPath) {
    errors.push(`${pathLabel} must be ${expectedPath}. Received: ${filePath}`);
  }

  if (!isExistingFile(filePath, true)) {
    errors.push(`${pathLabel} must point to a non-empty file`);
    return;
  }

  const actualBytes = statSync(filePath).size;
  if (!isPositiveInteger(bytes)) {
    errors.push(`${bytesLabel} must be a positive integer. Received: ${bytes || 'missing'}`);
  } else if (Number(bytes) !== actualBytes) {
    errors.push(`${bytesLabel} does not match the current file size for ${filePath}`);
  }

  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    errors.push(`${shaLabel} must be a lowercase SHA-256 digest. Received: ${sha256 || 'missing'}`);
  } else {
    const actualSha256 = fileSha256(filePath);
    if (sha256 !== actualSha256) {
      errors.push(`${shaLabel} does not match the current file digest for ${filePath}`);
    }
  }
};

const requireDataStoragePreflight = (summary, errors) => {
  const preflight = getLineValue(summary, 'Data storage preflight');
  const availableKilobytes = getLineValue(summary, 'Data storage available KiB');
  const requiredKilobytes = getLineValue(summary, 'Data storage required KiB');
  const multiplier = getLineValue(summary, 'Data storage multiplier');

  if (preflight !== 'passed') {
    errors.push(`Data storage preflight must be passed. Received: ${preflight || 'missing'}`);
  }

  if (!isPositiveInteger(availableKilobytes)) {
    errors.push(`Data storage available KiB must be a positive integer. Received: ${availableKilobytes || 'missing'}`);
  }

  if (!isPositiveInteger(requiredKilobytes)) {
    errors.push(`Data storage required KiB must be a positive integer. Received: ${requiredKilobytes || 'missing'}`);
  }

  if (isPositiveInteger(availableKilobytes) && isPositiveInteger(requiredKilobytes)) {
    if (Number(availableKilobytes) < Number(requiredKilobytes)) {
      errors.push(
        `Data storage available KiB must be greater than or equal to required KiB. Received: ${availableKilobytes} < ${requiredKilobytes}`,
      );
    }
  }

  if (!isPositiveNumber(multiplier)) {
    errors.push(`Data storage multiplier must be a positive number. Received: ${multiplier || 'missing'}`);
  }
};

export const getAndroidSmokeSummaryErrors = (summary, options = {}) => {
  const errors = [];

  if (!isIsoTimestamp(getLineValue(summary, 'Generated at'))) {
    errors.push('Generated at must be an ISO timestamp');
  }

  [
    'Android smoke outcome: passed',
    'Android smoke exit code: 0',
    'Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  ].forEach(expectedLine => {
    if (!hasLine(summary, expectedLine)) {
      errors.push(`Expected line not found: ${expectedLine}`);
    }
  });

  const metroRequired = getLineValue(summary, 'Metro required');
  const metroReachable = getLineValue(summary, 'Metro reachable');
  const clearedAppData = getLineValue(summary, 'Cleared app data');

  if (!['yes', 'no'].includes(metroRequired)) {
    errors.push(`Metro required must be yes or no. Received: ${metroRequired || 'missing'}`);
  }

  if (!['yes', 'no'].includes(metroReachable)) {
    errors.push(`Metro reachable must be yes or no. Received: ${metroReachable || 'missing'}`);
  }

  if (metroRequired === 'yes' && metroReachable !== 'yes') {
    errors.push('Metro must be reachable when the smoke requires Metro');
  }

  if (clearedAppData && !['yes', 'no'].includes(clearedAppData)) {
    errors.push(`Cleared app data must be yes or no when present. Received: ${clearedAppData}`);
  }

  ['App PID', 'Captured logcat lines', 'UI hierarchy attempts', 'Screenshot bytes'].forEach(label => {
    if (!isPositiveInteger(getLineValue(summary, label))) {
      errors.push(`${label} must be a positive integer`);
    }
  });

  if (!getLineValue(summary, 'Android serial')) {
    errors.push('Android serial is missing');
  }

  const requiredRuntimePageSize = getLineValue(summary, 'Required runtime page size bytes');
  const runtimePageSize = getLineValue(summary, 'Runtime page size bytes');
  const runtimePageSizeCheck = getLineValue(summary, 'Runtime page size check');
  if (!isPositiveInteger(runtimePageSize)) {
    errors.push(`Runtime page size bytes must be a positive integer. Received: ${runtimePageSize || 'missing'}`);
  }
  if (requiredRuntimePageSize === 'not required') {
    if (runtimePageSizeCheck !== 'not required') {
      errors.push(`Runtime page size check must be not required. Received: ${runtimePageSizeCheck || 'missing'}`);
    }
  } else if (!isPositiveInteger(requiredRuntimePageSize)) {
    errors.push(
      `Required runtime page size bytes must be a positive integer or not required. Received: ${requiredRuntimePageSize || 'missing'}`,
    );
  } else if (runtimePageSize !== requiredRuntimePageSize || runtimePageSizeCheck !== 'passed') {
    errors.push('Required Android runtime page size must match the observed page size and pass');
  }
  if (options.expectedRuntimePageSize) {
    const expectedRuntimePageSize = String(options.expectedRuntimePageSize);
    if (
      requiredRuntimePageSize !== expectedRuntimePageSize ||
      runtimePageSize !== expectedRuntimePageSize ||
      runtimePageSizeCheck !== 'passed'
    ) {
      errors.push(`Android runtime smoke must prove page size ${expectedRuntimePageSize}`);
    }
  }

  if (!getLineValue(summary, 'Android package')) {
    errors.push('Android package is missing');
  }

  if (!getLineValue(summary, 'Expected UI texts')) {
    errors.push('Expected UI texts are missing');
  }

  const expectedResourceIds = getLineValue(summary, 'Expected resource IDs');
  const validatedEmptyDashboardCtaFlow = getLineValue(summary, 'Validated empty-dashboard CTA flow');
  const validatedEmptyTabNavigation = getLineValue(summary, 'Validated empty-tab navigation');
  const validatedQrScannerScreen = getLineValue(summary, 'Validated QR scanner screen');
  const validatedSettingsTermsWebView = getLineValue(summary, 'Validated settings Terms WebView');

  if (!expectedResourceIds) {
    errors.push('Expected resource IDs are missing');
  } else if (
    expectedResourceIds !== 'none' &&
    expectedResourceIds.split(',').some(resourceId => !/^[a-zA-Z0-9._:-]+$/.test(resourceId.trim()))
  ) {
    errors.push(`Expected resource IDs contains an invalid value: ${expectedResourceIds}`);
  }

  if (!['yes', 'no'].includes(validatedEmptyDashboardCtaFlow)) {
    errors.push(
      `Validated empty-dashboard CTA flow must be yes or no. Received: ${validatedEmptyDashboardCtaFlow || 'missing'}`,
    );
  }

  if (!['yes', 'no'].includes(validatedEmptyTabNavigation)) {
    errors.push(
      `Validated empty-tab navigation must be yes or no. Received: ${validatedEmptyTabNavigation || 'missing'}`,
    );
  }

  if (!['yes', 'no'].includes(validatedQrScannerScreen)) {
    errors.push(`Validated QR scanner screen must be yes or no. Received: ${validatedQrScannerScreen || 'missing'}`);
  }

  if (!['yes', 'no'].includes(validatedSettingsTermsWebView)) {
    errors.push(
      `Validated settings Terms WebView must be yes or no. Received: ${validatedSettingsTermsWebView || 'missing'}`,
    );
  }

  if (!isExistingFile(getLineValue(summary, 'UI hierarchy path'), true)) {
    errors.push('UI hierarchy path must point to a non-empty file');
  }

  if (!isExistingFile(getLineValue(summary, 'Screenshot path'), true)) {
    errors.push('Screenshot path must point to a non-empty file');
  }

  if (options.requireSmokeApkDigest) {
    requireFileEvidence(
      summary,
      {
        pathLabel: 'Smoke APK path',
        bytesLabel: 'Smoke APK bytes',
        shaLabel: 'Smoke APK sha256',
        expectedPath: options.expectedSmokeApkPath,
      },
      errors,
    );
  }

  if (options.requireSourceApkDigest) {
    requireFileEvidence(
      summary,
      {
        pathLabel: 'Source APK path',
        bytesLabel: 'Source APK bytes',
        shaLabel: 'Source APK sha256',
        expectedPath: options.expectedSourceApkPath,
      },
      errors,
    );
  }

  if (options.requireDataStoragePreflight) {
    requireDataStoragePreflight(summary, errors);
  }

  return errors;
};

export const getAndroidEmbeddedSmokeSummaryErrors = (summary, options = {}) => {
  const errors = getAndroidSmokeSummaryErrors(summary, options);
  const { expectedArtifactBase } = options;

  if (expectedArtifactBase) {
    requireLineValue(summary, 'Artifact base', expectedArtifactBase, errors);
  }

  [
    ['Metro required', 'no'],
    ['Cleared app data', 'yes'],
    ['Accepted first-run terms', 'yes'],
    ['Completed first-run PIN', 'yes'],
    ['Completed first-run transaction password', 'yes'],
    ['Skipped first-run email', 'yes'],
    ['Closed first-run success', 'yes'],
    ['Validated empty-dashboard CTA flow', 'yes'],
    ['Validated empty-tab navigation', 'yes'],
    ['Validated QR scanner screen', 'yes'],
    ['Validated settings Terms WebView', 'yes'],
  ].forEach(([label, expectedValue]) => requireLineValue(summary, label, expectedValue, errors));

  requireCsvItems(
    summary,
    'Expected UI texts',
    ['Wallets', 'No wallets', 'Create new wallet', 'Import wallet'],
    errors,
  );
  requireCsvItems(
    summary,
    'Expected resource IDs',
    ['dashboard-header', 'no-wallets-icon', 'create-wallet-button', 'import-wallet-button', 'navigation-tab-0'],
    errors,
  );

  return errors;
};

export const getAndroidNoNetworkSmokeSummaryErrors = (summary, options = {}) => {
  const errors = getAndroidSmokeSummaryErrors(summary, options);
  const { expectedArtifactBase } = options;

  if (expectedArtifactBase) {
    requireLineValue(summary, 'Artifact base', expectedArtifactBase, errors);
  }

  [
    ['Metro required', 'no'],
    ['Cleared app data', 'yes'],
    ['Accepted first-run terms', 'yes'],
    ['Completed first-run PIN', 'yes'],
    ['Completed first-run transaction password', 'yes'],
    ['Skipped first-run email', 'yes'],
    ['Closed first-run success', 'no'],
    ['Validated empty-dashboard CTA flow', 'no'],
    ['Validated empty-tab navigation', 'no'],
    ['Validated QR scanner screen', 'no'],
    ['Validated settings Terms WebView', 'no'],
  ].forEach(([label, expectedValue]) => requireLineValue(summary, label, expectedValue, errors));

  requireCsvItems(summary, 'Expected UI texts', ['No network'], errors);
  requireLineValue(summary, 'Expected resource IDs', 'none', errors);

  return errors;
};

export const assertAndroidSmokeSummary = summary => {
  const errors = getAndroidSmokeSummaryErrors(summary);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
};
