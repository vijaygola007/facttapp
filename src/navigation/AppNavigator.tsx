import React, { Component } from 'react';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';

import { Navigator } from './Navigator';

const navigatorTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        // prevent layout blinking when performing navigation
        background: 'transparent',
    },
};

export const AppNavigator = (): React.ReactElement => (
    <NavigationContainer>
        <Navigator />
    </NavigationContainer>
);

