import React, { Component } from 'react';
import { View, Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';

import { WalletCard } from 'app/components';
import { Wallet } from 'app/consts';

interface Props {
  data: Wallet[];
  keyExtractor: (item: Wallet, index: number) => string;
  getIndex: (index: number) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = SCREEN_WIDTH * 0.82;
const SIDE_PADDING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

export class WalletsCarousel extends Component<Props> {
  carouselRef = React.createRef<FlatList<Wallet>>();

  renderItem = ({ item }: { item: Wallet }) => {
    return (
      <View style={styles.walletCard}>
        <WalletCard wallet={item} showEditButton />
      </View>
    );
  };

  snap = (index: number) => {
    this.carouselRef.current?.scrollToIndex({ index, animated: true });
  };

  getItemLayout = (_: ArrayLike<Wallet> | null | undefined, index: number) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

  handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { data, getIndex } = this.props;
    const offsetX = event.nativeEvent.contentOffset.x;
    const lastIndex = Math.max(data.length - 1, 0);
    const index = Math.min(Math.max(Math.round(offsetX / ITEM_WIDTH), 0), lastIndex);

    getIndex(index);
  };

  render() {
    const { data, keyExtractor } = this.props;

    return (
      <View>
        <FlatList
          testID="wallets-carousel"
          ref={this.carouselRef}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={this.renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.contentContainer}
          getItemLayout={this.getItemLayout}
          onMomentumScrollEnd={this.handleMomentumScrollEnd}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  contentContainer: { paddingHorizontal: SIDE_PADDING },
  walletCard: { alignItems: 'center' },
});
