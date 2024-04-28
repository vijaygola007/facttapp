import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, View, Dimensions, TextInput, Image, ScrollView} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import {
    TextField,
} from 'rn-material-ui-textfield';
import { Icon, CheckBox } from 'react-native-elements';
import * as store from '../../store';

import { hexToRgbA } from '../../utilities/constants';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const DropdownItem = ({
    visible,
    onClose,
    list = [],
    title = '',
    itemKey,
    itemValue,
    selectedItemId = null,
    onSelectItem
}) => {

    const [itemList, setItemList] = useState(list);
    const [selectedItem, setSelectedItem] = useState(selectedItemId);
    const [colorLayout, setColorLayout] = useState(store.default.getState().auth.colorLayout);
    const [searchText, setSearchText] = useState('');
    const [searchedItemExist, setSearchedItemExist] = useState(true);

    const clearSearch = () => {
        setSearchText('');
        searchList('');
    }

    const searchList = (text: string) => {
        setSearchText(text);
        var allItems = JSON.parse(JSON.stringify(list));
        allItems.forEach((item: object) => {
            item['show'] = item[itemValue].includes(text);
        });
        setItemList(allItems);
        setSearchedItemExist(allItems.filter(item => item['show']).length > 0 ? true : false);
    }

    useEffect(() => {
        list.forEach((item: object) => {
            item['show'] = true;
        });
        setSelectedItem(selectedItemId);
        setItemList(list);
    }, []);

    return (
        <Modal
            animationType='slide'
            transparent
            visible={visible}
            onRequestClose={() => {
                onClose(null);
            }}
            onShow={() => {
                list.forEach((item: object) => {
                    item['show'] = true;
                });
                setSelectedItem(selectedItemId);
                setItemList(list);
            }}
            style={{
                flex: 1,
            }}
        >

            <View 
                style={{
                    flex: 1,
                    backgroundColor: '#131313',
                    zIndex: 1,
                    position: 'absolute',
                    height: screenHeight,
                    width: screenWidth,
                    opacity: 0.6
                }}
            />

            <View style={{ ...styles.centeredView }}>
                <View style={styles.modalView}>

                    <Text
                        style={{
                            color: colorLayout.headerTextColor,
                            fontSize: 18,
                            backgroundColor: colorLayout.subHeaderBgColor,
                            paddingVertical: 10,
                            paddingLeft: 10,
                            borderRadius: 0,
                            marginBottom: 10,
                            marginLeft: -20,
                            marginTop: -20,
                            width: screenWidth * 0.9,
                            borderTopLeftRadius: 5,
                            borderTopRightRadius: 5
                        }}
                    >
                        {title}
                    </Text>

                    
                    <View
                        style={{
                            justifyContent: 'center',
                            marginRight: 15,
                            
                        }}
                    >
                        <TextField
                            label="search..."
                            lineWidth={2}
                            value={searchText}
                            onChangeText={(text: string) => {
                                searchList(text);
                            }}
                            baseColor={
                                colorLayout.subHeaderBgColor
                            }
                            tintColor={
                                colorLayout.subHeaderBgColor
                            }
                            style={{
                                height: 30,
                                padding: 0,
                                margin: 0,
                                width: 300
                            }} 
                            titleTextStyle={{
                                display: 'none'
                            }} 
                            inputContainerStyle={{
                                paddingRight: 50
                            }}  
                            fontSize={16}
                            contentInset={{
                                top: 0,
                                input: 2,
                                label: 8
                            }}
                        />
                        <TouchableOpacity
                            style={{
                                width: 45,
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                position: 'absolute',
                                alignSelf: 'flex-end'
                            }}
                            onPress={() => {
                                clearSearch();
                            }}
                            activeOpacity={1}
                        >
                            <Icon
                                name={searchText ? 'close' : 'search'}
                                type='font-awesome'
                                color={colorLayout.subHeaderBgColor}
                                size={22}
                                containerStyle={{
                                    
                                }}
                                onPress={() => {
                                    clearSearch();
                                }}
                            />
                        </TouchableOpacity> 
                        
                    </View>
                        

                    <ScrollView
                        style={{
                            maxHeight: screenHeight * 0.45
                        }}
                        persistentScrollbar={true}
                    >
                        {
                            itemList.map((r: any, ind: number) => {
                                if(ind < 50){
                                    return (
                                        <View
                                            key={ind}
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'flex-start',
                                                borderBottomColor: '#d3d3d3',
                                                borderBottomWidth: 1,
                                                display: r['show'] ? 'flex' : 'none'
                                            }}
                                        >
                                            <TouchableOpacity
                                                onPress={() => {
                                                    onSelectItem(r[itemKey] == selectedItem ? null : r[itemKey]);
                                                }}
                                                style={{
                                                    flexDirection: 'row',
                                                    justifyContent: 'flex-start',
                                                    flex: 1,
                                                }}
                                                activeOpacity={1}
                                            >
                                                <CheckBox
                                                    checked={selectedItem == r[itemKey] ? true : false}
                                                    onPress={() => {
                                                        onSelectItem(r[itemKey] == selectedItem ? null : r[itemKey]);
                                                    }}
                                                    uncheckedColor={'#000'}
                                                    checkedColor={colorLayout.subHeaderBgColor}
                                                    containerStyle={{
                                                        paddingBottom: 5,
                                                        paddingTop: 5,
                                                        marginLeft: -5,
                                                        marginRight: -5,
                                                    }}
                                                    
                                                />
                                                <Text
                                                    style={{
                                                        alignSelf: 'center',
                                                        color: colorLayout.subTextColor,
                                                        flex: 1
                                                    }}
                                                    // numberOfLines={1}
                                                    // ellipsizeMode={'clip'}
                                                >
                                                    {r[itemValue]}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    );  
                                }
                            })
                        }

                        {
                            !searchedItemExist &&
                            <Text
                                style={{
                                    textAlign: 'center',
                                    marginVertical: 20
                                }}
                            >
                                No Result...
                            </Text>
                        }

                        
                    </ScrollView>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            paddingTop: 20,
                            paddingRight: 10
                        }}
                    >


                        <TouchableOpacity
                            style={{
                                ...styles.modalActionBtn,
                                backgroundColor: colorLayout.subHeaderBgColor,
                            }}
                            onPress={() => {
                                onSelectItem(selectedItem);
                            }}
                        >
                            <Text style={{...styles.openButton, color: colorLayout.headerTextColor}}>Close</Text>
                        </TouchableOpacity>


                    </View>
                </View>
            </View>

        </Modal>
    );
}

const styles = StyleSheet.create({
    button: {
        borderRadius: moderateScale(2),
        alignItems: 'center',
        justifyContent: 'center'
    },
    cameraContainer: {
        flexDirection: 'column',
        flex: 0,
    },
    centeredView: {
        flex: 1,
        zIndex: 2, 
        position: 'absolute',
        width: screenWidth,
        paddingTop: screenHeight * 0.2
    },
    modalView: {
        backgroundColor: '#ffffff',
        width: screenWidth * 0.9,
        paddingVertical: 20,
        paddingLeft: 20,
        paddingRight: 5,
        alignSelf: 'center',
        borderRadius: 5
    },

    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#131313',
    },
    modalInspectionNo: {
        fontSize: 14,
        fontWeight: '400',
        color: '#131313',
        marginTop: 10,
        opacity: 0.8
    },
    modalActionBtn: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginHorizontal: 5
    },
    openButton: {
        fontWeight: '600',
        width: 100,
        textAlign: 'center'
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    preview: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        height: screenHeight * 0.45,
        overflow: 'hidden'
    },
    capture_btn: {
        backgroundColor: '#062656',
        borderRadius: 50,
        marginVertical: 15,
        height: 60,
        width: 60,
        alignSelf: 'center'
    },
    CommentContainer: {
        paddingHorizontal: 20,
        paddingTop: 20,
        flex: 1
    },
    comment_box: {
        backgroundColor: '#ffffff',
    },
    capture_box:{ 
        flexDirection: 'column', 
        justifyContent: 'center',
        position: 'absolute',
        marginTop: screenHeight * 0.34,
        alignSelf: 'center'
    },
    image: { 
        width: 75, 
        height: 75,
        borderRadius: 8
    },
    image2: { 
        width: 75, 
        height: 75,
        borderRadius: 8,
        borderColor: '#4DAD49',
        borderWidth: 2,
        overflow: 'hidden'
    },
    absolute: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        height: 400,
        width: 400,
        backgroundColor: '#ff0000'
    }
});

export { DropdownItem };
