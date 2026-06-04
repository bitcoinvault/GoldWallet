import React from 'react';
import { Text, View } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import ContactQRCodeScreen from 'app/screens/ContactQRCodeScreen';
import { ExportWalletScreen } from 'app/screens/ExportWalletScreen';
import { ExportWalletXpubScreen } from 'app/screens/ExportWalletXpubScreen';
import { OptionsAuthenticatorScreen } from 'app/screens/OptionsAuthenticator/OptionsAuthenticatorScreen';
import { ReceiveCoinsScreen } from 'app/screens/ReceiveCoinsScreen';

const mockQrCode = jest.fn((props: any) => React.createElement(View, { ...props, testID: 'qr-code-svg' }));

jest.mock('react-native-qrcode-svg', () => ({
  __esModule: true,
  default: (props: any) => mockQrCode(props),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(),
}));

jest.mock('react-redux', () => ({
  connect: () => (Component: any) => Component,
}));

jest.mock('bip21', () => ({
  encode: (address: string, options: { amount: number | string }) => `bitcoin:${address}?amount=${options.amount}`,
}));

jest.mock('app/components', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  const passthrough = ({ children, footer, header, testID }: any) =>
    React.createElement(View, { testID }, header, children, footer);
  const textComponent = ({ children, title, label, value, testID }: any) =>
    React.createElement(Text, { testID }, children || title || label || value || null);

  return {
    Button: textComponent,
    ContactAvatar: textComponent,
    FlatButton: textComponent,
    Header: textComponent,
    InputItem: textComponent,
    Mnemonic: textComponent,
    ScreenTemplate: passthrough,
    Separator: () => React.createElement(View, { testID: 'separator' }),
    TextAreaItem: textComponent,
    WalletDropdown: textComponent,
  };
});

jest.mock('app/components/CopyButton', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    CopyButton: ({ textToCopy, testID }: any) => React.createElement(Text, { testID }, textToCopy),
  };
});

jest.mock('app/services/ScreenshotsService', () => ({
  allowScreenshots: jest.fn(),
  preventScreenshots: jest.fn(),
}));

jest.mock('app/helpers/MessageCreator', () => ({
  CreateMessage: jest.fn(),
  MessageType: {
    success: 'success',
  },
}));

jest.mock('app/helpers/date', () => ({
  formatDate: jest.fn(() => 'formatted-date'),
}));

jest.mock('app/state/wallets', () => ({
  reducer: {},
  selectors: {
    getById: jest.fn(),
    wallets: jest.fn(),
  },
}));

jest.mock('app/state/authenticators', () => ({
  actions: {
    deleteAuthenticator: jest.fn(),
    updateAuthenticator: jest.fn(),
  },
  selectors: {
    getById: jest.fn(),
    list: jest.fn(),
  },
}));

const render = (element: React.ReactElement) => {
  let tree: renderer.ReactTestRenderer;

  act(() => {
    tree = renderer.create(element);
  });

  return tree!;
};

const expectQr = (value: string) => {
  expect(mockQrCode).toHaveBeenCalledWith(
    expect.objectContaining({
      ecl: 'H',
      quietZone: 10,
      size: 140,
      value,
    }),
  );
};

describe('QR render screens', () => {
  beforeEach(() => {
    mockQrCode.mockClear();
  });

  it('renders Receive QR from the selected wallet transaction address', () => {
    const wallet = {
      balance: '1',
      getAddressForTransaction: jest.fn(() => 'BTcvReceiveAddress'),
      id: 'wallet-1',
      label: 'Wallet',
      preferredBalanceUnit: 'BTCV',
    };

    render(
      <ReceiveCoinsScreen
        navigation={{ navigate: jest.fn(), setParams: jest.fn() } as any}
        route={{ params: { id: 'wallet-1' } } as any}
        wallet={wallet as any}
        wallets={[wallet as any]}
      />,
    );

    expectQr('bitcoin:BTcvReceiveAddress?amount=0');
  });

  it('renders Contact QR from the contact address', () => {
    render(
      <ContactQRCodeScreen
        route={{ params: { contact: { address: 'BTcvContactAddress', name: 'Contact' } } } as any}
      />,
    );

    expectQr('BTcvContactAddress');
  });

  it('renders wallet secret QR on the wallet export screen', () => {
    const wallet = {
      getSecret: jest.fn(() => 'wallet-secret-seed'),
      password: '',
    };

    render(<ExportWalletScreen route={{ params: { wallet } } as any} />);

    expectQr('wallet-secret-seed');
  });

  it('renders xpub QR on the xpub export screen', () => {
    const wallet = {
      _xpub: 'xpub-wallet-value',
      label: 'HD Wallet',
      type: 'HDWallet',
    };

    render(<ExportWalletXpubScreen route={{ params: { wallet } } as any} />);

    expectQr('xpub-wallet-value');
  });

  it('renders authenticator QR from the authenticator QRCode payload', () => {
    const authenticator = {
      QRCode: 'authenticator-qr-payload',
      createdAt: 0,
      id: 'auth-1',
      name: 'Authenticator',
      publicKey: 'public-key',
      secret: 'secret',
    };

    render(
      <OptionsAuthenticatorScreen
        authenticators={[authenticator] as any}
        authenticator={authenticator as any}
        deleteAuthenticator={jest.fn() as any}
        navigation={{ navigate: jest.fn() } as any}
        route={{ params: { id: 'auth-1' } } as any}
        updateAuthenticator={jest.fn() as any}
      />,
    );

    expectQr('authenticator-qr-payload');
  });
});
