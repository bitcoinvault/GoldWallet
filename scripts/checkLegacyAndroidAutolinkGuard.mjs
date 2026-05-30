import {
  expectedDisabledAndroidAutolinkPackages,
  getLegacyAndroidAutolinkErrors,
} from './legacyAndroidAutolinkGuard.mjs';

const validFixture = {
  'react-native-prompt-android': {
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

assertAccepted('Known legacy Android autolink disables', validFixture);
assertRejected('Missing prompt Android disable', {});
assertRejected('Unexpected disabled package', {
  ...validFixture,
  'react-native-new-legacy-module': {
    platforms: {
      android: null,
    },
  },
});

if (expectedDisabledAndroidAutolinkPackages.size !== 1) {
  console.error(`Expected 1 guarded legacy Android autolink disable, got ${expectedDisabledAndroidAutolinkPackages.size}.`);
  process.exit(1);
}

console.log('Legacy Android autolink guard checks are valid.');
