import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidDevNoNetworkSmokeEvidenceOptions } from './androidDevSmokeEvidence.mjs';
import { getAndroidNoNetworkSmokeSummaryErrors, getLineValue } from './androidSmokeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localDocsDir = path.join(root, 'local-docs');
const outputPath = path.join(localDocsDir, 'android-dev-network-blocker-summary.txt');
const fullSmokeSummaryPath = path.join(localDocsDir, 'android-smoke-dev-summary.txt');
const noNetworkSmokeSummaryPath = path.join(localDocsDir, 'android-smoke-dev-no-network-summary.txt');
const devLogPath = path.join(localDocsDir, 'android-smoke-dev.log');
const devTestnetEnvPath = path.join(root, '.env.dev.testnet');

const readIfPresent = filePath => (existsSync(filePath) ? readFileSync(filePath, 'utf8') : '');
const fileSha256 = filePath => createHash('sha256').update(readFileSync(filePath)).digest('hex');
const parseEnvValue = (envContent, key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));

  return match?.[1]?.trim() || '<missing>';
};

const sanitizeLine = line =>
  line
    .replace(/(SENTRY_DSN_(?:IOS|ANDROID)=)[^\s,]+/g, '$1<redacted>')
    .replace(/(SENTRY_AUTH_TOKEN=)[^\s,]+/g, '$1<redacted>')
    .replace(/(CODEPUSH_DEPLOYMENT_KEY_(?:IOS|ANDROID)=)[^\s,]+/g, '$1<redacted>');

const unique = values => [...new Set(values)];

const parseDevLog = logContent => {
  const lines = logContent.split(/\r?\n/).filter(Boolean);
  const sslHandshakeLines = lines.filter(line => /SSLHandshakeException/i.test(line));
  const certificateExpiredLines = lines.filter(line =>
    /CertificateExpiredException|Certificate expired at/i.test(line),
  );
  const tcpSocketExceptionLines = lines.filter(line => /TcpSockets: Exception on socket/i.test(line));
  const expiryMatch = logContent.match(/Certificate expired at ([^\r\n(]+?)(?:\s+\(compared to ([^\r\n)]+)\)|$)/m);

  return {
    sslHandshakeLines,
    certificateExpiredLines,
    tcpSocketExceptionLines,
    certificateExpiredAt: expiryMatch?.[1]?.trim() || '<missing>',
    certificateComparedAt: expiryMatch?.[2]?.trim() || '<missing>',
  };
};

const renderSummary = () => {
  mkdirSync(localDocsDir, { recursive: true });

  const fullSmokeSummary = readIfPresent(fullSmokeSummaryPath);
  const noNetworkSmokeSummary = readIfPresent(noNetworkSmokeSummaryPath);
  const devLog = readIfPresent(devLogPath);
  const devTestnetEnv = readIfPresent(devTestnetEnvPath);
  const parsedLog = parseDevLog(devLog);
  const electrumHost = parseEnvValue(devTestnetEnv, 'HOSTS');
  const electrumPort = parseEnvValue(devTestnetEnv, 'PORT');
  const electrumProtocol = parseEnvValue(devTestnetEnv, 'PROTOCOL');
  const electrumEndpoint = `${electrumHost}:${electrumPort} ${electrumProtocol}`;
  const noNetworkErrors = noNetworkSmokeSummary
    ? getAndroidNoNetworkSmokeSummaryErrors(
        noNetworkSmokeSummary,
        getAndroidDevNoNetworkSmokeEvidenceOptions(root),
      )
    : ['missing Android dev no-network smoke summary'];
  const noNetworkReady = noNetworkErrors.length === 0;
  const expiredCertificateReady =
    parsedLog.sslHandshakeLines.length > 0 && parsedLog.certificateExpiredLines.length > 0;
  const outcome =
    noNetworkReady && expiredCertificateReady ? 'blocked-by-electrum-certificate-expired' : 'inconclusive';
  const evidenceLines = unique([
    ...parsedLog.sslHandshakeLines.slice(0, 2),
    ...parsedLog.certificateExpiredLines.slice(0, 2),
  ]).map(sanitizeLine);
  const devLogPresent = existsSync(devLogPath);
  const devLogBytes = devLogPresent ? statSync(devLogPath).size : 0;
  const devLogSha256 = devLogPresent ? fileSha256(devLogPath) : '<missing>';

  return [
    'Android dev network blocker audit',
    `Generated at: ${new Date().toISOString()}`,
    `Full dev smoke summary present: ${fullSmokeSummary ? 'yes' : 'no'}`,
    `Full dev smoke outcome: ${getLineValue(fullSmokeSummary, 'Android smoke outcome') || '<missing>'}`,
    `Full dev smoke reason: ${getLineValue(fullSmokeSummary, 'Android smoke reason') || '<missing>'}`,
    `No-network dev smoke summary present: ${noNetworkSmokeSummary ? 'yes' : 'no'}`,
    `No-network dev smoke outcome: ${getLineValue(noNetworkSmokeSummary, 'Android smoke outcome') || '<missing>'}`,
    `No-network dev smoke expected UI: ${getLineValue(noNetworkSmokeSummary, 'Expected UI texts') || '<missing>'}`,
    `No-network dev smoke summary valid: ${noNetworkReady ? 'yes' : 'no'}`,
    `No-network dev smoke summary errors: ${noNetworkErrors.length}`,
    `Dev log present: ${devLogPresent ? 'yes' : 'no'}`,
    `Dev log path: ${devLogPath}`,
    `Dev log bytes: ${devLogBytes}`,
    `Dev log sha256: ${devLogSha256}`,
    `SSL handshake exception lines: ${parsedLog.sslHandshakeLines.length}`,
    `Certificate expired exception lines: ${parsedLog.certificateExpiredLines.length}`,
    `TCP socket exception lines: ${parsedLog.tcpSocketExceptionLines.length}`,
    `Dev/testnet Electrum endpoint: ${electrumEndpoint}`,
    `Certificate expired at: ${parsedLog.certificateExpiredAt}`,
    `Certificate compared at sample: ${parsedLog.certificateComparedAt}`,
    `No-network UI proof ready: ${noNetworkReady ? 'yes' : 'no'}`,
    `Expired certificate evidence ready: ${expiredCertificateReady ? 'yes' : 'no'}`,
    'Reduced no-network smoke is full dev proof: no',
    'Android dev smoke gate remains blocked: yes',
    `Dev blocker outcome: ${outcome}`,
    'Secret values printed: no',
    `Required action: renew or fix the dev/testnet Electrum TLS certificate for ${electrumEndpoint}, then rerun android:dev:smoke:embedded and Camera/QR validation.`,
    '',
    'Blocker evidence lines:',
    ...(evidenceLines.length > 0 ? evidenceLines : ['<none>']),
    '',
  ].join('\n');
};

const summary = renderSummary();
writeFileSync(outputPath, summary);
console.log(summary);
console.log(`Android dev network blocker summary written to ${path.relative(root, outputPath)}`);

