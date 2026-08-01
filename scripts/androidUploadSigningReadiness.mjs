import { existsSync, readFileSync, realpathSync, statSync } from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

export const uploadSigningFields = Object.freeze([
  Object.freeze({ property: 'storeFile', environment: 'GOLDWALLET_UPLOAD_STORE_FILE', secret: false }),
  Object.freeze({ property: 'storePassword', environment: 'GOLDWALLET_UPLOAD_STORE_PASSWORD', secret: true }),
  Object.freeze({ property: 'keyAlias', environment: 'GOLDWALLET_UPLOAD_KEY_ALIAS', secret: false }),
  Object.freeze({ property: 'keyPassword', environment: 'GOLDWALLET_UPLOAD_KEY_PASSWORD', secret: true }),
]);

const parseProperties = content => {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;

    const separatorIndexes = [line.indexOf('='), line.indexOf(':')].filter(index => index >= 0);
    const separatorIndex = separatorIndexes.length > 0 ? Math.min(...separatorIndexes) : line.search(/\s/);
    const key = (separatorIndex >= 0 ? line.slice(0, separatorIndex) : line).trim();
    const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : '';
    result[key] = value;
  }

  return result;
};

const isRegularFile = candidate => {
  try {
    return Boolean(candidate && existsSync(candidate) && statSync(candidate).isFile());
  } catch {
    return false;
  }
};

const pathExists = candidate => {
  try {
    return Boolean(candidate && existsSync(candidate));
  } catch {
    return false;
  }
};

const defaultIgnoredPathCheck = (root, candidate) =>
  spawnSync('git', ['check-ignore', '--quiet', '--', candidate], { cwd: root, stdio: 'ignore' }).status === 0;

const defaultTrackedPathCheck = (root, candidate) =>
  spawnSync('git', ['ls-files', '--error-unmatch', '--', candidate], { cwd: root, stdio: 'ignore' }).status === 0;

const defaultCommittedPathCheck = (root, candidate) => {
  const relative = path.relative(root, candidate).split(path.sep).join('/');
  return spawnSync('git', ['cat-file', '-e', `HEAD:${relative}`], { cwd: root, stdio: 'ignore' }).status === 0;
};

export const getSensitivePathSafety = ({
  root,
  candidate,
  ignoredPathCheck = defaultIgnoredPathCheck,
  trackedPathCheck = defaultTrackedPathCheck,
  committedPathCheck = defaultCommittedPathCheck,
  realpathResolver = realpathSync,
}) => {
  if (!candidate) return { safe: false, state: 'missing' };
  let canonicalPath;
  try {
    canonicalPath = realpathResolver(candidate);
  } catch {
    canonicalPath = path.resolve(candidate);
  }
  const canonicalRoot = realpathResolver(root);
  const relative = path.relative(canonicalRoot, canonicalPath);
  const insideRoot = !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  if (!insideRoot) return { safe: true, state: 'outside-repository' };
  if (trackedPathCheck(canonicalRoot, canonicalPath) || committedPathCheck(canonicalRoot, canonicalPath)) {
    return { safe: false, state: 'tracked' };
  }
  if (ignoredPathCheck(canonicalRoot, canonicalPath)) return { safe: true, state: 'ignored' };
  return { safe: false, state: 'unignored' };
};

export const resolveAndroidUploadSigningConfiguration = ({
  root,
  env = process.env,
  sensitivePathCheck = getSensitivePathSafety,
}) => {
  const androidRoot = path.join(root, 'android');
  const propertiesSetting = env.GOLDWALLET_UPLOAD_KEYSTORE_PROPERTIES || 'keystore.properties';
  const propertiesPath = path.isAbsolute(propertiesSetting)
    ? propertiesSetting
    : path.resolve(androidRoot, propertiesSetting);
  const propertiesPathExists = pathExists(propertiesPath);
  const propertiesFileExists = isRegularFile(propertiesPath);
  const properties = propertiesFileExists ? parseProperties(readFileSync(propertiesPath, 'utf8')) : {};
  const credentials = {};
  const sources = {};

  for (const field of uploadSigningFields) {
    if (env[field.environment]) {
      credentials[field.property] = env[field.environment];
      sources[field.property] = 'environment';
    } else if (properties[field.property]) {
      credentials[field.property] = properties[field.property];
      sources[field.property] = 'properties';
    } else {
      credentials[field.property] = '';
      sources[field.property] = 'missing';
    }
  }

  const missingFields = uploadSigningFields
    .map(field => field.property)
    .filter(property => !credentials[property]);
  const configuredCount = uploadSigningFields.length - missingFields.length;
  const configured = configuredCount === uploadSigningFields.length;
  const partial = configuredCount > 0 && !configured;
  const storeFilePath = credentials.storeFile
    ? path.isAbsolute(credentials.storeFile)
      ? credentials.storeFile
      : path.resolve(androidRoot, credentials.storeFile)
    : '';
  const storeFileExists = isRegularFile(storeFilePath);
  const propertiesPathSafety = propertiesPathExists
    ? propertiesFileExists
      ? sensitivePathCheck({ root, candidate: propertiesPath })
      : { safe: false, state: 'not-regular' }
    : { safe: true, state: 'absent' };
  const storeFilePathSafety = storeFileExists
    ? sensitivePathCheck({ root, candidate: storeFilePath })
    : { safe: false, state: storeFilePath ? 'not-regular' : 'missing' };

  return {
    credentials,
    safe: {
      state: configured ? 'configured' : partial ? 'partial' : 'absent',
      configured,
      partial,
      ready: configured && storeFileExists && propertiesPathSafety.safe && storeFilePathSafety.safe,
      missingFields,
      sources,
      propertiesPath,
      propertiesFileExists,
      propertiesPathSafety,
      storeFilePath,
      storeFileExists,
      storeFilePathSafety,
    },
  };
};

export const getAndroidUploadSigningSummaryErrors = (summary, resolved) => {
  const requiredLines = [
    'Android upload signing readiness',
    `Configuration state: ${resolved.safe.state}`,
    `Properties file present: ${resolved.safe.propertiesFileExists ? 'yes' : 'no'}`,
    `Properties path status: ${resolved.safe.propertiesPathSafety.state}`,
    `Keystore file present: ${resolved.safe.storeFileExists ? 'yes' : 'no'}`,
    `Keystore path status: ${resolved.safe.storeFilePathSafety.state}`,
    'Secret values printed: no',
  ];
  const errors = requiredLines
    .filter(line => !summary.includes(line))
    .map(line => `Android upload signing summary is missing required evidence: ${line}`);
  const aliasVerification = summary.match(/^Alias verification: (passed|failed|not-run)$/m)?.[1];
  const productionReady = summary.match(/^Production signing ready: (yes|no)$/m)?.[1];

  if (!aliasVerification) errors.push('Android upload signing summary has invalid alias verification evidence');
  if (!productionReady) errors.push('Android upload signing summary has invalid production readiness evidence');
  const expectedProductionReady = resolved.safe.ready && aliasVerification === 'passed' ? 'yes' : 'no';
  if (productionReady !== expectedProductionReady) {
    errors.push('Android upload signing summary readiness does not match safe configuration and alias verification');
  }

  for (const field of uploadSigningFields.filter(candidate => candidate.secret)) {
    const value = resolved.credentials[field.property];
    if (value && summary.includes(value)) {
      errors.push(`Android upload signing summary leaks ${field.property}`);
    }
  }

  return errors;
};
