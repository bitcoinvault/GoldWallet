import { getJetifierRetirementErrors } from './jetifierRetirementGuard.mjs';

const validInput = {
  packageJson: {
    dependencies: { 'react-native-prompt-android': 'git+https://example.invalid/prompt.git#fixed' },
    devDependencies: {},
    scripts: { postinstall: 'patch-package && node scripts/applyRnNodeifyShims.mjs' },
  },
  gradleProperties: 'android.useAndroidX=true\n',
  yarnLock: '"react-native-prompt-android@git+https://example.invalid/prompt.git#fixed":\n',
  promptPatch: [
    'diff --git a/node_modules/react-native-prompt-android/android/build.gradle b/node_modules/react-native-prompt-android/android/build.gradle',
    'diff --git a/node_modules/react-native-prompt-android/android/src/main/java/im/shimo/react/prompt/RNPromptFragment.java b/node_modules/react-native-prompt-android/android/src/main/java/im/shimo/react/prompt/RNPromptFragment.java',
    'diff --git a/node_modules/react-native-prompt-android/android/src/main/java/im/shimo/react/prompt/RNPromptModule.java b/node_modules/react-native-prompt-android/android/src/main/java/im/shimo/react/prompt/RNPromptModule.java',
    '-    implementation "com.android.support:appcompat-v7:27.1.1"',
    '+    implementation "androidx.appcompat:appcompat:1.7.1"',
    '-import android.support.v7.app.AlertDialog;',
    '+import androidx.appcompat.app.AlertDialog;',
    '+    private Bundle mPendingArguments;',
    '+    private Callback mPendingCallback;',
    '+    public void invalidate() {',
    '+        getReactApplicationContext().removeLifecycleEventListener(this);',
    '+            mPendingArguments = args;',
    '+            mPendingCallback = callback;',
    '        return new FragmentManagerHelper(activity.getFragmentManager());',
  ].join('\n'),
  installedPromptBuildGradle: 'implementation "androidx.appcompat:appcompat:1.7.1"',
  installedPromptJava: 'import androidx.appcompat.app.AlertDialog;',
  installedPromptModuleJava: [
    'private Bundle mPendingArguments;',
    'private Callback mPendingCallback;',
    'public void onHostResume() { showPendingAlert(); }',
    'private void showPendingAlert() {',
    'fragmentManagerHelper.showNewAlert(arguments, callback);',
    'public void onHostDestroy() { mIsInForeground = false; }',
    'return new FragmentManagerHelper(activity.getFragmentManager());',
    'public void invalidate() {',
    'removeLifecycleEventListener(this);',
    'mPendingArguments = null;',
    'mPendingCallback = null;',
  ].join('\n'),
  productionAndroidSources: 'FILE: android/app/src/main/java/App.java\npackage io.goldwallet.wallet;',
  productionAndroidSourceFileCount: 1,
  prodReleaseRuntimeClasspath:
    '+--- project :react-native-prompt-android\n|    +--- androidx.appcompat:appcompat:1.7.1',
};

const assertAccepted = (label, input) => {
  const errors = getJetifierRetirementErrors(input);
  if (errors.length > 0) {
    console.error(`${label} should pass, but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

const assertRejected = (label, input, expectedError) => {
  const errors = getJetifierRetirementErrors(input);
  if (!errors.some(error => error.includes(expectedError))) {
    console.error(`${label} should reject with "${expectedError}", but produced:`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

assertAccepted('Valid Jetifier retirement fixture', validInput);
assertRejected(
  'Dependency regression fixture',
  { ...validInput, packageJson: { ...validInput.packageJson, devDependencies: { jetifier: '2.0.0' } } },
  'must not contain jetifier',
);
assertRejected(
  'Postinstall regression fixture',
  {
    ...validInput,
    packageJson: {
      ...validInput.packageJson,
      scripts: { postinstall: `${validInput.packageJson.scripts.postinstall} && npx jetify` },
    },
  },
  'must not invoke Jetifier',
);
assertRejected(
  'Missing patch-package fixture',
  {
    ...validInput,
    packageJson: {
      ...validInput.packageJson,
      scripts: { postinstall: 'node scripts/applyRnNodeifyShims.mjs' },
    },
  },
  'must apply the react-native-prompt-android patch',
);
assertRejected(
  'Gradle property regression fixture',
  { ...validInput, gradleProperties: `${validInput.gradleProperties}android.enableJetifier=true\n` },
  'must not configure android.enableJetifier',
);
assertRejected(
  'Lockfile regression fixture',
  { ...validInput, yarnLock: `${validInput.yarnLock}\njetifier@2.0.0:\n` },
  'must not contain the retired jetifier package',
);
assertRejected(
  'Missing prompt lockfile fixture',
  { ...validInput, yarnLock: '' },
  'must contain the pinned react-native-prompt-android dependency',
);
assertRejected(
  'Prompt source regression fixture',
  { ...validInput, installedPromptJava: 'import android.support.v7.app.AlertDialog;' },
  'must not import support AlertDialog',
);
assertRejected(
  'Prompt dependency regression fixture',
  { ...validInput, installedPromptBuildGradle: 'implementation "com.android.support:appcompat-v7:27.1.1"' },
  'must not depend on support AppCompat',
);
assertRejected(
  'Missing installed prompt build fixture',
  { ...validInput, installedPromptBuildGradle: undefined },
  'build.gradle is required',
);
assertRejected(
  'Missing installed prompt source fixture',
  { ...validInput, installedPromptJava: undefined },
  'Java source is required',
);
assertRejected(
  'Prompt lifecycle regression fixture',
  { ...validInput, installedPromptModuleJava: 'return new FragmentManagerHelper(activity.getFragmentManager());' },
  'must retain pending prompt arguments across host resume',
);
assertRejected(
  'Prompt Activity replacement regression fixture',
  {
    ...validInput,
    installedPromptModuleJava: validInput.installedPromptModuleJava.replace(
      'public void onHostDestroy() { mIsInForeground = false; }',
      'public void onHostDestroy() { mPendingArguments = null; mPendingCallback = null; }',
    ),
  },
  'must preserve pending prompt state across Activity replacement',
);
assertRejected(
  'Prompt invalidation regression fixture',
  {
    ...validInput,
    installedPromptModuleJava: validInput.installedPromptModuleJava.replace('removeLifecycleEventListener(this);', ''),
  },
  'must unregister its lifecycle listener during invalidation',
);
assertRejected(
  'Prompt resume delivery regression fixture',
  {
    ...validInput,
    installedPromptModuleJava: validInput.installedPromptModuleJava.replace('showPendingAlert();', ''),
  },
  'must deliver pending prompt state during host resume',
);
assertRejected(
  'Prompt pending handoff regression fixture',
  {
    ...validInput,
    installedPromptModuleJava: validInput.installedPromptModuleJava.replace(
      'fragmentManagerHelper.showNewAlert(arguments, callback);',
      '',
    ),
  },
  'must hand pending arguments and callback to the current FragmentManager helper',
);
assertRejected(
  'Missing installed prompt module fixture',
  { ...validInput, installedPromptModuleJava: undefined },
  'module source is required',
);
assertRejected(
  'Production source regression fixture',
  {
    ...validInput,
    productionAndroidSources:
      'FILE: android/app/src/prod/java/ProdProvider.java\nimport android.support.v4.content.FileProvider;',
  },
  'production Android sources must not reference',
);
assertRejected(
  'Empty production source inventory fixture',
  { ...validInput, productionAndroidSources: '', productionAndroidSourceFileCount: 0 },
  'production Android source inventory is required',
);
assertRejected(
  'Missing production source inventory fixture',
  {
    ...validInput,
    productionAndroidSources: undefined,
    productionAndroidSourceFileCount: undefined,
  },
  'production Android source inventory is required',
);
assertRejected(
  'Runtime graph regression fixture',
  {
    ...validInput,
    prodReleaseRuntimeClasspath:
      '+--- project :react-native-prompt-android\n|    +--- com.android.support:support-v4:27.1.1',
  },
  'prodReleaseRuntimeClasspath must not contain',
);
assertRejected(
  'Missing runtime graph fixture',
  { ...validInput, prodReleaseRuntimeClasspath: undefined },
  'prodReleaseRuntimeClasspath resolution is required',
);
assertRejected(
  'Missing prompt runtime project fixture',
  { ...validInput, prodReleaseRuntimeClasspath: '+--- androidx.appcompat:appcompat:1.7.1' },
  'must include the wallet-critical react-native-prompt-android project',
);
assertRejected(
  'Missing AndroidX AppCompat runtime fixture',
  { ...validInput, prodReleaseRuntimeClasspath: '+--- project :react-native-prompt-android' },
  'must resolve react-native-prompt-android through AndroidX AppCompat 1.7.1',
);

console.log('Jetifier retirement guard checks passed.');
