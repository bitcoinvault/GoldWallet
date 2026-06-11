const normalizePackageVersion = version => (version || '').replace(/^[~^]/, '');

export const getLockedPodVersion = (podfileLock, podName) => {
  const escapedPodName = podName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = podfileLock.match(new RegExp(`^  - ${escapedPodName} \\(([^)]+)\\)`, 'm'));

  return match ? match[1] : null;
};

export const removedPodfileLockChecks = [
  { podName: 'react-native-camera', matchNames: ['react-native-camera'], reason: 'after the CameraKit migration' },
  { podName: 'react-native-qrcode-local-image', matchNames: ['react-native-qrcode-local-image'], reason: 'after the QR local-image cleanup' },
  {
    podName: 'RNCMaskedView',
    matchNames: ['RNCMaskedView', '@react-native-community/masked-view'],
    reason: 'after the React Navigation 7 masked-view removal',
  },
  {
    podName: 'FlipperKit',
    matchNames: ['FlipperKit', 'Flipper-Folly', 'Flipper-RSocket'],
    reason: 'after the Flipper debug stack removal',
  },
  {
    podName: 'CodePush',
    matchNames: ['CodePush', 'react-native-code-push'],
    reason: 'after the CodePush removal',
  },
];

export const trackedPodPackagePairs = [
  ['RNBootSplash', 'react-native-bootsplash'],
  ['react-native-config', 'react-native-config'],
  ['RNCAsyncStorage', '@react-native-async-storage/async-storage'],
  ['RNDeviceInfo', 'react-native-device-info'],
  ['RNFastImage', 'react-native-fast-image'],
  ['RNFBApp', '@react-native-firebase/app'],
  ['RNGestureHandler', 'react-native-gesture-handler'],
  ['RNLocalize', 'react-native-localize'],
  ['RNScreens', 'react-native-screens'],
  ['RNSentry', '@sentry/react-native'],
  ['RNVectorIcons', 'react-native-vector-icons'],
];

export const collectIosPodfileLockDrift = ({ packageJson, podfileLock }) => {
  const podfileLockDriftIssues = [];
  const removedPodfileLockDriftIssues = [];
  const reactNativeVersion = normalizePackageVersion(packageJson.dependencies['react-native']);
  const reactCoreLockVersion = getLockedPodVersion(podfileLock, 'React-Core');

  if (reactCoreLockVersion && reactCoreLockVersion !== reactNativeVersion) {
    podfileLockDriftIssues.push(`ios/Podfile.lock has React-Core ${reactCoreLockVersion}; package.json has react-native ${reactNativeVersion}`);
  }

  removedPodfileLockChecks.forEach(({ podName, matchNames, reason }) => {
    if (matchNames.some(matchName => podfileLock.includes(matchName))) {
      const issue = `ios/Podfile.lock still references removed ${podName}; run pod install on macOS ${reason}`;
      podfileLockDriftIssues.push(issue);
      removedPodfileLockDriftIssues.push(issue);
    }
  });

  trackedPodPackagePairs.forEach(([podName, packageName]) => {
    const lockedVersion = getLockedPodVersion(podfileLock, podName);
    const packageVersion = normalizePackageVersion(packageJson.dependencies[packageName]);

    if (lockedVersion && packageVersion && lockedVersion !== packageVersion) {
      podfileLockDriftIssues.push(`ios/Podfile.lock has ${podName} ${lockedVersion}; package.json has ${packageName} ${packageVersion}`);
    }
  });

  return {
    podfileLockDriftIssues,
    removedPodfileLockDriftIssues,
  };
};
