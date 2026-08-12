const dependencyGroups = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

export const getJetifierRetirementErrors = ({
  packageJson,
  gradleProperties,
  yarnLock,
  promptPatch,
  installedPromptBuildGradle,
  installedPromptJava,
  productionAndroidSources,
  productionAndroidSourceFileCount,
  prodReleaseRuntimeClasspath,
}) => {
  const errors = [];

  for (const group of dependencyGroups) {
    if (Object.prototype.hasOwnProperty.call(packageJson[group] || {}, 'jetifier')) {
      errors.push(`package.json ${group} must not contain jetifier`);
    }
  }

  const postinstall = packageJson.scripts?.postinstall || '';
  if (/\b(?:npx\s+)?jetify\b|\bjetifier\b/i.test(postinstall)) {
    errors.push('package.json postinstall must not invoke Jetifier');
  }
  if (!/\bpatch-package\b/.test(postinstall)) {
    errors.push('package.json postinstall must apply the react-native-prompt-android patch with patch-package');
  }

  if (/^\s*android\.enableJetifier\s*=/m.test(gradleProperties)) {
    errors.push('android/gradle.properties must not configure android.enableJetifier');
  }

  if (/^jetifier@|\njetifier@/m.test(yarnLock)) {
    errors.push('yarn.lock must not contain the retired jetifier package');
  }
  if (!/^"?react-native-prompt-android@/m.test(yarnLock)) {
    errors.push('yarn.lock must contain the pinned react-native-prompt-android dependency');
  }

  for (const requiredPatchLine of [
    'diff --git a/node_modules/react-native-prompt-android/android/build.gradle b/node_modules/react-native-prompt-android/android/build.gradle',
    'diff --git a/node_modules/react-native-prompt-android/android/src/main/java/im/shimo/react/prompt/RNPromptFragment.java b/node_modules/react-native-prompt-android/android/src/main/java/im/shimo/react/prompt/RNPromptFragment.java',
    '-    implementation "com.android.support:appcompat-v7:27.1.1"',
    '+    implementation "androidx.appcompat:appcompat:1.7.1"',
    '-import android.support.v7.app.AlertDialog;',
    '+import androidx.appcompat.app.AlertDialog;',
  ]) {
    if (!promptPatch.includes(requiredPatchLine)) {
      errors.push(`react-native-prompt-android patch must contain: ${requiredPatchLine}`);
    }
  }

  if (typeof installedPromptBuildGradle !== 'string' || installedPromptBuildGradle.length === 0) {
    errors.push('installed react-native-prompt-android build.gradle is required for fail-closed validation');
  } else {
    if (installedPromptBuildGradle.includes('com.android.support:appcompat-v7')) {
      errors.push('installed react-native-prompt-android must not depend on support AppCompat');
    }
    if (!installedPromptBuildGradle.includes('androidx.appcompat:appcompat:1.7.1')) {
      errors.push('installed react-native-prompt-android must depend on guarded AndroidX AppCompat');
    }
  }

  if (typeof installedPromptJava !== 'string' || installedPromptJava.length === 0) {
    errors.push('installed react-native-prompt-android Java source is required for fail-closed validation');
  } else {
    if (installedPromptJava.includes('android.support.v7.app.AlertDialog')) {
      errors.push('installed react-native-prompt-android must not import support AlertDialog');
    }
    if (!installedPromptJava.includes('androidx.appcompat.app.AlertDialog')) {
      errors.push('installed react-native-prompt-android must import AndroidX AlertDialog');
    }
  }

  if (
    typeof productionAndroidSources !== 'string' ||
    productionAndroidSources.trim().length === 0 ||
    !Number.isInteger(productionAndroidSourceFileCount) ||
    productionAndroidSourceFileCount < 1
  ) {
    errors.push('production Android source inventory is required for fail-closed validation');
  } else {
    const activeSupportReference = productionAndroidSources
      .replaceAll('android.support.FILE_PROVIDER_PATHS', '')
      .match(/android\.support\.[A-Za-z0-9_.]+|com\.android\.support:[A-Za-z0-9_.-]+/);

    if (activeSupportReference) {
      errors.push(`production Android sources must not reference the legacy Support Library: ${activeSupportReference[0]}`);
    }
  }

  if (typeof prodReleaseRuntimeClasspath !== 'string' || prodReleaseRuntimeClasspath.length === 0) {
    errors.push('prodReleaseRuntimeClasspath resolution is required for fail-closed validation');
  } else {
    const supportArtifact = prodReleaseRuntimeClasspath.match(/com\.android\.support:[A-Za-z0-9_.-]+(?::[^\s()]+)?/);

    if (supportArtifact) {
      errors.push(`prodReleaseRuntimeClasspath must not contain legacy Support Library artifacts: ${supportArtifact[0]}`);
    }
    if (!prodReleaseRuntimeClasspath.includes('project :react-native-prompt-android')) {
      errors.push('prodReleaseRuntimeClasspath must include the wallet-critical react-native-prompt-android project');
    }
    if (!prodReleaseRuntimeClasspath.includes('androidx.appcompat:appcompat:1.7.1')) {
      errors.push('prodReleaseRuntimeClasspath must resolve react-native-prompt-android through AndroidX AppCompat 1.7.1');
    }
  }

  return errors;
};
