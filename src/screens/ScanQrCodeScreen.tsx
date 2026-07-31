import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  AppState,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import { check, openSettings, PERMISSIONS, PermissionStatus, request, RESULTS } from 'react-native-permissions';

import { images } from 'app/assets';
import { Button } from 'app/components/Button';
import type { Route, RootStackParams } from 'app/consts';
import { getStatusBarHeight, palette, typography } from 'app/styles';

const { width } = Dimensions.get('window');
const i18n = require('../../loc');

interface Props {
  navigation: StackNavigationProp<RootStackParams, Route.ScanQrCode>;
  route: RouteProp<RootStackParams, Route.ScanQrCode>;
}

interface State {
  isBarcodeRead: boolean;
  permissionStatus: PermissionStatus | 'checking';
}

interface QrCodeReadEvent {
  nativeEvent: {
    codeStringValue: string;
  };
}

export default class ScanQrCodeScreen extends React.PureComponent<Props, State> {
  state: State = {
    isBarcodeRead: false,
    permissionStatus: 'checking',
  };

  private isMountedScreen = false;

  private appStateSubscription?: ReturnType<typeof AppState.addEventListener>;

  componentDidMount() {
    this.isMountedScreen = true;
    this.appStateSubscription = AppState.addEventListener('change', this.onAppStateChange);
    void this.refreshCameraPermission(true);
  }

  componentWillUnmount() {
    this.isMountedScreen = false;
    this.appStateSubscription?.remove();
  }

  goBack = () => this.props.navigation.goBack();

  getCameraPermission = () => (Platform.OS === 'android' ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA);

  refreshCameraPermission = async (requestWhenDenied: boolean) => {
    const permission = this.getCameraPermission();

    try {
      let permissionStatus = await check(permission);

      if (permissionStatus === RESULTS.DENIED && requestWhenDenied) {
        permissionStatus = await request(
          permission,
          Platform.OS === 'android'
            ? {
                title: i18n.scanQrCode.permissionTitle,
                message: i18n.scanQrCode.permissionMessage,
                buttonPositive: i18n.scanQrCode.ok,
                buttonNegative: i18n.scanQrCode.cancel,
              }
            : undefined,
        );
      }

      if (this.isMountedScreen) {
        this.setState({ permissionStatus });
      }
    } catch {
      if (this.isMountedScreen) {
        this.setState({ permissionStatus: RESULTS.UNAVAILABLE });
      }
    }
  };

  onAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'active') {
      void this.refreshCameraPermission(false);
    }
  };

  openCameraSettings = async () => {
    try {
      await openSettings('application');
    } catch {
      // The close action remains available if system settings cannot be opened.
    }
  };

  onBarCodeScanned = (event: QrCodeReadEvent) => {
    const { onBarCodeScan } = this.props.route.params;
    const data = event.nativeEvent.codeStringValue;

    if (!data) {
      return;
    }

    // Prevents multiple scans in one second
    if (this.state.isBarcodeRead) {
      return;
    }

    this.setState({ isBarcodeRead: true });

    this.goBack();
    onBarCodeScan(data);
  };

  renderPermissionState = () => {
    const { permissionStatus } = this.state;

    if (permissionStatus === 'checking') {
      return null;
    }

    const canRequestPermission = permissionStatus === RESULTS.DENIED;

    return (
      <View testID="qr-scanner-permission-state" style={styles.permissionContainer}>
        <Text style={styles.permissionMessage}>{i18n.scanQrCode.permissionMessage}</Text>
        <View style={styles.permissionButton}>
          <Button
            testID={canRequestPermission ? 'qr-scanner-request-permission-button' : 'qr-scanner-open-settings-button'}
            title={canRequestPermission ? i18n.scanQrCode.ok : i18n.settings.header}
            onPress={canRequestPermission ? () => this.refreshCameraPermission(true) : this.openCameraSettings}
          />
        </View>
      </View>
    );
  };

  render() {
    const hasCameraPermission = this.state.permissionStatus === RESULTS.GRANTED;

    return (
      <View style={{ flex: 1 }}>
        <>
          <StatusBar hidden />
          {hasCameraPermission && (
            <Camera
              testID="qr-scanner-camera"
              cameraType={CameraType.Back}
              scanBarcode
              allowedBarcodeTypes={['qr']}
              style={{ flex: 1, justifyContent: 'space-between' }}
              onReadCode={this.onBarCodeScanned}
            />
          )}
          {hasCameraPermission ? (
            <View style={styles.crosshairContainer}>
              <Image style={styles.crosshair} source={images.scanQRcrosshair} />
            </View>
          ) : (
            this.renderPermissionState()
          )}
          <TouchableOpacity testID="qr-scanner-close-button" style={styles.closeButton} onPress={this.goBack}>
            <Image source={images.close} />
          </TouchableOpacity>
        </>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  crosshairContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshair: {
    width: width * 0.58,
    height: width * 0.58,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    borderRadius: 20,
    position: 'absolute',
    top: getStatusBarHeight(),
    right: 20,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: palette.background,
  },
  permissionMessage: {
    ...typography.body,
    color: palette.textBlack,
    textAlign: 'center',
  },
  permissionButton: {
    width: '100%',
    maxWidth: 320,
    marginTop: 24,
  },
});
