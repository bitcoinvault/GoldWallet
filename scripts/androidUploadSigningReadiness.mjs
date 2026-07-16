import { existsSync, readFileSync } from 'fs';
import path from 'path';

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

export const resolveAndroidUploadSigningConfiguration = ({ root, env = process.env }) => {
  const androidRoot = path.join(root, 'android');
  const propertiesSetting = env.GOLDWALLET_UPLOAD_KEYSTORE_PROPERTIES || 'keystore.properties';
  const propertiesPath = path.isAbsolute(propertiesSetting)
    ? propertiesSetting
    : path.resolve(androidRoot, propertiesSetting);
  const properties = existsSync(propertiesPath) ? parseProperties(readFileSync(propertiesPath, 'utf8')) : {};
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
  const storeFileExists = Boolean(storeFilePath && existsSync(storeFilePath));

  return {
    credentials,
    safe: {
      state: configured ? 'configured' : partial ? 'partial' : 'absent',
      configured,
      partial,
      ready: configured && storeFileExists,
      missingFields,
      sources,
      propertiesPath,
      propertiesFileExists: existsSync(propertiesPath),
      storeFilePath,
      storeFileExists,
    },
  };
};

export const getAndroidUploadSigningSummaryErrors = (summary, resolved) => {
  const requiredLines = [
    'Android upload signing readiness',
    `Configuration state: ${resolved.safe.state}`,
    `Properties file present: ${resolved.safe.propertiesFileExists ? 'yes' : 'no'}`,
    `Keystore file present: ${resolved.safe.storeFileExists ? 'yes' : 'no'}`,
    'Secret values printed: no',
  ];
  const errors = requiredLines
    .filter(line => !summary.includes(line))
    .map(line => `Android upload signing summary is missing required evidence: ${line}`);
  const aliasVerification = summary.match(/^Alias verification: (passed|failed|not-run)$/m)?.[1];
  const productionReady = summary.match(/^Production signing ready: (yes|no)$/m)?.[1];

  if (!aliasVerification) errors.push('Android upload signing summary has invalid alias verification evidence');
  if (!productionReady) errors.push('Android upload signing summary has invalid production readiness evidence');
  if (productionReady && productionReady !== (aliasVerification === 'passed' ? 'yes' : 'no')) {
    errors.push('Android upload signing summary readiness does not match alias verification');
  }

  for (const field of uploadSigningFields.filter(candidate => candidate.secret)) {
    const value = resolved.credentials[field.property];
    if (value && summary.includes(value)) {
      errors.push(`Android upload signing summary leaks ${field.property}`);
    }
  }

  return errors;
};
