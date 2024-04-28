import { Easing, Animated } from 'react-native';

//transition configuration for router sceens
const transitionConfig = () => ({
	screenInterpolator: sceneProps => {
		const { layout, position, scene } = sceneProps;
		const { index } = scene;
		const width = layout.initWidth;

		const inputRange = [index - 1, index, index + 1];

		const translateX = position.interpolate({
			inputRange,
			outputRange: ([width, 0, 0]),
		});

		return {
			transform: [
				{ translateX }
			],
		};
	},
	transitionSpec: {
		duration: 350,
		easing: Easing.out(Easing.poly(4)),
		timing: Animated.timing,
		useNativeDriver: true,
	},
});

const screenNames = {
	AuthNavigator: 'AuthNavigator',
	MainNavigator: 'MainNavigator',
	Login: 'Login',
	ForgotPassword: 'ForgotPassword',
	DoctorDashboard: 'DoctorDashboard',
	Preview: 'Preview',
	Home: 'Home',
	HomeDashboard: 'HomeDashboard',
	Splash: 'SplashScreen',
	Registration: 'Registration',
	Account: 'Account',
	Machines: 'Machines'
};


const routeNames = {
    Dashboard: 'Dashboard',
    HomeDashboard: 'Services',
    Account: 'Account',
    Assets: 'Assets',
    Machines: 'Machines',
    Catalog: 'Catalog',
    TechnicalDescription: 'Technical Description',
    ServiceHistory: 'Service History',
    ServiceHistoryDetail: 'Service Detail',
    AddDates: 'Work Detail',
    OtherExpenses: 'Travel Detail',
    SaveExpenses: 'Save Expenses',
	ExtraExpenses: 'Extra Expenses',
	StartJourney: 'Start Journey',
	EndJourney: 'End Journey'
};

export {
	transitionConfig,
	screenNames,
	routeNames
};
