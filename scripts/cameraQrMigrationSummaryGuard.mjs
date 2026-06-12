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

export const getCameraQrMigrationSummaryErrors = summary => {
  const errors = [];
  const generatedAt = getLineValue(summary, 'Generated at');
  const cameraVersion = getLineValue(summary, 'react-native-camera manifest version');
  const cameraKitVersion = getLineValue(summary, 'react-native-camera-kit manifest version');
  const qrLocalImageVersion = getLineValue(summary, 'QR local-image manifest version');
  const qrRendererVersion = getLineValue(summary, 'QR renderer version');
  const qrNativeRendererVersion = getLineValue(summary, 'QR native renderer version');
  const qrcodeResolution = getLineValue(summary, 'qrcode resolution');
  const cameraKitLatest = getLineValue(summary, 'CameraKit latest target');
  const cameraKitPeerRanges = getLineValue(summary, 'CameraKit peer dependency ranges');
  const qrRendererLatest = getLineValue(summary, 'QR renderer latest target');
  const qrRendererPeerRanges = getLineValue(summary, 'QR renderer peer dependency ranges');
  const qrRendererDependencies = getLineValue(summary, 'QR renderer dependencies');
  const qrNativeRendererLatest = getLineValue(summary, 'QR native renderer latest target');
  const qrEncoderLatest = getLineValue(summary, 'QR encoder latest target');
  const liveQrTargets = getLineValue(summary, 'Live QR targets');
  const liveQrTargetIssueCount = getLineValue(summary, 'Live QR target issues');
  const iosPodfileLockRefreshRequired = getLineValue(summary, 'iOS Podfile.lock refresh required');
  const iosStaleRemovedCameraPods = getLineValue(summary, 'iOS stale removed camera pods');
  const iosCameraPodfileLockCleanupComplete = getLineValue(summary, 'iOS camera Podfile.lock cleanup complete');
  const iosBroaderPodfileLockRefreshRequired = getLineValue(summary, 'iOS broader Podfile.lock refresh required');
  const iosBroaderPodfileLockDriftIssueCount = getLineValue(summary, 'iOS broader Podfile.lock drift issues');
  const iosRemovedPodfileLockDriftIssueCount = getLineValue(summary, 'iOS removed Podfile.lock drift issues');
  const wiringValid = getLineValue(summary, 'Camera QR migration wiring valid');
  const baselineStable = getLineValue(summary, 'Camera QR migration baseline stable');
  const warningCount = getLineValue(summary, 'Warnings');
  const readinessCount = getLineValue(summary, 'Readiness issues');
  const wiringErrorCount = getLineValue(summary, 'Wiring errors');
  const requiredAction = getLineValue(summary, 'Required action');
  const liveQrTargetIssueLines = getBulletLinesAfter(summary, 'Live QR target issues');
  const iosBroaderPodfileLockDriftIssueLines = getBulletLinesAfter(summary, 'iOS broader Podfile.lock drift issues');
  const iosRemovedPodfileLockDriftIssueLines = getBulletLinesAfter(summary, 'iOS removed Podfile.lock drift issues');
  const warningLines = getBulletLinesAfter(summary, 'Warnings');
  const readinessLines = getBulletLinesAfter(summary, 'Readiness issues');
  const wiringErrorLines = getBulletLinesAfter(summary, 'Wiring errors');

  if (!summary.startsWith('Camera QR migration audit')) {
    errors.push('summary header is missing or invalid');
  }

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  if (!cameraVersion) {
    errors.push('react-native-camera manifest version is missing');
  }

  if (cameraKitVersion !== '18.0.0') {
    errors.push(`react-native-camera-kit manifest version must be 18.0.0. Received: ${cameraKitVersion || 'missing'}`);
  }

  if (!qrLocalImageVersion) {
    errors.push('QR local-image manifest version is missing');
  }

  if (!qrRendererVersion) {
    errors.push('QR renderer version is missing');
  }

  if (!qrNativeRendererVersion) {
    errors.push('QR native renderer version is missing');
  }

  if (!qrcodeResolution) {
    errors.push('qrcode resolution is missing');
  }

  if (cameraKitLatest !== 'react-native-camera-kit@18.0.0') {
    errors.push(`CameraKit latest target must be react-native-camera-kit@18.0.0. Received: ${cameraKitLatest || 'missing'}`);
  }

  if (cameraKitPeerRanges !== 'react@*, react-native@*') {
    errors.push(`CameraKit peer dependency ranges are unexpected. Received: ${cameraKitPeerRanges || 'missing'}`);
  }

  if (qrRendererLatest !== 'react-native-qrcode-svg@6.3.21') {
    errors.push(`QR renderer latest target must be react-native-qrcode-svg@6.3.21. Received: ${qrRendererLatest || 'missing'}`);
  }

  if (qrRendererPeerRanges !== 'react@*, react-native@>=0.63.4, react-native-svg@>=14.0.0') {
    errors.push(`QR renderer peer dependency ranges are unexpected. Received: ${qrRendererPeerRanges || 'missing'}`);
  }

  if (qrRendererDependencies !== 'prop-types@^15.8.0, qrcode@^1.5.4, text-encoding@^0.7.0') {
    errors.push(`QR renderer dependencies are unexpected. Received: ${qrRendererDependencies || 'missing'}`);
  }

  if (qrNativeRendererLatest !== 'react-native-svg@15.15.5') {
    errors.push(`QR native renderer latest target must be react-native-svg@15.15.5. Received: ${qrNativeRendererLatest || 'missing'}`);
  }

  if (qrEncoderLatest !== 'qrcode@1.5.4') {
    errors.push(`QR encoder latest target must be qrcode@1.5.4. Received: ${qrEncoderLatest || 'missing'}`);
  }

  if (!['matched', 'stale'].includes(liveQrTargets)) {
    errors.push(`Live QR targets must be matched or stale. Received: ${liveQrTargets || 'missing'}`);
  }

  [iosPodfileLockRefreshRequired, iosCameraPodfileLockCleanupComplete, iosBroaderPodfileLockRefreshRequired, wiringValid, baselineStable].forEach(value => {
    if (!['yes', 'no'].includes(value)) {
      errors.push(`Boolean summary values must be yes or no. Received: ${value || 'missing'}`);
    }
  });

  if (!iosStaleRemovedCameraPods) {
    errors.push('iOS stale removed camera pods line is missing');
  }

  if (iosPodfileLockRefreshRequired === 'yes' && iosStaleRemovedCameraPods === 'none') {
    errors.push('iOS Podfile.lock refresh required cannot be yes when stale removed camera pods is none');
  }

  if (iosPodfileLockRefreshRequired === 'no' && iosStaleRemovedCameraPods !== 'none') {
    errors.push('iOS stale removed camera pods must be none when Podfile.lock refresh is not required');
  }

  if (iosCameraPodfileLockCleanupComplete === 'yes' && iosStaleRemovedCameraPods !== 'none') {
    errors.push('iOS camera Podfile.lock cleanup cannot be complete when stale removed camera pods are listed');
  }

  if (iosCameraPodfileLockCleanupComplete === 'no' && iosStaleRemovedCameraPods === 'none') {
    errors.push('iOS camera Podfile.lock cleanup cannot be incomplete when stale removed camera pods is none');
  }

  [
    ['Live QR target issues', liveQrTargetIssueCount, liveQrTargetIssueLines.length],
    ['iOS broader Podfile.lock drift issues', iosBroaderPodfileLockDriftIssueCount, iosBroaderPodfileLockDriftIssueLines.length],
    ['iOS removed Podfile.lock drift issues', iosRemovedPodfileLockDriftIssueCount, iosRemovedPodfileLockDriftIssueLines.length],
    ['Warnings', warningCount, warningLines.length],
    ['Readiness issues', readinessCount, readinessLines.length],
    ['Wiring errors', wiringErrorCount, wiringErrorLines.length],
  ].forEach(([label, value, listedCount]) => {
    if (!/^\d+$/.test(value)) {
      errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    } else if (Number(value) !== listedCount) {
      errors.push(`${label} count is ${value}, but listed ${listedCount}`);
    }
  });

  if (baselineStable === 'yes' && (wiringValid !== 'yes' || readinessCount !== '0' || wiringErrorCount !== '0')) {
    errors.push('Stable baseline summary must have valid wiring, 0 readiness issues, and 0 wiring errors');
  }

  if (baselineStable === 'yes' && liveQrTargets !== 'matched') {
    errors.push('Stable baseline summary must have matched live QR targets');
  }

  if (baselineStable === 'yes' && iosPodfileLockRefreshRequired !== 'no') {
    errors.push('Stable Camera/QR baseline summary must have no stale removed camera pods in Podfile.lock');
  }

  if (baselineStable === 'yes' && iosCameraPodfileLockCleanupComplete !== 'yes') {
    errors.push('Stable Camera/QR baseline summary must report iOS camera Podfile.lock cleanup complete');
  }

  if (liveQrTargets === 'matched' && liveQrTargetIssueCount !== '0') {
    errors.push('Matched live QR target summary must have 0 live QR target issues');
  }

  if (liveQrTargets === 'stale' && liveQrTargetIssueCount === '0') {
    errors.push('Stale live QR target summary must list at least one live QR target issue');
  }

  if (
    baselineStable === 'yes' &&
    iosBroaderPodfileLockRefreshRequired === 'yes' &&
    !requiredAction.includes('none for Android/CameraKit scanner wiring') &&
    !requiredAction.includes('pod install on macOS')
  ) {
    errors.push('Stable baseline with broader iOS drift must include the Android/CameraKit no-action and macOS pod install required action');
  }

  if (
    baselineStable === 'yes' &&
    iosBroaderPodfileLockRefreshRequired === 'no' &&
    !requiredAction.includes('none; camera QR migration baseline is stable')
  ) {
    errors.push('Stable baseline summary must include the no-action camera QR required action');
  }

  if (baselineStable === 'no' && !requiredAction.includes('restore camera QR migration baseline')) {
    errors.push('Unstable baseline summary must include the camera QR restoration required action');
  }

  if (iosPodfileLockRefreshRequired === 'yes' && !requiredAction.includes('pod install on macOS')) {
    errors.push('iOS Podfile.lock refresh summary must name pod install on macOS');
  }

  if (iosBroaderPodfileLockRefreshRequired === 'yes' && iosBroaderPodfileLockDriftIssueCount === '0') {
    errors.push('iOS broader Podfile.lock refresh cannot be required with 0 broader drift issues');
  }

  if (iosBroaderPodfileLockRefreshRequired === 'no' && iosBroaderPodfileLockDriftIssueCount !== '0') {
    errors.push('iOS broader Podfile.lock drift issues must be 0 when broader refresh is not required');
  }

  return errors;
};
