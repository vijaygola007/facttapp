import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, SafeAreaView, View, AppState } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { APP_PADDING, SCREEN_HEIGHT, VIEW_PART_HEIGHT } from './StyleConfig';
import { useKeyboard } from './useKeyboard';

const Wrapper = (props) => {
    const keyboardHeight = useKeyboard();
    const [viewPartHeight, setViewPartHeight] = useState(SCREEN_HEIGHT - (2 * APP_PADDING));

    useEffect(() => {
        setViewPartHeight(SCREEN_HEIGHT - ( 2 * APP_PADDING) - getStatusBarHeight());
    },[]);

    // useFocusEffect(
    //     React.useCallback(() => {
    //         setViewPartHeight(SCREEN_HEIGHT - ( 1 * APP_PADDING) - getStatusBarHeight());
    //     }, [])
    // );

    // React.useEffect(() => {
    //     const unsubscribe = navigation.addListener('focus', () => {
    //       // The screen is focused
    //       // Call any action
    //     });
    
    //     // Return the function to unsubscribe from the event so it gets removed on unmount
    //     return unsubscribe;
    //   }, [navigation]);
    
    
    return (
        <SafeAreaView
            {...props}
            style={[styles.wrapper, 
                {backgroundColor: props.colorLayout.appBgColor}, 
                props.style
            ]}
        >
            <KeyboardAwareScrollView
                {...props}
                style={{
                    ...styles.content,
                    ...props.containerStyle
                }}
                persistentScrollbar={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps={'always'}
                nestedScrollEnabled={true}
                scrollEnabled={props.scrollEnabled ? keyboardHeight > 0 ? props.scrollEnabled : false : false}
                contentContainerStyle={{
                    // marginTop: 6,
                    // height: props.hasHeader ? BODY_BOX_HEIGHT : BODY_CONTAINER_HEIGHT + (props.isModal ? getStatusBarHeight() : 0),
                    // flex: 1,
                    // paddingBottom: props.disableKeyboardBottom ? 10 : keyboardHeight,
                    // ...props.contentContainerStyle
                    height: viewPartHeight + (props.hasHeader ? (APP_PADDING - 1) : 0),
                    paddingBottom: keyboardHeight > 0 ? props.hasHeader ? keyboardHeight : props.isModal ? 0 : (2 * APP_PADDING) : 0,
                    // marginTop: 8
                }}
                onLayout={(evt) => {
                    setViewPartHeight(VIEW_PART_HEIGHT(props.hasHeader));
                }}
            >
                <View
                    style={{
                        flex: 1,
                        ...props.innerContentStyle
                    }}
                >
                    {/* <ScrollView
                        style={{
                            backgroundColor: 'pink',
                            flex: 1,
                        }}
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps={'always'}
                        contentContainerStyle={{
                            
                        }}
                    > */}
                            {props.children}
                            {/* <Text>
                                {viewPartHeight}
                            </Text> */}
                            
                    {/* </ScrollView> */}
                </View>
                
            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
};
const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#fff'
    },
    content: {
        flex: 1,
        padding: APP_PADDING,
    }
});
export { Wrapper };
