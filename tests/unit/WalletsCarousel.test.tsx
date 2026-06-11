import React from 'react';
import { View } from 'react-native';
import renderer, { act } from 'react-test-renderer';

import { WalletsCarousel } from 'app/screens/Dashboard/WalletsCarousel';

jest.mock('app/components', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    WalletCard: ({ wallet }: any) => React.createElement(View, { testID: `wallet-card-${wallet.id}` }),
  };
});

const createProps = () => ({
  data: [{ id: 'wallet-1' }, { id: 'wallet-2' }, { id: 'wallet-3' }] as any[],
  keyExtractor: (item: any) => item.id,
  getIndex: jest.fn(),
});

describe('WalletsCarousel', () => {
  it('renders a horizontal FlatList with the existing dashboard carousel testID', () => {
    const props = createProps();
    let tree: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(<WalletsCarousel {...props} />);
    });

    const carousel = tree!.root.findByProps({ testID: 'wallets-carousel' });

    expect(carousel.props.horizontal).toBe(true);
    expect(carousel.props.data).toBe(props.data);
    expect(carousel.props.showsHorizontalScrollIndicator).toBe(false);
  });

  it('keeps the imperative snap API used by the dashboard dropdown', () => {
    const props = createProps();
    const component = new WalletsCarousel(props);
    const scrollToIndex = jest.fn();

    (component.carouselRef as any).current = { scrollToIndex };
    component.snap(2);

    expect(scrollToIndex).toHaveBeenCalledWith({ index: 2, animated: true });
  });

  it('reports the snapped wallet index from momentum scroll offset', () => {
    const props = createProps();
    const component = new WalletsCarousel(props);
    const layout = component.getItemLayout(props.data, 1);

    component.handleMomentumScrollEnd({
      nativeEvent: {
        contentOffset: { x: layout.length * 1.2 },
      },
    } as any);

    expect(props.getIndex).toHaveBeenCalledWith(1);
  });
});
