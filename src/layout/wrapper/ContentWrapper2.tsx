import React, { useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { BODY_CONTAINER_WIDTH, BODY_CONTAINER_HEIGHT, SCREEN_WIDTH, BODY_BOX_HEIGHT } from './StyleConfig';

const ContentWrapper2 = (props) => {
    useEffect(() => {
        
    }, [])
    return (
        <View 
            style={[styles.wrapper, props.style, {backgroundColor: props.colorLayout.appBgColor}]} 
        >
            {props.children}
        </View>
    )
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: 'red',
        width: SCREEN_WIDTH,
        height: BODY_BOX_HEIGHT,
        paddingHorizontal: 0,
    }
});

export { ContentWrapper2 };
