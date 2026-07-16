import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import net from 'net';
import path from 'path';
import tls from 'tls';
import { fileURLToPath } from 'url';
import {
  classifyElectrumTlsStatus,
  electrumCertificateWarningDays,
  expectedElectrumEnvFiles,
  getElectrumEndpointReleaseGateState,
  parseElectrumEndpointAuditArgs,
} from './electrumEndpointReadinessSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localDocsDir = path.join(root, 'local-docs');
const outputPath = path.join(localDocsDir, 'electrum-endpoint-readiness-summary.txt');
const timeoutMs = Number(process.env.ELECTRUM_ENDPOINT_TIMEOUT_MS || 8000);

const parseEnv = content => {
  const values = new Map();

  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    values.set(trimmed.slice(0, separatorIndex), trimmed.slice(separatorIndex + 1).trim());
  });

  return values;
};

const parseEnvFile = envFile => {
  const envPath = path.join(root, envFile);
  const values = parseEnv(readFileSync(envPath, 'utf8'));
  const hosts = (values.get('HOSTS') || '')
    .split(',')
    .map(host => host.trim())
    .filter(Boolean);
  const port = Number(values.get('PORT'));
  const protocol = values.get('PROTOCOL') || 'missing';
  const missing = [];

  ['HOSTS', 'PORT', 'PROTOCOL', 'BTCV_NETWORK', 'ENVIRONMENT'].forEach(key => {
    if (!values.get(key)) {
      missing.push(key);
    }
  });

  if (!Number.isInteger(port) || port <= 0) {
    missing.push('PORT_VALID_NUMBER');
  }

  return {
    envFile,
    environment: values.get('ENVIRONMENT') || 'missing',
    hosts,
    missing,
    network: values.get('BTCV_NETWORK') || 'missing',
    port: Number.isInteger(port) && port > 0 ? port : 0,
    protocol,
  };
};

const daysUntil = validTo => {
  const time = Date.parse(validTo);

  if (!Number.isFinite(time)) {
    return 'not-applicable';
  }

  return String(Math.floor((time - Date.now()) / 86400000));
};

const sanitize = value =>
  String(value || 'none')
    .replace(/[;\r\n]/g, ' ')
    .replace(/SENTRY_AUTH_TOKEN=[^\s]+/g, 'SENTRY_AUTH_TOKEN=<redacted>')
    .replace(/auth\.token=[^\s]+/g, 'auth.token=<redacted>')
    .replace(/CODEPUSH_DEPLOYMENT_KEY_[A-Z]+=[^\s]+/g, 'CODEPUSH_DEPLOYMENT_KEY=<redacted>');

const inspectTlsEndpoint = ({ host, port }) =>
  new Promise(resolve => {
    let settled = false;
    const socket = tls.connect({
      host,
      port,
      rejectUnauthorized: false,
      servername: host,
      timeout: timeoutMs,
    });

    const finish = result => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.once('secureConnect', () => {
      const certificate = socket.getPeerCertificate();
      const expiresInDays = daysUntil(certificate?.valid_to);
      const status = classifyElectrumTlsStatus({ authorized: socket.authorized, expiresInDays });

      finish({
        authorizationError: socket.authorizationError || 'none',
        authorized: socket.authorized ? 'yes' : 'no',
        expiresInDays,
        fingerprint256: certificate?.fingerprint256 || 'missing',
        status,
        validFrom: certificate?.valid_from || 'missing',
        validTo: certificate?.valid_to || 'missing',
      });
    });

    socket.once('timeout', () => {
      finish({
        authorizationError: 'timeout',
        authorized: 'no',
        expiresInDays: 'not-applicable',
        fingerprint256: 'missing',
        status: 'connection-error',
        validFrom: 'missing',
        validTo: 'missing',
      });
    });

    socket.once('error', error => {
      finish({
        authorizationError: error.code || error.message,
        authorized: 'no',
        expiresInDays: 'not-applicable',
        fingerprint256: 'missing',
        status: 'connection-error',
        validFrom: 'missing',
        validTo: 'missing',
      });
    });
  });

const inspectTcpEndpoint = ({ host, port }) =>
  new Promise(resolve => {
    let settled = false;
    const socket = net.connect({ host, port, timeout: timeoutMs });

    const finish = result => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.once('connect', () => {
      finish({
        authorizationError: 'not-applicable',
        authorized: 'not-applicable',
        expiresInDays: 'not-applicable',
        fingerprint256: 'not-applicable',
        status: 'ready',
        validFrom: 'not-applicable',
        validTo: 'not-applicable',
      });
    });

    socket.once('timeout', () => {
      finish({
        authorizationError: 'timeout',
        authorized: 'not-applicable',
        expiresInDays: 'not-applicable',
        fingerprint256: 'not-applicable',
        status: 'connection-error',
        validFrom: 'not-applicable',
        validTo: 'not-applicable',
      });
    });

    socket.once('error', error => {
      finish({
        authorizationError: error.code || error.message,
        authorized: 'not-applicable',
        expiresInDays: 'not-applicable',
        fingerprint256: 'not-applicable',
        status: 'connection-error',
        validFrom: 'not-applicable',
        validTo: 'not-applicable',
      });
    });
  });

const inspectEndpoint = async entry => {
  if (entry.status) {
    return entry;
  }

  if (entry.protocol === 'tls') {
    return { ...entry, ...(await inspectTlsEndpoint(entry)) };
  }

  if (entry.protocol === 'tcp') {
    return { ...entry, ...(await inspectTcpEndpoint(entry)) };
  }

  return {
    ...entry,
    authorizationError: 'not-applicable',
    authorized: 'not-applicable',
    expiresInDays: 'not-applicable',
    fingerprint256: 'not-applicable',
    status: 'unsupported-protocol',
    validFrom: 'not-applicable',
    validTo: 'not-applicable',
  };
};

const buildEntries = () =>
  expectedElectrumEnvFiles.flatMap(envFile => {
    const parsed = parseEnvFile(envFile);

    if (parsed.missing.length > 0 || parsed.hosts.length === 0 || parsed.port === 0) {
      return [
        {
          authorizationError: `missing:${parsed.missing.join(',') || 'HOSTS'}`,
          authorized: 'not-applicable',
          endpoint: 'missing:0',
          environment: parsed.environment,
          envFile,
          expiresInDays: 'not-applicable',
          fingerprint256: 'not-applicable',
          host: 'missing',
          network: parsed.network,
          port: 0,
          protocol: parsed.protocol,
          status: 'missing-config',
          validFrom: 'not-applicable',
          validTo: 'not-applicable',
        },
      ];
    }

    return parsed.hosts.map(host => ({
      endpoint: `${host}:${parsed.port}`,
      environment: parsed.environment,
      envFile,
      host,
      network: parsed.network,
      port: parsed.port,
      protocol: parsed.protocol,
    }));
  });

const renderEntry = entry =>
  [
    `env=${entry.envFile}`,
    `network=${entry.network}`,
    `environment=${entry.environment}`,
    `endpoint=${entry.endpoint}`,
    `protocol=${entry.protocol}`,
    `status=${entry.status}`,
    `authorized=${entry.authorized}`,
    `authorization_error=${sanitize(entry.authorizationError)}`,
    `valid_from=${sanitize(entry.validFrom)}`,
    `valid_to=${sanitize(entry.validTo)}`,
    `expires_in_days=${entry.expiresInDays}`,
    `fingerprint256=${sanitize(entry.fingerprint256)}`,
  ].join('; ');

const main = async () => {
  const { requireReady } = parseElectrumEndpointAuditArgs(process.argv.slice(2));
  mkdirSync(localDocsDir, { recursive: true });

  const entries = await Promise.all(buildEntries().map(inspectEndpoint));
  const releaseGate = getElectrumEndpointReleaseGateState(entries);
  const uniqueEndpoints = new Set(entries.map(entry => entry.endpoint));
  const uniqueExpiredEndpoints = new Set(
    entries.filter(entry => entry.status === 'certificate-expired').map(entry => entry.endpoint),
  );
  const uniqueExpiringEndpoints = new Set(
    entries.filter(entry => entry.status === 'certificate-expiring').map(entry => entry.endpoint),
  );
  const counts = {
    ready: entries.filter(entry => entry.status === 'ready').length,
    certificateExpired: entries.filter(entry => entry.status === 'certificate-expired').length,
    certificateExpiring: entries.filter(entry => entry.status === 'certificate-expiring').length,
    tlsAuthorizationError: entries.filter(entry => entry.status === 'tls-authorization-error').length,
    connectionError: entries.filter(entry => entry.status === 'connection-error').length,
    unsupportedProtocol: entries.filter(entry => entry.status === 'unsupported-protocol').length,
    missingConfig: entries.filter(entry => entry.status === 'missing-config').length,
  };
  const action =
    counts.certificateExpired > 0 && counts.certificateExpiring > 0
      ? 'renew or fix expired Electrum TLS certificates and rotate expiring certificates before their deadline, then rerun Android dev/release smoke validation.'
      : counts.certificateExpired > 0
      ? 'renew or fix expired Electrum TLS certificates, then rerun Android dev/release smoke validation.'
      : counts.certificateExpiring > 0
      ? 'renew or rotate expiring Electrum TLS certificates before their deadline, then rerun endpoint readiness.'
      : counts.connectionError > 0 || counts.tlsAuthorizationError > 0
      ? 'fix Electrum endpoint connectivity/TLS authorization, then rerun Android dev/release smoke validation.'
      : 'none; Electrum endpoint preflight has no blocking findings.';
  const summary = [
    'Electrum endpoint readiness audit',
    `Generated at: ${new Date().toISOString()}`,
    `Env files scanned: ${expectedElectrumEnvFiles.length}`,
    `Electrum endpoint entries: ${entries.length}`,
    `Unique endpoints: ${uniqueEndpoints.size}`,
    `Certificate warning threshold days: ${electrumCertificateWarningDays}`,
    `Ready entries: ${counts.ready}`,
    `Certificate expired entries: ${counts.certificateExpired}`,
    `Certificate expiring entries: ${counts.certificateExpiring}`,
    `Unique expired endpoints: ${uniqueExpiredEndpoints.size}`,
    `Unique expiring endpoints: ${uniqueExpiringEndpoints.size}`,
    `Release gate ready: ${releaseGate.ready ? 'yes' : 'no'}`,
    `Release gate blocking entries: ${releaseGate.blockingEntries}`,
    `Release gate blocking unique endpoints: ${releaseGate.blockingUniqueEndpoints}`,
    `TLS authorization error entries: ${counts.tlsAuthorizationError}`,
    `Connection error entries: ${counts.connectionError}`,
    `Unsupported protocol entries: ${counts.unsupportedProtocol}`,
    `Missing config entries: ${counts.missingConfig}`,
    'Secret values printed: no',
    `Required action: ${action}`,
    '',
    'Endpoint entries:',
    ...entries.map(entry => `- ${renderEntry(entry)}`),
    '',
  ].join('\n');

  writeFileSync(outputPath, summary);
  console.log(summary);
  console.log(`Electrum endpoint readiness summary written to ${path.relative(root, outputPath)}`);
  if (requireReady && !releaseGate.ready) {
    console.error('Electrum endpoint release gate is blocked.');
    process.exitCode = 1;
  }
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
