import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { shuffle } from 'lodash/fp';
import React, { FC, useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { ScreenTemplate, Header, Button, Text } from 'app/components';
import { Route, RootStackParams } from 'app/consts';
import { WordWithKey } from 'app/consts/models';
import { CreateMessage, MessageType } from 'app/helpers/MessageCreator';
import { mnemonicWordsToKeyedMnemonic } from 'app/helpers/helpers';
import { preventScreenshots, allowScreenshots } from 'app/services/ScreenshotsService';
import { palette, typography } from 'app/styles';

import { SeedPhraseConfirmView } from './SeedPhraseConfirmView';

const i18n = require('../../../loc');

interface Props {
  navigation: StackNavigationProp<RootStackParams, Route.CreateWalletSuccess>;
  route: RouteProp<RootStackParams, Route.CreateWalletSuccess>;
  secret: string[];
}

const SeedPhraseConfirmScreen: FC<Props> = props => {
  const [orderedMnemonics, setOrderedMnemonics] = useState<WordWithKey[]>([]);
  const [unorderedMnemonics, setUnorderedMnemonics] = useState<WordWithKey[]>([]);
  const [isError, setIsError] = useState(false);

  const {
    route: {
      params: { secret },
    },
  } = props;

  const keyedMnemonics = useMemo(() => shuffle(mnemonicWordsToKeyedMnemonic(secret)), [secret]);

  useEffect(() => {
    preventScreenshots();
    setUnorderedMnemonics(shuffle(keyedMnemonics));
    return () => {
      allowScreenshots();
    };
  }, [keyedMnemonics]);

  const canSubmit = () => {
    return keyedMnemonics.length === orderedMnemonics.length;
  };

  const handleNextButtonPress = useCallback(() => {
    const {
      navigation,
      route: {
        params: { handleNavigationSubscription },
      },
    } = props;
    const arraySecret = secret.split(' ');
    const isOrderCorrect =
      JSON.stringify(arraySecret) === JSON.stringify(orderedMnemonics.map(keyedWord => keyedWord.word));

    if (!isOrderCorrect) {
      setIsError(true);
      return;
    } else {
      if (handleNavigationSubscription) {
        handleNavigationSubscription();
        return;
      }
      return CreateMessage({
        title: i18n.message.hooray,
        description: i18n.message.creatingWalletSuccess,
        type: MessageType.success,
        buttonProps: {
          title: i18n.onboarding.successCompletedButton,
          onPress: () => navigation.navigate(Route.MainTabStackNavigator, { screen: Route.Dashboard }),
        },
      });
    }
  }, [props, secret, orderedMnemonics]);

  const onSeedOrderChange = useCallback((reordered: WordWithKey[]) => {
    setIsError(false);
    setOrderedMnemonics(reordered);
  }, []);

  const handleRemovePress = useCallback(
    (keyedWord: WordWithKey) => {
      setIsError(false);
      setOrderedMnemonics(orderedMnemonics.filter((wordWithKey: WordWithKey) => wordWithKey.key !== keyedWord.key));
      setUnorderedMnemonics([...unorderedMnemonics, keyedWord]);
    },
    [orderedMnemonics, unorderedMnemonics],
  );

  const handleTagTouch = useCallback(
    (keyedWord: WordWithKey) => {
      const newOrder = [...orderedMnemonics, keyedWord];

      setUnorderedMnemonics(unorderedMnemonics.filter((wordWithKey: WordWithKey) => wordWithKey.key !== keyedWord.key));

      setOrderedMnemonics(newOrder);
    },
    [unorderedMnemonics, orderedMnemonics],
  );

  return (
    <ScreenTemplate
      noScroll
      keyboardShouldPersistTaps={'always'}
      footer={
        <>
          <Button
            disabled={!canSubmit()}
            onPress={handleNextButtonPress}
            title={i18n.wallets.confirmSeed.button}
            testID="confirm-seed-button"
          />
        </>
      }
      header={<Header isBackArrow title={i18n.wallets.confirmSeed.header} />}
    >
      <Text style={styles.subtitle}>{i18n.wallets.confirmSeed.title}</Text>
      <Text style={styles.description}>{i18n.wallets.confirmSeed.description}</Text>
      <SeedPhraseConfirmView
        unorderedMnemonics={unorderedMnemonics}
        orderedMnemonics={orderedMnemonics}
        onSeedOrderChange={onSeedOrderChange}
        onSeedRemovePress={handleRemovePress}
        error={isError}
        onTouch={handleTagTouch}
      />
    </ScreenTemplate>
  );
};

export default SeedPhraseConfirmScreen;

const styles = StyleSheet.create({
  subtitle: {
    marginTop: 12,
    marginBottom: 18,
    ...typography.headline4,
    textAlign: 'center',
  },
  description: {
    marginBottom: 52,
    color: palette.textGrey,
    ...typography.caption,
    textAlign: 'center',
  },
});
