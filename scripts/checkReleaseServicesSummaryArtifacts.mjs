import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidReleaseApkManifestErrors } from './checkAndroidReleaseApkManifest.mjs';
import { getAndroidCreateWalletSmokeSummaryErrors } from './checkAndroidCreateWalletSmokeSummary.mjs';
import {
  getAndroidReleaseNoNetworkSmokeEvidenceOptions,
  getAndroidReleaseSmokeEvidenceOptions,
} from './androidReleaseSmokeEvidence.mjs';
import { getAndroidReleaseSummaryErrors } from './androidReleaseSummaryGuard.mjs';
import { getAndroidEmbeddedSmokeSummaryErrors, getAndroidNoNetworkSmokeSummaryErrors } from './androidSmokeSummaryGuard.mjs';
import { getAndroidReleaseNetworkBlockerSummaryErrors } from './androidReleaseNetworkBlockerSummaryGuard.mjs';
import { getCodePushMigrationReadinessSummaryErrors } from './codePushMigrationReadinessSummaryGuard.mjs';
import { getCodePushRemovalReadinessSummaryErrors } from './codePushRemovalReadinessSummaryGuard.mjs';
import { getCodePushReleasePathSummaryErrors } from './codePushReleasePathSummaryGuard.mjs';
import { getCodePushEnvCleanupReadinessSummaryErrors } from './codePushEnvCleanupReadinessSummaryGuard.mjs';
import { getCodePushDecisionHandoffErrors } from './codePushDecisionHandoffGuard.mjs';
import { getCodePushUpdateValidationHandoffSummaryErrors } from './codePushUpdateValidationHandoffSummaryGuard.mjs';
import { getFirebaseReleaseServicesSummaryErrors } from './firebaseReleaseServicesSummaryGuard.mjs';
import { getIosMacValidationPrereqSummaryErrors } from './iosMacValidationPrereqSummaryGuard.mjs';
import { getIosPodfileRefreshPlanErrors } from './iosPodfileRefreshPlanGuard.mjs';
import { getIosReleaseReadinessSummaryErrors } from './iosReleaseReadinessSummaryGuard.mjs';
import { getIosValidationHandoffSummaryErrors } from './iosValidationHandoffSummaryGuard.mjs';
import { getPushNotificationBridgeSummaryErrors } from './pushNotificationBridgeSummaryGuard.mjs';
import { getSentryAndroidWarningSummaryErrors } from './sentryAndroidWarningSummaryGuard.mjs';
import { getSentryReleaseCredentialPlanErrors } from './sentryReleaseCredentialPlanGuard.mjs';
import { getSentryReleasePrereqSummaryErrors } from './sentryReleasePrereqSummaryGuard.mjs';
import { getSentryReleaseValidationHandoffSummaryErrors } from './sentryReleaseValidationHandoffSummaryGuard.mjs';
import { getSentryRnBundleTaskCompatibilitySummaryErrors } from './sentryRnBundleTaskCompatibilitySummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const noNetworkSmokeSummaryRelativePath = 'local-docs/android-smoke-dev-release-no-network-summary.txt';
const networkBlockerSummaryRelativePath = 'local-docs/android-release-network-blocker-summary.txt';
const controlledElectrumBlockerOutcome = 'blocked-by-electrum-certificate-expired';
const allowedControlledNetworkBlockerErrors = [
  'Android release smoke: Expected line not found: Android smoke outcome: passed',
  'Android release smoke: Expected line not found: Android smoke exit code: 0',
  'Android release smoke: Expected line not found: Android smoke reason: expected UI texts found and no fatal/runtime logcat findings',
  'Android release smoke: Closed first-run success must be yes. Received: no',
  'Android release smoke: Validated empty-dashboard CTA flow must be yes. Received: no',
  'Android release smoke: Validated empty-tab navigation must be yes. Received: no',
  'Android release smoke: Validated QR scanner screen must be yes. Received: no',
  'Android release smoke: Validated settings Terms WebView must be yes. Received: no',
  'Android release create-wallet smoke: Source APK bytes does not match the current file size',
  'Android release create-wallet smoke: Source APK sha256 does not match the current file digest',
  'Android release create-wallet smoke: Expected line not found: Android create-wallet smoke outcome: passed',
  'Android release create-wallet smoke: Expected line not found: Android create-wallet smoke exit code: 0',
  'Android release create-wallet smoke: Expected line not found: Standard wallet created: yes',
  'Android release create-wallet smoke: Expected line not found: Standard mnemonic screen reached: yes',
  'Android release create-wallet smoke: Expected line not found: Vault next-step reached: yes',
  'Android release create-wallet smoke: Expected line not found: No create-wallet error UI: yes',
  'Android release create-wallet smoke: Expected line not found: Fatal/runtime logcat findings: no',
  'Android release create-wallet smoke: App PID must be a positive integer',
  'Android release create-wallet smoke: Captured logcat lines must be a positive integer',
];

export const releaseServicesSummaryArtifacts = [
  {
    label: 'Android release summary',
    relativePath: 'local-docs/android-release-dev-summary.txt',
    getErrors: (summary, rootPath) => getAndroidReleaseSummaryErrors(summary, rootPath),
  },
  {
    label: 'Android release APK manifest',
    relativePath: 'local-docs/android-release-dev-summary.txt',
    getErrors: (_summary, rootPath) => getAndroidReleaseApkManifestErrors({ root: rootPath }),
  },
  {
    label: 'Android release smoke',
    relativePath: 'local-docs/android-smoke-dev-release-summary.txt',
    getErrors: (summary, rootPath) => getAndroidEmbeddedSmokeSummaryErrors(summary, getAndroidReleaseSmokeEvidenceOptions(rootPath)),
  },
  {
    label: 'Android release create-wallet smoke',
    relativePath: 'local-docs/android-create-wallet-smoke-dev-release-summary.txt',
    getErrors: (summary, rootPath) =>
      getAndroidCreateWalletSmokeSummaryErrors(summary, {
        expectedApkPath: path.join(rootPath, 'local-docs', 'android-smoke-dev-release-signed.apk'),
        expectedArtifactBase: 'android-create-wallet-smoke-dev-release',
      }),
  },
  {
    label: 'Sentry release prerequisite',
    relativePath: 'local-docs/sentry-release-prereq-summary.txt',
    getErrors: getSentryReleasePrereqSummaryErrors,
  },
  {
    label: 'Sentry release credential plan',
    relativePath: 'local-docs/sentry-release-credential-plan.txt',
    getErrors: getSentryReleaseCredentialPlanErrors,
  },
  {
    label: 'Sentry release validation handoff',
    relativePath: 'local-docs/sentry-release-validation-handoff-summary.txt',
    getErrors: getSentryReleaseValidationHandoffSummaryErrors,
  },
  {
    label: 'Sentry Android warning',
    relativePath: 'local-docs/sentry-android-warning-summary.txt',
    getErrors: getSentryAndroidWarningSummaryErrors,
  },
  {
    label: 'Sentry RN bundle task compatibility',
    relativePath: 'local-docs/sentry-rn-bundle-task-compatibility-summary.txt',
    getErrors: getSentryRnBundleTaskCompatibilitySummaryErrors,
  },
  {
    label: 'Firebase release-services',
    relativePath: 'local-docs/firebase-release-services-summary.txt',
    getErrors: getFirebaseReleaseServicesSummaryErrors,
  },
  {
    label: 'CodePush release path',
    relativePath: 'local-docs/codepush-release-path-summary.txt',
    getErrors: getCodePushReleasePathSummaryErrors,
  },
  {
    label: 'CodePush migration readiness',
    relativePath: 'local-docs/codepush-migration-readiness-summary.txt',
    getErrors: getCodePushMigrationReadinessSummaryErrors,
  },
  {
    label: 'CodePush removal readiness',
    relativePath: 'local-docs/codepush-removal-readiness-summary.txt',
    getErrors: getCodePushRemovalReadinessSummaryErrors,
  },
  {
    label: 'CodePush env cleanup readiness',
    relativePath: 'local-docs/codepush-env-cleanup-readiness-summary.txt',
    getErrors: getCodePushEnvCleanupReadinessSummaryErrors,
  },
  {
    label: 'CodePush decision handoff',
    relativePath: 'local-docs/codepush-decision-handoff.txt',
    getErrors: getCodePushDecisionHandoffErrors,
  },
  {
    label: 'CodePush update validation handoff',
    relativePath: 'local-docs/codepush-update-validation-handoff-summary.txt',
    getErrors: getCodePushUpdateValidationHandoffSummaryErrors,
  },
  {
    label: 'push notification bridge',
    relativePath: 'local-docs/push-notification-bridge-summary.txt',
    getErrors: getPushNotificationBridgeSummaryErrors,
  },
  {
    label: 'iOS release readiness',
    relativePath: 'local-docs/ios-release-static-readiness-summary.txt',
    getErrors: getIosReleaseReadinessSummaryErrors,
  },
  {
    label: 'iOS macOS validation prerequisites',
    relativePath: 'local-docs/ios-mac-validation-prereqs-summary.txt',
    getErrors: getIosMacValidationPrereqSummaryErrors,
  },
  {
    label: 'iOS Podfile refresh plan',
    relativePath: 'local-docs/ios-podfile-refresh-plan.txt',
    getErrors: getIosPodfileRefreshPlanErrors,
  },
  {
    label: 'iOS validation handoff',
    relativePath: 'local-docs/ios-validation-handoff-summary.txt',
    getErrors: getIosValidationHandoffSummaryErrors,
  },
];

export const getReleaseServicesSummaryArtifactErrors = ({ rootPath = root } = {}) => {
  const state = getReleaseServicesSummaryArtifactState({ rootPath });

  return state.status === 'invalid' ? state.errors : [];
};

const readSummaryArtifact = (rootPath, relativePath) => {
  const summaryPath = path.join(rootPath, relativePath);

  if (!existsSync(summaryPath)) {
    return null;
  }

  return readFileSync(summaryPath, 'utf8');
};

const getControlledElectrumBlockerErrors = rootPath => {
  const errors = [];
  const noNetworkSummary = readSummaryArtifact(rootPath, noNetworkSmokeSummaryRelativePath);
  const networkBlockerSummary = readSummaryArtifact(rootPath, networkBlockerSummaryRelativePath);

  if (!noNetworkSummary) {
    errors.push(`Android release no-network smoke summary artifact is missing at ${noNetworkSmokeSummaryRelativePath}`);
  } else {
    getAndroidNoNetworkSmokeSummaryErrors(noNetworkSummary, getAndroidReleaseNoNetworkSmokeEvidenceOptions(rootPath)).forEach(
      error => errors.push(`Android release no-network smoke: ${error}`),
    );
  }

  if (!networkBlockerSummary) {
    errors.push(`Android release network blocker summary artifact is missing at ${networkBlockerSummaryRelativePath}`);
  } else {
    getAndroidReleaseNetworkBlockerSummaryErrors(networkBlockerSummary).forEach(error => {
      errors.push(`Android release network blocker: ${error}`);
    });

    if (!networkBlockerSummary.includes(`Release blocker outcome: ${controlledElectrumBlockerOutcome}`)) {
      errors.push(`Android release network blocker outcome must be ${controlledElectrumBlockerOutcome}`);
    }
  }

  return errors;
};

const isControlledElectrumBlockerError = error =>
  allowedControlledNetworkBlockerErrors.some(allowedError => error.includes(allowedError));

export const getReleaseServicesSummaryArtifactState = ({ rootPath = root } = {}) => {
  const errors = [];

  releaseServicesSummaryArtifacts.forEach(summary => {
    const summaryContent = readSummaryArtifact(rootPath, summary.relativePath);

    if (!summaryContent) {
      errors.push(`${summary.label} summary artifact is missing at ${summary.relativePath}`);
      return;
    }

    summary.getErrors(summaryContent, rootPath).forEach(error => {
      errors.push(`${summary.label}: ${error}`);
    });
  });

  if (errors.length === 0) {
    return {
      errors: [],
      status: 'ready',
    };
  }

  const unexpectedErrors = errors.filter(error => !isControlledElectrumBlockerError(error));

  if (unexpectedErrors.length > 0) {
    return {
      errors,
      status: 'invalid',
    };
  }

  const blockerErrors = getControlledElectrumBlockerErrors(rootPath);

  if (blockerErrors.length > 0) {
    return {
      errors: [...errors, ...blockerErrors],
      status: 'invalid',
    };
  }

  return {
    errors,
    status: controlledElectrumBlockerOutcome,
  };
};

const main = () => {
  const state = getReleaseServicesSummaryArtifactState();

  if (state.status === 'invalid') {
    console.error('Release-services summary artifacts are invalid:');
    state.errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  if (state.status === controlledElectrumBlockerOutcome) {
    console.log(`Release-services summary artifacts are valid under controlled blocker: ${controlledElectrumBlockerOutcome}.`);
    console.log('Full release and release create-wallet runtime proof remain unclaimed until the dev/testnet Electrum TLS certificate is fixed.');
    return 0;
  }

  console.log('Release-services summary artifacts are valid.');
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main());
}
