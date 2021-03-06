import React, { PureComponent } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { gradients } from 'app/styles';

import { LinearGradient } from './Gradient';

export enum GradientVariant {
  Primary = 'Primary',
  Secondary = 'Secondary',
}

interface Props {
  children?: React.ReactNode;
  variant: GradientVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export class GradientView extends PureComponent<Props> {
  static Variant = GradientVariant;
  render() {
    const { variant, style, children, testID } = this.props;

    return (
      <LinearGradient testID={testID} {...gradients[variant]} style={style} {...this.props}>
        {children}
      </LinearGradient>
    );
  }
}
