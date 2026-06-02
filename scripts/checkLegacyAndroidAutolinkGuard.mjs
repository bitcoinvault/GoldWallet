import {
  expectedDisabledAndroidAutolinkPackages,
  getLegacyAndroidAutolinkErrors,
} from './legacyAndroidAutolinkGuard.mjs';

const validFixture = {
  'react-native-prompt-android': {},
  'react-native-camera': {
    platforms: {
      android: null,
    },
  },
};

const assertAccepted = (label, dependencies) => {
  const errors = getLegacyAndroidAutolinkErrors(dependencies);

  if (errors.length > 0) {
    console.error(`${label} should be accepted:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, dependencies) => {
  const errors = getLegacyAndroidAutolinkErrors(dependencies);

  if (errors.length === 0) {
    console.error(`${label} should be rejected.`);
    process.exit(1);
  }
};

assertAccepted('Wallet-critical Android prompt autolink enabled', validFixture);
assertAccepted('Missing prompt config still allows default autolinking', {});
assertRejected('Disabled prompt Android autolink', {
  'react-native-prompt-android': {
    platforms: {
      android: null,
    },
  },
});
assertRejected('Unexpected disabled package', {
  ...validFixture,
  'react-native-new-legacy-module': {
    platforms: {
      android: null,
    },
  },
});

if (expectedDisabledAndroidAutolinkPackages.size !== 1 || !expectedDisabledAndroidAutolinkPackages.has('react-native-camera')) {
  console.error('Expected react-native-camera to be the only guarded legacy Android autolink disable.');
  process.exit(1);
}

console.log('Legacy Android autolink guard checks are valid.');
