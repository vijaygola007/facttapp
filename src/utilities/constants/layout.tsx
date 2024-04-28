import { Dimensions, Platform, StatusBar } from 'react-native';
// eslint-disable-next-line import/no-extraneous-dependencies

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

let statusBarPadding: any = 0;
let isOldDevice = false;
let statusBarHeight: any = 0;

var majorVersionOS: any = parseInt(Platform.Version as any, 10);

if (Platform.OS === 'ios') {

    statusBarHeight = 0;

    if (majorVersionOS < 11) { //old iOS device
        statusBarPadding = 20; //safe area doesn't work in old iOS devices
        isOldDevice = true;
    }
} else {
    statusBarHeight = StatusBar.currentHeight;

    if (majorVersionOS < 23) { //old android device
        isOldDevice = true;
    } else {
        statusBarPadding = StatusBar.currentHeight; //to add statusbar height at top of the container in new devices
    }
}

const layout = {
    size: {
        width,
        height,
    },
    statusBarPadding,
    statusBarHeight,
    isiOS: Platform.OS === 'ios',
    isOldDevice
};

export { layout };
