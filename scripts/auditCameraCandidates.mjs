import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'camera-candidate-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const readOptional = relativePath => {
  const absolutePath = path.join(root, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : '';
};

const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};
export const cameraCandidateMetadataCheckedOn = '2026-08-10';
const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = args => (process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args);
const expectedCameraMetadata = {
  legacyCameraLatest: 'react-native-camera@4.2.1',
  visionCameraLatest: 'react-native-vision-camera@5.2.2',
  visionCameraRequiredPeers: ['react-native-nitro-modules', 'react-native-nitro-image'],
  visionCameraPeerRanges: {
    react: '*',
    'react-native': '*',
    'react-native-nitro-image': '*',
    'react-native-nitro-modules': '*',
  },
  cameraKitLatest: 'react-native-camera-kit@18.0.1',
  cameraKitNodeEngine: '>=18',
  cameraKitPeerRanges: {
    react: '*',
    'react-native': '*',
  },
  permissionsLatest: 'react-native-permissions@5.6.1',
  permissionsPeerRanges: {
    react: '*',
    'react-native': '*',
    'react-native-windows': '*',
  },
  qrRendererLatest: 'react-native-qrcode-svg@6.3.21',
  qrRendererPeerRanges: {
    react: '*',
    'react-native': '>=0.63.4',
    'react-native-svg': '>=14.0.0',
  },
  qrRendererDependencies: {
    'prop-types': '^15.8.0',
    qrcode: '^1.5.4',
    'text-encoding': '^0.7.0',
  },
  qrNativeRendererLatest: 'react-native-svg@15.15.5',
  qrEncoderLatest: 'qrcode@1.5.4',
};

const npmView = (packageName, field) =>
  JSON.parse(
    execFileSync(npmCommand, npmArgs(['view', packageName, field, '--json']), {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim(),
  );

const collectLiveMetadataIssues = () => {
  const issues = [];
  const legacyCameraVersion = npmView('react-native-camera', 'version');
  const visionCameraVersion = npmView('react-native-vision-camera', 'version');
  const visionCameraPeers = npmView('react-native-vision-camera', 'peerDependencies');
  const cameraKitVersion = npmView('react-native-camera-kit', 'version');
  const cameraKitEngines = npmView('react-native-camera-kit', 'engines');
  const cameraKitPeers = npmView('react-native-camera-kit', 'peerDependencies');
  const permissionsVersion = npmView('react-native-permissions', 'version');
  const permissionsPeers = npmView('react-native-permissions', 'peerDependencies');
  const qrRendererVersion = npmView('react-native-qrcode-svg', 'version');
  const qrRendererPeers = npmView('react-native-qrcode-svg', 'peerDependencies');
  const qrRendererDependencies = npmView('react-native-qrcode-svg', 'dependencies');
  const qrNativeRendererVersion = npmView('react-native-svg', 'version');
  const qrcodeVersion = npmView('qrcode', 'version');

  [
    ['Legacy camera latest', `react-native-camera@${legacyCameraVersion}`, expectedCameraMetadata.legacyCameraLatest],
    [
      'VisionCamera latest',
      `react-native-vision-camera@${visionCameraVersion}`,
      expectedCameraMetadata.visionCameraLatest,
    ],
    ['CameraKit latest', `react-native-camera-kit@${cameraKitVersion}`, expectedCameraMetadata.cameraKitLatest],
    ['CameraKit node engine', cameraKitEngines?.node || '<missing>', expectedCameraMetadata.cameraKitNodeEngine],
    ['Permissions latest', `react-native-permissions@${permissionsVersion}`, expectedCameraMetadata.permissionsLatest],
    ['QR renderer latest', `react-native-qrcode-svg@${qrRendererVersion}`, expectedCameraMetadata.qrRendererLatest],
    [
      'QR native renderer latest',
      `react-native-svg@${qrNativeRendererVersion}`,
      expectedCameraMetadata.qrNativeRendererLatest,
    ],
    ['QR encoder latest', `qrcode@${qrcodeVersion}`, expectedCameraMetadata.qrEncoderLatest],
  ].forEach(([label, actual, expected]) => {
    if (actual !== expected) {
      issues.push(`${label} live npm metadata is ${actual}; expected ${expected}`);
    }
  });

  expectedCameraMetadata.visionCameraRequiredPeers.forEach(peerName => {
    if (!Object.prototype.hasOwnProperty.call(visionCameraPeers || {}, peerName)) {
      issues.push(`VisionCamera live npm peerDependencies is missing ${peerName}`);
    }
  });

  Object.entries(expectedCameraMetadata.visionCameraPeerRanges).forEach(([peerName, expectedRange]) => {
    const actualRange = visionCameraPeers?.[peerName] || '<missing>';

    if (actualRange !== expectedRange) {
      issues.push(
        `VisionCamera live npm peerDependencies has ${peerName}@${actualRange}; expected ${peerName}@${expectedRange}`,
      );
    }
  });

  Object.entries(expectedCameraMetadata.cameraKitPeerRanges).forEach(([peerName, expectedRange]) => {
    const actualRange = cameraKitPeers?.[peerName] || '<missing>';

    if (actualRange !== expectedRange) {
      issues.push(
        `CameraKit live npm peerDependencies has ${peerName}@${actualRange}; expected ${peerName}@${expectedRange}`,
      );
    }
  });

  Object.entries(expectedCameraMetadata.permissionsPeerRanges).forEach(([peerName, expectedRange]) => {
    const actualRange = permissionsPeers?.[peerName] || '<missing>';

    if (actualRange !== expectedRange) {
      issues.push(
        `Permissions live npm peerDependencies has ${peerName}@${actualRange}; expected ${peerName}@${expectedRange}`,
      );
    }
  });

  Object.entries(expectedCameraMetadata.qrRendererPeerRanges).forEach(([peerName, expectedRange]) => {
    const actualRange = qrRendererPeers?.[peerName] || '<missing>';

    if (actualRange !== expectedRange) {
      issues.push(
        `QR renderer live npm peerDependencies has ${peerName}@${actualRange}; expected ${peerName}@${expectedRange}`,
      );
    }
  });

  Object.entries(expectedCameraMetadata.qrRendererDependencies).forEach(([dependencyName, expectedRange]) => {
    const actualRange = qrRendererDependencies?.[dependencyName] || '<missing>';

    if (actualRange !== expectedRange) {
      issues.push(
        `QR renderer live npm dependencies has ${dependencyName}@${actualRange}; expected ${dependencyName}@${expectedRange}`,
      );
    }
  });

  return issues;
};

export const collectCameraCandidateAudit = () => {
  const warnings = [];
  const errors = [];
  const liveMetadataIssues = collectLiveMetadataIssues();
  const currentCamera = dependencies['react-native-camera'];
  const currentCameraKit = dependencies['react-native-camera-kit'];
  const currentPermissions = dependencies['react-native-permissions'];
  const cameraPlan = read('docs/camera-replacement-plan.md');
  const followupPlan = read('docs/android-warning-baseline-followups.md');
  const warningBaseline = readOptional('local-docs/android-warning-audit-summary.txt');

  if (currentCamera) {
    errors.push(
      `package.json still has react-native-camera@${currentCamera}; expected removal after scanner migration`,
    );
  }

  if (currentCameraKit !== '18.0.1') {
    errors.push(`package.json has react-native-camera-kit@${currentCameraKit || '<missing>'}; expected 18.0.1`);
  }

  if (currentPermissions !== '5.6.1') {
    errors.push(`package.json has react-native-permissions@${currentPermissions || '<missing>'}; expected 5.6.1`);
  }

  [
    'react-native-vision-camera@5.2.2',
    'react-native-nitro-modules',
    'react-native-nitro-image',
    'react-native-camera-kit@18.0.1',
    'react-native-permissions@5.6.1',
    'react-native-qrcode-svg@6.3.21',
    'qrcode@1.5.4',
    'Current scanner package: `react-native-camera-kit@18.0.1`',
    'CameraKit selected for the first migration branch',
  ].forEach(snippet => {
    if (!cameraPlan.includes(snippet)) {
      errors.push(`docs/camera-replacement-plan.md is missing "${snippet}"`);
    }
  });

  if (followupPlan.split('\n').some(line => line.startsWith('| `react-native-camera` |'))) {
    errors.push(
      'docs/android-warning-baseline-followups.md must not keep react-native-camera as a remaining warning source after scanner migration',
    );
  }

  if (/react-native-camera[\\/]android/.test(warningBaseline)) {
    warnings.push(
      'local Android warning audit summary still mentions react-native-camera; refresh the warning audit after scanner migration.',
    );
  }

  return {
    metadataCheckedOn: cameraCandidateMetadataCheckedOn,
    legacyCameraLatest: expectedCameraMetadata.legacyCameraLatest,
    visionCameraLatest: expectedCameraMetadata.visionCameraLatest,
    visionCameraNitroPeers: true,
    visionCameraRequiredPeers: expectedCameraMetadata.visionCameraRequiredPeers,
    visionCameraPeerRanges: expectedCameraMetadata.visionCameraPeerRanges,
    cameraKitLatest: expectedCameraMetadata.cameraKitLatest,
    cameraKitNodeEngine: expectedCameraMetadata.cameraKitNodeEngine,
    cameraKitPeerRanges: expectedCameraMetadata.cameraKitPeerRanges,
    permissionsLatest: expectedCameraMetadata.permissionsLatest,
    permissionsPeerRanges: expectedCameraMetadata.permissionsPeerRanges,
    qrRendererLatest: expectedCameraMetadata.qrRendererLatest,
    qrRendererPeerRanges: expectedCameraMetadata.qrRendererPeerRanges,
    qrRendererDependencies: expectedCameraMetadata.qrRendererDependencies,
    qrNativeRendererLatest: expectedCameraMetadata.qrNativeRendererLatest,
    qrEncoderLatest: expectedCameraMetadata.qrEncoderLatest,
    selectedProofTarget:
      'CameraKit selected and installed; VisionCamera deferred because latest line requires Nitro peers',
    proofBranch: 'feature/bem-37-camera-kit-qr-proof',
    liveMetadataIssues,
    warnings,
    errors: [...liveMetadataIssues, ...errors],
    baselineStable: liveMetadataIssues.length === 0 && errors.length === 0,
  };
};

export const formatCameraCandidateSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Camera candidate audit',
    `Generated at: ${generatedAt}`,
    `Metadata checked on: ${audit.metadataCheckedOn}`,
    `Legacy camera latest: ${audit.legacyCameraLatest}`,
    `VisionCamera latest: ${audit.visionCameraLatest}`,
    `VisionCamera Nitro peers: ${audit.visionCameraNitroPeers ? 'yes' : 'no'}`,
    `VisionCamera required peer packages: ${audit.visionCameraRequiredPeers.join(', ')}`,
    `VisionCamera peer dependency ranges: ${Object.entries(audit.visionCameraPeerRanges)
      .map(([peerName, range]) => `${peerName}@${range}`)
      .join(', ')}`,
    `CameraKit latest: ${audit.cameraKitLatest}`,
    `CameraKit node engine: ${audit.cameraKitNodeEngine}`,
    `CameraKit peer dependency ranges: ${Object.entries(audit.cameraKitPeerRanges)
      .map(([peerName, range]) => `${peerName}@${range}`)
      .join(', ')}`,
    `Permissions latest: ${audit.permissionsLatest}`,
    `Permissions peer dependency ranges: ${Object.entries(audit.permissionsPeerRanges)
      .map(([peerName, range]) => `${peerName}@${range}`)
      .join(', ')}`,
    `QR renderer latest: ${audit.qrRendererLatest}`,
    `QR renderer peer dependency ranges: ${Object.entries(audit.qrRendererPeerRanges)
      .map(([peerName, range]) => `${peerName}@${range}`)
      .join(', ')}`,
    `QR renderer dependencies: ${Object.entries(audit.qrRendererDependencies)
      .map(([dependencyName, range]) => `${dependencyName}@${range}`)
      .join(', ')}`,
    `QR native renderer latest: ${audit.qrNativeRendererLatest}`,
    `QR encoder latest: ${audit.qrEncoderLatest}`,
    `Live npm metadata: ${audit.liveMetadataIssues.length === 0 ? 'matched' : 'stale'}`,
    `Live npm metadata issues: ${audit.liveMetadataIssues.length}`,
    ...audit.liveMetadataIssues.map(issue => `- ${issue}`),
    `Selected proof target: ${audit.selectedProofTarget}`,
    `Proof branch: ${audit.proofBranch}`,
    `Camera candidate baseline stable: ${audit.baselineStable ? 'yes' : 'no'}`,
    `Warnings: ${audit.warnings.length}`,
  ];

  audit.warnings.forEach(warning => lines.push(`- ${warning}`));
  lines.push(`Errors: ${audit.errors.length}`);
  audit.errors.forEach(error => lines.push(`- ${error}`));
  lines.push(
    audit.baselineStable
      ? 'Required action: none; CameraKit scanner baseline is stable after the dedicated proof branch.'
      : 'Required action: restore camera candidate baseline before scanner follow-up work.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Camera candidate audit');
  console.log(`Legacy camera latest: ${audit.legacyCameraLatest}`);
  console.log(`VisionCamera latest: ${audit.visionCameraLatest}`);
  console.log(`CameraKit latest: ${audit.cameraKitLatest}`);
  console.log(`Permissions latest: ${audit.permissionsLatest}`);

  if (audit.warnings.length > 0) {
    console.log('Warnings:');
    audit.warnings.forEach(warning => console.log(`- ${warning}`));
  }

  if (audit.errors.length > 0) {
    console.log('Camera candidate baseline needs review:');
    audit.errors.forEach(error => console.log(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log('Camera candidate baseline is stable after the dedicated scanner proof branch.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectCameraCandidateAudit();
  const summary = formatCameraCandidateSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Camera candidate summary written to ${path.relative(root, summaryPath)}`);
}
