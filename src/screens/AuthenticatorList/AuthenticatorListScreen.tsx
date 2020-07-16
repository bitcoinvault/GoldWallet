import React, { Component } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';

import { icons, images } from 'app/assets';
import { Header, Image, ListEmptyState } from 'app/components';
import { Route, Authenticator } from 'app/consts';
import { CreateMessage, MessageType } from 'app/helpers/MessageCreator';
import { ApplicationState } from 'app/state';
import { selectors, actions } from 'app/state/authenticators';
import { palette, typography } from 'app/styles';

import { formatDate } from '../../../utils/date';

const i18n = require('../../../loc');

interface MapStateProps {
  authenticators: Authenticator[];
  isLoading: boolean;
}

interface ActionProps {
  loadAuthenticators: Function;
  deleteAuthenticator: Function;
}

type Props = NavigationInjectedProps & MapStateProps & ActionProps;

class AuthenticatorListScreen extends Component<Props> {
  static navigationOptions = () => ({
    // must be dynamic, as function as language switch stops to work
    tabBarLabel: i18n.tabNavigator.authenticators,
  });

  componentDidMount() {
    const { loadAuthenticators } = this.props;
    loadAuthenticators();
  }

  onDeletePress = (authenticator: Authenticator) => {
    const { deleteAuthenticator, navigation } = this.props;
    navigation.navigate(Route.DeleteEntity, {
      name: authenticator.name,
      title: i18n.authenticators.delete.title,
      subtitle: i18n.authenticators.delete.subtitle,
      onConfirm: () => {
        deleteAuthenticator(authenticator.id, {
          onSuccess: () => {
            CreateMessage({
              title: i18n.message.success,
              description: i18n.authenticators.delete.success,
              type: MessageType.success,
              buttonProps: {
                title: i18n.message.returnToDashboard,
                onPress: () => navigation.navigate(Route.AuthenticatorList),
              },
            });
          },
        });
      },
    });
  };

  renderItem = ({ item }: { item: Authenticator }) => (
    <View style={styles.authenticatorWrapper}>
      <View style={styles.authenticatorTopWrapper}>
        <Text style={styles.name}>{item.name}</Text>
        <Text onPress={() => this.onDeletePress(item)} style={styles.delete}>
          {i18n._.delete}
        </Text>
      </View>
      <View style={styles.authenticatorBottomWrapper}>
        <Text style={styles.date}>
          {i18n._.created} {formatDate(item.createdAt)}
        </Text>
      </View>
    </View>
  );

  renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>{i18n.authenticators.list.title}</Text>
      <View style={styles.descriptionContainer}>
        <Text style={styles.buttonDescription}>{i18n.wallets.walletModal.btcv}</Text>
        <Image source={images.coin} style={styles.coinIcon} />
      </View>
      <View style={styles.scanContainer}>
        <Image source={icons.scan} style={styles.scan} />
        <Text style={styles.scanText}>{i18n.authenticators.list.scan}</Text>
      </View>
    </View>
  );

  renderEmptyList = () => (
    <ListEmptyState
      variant={ListEmptyState.Variant.Authenticators}
      onPress={() => this.props.navigation.navigate(Route.CreateAuthenticator)}
    />
  );

  hasAuthenticators = () => {
    const { authenticators } = this.props;
    return !!authenticators.length;
  };

  render() {
    const { navigation, authenticators, loadAuthenticators, isLoading } = this.props;

    const sortedAuthenticators = authenticators.sort((a, b) => b.createdAt.valueOf() - a.createdAt.valueOf());

    return (
      <>
        <Header
          navigation={navigation}
          isBackArrow={false}
          title={i18n.tabNavigator.authenticators}
          addFunction={() => navigation.navigate(Route.CreateAuthenticator)}
        />
        {this.hasAuthenticators() ? (
          <View style={styles.container}>
            {this.renderHeader()}
            <FlatList
              refreshing={isLoading}
              onRefresh={() => loadAuthenticators()}
              style={styles.list}
              data={sortedAuthenticators}
              renderItem={this.renderItem}
            />
          </View>
        ) : (
          this.renderEmptyList()
        )}
      </>
    );
  }
}

const mapStateToProps = (state: ApplicationState): MapStateProps => ({
  authenticators: selectors.list(state),
  isLoading: selectors.isLoading(state),
});

const mapDispatchToProps: ActionProps = {
  loadAuthenticators: actions.loadAuthenticators,
  deleteAuthenticator: actions.deleteAuthenticator,
};

export default connect(mapStateToProps, mapDispatchToProps)(AuthenticatorListScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 20,
    marginHorizontal: 5,
  },
  list: {
    paddingHorizontal: 15,
  },
  authenticatorWrapper: {
    paddingVertical: 8,
  },
  authenticatorTopWrapper: {
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: 'row',
  },
  authenticatorBottomWrapper: {
    marginTop: 4,
  },
  name: {
    ...typography.headline5,
  },
  delete: {
    ...typography.headline6,
    color: palette.textRed,
  },
  date: {
    color: palette.textGrey,
    ...typography.caption,
  },
  headerTitle: {
    textAlign: 'center',
    ...typography.headline4,
  },
  descriptionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDescription: {
    ...typography.caption,
    color: palette.textGrey,
  },
  coinIcon: {
    width: 17,
    height: 17,
    margin: 4,
  },
  scanText: {
    ...typography.headline6,
    color: palette.textSecondary,
  },
  scan: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  scanContainer: {
    marginTop: 24,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 26,
    marginTop: 20,
  },
});
