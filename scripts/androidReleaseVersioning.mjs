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

const loadReleaseVersionContract = root => {
  const contractPath = path.join(root, 'android', 'release-version-contract.json');
  if (!existsSync(contractPath)) throw new Error(`Missing Android release version contract: ${contractPath}`);
  const contract = JSON.parse(readFileSync(contractPath, 'utf8'));
  if (!Number.isSafeInteger(contract.maxVersionCode) || contract.maxVersionCode < 1) {
    throw new Error('Android release version contract maxVersionCode is invalid');
  }
  if (!Number.isSafeInteger(contract.maxCoreVersionNumber) || contract.maxCoreVersionNumber < 1) {
    throw new Error('Android release version contract maxCoreVersionNumber is invalid');
  }
  if (!Number.isSafeInteger(contract.maxVersionNameLength) || contract.maxVersionNameLength < 1) {
    throw new Error('Android release version contract maxVersionNameLength is invalid');
  }
  if (typeof contract.versionNamePattern !== 'string' || !contract.versionNamePattern) {
    throw new Error('Android release version contract versionNamePattern is invalid');
  }
  return { ...contract, versionNameRegex: new RegExp(contract.versionNamePattern), contractPath };
};

const parsePositiveInteger = (value, label, maximum) => {
  if (!/^[1-9]\d*$/.test(String(value || ''))) throw new Error(`${label} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    throw new Error(`${label} must not exceed ${maximum}`);
  }
  return parsed;
};

const parseVersionName = (value, label, contract) => {
  const candidate = value || '';
  const coreNumbers = candidate.split(/[-+]/, 1)[0]?.split('.') || [];
  if (
    candidate.length > contract.maxVersionNameLength ||
    !contract.versionNameRegex.test(candidate) ||
    coreNumbers.some(number => !Number.isSafeInteger(Number(number)) || Number(number) > contract.maxCoreVersionNumber) ||
    !semver.valid(candidate)
  ) {
    throw new Error(`${label} must be a valid semantic version`);
  }
  return candidate;
};

export const resolveAndroidReleaseVersion = root => {
  const contract = loadReleaseVersionContract(root);
  const versionPath = path.join(root, 'android', 'release-version.properties');
  if (!existsSync(versionPath)) throw new Error(`Missing Android release version file: ${versionPath}`);
  const properties = parseProperties(readFileSync(versionPath, 'utf8'));
  const versionCode = parsePositiveInteger(
    properties.versionCode,
    'Android release versionCode',
    contract.maxVersionCode,
  );
  const versionName = parseVersionName(properties.versionName, 'Android release versionName', contract);
  return { versionCode, versionName, versionPath, contract };
};

export const resolveAndroidPlayReleaseReadiness = ({ root, env = process.env }) => {
  const release = resolveAndroidReleaseVersion(root);
  const baselinePath = path.join(root, 'android', 'play-release-baseline.json');
  if (!existsSync(baselinePath)) throw new Error(`Missing Android Play release baseline: ${baselinePath}`);
  const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  if (baseline.packageName !== 'io.goldwallet.wallet') throw new Error('Android Play baseline packageName is invalid');
  try {
    parseVersionName(baseline.publicVersionName, 'Android Play baseline publicVersionName', release.contract);
  } catch {
    throw new Error('Android Play baseline publicVersionName is invalid');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(baseline.observedAt || '')) throw new Error('Android Play baseline observedAt is invalid');
  if (!/^https:\/\/play\.google\.com\/store\/apps\/details\?/.test(baseline.source || '')) {
    throw new Error('Android Play baseline source must be the public Google Play listing');
  }

  const latestVersionCodeRaw = env.GOLDWALLET_PLAY_LATEST_VERSION_CODE || '';
  const latestVersionCode = latestVersionCodeRaw
    ? parsePositiveInteger(
        latestVersionCodeRaw,
        'GOLDWALLET_PLAY_LATEST_VERSION_CODE',
        release.contract.maxVersionCode,
      )
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
    `Google Play version code limit: ${readiness.release.contract.maxVersionCode}`,
    'Candidate version code within Google Play limit: yes',
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
