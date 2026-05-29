import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { ComponentType } from 'react';

import { BottomTabBarComponent } from 'app/components';
import { Route, MainTabNavigatorParams } from 'app/consts';
import { ContactListScreen, DashboardScreen, SettingsScreen, AuthenticatorListScreen } from 'app/screens';

const i18n = require('../../loc');

const Tab = createBottomTabNavigator<MainTabNavigatorParams>();
const screenComponent = (component: ComponentType<any>) => component as ComponentType<NonNullable<unknown>>;

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBarComponent {...props} />}
      screenOptions={{
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name={Route.Dashboard}
        component={screenComponent(DashboardScreen)}
        options={() => ({
          tabBarLabel: i18n.tabNavigator.wallets,
        })}
      />
      <Tab.Screen
        name={Route.AuthenticatorList}
        component={screenComponent(AuthenticatorListScreen)}
        options={() => ({
          tabBarLabel: i18n.tabNavigator.authenticators,
        })}
      />
      <Tab.Screen
        name={Route.ContactList}
        component={screenComponent(ContactListScreen)}
        options={() => ({
          tabBarLabel: i18n.tabNavigator.addressBook,
        })}
      />
      <Tab.Screen
        name={Route.Settings}
        component={screenComponent(SettingsScreen)}
        options={() => ({
          tabBarLabel: i18n.tabNavigator.settings,
        })}
      />
    </Tab.Navigator>
  );
};
