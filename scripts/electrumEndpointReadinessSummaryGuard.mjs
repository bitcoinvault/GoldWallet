import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(__dirname, '..');
export const summaryPath = path.join(root, 'local-docs', 'electrum-endpoint-readiness-summary.txt');

export const expectedElectrumEnvFiles = [
  '.env.dev.testnet',
  '.env.stage.mainnet',
  '.env.prod.mainnet',
  '.env.beta.testnet',
  '.env.beta.mainnet',
];

export const electrumCertificateWarningDays = 30;

export const classifyElectrumTlsStatus = ({ authorized, expiresInDays }) => {
  const normalizedExpiryDays = String(expiresInDays ?? '');

  if (!/^-?\d+$/.test(normalizedExpiryDays)) {
    return 'tls-authorization-error';
  }

  const expiryDays = Number(normalizedExpiryDays);

  if (expiryDays < 0) {
    return 'certificate-expired';
  }

  if (!authorized) {
    return 'tls-authorization-error';
  }

  return expiryDays <= electrumCertificateWarningDays ? 'certificate-expiring' : 'ready';
};

export const allowedEndpointStatuses = new Set([
  'ready',
  'certificate-expired',
  'certificate-expiring',
  'tls-authorization-error',
  'connection-error',
  'unsupported-protocol',
  'missing-config',
]);

export const getLineValue = (content, label) => {
  const line = content.split(/\r?\n/).find(candidate => candidate.startsWith(`${label}: `));
  return line ? line.slice(label.length + 2).trim() : '';
};

const getEntryLines = content => {
  const lines = content.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line === 'Endpoint entries:');
  const entries = [];

  if (startIndex === -1) {
    return entries;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.startsWith('- ')) {
      break;
    }

    entries.push(line.slice(2));
  }

  return entries;
};

export const parseEndpointEntry = entryLine => {
  const fields = new Map();

  entryLine.split('; ').forEach(part => {
    const separatorIndex = part.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    fields.set(part.slice(0, separatorIndex), part.slice(separatorIndex + 1));
  });

  return fields;
};

const parseInteger = (content, label, errors) => {
  const value = getLineValue(content, label);

  if (!/^\d+$/.test(value)) {
    errors.push(`${label} must be a non-negative integer. Received: ${value || 'missing'}`);
    return 0;
  }

  return Number(value);
};

export const getElectrumEndpointReadinessSummaryErrors = summary => {
  const errors = [];

  if (!summary.startsWith('Electrum endpoint readiness audit')) {
    errors.push('summary header is missing or invalid');
  }

  const generatedAt = getLineValue(summary, 'Generated at');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    errors.push(`Generated at must be an ISO timestamp. Received: ${generatedAt || 'missing'}`);
  }

  const envFilesScanned = parseInteger(summary, 'Env files scanned', errors);
  const endpointEntries = parseInteger(summary, 'Electrum endpoint entries', errors);
  const uniqueEndpoints = parseInteger(summary, 'Unique endpoints', errors);
  const certificateWarningThresholdDays = parseInteger(summary, 'Certificate warning threshold days', errors);
  const readyEntries = parseInteger(summary, 'Ready entries', errors);
  const certificateExpiredEntries = parseInteger(summary, 'Certificate expired entries', errors);
  const certificateExpiringEntries = parseInteger(summary, 'Certificate expiring entries', errors);
  const uniqueExpiredEndpoints = parseInteger(summary, 'Unique expired endpoints', errors);
  const uniqueExpiringEndpoints = parseInteger(summary, 'Unique expiring endpoints', errors);
  const tlsAuthorizationErrorEntries = parseInteger(summary, 'TLS authorization error entries', errors);
  const connectionErrorEntries = parseInteger(summary, 'Connection error entries', errors);
  const unsupportedProtocolEntries = parseInteger(summary, 'Unsupported protocol entries', errors);
  const missingConfigEntries = parseInteger(summary, 'Missing config entries', errors);
  const secretValuesPrinted = getLineValue(summary, 'Secret values printed');
  const requiredAction = getLineValue(summary, 'Required action');
  const entries = getEntryLines(summary);
  const parsedEntries = entries.map(parseEndpointEntry);
  const countedStatuses = {
    ready: 0,
    'certificate-expired': 0,
    'certificate-expiring': 0,
    'tls-authorization-error': 0,
    'connection-error': 0,
    'unsupported-protocol': 0,
    'missing-config': 0,
  };
  const expiredEndpoints = new Set();
  const expiringEndpoints = new Set();

  if (envFilesScanned !== expectedElectrumEnvFiles.length) {
    errors.push(`Env files scanned must be ${expectedElectrumEnvFiles.length}. Received: ${envFilesScanned}`);
  }

  if (endpointEntries !== entries.length) {
    errors.push(`Electrum endpoint entries count is ${endpointEntries}, but listed ${entries.length}`);
  }

  if (certificateWarningThresholdDays !== electrumCertificateWarningDays) {
    errors.push(
      `Certificate warning threshold days must be ${electrumCertificateWarningDays}. Received: ${certificateWarningThresholdDays}`,
    );
  }

  if (secretValuesPrinted !== 'no') {
    errors.push('Electrum endpoint readiness summary must not print secret values');
  }

  expectedElectrumEnvFiles.forEach(envFile => {
    if (!parsedEntries.some(fields => fields.get('env') === envFile)) {
      errors.push(`Electrum endpoint readiness summary is missing env file ${envFile}`);
    }
  });

  parsedEntries.forEach((fields, index) => {
    const lineLabel = `Endpoint entry ${index + 1}`;
    const envFile = fields.get('env');
    const endpoint = fields.get('endpoint');
    const protocol = fields.get('protocol');
    const status = fields.get('status');
    const authorized = fields.get('authorized');
    const expiresInDays = fields.get('expires_in_days');

    if (!envFile) {
      errors.push(`${lineLabel} is missing env`);
    }

    if (!endpoint || !/^[^:\s]+:\d+$/.test(endpoint)) {
      errors.push(`${lineLabel} endpoint must be host:port. Received: ${endpoint || 'missing'}`);
    }

    const protocolAllowed = ['tls', 'tcp', 'missing'].includes(protocol || '') || status === 'unsupported-protocol';
    if (!protocolAllowed) {
      errors.push(`${lineLabel} protocol must be tls, tcp, missing, or an unsupported protocol with unsupported-protocol status. Received: ${protocol || 'missing'}`);
    }

    if (!allowedEndpointStatuses.has(status)) {
      errors.push(`${lineLabel} status is invalid. Received: ${status || 'missing'}`);
    } else {
      countedStatuses[status] += 1;
      if (status === 'certificate-expired') expiredEndpoints.add(endpoint);
      if (status === 'certificate-expiring') expiringEndpoints.add(endpoint);
    }

    if (!['yes', 'no', 'not-applicable'].includes(authorized || '')) {
      errors.push(`${lineLabel} authorized must be yes, no, or not-applicable. Received: ${authorized || 'missing'}`);
    }

    if (protocol === 'tls' && !/^-?\d+$/.test(expiresInDays || '')) {
      errors.push(`${lineLabel} TLS expires_in_days must be an integer. Received: ${expiresInDays || 'missing'}`);
    }

    if (status === 'certificate-expired' && !/^-/.test(expiresInDays || '')) {
      errors.push(`${lineLabel} certificate-expired status must have negative expires_in_days`);
    }

    if (
      status === 'certificate-expiring' &&
      (!/^\d+$/.test(expiresInDays || '') || Number(expiresInDays) > certificateWarningThresholdDays)
    ) {
      errors.push(`${lineLabel} certificate-expiring status must be within the warning threshold`);
    }

    if (status === 'ready' && protocol === 'tls' && Number(expiresInDays) <= certificateWarningThresholdDays) {
      errors.push(`${lineLabel} ready TLS status must be above the warning threshold`);
    }

    if (protocol === 'tls' && ['ready', 'certificate-expiring'].includes(status) && authorized !== 'yes') {
      errors.push(`${lineLabel} ${status} TLS status must be authorized`);
    }
  });

  if (readyEntries !== countedStatuses.ready) {
    errors.push(`Ready entries count is ${readyEntries}, but listed ${countedStatuses.ready}`);
  }

  if (certificateExpiredEntries !== countedStatuses['certificate-expired']) {
    errors.push(
      `Certificate expired entries count is ${certificateExpiredEntries}, but listed ${countedStatuses['certificate-expired']}`,
    );
  }

  if (certificateExpiringEntries !== countedStatuses['certificate-expiring']) {
    errors.push(
      `Certificate expiring entries count is ${certificateExpiringEntries}, but listed ${countedStatuses['certificate-expiring']}`,
    );
  }

  if (uniqueExpiredEndpoints !== expiredEndpoints.size) {
    errors.push(`Unique expired endpoints count is ${uniqueExpiredEndpoints}, but listed ${expiredEndpoints.size}`);
  }

  if (uniqueExpiringEndpoints !== expiringEndpoints.size) {
    errors.push(`Unique expiring endpoints count is ${uniqueExpiringEndpoints}, but listed ${expiringEndpoints.size}`);
  }

  if (tlsAuthorizationErrorEntries !== countedStatuses['tls-authorization-error']) {
    errors.push(
      `TLS authorization error entries count is ${tlsAuthorizationErrorEntries}, but listed ${countedStatuses['tls-authorization-error']}`,
    );
  }

  if (connectionErrorEntries !== countedStatuses['connection-error']) {
    errors.push(`Connection error entries count is ${connectionErrorEntries}, but listed ${countedStatuses['connection-error']}`);
  }

  if (unsupportedProtocolEntries !== countedStatuses['unsupported-protocol']) {
    errors.push(
      `Unsupported protocol entries count is ${unsupportedProtocolEntries}, but listed ${countedStatuses['unsupported-protocol']}`,
    );
  }

  if (missingConfigEntries !== countedStatuses['missing-config']) {
    errors.push(`Missing config entries count is ${missingConfigEntries}, but listed ${countedStatuses['missing-config']}`);
  }

  if (uniqueEndpoints > endpointEntries) {
    errors.push('Unique endpoints cannot be greater than endpoint entries');
  }

  if (certificateExpiredEntries > 0 && !/renew|fix/i.test(requiredAction)) {
    errors.push('Expired certificate summaries must include a renew/fix required action');
  }

  if (certificateExpiringEntries > 0 && !/renew|rotate/i.test(requiredAction)) {
    errors.push('Expiring certificate summaries must include a renew/rotate required action');
  }

  if (/SENTRY_AUTH_TOKEN=|auth\.token=|CODEPUSH_DEPLOYMENT_KEY|SENTRY_DSN_(?:IOS|ANDROID)=|https?:\/\/[^/\s]+@/i.test(summary)) {
    errors.push('Electrum endpoint readiness summary must not print secret-looking values');
  }

  return errors;
};

export const readElectrumEndpointReadinessSummary = ({ fileExists = existsSync, readFile = readFileSync } = {}) => {
  if (!fileExists(summaryPath)) {
    return null;
  }

  return readFile(summaryPath, 'utf8');
};
