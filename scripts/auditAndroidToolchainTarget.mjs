import https from 'https';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { getAndroidToolchainTargetSummaryErrors } from './androidToolchainTargetSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const summaryPath = path.join(root, 'local-docs', 'android-toolchain-target-summary.txt');

const read = relativePath => readFileSync(path.join(root, relativePath), 'utf8');

const fetchText = url =>
  new Promise((resolve, reject) => {
    https
      .get(url, response => {
        let data = '';
        response.on('data', chunk => {
          data += chunk;
        });
        response.on('end', () => resolve(data));
      })
      .on('error', reject);
  });

const extractXmlVersions = xml => [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map(match => match[1]);
const isStableVersion = version => !/[A-Za-z]/.test(version);
const last = values => values[values.length - 1] || '';

const getQuotedGradleValue = (content, name) => content.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`))?.[1] || '';
const getClasspathVersion = (content, artifact) =>
  content.match(new RegExp(`${artifact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:([0-9][^"')]+)`))?.[1] || '';
const getGradleWrapperVersion = content => content.match(/gradle-([0-9.]+)-(?:all|bin)\.zip/)?.[1] || '';

export const collectAndroidToolchainTargetAudit = async () => {
  const androidBuildGradle = read('android/build.gradle');
  const gradleWrapper = read('android/gradle/wrapper/gradle-wrapper.properties');
  const packageJson = JSON.parse(read('package.json'));
  const agpMetadata = await fetchText('https://dl.google.com/dl/android/maven2/com/android/tools/build/gradle/maven-metadata.xml');
  const gradleCurrent = JSON.parse(await fetchText('https://services.gradle.org/versions/current'));
  const kotlinMetadata = await fetchText('https://repo1.maven.org/maven2/org/jetbrains/kotlin/kotlin-gradle-plugin/maven-metadata.xml');
  const latestStableAgp = last(extractXmlVersions(agpMetadata).filter(isStableVersion));
  const kotlinMetadataRelease = kotlinMetadata.match(/<release>([^<]+)<\/release>/)?.[1] || '';
  const latestKotlin = last(extractXmlVersions(kotlinMetadata).filter(isStableVersion));
  const latestGradle = gradleCurrent.version || '';
  const minimumAgp9Gradle = '9.4.1';
  const rnGradlePlugin =
    packageJson.dependencies?.['@react-native/gradle-plugin'] || packageJson.devDependencies?.['@react-native/gradle-plugin'] || '';

  return {
    currentAgp: getClasspathVersion(androidBuildGradle, 'com.android.tools.build:gradle'),
    latestStableAgp,
    currentGradle: getGradleWrapperVersion(gradleWrapper),
    latestGradle,
    minimumAgp9Gradle,
    currentKotlin: getQuotedGradleValue(androidBuildGradle, 'kotlinVersion'),
    latestKotlin,
    kotlinMetadataRelease,
    kotlinMetadataReleasePrerelease: kotlinMetadataRelease && !isStableVersion(kotlinMetadataRelease) ? 'yes' : 'no',
    rnGradlePlugin,
    blocked: true,
    blockers: [
      `AGP ${latestStableAgp} requires Gradle ${minimumAgp9Gradle} or newer.`,
      `Gradle ${minimumAgp9Gradle} and ${latestGradle} load newer embedded Kotlin runtime metadata that the React Native Gradle plugin ${rnGradlePlugin} Kotlin compiler path cannot read during :gradle-plugin:settings-plugin:compileKotlin.`,
      `The validated Android baseline remains AGP ${getClasspathVersion(androidBuildGradle, 'com.android.tools.build:gradle')}, Gradle ${getGradleWrapperVersion(
        gradleWrapper,
      )}, Kotlin ${getQuotedGradleValue(androidBuildGradle, 'kotlinVersion')}, compile/target SDK 36, and JDK 17 until a newer React Native Gradle plugin baseline clears the blocker.`,
    ],
  };
};

export const formatAndroidToolchainTargetSummary = (audit, generatedAt = new Date().toISOString()) =>
  [
    'Android toolchain target audit',
    `Generated at: ${generatedAt}`,
    `Current Android Gradle Plugin: ${audit.currentAgp}`,
    `Latest stable Android Gradle Plugin: ${audit.latestStableAgp}`,
    `Current Gradle wrapper: ${audit.currentGradle}`,
    `Latest Gradle current: ${audit.latestGradle}`,
    `AGP 9 minimum Gradle wrapper: ${audit.minimumAgp9Gradle}`,
    `Current Kotlin Gradle Plugin: ${audit.currentKotlin}`,
    `Latest Kotlin Gradle Plugin: ${audit.latestKotlin}`,
    `Latest Kotlin metadata release: ${audit.kotlinMetadataRelease}`,
    `Latest Kotlin metadata release prerelease: ${audit.kotlinMetadataReleasePrerelease}`,
    `React Native Gradle plugin: ${audit.rnGradlePlugin}`,
    `Latest Android toolchain target blocked: ${audit.blocked ? 'yes' : 'no'}`,
    `Blockers: ${audit.blockers.length}`,
    ...audit.blockers.map(blocker => `- ${blocker}`),
    'Required action: keep the validated AGP 8.13 Android baseline until a React Native Gradle plugin baseline can compile against AGP 9 / Gradle 9, then rerun Android assemble, release validation, and emulator smoke.',
    '',
  ].join('\n');

const printReport = async () => {
  const audit = await collectAndroidToolchainTargetAudit();
  const summary = formatAndroidToolchainTargetSummary(audit);
  const summaryErrors = getAndroidToolchainTargetSummaryErrors(summary);

  mkdirSync(path.dirname(summaryPath), { recursive: true });
  writeFileSync(summaryPath, summary);
  console.log(summary.trim());
  console.log(`Android toolchain target summary written to ${path.relative(root, summaryPath)}`);

  if (summaryErrors.length > 0) {
    console.error('Android toolchain target summary is invalid:');
    summaryErrors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await printReport();
}
