import React, { FC } from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { Tags } from 'app/components';
import { WordWithKey } from 'app/consts/models';
import { palette } from 'app/styles';

export interface Props {
  orderedMnemonics: WordWithKey[];
  unorderedMnemonics: WordWithKey[];
  onSeedRemovePress: (keyedWord: WordWithKey) => void;
  error: boolean;
  onTouch: (keyedWord: WordWithKey) => void;
  onSeedOrderChange: (keyedWords: WordWithKey[]) => void;
}

export const SeedPhraseConfirmView: FC<Props> = ({
  orderedMnemonics,
  unorderedMnemonics,
  onSeedRemovePress,
  error,
  onTouch,
  onSeedOrderChange,
}) => {
  return (
    <>
      <View style={styles.mnemonicPhraseContainer}>
        <Tags words={orderedMnemonics} onTagsOrderChange={onSeedOrderChange} onRemove={onSeedRemovePress} removable />
      </View>
      {error && <Text>Error</Text>}
      <View style={styles.mnemonicPhraseUnselectedContainer}>
        <Tags words={unorderedMnemonics} onTouch={onTouch} touchable />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  mnemonicPhraseContainer: {
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 150,
    borderColor: palette.border,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    paddingHorizontal: 12,
  },
  mnemonicPhraseUnselectedContainer: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingTop: 30,
  },
});
