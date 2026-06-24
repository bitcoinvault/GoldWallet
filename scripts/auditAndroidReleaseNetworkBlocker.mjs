import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAndroidReleaseNoNetworkSmokeEvidenceOptions } from './androidReleaseSmokeEvidence.mjs';
import { getAndroidNoNetworkSmokeSummaryErrors, getLineValue } from './androidSmokeSummaryGuard.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const localDocsDir = path.join(root, 'local-docs');
const outputPath = path.join(localDocsDir, 'android-release-network-blocker-summary.txt');
const fullSmokeSummaryPath = path.join(localDocsDir, 'android-smoke-dev-release-summary.txt');
const noNetworkSmokeSummaryPath = path.join(localDocsDir, 'android-smoke-dev-release-no-network-summary.txt');
const releaseLogPath = path.join(localDocsDir, 'android-smoke-dev-release.log');
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

const parseReleaseLog = logContent => {
  const lines = logContent.split(/\r?\n/).filter(Boolean);
  const sslHandshakeLines = lines.filter(line => /SSLHandshakeException/i.test(line));
  const certificateExpiredLines = lines.filter(line =>
    /CertificateExpiredException|Certificate expired at/i.test(line),
  );
  const tcpSocketExceptionLines = lines.filter(line => /TcpSockets: Exception on socket/i.test(line));
  const expiryMatch = logContent.match(/Certificate expired at ([^\r\n(]+?)(?:\s+\(compared to ([^\r\n)]+)\)|$)/m);

  return {
    lines,
    sslHandshakeLines,
    certificateExpiredLines,
    tcpSocketExceptionLines,
    certificateExpiredAt: expiryMatch?.[1]?.trim() || '<missing>',
    certificateComparedAt: expiryMatch?.[2]?.trim() || '<missing>',
  };
};

const hasPassedDataStoragePreflight = summary => {
  const preflight = getLineValue(summary, 'Data storage preflight');
  const availableKilobytes = Number(getLineValue(summary, 'Data storage available KiB'));
  const requiredKilobytes = Number(getLineValue(summary, 'Data storage required KiB'));

  return (
    preflight === 'passed' &&
    Number.isFinite(availableKilobytes) &&
    Number.isFinite(requiredKilobytes) &&
    availableKilobytes > 0 &&
    requiredKilobytes > 0 &&
    availableKilobytes >= requiredKilobytes
  );
};

const renderSummary = () => {
  mkdirSync(localDocsDir, { recursive: true });

  const fullSmokeSummary = readIfPresent(fullSmokeSummaryPath);
  const noNetworkSmokeSummary = readIfPresent(noNetworkSmokeSummaryPath);
  const releaseLog = readIfPresent(releaseLogPath);
  const devTestnetEnv = readIfPresent(devTestnetEnvPath);
  const parsedLog = parseReleaseLog(releaseLog);
  const electrumHost = parseEnvValue(devTestnetEnv, 'HOSTS');
  const electrumPort = parseEnvValue(devTestnetEnv, 'PORT');
  const electrumProtocol = parseEnvValue(devTestnetEnv, 'PROTOCOL');
  const electrumEndpoint = `${electrumHost}:${electrumPort} ${electrumProtocol}`;
  const noNetworkErrors = noNetworkSmokeSummary
    ? getAndroidNoNetworkSmokeSummaryErrors(
        noNetworkSmokeSummary,
        getAndroidReleaseNoNetworkSmokeEvidenceOptions(root),
      )
    : ['missing Android release no-network smoke summary'];
  const noNetworkReady = noNetworkErrors.length === 0;
  const fullReleaseStorageReady = hasPassedDataStoragePreflight(fullSmokeSummary);
  const expiredCertificateReady =
    parsedLog.sslHandshakeLines.length > 0 && parsedLog.certificateExpiredLines.length > 0;
  const outcome =
    fullReleaseStorageReady && noNetworkReady && expiredCertificateReady
      ? 'blocked-by-electrum-certificate-expired'
      : 'inconclusive';
  const evidenceLines = unique([
    ...parsedLog.sslHandshakeLines.slice(0, 2),
    ...parsedLog.certificateExpiredLines.slice(0, 2),
  ]).map(sanitizeLine);
  const releaseLogPresent = existsSync(releaseLogPath);
  const releaseLogBytes = releaseLogPresent ? statSync(releaseLogPath).size : 0;
  const releaseLogSha256 = releaseLogPresent ? fileSha256(releaseLogPath) : '<missing>';

  return [
    'Android release network blocker audit',
    `Generated at: ${new Date().toISOString()}`,
    `Full release smoke summary present: ${fullSmokeSummary ? 'yes' : 'no'}`,
    `Full release smoke outcome: ${getLineValue(fullSmokeSummary, 'Android smoke outcome') || '<missing>'}`,
    `Full release smoke reason: ${getLineValue(fullSmokeSummary, 'Android smoke reason') || '<missing>'}`,
    `Full release smoke data storage preflight: ${getLineValue(fullSmokeSummary, 'Data storage preflight') || '<missing>'}`,
    `Full release smoke data storage available KiB: ${
      getLineValue(fullSmokeSummary, 'Data storage available KiB') || '<missing>'
    }`,
    `Full release smoke data storage required KiB: ${
      getLineValue(fullSmokeSummary, 'Data storage required KiB') || '<missing>'
    }`,
    `Full release smoke data storage proof ready: ${fullReleaseStorageReady ? 'yes' : 'no'}`,
    `No-network release smoke summary present: ${noNetworkSmokeSummary ? 'yes' : 'no'}`,
    `No-network release smoke outcome: ${getLineValue(noNetworkSmokeSummary, 'Android smoke outcome') || '<missing>'}`,
    `No-network release smoke expected UI: ${getLineValue(noNetworkSmokeSummary, 'Expected UI texts') || '<missing>'}`,
    `No-network release smoke summary valid: ${noNetworkReady ? 'yes' : 'no'}`,
    `No-network release smoke summary errors: ${noNetworkErrors.length}`,
    `Release log present: ${releaseLogPresent ? 'yes' : 'no'}`,
    `Release log path: ${releaseLogPath}`,
    `Release log bytes: ${releaseLogBytes}`,
    `Release log sha256: ${releaseLogSha256}`,
    `SSL handshake exception lines: ${parsedLog.sslHandshakeLines.length}`,
    `Certificate expired exception lines: ${parsedLog.certificateExpiredLines.length}`,
    `TCP socket exception lines: ${parsedLog.tcpSocketExceptionLines.length}`,
    `Dev/testnet Electrum endpoint: ${electrumEndpoint}`,
    `Certificate expired at: ${parsedLog.certificateExpiredAt}`,
    `Certificate compared at sample: ${parsedLog.certificateComparedAt}`,
    `No-network UI proof ready: ${noNetworkReady ? 'yes' : 'no'}`,
    `Expired certificate evidence ready: ${expiredCertificateReady ? 'yes' : 'no'}`,
    'Reduced no-network smoke is full release proof: no',
    'Release services gate remains blocked: yes',
    `Release blocker outcome: ${outcome}`,
    'Secret values printed: no',
    `Required action: renew or fix the dev/testnet Electrum TLS certificate for ${electrumEndpoint}, then rerun Android devRelease smoke and release create-wallet validation.`,
    '',
    'Blocker evidence lines:',
    ...(evidenceLines.length > 0 ? evidenceLines : ['<none>']),
    '',
  ].join('\n');
};

const summary = renderSummary();
writeFileSync(outputPath, summary);
console.log(summary);
console.log(`Android release network blocker summary written to ${path.relative(root, outputPath)}`);
