import { PureComponent } from 'react';
import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';

interface Props {
  handleAppComesToForeground?: () => void;
  handleAppComesToBackground?: () => void;
}

interface State {
  appState: AppStateStatus | null;
}

export default class AppStateManager extends PureComponent<Props, State> {
  appStateSubscription?: NativeEventSubscription;

  state = {
    appState: AppState.currentState,
  };

  componentDidMount() {
    const addAppStateChangeListener = (AppState.addEventListener as unknown) as (
      eventType: 'change',
      listener: (state: AppStateStatus) => void,
    ) => NativeEventSubscription;

    try {
      this.appStateSubscription = addAppStateChangeListener('change', this.handleAppStateChange);
    } catch (error) {
      this.appStateSubscription = undefined;
    }
  }

  componentWillUnmount() {
    this.appStateSubscription && this.appStateSubscription.remove();
  }

  handleAppStateChange = (nextAppState: AppStateStatus) => {
    const { handleAppComesToForeground, handleAppComesToBackground } = this.props;
    const { appState } = this.state;

    // TODO: inactive state always invoked by biometric scan, so we can't use inactive state to show lock screen, so only background state valid option. It may be changed or fixed later
    if ((appState === 'background' || appState === null) && nextAppState === 'active') {
      !!handleAppComesToForeground && handleAppComesToForeground();
    }

    if (nextAppState === 'background') {
      !!handleAppComesToBackground && handleAppComesToBackground();
    }

    this.setState({ appState: nextAppState });
  };

  render() {
    return null;
  }
}
