import { spawnSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { getJetifierRetirementErrors } from './jetifierRetirementGuard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');
const readRequired = relativePath => {
  const absolutePath = path.join(root, relativePath);
  return existsSync(absolutePath) ? readFileSync(absolutePath, 'utf8') : undefined;
};
const androidSourceExtensions = new Set(['.aidl', '.c', '.cpp', '.gradle', '.h', '.java', '.json', '.kt', '.kts', '.pro', '.properties', '.xml']);
const collectSources = directory => {
  if (!existsSync(directory)) return { contents: '', fileCount: 0 };

  return readdirSync(directory, { withFileTypes: true }).reduce(
    (inventory, entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        const nested = collectSources(entryPath);
        inventory.contents += nested.contents;
        inventory.fileCount += nested.fileCount;
      } else if (androidSourceExtensions.has(path.extname(entry.name).toLowerCase())) {
        inventory.contents += `\nFILE: ${path.relative(root, entryPath)}\n${readFileSync(entryPath, 'utf8')}\n`;
        inventory.fileCount += 1;
      }
      return inventory;
    },
    { contents: '', fileCount: 0 },
  );
};
const productionSourceInventory = ['main', 'prod', 'release', 'prodRelease']
  .map(sourceSet => collectSources(path.join(root, 'android/app/src', sourceSet)))
  .reduce(
    (inventory, sourceSetInventory) => ({
      contents: inventory.contents + sourceSetInventory.contents,
      fileCount: inventory.fileCount + sourceSetInventory.fileCount,
    }),
    { contents: '', fileCount: 0 },
  );
const gradleResult = spawnSync(
  process.execPath,
  [
    path.join(root, 'scripts/runAndroidGradle.mjs'),
    ':app:dependencies',
    '--configuration',
    'prodReleaseRuntimeClasspath',
    '--console=plain',
  ],
  {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  },
);

if (gradleResult.error || gradleResult.status !== 0) {
  console.error('Jetifier retirement check could not resolve prodReleaseRuntimeClasspath.');
  if (gradleResult.stderr) console.error(gradleResult.stderr.trim());
  process.exit(1);
}

const errors = getJetifierRetirementErrors({
  packageJson: JSON.parse(read('package.json')),
  gradleProperties: read('android/gradle.properties'),
  yarnLock: read('yarn.lock'),
  promptPatch: read('patches/react-native-prompt-android+0.3.6.patch'),
  installedPromptBuildGradle: readRequired('node_modules/react-native-prompt-android/android/build.gradle'),
  installedPromptJava: readRequired(
    'node_modules/react-native-prompt-android/android/src/main/java/im/shimo/react/prompt/RNPromptFragment.java',
  ),
  productionAndroidSources: productionSourceInventory.contents,
  productionAndroidSourceFileCount: productionSourceInventory.fileCount,
  prodReleaseRuntimeClasspath: gradleResult.stdout,
});

if (errors.length > 0) {
  console.error(`Jetifier retirement check failed with ${errors.length} error(s):`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Jetifier remains retired and react-native-prompt-android uses the guarded AndroidX patch.');
