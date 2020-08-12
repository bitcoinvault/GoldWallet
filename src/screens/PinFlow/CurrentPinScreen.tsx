import { StackNavigationProp } from '@react-navigation/stack';
import dayjs from 'dayjs';
import React, { PureComponent } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

import { Header, PinInput, ScreenTemplate } from 'app/components';
import { Route, CONST, FlowType, MainCardStackNavigatorParams, firstAttempt, finalAttempt } from 'app/consts';
import { SecureStorageService } from 'app/services';
import { ApplicationState } from 'app/state';
import {
  setTimeCounter,
  SetTimeCounterAction,
  setFailedAttempts,
  SetFailedAttemptsAction,
  setFailedAttemptStep,
  SetFailedAttemptStepAction,
} from 'app/state/timeCounter/actions';
import { TimeCounterState } from 'app/state/timeCounter/reducer';
import { palette, typography } from 'app/styles';

const i18n = require('../../../loc');

interface Props {
  navigation: StackNavigationProp<MainCardStackNavigatorParams, Route.CurrentPin>;
  appSettings: {
    isPinSet: boolean;
  };
  setTimeCounter: (timestamp: number) => SetTimeCounterAction;
  setFailedAttempts: (attempt: number) => SetFailedAttemptsAction;
  setFailedAttemptStep: (failedAttempt: number) => SetFailedAttemptStepAction;
  timeCounter: TimeCounterState;
}

interface State {
  pin: string;
  error: string;
  isCount: boolean;
}

class CurrentPinScreen extends PureComponent<Props, State> {
  state = {
    pin: '',
    error: '',
    isCount: true,
  };

  handleFailedAttempt = (increasedFailedAttemptStep: number) => {
    const { attempt } = this.props.timeCounter;
    const { setFailedAttempts, setFailedAttemptStep, setTimeCounter } = this.props;
    const isFinalAttempt = increasedFailedAttemptStep === finalAttempt;
    let currentDate = dayjs();
    let blockedTimeInMinutes = 1;

    if (attempt === 1) {
      blockedTimeInMinutes = 2;
    } else if (attempt > 1) {
      blockedTimeInMinutes = 10;
    }
    currentDate = currentDate.add(blockedTimeInMinutes, 'minute');

    if (isFinalAttempt) {
      setTimeCounter(currentDate.unix());
      setFailedAttempts(attempt + 1);
      setFailedAttemptStep(0);
      this.setState({ isCount: true });
    } else {
      setFailedAttemptStep(increasedFailedAttemptStep);
    }

    return !finalAttempt
      ? `\n${i18n.onboarding.failedTimesErrorInfo} ${blockedTimeInMinutes} ${i18n.onboarding.minutes}\n${i18n.onboarding.failedTimes} ${increasedFailedAttemptStep}/${finalAttempt}`
      : '';
  };

  updatePin = (pin: string) => {
    const { setFailedAttempts, setFailedAttemptStep } = this.props;
    this.setState({ pin }, async () => {
      if (this.state.pin.length === CONST.pinCodeLength) {
        const setPin = await SecureStorageService.getSecuredValue('pin');
        if (setPin === this.state.pin) {
          setFailedAttempts(0);
          setFailedAttemptStep(0);
          this.props.navigation.navigate(Route.CreatePin, {
            flowType: FlowType.newPin,
          });
        } else {
          const increasedFailedAttemptStep = this.props.timeCounter.failedAttemptStep + 1;
          const failedTimesError = this.handleFailedAttempt(increasedFailedAttemptStep);
          this.setState({
            error: i18n.onboarding.pinDoesNotMatch + failedTimesError,
            pin: '',
          });
        }
      }
    });
  };

  onCountFinish = () => {
    this.setState({ isCount: false });
  };

  isTimeCounterVisible = () => {
    return dayjs().unix() < this.props.timeCounter.timestamp && this.state.isCount;
  };

  render() {
    const { error } = this.state;
    if (this.isTimeCounterVisible()) {
      this.props.navigation.navigate(Route.TimeCounter, {
        onCountFinish: this.onCountFinish,
        timestamp: this.props.timeCounter.timestamp,
      });
    }
    return (
      <ScreenTemplate
        noScroll
        header={<Header navigation={this.props.navigation} isBackArrow title={i18n.onboarding.changePin} />}
      >
        <View style={styles.infoContainer}>
          <Text style={typography.headline4}>{i18n.onboarding.currentPin}</Text>
        </View>
        <View style={styles.pinContainer}>
          <PinInput value={this.state.pin} onTextChange={this.updatePin} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </ScreenTemplate>
    );
  }
}

const mapStateToProps = (state: ApplicationState) => ({
  timeCounter: state.timeCounter,
});

const mapDispatchToProps = {
  setTimeCounter,
  setFailedAttempts,
  setFailedAttemptStep,
};

export default connect(mapStateToProps, mapDispatchToProps)(CurrentPinScreen);

const styles = StyleSheet.create({
  pinContainer: {
    alignItems: 'center',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 72,
  },
  errorText: {
    marginVertical: 10,
    color: palette.textRed,
    textAlign: 'center',
    ...typography.headline6,
  },
});
