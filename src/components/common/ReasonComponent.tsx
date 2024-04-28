import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, Modal, View, Dimensions, TextInput, Image, ScrollView} from 'react-native';
import { moderateScale } from 'react-native-size-matters';

import { Icon, CheckBox } from 'react-native-elements';
import * as store from '../../store';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ReasonComponent = ({
    intialValue,
    visible,
    onClose,
    reasons = [],
    qCategoryID
}) => {

    const [reason_list, setReason] = useState(reasons);
    const [selected_reason, set_selected_reason] = useState([]);
    const [colorLayout, setColorLayout] = useState(store.default.getState().auth.colorLayout);

    const isReasonChecked = (r: any) => {
        var len = 0;
        if(selected_reason){
            len = reasons.filter((rs: any) => selected_reason.filter((f: any) =>  f.checked).map((m: any) => m.reasonID).includes(r.reasonID)).length;
        }
        return len > 0 ? true : false;
    }

    return (
        <Modal
            animationType='slide'
            transparent
            visible={visible}
            onRequestClose={() => {
                onClose(null);
            }}
            onShow={() => {
                // var list: any = [];
                // reasons.filter((r: any) => r.qCategoryId == qCategoryID).forEach((re: any) => {
                //     re.checked = intialValue.filter((f: any) =>  f.checked).map((m: any) => m.reasonID).includes(re.reasonID);
                //     list.push(re);
                // });
                // setReason(list);
                set_selected_reason(reasons.filter((f: any) =>  f.checked));
                // setColorLayout(store.default.getState().auth.colorLayout);
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
                Reason
            </Text>

                    <ScrollView
                        style={{
                            maxHeight: screenHeight * 0.45
                        }}
                        persistentScrollbar={true}
                    >
                        {
                            reason_list.map((r: any, ind: number) => {
                                return (
                                    <View
                                        key={ind}
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'flex-start',
                                            borderBottomColor: '#d3d3d3',
                                            borderBottomWidth: 1
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() => {
                                                var list: any = JSON.parse(JSON.stringify(reason_list));
                                                list[ind].checked = !list[ind].checked;
                                                set_selected_reason(list.filter((d: any) => d.checked));
                                                setReason(list);
                                            }}
                                            style={{
                                                flexDirection: 'row',
                                                justifyContent: 'flex-start',
                                            }}
                                            activeOpacity={1}
                                        >
                                            <CheckBox
                                                checked={r.checked}
                                                onPress={() => {
                                                    var list: any = JSON.parse(JSON.stringify(reason_list));
                                                    list[ind].checked = !list[ind].checked;
                                                    set_selected_reason(list.filter((d: any) => d.checked));
                                                    setReason(list);
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
                                                    color: '#000',
                                                }}
                                                
                                            >
                                                {r.reasonText}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
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
                                onClose(selected_reason);
                                // set_selected_reason([]);
                            }}
                        >
                            <Text style={{...styles.openButton, color: colorLayout.headerTextColor}}>Done</Text>
                        </TouchableOpacity>

                        {/* <TouchableOpacity
                            style={{
                                ...styles.modalActionBtn,
                                backgroundColor: colorLayout.subHeaderBgColor,
                            }}
                            onPress={() => {
                                onClose(null);
                            }}
                        >
                            <Text style={{...styles.openButton, color: colorLayout.headerTextColor}}>No</Text>
                        </TouchableOpacity> */}

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

export { ReasonComponent };
