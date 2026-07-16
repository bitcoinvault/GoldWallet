import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

import { getAppCenterRetirementErrors } from './appCenterRetirementGuard.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const textExtensions = new Set(['.gradle', '.h', '.java', '.json', '.kt', '.m', '.mm', '.pbxproj', '.plist', '.swift', '.xml']);

const listTrackedFiles = () => {
  const result = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || result.stderr?.trim() || `git ls-files exited ${result.status}`);
  }
  return result.stdout.split('\0').filter(Boolean);
};

const main = () => {
  const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const dependencyNames = Object.keys({
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.optionalDependencies,
    ...packageJson.peerDependencies,
  });
  const trackedFiles = listTrackedFiles().filter(filePath => existsSync(path.join(root, filePath)));
  const nativeTrackedFiles = trackedFiles.filter(filePath =>
    /^(android\/app\/src\/|ios\/)/.test(filePath.replace(/\\/g, '/')),
  );
  const trackedFileContents = {};

  for (const filePath of nativeTrackedFiles) {
    const absolutePath = path.join(root, filePath);
    if (existsSync(absolutePath) && textExtensions.has(path.extname(filePath))) {
      trackedFileContents[filePath] = readFileSync(absolutePath, 'utf8');
    }
  }

  const errors = getAppCenterRetirementErrors({ dependencyNames, trackedFiles, trackedFileContents });
  if (errors.length > 0) {
    console.error('App Center retirement validation failed:');
    errors.forEach(error => console.error(`- ${error}`));
    return 1;
  }

  console.log('Retired App Center packages, configuration, resources, and Xcode references are absent.');
  return 0;
};

process.exit(main());
