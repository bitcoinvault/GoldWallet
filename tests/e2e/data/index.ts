import * as dev from './env/dev';
import * as prod from './env/prod';
import * as stage from './env/stage';
import { getWallets } from './wallets';
import { getBuildEnv } from '../helpers/utils';
import { DataTestEnv } from '../types';

const buildEnv = getBuildEnv();

const envs: Record<string, DataTestEnv> = {
  dev,
  stage,
  prod,
};

const testWalletsVarName = buildEnv === 'dev' ? 'DETOX_TESTNET_WALLETS' : 'DETOX_MAINNET_WALLETS';

export const envData = envs[buildEnv];
export const walletsData = getWallets(testWalletsVarName);
export * from './commons';
