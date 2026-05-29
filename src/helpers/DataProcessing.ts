import config from 'app/config';

const bitcoin = require('bitcoinjs-lib');

export const processAddressData = (data: string, stateAmount?: string) => {
  const regex = /[?&]([^=#]+)=([^&#]*)/g;
  const solvedData = regex.exec(data);
  let address, amount;

  if (!solvedData) {
    address = data;
    amount = stateAmount;
  } else {
    address = data.split('?')[0].replace('bitcoin:', '');
    const [, paramName, value] = solvedData;

    if (paramName === 'amount' && Number(value) > 0) {
      amount = value;
    } else {
      amount = stateAmount;
    }
  }
  const newAddresses = {
    address,
    amount,
  };

  return newAddresses;
};

export const checkAddress = (address: string) => bitcoin.address.toOutputScript(address, config.network);
