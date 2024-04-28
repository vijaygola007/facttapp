import React, { useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';

import { BODY_CONTAINER_WIDTH, BODY_CONTAINER_HEIGHT, APP_PADDING } from './StyleConfig';

const ContentWrapper = (props) => {
    
    return (
        <View style={[styles.wrapper, props.style]}>
            {/* <ScrollView style={styles.content}> */}
                {props.children}
            {/* </ScrollView> */}
        </View>
    )
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: 'transparent',
        width: BODY_CONTAINER_WIDTH,
        height: BODY_CONTAINER_HEIGHT,
        paddingHorizontal: APP_PADDING,
    },
    content: {
        flex: 1,
        backgroundColor: 'transparent'
    }
});

export { ContentWrapper };
