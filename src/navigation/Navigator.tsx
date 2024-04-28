import React from 'react';
import { Dimensions, Easing, Animated } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// splash
import SplashScreen from '../components/Splash/SplashScreen';
// drawer
import DrawerContent from '../components/Drawer/DrawerContent';
// header
import { headerNavigationOptions } from '../components/Header/HeaderContent';

// welcome screens
import Audit from '../screens/WelcomeScreen/Audit';

// auth screens
import Registration from '../screens/AuthScreen/Registration';
import Login from '../screens/AuthScreen/Login';
import FaceLogin from '../screens/AuthScreen/FaceLogin';
import FaceRegister from '../screens/AuthScreen/FaceRegister';

// main screens
import InspectionCategory from '../screens/MainAppScreen/InspectionCategory';
import SiteList from '../screens/MainAppScreen/SiteList';
import InspectionHistory from '../screens/MainAppScreen/InspectionHistory';
import InspectionsList from '../screens/MainAppScreen/InspectionsList';
import InspectionType from '../screens/MainAppScreen/InspectionType';
import Question from '../screens/MainAppScreen/Question';
import Confirmation from '../screens/MainAppScreen/Confirmation';
import InspectionReport from '../screens/MainAppScreen/InspectionReport';
import InspectionDetail from '../screens/MainAppScreen/InspectionDetail';
import HelpDesk from '../screens/MainAppScreen/HelpDesk';
import AboutUs from '../screens/MainAppScreen/AboutUs';
import SyncData from '../screens/MainAppScreen/SyncData';
import VoucherList from '../screens/MainAppScreen/VoucherList';
import AddVoucher from '../screens/MainAppScreen/AddVoucher';
import Draft from '../screens/MainAppScreen/Draft';

const Stack = createStackNavigator();

const Drawer = createDrawerNavigator();
const screenWidth = Dimensions.get('window').width;

const forSlide = ({ current, next, inverted, layouts: { screen } }) => {
  const progress = Animated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0
  );

  return {
    containerStyle: {
      transform: [
        {
          translateX: Animated.multiply(
            progress.interpolate({
              inputRange: [0, 1, 2, 3],
              outputRange: [
                screen.width, // Focused, but offscreen in the beginning
                0, // Fully focused
                screen.width * -0.5,
                -screen.width // Fully unfocused
              ],
              extrapolate: 'clamp',
            }),
            inverted
          ),
        },
      ],
    },
  };
};

const StackNavigator = (stackNavigation: object): React.ReactElement => {
  
    return (
        <Stack.Navigator
          initialRouteName='InspectionCategory'
          // screenOptions={{
          //   headerShown: true,
          //   gestureEnabled: false,
          //   cardStyleInterpolator: forSlide as any,
          //   // gestureDirection: 'horizontal',
          //   headerMode: 'float'
          // }}
          screenOptions={({route, navigation}) => {
            return {
              headerShown: true,
              gestureEnabled: false,
              cardStyleInterpolator: forSlide as any,
              // gestureDirection: 'horizontal',
              headerMode: 'float'
            };
          }}
        >
          
          <Stack.Screen name='InspectionCategory' component={InspectionCategory} 
          options={({route}) => {
            return ({
                ...headerNavigationOptions({ navigation: stackNavigation, showDrawer: true }, 'Inspection Category') as any,
                // cardStyleInterpolator: forSlide
            });
          }}
          />

        <Stack.Screen name='Draft' component={Draft} 
          options={({navigation,route}) => {
            return ({
              ...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Inspection Draft') as any,
            });
          }}
          />

          <Stack.Screen name='SiteList' component={SiteList} 
            options={({navigation,route}) => {
              return ({
                  ...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Sites', route.params) as any,
                  // cardStyleInterpolator: forSlide
                }
              );
            }}
          />

          <Stack.Screen name='InspectionsList' component={InspectionsList} 
          options={({navigation,route}) => {
            return ({
              ...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Inspections'),
              // cardStyleInterpolator: forSlide
            });
          }}  />

          <Stack.Screen name='VoucherList' component={VoucherList} 
            options={({navigation,route}) => {
              return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Vouchers')});
            }}
          />

          <Stack.Screen name='AddVoucher' component={AddVoucher} 
            options={({navigation,route}) => {
              return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Add Voucher')});
            }}
          />

          <Stack.Screen name='ExpenseDetail' component={AddVoucher} 
            options={({navigation,route}) => {
              return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Expense Detail')});
            }}
          />

          <Stack.Screen name='InspectionHistory' component={InspectionHistory} 
          options={({navigation,route}) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Inspection History')});
          }} 
          />

          <Stack.Screen name='InspectionType' component={InspectionType} 
          options={({ navigation, route }) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation }, `Categories (${route.params['total_category']})`) });
          }} />

          <Stack.Screen name='Question' component={Question} 
          options={({ navigation, route }) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation }, route.params['title']) });
          }} />

          <Stack.Screen name='Confirmation' component={Confirmation} 
          options={({navigation,route}) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation }, 'Confirmation')});
          }}  />

          <Stack.Screen name='InspectionReport' component={InspectionReport} 
          options={({navigation,route}) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Inspection Report')});
          }}  />

          <Stack.Screen name='HelpDesk' component={HelpDesk} 
          options={({navigation,route}) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Help Desk (Support)')});
          }}  />

          <Stack.Screen name='AboutUs' component={AboutUs} 
          options={({navigation,route}) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'About Us')});
          }}  />

          <Stack.Screen name='SyncData' component={SyncData} 
          options={({navigation,route}) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Synchronize Data')});
          }}  />


          <Stack.Screen name='InspectionDetail' component={InspectionDetail} 
          options={({navigation,route}) => {
            return ({...headerNavigationOptions({ navigation: stackNavigation, screenProps: navigation, showDrawer: true }, 'Inspection Detail', route.params)});
          }} />

        </Stack.Navigator>
    );
};

const WelcomeStackNavigator = (): React.ReactElement => {
  return (
    <Stack.Navigator
      initialRouteName='Audit'
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        // ...horizontalAnimation
      }}
    >

      <Stack.Screen name='Audit' component={Audit} options={{
        title: 'Audit'
      }} />

    </Stack.Navigator>
  );
}

const DrawerNavigator = (nav: object): React.ReactElement => {
    return (
      <Drawer.Navigator
        initialRouteName='StackNavigator'
        drawerContent={(evt) => {
          return (
            <DrawerContent {...evt as any}/>
          );
        }}
        // screenOptions={{
        //   headerShown: false,
        //   drawerStyle: {
        //     width: screenWidth * 0.85,
        //   },
        // }}
        screenOptions={({route, navigation}) => {
          return {
            headerShown: false,
            drawerStyle: {
              width: screenWidth * 0.85,
            },
          };
        }}
        
      >
        <Drawer.Screen 
          name='StackNavigator' 
          component={StackNavigator}
          {...nav}
        />
        
      </Drawer.Navigator>
       
    );
}

const ScreenNavigator = (nav: object): React.ReactElement => {
  return (
    <Stack.Navigator
      initialRouteName='WelcomeStackNavigator'
    >
      <Stack.Screen name='WelcomeStackNavigator' options={{
        headerShown: false
      }} component={WelcomeStackNavigator}  />

      <Stack.Screen name='DrawerNavigator' options={{
        headerShown: false,
      }} component={DrawerNavigator}  />
      
    </Stack.Navigator>
     
  );
}

const AuthStackNavigator = (navigation: object): React.ReactElement => {
  return (
    <Stack.Navigator
      initialRouteName="SplashScreen" 
      screenOptions={{
        gestureEnabled: false,
        headerShown: false,
        cardStyleInterpolator: forSlide as any
      }}
    >

      <Stack.Screen name="SplashScreen" options={{
        headerShown: false
      }} component={SplashScreen} />

      <Stack.Screen name="Registration" component={Registration} />

      <Stack.Screen name="FaceLogin" component={FaceLogin} />
      
      <Stack.Screen name="FaceRegister" component={FaceRegister} />

      <Stack.Screen name="Login" component={Login} />

    </Stack.Navigator>
  );
}
  
export const Navigator = (): React.ReactElement => {
  return (
    <Stack.Navigator
      initialRouteName='AuthStackNavigator'
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        cardStyleInterpolator: forSlide as any
      }}
    > 
      
      <Stack.Screen 
        name="AuthStackNavigator" 
        component={AuthStackNavigator} 
      />

      <Stack.Screen 
        name="ScreenNavigator" 
        component={ScreenNavigator} 
      />
  
    </Stack.Navigator>
  );
}

