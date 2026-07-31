import React from 'react';
import { AppState, Platform, View } from 'react-native';
import { check, openSettings, request, RESULTS } from 'react-native-permissions';
import renderer, { act } from 'react-test-renderer';

import ScanQrCodeScreen from 'app/screens/ScanQrCodeScreen';

jest.mock('app/assets', () => ({
  images: {
    close: 1,
    scanQRcrosshair: 2,
  },
}));

jest.mock('react-native-camera-kit', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Camera: jest.fn(props => React.createElement(View, { ...props, testID: props.testID || 'camera-kit' })),
    CameraType: {
      Back: 'back',
    },
  };
});

jest.mock(
  'react-native-permissions',
  () => ({
    check: jest.fn(),
    openSettings: jest.fn(),
    PERMISSIONS: {
      ANDROID: { CAMERA: 'android.permission.CAMERA' },
      IOS: { CAMERA: 'ios.permission.CAMERA' },
    },
    request: jest.fn(),
    RESULTS: {
      BLOCKED: 'blocked',
      DENIED: 'denied',
      GRANTED: 'granted',
      LIMITED: 'limited',
      UNAVAILABLE: 'unavailable',
    },
  }),
  { virtual: true },
);

const mockCheck = check as jest.MockedFunction<typeof check>;
const mockOpenSettings = openSettings as jest.MockedFunction<typeof openSettings>;
const mockRequest = request as jest.MockedFunction<typeof request>;

const setPlatform = (os: 'android' | 'ios') => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
};

const createProps = (onBarCodeScan = jest.fn()) =>
  ({
    navigation: {
      goBack: jest.fn(),
    },
    route: {
      key: 'ScanQrCode',
      name: 'ScanQrCode',
      params: {
        onBarCodeScan,
      },
    },
  }) as any;

describe('ScanQrCodeScreen', () => {
  beforeEach(() => {
    mockCheck.mockResolvedValue(RESULTS.GRANTED);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    setPlatform('ios');
  });

  it('requests Android camera permission before rendering CameraKit scanner', async () => {
    setPlatform('android');
    mockCheck.mockResolvedValue(RESULTS.DENIED);
    mockRequest.mockResolvedValue(RESULTS.GRANTED);
    const props = createProps();
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...props} />);
    });

    expect(mockCheck).toHaveBeenCalledWith('android.permission.CAMERA');
    expect(mockRequest).toHaveBeenCalledWith('android.permission.CAMERA', {
      title: expect.any(String),
      message: expect.any(String),
      buttonPositive: expect.any(String),
      buttonNegative: expect.any(String),
    });

    const camera = tree!.root.findByProps({ testID: 'qr-scanner-camera' });

    expect(camera.props.scanBarcode).toBe(true);
    expect(camera.props.allowedBarcodeTypes).toEqual(['qr']);
    expect(camera.props.onReadCode).toEqual(expect.any(Function));
    expect(tree!.root.findByProps({ testID: 'qr-scanner-close-button' })).toBeTruthy();
  });

  it('keeps CameraKit scanner hidden when Android camera permission is denied', async () => {
    setPlatform('android');
    mockCheck.mockResolvedValue(RESULTS.DENIED);
    mockRequest.mockResolvedValue(RESULTS.DENIED);
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...createProps()} />);
    });

    expect(tree!.root.findAllByProps({ testID: 'camera-kit' })).toHaveLength(0);
  });

  it('requests iOS camera permission instead of rendering an unapproved camera preview', async () => {
    setPlatform('ios');
    mockCheck.mockResolvedValue(RESULTS.DENIED);
    mockRequest.mockResolvedValue(RESULTS.GRANTED);
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...createProps()} />);
    });

    expect(mockCheck).toHaveBeenCalledWith('ios.permission.CAMERA');
    expect(mockRequest).toHaveBeenCalledWith('ios.permission.CAMERA', undefined);
    expect(tree!.root.findByProps({ testID: 'qr-scanner-camera' })).toBeTruthy();
  });

  it('opens application settings when camera permission is blocked', async () => {
    mockCheck.mockResolvedValue(RESULTS.BLOCKED);
    mockOpenSettings.mockResolvedValue();
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...createProps()} />);
    });

    expect(tree!.root.findAllByProps({ testID: 'camera-kit' })).toHaveLength(0);

    await act(async () => {
      tree!.root.findByProps({ testID: 'qr-scanner-open-settings-button' }).props.onPress();
    });

    expect(mockOpenSettings).toHaveBeenCalledWith('application');
  });

  it('refreshes blocked camera permission when the app returns to the foreground', async () => {
    let appStateListener: ((state: string) => void) | undefined;

    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
      appStateListener = listener as (state: string) => void;
      return { remove: jest.fn() };
    });
    mockCheck.mockResolvedValueOnce(RESULTS.BLOCKED).mockResolvedValueOnce(RESULTS.GRANTED);
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...createProps()} />);
    });

    expect(tree!.root.findAllByProps({ testID: 'camera-kit' })).toHaveLength(0);

    await act(async () => {
      appStateListener?.('active');
    });

    expect(tree!.root.findByProps({ testID: 'qr-scanner-camera' })).toBeTruthy();
  });

  it('removes the app-state listener and ignores pending permission checks after unmount', async () => {
    const remove = jest.fn();
    let resolveCheck: ((status: typeof RESULTS.GRANTED) => void) | undefined;

    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
    mockCheck.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveCheck = resolve as (status: typeof RESULTS.GRANTED) => void;
        }),
    );
    let tree: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(<ScanQrCodeScreen {...createProps()} />);
    });

    act(() => {
      tree!.unmount();
    });

    await act(async () => {
      resolveCheck?.(RESULTS.GRANTED);
    });

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('passes a non-empty QR value to the caller once and returns to the previous screen', async () => {
    setPlatform('ios');
    mockCheck.mockResolvedValue(RESULTS.GRANTED);
    const onBarCodeScan = jest.fn();
    const props = createProps(onBarCodeScan);
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...props} />);
    });

    const instance = tree!.root.findByType(ScanQrCodeScreen).instance as ScanQrCodeScreen;
    const event = { nativeEvent: { codeStringValue: 'bitcoin:BTcvExample' } };

    act(() => {
      instance.onBarCodeScanned(event);
    });

    act(() => {
      instance.onBarCodeScanned(event);
    });

    expect(props.navigation.goBack).toHaveBeenCalledTimes(1);
    expect(onBarCodeScan).toHaveBeenCalledTimes(1);
    expect(onBarCodeScan).toHaveBeenCalledWith('bitcoin:BTcvExample');
  });

  it('ignores an empty QR value without blocking the next valid scan', async () => {
    setPlatform('ios');
    mockCheck.mockResolvedValue(RESULTS.GRANTED);
    const onBarCodeScan = jest.fn();
    const props = createProps(onBarCodeScan);
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...props} />);
    });

    const instance = tree!.root.findByType(ScanQrCodeScreen).instance as ScanQrCodeScreen;

    act(() => {
      instance.onBarCodeScanned({ nativeEvent: { codeStringValue: '' } });
    });

    expect(props.navigation.goBack).not.toHaveBeenCalled();
    expect(onBarCodeScan).not.toHaveBeenCalled();

    act(() => {
      instance.onBarCodeScanned({ nativeEvent: { codeStringValue: 'bitcoin:BTcvAfterEmpty' } });
    });

    expect(props.navigation.goBack).toHaveBeenCalledTimes(1);
    expect(onBarCodeScan).toHaveBeenCalledWith('bitcoin:BTcvAfterEmpty');
  });
});
