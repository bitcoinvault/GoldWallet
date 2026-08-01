import assert from 'assert';
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(os.tmpdir(), `goldwallet-release-version-gradle-${process.pid}`);
const gradleCommand = path.join(root, 'android', process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

const runFixture = ({ versionCode, versionName, expectedStatus, expectedText }) => {
  writeFileSync(
    path.join(fixtureRoot, 'release-version.properties'),
    `versionCode=${versionCode}\nversionName=${versionName}\n`,
  );
  const gradleArgs = ['-p', fixtureRoot, '--no-daemon', '--console=plain', 'printReleaseVersion'];
  const command = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : gradleCommand;
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', `""${gradleCommand}" -p "${fixtureRoot}" --no-daemon --console=plain printReleaseVersion"`]
      : gradleArgs;
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    windowsVerbatimArguments: process.platform === 'win32',
  });
  const output = `${result.stdout || ''}\n${result.stderr || ''}\n${result.error?.message || ''}`;
  assert.strictEqual(result.status, expectedStatus, output);
  assert(output.includes(expectedText), `Gradle output is missing ${expectedText}:\n${output}`);
};

try {
  mkdirSync(fixtureRoot, { recursive: true });
  copyFileSync(path.join(root, 'android', 'release-version.gradle'), path.join(fixtureRoot, 'release-version.gradle'));
  copyFileSync(
    path.join(root, 'android', 'release-version-contract.json'),
    path.join(fixtureRoot, 'release-version-contract.json'),
  );
  writeFileSync(path.join(fixtureRoot, 'settings.gradle'), "rootProject.name = 'goldwallet-release-version-fixture'\n");
  writeFileSync(
    path.join(fixtureRoot, 'build.gradle'),
    [
      "apply from: rootProject.file('release-version.gradle')",
      "tasks.register('printReleaseVersion') {",
      "    doLast { println \"VERSION=${goldwalletReleaseVersion.versionCode}:${goldwalletReleaseVersion.versionName}\" }",
      '}',
      '',
    ].join('\n'),
  );

  runFixture({ versionCode: '15', versionName: '6.5.3', expectedStatus: 0, expectedText: 'VERSION=15:6.5.3' });
  runFixture({
    versionCode: '2100000000',
    versionName: '6.5.3-rc.1+build.1',
    expectedStatus: 0,
    expectedText: 'VERSION=2100000000:6.5.3-rc.1+build.1',
  });
  runFixture({
    versionCode: '2100000001',
    versionName: '6.5.3',
    expectedStatus: 1,
    expectedText: 'versionCode must not exceed 2100000000',
  });
  runFixture({
    versionCode: '15',
    versionName: '06.5.3',
    expectedStatus: 1,
    expectedText: 'versionName must be a valid semantic version',
  });
  runFixture({
    versionCode: '15',
    versionName: '9007199254740992.0.0',
    expectedStatus: 1,
    expectedText: 'versionName must be a valid semantic version',
  });
  runFixture({
    versionCode: '15',
    versionName: `1.2.3+${'a'.repeat(250)}`,
    expectedStatus: 0,
    expectedText: `VERSION=15:1.2.3+${'a'.repeat(250)}`,
  });
  runFixture({
    versionCode: '15',
    versionName: `1.2.3+${'a'.repeat(251)}`,
    expectedStatus: 1,
    expectedText: 'versionName must be a valid semantic version',
  });
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('Android release version Gradle contract checks passed.');
