const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getBulletLinesAfter = (content, label) => {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith(`${label}: `));
  const bulletLines = [];

  if (startIndex === -1) {
    return bulletLines;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (!lines[index].startsWith('- ')) {
      break;
    }

    bulletLines.push(lines[index].slice(2));
  }

  return bulletLines;
};

export const getCameraCandidateSummaryErrors = summary => {
  const errors = [];
  const metadataCheckedOn = getLineValue(summary, 'Metadata checked on');
  const legacyCamera = getLineValue(summary, 'Legacy camera latest');
  const visionCamera = getLineValue(summary, 'VisionCamera latest');
  const visionCameraNitroPeers = getLineValue(summary, 'VisionCamera Nitro peers');
  const visionCameraRequiredPeers = getLineValue(summary, 'VisionCamera required peer packages');
  const visionCameraPeerRanges = getLineValue(summary, 'VisionCamera peer dependency ranges');
  const cameraKit = getLineValue(summary, 'CameraKit latest');
  const cameraKitNodeEngine = getLineValue(summary, 'CameraKit node engine');
  const qrRenderer = getLineValue(summary, 'QR renderer latest');
  const qrNativeRenderer = getLineValue(summary, 'QR native renderer latest');
  const qrEncoder = getLineValue(summary, 'QR encoder latest');
  const liveMetadata = getLineValue(summary, 'Live npm metadata');
  const liveMetadataIssueCount = getLineValue(summary, 'Live npm metadata issues');
  const liveMetadataIssueLines = getBulletLinesAfter(summary, 'Live npm metadata issues');
  const selectedProofTarget = getLineValue(summary, 'Selected proof target');
  const proofBranch = getLineValue(summary, 'Proof branch');
  const baselineStable = getLineValue(summary, 'Camera candidate baseline stable');
  const warningCount = getLineValue(summary, 'Warnings');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const requiredAction = getLineValue(summary, 'Required action');

  if (!summary.startsWith('Camera candidate audit')) {
    errors.push('Camera candidate summary header is missing');
  }

  if (metadataCheckedOn !== '2026-06-10') {
    errors.push(`Metadata checked on must be 2026-06-10. Received: ${metadataCheckedOn || 'missing'}`);
  }

  if (legacyCamera !== 'react-native-camera@4.2.1') {
    errors.push(`Legacy camera latest must be react-native-camera@4.2.1. Received: ${legacyCamera || 'missing'}`);
  }

  if (visionCamera !== 'react-native-vision-camera@5.0.11') {
    errors.push(`VisionCamera latest must be react-native-vision-camera@5.0.11. Received: ${visionCamera || 'missing'}`);
  }

  if (visionCameraNitroPeers !== 'yes') {
    errors.push(`VisionCamera Nitro peers must be yes. Received: ${visionCameraNitroPeers || 'missing'}`);
  }

  if (visionCameraRequiredPeers !== 'react-native-nitro-modules, react-native-nitro-image') {
    errors.push(`VisionCamera required peer packages are unexpected. Received: ${visionCameraRequiredPeers || 'missing'}`);
  }

  if (visionCameraPeerRanges !== 'react@*, react-native@*, react-native-nitro-image@*, react-native-nitro-modules@*') {
    errors.push(`VisionCamera peer dependency ranges are unexpected. Received: ${visionCameraPeerRanges || 'missing'}`);
  }

  if (cameraKit !== 'react-native-camera-kit@18.0.0') {
    errors.push(`CameraKit latest must be react-native-camera-kit@18.0.0. Received: ${cameraKit || 'missing'}`);
  }

  if (cameraKitNodeEngine !== '>=18') {
    errors.push(`CameraKit node engine must be >=18. Received: ${cameraKitNodeEngine || 'missing'}`);
  }

  if (qrRenderer !== 'react-native-qrcode-svg@6.3.21') {
    errors.push(`QR renderer latest must be react-native-qrcode-svg@6.3.21. Received: ${qrRenderer || 'missing'}`);
  }

  if (qrNativeRenderer !== 'react-native-svg@15.15.5') {
    errors.push(`QR native renderer latest must be react-native-svg@15.15.5. Received: ${qrNativeRenderer || 'missing'}`);
  }

  if (qrEncoder !== 'qrcode@1.5.4') {
    errors.push(`QR encoder latest must be qrcode@1.5.4. Received: ${qrEncoder || 'missing'}`);
  }

  if (!['matched', 'stale'].includes(liveMetadata)) {
    errors.push(`Live npm metadata must be matched or stale. Received: ${liveMetadata || 'missing'}`);
  }

  if (!/^\d+$/.test(liveMetadataIssueCount)) {
    errors.push(`Live npm metadata issues must be a non-negative integer. Received: ${liveMetadataIssueCount || 'missing'}`);
  } else if (Number(liveMetadataIssueCount) !== liveMetadataIssueLines.length) {
    errors.push(`Live npm metadata issues count must be ${liveMetadataIssueLines.length}. Received: ${liveMetadataIssueCount}`);
  }

  if (liveMetadata === 'matched' && liveMetadataIssueCount !== '0') {
    errors.push('Matched live npm metadata summary must have 0 live metadata issues');
  }

  if (liveMetadata === 'stale' && liveMetadataIssueCount === '0') {
    errors.push('Stale live npm metadata summary must list at least one live metadata issue');
  }

  if (selectedProofTarget !== 'CameraKit selected and installed; VisionCamera deferred because latest line requires Nitro peers') {
    errors.push(`Selected proof target is unexpected. Received: ${selectedProofTarget || 'missing'}`);
  }

  if (proofBranch !== 'feature/bem-37-camera-kit-qr-proof') {
    errors.push(`Proof branch must be feature/bem-37-camera-kit-qr-proof. Received: ${proofBranch || 'missing'}`);
  }

  if (!['yes', 'no'].includes(baselineStable || '')) {
    errors.push(`Camera candidate baseline stable must be yes or no. Received: ${baselineStable || 'missing'}`);
  }

  if (Number(warningCount) !== warningLines.length) {
    errors.push(`Warnings count must be ${warningLines.length}. Received: ${warningCount || 'missing'}`);
  }

  if (baselineStable === 'yes' && liveMetadata !== 'matched') {
    errors.push('Stable baseline summary must have matched live npm metadata');
  }

  if (baselineStable === 'yes' && !requiredAction.includes('none; CameraKit scanner baseline is stable')) {
    errors.push('Stable baseline summary must include the no-action camera candidate required action');
  }

  if (baselineStable === 'no' && !requiredAction.includes('restore camera candidate baseline')) {
    errors.push('Unstable baseline summary must include the camera candidate restoration required action');
  }

  return errors;
};
