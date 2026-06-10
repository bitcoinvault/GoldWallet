import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  Dimensions,
  Image,
  PermissionsAndroid,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';

import { images } from 'app/assets';
import type { Route, RootStackParams } from 'app/consts';
import { getStatusBarHeight } from 'app/styles';

const { width } = Dimensions.get('window');
const i18n = require('../../loc');

interface Props {
  navigation: StackNavigationProp<RootStackParams, Route.ScanQrCode>;
  route: RouteProp<RootStackParams, Route.ScanQrCode>;
}

interface State {
  hasCameraPermission: boolean;
  isBarcodeRead: boolean;
}

interface QrCodeReadEvent {
  nativeEvent: {
    codeStringValue: string;
  };
}

export default class ScanQrCodeScreen extends React.PureComponent<Props, State> {
  state = {
    hasCameraPermission: Platform.OS !== 'android',
    isBarcodeRead: false,
  };

  componentDidMount() {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
        title: i18n.scanQrCode.permissionTitle,
        message: i18n.scanQrCode.permissionMessage,
        buttonPositive: i18n.scanQrCode.ok,
        buttonNegative: i18n.scanQrCode.cancel,
      }).then(result => {
        this.setState({ hasCameraPermission: result === PermissionsAndroid.RESULTS.GRANTED });
      });
    }
  }

  goBack = () => this.props.navigation.goBack();

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

  render() {
    return (
      <View style={{ flex: 1 }}>
        <>
          <StatusBar hidden />
          {this.state.hasCameraPermission && (
            <Camera
              testID="qr-scanner-camera"
              cameraType={CameraType.Back}
              scanBarcode
              allowedBarcodeTypes={['qr']}
              style={{ flex: 1, justifyContent: 'space-between' }}
              onReadCode={this.onBarCodeScanned}
            />
          )}
          <View style={styles.crosshairContainer}>
            <Image style={styles.crosshair} source={images.scanQRcrosshair} />
          </View>
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
    ...StyleSheet.absoluteFill,
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
});
