import React from 'react';
import { Linking, Text, View } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { TermsConditionsSettingsScreen } from 'app/screens/Settings/TermsConditionsSettingsScreen';
import { TermsConditionsScreen } from 'app/screens/TermsConditionsScreen';

const mockWebView = jest.fn((props: any) => React.createElement(View, { ...props, testID: 'terms-webview' }));

jest.mock('react-native-webview', () => ({
  WebView: (props: any) => mockWebView(props),
}));

jest.mock('react-native-exit-app', () => ({
  exitApp: jest.fn(),
}));

jest.mock('react-native-biometrics', () => {
  return jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn().mockResolvedValue({ available: false }),
  }));
});

jest.mock('react-redux', () => ({
  connect: () => (Component: any) => Component,
}));

jest.mock('app/state/appSettings', () => ({
  selectors: {
    language: jest.fn(() => 'en'),
  },
}));

jest.mock('app/state/authentication', () => ({
  selectors: {
    isPinSet: jest.fn(() => false),
    isTxPasswordSet: jest.fn(() => false),
  },
}));

jest.mock('app/state/authentication/actions', () => ({
  createTc: jest.fn(() => ({ type: 'CREATE_TC' })),
}));

jest.mock('app/components', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  const ScreenTemplate = ({ children, footer, header, testID }: any) =>
    React.createElement(View, { testID }, header, children, footer);
  const Button = ({ disabled, onPress, testID, title }: any) =>
    React.createElement(Text, { disabled, onPress, testID }, title);
  const CheckBox = ({ checked, onPress, testID, title }: any) =>
    React.createElement(View, { checked, onPress, testID }, title);
  const CustomModal = ({ children, show }: any) =>
    React.createElement(View, { show, testID: 'custom-modal' }, children);
  const Header = ({ title }: any) => React.createElement(Text, { testID: 'header' }, title);

  return {
    Button,
    CheckBox,
    CustomModal,
    Header,
    ScreenTemplate,
  };
});

const render = (element: React.ReactElement) => {
  let tree: renderer.ReactTestRenderer;

  act(() => {
    tree = renderer.create(element);
  });

  return tree!;
};

const getWebView = (tree: renderer.ReactTestRenderer) => tree.root.findByProps({ testID: 'terms-webview' });

describe('Terms WebView screens', () => {
  beforeEach(() => {
    mockWebView.mockClear();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps onboarding agreement checkboxes hidden until the Terms WebView loads', () => {
    const createTc = jest.fn();
    const tree = render(
      <TermsConditionsScreen createTc={createTc} isPinSet={false} isTxPasswordSet={false} language="en" />,
    );

    expect(tree.root.findAllByProps({ testID: 'terms-and-conditions-checkbox' })).toHaveLength(0);
    expect(tree.root.findByProps({ testID: 'agree-button' }).props.disabled).toBe(true);

    act(() => {
      getWebView(tree).props.onLoad();
    });

    const termsCheckbox = tree.root.findByProps({ testID: 'terms-and-conditions-checkbox' });
    const privacyCheckbox = tree.root.findByProps({ testID: 'privacy-policy-checkbox' });

    expect(termsCheckbox.props.checked).toBe(false);
    expect(privacyCheckbox.props.checked).toBe(false);

    act(() => {
      termsCheckbox.props.onPress();
      privacyCheckbox.props.onPress();
    });

    expect(tree.root.findByProps({ testID: 'agree-button' }).props.disabled).toBe(false);

    act(() => {
      tree.root.findByProps({ testID: 'agree-button' }).props.onPress();
    });

    expect(createTc).toHaveBeenCalledTimes(1);
  });

  it('opens external onboarding Terms links outside the WebView', () => {
    const tree = render(
      <TermsConditionsScreen createTc={jest.fn()} isPinSet={false} isTxPasswordSet={false} language="en" />,
    );
    const webView = getWebView(tree);

    expect(webView.props.onShouldStartLoadWithRequest({ url: 'about:blank' })).toBe(true);
    expect(webView.props.onShouldStartLoadWithRequest({ url: 'https://www.btcv.com' })).toBe(false);
    expect(Linking.openURL).toHaveBeenCalledWith('https://www.btcv.com');
  });

  it('keeps settings Terms links external and resizes the embedded WebView from document height', () => {
    const tree = render(<TermsConditionsSettingsScreen route={{ params: { language: 'en' } } as any} language="en" />);
    let webView = getWebView(tree);

    expect(webView.props.scrollEnabled).toBe(false);
    expect(webView.props.onShouldStartLoadWithRequest({ url: 'data:text/html;base64,abc' })).toBe(true);
    expect(webView.props.onShouldStartLoadWithRequest({ url: 'https://www.btcv.com/privacy' })).toBe(false);
    expect(Linking.openURL).toHaveBeenCalledWith('https://www.btcv.com/privacy');

    act(() => {
      webView.props.onNavigationStateChange({ title: '640' });
    });

    webView = getWebView(tree);

    expect(webView.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ height: 672 })]));
  });
});
