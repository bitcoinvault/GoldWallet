import { existsSync, readFileSync } from 'fs';
import path from 'path';
import semver from 'semver';

const parseProperties = content =>
  Object.fromEntries(
    content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const separator = line.indexOf('=');
        if (separator < 1) throw new Error(`Invalid Android release version property: ${line}`);
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      }),
  );

const parsePositiveInteger = (value, label) => {
  if (!/^[1-9]\d*$/.test(String(value || ''))) throw new Error(`${label} must be a positive integer`);
  return Number(value);
};

export const resolveAndroidReleaseVersion = root => {
  const versionPath = path.join(root, 'android', 'release-version.properties');
  if (!existsSync(versionPath)) throw new Error(`Missing Android release version file: ${versionPath}`);
  const properties = parseProperties(readFileSync(versionPath, 'utf8'));
  const versionCode = parsePositiveInteger(properties.versionCode, 'Android release versionCode');
  const versionName = semver.valid(properties.versionName);
  if (!versionName) throw new Error('Android release versionName must be a valid semantic version');
  return { versionCode, versionName, versionPath };
};

export const resolveAndroidPlayReleaseReadiness = ({ root, env = process.env }) => {
  const release = resolveAndroidReleaseVersion(root);
  const baselinePath = path.join(root, 'android', 'play-release-baseline.json');
  if (!existsSync(baselinePath)) throw new Error(`Missing Android Play release baseline: ${baselinePath}`);
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  if (baseline.packageName !== 'io.goldwallet.wallet') throw new Error('Android Play baseline packageName is invalid');
  if (!semver.valid(baseline.publicVersionName)) throw new Error('Android Play baseline publicVersionName is invalid');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(baseline.observedAt || '')) throw new Error('Android Play baseline observedAt is invalid');
  if (!/^https:\/\/play\.google\.com\/store\/apps\/details\?/.test(baseline.source || '')) {
    throw new Error('Android Play baseline source must be the public Google Play listing');
  }

  const latestVersionCodeRaw = env.GOLDWALLET_PLAY_LATEST_VERSION_CODE || '';
  const latestVersionCode = latestVersionCodeRaw
    ? parsePositiveInteger(latestVersionCodeRaw, 'GOLDWALLET_PLAY_LATEST_VERSION_CODE')
    : null;
  const versionNameAhead = semver.gt(release.versionName, baseline.publicVersionName);
  const versionCodeAhead = latestVersionCode !== null && release.versionCode > latestVersionCode;
  const ready = versionNameAhead && versionCodeAhead;
  const requiredAction = !versionNameAhead
    ? `Set android/release-version.properties versionName above public Google Play version ${baseline.publicVersionName}.`
    : latestVersionCode === null
      ? 'Set GOLDWALLET_PLAY_LATEST_VERSION_CODE from Play Console before building a production upload candidate.'
      : !versionCodeAhead
        ? `Set android/release-version.properties versionCode above Play Console versionCode ${latestVersionCode}.`
        : 'Build the signed AAB and upload it to an internal Play track for external validation.';

  return { release, baseline, latestVersionCode, versionNameAhead, versionCodeAhead, ready, requiredAction };
};

export const requireAndroidReleaseCandidateReadiness = options => {
  const readiness = resolveAndroidPlayReleaseReadiness(options);
  if (!readiness.ready) throw new Error(`Android production release version is not ready. ${readiness.requiredAction}`);
  return readiness;
};

export const getAndroidReleaseVersionSummaryErrors = (summary, readiness) => {
  const requiredLines = [
    'Android release version readiness',
    `Package: ${readiness.baseline.packageName}`,
    `Candidate version code: ${readiness.release.versionCode}`,
    `Candidate version name: ${readiness.release.versionName}`,
    `Public Play version name: ${readiness.baseline.publicVersionName}`,
    `Public Play baseline observed: ${readiness.baseline.observedAt}`,
    `Latest Play version code input: ${readiness.latestVersionCode ?? 'missing'}`,
    `Version name ahead of public Play: ${readiness.versionNameAhead ? 'yes' : 'no'}`,
    `Version code ahead of Play Console: ${readiness.versionCodeAhead ? 'yes' : 'no'}`,
    `Production release version ready: ${readiness.ready ? 'yes' : 'no'}`,
    'Play upload validation: not claimed',
    `Required action: ${readiness.requiredAction}`,
  ];
  return requiredLines
    .filter(line => !summary.includes(line))
    .map(line => `Android release version summary is missing required evidence: ${line}`);
};
