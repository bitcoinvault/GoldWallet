import React from 'react';
import { PermissionsAndroid, Platform, View } from 'react-native';
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
  afterEach(() => {
    jest.restoreAllMocks();
    setPlatform('ios');
  });

  it('requests Android camera permission before rendering CameraKit scanner', async () => {
    setPlatform('android');
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
    const props = createProps();
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...props} />);
    });

    expect(PermissionsAndroid.request).toHaveBeenCalledWith(PermissionsAndroid.PERMISSIONS.CAMERA, {
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
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
    let tree: renderer.ReactTestRenderer;

    await act(async () => {
      tree = renderer.create(<ScanQrCodeScreen {...createProps()} />);
    });

    expect(tree!.root.findAllByProps({ testID: 'camera-kit' })).toHaveLength(0);
  });

  it('passes a non-empty QR value to the caller once and returns to the previous screen', () => {
    setPlatform('ios');
    const onBarCodeScan = jest.fn();
    const props = createProps(onBarCodeScan);
    let tree: renderer.ReactTestRenderer;

    act(() => {
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

  it('ignores an empty QR value without blocking the next valid scan', () => {
    setPlatform('ios');
    const onBarCodeScan = jest.fn();
    const props = createProps(onBarCodeScan);
    let tree: renderer.ReactTestRenderer;

    act(() => {
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
