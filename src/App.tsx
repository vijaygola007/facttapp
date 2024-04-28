/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
import 'react-native-gesture-handler';
import React from 'react';

import { View, Text, Appearance } from 'react-native'; 
import {Provider} from 'react-redux';
import {
  Provider as PaperProvider,
  DefaultTheme,
  configureFonts,
} from 'react-native-paper';

import {StatusBar, Dimensions} from 'react-native';

import {SafeAreaProvider} from 'react-native-safe-area-context';

import store from './store';
import {AppNavigator} from './navigation/AppNavigator';


const fontFamily = 'Roboto-Regular';
var screenWidth = Dimensions.get('window').width;
var screenHeight = Dimensions.get('window').height;
var orientation = screenHeight > screenWidth ? 'p' : 'l';

Dimensions.addEventListener('change', () => {
  var d = Dimensions.get('window');
  screenWidth = d.width;
  screenHeight = d.height;
  orientation = screenHeight > screenWidth ? 'p' : 'l';
});

const fontConfig: object = {
  default: {
    regular: {
      fontFamily: 'sans-serif',
      fontWeight: 'bold',
    },
    medium: {
      fontFamily: 'sans-serif-medium',
      fontWeight: 'normal',
    },
    light: {
      fontFamily: 'sans-serif-light',
      fontWeight: 'normal',
    },
    thin: {
      fontFamily: 'sans-serif-thin',
      fontWeight: 'normal',
    },
  },
};
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3498db',
    accent: '#f1c40f',
  },
  fonts: configureFonts(fontConfig),
};


const App = ({}): React.ReactElement => {
  
  return (
    <React.Fragment>
      {/* <AppearanceProvider> */}
      <SafeAreaProvider>
        <Provider store={store}>
          
          <PaperProvider theme={theme}>

          <AppNavigator />

          </PaperProvider>
        </Provider>
      </SafeAreaProvider>
      {/* </AppearanceProvider> */}
      
    </React.Fragment>
  );
};

export default (): React.ReactElement => <App />;
