import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Modal, Dimensions, View, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Card } from 'react-native-paper';
import { Icon } from 'react-native-elements';

import * as store from '../../store';

import { InputComponent } from './InputComponent';
import { colors } from '../../utilities/constants';
import { capitalizeFirstLetter } from '../../utilities/constants';

const screenWidth = Dimensions.get('screen').width;
const screenHeight = Dimensions.get('screen').height;
// let colorLayout = store.default.getState().auth.colorLayout;

const AlertComponent = ({
    visible,
    message,
    onCancel,
    onOk,
    headerTitle = 'Message',
    cancelText,
    okText,
    showCommentBox = false,
    commentValue = '',
    animation = 'slide',
    placeholder = 'Enter Comment',
    showCancel = true,
    is_lower = true,
    showCloseBtn = false,
    onClose = () => {}
}) => {

    const [showModal, setVisible] = useState(true);
    const [commentBox, setCommentBox] = useState(showCommentBox);
    const [comment, setComment] = useState(commentValue);
    const [colorLayout, setColorLayout] = useState(store.default.getState().auth.colorLayout ? store.default.getState().auth.colorLayout : colors);

    return (
        <Modal
            animationType={animation as any}
            transparent
            visible={visible}
            onRequestClose={() => {
                // this.setState({ visible: false });
            }}
            onShow={() => {
                setComment(commentValue);
                setCommentBox(showCommentBox);
                setVisible(true);
                setColorLayout(store.default.getState().auth.colorLayout ? store.default.getState().auth.colorLayout : colors);
            }}
            onDismiss={() => {
                setComment('');
            }}
        >
            <View 
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0, 0.6)',
                    zIndex: 1,
                    position: 'absolute',
                    height: screenHeight,
                    width: screenWidth,
                    opacity: 0.6
                }}
            />

            <View style={{ ...styles.centeredView }}>
                    
                <TouchableWithoutFeedback
                    onPress={() => {
                        Keyboard.dismiss()
                    }}
                >
                    <View>
                        <Card
                            elevation={10}
                            style={{
                                borderRadius: 5,
                                backgroundColor: '#ffffff',
                                width: screenWidth * 0.9,
                                padding: 0,
                            }}
                        
                        >
                            
                            <Card.Content>
                                <View
                                   style={{
                                        backgroundColor: colorLayout.subHeaderBgColor,
                                        paddingVertical: 10,
                                        paddingHorizontal: 10,
                                        borderRadius: 0,
                                        marginBottom: 20,
                                        marginLeft: -16,
                                        marginTop: -16,
                                        width: screenWidth * 0.9,
                                        borderTopLeftRadius: 5,
                                        borderTopRightRadius: 5,
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexDirection: 'row'
                                    }} 
                                >
                                    <Text
                                        style={{
                                            color: colorLayout.headerTextColor,
                                            fontSize: 16
                                        }}
                                    >
                                        {headerTitle}

                                        
                                    </Text>

                                    {
                                        showCloseBtn &&
                                        <Icon
                                            name={'close'}
                                            type='ant-design'
                                            color={colorLayout.headerTextColor}
                                            size={22}
                                            containerStyle={{
                                                
                                            }}
                                            
                                            onPress={() => {
                                                onClose();
                                            }}
                                        />
                                    }
                                </View>
                                
                                {
                                    !commentBox &&
                                    <Text style={{ ...styles.modalMessage, color: colorLayout.subTextColor, textAlign: 'center'}}>{capitalizeFirstLetter(message, is_lower)}</Text>
                                }

                                {
                                    commentBox &&
                                    <InputComponent
                                        placeholder={placeholder}
                                        maxHeight={100}
                                        maxCommentLength={250}
                                        comment={comment}
                                        changeText={(text: string) => {
                                            setComment(text);
                                        }}
                                        multiline={true}
                                        style={{
                                            marginTop: 0,
                                            width: (screenWidth * 0.9) - 30,
                                            marginBottom: 20,
                                        }}
                                        
                                    />
                                }

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                    }}
                                >

                                    <TouchableOpacity
                                        style={{
                                            ...styles.modalActionBtn,
                                            backgroundColor: colorLayout.subHeaderBgColor,
                                            
                                        }}
                                        onPress={() => {
                                            onOk(comment);
                                        }}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={{...styles.openButton, color: colorLayout.headerTextColor,
                                            }}>{okText}</Text>
                                    </TouchableOpacity>
                                            
                                    {
                                        showCancel && 
                                            <TouchableOpacity
                                            style={{
                                            ...styles.modalActionBtn,
                                            backgroundColor: colorLayout.subHeaderBgColor,
                                                
                                            }}
                                            onPress={() => {
                                                onCancel();
                                            }}
                                            activeOpacity={0.9}
                                        >
                                            <Text 
                                                style={{
                                                    ...styles.openButton, 
                                                    color: colorLayout.headerTextColor,
                                                    
                                                }}
                                            >
                                                {cancelText}
                                            </Text>
                                        </TouchableOpacity>
                                    }
                                    

                                </View>
                                
                            </Card.Content>
                        </Card>
                    </View>
                </TouchableWithoutFeedback>

            </View>
        </Modal>
    
    );
}

const styles = StyleSheet.create({
    centeredView: {
        borderWidth: 0,
        zIndex: 2, 
        position: 'absolute',
        alignSelf: 'center',
        marginTop: screenHeight * 0.35,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 15,
    },
    openButton: {
        fontWeight: '600',
        width: 100,
        textAlign: 'center'
    },
    modalMessage: {
        fontSize: 16,
        fontWeight: '400',
        marginBottom: 20,
    },
    modalActionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginHorizontal: 5
    }
});

export { AlertComponent };
