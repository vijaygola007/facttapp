import React, { useState } from 'react';
import { Text, StyleSheet, Modal, Dimensions, View, TouchableOpacity } from 'react-native';
import { Card, Snackbar } from 'react-native-paper';
import { colors, Icon } from 'react-native-elements';
import {
    TextField,
} from 'rn-material-ui-textfield';

import * as store from '../../store';
import { hexToRgbA, NumericPattern } from '../../utilities/constants';

import { DropdownItem } from '../../components/common';
// wrappers
import { Wrapper, PADDING_10, APP_PADDING, BORDER_RADIUS, CARD_BORDER_RADIUS,
    TEXT_SIZE_12, TEXT_SIZE_14, TEXT_SIZE_16, TEXT_SIZE_26, SCREEN_WIDTH, BODY_BOX_HEIGHT,
    PADDING_12,
    TEXT_SIZE_20,
    TEXT_SIZE_10,
    TEXT_SIZE_24,
    BTN_BORDER_RADIUS,
    PADDING_14,
    AVAILABLE_HEIGHT,
    SCREEN_HEIGHT,
    BODY_CONTAINER_HEIGHT,
    VIEW_PART_HEIGHT
} from '../../layout/wrapper';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const color = {
    danger: '#CD3D3E',
    warning: '#EB9D3E',
    success: '#4DAD49',
    info: '#4CB3D5',
    default: '#565656'
}

const AddItem = ({
    visible,
    onDismiss,
    onClose,
    headerTitle = 'Message',
    OkText = 'Ok',
    colorLayout,
    animation = 'slide',
    itemList = [],
    currencySymbol
}) => {

    const [showModal, setVisible] = useState(true);
    const [showDrpDwn, setShowDrpDwn] = useState(false);
    const [expenseHeadID, setExpenseHeadID] = useState('');
    const [expenseHeadName, setExpenseHeadName] = useState('');
    const [expenseHeadCode, setExpenseHeadCode] = useState('');
    const [expenseItem, setExpenseItem] = useState('');
    const [expenseItemFocus, setExpenseItemFocus] = useState(false);
    const [qty, setQty] = useState('');
    const [qtyFocused, setQtyFocused] = useState(false);
    const [unitPrice, setUnitPrice] = useState('');
    const [unitPriceFocused, setUnitPriceFocused] = useState(false);
    const [description, setDescription] = useState('');
    const [descriptionFocus, setDescriptionFocus] = useState(false);

    const [selectedItemId, setSelectedItemId] = useState(null);

    const [showSnack, setShowSnack] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');

    const validateVoucher = () => {
        if(!expenseHeadID){
            setShowSnack(true);
            setSnackMessage('Expense head is required');
            return;
        }
        if(!expenseItem){
            setShowSnack(true);
            setSnackMessage('Item name is required');
            return;
        }
        if(!qty){
            setShowSnack(true);
            setSnackMessage('Quantity is required');
            return;
        }
        if(!unitPrice){
            setShowSnack(true);
            setSnackMessage('Price is required');
            return;
        }
        // if(!description){
        //     setShowSnack(true);
        //     setSnackMessage('Description is required');
        //     return;
        // }
        
        var data = {
            expenseHeadID,
            expenseItem,
            expenseHeadName,
            expenseHeadCode,
            qty,
            unitPrice,
            description
        }
        onDismiss(data);
        resetForm();
    }

    const resetForm = () => {
        setShowSnack(false);
        setShowDrpDwn(false);
        setExpenseHeadID('');
        setExpenseHeadName('');
        setExpenseHeadCode('');
        setExpenseItem('');
        setExpenseItemFocus(false);
        setQty('');
        setQtyFocused(false);
        setUnitPrice('');
        setUnitPriceFocused(false);
        setDescription('');
        setDescriptionFocus(false);
        setSelectedItemId(null);
    }

    return (
      <Modal
        animationType={animation as any}
        transparent
        visible={visible}
        onRequestClose={() => {
            onClose();
        }}
        onShow={() => {
            setVisible(true);
            colorLayout = store.default.getState().auth.colorLayout;
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
            <Wrapper
      
                style={{
                    padding: 0,
                    backgroundColor: 'transparent',
                }} 
                innerContentStyle={{
                    backgroundColor: 'transparent'
                }}
                colorLayout={colorLayout}
                isModal={true}
                disableKeyboardBottom={false}
                scrollEnabled={true}
            >
                <Card
                    elevation={6}
                    style={{
                        borderRadius: CARD_BORDER_RADIUS,
                        backgroundColor: '#ffffff',
                        width: screenWidth * 0.9,
                        padding: 0,
                    }}
                >
            
                    <Card.Content>
                        <View
                            style={{
                                backgroundColor: '#fff',
                            }}
                        >
                    
                            <Text
                                style={{
                                color: colorLayout.headerTextColor,
                                fontSize: 16,
                                backgroundColor: colorLayout.subHeaderBgColor,
                                paddingVertical: 10,
                                paddingLeft: 10,
                                borderRadius: 0,
                                marginBottom: 20,
                                marginLeft: -16,
                                marginTop: -16,
                                width: screenWidth * 0.9,
                                borderTopLeftRadius: 5,
                                borderTopRightRadius: 5
                                }}
                            >
                                {headerTitle}
                            </Text>

                    
                        
                            <View
                                style={{
                                    flexDirection: 'column',
                                }}
                            >
                                <View
                                    style={{
                                        paddingHorizontal: APP_PADDING,
                                    }}
                                >
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            if(itemList.length > 0){
                                                setShowDrpDwn(true);
                                            }else{
                                                setShowSnack(true);
                                                setSnackMessage('Expense head is unavailable');
                                            }
                                        }}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'flex-end',
                                            borderBottomColor: expenseHeadName ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5'),
                                            borderBottomWidth: expenseHeadName ? 2 : 0.7,
                                            marginTop: -15,
                                            marginBottom: 5
                                        }}
                                    >
                                        <View
                                            style={{
                                                flex: 1
                                            }}
                                        >
                                            <TextField
                                                label="Expense Head"
                                                lineWidth={0}
                                                value={expenseHeadName}
                                                disabled={true}
                                                disabledLineType={'solid'}
                                                disabledLineWidth={0}
                                                containerStyle={{
                                                    marginBottom: -4,
                                                    paddingLeft: 5
                                                }}
                                                inputContainerStyle={{
                                                    // backgroundColor: 'red',
                                                    paddingBottom: 0,
                                                    // marginBottom: -6
                                                }}
                                                fontSize={TEXT_SIZE_16}
                                                contentInset={{
                                                    top: 10,
                                                    input: 0,
                                                    label: 2
                                                }}
                                                baseColor={expenseHeadName ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                                tintColor={expenseHeadName ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                            />
                                        </View>
                                        <Icon
                                            name='chevron-down-outline'
                                            type='ionicon'
                                            size={22}
                                            color={expenseHeadName ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                            containerStyle={{
                                                marginBottom: 5
                                            }}
                                        />
                                    </TouchableOpacity>
                            
                                </View>

                                <View
                                    style={{
                                        paddingHorizontal: APP_PADDING,
                                    }}
                                >
                                    
                                    <TextField
                                        label="Item"
                                        lineWidth={expenseItemFocus ? 2 : expenseItem ? 2 : 1}
                                        value={expenseItem}
                                        onChangeText={(text: string) => {
                                            setExpenseItem(text);
                                        }}
                                        onFocus={() => {
                                            setExpenseItemFocus(true);
                                        }} 
                                        onBlur={() => {
                                            setExpenseItemFocus(false);
                                        }}
                                        inputContainerStyle={{
                                            paddingBottom: 0,
                                            paddingLeft: 5
                                        }}
                                        titleTextStyle={{
                                            display: 'none'
                                        }}
                                        fontSize={TEXT_SIZE_16}
                                        contentInset={{
                                            top: 10,
                                            input: 0,
                                            label: 2
                                        }}
                                        baseColor={expenseItem ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                        tintColor={expenseItem ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
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
                                        flex: 1,
                                        flexGrow: 1
                                    }}
                                >
                                    
                                    <TextField
                                        label="Qty"
                                        lineWidth={qtyFocused ? 2 : qty ? 2 : 1}
                                        value={qty}
                                        keyboardType="phone-pad"
                                        onChangeText={(text: string) => {
                                            setQty(NumericPattern(text.slice(0, 12)));
                                        }}
                                        inputContainerStyle={{
                                            paddingBottom: 0,
                                            paddingLeft: 5
                                        }}
                                        onFocus={() => {
                                            setQtyFocused(true);
                                        }} 
                                        onBlur={() => {
                                            setQtyFocused(false);
                                        }}
                                        titleTextStyle={{
                                            display: 'none'
                                        }} 
                                        fontSize={TEXT_SIZE_16}
                                        contentInset={{
                                            top: 10,
                                            input: 0,
                                            label: 2
                                        }}
                                        baseColor={qty ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                        tintColor={qty ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                    />
                                </View>

                                <View
                                    style={{
                                        paddingHorizontal: APP_PADDING,
                                        flex: 1,
                                        flexGrow: 1
                                    }}
                                >
                                    
                                    <TextField
                                        label={`Unit Price (${currencySymbol})`}
                                        lineWidth={unitPriceFocused ? 2 : unitPrice ? 2 : 1}
                                        value={unitPrice}
                                        keyboardType="phone-pad"
                                        onChangeText={(text: string) => {
                                            var regex = /^\d{1,8}\.?\d{0,2}$/;
                                            var isValidated = regex.test(text);
                                            if(!text){
                                                setUnitPrice('');
                                            }
                                            if(isValidated){
                                                setUnitPrice(text);
                                            }
                                            // setUnitPrice(NumericPattern(text.slice(0, 12)));
                                        }}
                                        onFocus={() => {
                                            setUnitPriceFocused(true);
                                        }} 
                                        onBlur={() => {
                                            setUnitPriceFocused(false);
                                        }} 
                                        inputContainerStyle={{
                                            paddingBottom: 0,
                                            paddingLeft: 5
                                        }}
                                        fontSize={TEXT_SIZE_16}
                                        contentInset={{
                                            top: 10,
                                            input: 0,
                                            label: 2
                                        }}
                                        baseColor={unitPrice ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                        tintColor={unitPrice ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                    />
                                </View>

                            </View>

                            <View
                                style={{
                                    
                                }}
                            >
                                <View
                                    style={{
                                        paddingHorizontal: APP_PADDING
                                    }}
                                >
                                    
                                    <TextField
                                        label="Description"
                                        lineWidth={descriptionFocus ? 2 : description ? 2 : 1}
                                        value={description}
                                        onChangeText={(text: string) => {
                                            setDescription(text);
                                        }}
                                        onFocus={() => {
                                            setDescriptionFocus(true);
                                        }} 
                                        onBlur={() => {
                                            setDescriptionFocus(false);
                                        }}
                                        containerStyle={{
                                            marginBottom: -9,
                                        }}
                                        inputContainerStyle={{
                                            paddingBottom: 0,
                                            paddingLeft: 5,
                                        }}
                                        fontSize={TEXT_SIZE_16}
                                        contentInset={{
                                            top: 10,
                                            input: 0,
                                            label: 2
                                        }}
                                        baseColor={description ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                        tintColor={description ? colorLayout.subHeaderBgColor : hexToRgbA(colorLayout.subHeaderBgColor, '0.5')}
                                    />
                                </View>

                            </View>


                            <View
                                style={{
                                flexDirection: 'row',
                                justifyContent: 'center',
                                paddingTop: 2*APP_PADDING
                                }}
                            >
                                <TouchableOpacity
                                    style={{
                                    ...styles.modalActionBtn,
                                    backgroundColor: colorLayout.subHeaderBgColor,
                                    
                                    }}
                                    onPress={() => {
                                        validateVoucher();
                                    }}
                                >
                                    <Text style={{...styles.openButton, color: colorLayout.headerTextColor, textAlignVertical:'center'}}>{OkText}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                    ...styles.modalActionBtn,
                                    backgroundColor: colorLayout.subHeaderBgColor,
                                        
                                    }}
                                    onPress={() => {
                                        onClose();
                                        resetForm();
                                    }}
                                    activeOpacity={0.9}
                                >
                                    <Text 
                                        style={{
                                            ...styles.openButton, 
                                            color: colorLayout.headerTextColor,
                                            textAlignVertical:'center'
                                        }}
                                    >
                                        Close
                                    </Text>
                                </TouchableOpacity>

                            </View>

                        </View>
                    </Card.Content>
                </Card>

                <DropdownItem
                    title={'Expense Head'}
                    visible={showDrpDwn}
                    list={itemList}
                    itemKey={'expenseHeadID'}
                    itemValue={'expenseHeadName'}
                    onClose={() => {
                        setShowDrpDwn(false);
                    }}
                    onSelectItem={(selectedItem) => {
                        setShowDrpDwn(false);
                        var head = itemList.filter((v: object) => v['expenseHeadID'] == selectedItem);
                        setExpenseHeadID(selectedItem);
                        setSelectedItemId(selectedItem);
                        setExpenseHeadCode(head.length > 0 ? head[0]['expenseHeadCode'] : "");
                        setExpenseHeadName(head.length > 0 ? head[0]['expenseHeadName'] : "");
                    }}
                    selectedItemId={selectedItemId}
                />

                <Snackbar
                    visible={showSnack}
                    onDismiss={() => {
                        setShowSnack(false);
                    }}
                    style={{
                        backgroundColor: color.danger,
                        color: '#fff',
                        position: 'relative'
                    }}
                    duration={5000}
                    wrapperStyle={{
                        position: 'relative',
                    }}
                >
                    {snackMessage}
                </Snackbar>
            </Wrapper>
          
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
        // marginTop: SCREEN_HEIGHT * 0.3,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 0,
        height: BODY_CONTAINER_HEIGHT + (2 * APP_PADDING),
        justifyContent: 'center'
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
      marginHorizontal: 15
    }
});

export { AddItem };
