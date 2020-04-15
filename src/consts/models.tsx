export enum Route {
  Dashboard = 'Dashboard',
  WalletDetails = 'WalletDetails',
  AddressBook = 'AddressBook',
  Settings = 'Settings',
  AddWallet = 'AddWallet',
}

export type Wallet = {
  balance: number;
  preferredBalanceUnit: string;
  label: string;
  transactions: Array<any>;
};
