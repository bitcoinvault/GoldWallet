import {
  parseObservation,
  parseUiHierarchy,
  renderSummary,
  sanitizeLine,
} from './captureElectrumRuntimeObservation.mjs';

const fail = message => {
  console.error(`Electrum runtime observation parser guard failed: ${message}`);
  process.exit(1);
};

const assert = (condition, message) => {
  if (!condition) {
    fail(message);
  }
};

const readyUiHierarchy = [
  '<hierarchy>',
  '<node package="io.goldwallet.wallet.dev" resource-id="dashboard-header" text="Wallets" />',
  '<node package="io.goldwallet.wallet.dev" text="Add new wallet" />',
  '</hierarchy>',
].join('');

const connectionIssueUiHierarchy = [
  '<hierarchy>',
  '<node package="io.goldwallet.wallet.dev" text="No internet connection" />',
  '</hierarchy>',
].join('');

const renderFixture = (logcat, hierarchy = readyUiHierarchy, globalLogcat = '') =>
  renderSummary({
    selectedSerial: 'emulator-5554',
    pid: '12345',
    logcat,
    observation: parseObservation(logcat),
    globalLogcat,
    globalObservation: parseObservation(globalLogcat),
    uiCapture: {
      captured: true,
      hierarchy,
      error: '',
    },
    uiObservation: parseUiHierarchy(hierarchy),
    generatedAt: '2026-06-16T00:00:00.000Z',
  });

const successLogcat = [
  '06-16 10:00:00.000 I ReactNativeJS: 10:00 | INFO : BlueElectrum {"message":"begin connection"}',
  '06-16 10:00:01.000 I ReactNativeJS: 10:00 | INFO : BlueElectrum {"message":"connected to server"}',
  '06-16 10:00:02.000 I ReactNativeJS: 10:00 | INFO : BlueElectrum {"message":"connected to, ElectrumX 1.16"}',
].join('\n');
const successResult = renderFixture(successLogcat);

assert(successResult.outcome === 'passed', 'success Electrum logcat should pass');
assert(successResult.summary.includes('ADB max buffer bytes: '), 'success summary should include adb max buffer');
assert(successResult.summary.includes('Electrum success lines: 2'), 'success summary should count success lines');
assert(successResult.summary.includes('Process Electrum success lines: 2'), 'success summary should count process success lines');
assert(successResult.summary.includes('Runtime UI evidence: ready'), 'ready UI hierarchy should be recorded');

const globalFallbackResult = renderFixture(
  '06-16 10:00:00.000 I ReactNativeJS: unrelated startup log',
  readyUiHierarchy,
  successLogcat,
);

assert(globalFallbackResult.outcome === 'passed', 'global Electrum fallback success logcat should pass');
assert(
  globalFallbackResult.summary.includes('Process Electrum success lines: 0'),
  'global fallback summary should preserve process success count',
);
assert(
  globalFallbackResult.summary.includes('Global Electrum success lines: 2'),
  'global fallback summary should count global success lines',
);
assert(
  globalFallbackResult.summary.includes('Electrum success lines: 2'),
  'global fallback summary should count combined success lines',
);

const failedConnectionLogcat = [
  '06-16 10:00:00.000 I ReactNativeJS: 10:00 | INFO : BlueElectrum {"message":"begin connection"}',
  '06-16 10:00:20.000 W ReactNativeJS: 10:00 | WARN : BlueElectrum {"message":"bad connection timeout"}',
].join('\n');
const failedConnectionResult = renderFixture(failedConnectionLogcat);

assert(
  failedConnectionResult.outcome === 'observed-without-success',
  'Electrum failures without fatal runtime logs should be observed without success',
);
assert(
  failedConnectionResult.summary.includes('Electrum failure lines: 1'),
  'Electrum failure summary should count failure lines',
);

const fatalLogcat = [
  '06-16 10:00:00.000 I ReactNativeJS: 10:00 | INFO : BlueElectrum {"message":"begin connection"}',
  '06-16 10:00:03.000 E AndroidRuntime: FATAL EXCEPTION: main',
].join('\n');
const fatalResult = renderFixture(fatalLogcat);

assert(fatalResult.outcome === 'failed', 'fatal Android runtime log should fail');
assert(fatalResult.summary.includes('Fatal/runtime logcat lines: 1'), 'fatal summary should count runtime errors');

const inconclusiveResult = renderFixture('06-16 10:00:00.000 I ReactNativeJS: unrelated startup log');

assert(inconclusiveResult.outcome === 'inconclusive', 'logcat without Electrum evidence should be inconclusive');
assert(inconclusiveResult.summary.includes('Electrum log lines: 0'), 'inconclusive summary should count zero logs');

const connectionIssueUi = parseUiHierarchy(connectionIssueUiHierarchy);

assert(connectionIssueUi.appPackageVisible, 'connection-issue UI fixture should include app package');
assert(connectionIssueUi.connectionIssueMarkers.includes('No internet connection'), 'connection issue marker should match');

const sanitizedLine = sanitizeLine(
  'SENTRY_DSN_ANDROID=https://secret.example CODEPUSH_DEPLOYMENT_KEY_ANDROID=secret-key SENTRY_DSN_IOS=ios-secret CODEPUSH_DEPLOYMENT_KEY_IOS=ios-key',
);

assert(!sanitizedLine.includes('secret.example'), 'Android Sentry DSN should be redacted');
assert(!sanitizedLine.includes('secret-key'), 'Android CodePush key should be redacted');
assert(!sanitizedLine.includes('ios-secret'), 'iOS Sentry DSN should be redacted');
assert(!sanitizedLine.includes('ios-key'), 'iOS CodePush key should be redacted');
assert((sanitizedLine.match(/<redacted>/g) || []).length === 4, 'all guarded secret values should be redacted');

console.log('Electrum runtime observation parser guard checks are valid.');
