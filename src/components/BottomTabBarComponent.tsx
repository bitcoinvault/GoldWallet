import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { images } from 'app/assets';
import { palette, typography } from 'app/styles';
import { ifIphoneX } from 'app/styles/helpers';

import { BottomTabBarIcon } from './BottomTabBarIcon';
import { GradientView } from './GradientView';

export const BottomTabBarComponent = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <GradientView variant={GradientView.Variant.Primary}>
        <View style={styles.buttonsContainer}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={index}
                testID={`navigation-tab-${index}`}
                style={styles.button}
                onPress={onPress}
                activeOpacity={0.5}
              >
                <BottomTabBarIcon
                  source={
                    isFocused
                      ? images[route.name as keyof typeof images]
                      : images[`${route.name}Inactive` as keyof typeof images]
                  }
                />
                <Text
                  style={{
                    ...typography.subtitle2,
                    color: isFocused ? palette.secondary : palette.textWhiteMuted,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </GradientView>
    </View>
  );
};

const styles = StyleSheet.create({
  button: { alignItems: 'center' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 8 },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 1000,
  },
});
