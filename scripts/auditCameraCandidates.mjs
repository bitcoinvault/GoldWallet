import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'camera-candidate-summary.txt');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

const packageJson = JSON.parse(read('package.json'));
const dependencies = packageJson.dependencies || {};

export const collectCameraCandidateAudit = () => {
  const warnings = [];
  const errors = [];
  const currentCamera = dependencies['react-native-camera'];
  const cameraPlan = read('docs/camera-replacement-plan.md');
  const followupPlan = read('docs/android-warning-baseline-followups.md');
  const warningBaseline = read('local-docs/android-warning-audit-summary.txt');

  if (currentCamera !== '^3.33.0') {
    errors.push(`package.json has react-native-camera@${currentCamera || '<missing>'}; expected ^3.33.0 until the scanner migration branch`);
  }

  [
    'react-native-vision-camera@5.0.11',
    'react-native-camera-kit@18.0.0',
    'Branch: `feature/bem-camera-qr-scanner-migration`',
    'VisionCamera proof branch first, CameraKit fallback',
  ].forEach(snippet => {
    if (!cameraPlan.includes(snippet)) {
      errors.push(`docs/camera-replacement-plan.md is missing "${snippet}"`);
    }
  });

  if (!followupPlan.includes('dedicated QR scanner replacement')) {
    errors.push('docs/android-warning-baseline-followups.md must keep camera as a dedicated QR scanner replacement');
  }

  if (!warningBaseline.includes('react-native-camera')) {
    warnings.push('local Android warning audit summary does not mention react-native-camera; refresh the warning audit before candidate proof work.');
  }

  warnings.push('react-native-camera remains installed and deprecated; this audit only records candidate selection.');

  return {
    legacyCameraLatest: 'react-native-camera@4.2.1',
    visionCameraLatest: 'react-native-vision-camera@5.0.11',
    visionCameraNitroPeers: true,
    cameraKitLatest: 'react-native-camera-kit@18.0.0',
    cameraKitNodeEngine: '>=18',
    selectedProofTarget: 'VisionCamera proof branch first, CameraKit fallback',
    proofBranch: 'feature/bem-camera-qr-scanner-migration',
    warnings,
    errors,
    baselineStable: errors.length === 0,
  };
};

export const formatCameraCandidateSummary = (audit, generatedAt = new Date().toISOString()) => {
  const lines = [
    'Camera candidate audit',
    `Generated at: ${generatedAt}`,
    `Legacy camera latest: ${audit.legacyCameraLatest}`,
    `VisionCamera latest: ${audit.visionCameraLatest}`,
    `VisionCamera Nitro peers: ${audit.visionCameraNitroPeers ? 'yes' : 'no'}`,
    `CameraKit latest: ${audit.cameraKitLatest}`,
    `CameraKit node engine: ${audit.cameraKitNodeEngine}`,
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
      ? 'Required action: none; camera candidate baseline is stable for a dedicated scanner proof branch.'
      : 'Required action: restore camera candidate baseline before starting scanner proof work.',
  );

  return `${lines.join('\n')}\n`;
};

const printReport = audit => {
  console.log('Camera candidate audit');
  console.log(`Legacy camera latest: ${audit.legacyCameraLatest}`);
  console.log(`VisionCamera latest: ${audit.visionCameraLatest}`);
  console.log(`CameraKit latest: ${audit.cameraKitLatest}`);

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

  console.log('Camera candidate baseline is stable for a dedicated scanner proof branch.');
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = collectCameraCandidateAudit();
  const summary = formatCameraCandidateSummary(audit);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  printReport(audit);
  console.log(`Camera candidate summary written to ${path.relative(root, summaryPath)}`);
}
