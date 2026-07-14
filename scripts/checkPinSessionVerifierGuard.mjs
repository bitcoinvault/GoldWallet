import assert from 'assert';
import { readFileSync } from 'fs';

const readSource = file => readFileSync(file, 'utf8');
const verifier = readSource('src/services/PinSessionVerifier.ts');
const services = readSource('src/services/index.tsx');
const sagas = readSource('src/state/authentication/sagas.ts');
const unlockScreen = readSource('src/screens/UnlockScreen.tsx');
const navigator = readSource('src/navigators/Navigator.tsx');
const factoryReset = readSource('src/helpers/factoryReset.ts');
const tests = readSource('tests/unit/PinSessionVerifier.test.ts');
const authenticationSagaTests = readSource('tests/unit/AuthenticationSaga.test.ts');

assert.match(verifier, /sha256\(pin\)\.toString\(\)/);
assert.match(verifier, /private pinDigest: string \| null = null/);
assert.doesNotMatch(verifier, /getPin|return this\.pinDigest\s*;/);
assert.match(services, /export const PinSessionVerifier = _PinSessionVerifier/);
assert.match(sagas, /PinSessionVerifier\.setPin\(pin\)/);
assert.match(sagas, /PinSessionVerifier\.matches\(payload\.pin\)/);
assert.match(sagas, /PinSessionVerifier\.setPin\(payload\.pin\)/);
assert.match(sagas, /const errorMessage = e instanceof Error \? e\.message : String\(e\)/);
assert.match(sagas, /yield put\(checkCredentialsFailure\(errorMessage\)\)/);
assert.match(sagas, /meta\.onFailure\(errorMessage\)/);
assert.match(unlockScreen, /isUnlocked: false/);
assert.match(unlockScreen, /this\.setState\(\{ isUnlocked: true, pin: '', error: '' \}\)/);
assert.match(unlockScreen, /if \(isUnlocked\) \{\s*return null;/);
const credentialsBarrierIndex = navigator.indexOf('await new Promise<void>');
const credentialsCheckIndex = navigator.indexOf('checkCredentials({', credentialsBarrierIndex);
const walletLoadIndex = navigator.indexOf('await BlueApp.startAndDecrypt();');

assert.ok(credentialsBarrierIndex >= 0, 'Navigator must await the credentials initialization barrier');
assert.ok(
  credentialsBarrierIndex < credentialsCheckIndex && credentialsCheckIndex < walletLoadIndex,
  'Navigator must finish initializing credentials before loading persisted wallets',
);
assert.match(factoryReset, /PinSessionVerifier\.clear\(\)/);
assert.match(tests, /matches only the PIN registered for the current process/);
assert.match(tests, /clears the process verifier when no PIN is registered/);
assert.match(authenticationSagaTests, /releases the startup barrier for a non-Error storage rejection/);

console.log('PIN session verifier wiring guard checks passed.');
