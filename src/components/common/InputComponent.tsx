import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, ScrollView, StatusBar} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import { Input } from 'react-native-elements';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height - (StatusBar.currentHeight as any);

const InputComponent = ({
    comment,
    maxCommentLength,
    maxHeight = 50,
    placeholder,
    changeText,
    multiline = false,
    style = {},
    showFocus = false
}) => {

    const [inputRef, setInputRef] = useState(null);

    return (
        <View
            style={{
                borderWidth: 1,
                borderRadius: 8,
                padding: 4,
                width: screenWidth * 0.9,
                borderColor: '#d3d3d3',
                height: maxHeight,
                ...style
            }}
            
        >
            <ScrollView
                style={{
                    maxHeight: maxHeight,
                }}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps={'always'}
                onTouchEnd={() => {
                    if(inputRef){
                        if(!(inputRef as any).isFocused()){
                            (inputRef as any).focus();
                        }
                    }
                }}
                scrollEnabled={multiline}
            >
                <Input
                    ref={(r: any) => {
                        setInputRef(r);
                    }}
                    autoCompleteType={null}
                    placeholder={placeholder}
                    value={comment}
                    style={{
                        fontSize: 14
                    }}
                    containerStyle={{
                        paddingLeft: 0,
                        paddingTop: 0,
                        paddingRight: 0,
                        paddingBottom: 0,
                    }}
                    inputStyle={{
                        paddingTop: 0,
                        paddingBottom: 0,
                        // backgroundColor: 'red',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                    inputContainerStyle={{
                        borderBottomWidth: 0,
                        margin: 0
                    }}
                    multiline={multiline}
                    onChangeText={(text) => {
                        var cmt = text.slice(0, maxCommentLength)
                        changeText(cmt);
                    }}
                    maxLength={maxCommentLength}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    
});

export { InputComponent };
