import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { PureComponent } from 'react';
import { Text, StyleSheet, BackHandler, View, NativeEventSubscription } from 'react-native';
import { connect } from 'react-redux';

import { Header, PinInput, ScreenTemplate } from 'app/components';
import { Route, CONST, FlowType, RootStackParams } from 'app/consts';
import { noop } from 'app/helpers/helpers';
import { setUserVersion as setUserVersionAction, SetUserVersionActionCreator } from 'app/state/authentication/actions';
import { typography, palette } from 'app/styles';

const i18n = require('../../../loc');

interface Props {
  navigation: StackNavigationProp<RootStackParams, Route.CreatePin>;
  route: RouteProp<RootStackParams, Route.CreatePin>;
  appSettings: {
    isPinSet: boolean;
  };
  setUserVersion: SetUserVersionActionCreator;
}

interface State {
  pin: string;
  focused: boolean;
  flowType: string;
}

class CreatePinScreen extends PureComponent<Props, State> {
  state = {
    pin: '',
    focused: false,
    flowType: '',
  };

  pinInputRef = React.createRef<PinInput>();
  backHandler?: NativeEventSubscription;
  focusListener: () => void = noop;

  componentDidMount() {
    const flowType = this.props.route.params?.flowType || '';

    if (flowType !== FlowType.newPin) {
      this.props.setUserVersion(CONST.newestUserVersion);
    }
    this.props.navigation.setOptions({
      gestureEnabled: false,
    });
    this.setState({
      flowType,
    });
    this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.backAction);
    this.focusListener = this.props.navigation.addListener('focus', this.openKeyboard);
  }

  componentWillUnmount() {
    this.backHandler && this.backHandler.remove();
    this.focusListener();
  }

  backAction = () => {
    this.state.flowType === FlowType.newPin
      ? this.props.navigation.navigate(Route.MainTabStackNavigator, { screen: Route.Settings })
      : BackHandler.exitApp();
    return true;
  };

  updatePin = (pin: string) => {
    this.setState({ pin }, async () => {
      if (this.state.pin.length === CONST.pinCodeLength) {
        this.props.navigation.navigate(Route.ConfirmPin, {
          flowType: this.state.flowType,
          pin: this.state.pin,
        });
        this.setState({
          pin: '',
        });
      }
    });
  };

  openKeyboard = () => {
    this.pinInputRef.current?.focus();
    this.pinInputRef.current?.focus();
  };

  render() {
    const { flowType, pin } = this.state;

    return (
      <ScreenTemplate
        header={
          <Header
            isBackArrow={this.props.route.params?.flowType === FlowType.newPin}
            onBackArrow={() => this.props.navigation.popToTop()}
            title={
              this.props.route.params?.flowType === FlowType.newPin
                ? i18n.onboarding.changePin
                : i18n.onboarding.onboarding
            }
          />
        }
        noScroll
      >
        <View style={styles.infoContainer}>
          <Text style={typography.headline4}>
            {flowType === FlowType.newPin ? i18n.onboarding.createNewPin : i18n.onboarding.createPin}
          </Text>
          <Text style={styles.pinDescription}>{i18n.onboarding.createPinDescription}</Text>
        </View>
        <View style={styles.pinContainer}>
          <PinInput value={pin} testID={'create-pin-input'} onTextChange={this.updatePin} ref={this.pinInputRef} />
        </View>
      </ScreenTemplate>
    );
  }
}
const mapDispatchToProps = {
  setUserVersion: setUserVersionAction,
};

export default connect(null, mapDispatchToProps)(CreatePinScreen);

const styles = StyleSheet.create({
  pinContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  infoContainer: {
    alignItems: 'center',
  },
  pinDescription: {
    ...typography.caption,
    color: palette.textGrey,
    margin: 20,
    textAlign: 'center',
  },
});
