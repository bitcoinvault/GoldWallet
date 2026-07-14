import assert from 'assert';
import { readFileSync } from 'fs';

const navigator = readFileSync('src/navigators/Navigator.tsx', 'utf8');
const walletSagas = readFileSync('src/state/wallets/sagas.ts', 'utf8');

const credentialsBarrierIndex = navigator.indexOf('await new Promise<void>');
const storageLoadIndex = navigator.indexOf('await BlueApp.startAndDecrypt();');
const storageReadyIndex = navigator.indexOf('this.setState({ isWalletStorageReady: true });');

assert.match(navigator, /isWalletStorageReady: false/);
assert.ok(credentialsBarrierIndex >= 0, 'Navigator must await credentials before loading wallet storage');
assert.ok(
  credentialsBarrierIndex < storageLoadIndex && storageLoadIndex < storageReadyIndex,
  'Navigator must publish wallet storage readiness only after credentials and disk hydration complete',
);
assert.match(navigator, /if \(isLoading \|\| !this\.state\.isWalletStorageReady\) \{/);

const cachedWalletReadIndex = walletSagas.indexOf('const cachedWallets = BlueApp.getWallets();');
const cachedWalletPublishIndex = walletSagas.indexOf('yield put(loadWalletsSuccess(cachedWallets));');
const electrumWaitIndex = walletSagas.indexOf('yield BlueElectrum.waitTillConnected();');

assert.ok(cachedWalletReadIndex >= 0, 'Wallet loading must read the disk-hydrated cache');
assert.ok(
  cachedWalletReadIndex < cachedWalletPublishIndex && cachedWalletPublishIndex < electrumWaitIndex,
  'Wallet loading must publish cached wallets before waiting for Electrum refresh',
);

console.log('Wallet startup hydration guard checks passed.');
