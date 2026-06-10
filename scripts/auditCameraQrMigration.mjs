import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { collectCameraCandidateAudit } from './auditCameraCandidates.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'camera-qr-migration-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(root, relativePath));
const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};

const requireSnippet = (errors, label, content, snippet) => {
  if (!content.includes(snippet)) {
    errors.push(`${label} is missing "${snippet}"`);
  }
};

const requireFile = (errors, relativePath) => {
  if (!exists(relativePath)) {
    errors.push(`${relativePath} is missing`);
    return '';
  }

  return read(relativePath);
};

export const collectCameraQrMigrationAudit = () => {
  const errors = [];
  const readinessIssues = [];
  const warnings = [];
  const cameraCandidateAudit = collectCameraCandidateAudit();
  const cameraVersion = dependencies['react-native-camera'];
  const cameraKitVersion = dependencies['react-native-camera-kit'];
  const localQrImageVersion = dependencies['@remobile/react-native-qrcode-local-image'];
  const qrRendererVersion = dependencies['react-native-qrcode-svg'];
  const qrNativeRendererVersion = dependencies['react-native-svg'];
  const rootQrcodeVersion = (packageJson.resolutions || {}).qrcode;

  if (cameraVersion) {
    readinessIssues.push(`package.json still has react-native-camera@${cameraVersion}; expected removal after CameraKit QR migration`);
  }

  if (cameraKitVersion !== '18.0.0') {
    readinessIssues.push(`package.json has react-native-camera-kit@${cameraKitVersion || '<missing>'}; expected 18.0.0`);
  }

  if (localQrImageVersion) {
    readinessIssues.push(
      `package.json still has @remobile/react-native-qrcode-local-image@${localQrImageVersion}; expected removal after QR scanner migration`,
    );
  }

  if (qrRendererVersion !== '6.3.21') {
    readinessIssues.push(`package.json has react-native-qrcode-svg@${qrRendererVersion || '<missing>'}; expected current QR renderer baseline 6.3.21`);
  }

  if (qrNativeRendererVersion !== '15.15.5') {
    readinessIssues.push(`package.json has react-native-svg@${qrNativeRendererVersion || '<missing>'}; expected current QR native renderer baseline 15.15.5`);
  }

  if (rootQrcodeVersion !== '1.5.4') {
    readinessIssues.push(`package.json resolutions has qrcode@${rootQrcodeVersion || '<missing>'}; expected current RN 0.86 QR renderer baseline 1.5.4`);
  }

  const androidAppGradle = requireFile(errors, 'android/app/build.gradle');
  const androidManifest = requireFile(errors, 'android/app/src/main/AndroidManifest.xml');
  const scanQrScreen = requireFile(errors, 'src/screens/ScanQrCodeScreen.tsx');
  const reactNativeConfig = requireFile(errors, 'react-native.config.js');
  const replacementPlan = requireFile(errors, 'docs/camera-replacement-plan.md');
  const nativeModulePlan = requireFile(errors, 'docs/native-module-upgrade-plan.md');
  const warningBaseline = requireFile(errors, 'local-docs/android-warning-audit-summary.txt');
  const iosPodfileLock = requireFile(errors, 'ios/Podfile.lock');
  const iosInfoPlists = ['ios/GoldWallet/Info.plist', 'ios/GoldWalletDev-Info.plist', 'ios/GoldWalletStage-Info.plist'];
  const staleRemovedIosPods = [
    'react-native-camera',
    'react-native-qrcode-local-image',
  ].filter(podName => iosPodfileLock.includes(podName));
  const iosPodfileLockRefreshRequired = staleRemovedIosPods.length > 0;

  if (androidAppGradle.includes("missingDimensionStrategy 'react-native-camera', 'general'")) {
    errors.push("android/app/build.gradle still contains missingDimensionStrategy 'react-native-camera', 'general'");
  }

  requireSnippet(errors, 'AndroidManifest.xml', androidManifest, 'android.permission.CAMERA');
  requireSnippet(errors, 'ScanQrCodeScreen.tsx', scanQrScreen, "from 'react-native-camera-kit'");
  requireSnippet(errors, 'ScanQrCodeScreen.tsx', scanQrScreen, 'PermissionsAndroid.request');
  requireSnippet(errors, 'ScanQrCodeScreen.tsx', scanQrScreen, 'scanBarcode');
  requireSnippet(errors, 'ScanQrCodeScreen.tsx', scanQrScreen, "allowedBarcodeTypes={['qr']}");
  requireSnippet(errors, 'ScanQrCodeScreen.tsx', scanQrScreen, 'onReadCode={this.onBarCodeScanned}');
  requireSnippet(errors, 'ScanQrCodeScreen.tsx', scanQrScreen, 'onBarCodeScan(data)');
  if (reactNativeConfig.includes("'@remobile/react-native-qrcode-local-image'")) {
    errors.push('react-native.config.js still disables Android autolinking for removed @remobile/react-native-qrcode-local-image');
  }
  requireSnippet(errors, 'react-native.config.js', reactNativeConfig, 'android: null');
  requireSnippet(errors, 'docs/camera-replacement-plan.md', replacementPlan, 'Branch: `feature/bem-37-camera-kit-qr-proof`');
  requireSnippet(errors, 'docs/camera-replacement-plan.md', replacementPlan, 'VisionCamera');
  requireSnippet(errors, 'docs/camera-replacement-plan.md', replacementPlan, 'Current scanner package: `react-native-camera-kit@18.0.0`');
  requireSnippet(errors, 'docs/native-module-upgrade-plan.md', nativeModulePlan, '`react-native-camera-kit` -> `18.0.0`');

  iosInfoPlists.forEach(relativePath => {
    requireSnippet(errors, relativePath, requireFile(errors, relativePath), 'NSCameraUsageDescription');
  });

  if (warningBaseline && /react-native-camera[\\/]android/.test(warningBaseline)) {
    warnings.push('local Android warning audit summary still mentions react-native-camera; refresh the warning audit after migration.');
  }

  if (iosPodfileLockRefreshRequired) {
    readinessIssues.push(`ios/Podfile.lock still references removed camera pods: ${staleRemovedIosPods.join(', ')}`);
  }

  return {
    cameraVersion,
    cameraKitVersion,
    localQrImageVersion,
    qrRendererVersion,
    qrNativeRendererVersion,
    rootQrcodeVersion,
    cameraKitLatest: cameraCandidateAudit.cameraKitLatest,
    cameraKitPeerRanges: cameraCandidateAudit.cameraKitPeerRanges,
    qrRendererLatest: cameraCandidateAudit.qrRendererLatest,
    qrRendererPeerRanges: cameraCandidateAudit.qrRendererPeerRanges,
    qrRendererDependencies: cameraCandidateAudit.qrRendererDependencies,
    qrNativeRendererLatest: cameraCandidateAudit.qrNativeRendererLatest,
    qrEncoderLatest: cameraCandidateAudit.qrEncoderLatest,
    liveQrTargetIssues: cameraCandidateAudit.liveMetadataIssues,
    iosPodfileLockRefreshRequired,
    staleRemovedIosPods,
    errors,
    readinessIssues,
    warnings,
    baselineStable: errors.length === 0 && readinessIssues.length === 0 && cameraCandidateAudit.liveMetadataIssues.length === 0,
  };
};

export const formatCameraQrMigrationSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Camera QR migration audit',
    `Generated at: ${generatedAt}`,
    `react-native-camera manifest version: ${audit.cameraVersion || '<missing>'}`,
    `react-native-camera-kit manifest version: ${audit.cameraKitVersion || '<missing>'}`,
    `QR local-image manifest version: ${audit.localQrImageVersion || '<missing>'}`,
    `QR renderer version: ${audit.qrRendererVersion || '<missing>'}`,
    `QR native renderer version: ${audit.qrNativeRendererVersion || '<missing>'}`,
    `qrcode resolution: ${audit.rootQrcodeVersion || '<missing>'}`,
    `CameraKit latest target: ${audit.cameraKitLatest}`,
    `CameraKit peer dependency ranges: ${Object.entries(audit.cameraKitPeerRanges)
      .map(([peerName, range]) => `${peerName}@${range}`)
      .join(', ')}`,
    `QR renderer latest target: ${audit.qrRendererLatest}`,
    `QR renderer peer dependency ranges: ${Object.entries(audit.qrRendererPeerRanges)
      .map(([peerName, range]) => `${peerName}@${range}`)
      .join(', ')}`,
    `QR renderer dependencies: ${Object.entries(audit.qrRendererDependencies)
      .map(([dependencyName, range]) => `${dependencyName}@${range}`)
      .join(', ')}`,
    `QR native renderer latest target: ${audit.qrNativeRendererLatest}`,
    `QR encoder latest target: ${audit.qrEncoderLatest}`,
    `Live QR targets: ${audit.liveQrTargetIssues.length === 0 ? 'matched' : 'stale'}`,
    `Live QR target issues: ${audit.liveQrTargetIssues.length}`,
    ...audit.liveQrTargetIssues.map(issue => `- ${issue}`),
    `iOS Podfile.lock refresh required: ${audit.iosPodfileLockRefreshRequired ? 'yes' : 'no'}`,
    `iOS stale removed camera pods: ${audit.staleRemovedIosPods.join(', ') || 'none'}`,
    `Camera QR migration wiring valid: ${audit.errors.length === 0 ? 'yes' : 'no'}`,
    `Camera QR migration baseline stable: ${audit.baselineStable ? 'yes' : 'no'}`,
    `Warnings: ${audit.warnings.length}`,
  ];

  audit.warnings.forEach(warning => lines.push(`- ${warning}`));
  lines.push(`Readiness issues: ${audit.readinessIssues.length}`);
  audit.readinessIssues.forEach(issue => lines.push(`- ${issue}`));
  lines.push(`Wiring errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.baselineStable
      ? 'Required action: none; camera QR migration baseline is stable after the dedicated scanner replacement branch.'
      : 'Required action: restore camera QR migration baseline and refresh ios/Podfile.lock with pod install on macOS before claiming iOS camera QR migration validation.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Camera QR migration audit');
  console.log(`react-native-camera manifest version: ${audit.cameraVersion || '<missing>'}`);
  console.log(`react-native-camera-kit manifest version: ${audit.cameraKitVersion || '<missing>'}`);
  console.log(
    `QR render pair: react-native-qrcode-svg@${audit.qrRendererVersion || '<missing>'}, react-native-svg@${
      audit.qrNativeRendererVersion || '<missing>'
    }, qrcode resolution ${audit.rootQrcodeVersion || '<missing>'}`,
  );
  console.log(`iOS Podfile.lock refresh required: ${audit.iosPodfileLockRefreshRequired ? 'yes' : 'no'}`);
  console.log(`iOS stale removed camera pods: ${audit.staleRemovedIosPods.join(', ') || 'none'}`);

  if (audit.warnings.length > 0) {
    console.log('Warnings:');
    audit.warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (audit.errors.length > 0) {
    console.log('Camera QR migration wiring is invalid:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  if (audit.readinessIssues.length > 0) {
    console.log('Camera QR migration baseline needs review:');
    audit.readinessIssues.forEach(issue => console.log(`- ${issue}`));
  } else {
    console.log('Camera QR migration baseline is stable after the dedicated scanner replacement branch.');
  }

  console.log('Camera QR migration wiring is present for Android/iOS permissions, current scanner runtime, removed legacy QR local-image dependency, and migration documentation.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectCameraQrMigrationAudit();
  const summary = formatCameraQrMigrationSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Camera QR migration summary written to ${path.relative(root, summaryPath)}`);
}
