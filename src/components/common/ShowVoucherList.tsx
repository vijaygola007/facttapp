import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, View, 
    Dimensions, Image, ScrollView, Platform, Keyboard
} from 'react-native';
import { Icon, Input, Slider } from 'react-native-elements';
import {
    TextField,
} from 'rn-material-ui-textfield';

import * as store from '../../store';
import { AlertComponent } from './Alert';
import { AddItem } from './AddItem';
import { hexToRgbA, NumericPattern } from '../../utilities/constants';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;


// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_18, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT,
    PADDING_12,
    TEXT_SIZE_20,
    TEXT_SIZE_10,
    TEXT_SIZE_24,
    BTN_BORDER_RADIUS,
    PADDING_14,
    AVAILABLE_HEIGHT,
    SCREEN_HEIGHT,
    VIEW_PART_HEIGHT,
    PADDING_6,
    PADDING_16
} from '../../layout/wrapper';

import uuid from 'react-native-uuid';
// var RNFS = require('react-native-fs');
import RNFS from 'react-native-fs';

const ShowVoucherList = ({
    visible,
    onClose,
    currencySymbol,
    voucherList,
    expenseAmount,
    onSubmit,
    props,
    voucherHeads,
    isFormEditable
}) => {
    
    const [colorLayout, setColorLayout] = useState(store.default.getState().auth.colorLayout);
    const [voucherDetails, setVoucherDetails] = useState(voucherList);
    const [openModal, setModal] = useState(false);
    const [removeIndex, setRemoveIndex] = useState(0);
    const [totalAmount, setTotalAmount] = useState(expenseAmount);
    const [openItemModal, setOpenItemModal] = useState(false);

    const onRequestClose = () => {
        onClose();
    };

    useEffect(() => {
        const unsubscribe = props.navigation.addListener('focus', () => {
            setTotalAmount(expenseAmount as any);
            setVoucherDetails(voucherList);
            calculateAmount(voucherList);
        });
      
        // Return the function to unsubscribe from the event so it gets removed on unmount
        return unsubscribe;
    }, [voucherDetails,totalAmount]);

    const calculateAmount = (vouchers: Array<object>) => {
        var amount = 0;
        vouchers.forEach((voucher: any) => {
            amount = amount + ((voucher['qty'] ? parseInt(voucher['qty']) : 0) * (voucher['unitPrice'] ? (parseFloat(voucher['unitPrice']) as any).toFixed(2) : 0))
        });
        setTotalAmount(amount.toFixed(2));
    }

    const saveItemDetail = (data: object) => {
        var voucherDt: Array<object> = JSON.parse(JSON.stringify(voucherDetails));
        var amount = ((data['qty'] ? parseInt(data['qty']) : 0) * (data['unitPrice'] ? (parseFloat(data['unitPrice']) as any).toFixed(2) : 0));
        voucherDt.push({
            "index": voucherDt.length,
            "expenseHeadCode": data["expenseHeadCode"],
            "expenseHeadName": data["expenseHeadName"],
            "expenseItem": data["expenseItem"],
            "qty": data["qty"],
            "unitPrice": (parseFloat(data['unitPrice']) as any).toFixed(2),
            "description": data["description"],
            "show": true,
            "expenseHeadID": data["expenseHeadID"],
            "amount": amount.toFixed(2)
        });
        setOpenItemModal(false);
        setVoucherDetails(voucherDt as any);
        
        calculateAmount(voucherDt);
        
    }

    return (
        <Modal
            animationType='fade'
            transparent
            visible={visible}
            onRequestClose={() => {
                onRequestClose();
            }}
            onShow={() => {
                setTotalAmount(expenseAmount as any);
                setVoucherDetails(voucherList);
                calculateAmount(voucherList);
            }}
            style={{
                
            }}
            onLayout={(evt) => {
                
            }}
        >

            <View
                style={{
                    backgroundColor: colorLayout.headerBgColor,
                    zIndex: 4,
                    height: 60,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'absolute',
                    width: SCREEN_WIDTH
                }}
            >
                <Text
                    style={{
                        fontSize: 20,
                        marginLeft: 10,
                        fontWeight: '600',
                        color: colorLayout.headerTextColor,
                    }}
                >
                    Vouchers Detail
                </Text>

                <TouchableOpacity
                    style={{
                        marginRight: 10
                    }}
                    onPress={() => {
                        onRequestClose();
                    }}
                    activeOpacity={0.8}
                    >
                    <Icon
                        name='close'
                        type='ionicons'
                        color={colorLayout.headerTextColor}
                        iconStyle={{
                        fontSize: 30,
                        }}
                    />
                </TouchableOpacity>

            </View>

            <Wrapper
      
                containerStyle={{
                    paddingHorizontal: 0,
                    paddingTop: 4
                    // paddingBottom: 4
                }} 
                colorLayout={colorLayout}
                isModal={true}
                disableKeyboardBottom={true}
                scrollEnabled={true}
            >
            

                <View
                    style={{
                        width: screenWidth,
                        flex: 1,
                        paddingTop: 60,
                        justifyContent: 'space-between',
                        paddingBottom: 6
                    }}
                >
                    <View
                        style={{
                            paddingVertical: APP_PADDING,
                            flexDirection: 'row',
                            alignItems: 'center',
                            // marginHorizontal: -APP_PADDING
                        }}
                    >
                        <View
                            style={{
                                ...styles.shadow_box,
                                marginVertical: 0
                            }}
                        >
                            <View 
                                
                                style={{
                                    ...styles.capture_btn,
                                    backgroundColor: '#fff',
                                }}
                            >
                                <Text
                                style={{
                                    color: colorLayout.subTextColor,
                                    fontSize: TEXT_SIZE_14
                                }}
                            >
                                Total - 
                            </Text>
                            <Text
                                style={{
                                    paddingHorizontal: APP_PADDING,
                                    color: colorLayout.subTextColor,
                                    fontSize: TEXT_SIZE_14,
                                    fontWeight: '900'
                                }}
                            >
                                {currencySymbol} {totalAmount}
                            </Text>
                            </View>
                            
                        </View>

                        <View
                            style={{
                                ...styles.shadow_box,
                                marginVertical: 0
                            }}
                        >
                            <View 
                                
                                style={{
                                    ...styles.capture_btn,
                                    backgroundColor: '#fff',
                                }}
                            >
                                <Icon
                                    name='ticket'
                                    type='font-awesome'
                                    color={colorLayout.subTextColor}
                                    containerStyle={{
                                        
                                    }}
                                    iconStyle={{
                                        fontSize: 22,
                                    }}
                                />
                                <Text
                                    style={{
                                        paddingHorizontal: APP_PADDING,
                                        color: colorLayout.subTextColor,
                                        fontSize: TEXT_SIZE_14,
                                        fontWeight: '900'
                                    }}
                                >
                                    {voucherDetails.length}
                                </Text>
                            </View>
                            
                        </View>
                    </View>

                    {
                            voucherDetails.length == 0 &&
                            <View
                                style={{
                                    flex: 1,
                                    justifyContent: 'flex-end',
                                    flexGrow: 1,
                                    alignItems: 'center'
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16,
                                        color: '#d3d3d3',
                                        fontWeight: '500'
                                    }}
                                >
                                    No Vouchers
                                </Text>
                            </View>
                        }

                    <ScrollView
                        scrollEnabled={true}
                        nestedScrollEnabled={true}
                        style={{
                            
                        }}
                    >
                        <View
                            style={{
                                paddingHorizontal: APP_PADDING,
                            }}
                        >
                            
                    <View
                        style={{
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            paddingVertical: 16,
                        }}
                    >
                        {
                            voucherDetails.map((voucher: object, index) => {
                                return (
                                    <View
                                        style={{
                                            ...styles.voucher_card,
                                            // display: voucher['show'] ? 'flex' : 'none',
                                        }}
                                        key={index}
                                    >
                                        <View
                                            style={{
                                                backgroundColor: '#ffffff',
                                                shadowColor: '#000',
                                                borderRadius: CARD_BORDER_RADIUS,
                                                shadowOffset: {
                                                    width: 0,
                                                    height: 0
                                                },
                                                shadowOpacity: 0.4,
                                                shadowRadius: 3,
                                                elevation: 14,
                                                paddingBottom: 2*APP_PADDING,
                                            }}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: APP_PADDING
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: colorLayout.subTextColor,
                                                            fontSize: TEXT_SIZE_14
                                                        }}
                                                    >
                                                        Amount - 
                                                    </Text>
                                                    <Text
                                                        style={{
                                                            paddingHorizontal: APP_PADDING,
                                                            color: colorLayout.subTextColor,
                                                            fontSize: TEXT_SIZE_14,
                                                            fontWeight: '900'
                                                        }}
                                                    >
                                                        {currencySymbol} {voucher['amount']}
                                                    </Text>
                                                </View>

                                                {
                                                    isFormEditable &&
                                                    
                                                
                                                <TouchableOpacity
                                                    style={{
                                                        backgroundColor: '#ff0000',
                                                        width: 24,
                                                        height: 24,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: 50
                                                    }}
                                                    onPress={() => {
                                                        setRemoveIndex(index);
                                                        setModal(true);
                                                    }}
                                                >
                                                <View
                                                    style={{
                                                        shadowColor: '#000',
                                                        shadowOffset: {
                                                            width: 0,
                                                            height: 0
                                                        },
                                                        shadowOpacity: 1,
                                                        shadowRadius: 3,
                                                        elevation: 20,
                                                        borderRadius: 50
                                                    }}
                                                >
                                                    <View
                                                        style={{
                                                            shadowColor: '#000',
                                                            shadowOffset: {
                                                                width: 0,
                                                                height: 0
                                                            },
                                                            shadowOpacity: 1,
                                                            shadowRadius: 3,
                                                            elevation: 10,
                                                        }}
                                                    >
                                                            <Icon
                                                                name='trash-o'
                                                                type='font-awesome'
                                                                color={'#fff'}
                                                                containerStyle={{
                                                                    
                                                                }}
                                                                iconStyle={{
                                                                    fontSize: 16,
                                                                }}
                                                                onPress={() => {
                                                                    setRemoveIndex(index);
                                                                    setModal(true);
                                                                }}
                                                            />
                                                    </View>
                                                </View>
                                                        </TouchableOpacity>
                                                }
                                            </View>
                                            
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        paddingHorizontal: APP_PADDING,
                                                        width: (SCREEN_WIDTH) - (2 * APP_PADDING)
                                                    }}
                                                >
                                                    <TouchableOpacity
                                                        activeOpacity={0.9}
                                                        onPress={() => {
                                                            
                                                        }}
                                                        style={{
                                                            // flexDirection: 'row',
                                                            // alignItems: 'flex-end',
                                                            // borderBottomColor: voucher['expenseHeadName'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5'),
                                                            // borderBottomWidth: voucher['expenseHeadName'] ? 2 : 1,
                                                            // marginTop: -5,
                                                        }}
                                                    >
                                                        <View
                                                            style={{
                                                                flex: 1,
                                                            }}
                                                        >
                                                            <TextField
                                                                label="Expense Head"
                                                                lineWidth={0}
                                                                value={voucher['expenseHeadName']}
                                                                disabled={true}
                                                                disabledLineType={'solid'}
                                                                disabledLineWidth={0}
                                                                inputContainerStyle={{
                                                                    paddingBottom: 0,
                                                                    paddingLeft: 5,
                                                                    borderBottomColor: '#d3d3d3',
                                                                    borderBottomWidth: 1,
                                                                }}
                                                                fontSize={TEXT_SIZE_18}
                                                                contentInset={{
                                                                    top: 10,
                                                                    input: 0,
                                                                    label: 2,
                                                                    bottom: 0
                                                                }}
                                                                baseColor={voucher['expenseHeadName'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                                tintColor={voucher['expenseHeadName'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                            />
                                                        </View>
                                                    </TouchableOpacity>
                                            
                                                </View>

                                                <View
                                                    style={{
                                                        paddingHorizontal: APP_PADDING,
                                                        width: (SCREEN_WIDTH) - (2 * APP_PADDING),
                                                        
                                                    }}
                                                >
                                                    
                                                    <TextField
                                                        label="Item"
                                                        lineWidth={voucher['expenseItem'] ? 0 : 0}
                                                        disabled={true}
                                                        disabledLineType={'solid'}
                                                        value={voucher['expenseItem']}
                                                        disabledLineWidth={voucher['expenseItem'] ? 0 : 0}
                                                        onChangeText={(text: string) => {
                                                            // var all_vouchers = JSON.parse(JSON.stringify(voucherDetails));
                                                            // all_vouchers[index]['expenseItem'] = text.slice(0, 100);
                                                            // this.setState({voucherDetails: all_vouchers});
                                                        }}
                                                        
                                                        inputContainerStyle={{
                                                            paddingBottom: 0,
                                                            paddingLeft: 5,
                                                            borderBottomColor: '#d3d3d3',
                                                            borderBottomWidth: 1,
                                                        }}
                                                        titleTextStyle={{
                                                            display: 'none'
                                                        }} 
                                                        fontSize={TEXT_SIZE_18}
                                                        contentInset={{
                                                            top: 10,
                                                            input: 0,
                                                            label: 2,
                                                            bottom: 0
                                                        }}
                                                        baseColor={voucher['expenseItem'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                        tintColor={voucher['expenseItem'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                    />
                                                </View>
                                            </View>

                                            <View
                                                style={{
                                                    flexDirection: 'row',
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        paddingHorizontal: APP_PADDING,
                                                        width: (SCREEN_WIDTH * 0.5) - APP_PADDING
                                                    }}
                                                >
                                                    
                                                    <TextField
                                                        label="Qty"
                                                        lineWidth={voucher['qty'] ? 0 : 0}
                                                        value={voucher['qty']}
                                                        disabled={true}
                                                        disabledLineType={'solid'}
                                                        keyboardType="phone-pad"
                                                        disabledLineWidth={voucher['qty'] ? 0 : 0}
                                                        onChangeText={(text: string) => {
                                                            // var all_vouchers = JSON.parse(JSON.stringify(voucherDetails));
                                                            // all_vouchers[index]['qty'] = NumericPattern(text.slice(0, 6));
                                                            // this.setState({voucherDetails: all_vouchers});
                                                        }}
                                                        inputContainerStyle={{
                                                            paddingBottom: 0,
                                                            paddingLeft: 5,
                                                            borderBottomColor: '#d3d3d3',
                                                            borderBottomWidth: 1,
                                                        }}
                                                        titleTextStyle={{
                                                            display: 'none'
                                                        }} 
                                                        fontSize={TEXT_SIZE_18}
                                                        contentInset={{
                                                            top: 10,
                                                            input: 0,
                                                            label: 2,
                                                            bottom: 0
                                                        }}
                                                        baseColor={voucher['qty'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                        tintColor={voucher['qty'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                    />
                                                </View>

                                                <View
                                                    style={{
                                                        paddingHorizontal: APP_PADDING,
                                                        width: (SCREEN_WIDTH * 0.5) - APP_PADDING
                                                    }}
                                                >
                                                    
                                                    <TextField
                                                        label={`Unit Price (${currencySymbol})`}
                                                        lineWidth={voucher['unitPrice'] ? 0 : 0}
                                                        value={voucher['unitPrice']}
                                                        keyboardType="phone-pad"
                                                        disabled={true}
                                                        disabledLineType={'solid'}
                                                        disabledLineWidth={voucher['unitPrice'] ? 0 : 0}
                                                        onChangeText={(text: string) => {
                                                            // var all_vouchers = JSON.parse(JSON.stringify(voucherDetails));
                                                            // all_vouchers[index]['unitPrice'] = NumericPattern(text.slice(0, 10));
                                                            // this.setState({voucherDetails: all_vouchers});
                                                        }}
                                                        inputContainerStyle={{
                                                            paddingBottom: 0,
                                                            paddingLeft: 5,
                                                            borderBottomColor: '#d3d3d3',
                                                            borderBottomWidth: 1,
                                                        }}
                                                        fontSize={TEXT_SIZE_18}
                                                        contentInset={{
                                                            top: 10,
                                                            input: 0,
                                                            label: 2,
                                                            bottom: 0
                                                        }}
                                                        baseColor={voucher['unitPrice'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                        tintColor={voucher['unitPrice'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                    />
                                                </View>

                                            </View>

                                            <View
                                                style={{
                                                    width: SCREEN_WIDTH - (2 * APP_PADDING)
                                                }}
                                            >
                                                <View
                                                    style={{
                                                        paddingHorizontal: APP_PADDING
                                                    }}
                                                >
                                                    <TextField
                                                        label="Description"
                                                        lineWidth={voucher['description'] ? 0 : 0}
                                                        value={voucher['description']}
                                                        disabled={true}
                                                        disabledLineType={'solid'}
                                                        disabledLineWidth={voucher['description'] ? 0 : 0}
                                                        onChangeText={(text: string) => {
                                                            // var all_vouchers = JSON.parse(JSON.stringify(voucherDetails));
                                                            // all_vouchers[index]['description'] = text.slice(0, 250);
                                                            // this.setState({voucherDetails: all_vouchers});
                                                        }}
                                                        containerStyle={{
                                                            marginBottom: -9,
                                                        }}
                                                        inputContainerStyle={{
                                                            paddingBottom: 0,
                                                            paddingLeft: 5,
                                                            borderBottomColor: '#d3d3d3',
                                                            borderBottomWidth: 1,
                                                        }}
                                                        fontSize={TEXT_SIZE_18}
                                                        contentInset={{
                                                            top: 10,
                                                            input: 0,
                                                            label: 2,
                                                            bottom: 0
                                                        }}
                                                        baseColor={voucher['description'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                        tintColor={voucher['description'] ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                    />
                                                </View>

                                            </View>
                                        </View>

                                    </View>
                                );
                            })
                        }
                    </View>
                        </View>
                    </ScrollView>
                    
                    <View
                        style={{
                            flexDirection: 'row',
                            paddingVertical: APP_PADDING,
                        }}
                    >
                        {
                            isFormEditable &&
                            
                            <TouchableOpacity 
                                onPress={() => {
                                    setOpenItemModal(true);
                                }} 
                                style={{
                                    ...styles.action_btn,
                                    backgroundColor: colorLayout.subHeaderBgColor
                                }}
                            >
                                <Icon
                                    name='plus'
                                    type='font-awesome'
                                    color={colorLayout.headerTextColor}
                                    containerStyle={{
                                        
                                    }}
                                    iconStyle={{
                                        fontSize: 20,
                                    }}
                                    
                                />
                                <Text
                                    style={{
                                        fontSize: TEXT_SIZE_14,
                                                        color: colorLayout.headerTextColor,
                                                        fontWeight: '600'
                                    }}
                                >
                                    Voucher Item
                                </Text>
                            </TouchableOpacity>
                        }

                        <TouchableOpacity 
                            onPress={() => {
                                onSubmit(voucherDetails);
                            }} 
                            style={{
                                ...styles.action_btn,
                                backgroundColor: colorLayout.subHeaderBgColor
                            }}
                        >
                            <Text
                                style={{
                                    color: colorLayout.headerTextColor,
                                    fontWeight: '600',
                                    letterSpacing: 0.8,
                                    flex: 1,
                                    textAlign: 'center',
                                    textAlignVertical: 'center',
                                    fontSize: 16
                                }}
                            >
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>

            </Wrapper>

            <AddItem 
                visible={openItemModal}
                onDismiss={(data: object) => {
                    saveItemDetail(data);
                }}
                onClose={() => {
                    setOpenItemModal(false);
                }}
                headerTitle={'Add Voucher Item'}
                colorLayout={colorLayout}
                animation={'fade'}
                OkText='Save'
                itemList={voucherHeads}
                currencySymbol={currencySymbol}
            ></AddItem>

            <AlertComponent 
                message={'Are you sure want to remove voucher ?'} 
                visible={openModal}
                onCancel={() => {
                    setModal(false);
                }}
                onOk={() => {
                    setModal(false);
                    var arr = JSON.parse(JSON.stringify(voucherDetails));
                    arr.splice(removeIndex, 1);
                    setVoucherDetails(arr);
                    setTimeout(() => {
                        calculateAmount(arr);
                    }, 100);
                }}
                headerTitle="Confirmation"
                okText={'Yes'}
                cancelText={'No'}
            ></AlertComponent>

        </Modal>
            

    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        zIndex: 2, 
        position: 'absolute',
        width: screenWidth,
    },
    modalView: {
        backgroundColor: '#ffffff',
        padding: 0
    },
    modalActionBtn: {
        marginLeft: 40
    },
    voucher_card: {
        backgroundColor: '#fff',
        borderRadius: CARD_BORDER_RADIUS,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 10,
        // paddingVertical: 10,
        marginVertical: APP_PADDING,
        alignItems: 'flex-end'
    },
    action_btn:{
        alignItems: 'center',
        paddingVertical: PADDING_12,
        borderRadius: BTN_BORDER_RADIUS,
        flexDirection: 'row',
        flex: 1,
        marginHorizontal: APP_PADDING,
        justifyContent: 'space-between',
        paddingHorizontal: APP_PADDING,
    },
    shadow_box:{
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        borderRadius: CARD_BORDER_RADIUS,
        shadowOffset: {
            width: 0,
            height: 0
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 14,
        marginVertical: PADDING_6,
        marginHorizontal: APP_PADDING
    },
    capture_btn: {
        backgroundColor: '#062656',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 1,
        shadowRadius: 0,
        elevation: 20,
        flex: 1,
        paddingVertical: PADDING_10,
        borderRadius: BTN_BORDER_RADIUS,
        paddingHorizontal: APP_PADDING,
    },
});

export { ShowVoucherList };
