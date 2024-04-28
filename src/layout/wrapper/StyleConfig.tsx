import { Dimensions } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { getStatusBarHeight } from 'react-native-status-bar-height';

let SCREEN_WIDTH = Dimensions.get('window').width;
let SCREEN_HEIGHT = Dimensions.get('window').height;

const APP_PADDING_VALUE = 10;
const APP_PADDING = moderateScale(APP_PADDING_VALUE);
const BODY_CONTAINER_WIDTH = SCREEN_WIDTH - (2 * APP_PADDING);
const BODY_CONTAINER_HEIGHT = SCREEN_HEIGHT - (2 * APP_PADDING) - getStatusBarHeight();
const HEADER_HEIGHT = 82;
const BODY_BOX_HEIGHT = BODY_CONTAINER_HEIGHT - (HEADER_HEIGHT - getStatusBarHeight()) + (2 * APP_PADDING);
const AVAILABLE_HEIGHT = SCREEN_HEIGHT - getStatusBarHeight();

const VIEW_PART_HEIGHT = (hasHeader: boolean = false) => {
    return Dimensions.get('window').height - (hasHeader ? HEADER_HEIGHT : 0) + (hasHeader ? 2 * APP_PADDING : 0) - 4
}

const TEXT_SIZE_10 = moderateScale(10);
const TEXT_SIZE_12 = moderateScale(12);
const TEXT_SIZE_14 = moderateScale(14);
const TEXT_SIZE_16 = moderateScale(16);
const TEXT_SIZE_18 = moderateScale(18);
const TEXT_SIZE_20 = moderateScale(20);
const TEXT_SIZE_22 = moderateScale(22);
const TEXT_SIZE_24 = moderateScale(24);
const TEXT_SIZE_26 = moderateScale(26);

const BORDER_RADIUS = 5;

const BTN_BORDER_RADIUS = 5;
const CARD_BORDER_RADIUS = 5;

const PADDING_4 = moderateScale(4);
const PADDING_6 = moderateScale(6);
const PADDING_8 = moderateScale(8);
const PADDING_10 = moderateScale(10);
const PADDING_12 = moderateScale(12);
const PADDING_14 = moderateScale(14);
const PADDING_16 = moderateScale(16);


export {
    APP_PADDING_VALUE,
    APP_PADDING,
    BODY_CONTAINER_WIDTH,
    BODY_CONTAINER_HEIGHT,

    TEXT_SIZE_10,
    TEXT_SIZE_12,
    TEXT_SIZE_14,
    TEXT_SIZE_16,
    TEXT_SIZE_18,
    TEXT_SIZE_20,
    TEXT_SIZE_22,
    TEXT_SIZE_24,
    TEXT_SIZE_26,

    BORDER_RADIUS,
    BTN_BORDER_RADIUS,
    CARD_BORDER_RADIUS,

    SCREEN_WIDTH,
    SCREEN_HEIGHT,
    HEADER_HEIGHT,
    BODY_BOX_HEIGHT,
    AVAILABLE_HEIGHT,
    VIEW_PART_HEIGHT,

    PADDING_4,
    PADDING_6,
    PADDING_8,
    PADDING_10,
    PADDING_12,
    PADDING_14,
    PADDING_16
}