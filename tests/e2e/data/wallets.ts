import { DataTestWallets } from '../types';

export const getWallets = (testWalletsVarName: string): DataTestWallets => {
  const dataString = process.env[testWalletsVarName];

  if (dataString) {
    return JSON.parse(dataString);
  }

  return new Proxy(
    {},
    {
      get(_target, property) {
        if (typeof property === 'symbol') {
          return undefined;
        }

        throw new Error(
          `Test wallet data not found. Please provide it in ${testWalletsVarName} env variable before reading walletsData.${property}`,
        );
      },
    },
  ) as DataTestWallets;
};
